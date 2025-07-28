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

module.exports = router;