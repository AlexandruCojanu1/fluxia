"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ArrowLeft, Send, Calendar, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { format } from "date-fns"
import { ro } from "date-fns/locale"

type Category = {
  name: string
  questions: string[]
}

type Diagnostic = {
  id: string
  name: string
  categories: Category[]
  final_messages: string[]
  schedule_days: string[]
  notification_time: string
  doctor_name: string
}

type Response = {
  question: string
  response: string
  category: string
  date: string
}

export default function ChatPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null)
  const [patientId, setPatientId] = useState<string | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [currentResponses, setCurrentResponses] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState("today")
  const [finalMessage, setFinalMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchDiagnosticAndResponses()
  }, [params.id])

  const fetchDiagnosticAndResponses = async () => {
    try {
      setLoading(true)

      // Verificăm sesiunea
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        console.log("No session found in chat page, redirecting to login")
        window.location.href = "/login/patient/login"
        return
      }

      console.log("Session found in chat page:", session.user.id)

      // Încercăm să obținem ID-ul pacientului din localStorage
      let patientProfileId = localStorage.getItem("patientProfileId")

      // Dacă nu avem ID-ul în localStorage, îl obținem din baza de date
      if (!patientProfileId) {
        console.log("No patient profile ID in localStorage, searching in database...")
        const { data: profiles, error: profilesError } = await supabase
          .from("patient_profiles")
          .select("id")
          .eq("user_id", session.user.id)

        if (profilesError) {
          console.error("Profiles error:", profilesError)
          toast.error("Nu s-a putut încărca profilul pacientului")
          return
        }

        if (!profiles || profiles.length === 0) {
          console.log("No profiles found by user ID, trying email...")

          // Încercăm să găsim profilul după email
          if (session.user.email) {
            const { data: emailProfiles, error: emailError } = await supabase
              .from("patient_profiles")
              .select("id")
              .eq("email", session.user.email)

            if (emailError) {
              console.error("Email profiles error:", emailError)
              toast.error("Nu s-a putut încărca profilul pacientului")
              return
            }

            if (!emailProfiles || emailProfiles.length === 0) {
              console.error("No profile found for user")
              toast.error("Profilul pacientului nu a fost găsit")
              window.location.href = "/login/patient/login"
              return
            }

            patientProfileId = emailProfiles[0].id

            // Actualizăm user_id în profil
            const { error: updateError } = await supabase
              .from("patient_profiles")
              .update({ user_id: session.user.id })
              .eq("id", patientProfileId)

            if (updateError) {
              console.error("Error updating profile:", updateError)
            }
          } else {
            console.error("No profile found for user")
            toast.error("Profilul pacientului nu a fost găsit")
            window.location.href = "/login/patient/login"
            return
          }
        } else {
          patientProfileId = profiles[0].id
        }

        localStorage.setItem("patientProfileId", patientProfileId)
      }

      setPatientId(patientProfileId)
      console.log("Using patient profile ID:", patientProfileId)

      // Verificăm dacă există o asociere între pacient și diagnostic
      console.log("Checking patient-diagnostic association...")
      const { data: association, error: assocError } = await supabase
        .from("patient_diagnostics")
        .select("id")
        .eq("patient_id", patientProfileId)
        .eq("diagnostic_id", params.id)
        .maybeSingle()

      // Dacă nu există asociere, o creăm
      if (!assocError && !association) {
        console.log("No association found, creating one...")
        const { error: createError } = await supabase.from("patient_diagnostics").insert({
          patient_id: patientProfileId,
          diagnostic_id: params.id,
          status: "active",
        })

        if (createError) {
          console.error("Error creating association:", createError)
        } else {
          console.log("Association created successfully")
        }
      }

      // Get the diagnostic
      const { data: diagnosticData, error: diagnosticError } = await supabase
        .from("diagnostics")
        .select(`
        id, 
        name, 
        categories, 
        final_messages, 
        schedule_days, 
        notification_time,
        doctor_id
      `)
        .eq("id", params.id)
        .single()

      if (diagnosticError || !diagnosticData) {
        throw new Error("Diagnosticul nu a fost găsit")
      }

      // Get doctor name
      const { data: doctorData } = await supabase
        .from("doctors")
        .select("full_name")
        .eq("user_id", diagnosticData.doctor_id)
        .single()

      // Get previous responses
      const { data: responseData, error: responseError } = await supabase
        .from("patient_responses")
        .select("category_name, question_text, response, response_date")
        .eq("patient_id", patientProfileId)
        .eq("diagnostic_id", params.id)
        .order("created_at", { ascending: false })

      if (responseError) {
        throw responseError
      }

      // Format the responses
      const formattedResponses = responseData
        ? responseData.map((r) => ({
            category: r.category_name,
            question: r.question_text,
            response: r.response,
            date: r.response_date,
          }))
        : []

      setDiagnostic({
        ...diagnosticData,
        doctor_name: doctorData?.full_name || "Medic necunoscut",
      })

      setResponses(formattedResponses)

      // Check if all questions for today are answered
      const today = new Date().toISOString().split("T")[0]
      const todayResponses = formattedResponses.filter((r) => r.date === today)

      if (todayResponses.length > 0) {
        const allQuestionsAnswered = diagnosticData.categories.every((category) =>
          category.questions.every((question) =>
            todayResponses.some((r) => r.category === category.name && r.question === question),
          ),
        )

        if (allQuestionsAnswered && diagnosticData.final_messages.length > 0) {
          // Select a random final message
          const randomIndex = Math.floor(Math.random() * diagnosticData.final_messages.length)
          setFinalMessage(diagnosticData.final_messages[randomIndex])
        }
      }
    } catch (error) {
      console.error("Error fetching diagnostic:", error)
      toast.error("Nu s-a putut încărca diagnosticul")
      router.push("/patient/chats")
    } finally {
      setLoading(false)
    }
  }

  const handleResponseChange = (category: string, question: string, value: string) => {
    setCurrentResponses({
      ...currentResponses,
      [`${category}:${question}`]: value,
    })
  }

  const submitResponses = async () => {
    try {
      setSubmitting(true)

      if (!patientId || !diagnostic) return

      const today = new Date().toISOString().split("T")[0]
      const responsesToSubmit = []

      // Validate all questions are answered
      for (const category of diagnostic.categories) {
        for (const question of category.questions) {
          const key = `${category.name}:${question}`
          const response = currentResponses[key]

          if (!response || response.trim() === "") {
            toast.error(`Vă rugăm să răspundeți la toate întrebările din categoria ${category.name}`)
            return
          }

          responsesToSubmit.push({
            patient_id: patientId,
            diagnostic_id: diagnostic.id,
            category_name: category.name,
            question_text: question,
            response: response.trim(),
            response_date: today,
          })
        }
      }

      // Submit all responses
      const { error } = await supabase.from("patient_responses").insert(responsesToSubmit)

      if (error) throw error

      // Select a random final message
      if (diagnostic.final_messages.length > 0) {
        const randomIndex = Math.floor(Math.random() * diagnostic.final_messages.length)
        setFinalMessage(diagnostic.final_messages[randomIndex])
      }

      // Update notification status
      await supabase.from("notification_status").upsert({
        patient_id: patientId,
        diagnostic_id: diagnostic.id,
        notification_date: today,
        notification_read: true,
      })

      toast.success("Răspunsurile au fost trimise cu succes!")

      // Refresh the responses
      fetchDiagnosticAndResponses()
    } catch (error) {
      console.error("Error submitting responses:", error)
      toast.error("Nu s-au putut trimite răspunsurile")
    } finally {
      setSubmitting(false)
    }
  }

  const getTodayQuestions = () => {
    if (!diagnostic) return []

    const today = new Date().toISOString().split("T")[0]
    const todayResponses = responses.filter((r) => r.date === today)

    // Check if all questions are already answered
    const allAnswered = diagnostic.categories.every((category) =>
      category.questions.every((question) =>
        todayResponses.some((r) => r.category === category.name && r.question === question),
      ),
    )

    if (allAnswered) {
      return []
    }

    // Get day of week - using proper format options and converting to lowercase
    const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()

    // Check if questions are  { weekday: "long" }).toLowerCase()

    // Check if questions are scheduled for today
    if (!diagnostic.schedule_days.includes(dayOfWeek)) {
      return []
    }

    return diagnostic.categories
  }

  const getHistoryByDate = () => {
    if (responses.length === 0) return {}

    const historyByDate: Record<string, Response[]> = {}

    responses.forEach((response) => {
      if (!historyByDate[response.date]) {
        historyByDate[response.date] = []
      }
      historyByDate[response.date].push(response)
    })

    return historyByDate
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!diagnostic) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">Diagnosticul nu a fost găsit</h3>
          <Button onClick={() => router.push("/patient/chats")}>Înapoi la conversații</Button>
        </div>
      </div>
    )
  }

  const todayQuestions = getTodayQuestions()
  const historyByDate = getHistoryByDate()
  const historyDates = Object.keys(historyByDate).sort().reverse()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push("/patient/chats")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{diagnostic.name}</h1>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Informații diagnostic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  Zile programate:{" "}
                  {diagnostic.schedule_days.map((day) => day.charAt(0).toUpperCase() + day.slice(1)).join(", ")}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Ora notificărilor: {diagnostic.notification_time}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today">Întrebările de azi</TabsTrigger>
          <TabsTrigger value="history">Istoric răspunsuri</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {finalMessage ? (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <p className="text-center">{finalMessage}</p>
              </CardContent>
            </Card>
          ) : todayQuestions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p>Nu aveți întrebări programate pentru astăzi.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Întrebările sunt programate pentru zilele:{" "}
                  {diagnostic.schedule_days.map((day) => day.charAt(0).toUpperCase() + day.slice(1)).join(", ")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {todayQuestions.map((category, categoryIndex) => (
                <Card key={categoryIndex} className="overflow-hidden">
                  <CardHeader className="bg-muted/50 pb-3">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {category.questions.map((question, questionIndex) => (
                      <div key={questionIndex} className="space-y-2">
                        <p className="font-medium">{question}</p>
                        <Textarea
                          placeholder="Introduceți răspunsul dvs. aici..."
                          value={currentResponses[`${category.name}:${question}`] || ""}
                          onChange={(e) => handleResponseChange(category.name, question, e.target.value)}
                          rows={3}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}

              <Button className="w-full" size="lg" onClick={submitResponses} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Se trimite...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Trimite răspunsurile
                  </>
                )}
              </Button>
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {historyDates.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p>Nu aveți răspunsuri anterioare.</p>
              </CardContent>
            </Card>
          ) : (
            historyDates.map((date) => (
              <Card key={date} className="overflow-hidden">
                <CardHeader className="bg-muted/50 pb-3">
                  <CardTitle className="text-lg">{format(new Date(date), "d MMMM yyyy", { locale: ro })}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {historyByDate[date].map((response, index) => (
                    <div key={index} className="space-y-2 pb-4 border-b last:border-0">
                      <div className="flex justify-between">
                        <p className="font-medium">{response.question}</p>
                        <span className="text-sm text-muted-foreground">{response.category}</span>
                      </div>
                      <p className="bg-muted/30 p-3 rounded-md">{response.response}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

