-- Fluent Badge System Migration
-- Created: 2025-10-26
-- Purpose: Add tables for quiz tracking and NFT ownership

-- ============================================
-- NEW TABLES
-- ============================================

-- Quizzes table: Track quiz attempts and scores
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    difficulty INTEGER DEFAULT 2 CHECK (difficulty BETWEEN 1 AND 3),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    passed BOOLEAN DEFAULT FALSE,
    questions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, domain, timestamp)
);

-- Owned NFTs table: Track minted badges
CREATE TABLE IF NOT EXISTS owned_nfts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token_id INTEGER NOT NULL,
    domain TEXT NOT NULL,
    metadata_uri TEXT NOT NULL,
    tx_hash TEXT UNIQUE,
    minted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    score INTEGER NOT NULL,
    node_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token_id),
    UNIQUE(user_id, domain) -- One badge per domain per user
);

-- Quiz questions cache: Pre-cached questions for performance
CREATE TABLE IF NOT EXISTS quiz_questions_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    questions_json JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, domain)
);

-- ============================================
-- MODIFY EXISTING TABLES
-- ============================================

-- Add mastery_level to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS mastery_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS badges_minted INTEGER DEFAULT 0;

-- ============================================
-- INDEXES
-- ============================================

-- Quizzes indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_domain ON quizzes(domain);
CREATE INDEX IF NOT EXISTS idx_quizzes_timestamp ON quizzes(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_quizzes_passed ON quizzes(passed);

-- Owned NFTs indexes
CREATE INDEX IF NOT EXISTS idx_owned_nfts_user_id ON owned_nfts(user_id);
CREATE INDEX IF NOT EXISTS idx_owned_nfts_domain ON owned_nfts(domain);
CREATE INDEX IF NOT EXISTS idx_owned_nfts_minted_at ON owned_nfts(minted_at DESC);
CREATE INDEX IF NOT EXISTS idx_owned_nfts_user_domain ON owned_nfts(user_id, domain);

-- Quiz questions cache indexes
CREATE INDEX IF NOT EXISTS idx_quiz_cache_user_domain ON quiz_questions_cache(user_id, domain);
CREATE INDEX IF NOT EXISTS idx_quiz_cache_generated_at ON quiz_questions_cache(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_cache_used ON quiz_questions_cache(used);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE owned_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions_cache ENABLE ROW LEVEL SECURITY;

-- ============================
-- QUIZZES POLICIES
-- ============================

-- Users can view their own quiz results
CREATE POLICY "Users can view their own quizzes"
ON quizzes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own quiz results
CREATE POLICY "Users can insert their own quizzes"
ON quizzes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own quiz results
CREATE POLICY "Users can update their own quizzes"
ON quizzes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================
-- OWNED_NFTS POLICIES
-- ============================

-- Users can view their own NFTs
CREATE POLICY "Users can view their own NFTs"
ON owned_nfts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own NFTs
CREATE POLICY "Users can insert their own NFTs"
ON owned_nfts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own NFTs
CREATE POLICY "Users can update their own NFTs"
ON owned_nfts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================
-- QUIZ_QUESTIONS_CACHE POLICIES
-- ============================

-- Users can view their own cached questions
CREATE POLICY "Users can view their own cached questions"
ON quiz_questions_cache
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own cached questions
CREATE POLICY "Users can insert their own cached questions"
ON quiz_questions_cache
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own cached questions
CREATE POLICY "Users can update their own cached questions"
ON quiz_questions_cache
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own cached questions
CREATE POLICY "Users can delete their own cached questions"
ON quiz_questions_cache
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update badges_minted counter
CREATE OR REPLACE FUNCTION update_badges_minted_counter()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles
    SET badges_minted = (
        SELECT COUNT(*) 
        FROM owned_nfts 
        WHERE user_id = NEW.user_id
    )
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update badges_minted on owned_nfts insert
CREATE TRIGGER update_badges_minted_on_insert
    AFTER INSERT ON owned_nfts
    FOR EACH ROW
    EXECUTE FUNCTION update_badges_minted_counter();

-- Function to update mastery_level based on quiz scores
CREATE OR REPLACE FUNCTION update_mastery_level()
RETURNS TRIGGER AS $$
DECLARE
    avg_score DECIMAL;
BEGIN
    -- Calculate average quiz score for this domain
    SELECT AVG(score) INTO avg_score
    FROM quizzes
    WHERE user_id = NEW.user_id 
    AND domain = NEW.domain
    AND passed = TRUE;
    
    -- Update mastery level based on average score
    IF avg_score >= 90 THEN
        NEW.mastery_level := 3; -- Expert
    ELSIF avg_score >= 80 THEN
        NEW.mastery_level := 2; -- Intermediate
    ELSIF avg_score >= 60 THEN
        NEW.mastery_level := 1; -- Beginner
    ELSE
        NEW.mastery_level := 0; -- Novice
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- NOTES
-- ============================================

-- 1. The owned_nfts table enforces one badge per domain per user via UNIQUE constraint
-- 2. The badges_minted counter is automatically updated via trigger
-- 3. Quiz questions are cached in quiz_questions_cache for performance
-- 4. All tables have RLS enabled with user-scoped policies
-- 5. The mastery_level is a calculated field that updates based on quiz scores
-- 6. Token IDs are integer-based and auto-incremented by the smart contract

