-- Create department-based request number generation function with ENUM-safe parameters
CREATE FUNCTION generate_request_number(req_type TEXT, dept_name TEXT)
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    formatted_number TEXT;
    dept_code TEXT;
    max_attempts INTEGER := 10;
    attempt_count INTEGER := 0;
BEGIN
    -- Map request types to department codes
    CASE req_type
        WHEN 'event' THEN dept_code := 'EVT';
        WHEN 'graphic' THEN dept_code := 'GFX';
        WHEN 'web' THEN dept_code := 'WEB';
        WHEN 'technical' THEN dept_code := 'TEC';
        ELSE dept_code := 'GEN'; -- Generic fallback
    END CASE;

    LOOP
        -- Get the next number for this department/request type
        SELECT COALESCE(MAX(
            CASE 
                WHEN request_number ~ ('^REQ-' || dept_code || '-[0-9]{3}$') 
                THEN CAST(SUBSTRING(request_number FROM length('REQ-' || dept_code || '-') + 1) AS INTEGER)
                ELSE 0
            END
        ), 0) + 1
        INTO next_number
        FROM requests
        WHERE request_type::TEXT = req_type;  -- Cast ENUM to TEXT for comparison
        
        -- Format as REQ-XXX-YYY (department code with 3-digit number)
        formatted_number := 'REQ-' || dept_code || '-' || LPAD(next_number::TEXT, 3, '0');
        
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
        
        -- Small delay to reduce contention
        PERFORM pg_sleep(0.01);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger function that calls the department-based generator
CREATE FUNCTION set_request_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.request_number IS NULL THEN
        -- Cast ENUM to TEXT when calling the function
        NEW.request_number := generate_request_number(NEW.request_type::TEXT, NEW.department);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER set_request_number_trigger
    BEFORE INSERT ON requests
    FOR EACH ROW
    WHEN (NEW.request_number IS NULL)
    EXECUTE FUNCTION set_request_number();