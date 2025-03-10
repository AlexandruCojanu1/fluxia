-- Verificăm și adăugăm coloanele necesare în tabela diagnostics
ALTER TABLE diagnostics
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Adăugăm indecși pentru performanță
CREATE INDEX IF NOT EXISTS idx_diagnostics_doctor_id ON diagnostics(doctor_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_created_at ON diagnostics(created_at);

-- Actualizăm politica RLS pentru a permite doctorilor să-și vadă propriile diagnostice
DROP POLICY IF EXISTS "Doctors can view their own diagnostics" ON diagnostics;
CREATE POLICY "Doctors can view their own diagnostics" ON diagnostics
    FOR ALL
    TO authenticated
    USING (doctor_id = auth.uid());

