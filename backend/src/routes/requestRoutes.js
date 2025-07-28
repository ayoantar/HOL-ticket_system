const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const requestController = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../config/multer');

// Apply authentication middleware to all routes
router.use(protect);

// Create new request (any authenticated user)
router.post('/', 
  upload.fields([
    { name: 'graphicFile', maxCount: 1 },
    { name: 'registrationFiles', maxCount: 5 }
  ]),
  [
    // Shared validations
    body('requestType').isIn(['event', 'web', 'technical', 'graphic']).withMessage('Invalid request type'),
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('urgency').optional().isIn(['normal', 'urgent']).withMessage('Invalid urgency level'),
    
    // Event request validations
    body('eventName').if(body('requestType').equals('event')).notEmpty().withMessage('Event name is required'),
    body('ministryInCharge').if(body('requestType').equals('event')).notEmpty().withMessage('Ministry in charge is required'),
    body('startingDate').if(body('requestType').equals('event')).isISO8601().withMessage('Valid starting date is required'),
    body('endingDate').if(body('requestType').equals('event')).isISO8601().withMessage('Valid ending date is required'),
    
    // Web request validations
    body('domain').if(body('requestType').equals('web')).isIn([
      'housesoflight.org', 'housesoflight.church', 'hbrp.la', 'housesoflight.network',
      'netzgomez.com', 'turningheartsacademy.com', 'pasionporjesus.la', 'blumacademy.com',
      'centrodeasesoriafamiliar.org', 'casaderestauracion.la', 'raicesprofundas.la'
    ]).withMessage('Invalid domain'),
    body('description').if(body('requestType').equals('web')).notEmpty().withMessage('Description is required'),
    
    // Technical request validations
    body('issueDescription').if(body('requestType').equals('technical')).notEmpty().withMessage('Issue description is required'),
    
    // Graphic request validations
    body('eventName').if(body('requestType').equals('graphic')).notEmpty().withMessage('Event name is required')
  ],
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