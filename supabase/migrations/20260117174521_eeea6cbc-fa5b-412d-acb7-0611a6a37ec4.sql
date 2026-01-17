-- Add feedback_id column to notifications table for linking feedback-related notifications
ALTER TABLE notifications 
ADD COLUMN feedback_id UUID REFERENCES hand_feedback(id) ON DELETE CASCADE;

-- Add index for faster lookups when deleting by feedback_id
CREATE INDEX idx_notifications_feedback_id ON notifications(feedback_id) WHERE feedback_id IS NOT NULL;