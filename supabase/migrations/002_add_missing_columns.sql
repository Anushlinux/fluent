-- Add missing columns to captured_sentences table
-- Migration: 002_add_missing_columns.sql
-- Purpose: Add url and asi_extract columns that are missing from the database
-- Created: 2025-01-25

-- Add missing columns to captured_sentences table
ALTER TABLE captured_sentences 
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS asi_extract JSONB DEFAULT '{}';

-- Create index for url column (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_captured_sentences_url ON captured_sentences(url);

-- Verify columns exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'captured_sentences' 
        AND column_name = 'url'
    ) THEN
        RAISE EXCEPTION 'url column was not added successfully';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'captured_sentences' 
        AND column_name = 'asi_extract'
    ) THEN
        RAISE EXCEPTION 'asi_extract column was not added successfully';
    END IF;
    
    RAISE NOTICE 'All columns added successfully!';
END $$;
