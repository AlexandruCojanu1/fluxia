-- Adăugăm coloana password în patient_profiles
ALTER TABLE patient_profiles
ADD COLUMN IF NOT EXISTS password TEXT;

-- Asigurăm-ne că avem indexul pentru full_name pentru căutări rapide
CREATE INDEX IF NOT EXISTS idx_patient_profiles_full_name 
ON patient_profiles(full_name);

