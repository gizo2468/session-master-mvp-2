-- Add seen_at column to track when student acknowledged feedback
ALTER TABLE hand_feedback 
ADD COLUMN seen_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;