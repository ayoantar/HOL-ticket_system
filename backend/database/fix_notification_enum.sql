-- Simple fix for notification enum types
-- Update existing records first, then recreate the enum

BEGIN;

-- Update existing notification records to use request-based terminology
UPDATE notifications SET type = 'request_assigned' WHERE type = 'ticket_assigned';
UPDATE notifications SET type = 'request_updated' WHERE type = 'ticket_updated';

-- Convert column to text temporarily
ALTER TABLE notifications ALTER COLUMN type TYPE TEXT;

-- Drop the old enum if it exists
DROP TYPE IF EXISTS "enum_notifications_type";

-- Create new enum with request-based values
CREATE TYPE "enum_notifications_type" AS ENUM ('status_change', 'comment_added', 'request_assigned', 'request_updated');

-- Convert back to enum type
ALTER TABLE notifications ALTER COLUMN type TYPE "enum_notifications_type" USING type::"enum_notifications_type";

COMMIT;

-- Show the updated results
SELECT 
    type,
    COUNT(*) as count,
    CASE 
        WHEN type = 'status_change' THEN 'Request status changes'
        WHEN type = 'comment_added' THEN 'New comments on requests'
        WHEN type = 'request_assigned' THEN 'Request assignments'
        WHEN type = 'request_updated' THEN 'Request updates'
    END as description
FROM notifications 
GROUP BY type 
ORDER BY type;