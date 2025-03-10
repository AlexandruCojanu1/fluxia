"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Activity, Stethoscope, Users, Shield, ArrowRight } from "lucide-react"

export default function Home() {
  const [adminPassword, setAdminPassword] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()

  const handleAdminAccess = () => {
    if (adminPassword === "07nc)(*@$246") {
      localStorage.setItem("adminAuth", "true")
      router.push("/admin/doctors")
      setIsDialogOpen(false)
    } else {
      toast.error("Parolă incorectă")
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-medical-50 to-white">
      {/* Header cu efect de glassmorphism */}
      <header className="glass-effect sticky top-0 z-10 border-b border-medical-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-medical-600 animate-ekg" />
            <span className="text-2xl font-bold bg-gradient-to-r from-medical-600 to-medical-800 bg-clip-text text-transparent">
              Fluxia
            </span>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-medical-700">
                <Shield className="h-4 w-4 mr-1" />
                Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-effect">
              <DialogHeader>
                <DialogTitle>Acces Administrator</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  type="password"
                  placeholder="Introduceți parola de admin"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAdminAccess()
                    }
                  }}
                  className="border-medical-200 focus:border-medical-400"
                />
                <Button
                  className="w-full bg-gradient-to-r from-medical-500 to-medical-700 hover:from-medical-600 hover:to-medical-800"
                  onClick={handleAdminAccess}
                >
                  Accesează
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Hero section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 rounded-full bg-medical-100 text-medical-800 text-sm font-medium mb-2">
              Platformă Medicală Inovatoare
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-medical-600 to-medical-800 bg-clip-text text-transparent">
                Monitorizare medicală
              </span>{" "}
              inteligentă
            </h1>
            <p className="text-lg text-gray-600 max-w-lg">
              Sistem integrat pentru monitorizarea și îmbunătățirea stării pacienților, cu tehnologie avansată și
              interfață intuitivă.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-medical-500 to-medical-700 hover:from-medical-600 hover:to-medical-800 shadow-lg shadow-medical-500/20"
              >
                <Link href="/login/doctor" className="flex items-center">
                  <Stethoscope className="mr-2 h-5 w-5" />
                  Acces Medici
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-medical-300 text-medical-700 hover:bg-medical-50"
              >
                <Link href="/login/patient" className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Acces Pacienți
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -z-10 inset-0 bg-medical-pattern opacity-20"></div>
            <div className="medical-card rounded-2xl p-8 medical-glow">
              <div className="absolute top-4 right-4 h-3 w-3 rounded-full bg-medical-500 animate-pulse-opacity"></div>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-medical-100 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-medical-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Monitorizare în timp real</h3>
                    <p className="text-sm text-gray-500">Date actualizate constant</p>
                  </div>
                </div>
                <div className="h-2 w-full bg-medical-100 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-medical-400 to-medical-600 rounded-full"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/80 rounded-lg p-3 shadow-sm">
                      <div className="h-1 w-12 bg-medical-200 rounded mb-2"></div>
                      <div className="h-1 w-8 bg-medical-100 rounded"></div>
                    </div>
                  ))}
                </div>
                <div className="ekg-line h-10"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gradient-to-b from-white to-medical-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Funcționalități avansate</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Platforma Fluxia oferă instrumente moderne pentru monitorizarea și îmbunătățirea stării pacienților
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Stethoscope className="h-8 w-8 text-medical-600" />,
                title: "Diagnostic inteligent",
                description: "Creați și monitorizați diagnostice personalizate pentru fiecare pacient",
              },
              {
                icon: <Activity className="h-8 w-8 text-medical-600" />,
                title: "Monitorizare continuă",
                description: "Urmăriți evoluția pacienților cu notificări și alerte în timp real",
              },
              {
                icon: <Users className="h-8 w-8 text-medical-600" />,
                title: "Comunicare eficientă",
                description: "Sistem de comunicare direct între medici și pacienți",
              },
            ].map((feature, i) => (
              <div key={i} className="medical-card rounded-xl p-6 transition-all hover:shadow-lg">
                <div className="h-14 w-14 rounded-full bg-medical-100 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-medical-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Activity className="h-6 w-6 text-medical-300" />
              <span className="text-2xl font-bold">Fluxia</span>
            </div>
            <div className="text-medical-200 text-sm">
              © {new Date().getFullYear()} Fluxia. Toate drepturile rezervate.
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

