-- Generează parole pentru înregistrările existente fără parolă
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT * FROM patient_profiles WHERE password IS NULL OR password = ''
    LOOP
        -- Generează o parolă unică și actualizează atât profilul cât și userul
        UPDATE patient_profiles 
        SET password = substr(md5(random()::text), 0, 12)
        WHERE id = r.id;
    END LOOP;
END $$;

-- Asigură-te că toate înregistrările viitoare au parolă
ALTER TABLE patient_profiles
ALTER COLUMN password SET NOT NULL,
ADD CONSTRAINT ensure_password_not_empty CHECK (password != '');

