-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT
    USING (recipient_id = auth.uid());

-- Policy 2: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE
    USING (recipient_id = auth.uid());

-- Policy 3: Users can insert notifications (for welcome notifications)
CREATE POLICY "Users can insert own notifications" ON notifications
    FOR INSERT
    WITH CHECK (recipient_id = auth.uid());

-- Policy 4: Admins can view all notifications (for admin panel)
CREATE POLICY "Admins can view all notifications" ON notifications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy 5: Admins can insert notifications for any user
CREATE POLICY "Admins can insert notifications for any user" ON notifications
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy 6: Admins can update notifications for any user
CREATE POLICY "Admins can update notifications for any user" ON notifications
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Enable real-time for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications; 