import { PatientAssignmentContent } from "./patient-assignment-content"

export default function AssignPatientsPage({
  params,
}: {
  params: { id: string }
}) {
  return <PatientAssignmentContent diagnosticId={params.id} />
}

