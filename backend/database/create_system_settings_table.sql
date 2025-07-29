-- Create system_settings table for Houses of Light Request Management System
-- This table stores configurable system settings with proper type handling

CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50) NOT NULL DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_system_settings_updated_at();

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
-- Organization Settings
('organizationName', 'Houses of Light', 'string', 'organization', 'Organization/Company name'),
('supportEmail', 'support@housesoflight.org', 'string', 'organization', 'Main support email address'),
('websiteUrl', 'https://housesoflight.org', 'string', 'organization', 'Organization website URL'),
('address', '123 Main St, Anytown, ST 12345', 'string', 'organization', 'Organization physical address'),
('phone', '(555) 123-4567', 'string', 'organization', 'Main contact phone number'),
('timeZone', 'America/New_York', 'string', 'organization', 'Default system timezone'),

-- Email Settings
('notificationsEnabled', 'true', 'boolean', 'email', 'Enable/disable email notifications'),
('smtpHost', 'smtp.gmail.com', 'string', 'email', 'SMTP server hostname'),
('smtpPort', '587', 'number', 'email', 'SMTP server port number'),
('smtpUser', '', 'string', 'email', 'SMTP username/email'),
('smtpPassword', '', 'string', 'email', 'SMTP password (encrypted)'),
('fromName', 'Houses of Light', 'string', 'email', 'Default sender name for emails'),
('fromEmail', 'noreply@housesoflight.org', 'string', 'email', 'Default sender email address'),
('testEmailRecipient', '', 'string', 'email', 'Email address for testing SMTP settings'),

-- System Defaults
('defaultUrgency', 'normal', 'string', 'system', 'Default urgency level for new requests'),
('requestNumberPrefix', 'REQ', 'string', 'system', 'Prefix for auto-generated request numbers'),
('maxFileSize', '50', 'number', 'system', 'Maximum file upload size in MB'),
('sessionTimeout', '24', 'number', 'system', 'User session timeout in hours'),
('passwordMinLength', '8', 'number', 'system', 'Minimum password length requirement'),
('autoAssignEnabled', 'false', 'boolean', 'system', 'Enable automatic request assignment'),
('enableFileUploads', 'true', 'boolean', 'system', 'Allow file uploads on requests'),

-- Notification Settings
('emailNotifications', 'true', 'boolean', 'notifications', 'Send email notifications'),
('pushNotifications', 'false', 'boolean', 'notifications', 'Send push notifications'),
('notifyOnAssignment', 'true', 'boolean', 'notifications', 'Notify when requests are assigned'),
('notifyOnStatusChange', 'true', 'boolean', 'notifications', 'Notify on status changes'),
('notifyOnComment', 'true', 'boolean', 'notifications', 'Notify on new comments'),
('dailyDigest', 'false', 'boolean', 'notifications', 'Send daily digest emails'),
('weeklyReport', 'false', 'boolean', 'notifications', 'Send weekly summary reports')

ON CONFLICT (setting_key) DO NOTHING;

-- Grant permissions to the application user (adjust username as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON system_settings TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE system_settings_id_seq TO your_app_user;

COMMENT ON TABLE system_settings IS 'Stores configurable system settings for Houses of Light Request Management System';
COMMENT ON COLUMN system_settings.setting_key IS 'Unique identifier for the setting';
COMMENT ON COLUMN system_settings.setting_value IS 'Setting value stored as text (converted based on setting_type)';
COMMENT ON COLUMN system_settings.setting_type IS 'Data type for proper value conversion (string, number, boolean, json)';
COMMENT ON COLUMN system_settings.category IS 'Grouping category for organizing settings';
COMMENT ON COLUMN system_settings.is_encrypted IS 'Whether the setting value is encrypted (for sensitive data)';