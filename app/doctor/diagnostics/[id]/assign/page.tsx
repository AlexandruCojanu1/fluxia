import { PatientAssignmentClient } from "./patient-assignment-client"

export default function AssignPatientsPage({
  params,
}: {
  params: { id: string }
}) {
  return <PatientAssignmentClient diagnosticId={params.id} />
}

export const dynamic = "force-static"

