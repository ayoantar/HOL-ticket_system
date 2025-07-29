const nodemailer = require('nodemailer');
const { EmailTemplate } = require('../models');
let SystemSettings;
try {
  SystemSettings = require('../models/SystemSettings');
} catch (err) {
  console.log('SystemSettings model not available:', err.message);
}

// Create transporter using system settings
const createTransporter = async () => {
  if (!SystemSettings) {
    // Fallback to environment variables if SystemSettings not available
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  try {
    const emailSettings = await SystemSettings.getByCategory('email');
    
    return nodemailer.createTransport({
      host: emailSettings.smtpHost,
      port: parseInt(emailSettings.smtpPort),
      secure: parseInt(emailSettings.smtpPort) === 465,
      auth: emailSettings.smtpUser && emailSettings.smtpPassword ? {
        user: emailSettings.smtpUser,
        pass: emailSettings.smtpPassword
      } : null,
      tls: {
        rejectUnauthorized: false
      }
    });
  } catch (error) {
    console.error('Error creating transporter from system settings:', error);
    // Fallback to environment variables
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
};

exports.sendEmail = async (options) => {
  try {
    const transporter = await createTransporter();
    
    // Get sender info from system settings or fallback to env
    let fromName = 'Request Management System';
    let fromEmail = process.env.EMAIL_USER;
    
    if (SystemSettings) {
      try {
        const emailSettings = await SystemSettings.getByCategory('email');
        fromName = emailSettings.fromName || fromName;
        fromEmail = emailSettings.fromEmail || fromEmail;
      } catch (error) {
        console.log('Using fallback sender info');
      }
    }
    
    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};

exports.sendRequestNotification = async (user, request, type, additionalData = {}) => {
  try {
    // Map notification types to template keys
    const templateKeyMap = {
      'created': 'request_created',
      'status_change': 'status_change', 
      'assigned': 'request_assigned',
      'comment_added': 'comment_added'
    };
    
    const templateKey = templateKeyMap[type];
    if (!templateKey) {
      console.error(`Unknown notification type: ${type}`);
      return false;
    }

    // Get template from database
    const template = await EmailTemplate.findOne({
      where: {
        templateKey: templateKey,
        isActive: true
      }
    });

    if (!template) {
      console.error(`Email template '${templateKey}' not found or inactive`);
      return false;
    }

    // Prepare template variables
    const variables = {
      userName: user.name,
      requestNumber: request.requestNumber,
      requestType: request.requestType,
      status: request.status,
      urgency: request.urgency,
      department: request.department,
      assignedTo: additionalData.assignedTo || '',
      commentBy: additionalData.commentBy || '',
      ...additionalData
    };

    // Render template
    const rendered = template.render(variables);

    // Send email
    return await this.sendEmail({
      to: user.email,
      subject: rendered.subject,
      html: rendered.html
    });

  } catch (error) {
    console.error('Error sending request notification:', error);
    return false;
  }
};