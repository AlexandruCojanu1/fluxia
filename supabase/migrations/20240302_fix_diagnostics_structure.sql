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

-- Adăugăm indecși pentru performanță
CREATE INDEX idx_diagnostics_doctor_id ON diagnostics(doctor_id);
CREATE INDEX idx_diagnostics_chat_id ON diagnostics(chat_id);

-- Configurăm RLS
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;

-- Politici pentru diagnostics
CREATE POLICY "Doctors can manage their own diagnostics"
ON diagnostics FOR ALL
TO authenticated
USING (doctor_id = auth.uid())
WITH CHECK (doctor_id = auth.uid());

-- Acordăm drepturi pentru rolul authenticated
GRANT ALL ON diagnostics TO authenticated;

