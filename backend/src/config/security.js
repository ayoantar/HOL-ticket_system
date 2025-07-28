const crypto = require('crypto');

// Security configuration and utilities
class SecurityConfig {
  constructor() {
    this.validateEnvironment();
  }

  validateEnvironment() {
    const requiredEnvVars = [
      'JWT_SECRET',
      'DB_HOST',
      'DB_NAME',
      'DB_USER',
      'DB_PASSWORD'
    ];

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate JWT secret strength
    if (process.env.JWT_SECRET.length < 32) {
      console.warn('WARNING: JWT_SECRET should be at least 32 characters long for security');
    }

    // Validate database connection settings
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.DB_SSL || process.env.DB_SSL !== 'true') {
        console.warn('WARNING: Database SSL should be enabled in production');
      }
    }
  }

  // Generate secure random tokens
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash sensitive data
  hashData(data, salt = crypto.randomBytes(16)) {
    const hash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512');
    return {
      hash: hash.toString('hex'),
      salt: salt.toString('hex')
    };
  }

  // Verify hashed data
  verifyHash(data, hash, salt) {
    const hashBuffer = crypto.pbkdf2Sync(data, Buffer.from(salt, 'hex'), 10000, 64, 'sha512');
    return hashBuffer.toString('hex') === hash;
  }

  // Sanitize database queries (additional layer)
  sanitizeQuery(query) {
    if (typeof query !== 'string') return query;
    
    // Remove potentially dangerous SQL keywords and characters
    return query
      .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi, '')
      .replace(/[;'"\\]/g, '')
      .trim();
  }

  // Generate CSRF tokens
  generateCSRFToken() {
    return crypto.randomBytes(24).toString('hex');
  }

  // Validate request timing (prevent timing attacks)
  constantTimeCompare(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  // Security headers configuration
  getSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin'
    };
  }

  // Content Security Policy
  getCSPDirectives() {
    return {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      childSrc: ["'none'"],
      workerSrc: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    };
  }

  // Input validation patterns
  getValidationPatterns() {
    return {
      email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      phone: /^[\+]?[1-9][\d]{0,15}$/,
      name: /^[a-zA-Z\s'-]{2,100}$/,
      alphanumeric: /^[a-zA-Z0-9]+$/,
      safeString: /^[a-zA-Z0-9\s\-_.()]+$/,
      url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
    };
  }

  // Rate limiting configurations
  getRateLimitConfigs() {
    return {
      auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 attempts per window
        skipSuccessfulRequests: true
      },
      general: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 200 // 200 requests per window
      },
      fileUpload: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 20 // 20 uploads per hour
      },
      requestCreation: {
        windowMs: 10 * 60 * 1000, // 10 minutes
        max: 10 // 10 requests per window
      }
    };
  }
}

module.exports = new SecurityConfig();