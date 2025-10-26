-- Fluent Badge Sharing & Analytics Migration
-- Created: 2025-10-26
-- Purpose: Add public galleries, sharing metrics, and privacy settings

-- ============================================
-- MODIFY EXISTING TABLES
-- ============================================

-- Add sharing and privacy columns to owned_nfts
ALTER TABLE owned_nfts 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Add profile sharing settings
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS public_profile BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS profile_slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_view_count INTEGER DEFAULT 0;

-- Create profile slugs for existing users
UPDATE profiles 
SET profile_slug = id::TEXT 
WHERE profile_slug IS NULL;

-- ============================================
-- NEW TABLES
-- ============================================

-- Badge shares table: Track individual share events
CREATE TABLE IF NOT EXISTS badge_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_id UUID NOT NULL REFERENCES owned_nfts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'twitter', 'linkedin', 'discord', 'telegram', 'email', 'link', etc.
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badge views table: Track individual view events
CREATE TABLE IF NOT EXISTS badge_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_id UUID NOT NULL REFERENCES owned_nfts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL for anonymous views
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Badge sharing indexes
CREATE INDEX IF NOT EXISTS idx_badge_shares_badge_id ON badge_shares(badge_id);
CREATE INDEX IF NOT EXISTS idx_badge_shares_user_id ON badge_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_badge_shares_platform ON badge_shares(platform);
CREATE INDEX IF NOT EXISTS idx_badge_shares_shared_at ON badge_shares(shared_at DESC);

-- Badge views indexes
CREATE INDEX IF NOT EXISTS idx_badge_views_badge_id ON badge_views(badge_id);
CREATE INDEX IF NOT EXISTS idx_badge_views_user_id ON badge_views(user_id);
CREATE INDEX IF NOT EXISTS idx_badge_views_viewed_at ON badge_views(viewed_at DESC);

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_profile_slug ON profiles(profile_slug);
CREATE INDEX IF NOT EXISTS idx_profiles_public_profile ON profiles(public_profile);

-- Owned NFTs indexes for public gallery
CREATE INDEX IF NOT EXISTS idx_owned_nfts_is_public ON owned_nfts(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_owned_nfts_share_count ON owned_nfts(share_count DESC);
CREATE INDEX IF NOT EXISTS idx_owned_nfts_view_count ON owned_nfts(view_count DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on new tables
ALTER TABLE badge_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_views ENABLE ROW LEVEL SECURITY;

-- ============================
-- BADGE SHARES POLICIES
-- ============================

-- Allow public viewing of share counts
CREATE POLICY "Allow public viewing of badge shares"
ON badge_shares
FOR SELECT
USING (TRUE);

-- Allow users to insert their own shares
CREATE POLICY "Users can insert their own shares"
ON badge_shares
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ============================
-- BADGE VIEWS POLICIES
-- ============================

-- Allow public insertion of views
CREATE POLICY "Allow public viewing tracking"
ON badge_views
FOR INSERT
TO public
WITH CHECK (TRUE);

-- Allow viewing aggregated view data
CREATE POLICY "Allow public viewing of view counts"
ON badge_views
FOR SELECT
USING (TRUE);

-- ============================
-- UPDATE OWNED_NFTS POLICIES FOR PUBLIC VIEWING
-- ============================

-- Add policy to allow public viewing of badges marked as public
CREATE POLICY "Allow public viewing of public badges"
ON owned_nfts
FOR SELECT
USING (
    is_public = TRUE OR 
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
);

-- Update existing policy to respect privacy settings
DROP POLICY IF EXISTS "Users can view their own NFTs" ON owned_nfts;

CREATE POLICY "Users can view their own NFTs"
ON owned_nfts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================
-- UPDATE POLICY TO ALLOW VIEWING OWN BADGES
-- ============================

-- Users can always view their own badges
CREATE POLICY "Users can always view their own badges"
ON owned_nfts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update share count when a badge is shared
CREATE OR REPLACE FUNCTION update_badge_share_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE owned_nfts
    SET share_count = share_count + 1
    WHERE id = NEW.badge_id;
    
    UPDATE profiles
    SET share_count = share_count + 1
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update share count on insert
CREATE TRIGGER update_share_count_on_insert
    AFTER INSERT ON badge_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_badge_share_count();

-- Function to update view count when a badge is viewed
CREATE OR REPLACE FUNCTION update_badge_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE owned_nfts
    SET view_count = view_count + 1
    WHERE id = NEW.badge_id;
    
    -- Update user's total view count if they own the badge
    UPDATE profiles
    SET total_view_count = total_view_count + 1
    WHERE id = (
        SELECT user_id FROM owned_nfts WHERE id = NEW.badge_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update view count on insert
CREATE TRIGGER update_view_count_on_insert
    AFTER INSERT ON badge_views
    FOR EACH ROW
    EXECUTE FUNCTION update_badge_view_count();

-- Function to generate unique profile slug
CREATE OR REPLACE FUNCTION generate_profile_slug(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    username TEXT;
    slug TEXT;
    exists BOOLEAN;
BEGIN
    -- Try to get username from profile
    SELECT email INTO username FROM profiles WHERE id = user_id;
    
    -- Create slug from first part of email or use user ID
    IF username IS NOT NULL THEN
        username := SPLIT_PART(username, '@', 1);
        slug := LOWER(REGEXP_REPLACE(username, '[^a-zA-Z0-9]', '', 'g'));
    ELSE
        slug := SUBSTRING(user_id::TEXT, 1, 8);
    END IF;
    
    -- Ensure uniqueness
    SELECT TRUE INTO exists FROM profiles WHERE profile_slug = slug;
    
    IF exists THEN
        slug := slug || '-' || SUBSTRING(user_id::TEXT, 1, 6);
    END IF;
    
    RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER FUNCTIONS FOR PUBLIC QUERIES
-- ============================================

-- Function to get public badges for a user
CREATE OR REPLACE FUNCTION get_public_badges_for_user(user_slug TEXT)
RETURNS TABLE (
    id UUID,
    token_id INTEGER,
    domain TEXT,
    metadata_uri TEXT,
    tx_hash TEXT,
    score INTEGER,
    node_count INTEGER,
    minted_at TIMESTAMP WITH TIME ZONE,
    share_count INTEGER,
    view_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.token_id,
        n.domain,
        n.metadata_uri,
        n.tx_hash,
        n.score,
        n.node_count,
        n.minted_at,
        n.share_count,
        n.view_count
    FROM owned_nfts n
    JOIN profiles p ON n.user_id = p.id
    WHERE p.profile_slug = user_slug
    AND n.is_public = TRUE
    ORDER BY n.minted_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- NOTES
-- ============================================

-- 1. Badges are public by default (is_public = TRUE)
-- 2. Users can toggle privacy per badge
-- 3. Profile slugs are auto-generated from email or UUID
-- 4. Share and view counts are auto-updated via triggers
-- 5. Public badges can be viewed by anyone
-- 6. Users always have access to their own badges
-- 7. Analytics data is publicly accessible for transparency

