-- Create table for configurable request type to department routing
-- This allows dynamic department routing without code changes

CREATE TABLE IF NOT EXISTS request_routing (
    id SERIAL PRIMARY KEY,
    request_type VARCHAR(50) NOT NULL UNIQUE,
    department_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default routing rules
INSERT INTO request_routing (request_type, department_name) VALUES
('graphic', 'Graphic Design'),
('web', 'Web Support'),
('technical', 'IT Support'),
('event', 'Event Management')
ON CONFLICT (request_type) DO UPDATE SET
    department_name = EXCLUDED.department_name,
    updated_at = CURRENT_TIMESTAMP;

-- Add foreign key constraint to ensure department exists
ALTER TABLE request_routing 
ADD CONSTRAINT fk_request_routing_department 
FOREIGN KEY (department_name) REFERENCES departments(name) 
ON UPDATE CASCADE ON DELETE RESTRICT;

-- Create trigger to update timestamp
CREATE OR REPLACE FUNCTION update_request_routing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_request_routing_timestamp
    BEFORE UPDATE ON request_routing
    FOR EACH ROW
    EXECUTE FUNCTION update_request_routing_timestamp();