-- Actualizează parolele în auth.users pentru a se potrivi cu cele din patient_profiles
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT pp.user_id, pp.full_name, pp.email
        FROM patient_profiles pp
    LOOP
        -- Update the auth.users password directly
        UPDATE auth.users 
        SET encrypted_password = crypt(r.full_name, gen_salt('bf'))
        WHERE id = r.user_id;
    END LOOP;
END $$;

