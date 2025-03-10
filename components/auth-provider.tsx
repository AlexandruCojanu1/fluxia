"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { toast } from "sonner"

type AuthContextType = {
  user: User | null
  loading: boolean
  isDoctor: boolean
  isPatient: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isDoctor: false,
  isPatient: false,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDoctor, setIsDoctor] = useState(false)
  const [isPatient, setIsPatient] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Verificăm sesiunea la pornire
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session initialization error:", sessionError)
          return
        }

        if (session?.user) {
          setUser(session.user)
          await checkUserRoles(session.user)
        } else {
          handleNoSession()
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
      } finally {
        setLoading(false)
      }
    }

    const checkUserRoles = async (currentUser: User) => {
      try {
        // Verificăm dacă este doctor
        const { data: doctor } = await supabase.from("doctors").select("*").eq("user_id", currentUser.id).single()

        setIsDoctor(!!doctor)

        // Verificăm dacă este pacient
        const { data: patient } = await supabase
          .from("patient_profiles")
          .select("*")
          .eq("user_id", currentUser.id)
          .single()

        setIsPatient(!!patient)

        // Salvăm ID-ul profilului de pacient în localStorage dacă există
        if (patient) {
          localStorage.setItem("patientProfileId", patient.id)
        }
      } catch (error) {
        console.error("Error checking user roles:", error)
      }
    }

    const handleNoSession = () => {
      setUser(null)
      setIsDoctor(false)
      setIsPatient(false)

      if (pathname?.startsWith("/doctor")) {
        window.location.href = "/login/doctor"
      } else if (pathname?.startsWith("/patient")) {
        window.location.href = "/login/patient/login"
      }
    }

    // Inițializăm autentificarea
    initializeAuth()

    // Setăm listener pentru schimbări de autentificare
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id)

      if (session?.user) {
        setUser(session.user)
        await checkUserRoles(session.user)

        // Gestionăm redirecționările după autentificare
        if (isDoctor && pathname === "/login/doctor") {
          router.push("/doctor/dashboard")
        } else if (isPatient && pathname === "/login/patient/login") {
          router.push("/patient/dashboard")
        }
      } else {
        handleNoSession()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, pathname])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      toast.success("V-ați deconectat cu succes")
      // Forțăm o redirecționare completă pentru a curăța starea
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("A apărut o eroare la deconectare")
      // În caz de eroare, încercăm o redirecționare directă
      window.location.href = "/"
    }
  }

  return <AuthContext.Provider value={{ user, loading, isDoctor, isPatient, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

