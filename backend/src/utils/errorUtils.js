const crypto = require('crypto');

/**
 * Generate a unique error ID for tracking purposes
 * Format: ERR-YYYYMMDD-HHMMSS-XXXX
 * Example: ERR-20250729-143022-A7B9
 */
const generateErrorId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  
  // Generate 4-character random suffix
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  
  return `ERR-${year}${month}${day}-${hour}${minute}${second}-${randomSuffix}`;
};

/**
 * Create a standardized error response with unique identifier
 * @param {string} message - Error message
 * @param {Error} error - Original error object (optional)
 * @param {object} context - Additional context (optional)
 * @returns {object} Standardized error response
 */
const createErrorResponse = (message, error = null, context = {}) => {
  const errorId = generateErrorId();
  const timestamp = new Date().toISOString();
  
  // Log error details for server-side debugging
  console.error(`🔴 Error ID: ${errorId}`, {
    message,
    error: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : null,
    context,
    timestamp
  });
  
  return {
    success: false,
    message,
    errorId,
    timestamp,
    ...(process.env.NODE_ENV === 'development' && error ? {
      debug: {
        error: error.message,
        stack: error.stack
      }
    } : {})
  };
};

/**
 * Middleware to add error ID to all error responses
 */
const errorIdMiddleware = (err, req, res, next) => {
  const errorResponse = createErrorResponse(
    err.message || 'Internal server error',
    err,
    {
      method: req.method,
      url: req.url,
      body: req.body,
      user: req.user ? { id: req.user.id, email: req.user.email } : null
    }
  );
  
  res.status(err.status || 500).json(errorResponse);
};

module.exports = {
  generateErrorId,
  createErrorResponse,
  errorIdMiddleware
};