-- Update notification type ENUM to remove ticket references
-- Run this to update the database schema for the new notification types

BEGIN;

-- Update notifications table enum type
ALTER TABLE notifications ALTER COLUMN type DROP DEFAULT;
ALTER TABLE notifications ALTER COLUMN type TYPE TEXT;

-- Drop the old enum type
DROP TYPE IF EXISTS "enum_notifications_type";

-- Create the new enum type with request-based values
CREATE TYPE "enum_notifications_type" AS ENUM ('status_change', 'comment_added', 'request_assigned', 'request_updated');

-- Update the column to use the new enum type
ALTER TABLE notifications ALTER COLUMN type TYPE "enum_notifications_type" USING 
  CASE 
    WHEN type = 'ticket_assigned' THEN 'request_assigned'::"enum_notifications_type"
    WHEN type = 'ticket_updated' THEN 'request_updated'::"enum_notifications_type"
    WHEN type = 'status_change' THEN 'status_change'::"enum_notifications_type"
    WHEN type = 'comment_added' THEN 'comment_added'::"enum_notifications_type"
    ELSE 'status_change'::"enum_notifications_type"
  END;

COMMIT;

-- Show the results
SELECT 
    type,
    COUNT(*) as count
FROM notifications 
GROUP BY type 
ORDER BY type;