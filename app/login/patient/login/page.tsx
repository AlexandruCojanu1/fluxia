"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function PatientLoginPage() {
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const cleanFullName = fullName.trim()
      console.log("Attempting login for patient:", cleanFullName)

      // 1. Găsim profilul pacientului după nume
      const { data: patientProfile, error: profileError } = await supabase
        .from("patient_profiles")
        .select("*")
        .eq("full_name", cleanFullName)
        .single()

      if (profileError || !patientProfile) {
        console.error("Profile error:", profileError)
        throw new Error("Numele introdus nu a fost găsit. Verificați și încercați din nou.")
      }

      console.log("Found patient profile:", patientProfile)

      // 2. Verificăm dacă pacientul are email (necesar pentru autentificare)
      if (!patientProfile.email) {
        throw new Error("Profilul pacientului nu are email asociat. Contactați administratorul.")
      }

      // 3. Încercăm autentificarea directă cu numele ca parolă
      const { data, error } = await supabase.auth.signInWithPassword({
        email: patientProfile.email,
        password: cleanFullName,
      })

      if (error) {
        console.error("Sign in error:", error)

        // Încercăm să creăm un cont nou dacă autentificarea eșuează
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: patientProfile.email,
          password: cleanFullName,
          options: {
            data: {
              full_name: cleanFullName,
            },
          },
        })

        if (signUpError) {
          console.error("Sign up error:", signUpError)

          // Dacă contul există deja, încercăm să resetăm parola
          if (signUpError.message.includes("already registered")) {
            console.log("User exists, attempting to reset password")

            // Folosim OTP pentru autentificare ca ultimă soluție
            const { error: otpError } = await supabase.auth.signInWithOtp({
              email: patientProfile.email,
            })

            if (otpError) {
              throw new Error("Autentificare eșuată. Contactați administratorul.")
            }

            toast.success("Am trimis un link de autentificare pe email. Verificați email-ul pentru a continua.")
            setLoading(false)
            return
          } else {
            throw new Error("Nu s-a putut crea contul. Contactați administratorul.")
          }
        }

        // Actualizăm profilul pacientului cu noul user_id
        if (signUpData?.user) {
          const { error: updateError } = await supabase
            .from("patient_profiles")
            .update({ user_id: signUpData.user.id })
            .eq("id", patientProfile.id)

          if (updateError) {
            console.error("Error updating profile with user_id:", updateError)
          } else {
            console.log("Profile updated with user_id:", signUpData.user.id)
          }
        }
      } else if (data?.user) {
        // Actualizăm profilul pacientului cu user_id dacă nu este deja setat
        if (!patientProfile.user_id || patientProfile.user_id !== data.user.id) {
          console.log("Updating profile with user_id:", data.user.id)
          const { error: updateError } = await supabase
            .from("patient_profiles")
            .update({ user_id: data.user.id })
            .eq("id", patientProfile.id)

          if (updateError) {
            console.error("Error updating profile with user_id:", updateError)
          } else {
            console.log("Profile updated with user_id:", data.user.id)
          }
        }
      }

      // 4. Salvăm informații în localStorage pentru a forța redirecționarea
      localStorage.setItem("patientLoginSuccess", "true")
      localStorage.setItem("patientName", cleanFullName)
      localStorage.setItem("patientProfileId", patientProfile.id)

      // 5. Redirecționăm direct către dashboard
      toast.success("Autentificare reușită!")
      console.log("Authentication successful, redirecting...")

      // Forțăm o redirecționare completă cu un mic delay pentru a permite toast-ului să fie afișat
      setTimeout(() => {
        window.location.href = "/patient/dashboard"
      }, 500)
    } catch (error) {
      console.error("Login error:", error)
      toast.error(error instanceof Error ? error.message : "A apărut o eroare")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Autentificare Pacient</h1>
          <p className="text-gray-500">Introduceți numele pentru a continua</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nume și prenume</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ion Popescu"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se procesează...
              </>
            ) : (
              "Autentificare"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

