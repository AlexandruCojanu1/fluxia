-- Actualizează parolele pentru profilurile existente să folosească numele complet
UPDATE patient_profiles
SET password = full_name
WHERE password IS NULL OR password = '';

-- Asigură-te că avem constrângerile necesare
ALTER TABLE patient_profiles
ALTER COLUMN password SET NOT NULL,
ADD CONSTRAINT ensure_password_not_empty CHECK (password != '');

