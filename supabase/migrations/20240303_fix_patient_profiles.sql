-- Asigură-te că avem coloana password și că nu este null
ALTER TABLE patient_profiles
ALTER COLUMN password SET NOT NULL;

-- Adaugă un index pentru căutare eficientă
CREATE INDEX IF NOT EXISTS idx_patient_profiles_email ON patient_profiles(email);

-- Verifică și repară înregistrările existente fără parolă
UPDATE patient_profiles
SET password = auth.users.encrypted_password
FROM auth.users
WHERE patient_profiles.user_id = auth.users.id
AND patient_profiles.password IS NULL;

-- Adaugă o constrângere pentru a ne asigura că toate înregistrările viitoare au parolă
ALTER TABLE patient_profiles
ADD CONSTRAINT patient_profiles_password_check CHECK (password IS NOT NULL AND password != '');

