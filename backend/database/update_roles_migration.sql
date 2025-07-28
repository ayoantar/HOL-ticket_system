-- Migration script to update user roles from old to new system
-- Run this after updating the ENUM type in the database

-- First, create the new enum type with new values
-- Note: This requires manual intervention in PostgreSQL

-- Step 1: Add new enum values to the existing role enum
-- (PostgreSQL doesn't allow direct enum modification, so we need to add the new values first)

-- Add new enum values if they don't exist
ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'user';
ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'dept_lead';

-- Step 2: Update existing role mappings
-- Map 'client' -> 'user'
UPDATE users SET role = 'user' WHERE role = 'client';

-- Map 'lead' -> 'dept_lead'  
UPDATE users SET role = 'dept_lead' WHERE role = 'lead';

-- 'employee' and 'admin' remain the same

-- Step 3: Remove old enum values (requires recreating the enum)
-- This part requires careful handling in production:

-- Create a new enum type with only the desired values
CREATE TYPE "enum_users_role_new" AS ENUM ('user', 'employee', 'dept_lead', 'admin');

-- Update the column to use the new type
ALTER TABLE users ALTER COLUMN role TYPE "enum_users_role_new" USING (role::text::"enum_users_role_new");

-- Drop the old enum type
DROP TYPE "enum_users_role";

-- Rename the new type to the original name
ALTER TYPE "enum_users_role_new" RENAME TO "enum_users_role";

-- Update the default value
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

-- Verify the migration
SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role;

-- Display a summary of the changes
SELECT 
    'Migration completed successfully' as status,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as users_count,
    COUNT(CASE WHEN role = 'employee' THEN 1 END) as employees_count,
    COUNT(CASE WHEN role = 'dept_lead' THEN 1 END) as dept_leads_count,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins_count,
    COUNT(*) as total_users
FROM users;