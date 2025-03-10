"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function CheckEmailPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg text-center">
        <h1 className="text-3xl font-bold">Verificați email-ul</h1>
        <p className="text-gray-500">
          Am trimis un link de autentificare pe adresa dvs. de email. Vă rugăm să verificați email-ul și să accesați
          link-ul pentru a continua.
        </p>
        <p className="text-sm text-muted-foreground">Dacă nu găsiți email-ul, verificați și în folderul Spam.</p>

        <div className="pt-4">
          <Button variant="outline" onClick={() => router.push("/login/patient/login")} className="mr-2">
            Înapoi la autentificare
          </Button>
          <Button onClick={() => router.push("/")}>Pagina principală</Button>
        </div>
      </div>
    </div>
  )
}

