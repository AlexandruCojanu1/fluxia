"use client"

import { Bell } from "lucide-react"
import { useNotifications } from "./notification-provider"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function NotificationBadge() {
  const { hasNotifications } = useNotifications()
  const router = useRouter()

  if (!hasNotifications) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative text-medical-700 hover:bg-medical-50"
      onClick={() => router.push("/patient/chats")}
    >
      <Bell className="h-5 w-5" />
      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-medical-500 to-medical-600 text-[10px] text-white animate-pulse-opacity">
        !
      </span>
    </Button>
  )
}

