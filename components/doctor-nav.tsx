"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "./auth-provider"
import { ClipboardList, Users, LogOut, Activity, Stethoscope } from "lucide-react"

export function DoctorNav() {
  const pathname = usePathname()
  const { signOut } = useAuth()

  const navigation = [
    {
      name: "Dashboard",
      href: "/doctor/dashboard",
      icon: Users,
    },
    {
      name: "Diagnostice",
      href: "/doctor/diagnostics",
      icon: ClipboardList,
    },
  ]

  return (
    <div className="sticky top-0 z-10 glass-effect border-b border-medical-100">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <Link href="/doctor/dashboard" className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-medical-600 animate-ekg" />
            <span className="text-xl font-bold bg-gradient-to-r from-medical-600 to-medical-800 bg-clip-text text-transparent">
              Fluxia
            </span>
          </Link>
          <div className="h-6 w-px bg-medical-200 mx-2"></div>
          <div className="flex items-center space-x-1 bg-medical-100/50 px-3 py-1 rounded-full">
            <Stethoscope className="h-4 w-4 text-medical-700" />
            <span className="text-xs font-medium text-medical-800">Portal Medic</span>
          </div>
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "text-medical-700 bg-medical-50"
                    : "text-gray-600 hover:text-medical-600 hover:bg-medical-50/50"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-medical-600" : "text-gray-500"}`} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
        <div className="ml-auto">
          <Button
            variant="ghost"
            onClick={() => signOut()}
            className="text-gray-700 hover:text-medical-700 hover:bg-medical-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Ieșire
          </Button>
        </div>
      </div>
    </div>
  )
}

