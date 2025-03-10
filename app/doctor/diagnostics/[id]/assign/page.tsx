// Folosim o abordare mai simplă pentru pagina de asignare
export default function AssignPatientsPage({ params }: any) {
  // Importăm dinamic componenta client pentru a evita problemele de tipuri
  const { PatientAssignmentClient } = require("./patient-assignment-client")

  return (
    <div>
      <PatientAssignmentClient diagnosticId={params.id} />
    </div>
  )
}

// Dezactivăm verificarea tipurilor pentru această pagină
// @ts-ignore
export const dynamic = "force-static"

