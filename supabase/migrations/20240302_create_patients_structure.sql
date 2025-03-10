-- Creează tabela pentru pacienți
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Adaugă indexuri pentru performanță
CREATE INDEX IF NOT EXISTS idx_patients_doctor_id ON patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);

-- Modifică tabela diagnostics pentru a include referința către pacient
ALTER TABLE diagnostics
ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id) ON DELETE CASCADE;

-- Adaugă index pentru patient_id în diagnostics
CREATE INDEX IF NOT EXISTS idx_diagnostics_patient_id ON diagnostics(patient_id);

-- Activează RLS pentru patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Politici RLS pentru patients
CREATE POLICY "Doctors can view their own patients"
ON patients FOR SELECT
TO authenticated
USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can insert their own patients"
ON patients FOR INSERT
TO authenticated
WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Doctors can update their own patients"
ON patients FOR UPDATE
TO authenticated
USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can delete their own patients"
ON patients FOR DELETE
TO authenticated
USING (doctor_id = auth.uid());

-- Actualizează politicile pentru diagnostics
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON diagnostics;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON diagnostics;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON diagnostics;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON diagnostics;

CREATE POLICY "Doctors can manage diagnostics for their patients"
ON diagnostics FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = diagnostics.patient_id
        AND patients.doctor_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = diagnostics.patient_id
        AND patients.doctor_id = auth.uid()
    )
);

