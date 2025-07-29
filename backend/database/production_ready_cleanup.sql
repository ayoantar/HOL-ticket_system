-- Production Ready Database Cleanup Script
-- Houses of Light Request Management System
-- Date: July 29, 2025

BEGIN TRANSACTION;

-- =========================================
-- STEP 1: CLEANUP OLD TICKET DATA
-- =========================================

-- Drop any remaining ticket-related tables if they exist
DROP TABLE IF EXISTS ticket_equipment CASCADE;
DROP TABLE IF EXISTS ticket_comments CASCADE;
DROP TABLE IF EXISTS ticket_status_history CASCADE;
DROP TABLE IF EXISTS tech_activities CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;

-- Remove any ticket-related columns from requests table if they exist
ALTER TABLE requests DROP COLUMN IF EXISTS ticket_id;
ALTER TABLE requests DROP COLUMN IF EXISTS ticket_number;

-- =========================================
-- STEP 2: RESET REQUEST NUMBERING SEQUENCE
-- =========================================

-- Reset the request number sequence to start fresh
-- The request_number_seq will start from 1 for new requests
DROP SEQUENCE IF EXISTS request_number_seq CASCADE;
CREATE SEQUENCE request_number_seq START 1;

-- Update the trigger function to use department-based numbering
-- This will create numbers like REQ-IT-001, REQ-MKT-001, etc.
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
DECLARE
    dept_code TEXT;
    next_num INTEGER;
    new_request_number TEXT;
BEGIN
    -- Map department names to short codes
    CASE NEW.department
        WHEN 'IT Support' THEN dept_code := 'IT';
        WHEN 'Marketing' THEN dept_code := 'MKT';
        WHEN 'Operations' THEN dept_code := 'OPS';
        WHEN 'Finance' THEN dept_code := 'FIN';
        WHEN 'Event Management' THEN dept_code := 'EVT';
        WHEN 'Graphic Design' THEN dept_code := 'GFX';
        WHEN 'Web Support' THEN dept_code := 'WEB';
        ELSE dept_code := 'GEN'; -- General for unknown departments
    END CASE;

    -- Get the next number for this department
    SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM '\\d+$') AS INTEGER)), 0) + 1
    INTO next_num
    FROM requests
    WHERE request_number LIKE 'REQ-' || dept_code || '-%';

    -- Format the request number with zero-padding
    new_request_number := 'REQ-' || dept_code || '-' || LPAD(next_num::TEXT, 3, '0');
    
    NEW.request_number := new_request_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS generate_request_number_trigger ON requests;
CREATE TRIGGER generate_request_number_trigger
    BEFORE INSERT ON requests
    FOR EACH ROW
    EXECUTE FUNCTION generate_request_number();

-- =========================================
-- STEP 3: CLEAN EXISTING REQUEST DATA
-- =========================================

-- Option A: Keep existing requests but update their numbers (RECOMMENDED)
-- This preserves historical data while standardizing numbering

-- Update existing requests to use new numbering format
DO $$
DECLARE
    req RECORD;
    dept_code TEXT;
    counter INTEGER;
    new_number TEXT;
BEGIN
    -- Reset counters for each department
    FOR dept_code IN SELECT DISTINCT 
        CASE department
            WHEN 'IT Support' THEN 'IT'
            WHEN 'Marketing' THEN 'MKT'
            WHEN 'Operations' THEN 'OPS'
            WHEN 'Finance' THEN 'FIN'
            WHEN 'Event Management' THEN 'EVT'
            WHEN 'Graphic Design' THEN 'GFX'
            WHEN 'Web Support' THEN 'WEB'
            ELSE 'GEN'
        END as dept_code
        FROM requests 
        WHERE department IS NOT NULL
    LOOP
        counter := 1;
        
        -- Update requests for this department in chronological order
        FOR req IN 
            SELECT id, department FROM requests 
            WHERE CASE department
                WHEN 'IT Support' THEN 'IT'
                WHEN 'Marketing' THEN 'MKT'
                WHEN 'Operations' THEN 'OPS'
                WHEN 'Finance' THEN 'FIN'
                WHEN 'Event Management' THEN 'EVT'
                WHEN 'Graphic Design' THEN 'GFX'
                WHEN 'Web Support' THEN 'WEB'
                ELSE 'GEN'
            END = dept_code
            ORDER BY created_at ASC
        LOOP
            new_number := 'REQ-' || dept_code || '-' || LPAD(counter::TEXT, 3, '0');
            
            UPDATE requests 
            SET request_number = new_number 
            WHERE id = req.id;
            
            counter := counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- Option B: Clear all request data for fresh start (UNCOMMENT IF NEEDED)
