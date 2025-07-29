-- Fix the request number generation function
-- This addresses the "FOR UPDATE is not allowed with aggregate functions" error

CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    formatted_number TEXT;
    max_attempts INTEGER := 10;
    attempt_count INTEGER := 0;
BEGIN
    LOOP
        -- Get the next number by counting existing requests + 1
        SELECT COALESCE(MAX(
            CASE 
                WHEN request_number ~ '^REQ-[0-9]{6}$' 
                THEN CAST(SUBSTRING(request_number FROM 5) AS INTEGER)
                ELSE 0
            END
        ), 0) + 1
        INTO next_number
        FROM requests;
        
        -- Format as REQ-XXXXXX (6 digits with leading zeros)
        formatted_number := 'REQ-' || LPAD(next_number::TEXT, 6, '0');
        
        -- Check if this number already exists (race condition protection)
        IF NOT EXISTS (SELECT 1 FROM requests WHERE request_number = formatted_number) THEN
            RETURN formatted_number;
        END IF;
        
        -- Increment attempt counter
        attempt_count := attempt_count + 1;
        
        -- Exit if we've tried too many times
        IF attempt_count >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique request number after % attempts', max_attempts;
        END IF;
        
        -- Small delay to reduce contention (PostgreSQL doesn't have SLEEP, use pg_sleep)
        PERFORM pg_sleep(0.01);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to ensure it's working properly
DROP TRIGGER IF EXISTS set_request_number_trigger ON requests;

CREATE TRIGGER set_request_number_trigger
    BEFORE INSERT ON requests
    FOR EACH ROW
    WHEN (NEW.request_number IS NULL)
    EXECUTE FUNCTION set_request_number();

-- Ensure the trigger function exists and is correct
CREATE OR REPLACE FUNCTION set_request_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.request_number IS NULL THEN
        NEW.request_number := generate_request_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;