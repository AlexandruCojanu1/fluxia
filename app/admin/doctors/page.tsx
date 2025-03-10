"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Loader2, RefreshCw } from "lucide-react"

type Doctor = {
  id: string
  email: string
  doctor_id: string
  name: string
  created_at: string
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingId, setGeneratingId] = useState(false)
  const [newDoctor, setNewDoctor] = useState({
    email: "",
    doctorId: "",
    name: "",
  })

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase.from("doctors").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setDoctors(data || [])
    } catch (error) {
      console.error("Error fetching doctors:", error)
      toast.error("Nu s-au putut încărca medicii")
    } finally {
      setLoading(false)
    }
  }

  const generateDoctorId = async () => {
    try {
      setGeneratingId(true)

      // Obține toate ID-urile existente
      const { data: existingDoctors, error } = await supabase.from("doctors").select("doctor_id")

      if (error) throw error

      const existingIds = new Set(existingDoctors?.map((doc) => doc.doctor_id) || [])

      // Generează un ID unic
      let newId = ""
      let attempts = 0
      const maxAttempts = 100 // Limită de siguranță

      do {
        // Generează un ID în formatul DOC urmat de 4 cifre
        const randomNum = Math.floor(1000 + Math.random() * 9000)
        newId = `DOC${randomNum}`
        attempts++

        // Previne bucla infinită
        if (attempts >= maxAttempts) {
          throw new Error("Nu s-a putut genera un ID unic după mai multe încercări")
        }
      } while (existingIds.has(newId))

      // Actualizează starea cu noul ID
      setNewDoctor({ ...newDoctor, doctorId: newId })
      toast.success("ID generat cu succes!")
    } catch (error) {
      console.error("Error generating doctor ID:", error)
      toast.error("Nu s-a putut genera ID-ul")
    } finally {
      setGeneratingId(false)
    }
  }

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Validate inputs
      if (!newDoctor.name.trim()) {
        toast.error("Numele medicului este obligatoriu")
        return
      }

      const { error } = await supabase.from("doctors").insert([
        {
          email: newDoctor.email,
          doctor_id: newDoctor.doctorId,
          name: newDoctor.name,
        },
      ])

      if (error) throw error

      toast.success("Medic adăugat cu succes!")
      setNewDoctor({ email: "", doctorId: "", name: "" })
      fetchDoctors()
    } catch (error) {
      console.error("Error adding doctor:", error)
      toast.error("Nu s-a putut adăuga medicul")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Administrare Medici</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adaugă Medic Nou</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddDoctor} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="name">Nume Medic</Label>
                <Input
                  id="name"
                  value={newDoctor.name}
                  onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                  placeholder="Dr. Ion Popescu"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newDoctor.email}
                  onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                  placeholder="doctor@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctorId">ID Medic</Label>
                <div className="flex gap-2">
                  <Input
                    id="doctorId"
                    value={newDoctor.doctorId}
                    onChange={(e) => setNewDoctor({ ...newDoctor, doctorId: e.target.value })}
                    placeholder="DOC1234"
                    required
                  />
                  <Button type="button" variant="outline" onClick={generateDoctorId} disabled={generatingId}>
                    {generatingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <Button type="submit">Adaugă Medic</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista Medici</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Se încarcă...</p>
          ) : doctors.length === 0 ? (
            <p>Nu există medici înregistrați</p>
          ) : (
            <div className="divide-y">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="py-4">
                  <p className="font-medium">{doctor.name}</p>
                  <p className="text-sm text-gray-500">{doctor.email}</p>
                  <p className="text-sm text-gray-500">ID: {doctor.doctor_id}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