-- WARNING: This will delete ALL existing requests and related data
/*
TRUNCATE TABLE request_activities CASCADE;
TRUNCATE TABLE event_requests CASCADE;
TRUNCATE TABLE web_requests CASCADE;
TRUNCATE TABLE technical_requests CASCADE;
TRUNCATE TABLE graphic_requests CASCADE;
TRUNCATE TABLE requests CASCADE;
TRUNCATE TABLE notifications CASCADE;
*/

-- =========================================
-- STEP 4: ENSURE ALL REQUIRED TABLES EXIST
-- =========================================

-- Verify system_settings table exists
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) NOT NULL DEFAULT 'string',
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Verify email_templates table exists
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    template_key VARCHAR(50) NOT NULL UNIQUE,
    template_name VARCHAR(100) NOT NULL,
    subject_template TEXT NOT NULL,
    html_template TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);

-- =========================================
-- STEP 5: INSERT PRODUCTION DATA
-- =========================================

-- Insert default system settings if they don't exist
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('smtpHost', 'smtp.gmail.com', 'string', 'email', 'SMTP server hostname'),
('smtpPort', '587', 'number', 'email', 'SMTP server port'),
('smtpUser', '', 'string', 'email', 'SMTP username'),
('smtpPassword', '', 'string', 'email', 'SMTP password'),
('fromName', 'Houses of Light', 'string', 'email', 'Email sender name'),
('fromEmail', 'noreply@housesoflight.org', 'string', 'email', 'Email sender address'),
('notificationsEnabled', 'true', 'boolean', 'email', 'Enable email notifications'),
('testEmailRecipient', '', 'string', 'email', 'Test email recipient'),
('organizationName', 'Houses of Light', 'string', 'organization', 'Organization name'),
('supportEmail', 'support@housesoflight.org', 'string', 'organization', 'Support email address'),
('defaultUrgency', 'normal', 'string', 'system', 'Default request urgency'),
('requestNumberPrefix', 'REQ', 'string', 'system', 'Request number prefix'),
('maxFileSize', '50', 'number', 'system', 'Maximum file size in MB'),
('sessionTimeout', '24', 'number', 'system', 'Session timeout in hours'),
('passwordMinLength', '8', 'number', 'system', 'Minimum password length'),
('autoAssignEnabled', 'false', 'boolean', 'system', 'Enable auto-assignment'),
('enableFileUploads', 'true', 'boolean', 'system', 'Enable file uploads'),
('emailNotifications', 'true', 'boolean', 'notification', 'Enable email notifications'),
('notifyOnAssignment', 'true', 'boolean', 'notification', 'Notify on assignment'),
('notifyOnStatusChange', 'true', 'boolean', 'notification', 'Notify on status change'),
('notifyOnComment', 'true', 'boolean', 'notification', 'Notify on comments'),
('enableTwoFactor', 'false', 'boolean', 'security', 'Enable two-factor authentication'),
('loginAttemptLimit', '5', 'number', 'security', 'Login attempt limit'),
('passwordExpirationDays', '90', 'number', 'security', 'Password expiration days'),
('enableAuditLog', 'true', 'boolean', 'security', 'Enable audit logging'),
('allowMultipleSessions', 'true', 'boolean', 'security', 'Allow multiple sessions'),
('maintenanceMode', 'false', 'boolean', 'maintenance', 'Maintenance mode enabled'),
('backupEnabled', 'true', 'boolean', 'maintenance', 'Enable automatic backups'),
('backupFrequency', 'daily', 'string', 'maintenance', 'Backup frequency'),
('autoCleanupDays', '30', 'number', 'maintenance', 'Auto cleanup days'),
('enableSystemAlerts', 'true', 'boolean', 'maintenance', 'Enable system alerts'),
('debugMode', 'false', 'boolean', 'maintenance', 'Debug mode enabled')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default email templates if they don't exist
INSERT INTO email_templates (template_key, template_name, subject_template, html_template, description) VALUES 
(
    'request_created',
    'Request Created',
    'Request Created: {{requestNumber}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Request Created Successfully</h2>
        <p>Dear {{userName}},</p>
        <p>Your request has been created with the following details:</p>
        <ul>
            <li><strong>Request Number:</strong> {{requestNumber}}</li>
            <li><strong>Type:</strong> {{requestType}}</li>
            <li><strong>Status:</strong> {{status}}</li>
            <li><strong>Urgency:</strong> {{urgency}}</li>
        </ul>
        <p>You can track your request status by logging into your account.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
            This email was sent from Houses of Light Request Management System.
        </p>
    </div>',
    'Email sent when a new request is created'
),
(
    'status_change',
    'Status Updated',
    'Request Status Updated: {{requestNumber}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Request Status Updated</h2>
        <p>Dear {{userName}},</p>
        <p>Your request <strong>{{requestNumber}}</strong> status has been updated to: <strong>{{status}}</strong></p>
        <ul>
            <li><strong>Type:</strong> {{requestType}}</li>
            <li><strong>Department:</strong> {{department}}</li>
        </ul>
        <p>Please log in to view more details about your request.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
            This email was sent from Houses of Light Request Management System.
        </p>
    </div>',
    'Email sent when request status changes'
),
(
    'request_assigned',
    'Request Assigned',
    'Request Assigned: {{requestNumber}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Request Assigned</h2>
        <p>Dear {{userName}},</p>
        <p>Your request <strong>{{requestNumber}}</strong> has been assigned to our team.</p>
        <ul>
            <li><strong>Type:</strong> {{requestType}}</li>
            <li><strong>Department:</strong> {{department}}</li>
            <li><strong>Assigned To:</strong> {{assignedTo}}</li>
        </ul>
        <p>Please log in to view more details and track progress.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
            This email was sent from Houses of Light Request Management System.
        </p>
    </div>',
    'Email sent when request is assigned to staff'
),
(
    'comment_added',
    'New Comment',
    'New Comment on Request: {{requestNumber}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">New Comment Added</h2>
        <p>Dear {{userName}},</p>
        <p>A new comment has been added to your request <strong>{{requestNumber}}</strong>.</p>
        <ul>
            <li><strong>Type:</strong> {{requestType}}</li>
            <li><strong>Comment By:</strong> {{commentBy}}</li>
        </ul>
        <p>Please log in to view the comment and respond if needed.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
            This email was sent from Houses of Light Request Management System.
        </p>
    </div>',
    'Email sent when a comment is added to a request'
),
(
    'test_email',
    'Test Email',
    'Houses of Light - Email Configuration Test',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Email Configuration Test</h2>
        <p>This is a test email from your Houses of Light Request Management System.</p>
        <p><strong>Test Details:</strong></p>
        <ul>
            <li><strong>SMTP Host:</strong> {{smtpHost}}</li>
            <li><strong>SMTP Port:</strong> {{smtpPort}}</li>
            <li><strong>From Name:</strong> {{fromName}}</li>
            <li><strong>From Email:</strong> {{fromEmail}}</li>
            <li><strong>Test Time:</strong> {{testTime}}</li>
        </ul>
        <p>If you received this email, your email configuration is working correctly!</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
            This email was sent from Houses of Light Request Management System.
        </p>
    </div>',
    'Test email template for SMTP configuration verification'
)
ON CONFLICT (template_key) DO NOTHING;

