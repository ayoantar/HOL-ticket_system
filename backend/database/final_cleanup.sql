-- Final cleanup script to remove all ticket-related and unused tables
-- Run this to clean up the database completely for requests-only system

-- Drop all ticket-related tables and dependencies
DROP TABLE IF EXISTS ticket_comments CASCADE;
DROP TABLE IF EXISTS ticket_status_history CASCADE;
DROP TABLE IF EXISTS ticket_equipment CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS tech_activities CASCADE;

-- Drop ticket-related functions and triggers
DROP FUNCTION IF EXISTS generate_ticket_number() CASCADE;
DROP FUNCTION IF EXISTS create_initial_status_history() CASCADE;

-- Drop ticket-related indexes (if they still exist)
DROP INDEX IF EXISTS idx_tickets_client_id;
DROP INDEX IF EXISTS idx_tickets_status;
DROP INDEX IF EXISTS idx_tickets_created_at;
DROP INDEX IF EXISTS idx_tickets_start_date;
DROP INDEX IF EXISTS idx_ticket_equipment_ticket_id;
DROP INDEX IF EXISTS idx_ticket_equipment_equipment_id;
DROP INDEX IF EXISTS idx_ticket_status_history_ticket_id;
DROP INDEX IF EXISTS idx_ticket_comments_ticket_id;

-- Update users table to include all necessary columns for request system
ALTER TABLE users 
DROP COLUMN IF EXISTS is_active,
ADD COLUMN IF NOT EXISTS department VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_lead BOOLEAN DEFAULT false;

-- Update user roles to include new role types
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check,
ADD CONSTRAINT users_role_check CHECK (role IN ('client', 'employee', 'lead', 'admin'));

-- Ensure equipment table is properly set up
ALTER TABLE equipment 
DROP CONSTRAINT IF EXISTS equipment_category_check,
ADD CONSTRAINT equipment_category_check CHECK (category IN ('audio', 'video', 'lighting', 'presentation', 'staging', 'other'));

-- Create departments table if it doesn't exist
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    lead_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    request_number VARCHAR(20) UNIQUE NOT NULL,
    client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('event', 'web', 'technical', 'graphic')),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    urgency VARCHAR(10) DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent')),
    due_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'on_hold', 'completed', 'cancelled')),
    assigned_to INTEGER REFERENCES users(id),
    assigned_by INTEGER REFERENCES users(id),
    department VARCHAR(50),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create specific request type tables if they don't exist
CREATE TABLE IF NOT EXISTS event_requests (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    event_name VARCHAR(255) NOT NULL,
    ministry_in_charge VARCHAR(255),
    starting_date TIMESTAMP NOT NULL,
    ending_date TIMESTAMP NOT NULL,
    graphic_required BOOLEAN DEFAULT false,
    graphic_concept TEXT,
    graphic_file_path VARCHAR(255),
    cost DECIMAL(10,2),
    tickets_online BOOLEAN DEFAULT false,
    tickets_in_person BOOLEAN DEFAULT false,
    registration_links TEXT,
    registration_files_path VARCHAR(255),
    equipment_needed JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_event_dates CHECK (ending_date >= starting_date)
);

CREATE TABLE IF NOT EXISTS web_requests (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    domain VARCHAR(255),
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS technical_requests (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    issue_description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS graphic_requests (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    event_name VARCHAR(255) NOT NULL,
    event_date TIMESTAMP,
    specific_font VARCHAR(255),
    color_preference VARCHAR(255),
    is_previous_event BOOLEAN DEFAULT false,
    reusable_items TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create request activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS request_activities (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    tech_id INTEGER NOT NULL REFERENCES users(id),
    activity_type VARCHAR(20) NOT NULL CHECK (activity_type IN ('status_change', 'internal_note', 'client_message')),
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    notes TEXT,
    time_spent INTEGER,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update notifications table to remove ticket references
ALTER TABLE notifications 
DROP COLUMN IF EXISTS ticket_id,
ADD COLUMN IF NOT EXISTS request_id INTEGER REFERENCES requests(id) ON DELETE CASCADE;

-- Update notifications type constraint
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check,
ADD CONSTRAINT notifications_type_check CHECK (type IN ('status_change', 'comment_added', 'ticket_assigned', 'ticket_updated'));

-- Create request number generation function
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.request_number := 'REQ-' || LPAD((SELECT COALESCE(MAX(id), 0) + 1 FROM requests)::text, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for request number generation
DROP TRIGGER IF EXISTS trigger_generate_request_number ON requests;
CREATE TRIGGER trigger_generate_request_number
    BEFORE INSERT ON requests
    FOR EACH ROW
    EXECUTE FUNCTION generate_request_number();

-- Create updated_at triggers for new tables
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance on request tables
CREATE INDEX IF NOT EXISTS idx_requests_client_id ON requests(client_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_assigned_to ON requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_requests_department ON requests(department);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at);
CREATE INDEX IF NOT EXISTS idx_request_activities_request_id ON request_activities(request_id);
CREATE INDEX IF NOT EXISTS idx_request_activities_tech_id ON request_activities(tech_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Insert sample departments if they don't exist
INSERT INTO departments (name, description) VALUES
('IT', 'Information Technology Department'),
('Marketing', 'Marketing and Communications'),
('Operations', 'Operations and Logistics'),
('Finance', 'Finance and Accounting')
ON CONFLICT (name) DO NOTHING;

-- Clean up any orphaned notification records
DELETE FROM notifications WHERE request_id IS NULL;

VACUUM ANALYZE;

-- Summary
SELECT 'Database cleanup completed successfully!' as status;