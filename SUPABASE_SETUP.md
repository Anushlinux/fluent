# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new project
4. Note down your **Project URL** and **anon/public key**

## 2. Database Schema

Execute these SQL commands in your Supabase SQL Editor:

### Create Tables

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (linked to auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Captured sentences table
CREATE TABLE captured_sentences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  sentence TEXT NOT NULL,
  terms TEXT[] NOT NULL DEFAULT '{}',
  context TEXT,
  framework TEXT,
  secondary_context TEXT,
  confidence INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Graph nodes table
CREATE TABLE graph_nodes (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('topic', 'sentence')),
  label TEXT NOT NULL,
  terms TEXT[] DEFAULT '{}',
  context TEXT,
  framework TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  confidence INTEGER,
  quiz_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Graph edges table
CREATE TABLE graph_edges (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  weight DECIMAL(3,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('term-match', 'context-match', 'both')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_captured_sentences_user_id ON captured_sentences(user_id);
CREATE INDEX idx_captured_sentences_timestamp ON captured_sentences(timestamp);
CREATE INDEX idx_graph_nodes_user_id ON graph_nodes(user_id);
CREATE INDEX idx_graph_nodes_type ON graph_nodes(type);
CREATE INDEX idx_graph_edges_user_id ON graph_edges(user_id);
CREATE INDEX idx_graph_edges_source ON graph_edges(source_id);
CREATE INDEX idx_graph_edges_target ON graph_edges(target_id);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE captured_sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_edges ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Captured sentences policies
CREATE POLICY "Users can view own sentences"
  ON captured_sentences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sentences"
  ON captured_sentences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sentences"
  ON captured_sentences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sentences"
  ON captured_sentences FOR DELETE
  USING (auth.uid() = user_id);

-- Graph nodes policies
CREATE POLICY "Users can view own nodes"
  ON graph_nodes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nodes"
  ON graph_nodes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nodes"
  ON graph_nodes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own nodes"
  ON graph_nodes FOR DELETE
  USING (auth.uid() = user_id);

-- Graph edges policies
CREATE POLICY "Users can view own edges"
  ON graph_edges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own edges"
  ON graph_edges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own edges"
  ON graph_edges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own edges"
  ON graph_edges FOR DELETE
  USING (auth.uid() = user_id);
```

### Trigger for Profile Creation

```sql
-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 3. Authentication Configuration

1. Go to Authentication → Settings in Supabase dashboard
2. Enable **Email** auth provider
3. Configure **Redirect URLs**:
   - Add `http://localhost:3000/auth/callback` for local development
   - Add your production URL when deploying (e.g., `https://yourdomain.com/auth/callback`)
   - Add extension URL: `chrome-extension://YOUR_EXTENSION_ID/auth/callback`

## 4. Environment Variables

### Website (.env.local)

Create `website/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Extension

Environment variables will be injected during build. Update `extension/wxt.config.ts` to include them.

## 5. Get Your Credentials

1. Go to Project Settings → API in Supabase dashboard
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## 6. Test Connection

After setting up, test the connection:

```sql
-- Check if tables are created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';
```

## Notes

- The `anon` key is safe to use in client-side code (browser extension and website)
- RLS policies ensure users can only access their own data
- All timestamps are stored in UTC
- The trigger automatically creates a profile when a user signs up

