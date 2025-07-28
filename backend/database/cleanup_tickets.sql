-- ======================================
-- CLEANUP SCRIPT: Remove All Ticket-Related Database Structures
-- ======================================
-- This script removes all tables, functions, triggers, and data 
-- related to the old ticket system that has been replaced by requests
-- ======================================

-- Step 1: Drop all triggers related to tickets
DROP TRIGGER IF EXISTS trigger_generate_ticket_number ON tickets;
DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
DROP TRIGGER IF EXISTS trigger_create_initial_status_history ON tickets;

-- Step 2: Drop dependent tables (in order to handle foreign key constraints)
DROP TABLE IF EXISTS tech_activities CASCADE;
DROP TABLE IF EXISTS ticket_comments CASCADE;
DROP TABLE IF EXISTS ticket_status_history CASCADE;
DROP TABLE IF EXISTS ticket_equipment CASCADE;

-- Step 3: Update notifications table to remove ticket references
-- First drop the constraint that references tickets
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS chk_notification_reference;

-- Remove the ticket_id column from notifications
ALTER TABLE notifications DROP COLUMN IF EXISTS ticket_id;

-- Recreate the constraint for requests only (if it doesn't already exist)
-- This ensures notifications can only reference requests going forward
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_notification_request_only'
    ) THEN
        ALTER TABLE notifications ADD CONSTRAINT chk_notification_request_only 
        CHECK (request_id IS NOT NULL);
    END IF;
END $$;

-- Step 4: Drop the main tickets table
DROP TABLE IF EXISTS tickets CASCADE;

-- Step 5: Drop ticket-related functions
DROP FUNCTION IF EXISTS generate_ticket_number() CASCADE;
DROP FUNCTION IF EXISTS create_initial_status_history() CASCADE;

-- Step 6: Drop any remaining ticket-related types/enums (if they exist)
DROP TYPE IF EXISTS ticket_status_enum CASCADE;
DROP TYPE IF EXISTS ticket_priority_enum CASCADE;

-- Step 7: Clean up any sequences that were used for tickets
DROP SEQUENCE IF EXISTS ticket_number_seq CASCADE;

-- Verification: Check that all ticket-related tables are gone
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_name LIKE '%ticket%' 
    AND table_schema = 'public';
    
    IF table_count > 0 THEN
        RAISE NOTICE 'WARNING: % table(s) with "ticket" in the name still exist', table_count;
    ELSE
        RAISE NOTICE 'SUCCESS: All ticket-related tables have been removed';
    END IF;
END $$;

-- Final verification: List any remaining objects that might reference tickets
SELECT 
    'CONSTRAINT' as object_type,
    tc.constraint_name,
    tc.table_name
FROM information_schema.table_constraints tc
WHERE tc.constraint_name LIKE '%ticket%'
    AND tc.table_schema = 'public'

UNION ALL

SELECT 
    'COLUMN' as object_type,
    c.column_name,
    c.table_name
FROM information_schema.columns c
WHERE c.column_name LIKE '%ticket%'
    AND c.table_schema = 'public'
    AND c.table_name != 'requests' -- Allow ticket-related columns in requests if they exist

ORDER BY object_type, table_name;

-- ======================================
-- CLEANUP COMPLETE
-- ======================================