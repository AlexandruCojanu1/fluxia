"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { NotificationProvider } from "@/components/notification-provider"
import { PatientNav } from "@/components/patient-nav"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificăm dacă avem un flag de login reușit
        const loginSuccess = localStorage.getItem("patientLoginSuccess")
        if (loginSuccess === "true") {
          // Dacă avem flag-ul, înseamnă că tocmai ne-am autentificat
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
          console.log("No session found in patient layout, redirecting to login")
          window.location.href = "/login/patient/login"
          return
        }

        console.log("Session found in layout, user ID:", session.user.id)

        // Verificăm dacă utilizatorul există în auth.users
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(session.user.id)

        if (authError) {
          console.error("Error fetching auth user:", authError)
        } else {
          console.log("Auth user found:", authUser?.user?.email)
        }

        // Verificăm direct în tabela patient_profiles
        const { data: allProfiles, error: allProfilesError } = await supabase.from("patient_profiles").select("*")

        if (allProfilesError) {
          console.error("Error fetching all profiles:", allProfilesError)
        } else {
          console.log("Total profiles in database:", allProfiles?.length)

          // Verificăm dacă există vreun profil cu acest email
          if (authUser?.user?.email) {
            const profileByEmail = allProfiles?.find((p) => p.email === authUser.user.email)
            if (profileByEmail) {
              console.log("Found profile by email:", profileByEmail.id, profileByEmail.full_name)

              // Actualizăm user_id în profilul găsit dacă este null
              if (!profileByEmail.user_id) {
                console.log("Updating user_id in profile...")
                const { error: updateError } = await supabase
                  .from("patient_profiles")
                  .update({ user_id: session.user.id })
                  .eq("id", profileByEmail.id)

                if (updateError) {
                  console.error("Error updating profile:", updateError)
                } else {
                  console.log("Profile updated successfully")
                }
              }

              // Folosim profilul găsit
              localStorage.setItem("patientProfileId", profileByEmail.id)
              setIsAuthorized(true)
              setLoading(false)
              return
            }
          }
        }

        // Verificăm dacă utilizatorul este pacient
        const { data: profiles, error } = await supabase
          .from("patient_profiles")
          .select("id, email, full_name")
          .eq("user_id", session.user.id)

        if (error) {
          console.error("Error checking patient profile:", error)
          window.location.href = "/login/patient/login"
          return
        }

        console.log("Profiles found by user_id:", profiles?.length, profiles)

        if (!profiles || profiles.length === 0) {
          console.log("User is not a patient, checking by email")

          // Verificăm dacă există un profil cu același email ca utilizatorul
          if (session.user.email) {
            const { data: profilesByEmail, error: emailError } = await supabase
              .from("patient_profiles")
              .select("*")
              .eq("email", session.user.email)

            if (!emailError && profilesByEmail && profilesByEmail.length > 0) {
              console.log("Found profile by email:", profilesByEmail[0])

              // Actualizăm user_id în profilul găsit
              const { error: updateError } = await supabase
                .from("patient_profiles")
                .update({ user_id: session.user.id })
                .eq("id", profilesByEmail[0].id)

              if (updateError) {
                console.error("Error updating profile:", updateError)
                window.location.href = "/"
                return
              } else {
                console.log("Profile updated successfully")
                localStorage.setItem("patientProfileId", profilesByEmail[0].id)
                setIsAuthorized(true)
                setLoading(false)
                return
              }
            } else {
              console.log("No profile found by email either, redirecting")
              window.location.href = "/"
              return
            }
          } else {
            console.log("User has no email, redirecting")
            window.location.href = "/"
            return
          }
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error("Auth check error:", error)
        window.location.href = "/"
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

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

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50">
        <PatientNav />
        <main>{children}</main>
      </div>
    </NotificationProvider>
  )
}

