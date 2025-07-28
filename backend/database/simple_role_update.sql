-- Simple role update script for development environments
-- This script can be used if you're comfortable with dropping and recreating the ENUM

BEGIN;

-- Temporarily change all users to admin role to avoid enum constraint issues
UPDATE users SET role = 'admin';

-- Drop the old enum constraint
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
ALTER TABLE users ALTER COLUMN role TYPE TEXT;

-- Drop the old enum type
DROP TYPE IF EXISTS "enum_users_role";

-- Create the new enum type with updated values
CREATE TYPE "enum_users_role" AS ENUM ('user', 'employee', 'dept_lead', 'admin');

-- Update the column to use the new enum type
ALTER TABLE users ALTER COLUMN role TYPE "enum_users_role" USING 
  CASE 
    WHEN role = 'client' THEN 'user'::"enum_users_role"
    WHEN role = 'lead' THEN 'dept_lead'::"enum_users_role"
    WHEN role = 'employee' THEN 'employee'::"enum_users_role"
    WHEN role = 'admin' THEN 'admin'::"enum_users_role"
    ELSE 'user'::"enum_users_role"
  END;

-- Set the new default value
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

-- For development, let's create some sample users with different roles
-- Update existing users based on their current characteristics

-- Keep admins as admin
-- Users without departments become 'user'
UPDATE users SET role = 'user' WHERE department IS NULL AND role != 'admin';

-- Users with departments but not leads become 'employee'  
UPDATE users SET role = 'employee' WHERE department IS NOT NULL AND is_lead = false AND role != 'admin';

-- Users who are leads become 'dept_lead'
UPDATE users SET role = 'dept_lead' WHERE is_lead = true AND role != 'admin';

COMMIT;

-- Show the results
SELECT 
    role,
    COUNT(*) as count,
    CASE 
        WHEN role = 'user' THEN 'Regular users who submit requests'
        WHEN role = 'employee' THEN 'Department employees who handle requests'
        WHEN role = 'dept_lead' THEN 'Department leads who can assign requests'
        WHEN role = 'admin' THEN 'System administrators'
    END as description
FROM users 
GROUP BY role 
ORDER BY 
    CASE role 
        WHEN 'admin' THEN 1 
        WHEN 'dept_lead' THEN 2 
        WHEN 'employee' THEN 3 
        WHEN 'user' THEN 4 
    END;