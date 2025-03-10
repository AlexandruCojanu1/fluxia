-- Actualizăm politicile pentru a permite autentificare simplă
DROP POLICY IF EXISTS "Enable read access for all users" ON patient_profiles;
DROP POLICY IF EXISTS "Enable insert for users" ON patient_profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON patient_profiles;

-- Permitem citirea pentru toți utilizatorii autentificați
CREATE POLICY "Allow read for all"
ON patient_profiles FOR SELECT
USING (true);

-- Verificăm și actualizăm structura tabelei
ALTER TABLE patient_profiles
DROP COLUMN IF EXISTS password;

-- Adăugăm index pentru căutare rapidă după nume
CREATE INDEX IF NOT EXISTS idx_patient_profiles_full_name 
ON patient_profiles(full_name);

-- Asigurăm unicitatea numelor
ALTER TABLE patient_profiles
ADD CONSTRAINT unique_full_name UNIQUE (full_name);

