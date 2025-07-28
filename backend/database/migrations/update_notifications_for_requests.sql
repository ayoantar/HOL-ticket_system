-- Update notifications table to support the new request system
-- Add request_id column and make ticket_id nullable

-- Add request_id column
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS request_id INTEGER;

-- Make ticket_id nullable
ALTER TABLE notifications 
ALTER COLUMN ticket_id DROP NOT NULL;

-- Add foreign key constraint for request_id
ALTER TABLE notifications 
ADD CONSTRAINT fk_notifications_request_id 
FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_request_id ON notifications(request_id);

-- Add constraint to ensure either ticket_id or request_id is provided (not both null)
ALTER TABLE notifications 
ADD CONSTRAINT chk_notification_reference 
CHECK (
  (ticket_id IS NOT NULL AND request_id IS NULL) OR 
  (ticket_id IS NULL AND request_id IS NOT NULL)
);