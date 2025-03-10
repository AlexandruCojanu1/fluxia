-- Eliminăm coloana password care nu mai este necesară
ALTER TABLE patient_profiles
DROP COLUMN IF EXISTS password;

-- Ne asigurăm că avem indexul pentru email
CREATE INDEX IF NOT EXISTS idx_patient_profiles_email 
ON patient_profiles(email);

-- Actualizăm politicile
DROP POLICY IF EXISTS "Allow all operations" ON patient_profiles;

CREATE POLICY "Enable read access for all users"
ON patient_profiles FOR SELECT
USING (true);

CREATE POLICY "Enable insert for users"
ON patient_profiles FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for own profile"
ON patient_profiles FOR UPDATE
USING (auth.uid() = user_id);

