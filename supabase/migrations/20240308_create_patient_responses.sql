-- Create table for patient responses
CREATE TABLE IF NOT EXISTS patient_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  patient_id UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  diagnostic_id UUID NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  question_text TEXT NOT NULL,
  response TEXT NOT NULL,
  response_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Composite index for efficient querying
  UNIQUE(patient_id, diagnostic_id, category_name, question_text, response_date)
);

-- Enable RLS
ALTER TABLE patient_responses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Patients can view their own responses"
ON patient_responses FOR SELECT
TO authenticated
USING (patient_id = auth.uid());

CREATE POLICY "Patients can insert their own responses"
ON patient_responses FOR INSERT
TO authenticated
WITH CHECK (patient_id = auth.uid());

-- Create table for notification settings
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  notification_time TIME NOT NULL DEFAULT '09:00',
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their notification settings"
ON notification_settings FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create table to track notification status
CREATE TABLE IF NOT EXISTS notification_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  patient_id UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  diagnostic_id UUID NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  notification_date DATE NOT NULL,
  notification_sent BOOLEAN NOT NULL DEFAULT false,
  notification_read BOOLEAN NOT NULL DEFAULT false,
  
  UNIQUE(patient_id, diagnostic_id, notification_date)
);

-- Enable RLS
ALTER TABLE notification_status ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their notification status"
ON notification_status FOR SELECT
TO authenticated
USING (patient_id = auth.uid());

