-- Add 'request_deleted' to notification type enum
-- This script adds the new notification type for request deletions

-- Update the enum type to include 'request_deleted'
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'request_deleted';

-- Alternative approach if the above doesn't work:
-- ALTER TABLE notifications ALTER COLUMN type DROP DEFAULT;
-- ALTER TABLE notifications ALTER COLUMN type TYPE TEXT;
-- UPDATE notifications SET type = 'request_deleted' WHERE type = 'request_deleted';
-- ALTER TABLE notifications ALTER COLUMN type TYPE notification_type_enum USING type::notification_type_enum;
-- ALTER TABLE notifications ALTER COLUMN type SET DEFAULT 'status_change';