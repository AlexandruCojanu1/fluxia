"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Stethoscope, Activity, Loader2, Lock } from "lucide-react"

export default function DoctorLogin() {
  const [doctorId, setDoctorId] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("Attempting login for doctor ID:", doctorId)

      // Pas 1: Găsește doctorul după ID
      const { data: doctor, error: doctorError } = await supabase
        .from("doctors")
        .select("*")
        .eq("doctor_id", doctorId.trim())
        .single()

      if (doctorError) {
        console.error("Doctor lookup error:", doctorError)
        throw new Error("ID-ul de doctor nu a fost găsit în baza de date")
      }

      if (!doctor) {
        throw new Error("ID-ul de doctor nu există")
      }

      console.log("Found doctor:", { id: doctor.id, email: doctor.email })

      // Pas 2: Autentificare
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: doctor.email,
        password: password,
      })

      if (signInError) {
        console.error("Sign in error:", signInError)
        throw new Error("Credențiale invalide")
      }

      if (!authData.user) {
        throw new Error("Eroare la autentificare")
      }

      // Pas 3: Actualizare user_id dacă e necesar
      if (doctor.user_id !== authData.user.id) {
        const { error: updateError } = await supabase
          .from("doctors")
          .update({ user_id: authData.user.id })
          .eq("id", doctor.id)

        if (updateError) {
          console.error("Error updating user_id:", updateError)
        }
      }

      toast.success("Autentificare reușită!")

      // Setăm un flag în localStorage pentru a indica autentificarea reușită
      localStorage.setItem("doctorLoginSuccess", "true")
      localStorage.setItem("doctorId", doctor.id)

      // Forțăm o redirecționare completă pentru a evita problemele de stare
      setTimeout(() => {
        window.location.href = "/doctor/dashboard"
      }, 500)
    } catch (error) {
      const message = error instanceof Error ? error.message : "A apărut o eroare neașteptată"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-medical-100 flex items-center justify-center">
              <Activity className="h-8 w-8 text-medical-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-medical-600 to-medical-800 bg-clip-text text-transparent">
            Fluxia
          </h1>
          <p className="text-gray-500 mt-2">Platformă medicală avansată</p>
        </div>

        <div className="medical-card rounded-2xl p-8 shadow-lg">
          <div className="flex items-center space-x-2 mb-6">
            <Stethoscope className="h-5 w-5 text-medical-600" />
            <h2 className="text-xl font-semibold text-medical-900">Autentificare Medic</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="doctorId" className="text-medical-800">
                ID Medic
              </Label>
              <div className="relative">
                <Input
                  id="doctorId"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  required
                  placeholder="Introduceți ID-ul (ex: DOC1234)"
                  disabled={loading}
                  className="pl-10 border-medical-200 focus:border-medical-400"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-medical-400">
                  <Stethoscope className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-medical-800">
                Parolă
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Introduceți parola"
                  disabled={loading}
                  className="pl-10 border-medical-200 focus:border-medical-400"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-medical-400">
                  <Lock className="h-4 w-4" />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-medical-500 to-medical-700 hover:from-medical-600 hover:to-medical-800"
              disabled={loading}
            >
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
    </div>
  )
}

