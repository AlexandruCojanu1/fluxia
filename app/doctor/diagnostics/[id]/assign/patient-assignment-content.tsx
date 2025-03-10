"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"
import { ArrowLeft, Loader2, Search } from "lucide-react"

type Patient = {
  id: string
  user_id: string
  email: string
  isAssigned?: boolean
}

type Diagnostic = {
  id: string
  name: string
  chat_id: string
}

export function PatientAssignmentContent({ diagnosticId }: { diagnosticId: string }) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, diagnosticId])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Obținem informațiile despre diagnostic
      const { data: diagnosticData, error: diagnosticError } = await supabase
        .from("diagnostics")
        .select("id, name, chat_id")
        .eq("id", diagnosticId)
        .single()

      if (diagnosticError) throw diagnosticError

      setDiagnostic(diagnosticData)

      // Obținem lista de pacienți și statusul lor de asignare
      const { data: patientsData, error: patientsError } = await supabase
        .from("auth.users")
        .select(`
          id,
          email,
          patient_diagnostics!inner(diagnostic_id)
        `)
        .eq("patient_diagnostics.diagnostic_id", diagnosticId)

      if (patientsError) throw patientsError

      // Procesăm datele pentru a marca pacienții asignați
      const processedPatients = patientsData.map((patient) => ({
        id: patient.id,
        email: patient.email,
        isAssigned: patient.patient_diagnostics?.some((pd) => pd.diagnostic_id === diagnosticId) || false,
      }))

      setPatients(processedPatients)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Nu s-au putut încărca datele")
      router.push("/doctor/diagnostics")
    } finally {
      setLoading(false)
    }
  }

  const handleAssignmentChange = async (patientId: string, isAssigned: boolean) => {
    try {
      setSaving(true)

      if (isAssigned) {
        // Adăugăm asignarea
        const { error } = await supabase.from("patient_diagnostics").insert([
          {
            patient_id: patientId,
            diagnostic_id: diagnosticId,
          },
        ])

        if (error) throw error
      } else {
        // Ștergem asignarea
        const { error } = await supabase.from("patient_diagnostics").delete().match({
          patient_id: patientId,
          diagnostic_id: diagnosticId,
        })

        if (error) throw error
      }

      // Actualizăm starea locală
      setPatients(patients.map((p) => (p.id === patientId ? { ...p, isAssigned } : p)))

      toast.success(isAssigned ? "Pacient asignat cu succes" : "Asignare ștearsă cu succes")
    } catch (error) {
      console.error("Error updating assignment:", error)
      toast.error("Nu s-a putut actualiza asignarea")
    } finally {
      setSaving(false)
    }
  }

  const filteredPatients = patients.filter((patient) => patient.email.toLowerCase().includes(searchTerm.toLowerCase()))

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!diagnostic) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/doctor/diagnostics")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Asignare Pacienți</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Diagnostic: {diagnostic.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Caută după email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="space-y-4">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">Nu s-au găsit pacienți</div>
            ) : (
              filteredPatients.map((patient) => (
                <div key={patient.id} className="flex items-center space-x-4 p-4 rounded-lg border">
                  <Checkbox
                    id={patient.id}
                    checked={patient.isAssigned}
                    onCheckedChange={(checked) => handleAssignmentChange(patient.id, checked === true)}
                    disabled={saving}
                  />
                  <Label htmlFor={patient.id} className="flex-1">
                    {patient.email}
                  </Label>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

