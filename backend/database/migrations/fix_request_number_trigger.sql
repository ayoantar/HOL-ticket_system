-- Fix the request number generation trigger
-- The issue is that BEFORE INSERT doesn't have the ID yet
-- We need to use AFTER INSERT and UPDATE the record

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_generate_request_number ON requests;
DROP FUNCTION IF EXISTS generate_request_number();

-- Create new function to update request number after ID is assigned
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE requests 
  SET request_number = 'REQ-' || LPAD(NEW.id::text, 6, '0')
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run AFTER INSERT when ID is available
CREATE TRIGGER trigger_generate_request_number
  AFTER INSERT ON requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_request_number();