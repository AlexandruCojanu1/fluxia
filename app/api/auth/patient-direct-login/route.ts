import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { fullName, email, patientId } = await request.json()

    if (!fullName || !email || !patientId) {
      return NextResponse.json({ error: "Date incomplete" }, { status: 400 })
    }

    // Verificăm dacă există un utilizator cu acest email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      console.error("Error listing users:", userError)
      return NextResponse.json({ error: "Eroare la verificarea utilizatorilor" }, { status: 500 })
    }

    // Găsim utilizatorul după email
    const existingUser = userData.users.find((user) => user.email === email)

    if (existingUser) {
      // Utilizatorul există, actualizăm parola la numele pacientului
      const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, { password: fullName })

      if (updateError) {
        console.error("Error updating password:", updateError)
        return NextResponse.json({ error: "Nu s-a putut actualiza parola" }, { status: 500 })
      }

      // Actualizăm și profilul pacientului cu user_id dacă nu există
      const { error: profileUpdateError } = await supabase
        .from("patient_profiles")
        .update({ user_id: existingUser.id })
        .eq("id", patientId)
        .is("user_id", null)

      if (profileUpdateError) {
        console.error("Error updating profile:", profileUpdateError)
      }

      // Creăm o sesiune pentru utilizator
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
        userId: existingUser.id,
      })

      if (sessionError) {
        console.error("Error creating session:", sessionError)
        return NextResponse.json({ error: "Nu s-a putut crea sesiunea" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        session: sessionData,
      })
    } else {
      // Utilizatorul nu există, îl creăm
      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email: email,
        password: fullName,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })

      if (signUpError) {
        console.error("Error creating user:", signUpError)
        return NextResponse.json({ error: "Nu s-a putut crea utilizatorul" }, { status: 500 })
      }

      // Actualizăm profilul pacientului cu noul user_id
      const { error: profileUpdateError } = await supabase
        .from("patient_profiles")
        .update({ user_id: signUpData.user.id })
        .eq("id", patientId)

      if (profileUpdateError) {
        console.error("Error updating profile:", profileUpdateError)
        return NextResponse.json({ error: "Nu s-a putut actualiza profilul" }, { status: 500 })
      }

      // Creăm o sesiune pentru noul utilizator
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
        userId: signUpData.user.id,
      })

      if (sessionError) {
        console.error("Error creating session:", sessionError)
        return NextResponse.json({ error: "Nu s-a putut crea sesiunea" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        session: sessionData,
      })
    }
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Eroare internă de server" }, { status: 500 })
  }
}

