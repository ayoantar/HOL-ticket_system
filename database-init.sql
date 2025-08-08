-- Database initialization script for DigitalOcean App Platform
-- This script will set up the complete database schema for the Houses of Light Request Management System

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types first
CREATE TYPE user_role AS ENUM ('user', 'employee', 'dept_lead', 'admin');
CREATE TYPE request_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE request_type AS ENUM ('event', 'web', 'technical', 'graphic');
CREATE TYPE urgency_level AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE notification_type AS ENUM ('status_change', 'assignment', 'comment', 'request_created', 'request_deleted');
CREATE TYPE activity_type AS ENUM ('status_change', 'comment', 'assignment', 'file_upload', 'client_message');

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user',
    company VARCHAR(255),
    department VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create departments table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    lead_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create requests table with auto-generated request numbers
CREATE SEQUENCE request_number_seq START 1;

CREATE TABLE requests (
    id SERIAL PRIMARY KEY,
    request_number VARCHAR(20) UNIQUE,
    client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_type request_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    urgency urgency_level DEFAULT 'normal',
    status request_status DEFAULT 'pending',
    department VARCHAR(255),
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create request type-specific tables
CREATE TABLE event_requests (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME,
    location VARCHAR(255),
    description TEXT,
    expected_attendance INTEGER,
    graphics_needed BOOLEAN DEFAULT false,
    graphics_description TEXT,
    equipment_needed TEXT[],
    tech_requirements TEXT,
    special_requirements TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE web_requests (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    website_type VARCHAR(100),
    current_website_url VARCHAR(255),
    project_description TEXT NOT NULL,
    specific_requirements TEXT,
    target_audience TEXT,
    timeline VARCHAR(100),
    budget_range VARCHAR(100),
    inspiration_links TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE technical_requests (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    issue_type VARCHAR(100),
    severity VARCHAR(50),
    device_info TEXT,
    issue_description TEXT NOT NULL,
    steps_to_reproduce TEXT,
    error_messages TEXT,
    attempted_solutions TEXT,
    issue_started TIMESTAMP,
    attachments_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE graphic_requests (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    project_type VARCHAR(100),
    dimensions VARCHAR(100),
    color_preferences TEXT,
    text_content TEXT,
    image_requirements TEXT,
    brand_guidelines TEXT,
    delivery_format VARCHAR(100),
    usage_purpose TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create request activities table
CREATE TABLE request_activities (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type activity_type NOT NULL,
    description TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    time_spent INTEGER DEFAULT 0,
    tech_assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id INTEGER REFERENCES requests(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create request routing table
CREATE TABLE request_routing (
    id SERIAL PRIMARY KEY,
    request_type VARCHAR(50) NOT NULL,
    department_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(request_type)
);

-- Create email templates table
CREATE TABLE email_templates (
    id SERIAL PRIMARY KEY,
    template_key VARCHAR(100) NOT NULL UNIQUE,
    template_name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create system settings table
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    is_editable BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create function for generating request numbers
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.request_number := 'REQ-' || LPAD(nextval('request_number_seq')::text, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating request numbers
CREATE TRIGGER generate_request_number_trigger
    BEFORE INSERT ON requests
    FOR EACH ROW
    EXECUTE FUNCTION generate_request_number();

-- Insert default departments
INSERT INTO departments (name, description) VALUES
('Event Management', 'Planning and coordination of events and activities'),
('Graphic Design', 'Visual design and branding materials'),
('Web Support', 'Website development and maintenance'),
('IT Support', 'Technical support and troubleshooting');

-- Insert default request routing
INSERT INTO request_routing (request_type, department_name, is_active) VALUES
('event', 'Event Management', true),
('graphic', 'Graphic Design', true),
('web', 'Web Support', true),
('technical', 'IT Support', true);

-- Insert default email templates
INSERT INTO email_templates (template_key, template_name, subject, html_content, text_content) VALUES
('request_created', 'Request Created', 'Your request has been submitted - {{requestNumber}}',
 '<h2>Request Submitted Successfully</h2><p>Your request <strong>{{requestNumber}}</strong> has been submitted and is being processed.</p><p>Request Details:</p><ul><li>Type: {{requestType}}</li><li>Status: {{status}}</li><li>Submitted: {{createdAt}}</li></ul>',
 'Your request {{requestNumber}} has been submitted successfully. Type: {{requestType}}, Status: {{status}}, Submitted: {{createdAt}}'),
('status_changed', 'Request Status Updated', 'Request {{requestNumber}} status updated to {{newStatus}}',
 '<h2>Request Status Update</h2><p>Your request <strong>{{requestNumber}}</strong> status has been updated.</p><p>New Status: <strong>{{newStatus}}</strong></p>{{#if assignedTo}}<p>Assigned to: {{assignedTo}}</p>{{/if}}',
 'Your request {{requestNumber}} status has been updated to {{newStatus}}. {{#if assignedTo}}Assigned to: {{assignedTo}}{{/if}}');

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('app_name', 'Houses of Light Request Management', 'string', 'Application name displayed in the interface'),
('max_file_size', '52428800', 'number', 'Maximum file upload size in bytes (50MB)'),
('allowed_file_types', 'image/jpeg,image/png,image/gif,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel', 'string', 'Comma-separated list of allowed file MIME types');

-- Create indexes for better performance
CREATE INDEX idx_requests_client_id ON requests(client_id);
CREATE INDEX idx_requests_assigned_to ON requests(assigned_to);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_department ON requests(department);
CREATE INDEX idx_request_activities_request_id ON request_activities(request_id);
CREATE INDEX idx_request_activities_user_id ON request_activities(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Create admin user (you'll need to update the password hash)
-- Password hash for 'admin123' - CHANGE THIS IN PRODUCTION
INSERT INTO users (name, email, password, role, company, is_active) VALUES
('System Administrator', 'admin@yourdomain.com', '$2a$10$Ii6Tz0GHFoA2/wfFq40Y/.3U0fSCxBZiFqoh4VIPp1kq.x38jDjU.', 'admin', 'Houses of Light', true);

COMMIT;