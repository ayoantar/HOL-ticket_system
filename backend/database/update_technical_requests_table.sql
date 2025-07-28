-- Update technical_requests table to include all missing fields
-- This script adds the fields that are captured in the form but not stored in the database

-- Create the severity enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE severity_enum AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to technical_requests table
ALTER TABLE technical_requests 
ADD COLUMN IF NOT EXISTS issue_type VARCHAR(255),
ADD COLUMN IF NOT EXISTS severity severity_enum DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS steps_to_reproduce TEXT,
ADD COLUMN IF NOT EXISTS device_info TEXT,
ADD COLUMN IF NOT EXISTS error_messages TEXT,
ADD COLUMN IF NOT EXISTS attempted_solutions TEXT,
ADD COLUMN IF NOT EXISTS attachments_path VARCHAR(500),
ADD COLUMN IF NOT EXISTS issue_started TIMESTAMP WITH TIME ZONE;

-- If the enum already exists but with different values, recreate it
-- You may need to run this manually if there are existing records:
-- ALTER TYPE severity_enum ADD VALUE IF NOT EXISTS 'low';
-- ALTER TYPE severity_enum ADD VALUE IF NOT EXISTS 'medium';
-- ALTER TYPE severity_enum ADD VALUE IF NOT EXISTS 'high';
-- ALTER TYPE severity_enum ADD VALUE IF NOT EXISTS 'critical';