-- Check existing policies first
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

-- Enable RLS if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them properly)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can insert notifications for any user" ON notifications;
DROP POLICY IF EXISTS "Admins can update notifications for any user" ON notifications;

-- Create policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT
    USING (recipient_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE
    USING (recipient_id = auth.uid());

CREATE POLICY "Users can insert own notifications" ON notifications
    FOR INSERT
    WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Admins can view all notifications" ON notifications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert notifications for any user" ON notifications
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update notifications for any user" ON notifications
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Verify the policies were created
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

-- Check if real-time is already enabled
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE tablename = 'notifications' 
AND pubname = 'supabase_realtime'; 