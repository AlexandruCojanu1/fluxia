// Adaugă 'use client' la început
'use client'

// Importă PatientAssignmentContent
import { PatientAssignmentContent } from './patient-assignment-content'

// Modifică definirea componentei
export default function AssignPatientsPage({
  params,
}: {
  params: { id: string }
}) {
  return <PatientAssignmentContent diagnosticId={params.id} />
}