// Folosim o abordare simplificată pentru a evita erorile de tipuri
export default function AssignPatientsPage(props: any) {
  const id = props.params?.id

  // Importăm dinamic componenta client
  const { PatientAssignmentClient } = require("./patient-assignment-client")

  return (
    <div>
      <PatientAssignmentClient diagnosticId={id} />
    </div>
  )
}

