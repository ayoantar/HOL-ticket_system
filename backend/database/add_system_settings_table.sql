-- Migration: Add system_settings table for configuration management
-- Date: July 28, 2025
-- Purpose: Store configurable system settings for Houses of Light

CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
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

-- Insert default settings for Houses of Light
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES 
-- Organization Settings
('organizationName', 'Houses of Light', 'string', 'organization', 'Organization name'),
('supportEmail', '', 'string', 'organization', 'Support email address'),
('websiteUrl', '', 'string', 'organization', 'Organization website URL'),
('timeZone', 'America/New_York', 'string', 'organization', 'Organization timezone'),

-- System Defaults
('defaultUrgency', 'normal', 'string', 'system', 'Default request urgency level'),
('autoAssignEnabled', 'false', 'boolean', 'system', 'Enable automatic request assignment'),
('requestNumberPrefix', 'REQ', 'string', 'system', 'Request number prefix'),
('defaultRequestStatus', 'pending', 'string', 'system', 'Default request status'),
('enableFileUploads', 'true', 'boolean', 'system', 'Enable file uploads'),
('maxFileSize', '50', 'number', 'system', 'Maximum file size (MB)'),
('sessionTimeout', '24', 'number', 'system', 'Session timeout (hours)'),
('passwordMinLength', '8', 'number', 'system', 'Minimum password length'),

-- Email Settings
('fromName', 'Houses of Light', 'string', 'email', 'Email sender name'),
('notificationsEnabled', 'true', 'boolean', 'email', 'Enable email notifications'),
('smtpPort', '587', 'number', 'email', 'SMTP server port'),

-- Notification Settings
('emailNotifications', 'true', 'boolean', 'notification', 'Enable email notifications'),
('smsNotifications', 'false', 'boolean', 'notification', 'Enable SMS notifications'),
('pushNotifications', 'true', 'boolean', 'notification', 'Enable push notifications'),
('notifyOnAssignment', 'true', 'boolean', 'notification', 'Notify on request assignment'),
('notifyOnStatusChange', 'true', 'boolean', 'notification', 'Notify on status change'),
('notifyOnComment', 'true', 'boolean', 'notification', 'Notify on new comments'),
('dailyDigest', 'false', 'boolean', 'notification', 'Send daily digest emails'),
('weeklyReport', 'false', 'boolean', 'notification', 'Send weekly report emails')

ON CONFLICT (setting_key) DO NOTHING;

-- Update trigger for updated_at timestamp
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

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON system_settings TO postgres;
GRANT USAGE, SELECT ON SEQUENCE system_settings_id_seq TO postgres;