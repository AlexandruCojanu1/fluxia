import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Acest endpoint va verifica și repara relațiile dintre utilizatori și profilurile pacienților
export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // 1. Obținem toți utilizatorii
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      return NextResponse.json({ error: "Nu s-au putut obține utilizatorii" }, { status: 500 })
    }

    // 2. Obținem toate profilurile pacienților
    const { data: profiles, error: profilesError } = await supabase.from("patient_profiles").select("*")

    if (profilesError) {
      return NextResponse.json({ error: "Nu s-au putut obține profilurile" }, { status: 500 })
    }

    // 3. Verificăm și reparăm relațiile
    const results = {
      total_users: users.users.length,
      total_profiles: profiles.length,
      fixed_profiles: 0,
      errors: [],
    }

    for (const profile of profiles) {
      // Dacă profilul nu are user_id, încercăm să găsim un utilizator cu același email
      if (!profile.user_id && profile.email) {
        const matchingUser = users.users.find((user) => user.email === profile.email)

        if (matchingUser) {
          // Actualizăm profilul cu user_id-ul potrivit
          const { error: updateError } = await supabase
            .from("patient_profiles")
            .update({ user_id: matchingUser.id })
            .eq("id", profile.id)

          if (updateError) {
            results.errors.push(`Nu s-a putut actualiza profilul ${profile.id}: ${updateError.message}`)
          } else {
            results.fixed_profiles++
          }
        }
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error fixing patient profiles:", error)
    return NextResponse.json({ error: "Eroare internă de server" }, { status: 500 })
  }
}

