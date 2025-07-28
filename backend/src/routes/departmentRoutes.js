const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const departmentController = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Public routes (for all authenticated users)
router.get('/', departmentController.getDepartments);
router.get('/:id', departmentController.getDepartment);
router.get('/:departmentName/employees', departmentController.getDepartmentEmployees);

// Lead routes (for leads and admins) - removed ticket route as it's handled by request routes

// Admin-only routes
router.post('/',
  authorize(['admin']),
  [
    body('name').notEmpty().withMessage('Department name is required'),
    body('description').optional(),
    body('leadId').optional().isInt().withMessage('Lead ID must be a number')
  ],
  departmentController.createDepartment
);

router.put('/:id',
  authorize(['admin']),
  [
    body('name').notEmpty().withMessage('Department name is required'),
    body('description').optional(),
    body('leadId').optional().isInt().withMessage('Lead ID must be a number')
  ],
  departmentController.updateDepartment
);

router.delete('/:id',
  authorize(['admin']),
  departmentController.deleteDepartment
);

router.post('/assign-user',
  authorize(['admin']),
  [
    body('userId').isInt().withMessage('User ID is required'),
    body('departmentId').isInt().withMessage('Department ID is required'),
    body('role').optional().isIn(['employee', 'lead']).withMessage('Invalid role')
  ],
  departmentController.assignUserToDepartment
);

module.exports = router;