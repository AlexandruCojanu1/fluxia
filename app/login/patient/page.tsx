"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"

export default function PatientLogin() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    occupation: "",
    presentation: "",
    purpose: "",
    chatId: "",
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("Starting registration process...")

      // 1. Verifică chat ID-ul
      const { data: diagnostic, error: diagnosticError } = await supabase
        .from("diagnostics")
        .select("id, doctor_id")
        .eq("chat_id", formData.chatId.trim())
        .single()

      if (diagnosticError) {
        throw new Error("ID-ul de chat nu este valid")
      }

      console.log("Found diagnostic:", diagnostic)

      // 2. Verifică dacă există deja un profil cu acest nume
      const { data: existingProfile } = await supabase
        .from("patient_profiles")
        .select("*")
        .eq("full_name", formData.fullName.trim())
        .single()

      if (existingProfile) {
        throw new Error("Există deja un cont cu acest nume. Vă rugăm să folosiți alt nume sau să vă autentificați.")
      }

      // 3. Trimitem magic link pentru înregistrare
      const { data: authData, error: signUpError } = await supabase.auth.signInWithOtp({
        email: formData.email.trim().toLowerCase(),
        options: {
          data: {
            full_name: formData.fullName.trim(),
          },
        },
      })

      if (signUpError) {
        throw signUpError
      }

      // 4. Upload poză profil
      let profileUrl = null
      if (profileImage) {
        const fileExt = profileImage.name.split(".").pop()
        const fileName = `${formData.email.trim().toLowerCase()}.${fileExt}`

        const { error: uploadError } = await supabase.storage.from("profile-images").upload(fileName, profileImage)

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(fileName)
          profileUrl = urlData.publicUrl
        }
      }

      // 5. Creează profilul pacientului
      const { data: profileData, error: profileError } = await supabase
        .from("patient_profiles")
        .insert([
          {
            full_name: formData.fullName.trim(),
            date_of_birth: formData.dateOfBirth,
            phone: formData.phone.trim(),
            email: formData.email.trim().toLowerCase(),
            occupation: formData.occupation.trim(),
            presentation: formData.presentation.trim(),
            purpose: formData.purpose.trim(),
            profile_image_url: profileUrl,
          },
        ])
        .select()
        .single()

      if (profileError) {
        throw profileError
      }

      console.log("Created patient profile:", profileData)

      // 6. Creează asocierea între pacient și diagnostic în tabela patient_diagnostics
      const { error: associationError } = await supabase.from("patient_diagnostics").insert([
        {
          patient_id: profileData.id,
          diagnostic_id: diagnostic.id,
          status: "active",
        },
      ])

      if (associationError) {
        console.error("Error creating patient-diagnostic association:", associationError)
        // Continuăm chiar dacă asocierea eșuează, pentru a nu bloca înregistrarea
      } else {
        console.log("Created patient-diagnostic association successfully")
      }

      toast.success("Cont creat cu succes! Verificați email-ul pentru a continua.")
      router.push("/login/patient/check-email")
    } catch (error) {
      console.error("Registration error:", error)
      const message = error instanceof Error ? error.message : "Eroare la crearea contului"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Înregistrare Pacient</h1>
          <p className="text-gray-500">Completați datele pentru a vă crea contul</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nume și prenume</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Ion Popescu"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Data nașterii</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="07xx xxx xxx"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="nume@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">Ocupație</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="Ex: Profesor"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chatId">ID Chat</Label>
              <Input
                id="chatId"
                value={formData.chatId}
                onChange={(e) => setFormData({ ...formData, chatId: e.target.value })}
                placeholder="ID-ul primit de la medic"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profileImage">Poză de profil</Label>
            <div className="flex items-center gap-4">
              <Input id="profileImage" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById("profileImage")?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {profileImage ? profileImage.name : "Încărcați o poză"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="presentation">Scurtă prezentare</Label>
            <Textarea
              id="presentation"
              value={formData.presentation}
              onChange={(e) => setFormData({ ...formData, presentation: e.target.value })}
              placeholder="O scurtă descriere despre dumneavoastră..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Scopul (pe scurt)</Label>
            <Textarea
              id="purpose"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="Care este scopul dumneavoastră..."
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
              "Creează cont"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

