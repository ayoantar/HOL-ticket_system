-- Migration to add new request management system
-- This adds support for Event, Web, Technical Issue, and Graphic Design requests
-- while keeping the existing ticket system as fallback

-- Create request types enum
CREATE TYPE request_type_enum AS ENUM ('event', 'web', 'technical', 'graphic');
CREATE TYPE request_status_enum AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold');
CREATE TYPE urgency_enum AS ENUM ('normal', 'urgent');

-- Main requests table (shared across all request types)
CREATE TABLE IF NOT EXISTS requests (
  id SERIAL PRIMARY KEY,
  request_number VARCHAR(20) UNIQUE NOT NULL, -- REQ-XXXXXX format
  request_type request_type_enum NOT NULL,
  status request_status_enum DEFAULT 'pending',
  urgency urgency_enum DEFAULT 'normal',
  
  -- Shared user information
  client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  
  -- Assignment and tracking
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  department VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Event requests (Form A)
CREATE TABLE IF NOT EXISTS event_requests (
  id SERIAL PRIMARY KEY,
  request_id INTEGER UNIQUE REFERENCES requests(id) ON DELETE CASCADE,
  
  event_name VARCHAR(255) NOT NULL,
  ministry_in_charge VARCHAR(255) NOT NULL,
  starting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  ending_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Graphics
  graphic_required BOOLEAN DEFAULT FALSE,
  graphic_concept TEXT, -- Description if no upload
  graphic_file_path VARCHAR(500), -- Upload path
  
  -- Online registration
  cost DECIMAL(10,2),
  tickets_online BOOLEAN DEFAULT FALSE,
  tickets_in_person BOOLEAN DEFAULT FALSE,
  registration_links TEXT, -- Links/documents after registration
  registration_files_path VARCHAR(500), -- Upload path for registration docs
  
  -- Media team equipment (stored as JSON array)
  equipment_needed JSONB DEFAULT '[]', -- ["cameras", "director", "lyrics", "sound"]
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Web requests (Form B)
CREATE TABLE IF NOT EXISTS web_requests (
  id SERIAL PRIMARY KEY,
  request_id INTEGER UNIQUE REFERENCES requests(id) ON DELETE CASCADE,
  
  domain VARCHAR(100) NOT NULL CHECK (domain IN (
    'housesoflight.org',
    'housesoflight.church', 
    'hbrp.la',
    'housesoflight.network',
    'netzgomez.com',
    'turningheartsacademy.com',
    'pasionporjesus.la',
    'blumacademy.com',
    'centrodeasesoriafamiliar.org',
    'casaderestauracion.la',
    'raicesprofundas.la'
  )),
  description TEXT NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Technical issue requests (Form C)
CREATE TABLE IF NOT EXISTS technical_requests (
  id SERIAL PRIMARY KEY,
  request_id INTEGER UNIQUE REFERENCES requests(id) ON DELETE CASCADE,
  
  issue_description TEXT NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Graphic design requests (Form D)
CREATE TABLE IF NOT EXISTS graphic_requests (
  id SERIAL PRIMARY KEY,
  request_id INTEGER UNIQUE REFERENCES requests(id) ON DELETE CASCADE,
  
  event_name VARCHAR(255) NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE,
  specific_font VARCHAR(255),
  color_preference VARCHAR(255),
  is_previous_event BOOLEAN DEFAULT FALSE,
  reusable_items TEXT, -- Logo, banner, etc.
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Request status history (similar to ticket status history)
CREATE TABLE IF NOT EXISTS request_status_history (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  status request_status_enum NOT NULL,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Request activity log (extends tech_activities for all request types)
CREATE TABLE IF NOT EXISTS request_activities (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  tech_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(20) NOT NULL CHECK (activity_type IN ('status_change', 'internal_note', 'work_started', 'work_completed', 'info_requested', 'escalated')),
  old_status request_status_enum,
  new_status request_status_enum,
  notes TEXT,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  time_spent INTEGER, -- Time spent in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to generate request numbers (REQ-XXXXXX format)
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.request_number := 'REQ-' || LPAD(NEW.id::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate request numbers
CREATE TRIGGER trigger_generate_request_number
  BEFORE INSERT ON requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_request_number();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating timestamps
CREATE TRIGGER trigger_update_requests_timestamp
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_request_timestamp();

CREATE TRIGGER trigger_update_event_requests_timestamp
  BEFORE UPDATE ON event_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_request_timestamp();

CREATE TRIGGER trigger_update_web_requests_timestamp
  BEFORE UPDATE ON web_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_request_timestamp();

CREATE TRIGGER trigger_update_technical_requests_timestamp
  BEFORE UPDATE ON technical_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_request_timestamp();

CREATE TRIGGER trigger_update_graphic_requests_timestamp
  BEFORE UPDATE ON graphic_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_request_timestamp();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_client_id ON requests(client_id);
CREATE INDEX IF NOT EXISTS idx_requests_assigned_to ON requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_requests_request_type ON requests(request_type);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at);
CREATE INDEX IF NOT EXISTS idx_request_status_history_request_id ON request_status_history(request_id);
CREATE INDEX IF NOT EXISTS idx_request_activities_request_id ON request_activities(request_id);
CREATE INDEX IF NOT EXISTS idx_request_activities_tech_id ON request_activities(tech_id);

-- Comments for documentation
COMMENT ON TABLE requests IS 'Main requests table for all request types (Event, Web, Technical, Graphic)';
COMMENT ON TABLE event_requests IS 'Form A - New Event Request details';
COMMENT ON TABLE web_requests IS 'Form B - Web Request details';
COMMENT ON TABLE technical_requests IS 'Form C - Technical Issue details';
COMMENT ON TABLE graphic_requests IS 'Form D - Graphic Design Request details';
COMMENT ON TABLE request_activities IS 'Tech activity logging for all request types';