"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Loader2, MessageSquare, Calendar, Bell, Activity, HeartPulse, ArrowRight } from "lucide-react"
import { toast } from "sonner"

type PendingDiagnostic = {
  id: string
  name: string
}

export default function PatientDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pendingDiagnostics, setPendingDiagnostics] = useState<PendingDiagnostic[]>([])
  const [patientName, setPatientName] = useState("")

  useEffect(() => {
    // Verificăm dacă avem un nume de pacient în localStorage (de la login)
    const savedName = localStorage.getItem("patientName")
    if (savedName) {
      setPatientName(savedName)
      localStorage.removeItem("patientName") // Curățăm după utilizare
    }

    fetchPatientData()
  }, [])

  const fetchPatientData = async () => {
    try {
      setLoading(true)

      // Verificăm sesiunea
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Session error:", sessionError)
        toast.error("Eroare la verificarea sesiunii")
        router.push("/login/patient/login")
        return
      }

      if (!session) {
        console.log("No session found in dashboard, redirecting to login")
        router.push("/login/patient/login")
        return
      }

      console.log("Session found in dashboard, user ID:", session.user.id)

      // Obținem profilul pacientului
      let patientProfileId = localStorage.getItem("patientProfileId")
      let patientProfile = null

      // Dacă nu avem ID-ul în localStorage, îl căutăm în baza de date
      if (!patientProfileId) {
        // Verificăm dacă există un profil cu acest user_id
        const { data: profiles, error: profilesError } = await supabase
          .from("patient_profiles")
          .select("*")
          .eq("user_id", session.user.id)

        if (profilesError) {
          console.error("Profiles error:", profilesError)
        } else if (profiles && profiles.length > 0) {
          patientProfile = profiles[0]
          patientProfileId = patientProfile.id
          localStorage.setItem("patientProfileId", patientProfileId)
          setPatientName(patientProfile.full_name)
        } else if (session.user.email) {
          // Verificăm dacă există un profil cu același email
          const { data: profilesByEmail, error: emailError } = await supabase
            .from("patient_profiles")
            .select("*")
            .eq("email", session.user.email)

          if (emailError) {
            console.error("Email profiles error:", emailError)
          } else if (profilesByEmail && profilesByEmail.length > 0) {
            patientProfile = profilesByEmail[0]
            patientProfileId = patientProfile.id

            // Actualizăm user_id în profil
            if (!patientProfile.user_id) {
              const { error: updateError } = await supabase
                .from("patient_profiles")
                .update({ user_id: session.user.id })
                .eq("id", patientProfileId)

              if (updateError) {
                console.error("Error updating profile:", updateError)
              }
            }

            localStorage.setItem("patientProfileId", patientProfileId)
            setPatientName(patientProfile.full_name)
          }
        }
      } else {
        // Obținem detaliile profilului folosind ID-ul din localStorage
        const { data: profile, error: profileError } = await supabase
          .from("patient_profiles")
          .select("*")
          .eq("id", patientProfileId)
          .single()

        if (!profileError && profile) {
          patientProfile = profile
          setPatientName(profile.full_name)
        }
      }

      // Verificăm dacă am găsit un profil valid
      if (!patientProfileId) {
        console.error("No patient profile found")
        toast.error("Profilul pacientului nu a fost găsit")
        router.push("/login/patient/login")
        return
      }

      // Implementăm direct logica de verificare a notificărilor
      // Get the current day of week
      const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
      const today = new Date().toISOString().split("T")[0]

      // Get all diagnostics assigned to this patient
      const { data: patientDiagnostics, error: diagnosticsError } = await supabase
        .from("patient_diagnostics")
        .select(`
          diagnostic_id,
          diagnostics (
            id,
            name,
            schedule_days
          )
        `)
        .eq("patient_id", patientProfileId)

      if (diagnosticsError) {
        console.error("Diagnostics error:", diagnosticsError)
        setPendingDiagnostics([])
      } else if (!patientDiagnostics || patientDiagnostics.length === 0) {
        setPendingDiagnostics([])
      } else {
        // Check if there are diagnostics scheduled for today
        const diagnosticsForToday = patientDiagnostics.filter(
          (pd) => pd.diagnostics && pd.diagnostics.schedule_days && pd.diagnostics.schedule_days.includes(dayOfWeek),
        )

        if (diagnosticsForToday.length === 0) {
          setPendingDiagnostics([])
        } else {
          // Check if the patient has already answered all questions for today
          const pendingDiags = []

          for (const pd of diagnosticsForToday) {
            if (!pd.diagnostics) continue

            // Get all categories and questions for this diagnostic
            const { data: diagnostic } = await supabase
              .from("diagnostics")
              .select("categories")
              .eq("id", pd.diagnostic_id)
              .single()

            if (!diagnostic) continue

            // Get all responses for today
            const { data: responses } = await supabase
              .from("patient_responses")
              .select("category_name, question_text")
              .eq("patient_id", patientProfileId)
              .eq("diagnostic_id", pd.diagnostic_id)
              .eq("response_date", today)

            // Count total questions
            let totalQuestions = 0
            if (diagnostic.categories && Array.isArray(diagnostic.categories)) {
              diagnostic.categories.forEach((category: any) => {
                if (category.questions && Array.isArray(category.questions)) {
                  totalQuestions += category.questions.length
                }
              })
            }

            // If not all questions are answered, add to pending diagnostics
            if (!responses || responses.length < totalQuestions) {
              pendingDiags.push({
                id: pd.diagnostic_id,
                name: pd.diagnostics.name,
              })
            }
          }

          setPendingDiagnostics(pendingDiags)
        }
      }
    } catch (error) {
      console.error("Error fetching patient data:", error)
      toast.error("A apărut o eroare la încărcarea datelor")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-medical-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 bg-gradient-to-r from-medical-50 to-white rounded-2xl p-6 border border-medical-100">
        <div className="flex items-center space-x-3 mb-2">
          <HeartPulse className="h-5 w-5 text-medical-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-medical-700 to-medical-900 bg-clip-text text-transparent">
            Bine ați venit, {patientName}
          </h1>
        </div>
        <p className="text-medical-700 ml-8">Platforma de monitorizare a stării de sănătate</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="medical-card rounded-xl overflow-hidden">
          <CardHeader className="pb-2 border-b border-medical-100">
            <CardTitle className="flex items-center text-medical-800">
              <Bell className="h-5 w-5 mr-2 text-medical-600" />
              Întrebări de astăzi
            </CardTitle>
            <CardDescription>Întrebările care necesită răspunsul dumneavoastră</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {pendingDiagnostics.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-medical-50 mb-3">
                  <Activity className="h-6 w-6 text-medical-400" />
                </div>
                <p>Nu aveți întrebări noi pentru astăzi</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingDiagnostics.map((diagnostic) => (
                  <div
                    key={diagnostic.id}
                    className="flex items-center justify-between p-4 border border-medical-100 rounded-lg bg-white hover:shadow-md transition-shadow"
                  >
                    <div>
                      <h3 className="font-medium text-medical-900">{diagnostic.name}</h3>
                      <p className="text-sm text-muted-foreground">Întrebări noi disponibile</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/patient/chats/${diagnostic.id}`)}
                      className="bg-gradient-to-r from-medical-500 to-medical-600 hover:from-medical-600 hover:to-medical-700"
                    >
                      Răspunde
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t border-medical-100 pt-4">
            <Button
              variant="outline"
              className="w-full border-medical-200 text-medical-700 hover:bg-medical-50"
              onClick={() => router.push("/patient/chats")}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Vezi toate conversațiile
            </Button>
          </CardFooter>
        </Card>

        <Card className="medical-card rounded-xl overflow-hidden">
          <CardHeader className="pb-2 border-b border-medical-100">
            <CardTitle className="flex items-center text-medical-800">
              <Calendar className="h-5 w-5 mr-2 text-medical-600" />
              Programul de astăzi
            </CardTitle>
            <CardDescription>Activitățile programate pentru astăzi</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-6 text-muted-foreground">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-medical-50 mb-3">
                <Calendar className="h-6 w-6 text-medical-400" />
              </div>
              <p>Nu aveți activități programate pentru astăzi</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-medical-900 to-medical-800 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
            <Activity className="h-5 w-5 text-medical-100" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Monitorizare continuă</h2>
            <p className="text-medical-100 text-sm">
              Răspundeți la întrebări pentru a ajuta medicul să vă monitorizeze starea
            </p>
          </div>
        </div>
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-medical-300 to-medical-400 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}

