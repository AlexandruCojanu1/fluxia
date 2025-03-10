-- Actualizăm tabela diagnostics pentru a suporta noua structură
ALTER TABLE diagnostics
ADD COLUMN IF NOT EXISTS categories JSONB,
ADD COLUMN IF NOT EXISTS final_message TEXT,
ADD COLUMN IF NOT EXISTS schedule_days TEXT[],
ADD COLUMN IF NOT EXISTS notification_time TIME,
ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS chat_id TEXT UNIQUE;

-- Adăugăm index pentru căutare rapidă după chat_id
CREATE INDEX IF NOT EXISTS idx_diagnostics_chat_id ON diagnostics(chat_id);

