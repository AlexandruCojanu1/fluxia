-- Verifică și actualizează structura tabelei
ALTER TABLE diagnostics 
ADD COLUMN IF NOT EXISTS categories JSONB,
ADD COLUMN IF NOT EXISTS final_messages TEXT[],
ADD COLUMN IF NOT EXISTS schedule_days TEXT[],
ADD COLUMN IF NOT EXISTS notification_time TIME,
ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS chat_id TEXT;

-- Asigură-te că avem toate constrângerile necesare
ALTER TABLE diagnostics
ALTER COLUMN doctor_id SET NOT NULL,
ALTER COLUMN name SET NOT NULL;

-- Adaugă indecși pentru performanță
CREATE INDEX IF NOT EXISTS idx_diagnostics_doctor_id ON diagnostics(doctor_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_diagnostics_chat_id ON diagnostics(chat_id);

-- Șterge politicile existente
DROP POLICY IF EXISTS "Doctors can manage diagnostics" ON diagnostics;

-- Adaugă politici noi
CREATE POLICY "Enable insert for authenticated doctors"
ON diagnostics FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.user_id = auth.uid()
  )
);

CREATE POLICY "Enable select for authenticated doctors"
ON diagnostics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.user_id = auth.uid()
  )
);

-- Asigură-te că RLS este activat
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;

