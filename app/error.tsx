"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-6 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">A apărut o eroare</h2>
          <p className="mt-2 text-sm text-gray-500">
            Ne cerem scuze pentru inconveniență. Vă rugăm să încercați din nou.
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <Button onClick={() => window.location.reload()} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Reîncarcă pagina
          </Button>
          <Button onClick={() => reset()} variant="outline">
            Încearcă din nou
          </Button>
        </div>
      </div>
    </div>
  )
}

