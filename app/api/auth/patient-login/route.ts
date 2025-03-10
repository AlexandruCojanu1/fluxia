import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { fullName } = await request.json()

    if (!fullName) {
      return NextResponse.json({ error: "Numele este obligatoriu" }, { status: 400 })
    }

    // 1. Găsim profilul pacientului după nume
    const { data: patientProfile, error: profileError } = await supabase
      .from("patient_profiles")
      .select("*")
      .eq("full_name", fullName)
      .single()

    if (profileError || !patientProfile) {
      return NextResponse.json({ error: "Pacientul nu a fost găsit" }, { status: 404 })
    }

    // 2. Verificăm dacă pacientul are user_id
    if (patientProfile.user_id) {
      // Încercăm să obținem utilizatorul din auth
      const { data: userData } = await supabase.auth.admin.getUserById(patientProfile.user_id)

      if (userData?.user) {
        // Creăm o sesiune pentru utilizator
        const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
          userId: patientProfile.user_id,
        })

        if (sessionError) {
          return NextResponse.json({ error: "Nu s-a putut crea sesiunea" }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          session: sessionData,
          redirectTo: "/patient/dashboard",
        })
      }
    }

    // 3. Dacă nu există user_id sau nu am putut crea sesiunea, trimitem magic link
    if (patientProfile.email) {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: patientProfile.email,
        options: {
          emailRedirectTo: `${request.headers.get("origin")}/patient/dashboard`,
        },
      })

      if (otpError) {
        return NextResponse.json({ error: "Nu s-a putut trimite link-ul de autentificare" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Link de autentificare trimis pe email",
        redirectTo: "/login/patient/check-email",
      })
    }

    return NextResponse.json({ error: "Nu s-a putut autentifica pacientul" }, { status: 500 })
  } catch (error) {
    console.error("Patient login error:", error)
    return NextResponse.json({ error: "Eroare internă de server" }, { status: 500 })
  }
}

