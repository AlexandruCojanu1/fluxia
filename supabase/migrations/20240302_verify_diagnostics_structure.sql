-- Verifică și actualizează structura tabelei
DO $$ 
BEGIN
    -- Verifică dacă tabela există
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'diagnostics') THEN
        CREATE TABLE public.diagnostics (
            id BIGSERIAL PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            name TEXT NOT NULL,
            categories JSONB NOT NULL,
            final_messages TEXT[] NOT NULL,
            schedule_days TEXT[] NOT NULL,
            notification_time TIME NOT NULL,
            duration_days INTEGER NOT NULL,
            chat_id TEXT UNIQUE NOT NULL,
            doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
        );
    END IF;
END $$;

-- Verifică și adaugă constrângerile necesare
DO $$ 
BEGIN
    -- Adaugă constrângere pentru doctor_id dacă nu există
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'diagnostics_doctor_id_fkey'
    ) THEN
        ALTER TABLE public.diagnostics
        ADD CONSTRAINT diagnostics_doctor_id_fkey
        FOREIGN KEY (doctor_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Reindexare pentru performanță
REINDEX TABLE public.diagnostics;

