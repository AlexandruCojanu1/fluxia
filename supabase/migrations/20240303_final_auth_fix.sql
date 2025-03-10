-- Permitem acces la profiluri pentru userul anonim
CREATE POLICY "Allow anonymous access"
ON patient_profiles
FOR SELECT
USING (true);

-- Verificăm că avem indexul pentru nume
CREATE INDEX IF NOT EXISTS idx_patient_profiles_full_name 
ON patient_profiles(full_name);

