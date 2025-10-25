# Supabase Setup Guide

Complete guide for setting up Supabase database for the Fluent Knowledge Graph Platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Environment Variables](#environment-variables)
5. [Verify Setup](#verify-setup)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Supabase account (free tier works fine)
- Supabase project created
- Access to Supabase SQL Editor or Supabase CLI

## Quick Start

### Option 1: Using Supabase Dashboard (Recommended for Beginners)

1. **Go to your Supabase project** at https://app.supabase.com
2. **Navigate to SQL Editor** (left sidebar)
3. **Copy the entire contents** of `supabase/migrations/001_initial_schema.sql`
4. **Paste into SQL Editor** and click "Run"
5. **Wait for success message** (should take ~10 seconds)

### Option 2: Using Supabase CLI (Recommended for Developers)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project (you'll need your project reference)
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push

# Alternative: Apply migration directly
supabase db reset
```

---

## Detailed Setup

### Step 1: Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - **Project Name**: `fluent-knowledge-graph` (or your preferred name)
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
4. Wait for project to be created (~2 minutes)

### Step 2: Enable pgvector Extension

The migration file attempts to enable `pgvector` automatically, but verify it's enabled:

1. Go to **Database** → **Extensions** in Supabase dashboard
2. Search for "vector"
3. Enable **pgvector** if not already enabled

### Step 3: Run Migration

Follow **Quick Start Option 1** or **Option 2** above.

**Important**: If you encounter errors about missing columns (`url` or `asi_extract`), run the additional migration:

1. **Copy contents** of `supabase/migrations/002_add_missing_columns.sql`
2. **Paste into SQL Editor** and click "Run"
3. **Verify success message** shows "All columns added successfully!"

### Step 4: Verify Tables Were Created

1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - ✅ `profiles`
   - ✅ `captured_sentences`
   - ✅ `graph_nodes`
   - ✅ `graph_edges`
   - ✅ `user_sessions`
   - ✅ `insights`

### Step 5: Verify RLS Policies

1. Go to **Authentication** → **Policies**
2. Select each table and verify policies exist
3. You should see 4 policies per table (SELECT, INSERT, UPDATE, DELETE)

---

## Environment Variables

### For Extension (`extension/.env`)

Create or update `.env` file:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_WEBSITE_URL=http://localhost:3001
```

### For Website (`website/.env.local`)

Create or update `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### For Agent (`agent/.env`)

Create or update `.env` file:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
ASI_ONE_API_KEY=your-asi-one-api-key
```

### Where to Find These Values

1. **Supabase URL**: Project Settings → API → Project URL
2. **Anon Key**: Project Settings → API → Project API keys → `anon` `public`

**⚠️ Important**: Use the `anon` key, NOT the `service_role` key for client-side applications.

---

## Verify Setup

### Test 1: Check Tables Exist

```sql
-- Run in SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected output: 6 tables (captured_sentences, graph_edges, graph_nodes, insights, profiles, user_sessions)

### Test 2: Verify RLS is Enabled

```sql
-- Run in SQL Editor
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`

### Test 3: Check Indexes

```sql
-- Run in SQL Editor
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

You should see multiple indexes per table (especially on user_id, timestamp, context)

### Test 4: Verify pgvector Extension

```sql
-- Run in SQL Editor
SELECT * FROM pg_extension WHERE extname = 'vector';
```

Should return 1 row if vector extension is enabled.

### Test 5: Test RLS Policies

1. Create a test user via Supabase Auth
2. Try to insert data as that user
3. Try to query data as that user
4. Verify you can only see your own data

---

## Database Schema Overview

### Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| **profiles** | User profiles | id, email, xp, streak_days |
| **captured_sentences** | Raw captured learning data | sentence, terms[], context, asi_extract, embedding |
| **graph_nodes** | Knowledge graph nodes | type, label, context, quiz_completed |
| **graph_edges** | Relationships between nodes | source_id, target_id, weight |
| **user_sessions** | Multi-turn chat sessions | session_data JSONB |
| **insights** | Proactive nudges/gaps | insight_type, content, metadata |

### Key Features

- **Vector Embeddings**: `captured_sentences.embedding` column ready for RAG (1536 dimensions)
- **RLS Enabled**: All tables restrict access to user's own data
- **Indexes**: Optimized for common queries (user_id, timestamp, context)
- **Auto Profile Creation**: Profiles automatically created on user signup (via trigger)
- **JSONB Support**: Flexible metadata storage in `asi_extract`, `session_data`, `metadata` columns

---

## Troubleshooting

### Issue: "Could not find the 'url' column" or "Could not find the 'asi_extract' column"

**Solution**: Run the additional migration:
1. Go to SQL Editor in Supabase dashboard
2. Copy contents of `supabase/migrations/002_add_missing_columns.sql`
3. Paste and click "Run"
4. Verify success message shows "All columns added successfully!"

### Issue: "extension 'vector' does not exist"

**Solution**: Enable pgvector manually:
1. Go to Database → Extensions
2. Enable "pgvector"
3. Re-run migration

### Issue: "relation already exists"

**Solution**: Tables already created. If you need to reset:
```sql
-- WARNING: This deletes all data!
DROP TABLE IF EXISTS insights CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS graph_edges CASCADE;
DROP TABLE IF EXISTS graph_nodes CASCADE;
DROP TABLE IF EXISTS captured_sentences CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```
Then re-run migration.

### Issue: RLS policies block all access

**Solution**: Verify you're authenticated:
1. Check `auth.uid()` returns your user ID:
   ```sql
   SELECT auth.uid();
   ```
2. If null, you're not authenticated. Sign in via extension/website first.

### Issue: Can't connect from extension/website

**Solution**: 
1. Verify environment variables are correct
2. Check CORS settings in Supabase dashboard (should allow your domain)
3. Verify anon key is correct (not service_role key)

### Issue: Slow queries

**Solution**:
1. Check if indexes are being used:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM captured_sentences WHERE user_id = 'your-uuid';
   ```
2. Add additional indexes if needed for your query patterns

### Issue: Vector column not working

**Solution**: 
- Vector embeddings are prepared but not yet populated
- See `VECTOR_RAG_TODO.md` for implementation plan
- For now, this column will be NULL (that's expected)

---

## Next Steps

After setup is complete:

1. ✅ **Test Authentication**: Sign up via extension or website
2. ✅ **Capture Sentence**: Test sentence capture flow
3. ✅ **Verify Data**: Check Supabase Table Editor to see data
4. ✅ **Test Graph**: View graph on website
5. ✅ **Run Agent**: Start Python agent and test `/explain-sentence` endpoint

---

## Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **pgvector Docs**: https://github.com/pgvector/pgvector
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **Supabase CLI**: https://supabase.com/docs/guides/cli

---

## Schema Diagram

```
┌─────────────┐
│   profiles  │
│  (auth ext) │
└──────┬──────┘
       │
       │ 1:N
       ├─────────────────────┬─────────────────────┬─────────────────────┐
       │                     │                     │                     │
       ▼                     ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐  ┌──────────────┐
│captured_sentences│  │ graph_nodes  │  │  user_sessions   │  │   insights   │
│                  │  │              │  │                  │  │              │
│ - sentence       │  │ - type       │  │ - session_data   │  │ - type       │
│ - terms[]        │  │ - label      │  │ - started_at     │  │ - content    │
│ - context        │  │ - quiz_done  │  │ - ended_at       │  │ - metadata   │
│ - embedding      │  └──────┬───────┘  └──────────────────┘  │ - is_read    │
│ - asi_extract    │         │                                 └──────────────┘
└──────────────────┘         │
                             │ N:N
                             ▼
                      ┌──────────────┐
                      │ graph_edges  │
                      │              │
                      │ - source_id  │
                      │ - target_id  │
                      │ - weight     │
                      └──────────────┘
```

---

**Last Updated**: 2025-01-25  
**Schema Version**: 001  
**Migration File**: `supabase/migrations/001_initial_schema.sql`

