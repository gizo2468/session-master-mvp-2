-- First, clean up existing duplicate notifications (keep the oldest one by keeping smaller id)
DELETE FROM notifications a
USING notifications b
WHERE a.id > b.id
  AND a.recipient_user_id = b.recipient_user_id
  AND a.type = b.type
  AND a.hand_id = b.hand_id
  AND a.hand_id IS NOT NULL;

DELETE FROM notifications a
USING notifications b
WHERE a.id > b.id
  AND a.recipient_user_id = b.recipient_user_id
  AND a.type = b.type
  AND a.connection_id = b.connection_id
  AND a.connection_id IS NOT NULL;

-- Now add unique partial index to prevent duplicate notifications for the same event
CREATE UNIQUE INDEX IF NOT EXISTS notifications_unique_hand_event 
ON notifications (recipient_user_id, type, hand_id)
WHERE hand_id IS NOT NULL;

-- Add unique partial index for connection-based notifications
CREATE UNIQUE INDEX IF NOT EXISTS notifications_unique_connection_event 
ON notifications (recipient_user_id, type, connection_id)
WHERE connection_id IS NOT NULL;