-- Fluent Knowledge Graph - Initial Database Schema
-- Created: 2025-01-25
-- Purpose: Complete database schema with RLS policies for Fluent application

-- ============================================
-- EXTENSIONS
-- ============================================

-- Enable pgvector for future RAG implementation
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- TABLES
-- ============================================

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    xp INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Captured sentences table (raw learning data)
CREATE TABLE IF NOT EXISTS captured_sentences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sentence TEXT NOT NULL,
    terms TEXT[] DEFAULT '{}',
    context TEXT,
    framework TEXT,
    secondary_context TEXT,
    confidence INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    url TEXT,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    asi_extract JSONB DEFAULT '{}',
    embedding vector(1536), -- For future RAG implementation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Graph nodes table (processed knowledge graph nodes)
CREATE TABLE IF NOT EXISTS graph_nodes (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('topic', 'sentence')),
    label TEXT NOT NULL,
    terms TEXT[] DEFAULT '{}',
    context TEXT,
    framework TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confidence INTEGER DEFAULT 0,
    quiz_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Graph edges table (relationships between nodes)
CREATE TABLE IF NOT EXISTS graph_edges (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    source_id TEXT NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    target_id TEXT NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL DEFAULT 0.5,
    type TEXT CHECK (type IN ('term-match', 'context-match', 'both')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, source_id, target_id)
);

-- User sessions table (for multi-turn chat)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_data JSONB DEFAULT '{}',
    session_type TEXT DEFAULT 'chat', -- 'chat', 'quiz', 'analysis'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insights table (for proactive nudges and gap detection)
CREATE TABLE IF NOT EXISTS insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL CHECK (insight_type IN ('gap_detected', 'quiz_suggested', 'learning_path', 'cluster_weak', 'milestone_reached')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp DESC);

-- Captured sentences indexes
CREATE INDEX IF NOT EXISTS idx_captured_sentences_user_id ON captured_sentences(user_id);
CREATE INDEX IF NOT EXISTS idx_captured_sentences_timestamp ON captured_sentences(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_captured_sentences_context ON captured_sentences(context);
CREATE INDEX IF NOT EXISTS idx_captured_sentences_terms ON captured_sentences USING GIN(terms);

-- Graph nodes indexes
CREATE INDEX IF NOT EXISTS idx_graph_nodes_user_id ON graph_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON graph_nodes(type);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_context ON graph_nodes(context);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_quiz_completed ON graph_nodes(quiz_completed);

-- Graph edges indexes
CREATE INDEX IF NOT EXISTS idx_graph_edges_user_id ON graph_edges(user_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_source_id ON graph_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_target_id ON graph_edges(target_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_weight ON graph_edges(weight DESC);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at DESC);

-- Insights indexes
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_is_read ON insights(is_read);
CREATE INDEX IF NOT EXISTS idx_insights_insight_type ON insights(insight_type);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE captured_sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- ============================
-- PROFILES POLICIES
-- ============================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================
-- CAPTURED_SENTENCES POLICIES
-- ============================

-- Users can view their own sentences
CREATE POLICY "Users can view their own sentences"
ON captured_sentences
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own sentences
CREATE POLICY "Users can insert their own sentences"
ON captured_sentences
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sentences
CREATE POLICY "Users can update their own sentences"
ON captured_sentences
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sentences
CREATE POLICY "Users can delete their own sentences"
ON captured_sentences
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================
-- GRAPH_NODES POLICIES
-- ============================

-- Users can view their own graph nodes
CREATE POLICY "Users can view their own graph nodes"
ON graph_nodes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own graph nodes
CREATE POLICY "Users can insert their own graph nodes"
ON graph_nodes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own graph nodes
CREATE POLICY "Users can update their own graph nodes"
ON graph_nodes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own graph nodes
CREATE POLICY "Users can delete their own graph nodes"
ON graph_nodes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================
-- GRAPH_EDGES POLICIES
-- ============================

-- Users can view their own graph edges
CREATE POLICY "Users can view their own graph edges"
ON graph_edges
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own graph edges
CREATE POLICY "Users can insert their own graph edges"
ON graph_edges
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own graph edges
CREATE POLICY "Users can update their own graph edges"
ON graph_edges
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own graph edges
CREATE POLICY "Users can delete their own graph edges"
ON graph_edges
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================
-- USER_SESSIONS POLICIES
-- ============================

-- Users can view their own sessions
CREATE POLICY "Users can view their own sessions"
ON user_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert their own sessions"
ON user_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update their own sessions"
ON user_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete their own sessions"
ON user_sessions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================
-- INSIGHTS POLICIES
-- ============================

-- Users can view their own insights
CREATE POLICY "Users can view their own insights"
ON insights
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own insights (typically via agent)
CREATE POLICY "Users can insert their own insights"
ON insights
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own insights (mark as read/dismissed)
CREATE POLICY "Users can update their own insights"
ON insights
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own insights
CREATE POLICY "Users can delete their own insights"
ON insights
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update profiles.updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, xp, created_at)
    VALUES (NEW.id, NEW.email, 0, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INITIAL DATA (OPTIONAL)
-- ============================================

-- No initial data needed for this schema

-- ============================================
-- NOTES
-- ============================================

-- 1. Vector embeddings (embedding column) are prepared but not yet populated
--    See VECTOR_RAG_TODO.md for implementation plan
--
-- 2. All tables have RLS enabled with policies that restrict access to user's own data
--    Test RLS by trying to access another user's data after authentication
--
-- 3. Indexes are created for common query patterns:
--    - user_id (most common filter)
--    - timestamp (for ordering/filtering by date)
--    - context (for filtering by category)
--    - terms (GIN index for array searches)
--
-- 4. The profiles table is automatically populated via trigger when users sign up
--
-- 5. Graph edges have a unique constraint to prevent duplicate edges between same nodes
--
-- 6. Insights support multiple types: gap_detected, quiz_suggested, learning_path, etc.

