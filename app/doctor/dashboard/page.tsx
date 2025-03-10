"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DiagnosticCreation } from "@/components/doctor/diagnostic-creation"
import { PatientsList } from "@/components/doctor/patients-list"
import { AppointmentsSection } from "@/components/doctor/appointments-section"

export default function DoctorDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Medic</h1>
      </div>

      <Tabs defaultValue="diagnostic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="diagnostic">Creare Diagnostic Chat</TabsTrigger>
          <TabsTrigger value="patients">Lista Pacienți</TabsTrigger>
          <TabsTrigger value="appointments">Programări</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnostic" className="space-y-4">
          <DiagnosticCreation />
        </TabsContent>

        <TabsContent value="patients" className="space-y-4">
          <PatientsList />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <AppointmentsSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}

