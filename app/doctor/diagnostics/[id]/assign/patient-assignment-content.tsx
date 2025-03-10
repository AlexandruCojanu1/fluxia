import { PatientAssignmentClient } from "./patient-assignment-client"

export function PatientAssignmentContent({ diagnosticId }: { diagnosticId: string }) {
  return <PatientAssignmentClient diagnosticId={diagnosticId} />
}

