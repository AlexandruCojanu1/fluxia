// Folosim o abordare mai simplă pentru pagina de asignare
export default function AssignPatientsPage(props: any) {
  // Extragem ID-ul din props
  const id = props.params?.id

  // Importăm dinamic componenta client
  const PatientAssignmentClient = require("./patient-assignment-client").PatientAssignmentClient

  return (
    <div>
      <PatientAssignmentClient diagnosticId={id} />
    </div>
  )
}

