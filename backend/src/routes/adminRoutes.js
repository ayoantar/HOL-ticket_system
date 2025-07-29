const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// User management routes
router.get('/users', adminController.getAllUsers);
router.get('/users/stats', adminController.getUserStats);

router.post('/users', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['user', 'employee', 'dept_lead', 'admin']).withMessage('Role must be user, employee, dept_lead, or admin'),
  body('company').optional(),
  body('phone').optional()
], adminController.createUser);

router.put('/users/:id', adminController.updateUser);
router.put('/users/:id/reset-password', adminController.resetUserPassword);
router.delete('/users/:id', adminController.deleteUser);

// Analytics and Reports routes
router.get('/analytics', adminController.getRequestAnalytics);
router.get('/reports', adminController.getDetailedReports);
router.get('/metrics', adminController.getSystemMetrics);

// Export routes
router.get('/export/csv', adminController.exportAnalyticsCSV);
router.get('/export/pdf', adminController.exportAnalyticsPDF);
router.post('/analytics/refresh', adminController.refreshAnalyticsData);

// System Settings routes
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', [
  body('emailSettings.smtpHost').optional().isString(),
  body('emailSettings.smtpPort').optional().isNumeric(),
  body('emailSettings.smtpUser').optional().isEmail(),
  body('emailSettings.fromName').optional().isString(),
  body('emailSettings.notificationsEnabled').optional().isBoolean(),
  body('systemDefaults.defaultUrgency').optional().isIn(['low', 'normal', 'high', 'urgent']),
  body('systemDefaults.autoAssignEnabled').optional().isBoolean(),
  body('systemDefaults.requestNumberPrefix').optional().isString(),
  body('organizationSettings.organizationName').optional().isString(),
  body('organizationSettings.supportEmail').optional().isEmail(),
  body('organizationSettings.websiteUrl').optional().isURL()
], adminController.updateSystemSettings);

// Test email settings
router.post('/settings/test-email', [
  body('recipient').isEmail().withMessage('Valid recipient email is required')
], adminController.testEmailSettings);

// Email template management routes
router.get('/email-templates', adminController.getEmailTemplates);
router.get('/email-templates/:id', adminController.getEmailTemplate);
router.put('/email-templates/:id', [
  body('templateName').notEmpty().withMessage('Template name is required'),
  body('subjectTemplate').notEmpty().withMessage('Subject template is required'),
  body('htmlTemplate').notEmpty().withMessage('HTML template is required')
], adminController.updateEmailTemplate);
router.post('/email-templates/:id/preview', adminController.previewEmailTemplate);
router.post('/email-templates/:id/test', [
  body('recipient').isEmail().withMessage('Valid recipient email is required')
], adminController.sendTestEmailTemplate);

module.exports = router;