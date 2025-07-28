-- Event Ticketing System PostgreSQL Schema

-- Create database (run this separately as superuser)
-- CREATE DATABASE event_ticketing;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('client', 'admin')),
    company VARCHAR(255),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
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

-- Tickets table
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('presentation', 'conference', 'workshop', 'seminar', 'other')),
    description TEXT NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    venue VARCHAR(255) NOT NULL,
    attendee_count INTEGER NOT NULL CHECK (attendee_count > 0),
    additional_requirements TEXT,
    presentation_filename VARCHAR(255),
    presentation_path VARCHAR(255),
    presentation_uploaded_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in-progress', 'completed', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    assigned_to INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- Ticket equipment many-to-many relationship
CREATE TABLE ticket_equipment (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate equipment on same ticket
    UNIQUE(ticket_id, equipment_id)
);

-- Ticket status history
CREATE TABLE ticket_status_history (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    changed_by INTEGER REFERENCES users(id),
    notes TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ticket comments
CREATE TABLE ticket_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id),
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('status_change', 'comment_added', 'ticket_assigned', 'ticket_updated')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    email_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_tickets_client_id ON tickets(client_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_tickets_start_date ON tickets(start_date);
CREATE INDEX idx_ticket_equipment_ticket_id ON ticket_equipment(ticket_id);
CREATE INDEX idx_ticket_equipment_equipment_id ON ticket_equipment(equipment_id);
CREATE INDEX idx_ticket_status_history_ticket_id ON ticket_status_history(ticket_id);
CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_number := 'TKT-' || LPAD((SELECT COALESCE(MAX(id), 0) + 1 FROM tickets)::text, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket numbers
CREATE TRIGGER trigger_generate_ticket_number
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION generate_ticket_number();

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

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create status history entry when ticket is created
CREATE OR REPLACE FUNCTION create_initial_status_history()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO ticket_status_history (ticket_id, status, notes, changed_at)
    VALUES (NEW.id, NEW.status, 'Ticket created', NEW.created_at);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_initial_status_history
    AFTER INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION create_initial_status_history();

-- Sample equipment data
INSERT INTO equipment (name, category, description, quantity, specifications) VALUES
('Wireless Microphone', 'audio', 'Professional wireless microphone system', 5, '{"frequency": "UHF", "range": "100m", "battery_life": "8 hours"}'),
('Projector - 4K', 'video', '4K resolution projector with HDMI inputs', 3, '{"resolution": "4096x2160", "brightness": "3000 lumens", "inputs": ["HDMI", "USB", "VGA"]}'),
('LED Light Panel', 'lighting', 'Professional LED lighting panel', 8, '{"power": "50W", "color_temp": "3200K-5600K", "dimmer": true}'),
('Laptop - Presentation', 'presentation', 'Laptop configured for presentations', 4, '{"os": "Windows 11", "ram": "16GB", "storage": "512GB SSD", "software": ["PowerPoint", "PDF Reader"]}'),
('Portable Stage', 'staging', 'Modular portable stage platform', 2, '{"size": "4x4 meters", "height": "adjustable", "material": "aluminum"}'),
('Sound System', 'audio', 'Complete PA system with speakers and mixer', 2, '{"power": "500W", "speakers": 2, "mixer": "8 channel", "wireless_receivers": 4}');

-- Sample admin user (password: 'admin123' - bcrypt hashed)
INSERT INTO users (name, email, password, role, company) VALUES
('Admin User', 'admin@example.com', '$2a$10$8K1p/a0dPEG8.EaSj1W8HOkZ7ZhV4s.FQ8kQ3FuMYtgD1HjAZw7MW', 'admin', 'Event Management Co.');