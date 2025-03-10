import { PatientAssignmentClient } from "./patient-assignment-client"

// Folosim un server component pentru pagină
export default function AssignPatientsPage({
  params,
}: {
  params: { id: string }
}) {
  // Pasăm ID-ul către componenta client
  return (
    <div>
      <PatientAssignmentClient diagnosticId={params.id} />
    </div>
  )
}

