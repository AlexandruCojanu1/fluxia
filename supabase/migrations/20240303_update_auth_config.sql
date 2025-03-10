-- Dezactivează confirmare email în setările auth
UPDATE auth.config
SET confirm_email = false;

-- Verifică că email-ul există în patient_profiles
ALTER TABLE patient_profiles
ALTER COLUMN email SET NOT NULL;

