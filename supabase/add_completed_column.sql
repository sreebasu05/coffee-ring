-- Migration: Add 'completed' column to cr_check_ins
-- Run this in your Supabase project's SQL Editor
-- ================================================

-- Add the completed boolean column with a default of true
-- (existing check-ins are assumed completed since they were explicitly logged)
ALTER TABLE public.cr_check_ins
  ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT true;

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'cr_check_ins' AND table_schema = 'public'
ORDER BY ordinal_position;
