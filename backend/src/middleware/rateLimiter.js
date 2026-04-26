import rateLimit from 'express-rate-limit';

/**
 * Simple rate limiting for all routes
 * Basic protection for college project - keeps it simple
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 500, // Higher limit in dev for testing
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export default limiter;
