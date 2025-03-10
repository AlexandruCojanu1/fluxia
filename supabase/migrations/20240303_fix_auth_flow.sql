-- Actualizează parolele în auth.users pentru a folosi numele ca parolă
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT pp.user_id, pp.full_name, pp.email
        FROM patient_profiles pp
    LOOP
        -- Update the auth.users password to match the full name
        UPDATE auth.users 
        SET encrypted_password = crypt(r.full_name, gen_salt('bf'))
        WHERE id = r.user_id;
        
        -- Update the patient_profiles password
        UPDATE patient_profiles
        SET password = r.full_name
        WHERE user_id = r.user_id;
    END LOOP;
END $$;

-- Adaugă și verifică constrângerile
ALTER TABLE patient_profiles
ADD CONSTRAINT unique_full_name UNIQUE (full_name);