-- Ensure default departments exist
INSERT INTO departments (name, description) VALUES
('IT Support', 'Information Technology Support'),
('Marketing', 'Marketing and Communications'),
('Operations', 'Operations and Logistics'),
('Finance', 'Finance and Accounting'),
('Event Management', 'Event Planning and Management'),
('Graphic Design', 'Graphic Design and Visual Media'),
('Web Support', 'Website and Digital Support')
ON CONFLICT (name) DO NOTHING;

-- Ensure request routing is configured
INSERT INTO request_routing (request_type, department_name, is_active) VALUES
('graphic', 'Graphic Design', true),
('web', 'Web Support', true),
('technical', 'IT Support', true),
('event', 'Event Management', true)
ON CONFLICT (request_type) DO UPDATE SET
    department_name = EXCLUDED.department_name,
    is_active = EXCLUDED.is_active;

-- =========================================
-- STEP 6: UPDATE INDEXES AND CONSTRAINTS
-- =========================================

-- Ensure all required indexes exist
CREATE INDEX IF NOT EXISTS idx_requests_department ON requests(department);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at);
CREATE INDEX IF NOT EXISTS idx_requests_request_number ON requests(request_number);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- =========================================
-- STEP 7: VERIFY DATA INTEGRITY
-- =========================================

