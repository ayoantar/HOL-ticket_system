const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `Request Management System <${process.env.EMAIL_USER}>`,
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

exports.sendRequestNotification = async (user, request, type) => {
  const templates = {
    created: {
      subject: `Request Created: ${request.requestNumber}`,
      html: `
        <h2>Request Created Successfully</h2>
        <p>Dear ${user.name},</p>
        <p>Your request has been created with the following details:</p>
        <ul>
          <li>Request Number: ${request.requestNumber}</li>
          <li>Type: ${request.requestType}</li>
          <li>Status: ${request.status}</li>
          <li>Urgency: ${request.urgency}</li>
        </ul>
        <p>You can track your request status by logging into your account.</p>
      `
    },
    status_change: {
      subject: `Request Status Updated: ${request.requestNumber}`,
      html: `
        <h2>Request Status Updated</h2>
        <p>Dear ${user.name},</p>
        <p>Your request ${request.requestNumber} status has been updated to: <strong>${request.status}</strong></p>
        <p>Type: ${request.requestType}</p>
        <p>Please log in to view more details.</p>
      `
    },
    assigned: {
      subject: `Request Assigned: ${request.requestNumber}`,
      html: `
        <h2>Request Assigned</h2>
        <p>Dear ${user.name},</p>
        <p>Your request ${request.requestNumber} has been assigned to our team.</p>
        <p>Type: ${request.requestType}</p>
        <p>Department: ${request.department}</p>
        <p>Please log in to view more details.</p>
      `
    },
    comment_added: {
      subject: `New Comment on Request: ${request.requestNumber}`,
      html: `
        <h2>New Comment Added</h2>
        <p>Dear ${user.name},</p>
        <p>A new comment has been added to your request ${request.requestNumber}.</p>
        <p>Type: ${request.requestType}</p>
        <p>Please log in to view the comment and respond if needed.</p>
      `
    }
  };
  
  const template = templates[type];
  if (template) {
    await this.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html
    });
  }
};