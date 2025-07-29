const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const requestController = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../config/multer');
const { 
  createRequestLimiter, 
  createFileLimiter,
  validateRequest, 
  validateEventRequest, 
  handleValidationErrors,
  validateFileUpload 
} = require('../middleware/security');

// Apply authentication middleware to all routes
router.use(protect);

// Apply rate limiting for request creation
const requestLimiter = createRequestLimiter();
const fileLimiter = createFileLimiter();

// Create new request (any authenticated user)
router.post('/', 
  requestLimiter,
  fileLimiter,
  upload.fields([
    { name: 'graphicFile', maxCount: 1 },
    { name: 'registrationFiles', maxCount: 5 }
  ]),
  validateFileUpload,
  validateRequest,
  handleValidationErrors,
  requestController.createRequest
);

// Get requests assigned to current user (must be before /:id route)
router.get('/my', requestController.getMyRequests);

// Get department requests (dept_leads only) (must be before /:id route)
router.get('/department', authorize(['dept_lead', 'admin']), requestController.getDepartmentRequests);

// Get all requests (with filtering)
router.get('/', requestController.getRequests);

// Delete request (admin/dept_lead only) - place before GET /:id to avoid conflicts
router.delete('/:id', 
  authorize(['admin', 'dept_lead']),
  requestController.deleteRequest
);

// Get single request (must be last among GET routes)
router.get('/:id', requestController.getRequest);

// Update request status (employee/dept_lead/admin only)
router.put('/:id/status', 
  authorize(['employee', 'dept_lead', 'admin']),
  [
    body('status').isIn(['pending', 'in_progress', 'completed', 'cancelled', 'on_hold']).withMessage('Invalid status'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    body('timeSpent').optional().isInt({ min: 0 }).withMessage('Time spent must be a positive integer')
  ],
  requestController.updateRequestStatus
);

// Assign request (admin/dept_lead only)
router.post('/:id/assign',
  authorize(['admin', 'dept_lead']),
  [
    body('assignedTo').isInt().withMessage('Assigned user ID is required'),
    body('department').notEmpty().withMessage('Department is required')
  ],
  requestController.assignRequest
);

// Add comment to request
router.post('/:id/comments',
  [
    body('content').notEmpty().withMessage('Comment content is required'),
    body('isInternal').optional().isBoolean().withMessage('isInternal must be a boolean')
  ],
  requestController.addComment
);

// Get comments for request
router.get('/:id/comments', requestController.getComments);

module.exports = router;