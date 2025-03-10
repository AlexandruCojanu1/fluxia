// Remove the "use client" directive
// import type { Metadata } from 'next'

// Define the page component with the correct type for params
export default function AssignPatientsPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div>
      <h1>Assign Patients Page</h1>
      <p>Diagnostic ID: {params.id}</p>
    </div>
  )
}

