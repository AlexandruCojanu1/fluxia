import { PatientAssignmentContent } from "./patient-assignment-client"

export default function AssignPatientsPage({
  params,
}: {
  params: { id: string }
}) {
  return <PatientAssignmentContent diagnosticId={params.id} />
}

