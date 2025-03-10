"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function PatientsList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista Pacienți</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-gray-500">
          Lista pacienților este disponibilă în dashboard-ul de administrare.
        </div>
      </CardContent>
    </Card>
  )
}