-- Check that all critical tables exist and have data
DO $$
BEGIN
    -- Verify tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'Critical table "users" does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'requests') THEN
        RAISE EXCEPTION 'Critical table "requests" does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') THEN
        RAISE EXCEPTION 'Critical table "system_settings" does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_templates') THEN
        RAISE EXCEPTION 'Critical table "email_templates" does not exist';
    END IF;
    
    -- Verify essential data exists
    IF NOT EXISTS (SELECT 1 FROM departments) THEN
        RAISE EXCEPTION 'No departments found - critical data missing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM email_templates WHERE is_active = true) THEN
        RAISE EXCEPTION 'No active email templates found - critical data missing';
    END IF;
    
    RAISE NOTICE 'Database cleanup and setup completed successfully!';
    RAISE NOTICE 'Request numbering: Department-based (REQ-DEPT-001 format)';
    RAISE NOTICE 'Email templates: % active templates found', (SELECT COUNT(*) FROM email_templates WHERE is_active = true);
    RAISE NOTICE 'Departments: % departments configured', (SELECT COUNT(*) FROM departments);
END $$;

COMMIT;

-- =========================================
-- PRODUCTION CHECKLIST SUMMARY
-- =========================================

/*
✅ COMPLETED TASKS:
1. Removed all ticket-related tables and data
2. Updated request numbering to department-based format (REQ-DEPT-001)
3. Ensured all system settings are configured
4. Verified email templates are active and ready
5. Confirmed request routing is properly configured
6. Added all necessary indexes for performance
7. Verified data integrity

🔧 MANUAL STEPS REQUIRED AFTER RUNNING THIS SCRIPT:
1. Update .env file with production SMTP credentials
2. Configure admin user accounts
3. Test email functionality with real SMTP settings
4. Verify all department assignments are correct
5. Test request creation and numbering sequence
6. Backup database before deploying to production

📋 NEW REQUEST NUMBERING FORMAT:
- IT Support: REQ-IT-001, REQ-IT-002, etc.
- Marketing: REQ-MKT-001, REQ-MKT-002, etc.
- Operations: REQ-OPS-001, REQ-OPS-002, etc.
- Finance: REQ-FIN-001, REQ-FIN-002, etc.
- Event Management: REQ-EVT-001, REQ-EVT-002, etc.
- Graphic Design: REQ-GFX-001, REQ-GFX-002, etc.
- Web Support: REQ-WEB-001, REQ-WEB-002, etc.
*/