-- Add missing columns for multi-day and late-registration to session_tables
ALTER TABLE session_tables 
ADD COLUMN IF NOT EXISTS is_multi_day boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS late_registration boolean DEFAULT false;