import rateLimit from 'express-rate-limit';

// General rate limiter for API routes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiter for form submissions
export const formSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 form submissions per hour per IP
  message: {
    success: false,
    message: 'Too many form submissions, please try again later'
  },
  skipSuccessfulRequests: false
});

// Rate limiter for chat endpoints
export const chatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 messages per 5 minutes
  message: {
    success: false,
    message: 'Too many chat messages, please wait a moment'
  }
});

// Rate limiter for lead creation
export const leadCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 leads per hour per IP
  message: {
    success: false,
    message: 'Too many lead creation attempts, please try again later'
  }
});

// Rate limiter for content downloads
export const downloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 downloads per hour per IP
  message: {
    success: false,
    message: 'Too many download attempts, please try again later'
  }
});

// Rate limiter for search endpoints
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: {
    success: false,
    message: 'Too many search requests, please slow down'
  }
});

// Admin endpoints rate limiter (more lenient for authenticated admins)
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes for admins
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  }
});
