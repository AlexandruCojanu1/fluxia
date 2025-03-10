-- Modificăm coloana final_message pentru a stoca un array de mesaje
ALTER TABLE diagnostics 
DROP COLUMN IF EXISTS final_message;

ALTER TABLE diagnostics
ADD COLUMN final_messages TEXT[] DEFAULT '{}';

