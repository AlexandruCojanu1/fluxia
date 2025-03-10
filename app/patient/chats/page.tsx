"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, MessageSquare, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { ro } from "date-fns/locale"

type DiagnosticChat = {
  id: string
  name: string
  chat_id: string
  created_at: string
  doctor_name: string
  has_pending_questions: boolean
  last_response_date: string | null
}

export default function PatientChatsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [chats, setChats] = useState<DiagnosticChat[]>([])

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Verificăm dacă avem o sesiune validă
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          throw new Error("Eroare la verificarea sesiunii")
        }

        if (!session) {
          console.log("No session found, redirecting to login")
          window.location.href = "/login/patient/login"
          return
        }

        // Continuăm cu încărcarea chat-urilor
        await fetchChats()
      } catch (error) {
        console.error("Auth initialization error:", error)
        toast.error("Eroare la inițializarea sesiunii")
        window.location.href = "/login/patient/login"
      }
    }

    initializeAuth()
  }, [])

  const fetchChats = async () => {
    try {
      setLoading(true)
      console.log("Starting to fetch chats...")

      // Obținem sesiunea curentă
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) {
        throw new Error("No authenticated user")
      }

      console.log("Session found:", session.user.id)

      // Încercăm să obținem profilul pacientului din localStorage
      let patientProfileId = localStorage.getItem("patientProfileId")

      // Dacă nu avem ID-ul în localStorage, îl căutăm în baza de date
      if (!patientProfileId) {
        console.log("No patient profile ID in localStorage, searching in database...")
        const { data: profiles, error: profileError } = await supabase
          .from("patient_profiles")
          .select("id")
          .eq("user_id", session.user.id)

        if (profileError) {
          console.error("Profile error:", profileError)
          throw new Error("Nu s-a găsit profilul pacientului")
        }

        if (!profiles || profiles.length === 0) {
          console.log("No profiles found for user ID:", session.user.id)

          // Încercăm să găsim profilul după email
          if (session.user.email) {
            console.log("Searching profile by email:", session.user.email)
            const { data: emailProfiles, error: emailError } = await supabase
              .from("patient_profiles")
              .select("id")
              .eq("email", session.user.email)

            if (emailError) {
              console.error("Email profile error:", emailError)
              throw new Error("Nu s-a găsit profilul pacientului")
            }

            if (emailProfiles && emailProfiles.length > 0) {
              patientProfileId = emailProfiles[0].id
              localStorage.setItem("patientProfileId", patientProfileId)
              console.log("Found profile by email:", patientProfileId)

              // Actualizăm user_id în profil
              const { error: updateError } = await supabase
                .from("patient_profiles")
                .update({ user_id: session.user.id })
                .eq("id", patientProfileId)

              if (updateError) {
                console.error("Error updating profile:", updateError)
              }
            } else {
              console.log("No profiles found by email either")
              throw new Error("Nu s-a găsit profilul pacientului")
            }
          } else {
            throw new Error("Nu s-a găsit profilul pacientului")
          }
        } else {
          patientProfileId = profiles[0].id
          localStorage.setItem("patientProfileId", patientProfileId)
          console.log("Found profile by user ID:", patientProfileId)
        }
      } else {
        console.log("Using patient profile ID from localStorage:", patientProfileId)
      }

      // Verificăm dacă există diagnostice asociate direct cu chat_id
      console.log("Checking for diagnostics by chat_id...")
      const { data: directDiagnostics, error: directError } = await supabase
        .from("diagnostics")
        .select("id, name, chat_id, created_at, doctor_id")
        .eq("chat_id", patientProfileId)

      if (!directError && directDiagnostics && directDiagnostics.length > 0) {
        console.log("Found diagnostics by chat_id:", directDiagnostics.length)

        // Creăm asocierea în patient_diagnostics dacă nu există deja
        for (const diag of directDiagnostics) {
          const { data: existingAssoc, error: checkError } = await supabase
            .from("patient_diagnostics")
            .select("id")
            .eq("patient_id", patientProfileId)
            .eq("diagnostic_id", diag.id)
            .maybeSingle()

          if (!checkError && !existingAssoc) {
            console.log("Creating missing association for diagnostic:", diag.id)
            await supabase.from("patient_diagnostics").insert({
              patient_id: patientProfileId,
              diagnostic_id: diag.id,
              status: "active",
            })
          }
        }
      }

      // Obținem toate diagnosticele asignate acestui pacient
      console.log("Fetching patient diagnostics for patient ID:", patientProfileId)
      const { data: patientDiagnostics, error: diagnosticsError } = await supabase
        .from("patient_diagnostics")
        .select(`
          diagnostic_id,
          diagnostics (
            id,
            name,
            chat_id,
            created_at,
            doctor_id
          )
        `)
        .eq("patient_id", patientProfileId)

      if (diagnosticsError) {
        console.error("Diagnostics error:", diagnosticsError)
        throw diagnosticsError
      }

      console.log("Patient diagnostics found:", patientDiagnostics?.length || 0)

      if (!patientDiagnostics || patientDiagnostics.length === 0) {
        // Verificăm dacă există vreun diagnostic cu chat_id-ul care să conțină ID-ul pacientului
        console.log("No patient diagnostics found, checking by chat_id containing patient ID...")
        const { data: chatIdDiagnostics, error: chatIdError } = await supabase
          .from("diagnostics")
          .select("id, name, chat_id, created_at, doctor_id")
          .ilike("chat_id", `%${patientProfileId}%`)

        if (!chatIdError && chatIdDiagnostics && chatIdDiagnostics.length > 0) {
          console.log("Found diagnostics by chat_id pattern:", chatIdDiagnostics.length)

          // Creăm asocierile în patient_diagnostics
          for (const diag of chatIdDiagnostics) {
            console.log("Creating association for diagnostic:", diag.id)
            await supabase.from("patient_diagnostics").insert({
              patient_id: patientProfileId,
              diagnostic_id: diag.id,
              status: "active",
            })
          }

          // Reîncercăm să obținem diagnosticele
          const { data: refreshedDiagnostics, error: refreshError } = await supabase
            .from("patient_diagnostics")
            .select(`
              diagnostic_id,
              diagnostics (
                id,
                name,
                chat_id,
                created_at,
                doctor_id
              )
            `)
            .eq("patient_id", patientProfileId)

          if (!refreshError && refreshedDiagnostics && refreshedDiagnostics.length > 0) {
            console.log("Successfully refreshed diagnostics:", refreshedDiagnostics.length)
            patientDiagnostics = refreshedDiagnostics
          }
        }

        if (!patientDiagnostics || patientDiagnostics.length === 0) {
          setChats([])
          setLoading(false)
          return
        }
      }

      // Procesăm fiecare diagnostic pentru a obține informațiile complete
      const formattedChats = await Promise.all(
        patientDiagnostics.map(async (item) => {
          if (!item.diagnostics) return null

          // Obținem informațiile despre medic
          const { data: doctorData } = await supabase
            .from("doctors")
            .select("full_name")
            .eq("user_id", item.diagnostics.doctor_id)
            .single()

          // Verificăm dacă sunt întrebări pentru astăzi
          const today = new Date().toISOString().split("T")[0]
          const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()

          const { data: diagnostic } = await supabase
            .from("diagnostics")
            .select("schedule_days, categories")
            .eq("id", item.diagnostic_id)
            .single()

          const { data: responses } = await supabase
            .from("patient_responses")
            .select("created_at")
            .eq("patient_id", patientProfileId)
            .eq("diagnostic_id", item.diagnostic_id)
            .eq("response_date", today)

          const { data: lastResponse } = await supabase
            .from("patient_responses")
            .select("created_at")
            .eq("patient_id", patientProfileId)
            .eq("diagnostic_id", item.diagnostic_id)
            .order("created_at", { ascending: false })
            .limit(1)

          // Calculăm dacă sunt întrebări în așteptare
          let totalQuestions = 0
          if (diagnostic?.categories) {
            diagnostic.categories.forEach((category: any) => {
              if (category.questions) {
                totalQuestions += category.questions.length
              }
            })
          }

          const hasPendingQuestions =
            diagnostic?.schedule_days.includes(dayOfWeek) && (!responses || responses.length < totalQuestions)

          return {
            id: item.diagnostics.id,
            name: item.diagnostics.name,
            chat_id: item.diagnostics.chat_id,
            created_at: item.diagnostics.created_at,
            doctor_name: doctorData?.full_name || "Medic necunoscut",
            has_pending_questions: hasPendingQuestions,
            last_response_date: lastResponse?.[0]?.created_at || null,
          }
        }),
      )

      // Filtrăm rezultatele null și actualizăm starea
      const validChats = formattedChats.filter((chat): chat is DiagnosticChat => chat !== null)
      console.log("Valid chats found:", validChats.length)
      setChats(validChats)
    } catch (error) {
      console.error("Error fetching chats:", error)
      toast.error("Nu s-au putut încărca conversațiile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Conversațiile mele</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : chats.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Nu aveți conversații active</h3>
          <p className="text-muted-foreground">Când medicul vă va asigna un diagnostic, acesta va apărea aici.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {chats.map((chat) => (
            <Card key={chat.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{chat.name}</CardTitle>
                  {chat.has_pending_questions && (
                    <Badge variant="destructive" className="ml-2">
                      Întrebări noi
                    </Badge>
                  )}
                </div>
                <CardDescription>Dr. {chat.doctor_name}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  {chat.last_response_date ? (
                    <span>
                      Ultima răspuns:{" "}
                      {formatDistanceToNow(new Date(chat.last_response_date), {
                        addSuffix: true,
                        locale: ro,
                      })}
                    </span>
                  ) : (
                    <span>Niciun răspuns încă</span>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => router.push(`/patient/chats/${chat.id}`)}
                  variant={chat.has_pending_questions ? "default" : "outline"}
                >
                  {chat.has_pending_questions ? "Răspunde acum" : "Vezi conversația"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

