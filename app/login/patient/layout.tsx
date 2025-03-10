import type { ReactNode } from "react"
import Link from "next/link"

export default function PatientAuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <nav className="mb-8 flex justify-end">
          <Link href="/login/patient/login" className="text-sm text-gray-600 hover:text-gray-900">
            Aveți deja cont? Autentificați-vă aici
          </Link>
        </nav>
        {children}
      </div>
    </div>
  )
}

