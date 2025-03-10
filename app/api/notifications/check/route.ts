import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the current user - handle missing session gracefully
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Auth error in API:", error)
      return NextResponse.json({ hasNotifications: false, pendingDiagnostics: [] }, { status: 200 })
    }

    if (!data.session || !data.session.user) {
      console.log("No authenticated user in API")
      return NextResponse.json({ hasNotifications: false, pendingDiagnostics: [] }, { status: 200 })
    }

    const user = data.session.user

    // Get the patient profile
    const { data: patientProfiles, error: profilesError } = await supabase
      .from("patient_profiles")
      .select("id")
      .eq("user_id", user.id)

    if (profilesError || !patientProfiles || patientProfiles.length === 0) {
      console.log("No patient profile found in API")
      return NextResponse.json({ hasNotifications: false, pendingDiagnostics: [] }, { status: 200 })
    }

    const patientId = patientProfiles[0].id

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
      .eq("patient_id", patientId)

    if (diagnosticsError || !patientDiagnostics || patientDiagnostics.length === 0) {
      return NextResponse.json({ hasNotifications: false, pendingDiagnostics: [] }, { status: 200 })
    }

    // Check if there are diagnostics scheduled for today
    const diagnosticsForToday = patientDiagnostics.filter(
      (pd) => pd.diagnostics && pd.diagnostics.schedule_days && pd.diagnostics.schedule_days.includes(dayOfWeek),
    )

    if (diagnosticsForToday.length === 0) {
      return NextResponse.json({ hasNotifications: false, pendingDiagnostics: [] }, { status: 200 })
    }

    // Check if the patient has already answered all questions for today
    const pendingDiagnostics = []

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
        .eq("patient_id", patientId)
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
        pendingDiagnostics.push({
          id: pd.diagnostic_id,
          name: pd.diagnostics.name,
        })
      }
    }

    return NextResponse.json(
      {
        hasNotifications: pendingDiagnostics.length > 0,
        pendingDiagnostics,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error checking notifications:", error)
    return NextResponse.json(
      {
        hasNotifications: false,
        pendingDiagnostics: [],
        error: "A apărut o eroare la verificarea notificărilor",
      },
      { status: 200 },
    )
  }
}

