-- Create email_templates table for UI-based email template management
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_email_templates_updated_at();

-- Insert default email templates
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