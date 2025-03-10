"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type NotificationContextType = {
  hasNotifications: boolean
  checkNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType>({
  hasNotifications: false,
  checkNotifications: async () => {},
})

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [hasNotifications, setHasNotifications] = useState(false)
  const router = useRouter()

  const checkNotifications = async () => {
    try {
      // Verificăm sesiunea
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.log("No valid session for notifications")
        setHasNotifications(false)
        return
      }

      // Obținem ID-ul profilului din localStorage
      const patientProfileId = localStorage.getItem("patientProfileId")
      if (!patientProfileId) {
        console.log("No patient profile ID found in localStorage")

        // Încercăm să obținem profilul din baza de date
        const { data: profiles, error: profilesError } = await supabase
          .from("patient_profiles")
          .select("id")
          .eq("user_id", session.user.id)

        if (profilesError || !profiles || profiles.length === 0) {
          setHasNotifications(false)
          return
        }

        // Salvăm ID-ul în localStorage pentru utilizări viitoare
        localStorage.setItem("patientProfileId", profiles[0].id)
      }

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
            schedule_days
          )
        `)
        .eq("patient_id", patientProfileId || "")

      if (diagnosticsError || !patientDiagnostics || patientDiagnostics.length === 0) {
        setHasNotifications(false)
        return
      }

      // Check if there are diagnostics scheduled for today
      const diagnosticsForToday = patientDiagnostics.filter(
        (pd) => pd.diagnostics && pd.diagnostics.schedule_days && pd.diagnostics.schedule_days.includes(dayOfWeek),
      )

      if (diagnosticsForToday.length === 0) {
        setHasNotifications(false)
        return
      }

      // Check if the patient has already answered all questions for today
      let pendingNotifications = false

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

        // If not all questions are answered, there are pending notifications
        if (!responses || responses.length < totalQuestions) {
          pendingNotifications = true
          break
        }
      }

      setHasNotifications(pendingNotifications)

      // If there are pending notifications, check if we should show a browser notification
      if (pendingNotifications && typeof window !== "undefined" && "Notification" in window) {
        // Check if we have permission
        if (Notification.permission === "granted") {
          // Check if we haven't shown a notification today
          const lastNotification = localStorage.getItem("lastNotification")
          const today = new Date().toDateString()

          if (lastNotification !== today) {
            new Notification("Fluxia - Întrebări noi", {
              body: "Aveți întrebări noi de la medicul dvs. care așteaptă răspuns.",
              icon: "/favicon.ico",
            })

            localStorage.setItem("lastNotification", today)
          }
        } else if (Notification.permission !== "denied") {
          // Request permission
          Notification.requestPermission()
        }
      }
    } catch (error) {
      console.error("Error checking notifications:", error)
      setHasNotifications(false)
    }
  }

  useEffect(() => {
    // Check notifications on load
    checkNotifications()

    // Set up interval to check notifications every 15 minutes
    const interval = setInterval(checkNotifications, 15 * 60 * 1000)

    // Set up subscription to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkNotifications()
    })

    return () => {
      clearInterval(interval)
      subscription.unsubscribe()
    }
  }, [])

  return (
    <NotificationContext.Provider value={{ hasNotifications, checkNotifications }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)

