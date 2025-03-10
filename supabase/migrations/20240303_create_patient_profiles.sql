-- Create the patient_profiles table
CREATE TABLE IF NOT EXISTS patient_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  occupation TEXT,
  presentation TEXT,
  purpose TEXT,
  profile_image_url TEXT,
  CONSTRAINT patient_profiles_email_key UNIQUE (email)
);

-- Enable RLS
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
ON patient_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON patient_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON patient_profiles TO authenticated;

-- Create storage bucket for profile images if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('profile-images', 'profile-images')
ON CONFLICT DO NOTHING;

-- Set up storage policies
CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profile-images' );

CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

