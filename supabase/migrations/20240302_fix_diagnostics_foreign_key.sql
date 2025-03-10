-- Verificăm structura tabelei și refacem constrângerile
DO $$ 
BEGIN
    -- Ștergem constrângerea existentă dacă există
    ALTER TABLE IF EXISTS diagnostics
    DROP CONSTRAINT IF EXISTS diagnostics_doctor_id_fkey;

    -- Adăugăm constrângerea corectă
    ALTER TABLE diagnostics
    ADD CONSTRAINT diagnostics_doctor_id_fkey
    FOREIGN KEY (doctor_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

    -- Ne asigurăm că doctor_id este NOT NULL
    ALTER TABLE diagnostics
    ALTER COLUMN doctor_id SET NOT NULL;
END $$;

-- Verificăm tipul coloanei doctor_id
DO $$ 
BEGIN
    ALTER TABLE diagnostics
    ALTER COLUMN doctor_id TYPE uuid USING doctor_id::uuid;
EXCEPTION
    WHEN others THEN
        NULL;
END $$;

