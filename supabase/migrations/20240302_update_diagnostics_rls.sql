-- Drop existing policies
DROP POLICY IF EXISTS "Doctors can view their own diagnostics" ON diagnostics;
DROP POLICY IF EXISTS "Doctors can create diagnostics" ON diagnostics;
DROP POLICY IF EXISTS "Doctors can update their own diagnostics" ON diagnostics;
DROP POLICY IF EXISTS "Doctors can delete their own diagnostics" ON diagnostics;

-- Enable RLS
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for all operations
CREATE POLICY "Doctors can view their own diagnostics" ON diagnostics
    FOR SELECT
    TO authenticated
    USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can create diagnostics" ON diagnostics
    FOR INSERT
    TO authenticated
    WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Doctors can update their own diagnostics" ON diagnostics
    FOR UPDATE
    TO authenticated
    USING (doctor_id = auth.uid())
    WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Doctors can delete their own diagnostics" ON diagnostics
    FOR DELETE
    TO authenticated
    USING (doctor_id = auth.uid());

