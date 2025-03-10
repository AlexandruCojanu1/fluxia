-- Ensure the patient_diagnostics table exists with the correct structure
CREATE TABLE IF NOT EXISTS patient_diagnostics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  patient_id UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  diagnostic_id UUID NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  UNIQUE(patient_id, diagnostic_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_diagnostics_patient_id ON patient_diagnostics(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_diagnostics_diagnostic_id ON patient_diagnostics(diagnostic_id);

-- Enable RLS
ALTER TABLE patient_diagnostics ENABLE ROW LEVEL SECURITY;

-- Create policies for patient_diagnostics
CREATE POLICY IF NOT EXISTS "Patients can view their own diagnostics"
ON patient_diagnostics FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT id FROM patient_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Doctors can view diagnostics they created"
ON patient_diagnostics FOR SELECT
TO authenticated
USING (
  diagnostic_id IN (
    SELECT id FROM diagnostics WHERE doctor_id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON patient_diagnostics TO authenticated;

