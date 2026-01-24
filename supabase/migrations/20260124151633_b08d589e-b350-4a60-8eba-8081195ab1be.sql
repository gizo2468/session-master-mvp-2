-- Add table_duration column to session_tables for manual duration editing
ALTER TABLE session_tables 
ADD COLUMN table_duration INTEGER DEFAULT NULL;

COMMENT ON COLUMN session_tables.table_duration IS 'Custom duration in seconds (if manually set). When present, display components prioritize this over calculated duration from start/end times.';