-- Update user roles to support employee and lead roles
-- This migration adds support for the new role system

-- First, drop the existing check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new roles to support the updated system
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('client', 'admin', 'employee', 'lead'));

-- Add department column for role-based access
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- Update the admin user to ensure it exists and has proper access
INSERT INTO users (name, email, password, role, company) 
VALUES ('Admin User', 'admin@example.com', '$2a$10$8K1p/a0dPEG8.EaSj1W8HOkZ7ZhV4s.FQ8kQ3FuMYtgD1HjAZw7MW', 'admin', 'Event Management Co.')
ON CONFLICT (email) DO UPDATE SET 
    role = 'admin',
    name = 'Admin User',
    company = 'Event Management Co.',
    is_active = true;

-- Create some sample employees and leads for testing
INSERT INTO users (name, email, password, role, company, department) VALUES
('John Tech', 'john@example.com', '$2a$10$8K1p/a0dPEG8.EaSj1W8HOkZ7ZhV4s.FQ8kQ3FuMYtgD1HjAZw7MW', 'employee', 'Event Management Co.', 'IT'),
('Sarah Lead', 'sarah@example.com', '$2a$10$8K1p/a0dPEG8.EaSj1W8HOkZ7ZhV4s.FQ8kQ3FuMYtgD1HjAZw7MW', 'lead', 'Event Management Co.', 'IT'),
('Mike Employee', 'mike@example.com', '$2a$10$8K1p/a0dPEG8.EaSj1W8HOkZ7ZhV4s.FQ8kQ3FuMYtgD1HjAZw7MW', 'employee', 'Event Management Co.', 'AV')
ON CONFLICT (email) DO NOTHING;