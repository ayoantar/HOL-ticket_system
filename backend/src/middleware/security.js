const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const path = require('path');

// Enhanced rate limiting for different endpoints
exports.createAuthLimiter = () => rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // increased limit for development/testing - limit each IP to 50 requests per windowMs for auth
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.createRequestLimiter = () => rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // increased limit for development/testing - limit each IP to 100 requests per windowMs for creating requests
  message: {
    success: false,
    message: 'Too many requests created, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.createFileLimiter = () => rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200, // increased limit for development/testing - limit each IP to 200 file uploads per hour
  message: {
    success: false,
    message: 'Too many file uploads, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input sanitization and validation
exports.sanitizeInput = (req, res, next) => {
  // Remove null bytes and control characters
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  
  next();
};

// Validation error handler
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// File upload security validation
exports.validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const file = req.file;
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.webp'];
  const maxSize = 50 * 1024 * 1024; // 50MB

  // Check file size
  if (file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: 'File size exceeds 50MB limit'
    });
  }

  // Check MIME type
  if (!allowedMimes.includes(file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only PDF, Word, PowerPoint, Excel, and image files are allowed'
    });
  }

  // Check file extension
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file extension'
    });
  }

  // Additional security: Check for executable extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.js', '.vbs', '.jar', '.com', '.pif'];
  if (dangerousExtensions.includes(fileExtension)) {
    return res.status(400).json({
      success: false,
      message: 'Executable files are not allowed'
    });
  }

  next();
};

// Request validation schemas
exports.validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

exports.validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name must be 2-100 characters and contain only letters, spaces, hyphens, and apostrophes'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name must be less than 100 characters'),
];

exports.validateRequest = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be 2-255 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('requestType')
    .isIn(['event', 'web', 'technical', 'graphic'])
    .withMessage('Invalid request type'),
];

exports.validateEventRequest = [
  body('event_name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Event name must be 2-255 characters'),
  body('starting_date')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid start date'),
  body('ending_date')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid end date'),
  body('cost')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Cost must be a valid decimal number'),
];

// Security headers middleware
exports.securityHeaders = (req, res, next) => {
  // Remove server signature
  res.removeHeader('X-Powered-By');
  
  // Add additional security headers
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

// SQL injection prevention (additional layer)
exports.preventSQLInjection = (req, res, next) => {
  const sqlInjectionRegex = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)|(\-\-)|(\;)|(\|)|(\*)|(\%27)|(\%3B)|(\%7C)/gi;
  
  const checkForSQLInjection = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        if (sqlInjectionRegex.test(obj[key])) {
          return true;
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkForSQLInjection(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  if (req.body && checkForSQLInjection(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input detected'
    });
  }

  if (req.query && checkForSQLInjection(req.query)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters'
    });
  }

  next();
};

// CSRF protection for non-API routes
exports.csrfProtection = (req, res, next) => {
  // Skip CSRF for API routes (includes auth endpoints like login)
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // For other routes, ensure they have proper headers
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:3002',
    'http://localhost:3000', // React dev server default
    'http://localhost:3001', // Alternative React port
    'http://localhost:3002', // Houses of Light frontend port
    'http://localhost:5002', // Backend server (for proxy)
  ];
  
  const origin = req.headers.origin || req.headers.referer;
  if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
    console.log(`Security middleware blocked origin: ${origin}`);
    console.log(`Allowed origins:`, allowedOrigins);
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Invalid origin'
    });
  }
  
  next();
};