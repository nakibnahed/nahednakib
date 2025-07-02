-- Engagement System Database Schema
-- This creates tables for likes, favorites, and comments for both portfolios and blogs

-- Table for user likes (both portfolios and blogs)
CREATE TABLE IF NOT EXISTS user_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('portfolio', 'blog')),
  content_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

-- Table for user favorites (both portfolios and blogs)
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('portfolio', 'blog')),
  content_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

-- Table for comments (both portfolios and blogs)
CREATE TABLE IF NOT EXISTS user_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('portfolio', 'blog')),
  content_id UUID NOT NULL,
  comment TEXT NOT NULL,
  parent_id UUID REFERENCES user_comments(id) ON DELETE CASCADE, -- For nested replies
  is_approved BOOLEAN DEFAULT true, -- For moderation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_likes_content ON user_likes(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_user ON user_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_content ON user_favorites(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_comments_content ON user_comments(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_user_comments_user ON user_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_comments_parent ON user_comments(parent_id);

-- Views for aggregated data
CREATE OR REPLACE VIEW content_engagement_stats AS
SELECT 
  content_type,
  content_id,
  COUNT(DISTINCT ul.user_id) as likes_count,
  COUNT(DISTINCT uf.user_id) as favorites_count,
  COUNT(DISTINCT uc.id) as comments_count
FROM (
  SELECT DISTINCT content_type, content_id FROM user_likes
  UNION
  SELECT DISTINCT content_type, content_id FROM user_favorites
  UNION
  SELECT DISTINCT content_type, content_id FROM user_comments
) as all_content
LEFT JOIN user_likes ul ON ul.content_type = all_content.content_type 
  AND ul.content_id = all_content.content_id
LEFT JOIN user_favorites uf ON uf.content_type = all_content.content_type 
  AND uf.content_id = all_content.content_id
LEFT JOIN user_comments uc ON uc.content_type = all_content.content_type 
  AND uc.content_id = all_content.content_id 
  AND uc.is_approved = true
GROUP BY content_type, content_id;

-- RLS Policies (optional, but recommended for security)
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_comments ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own likes/favorites/comments
CREATE POLICY "Users can manage their own likes" ON user_likes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" ON user_favorites
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own comments" ON user_comments
  FOR ALL USING (auth.uid() = user_id);

-- Everyone can read approved content
CREATE POLICY "Everyone can read likes" ON user_likes
  FOR SELECT USING (true);

CREATE POLICY "Everyone can read favorites" ON user_favorites
  FOR SELECT USING (true);

CREATE POLICY "Everyone can read approved comments" ON user_comments
  FOR SELECT USING (is_approved = true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comments updated_at
CREATE TRIGGER update_user_comments_updated_at
  BEFORE UPDATE ON user_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
