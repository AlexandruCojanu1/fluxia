-- Recreăm tabela diagnostics cu structura corectă
DROP TABLE IF EXISTS diagnostics CASCADE;

CREATE TABLE diagnostics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    chat_id TEXT UNIQUE NOT NULL,
    doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    categories JSONB NOT NULL DEFAULT '[]',
    final_messages TEXT[] NOT NULL DEFAULT '{}',
    schedule_days TEXT[] NOT NULL DEFAULT '{}',
    notification_time TIME NOT NULL DEFAULT '09:00',
    duration_days INTEGER NOT NULL DEFAULT 7
);

-- Creăm tabela pentru asocierea dintre pacienți și diagnostice
CREATE TABLE patient_diagnostics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    diagnostic_id UUID NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    UNIQUE(patient_id, diagnostic_id)
);

-- Adăugăm indecși pentru performanță
CREATE INDEX idx_diagnostics_doctor_id ON diagnostics(doctor_id);
CREATE INDEX idx_diagnostics_chat_id ON diagnostics(chat_id);
CREATE INDEX idx_patient_diagnostics_patient_id ON patient_diagnostics(patient_id);
CREATE INDEX idx_patient_diagnostics_diagnostic_id ON patient_diagnostics(diagnostic_id);

-- Configurăm RLS
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_diagnostics ENABLE ROW LEVEL SECURITY;

-- Politici pentru diagnostics
CREATE POLICY "Doctors can manage their own diagnostics"
ON diagnostics FOR ALL
TO authenticated
USING (doctor_id = auth.uid())
WITH CHECK (doctor_id = auth.uid());

-- Politici pentru patient_diagnostics
CREATE POLICY "Doctors can manage patient diagnostics"
ON patient_diagnostics FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM diagnostics
        WHERE diagnostics.id = patient_diagnostics.diagnostic_id
        AND diagnostics.doctor_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM diagnostics
        WHERE diagnostics.id = patient_diagnostics.diagnostic_id
        AND diagnostics.doctor_id = auth.uid()
    )
);

-- Acordăm drepturi pentru rolul authenticated
GRANT ALL ON diagnostics TO authenticated;
GRANT ALL ON patient_diagnostics TO authenticated;

