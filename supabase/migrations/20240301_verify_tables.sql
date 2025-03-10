-- Verifică și recrează tabelele dacă e necesar
CREATE TABLE IF NOT EXISTS public.diagnostics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    categories JSONB NOT NULL,
    final_messages TEXT[] NOT NULL,
    schedule_days TEXT[] NOT NULL,
    notification_time TIME NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 7,
    chat_id TEXT UNIQUE NOT NULL,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT true
);

-- Verifică politicile
DROP POLICY IF EXISTS "Doctors can manage their diagnostics" ON diagnostics;

CREATE POLICY "Doctors can manage their diagnostics"
ON diagnostics
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM doctors 
        WHERE doctors.id = diagnostics.doctor_id 
        AND doctors.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM doctors 
        WHERE doctors.id = diagnostics.doctor_id 
        AND doctors.user_id = auth.uid()
    )
);

-- Activează RLS
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;

-- Acordă drepturi pentru rolul authenticated
GRANT ALL ON diagnostics TO authenticated;

