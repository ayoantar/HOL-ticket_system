const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { 
  createAuthLimiter, 
  validateLogin, 
  validateRegister, 
  handleValidationErrors 
} = require('../middleware/security');

// Apply stricter rate limiting for auth endpoints
const authLimiter = createAuthLimiter();

router.post('/register', 
  authLimiter,
  validateRegister,
  handleValidationErrors,
  authController.register
);

router.post('/login',
  authLimiter,
  validateLogin,
  handleValidationErrors,
  authController.login
);

router.get('/me', protect, authController.getMe);
router.put('/updatepassword', protect, authController.updatePassword);

module.exports = router;