"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export function ProtectedRoute({
  children,
  requireDoctor = false,
  requirePatient = false,
}: {
  children: React.ReactNode
  requireDoctor?: boolean
  requirePatient?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificăm dacă avem flag-uri de autentificare reușită în localStorage
        if (requireDoctor && localStorage.getItem("doctorLoginSuccess") === "true") {
          localStorage.removeItem("doctorLoginSuccess")
          setIsAuthorized(true)
          setLoading(false)
          return
        }

        if (requirePatient && localStorage.getItem("patientLoginSuccess") === "true") {
          localStorage.removeItem("patientLoginSuccess")
          setIsAuthorized(true)
          setLoading(false)
          return
        }

        // Verificăm sesiunea
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          console.log("No session found, redirecting to login")
          if (requireDoctor) {
            router.push("/login/doctor")
          } else if (requirePatient) {
            router.push("/login/patient/login")
          } else {
            router.push("/")
          }
          return
        }

        // Verificăm rolurile
        if (requireDoctor) {
          const { data: doctor } = await supabase.from("doctors").select("*").eq("user_id", session.user.id).single()

          if (!doctor) {
            console.log("User is not a doctor, redirecting")
            router.push("/")
            return
          }
        }

        if (requirePatient) {
          const { data: patient } = await supabase
            .from("patient_profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .single()

          if (!patient) {
            console.log("User is not a patient, redirecting")
            router.push("/")
            return
          }
        }

        // Utilizatorul este autorizat
        setIsAuthorized(true)
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, requireDoctor, requirePatient])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-medical-600" />
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}

