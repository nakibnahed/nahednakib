-- Create user_views table for tracking views
CREATE TABLE IF NOT EXISTS user_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('portfolio', 'blog')),
  content_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_views_content ON user_views(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_user_views_viewed_at ON user_views(viewed_at);

-- Enable RLS
ALTER TABLE user_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow anonymous view tracking" ON user_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow reading view counts" ON user_views
  FOR SELECT USING (true);

-- Add to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE user_views; 