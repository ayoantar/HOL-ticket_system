-- Clean Request Management System PostgreSQL Schema
-- This is the complete schema for the request-only system (no tickets)

-- Create database (run this separately as superuser)
-- CREATE DATABASE event_ticketing;

-- Users table with all role types
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('client', 'employee', 'lead', 'admin')),
    company VARCHAR(255),
    phone VARCHAR(50),
    department VARCHAR(50),
    is_lead BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    lead_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment table
CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('audio', 'video', 'lighting', 'presentation', 'staging', 'other')),
    description TEXT,
    quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
    is_available BOOLEAN DEFAULT true,
    specifications JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Main requests table
CREATE TABLE requests (
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

-- Event-specific request details
CREATE TABLE event_requests (
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

-- Web development request details
CREATE TABLE web_requests (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    domain VARCHAR(255),
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Technical support request details
CREATE TABLE technical_requests (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    issue_description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Graphic design request details
CREATE TABLE graphic_requests (
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

-- Request activity tracking
CREATE TABLE request_activities (
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

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('status_change', 'comment_added', 'ticket_assigned', 'ticket_updated')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    email_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_requests_client_id ON requests(client_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_assigned_to ON requests(assigned_to);
CREATE INDEX idx_requests_department ON requests(department);
CREATE INDEX idx_requests_created_at ON requests(created_at);
CREATE INDEX idx_request_activities_request_id ON request_activities(request_id);
CREATE INDEX idx_request_activities_tech_id ON request_activities(tech_id);
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Function to generate request numbers
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.request_number := 'REQ-' || LPAD((SELECT COALESCE(MAX(id), 0) + 1 FROM requests)::text, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate request numbers
CREATE TRIGGER trigger_generate_request_number
    BEFORE INSERT ON requests
    FOR EACH ROW
    EXECUTE FUNCTION generate_request_number();

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample equipment data
INSERT INTO equipment (name, category, description, quantity, specifications) VALUES
('Wireless Microphone', 'audio', 'Professional wireless microphone system', 5, '{"frequency": "UHF", "range": "100m", "battery_life": "8 hours"}'),
('Projector - 4K', 'video', '4K resolution projector with HDMI inputs', 3, '{"resolution": "4096x2160", "brightness": "3000 lumens", "inputs": ["HDMI", "USB", "VGA"]}'),
('LED Light Panel', 'lighting', 'Professional LED lighting panel', 8, '{"power": "50W", "color_temp": "3200K-5600K", "dimmer": true}'),
('Laptop - Presentation', 'presentation', 'Laptop configured for presentations', 4, '{"os": "Windows 11", "ram": "16GB", "storage": "512GB SSD", "software": ["PowerPoint", "PDF Reader"]}'),
('Portable Stage', 'staging', 'Modular portable stage platform', 2, '{"size": "4x4 meters", "height": "adjustable", "material": "aluminum"}'),
('Sound System', 'audio', 'Complete PA system with speakers and mixer', 2, '{"power": "500W", "speakers": 2, "mixer": "8 channel", "wireless_receivers": 4}');

-- Sample departments
INSERT INTO departments (name, description) VALUES
('IT', 'Information Technology Department'),
('Marketing', 'Marketing and Communications'),
('Operations', 'Operations and Logistics'),
('Finance', 'Finance and Accounting');

-- Sample admin user (password: 'admin123' - bcrypt hashed)
INSERT INTO users (name, email, password, role, company) VALUES
('Admin User', 'admin@example.com', '$2a$10$8K1p/a0dPEG8.EaSj1W8HOkZ7ZhV4s.FQ8kQ3FuMYtgD1HjAZw7MW', 'admin', 'Event Management Co.');

-- Sample employees in different departments
INSERT INTO users (name, email, password, role, company, department) VALUES
('John Employee', 'john@example.com', '$2a$10$8K1p/a0dPEG8.EaSj1W8HOkZ7ZhV4s.FQ8kQ3FuMYtgD1HjAZw7MW', 'employee', 'Event Management Co.', 'IT'),
('Sarah Lead', 'sarah@example.com', '$2a$10$8K1p/a0dPEG8.EaSj1W8HOkZ7ZhV4s.FQ8kQ3FuMYtgD1HjAZw7MW', 'lead', 'Event Management Co.', 'IT'),
('Mike Marketing', 'mike@example.com', '$2a$10$8K1p/a0dPEG8.EaSj1W8HOkZ7ZhV4s.FQ8kQ3FuMYtgD1HjAZw7MW', 'employee', 'Event Management Co.', 'Marketing');

-- Update department leads
UPDATE departments SET lead_id = (SELECT id FROM users WHERE email = 'sarah@example.com') WHERE name = 'IT';

-- Update user lead status
UPDATE users SET is_lead = true WHERE email = 'sarah@example.com';