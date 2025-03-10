import type React from "react"
import { DoctorNav } from "@/components/doctor-nav"
import { ProtectedRoute } from "@/components/protected-route"

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireDoctor>
      <div className="min-h-screen bg-gray-100">
        <DoctorNav />
        <main className="container mx-auto px-4 py-8">{children}</main>
      </div>
    </ProtectedRoute>
  )
}

