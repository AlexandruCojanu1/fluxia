import type { ReactNode } from "react"
import { redirect } from "next/navigation"

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Verificăm parola de admin din localStorage
  if (typeof window !== "undefined") {
    const isAdmin = localStorage.getItem("adminAuth") === "true"
    if (!isAdmin) {
      redirect("/")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">{children}</div>
    </div>
  )
}

