/**
 * @fileoverview Advanced logging utility using Winston
 * Provides structured logging with multiple log levels, file rotation, and environment-specific configuration
 * @version 2.0.0
 * @author Smart Navigator Team
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Custom log levels with priorities
 * Higher priority = more important logs
 */
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

/**
 * Color coding for console output
 */
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'gray'
};

// Add colors to winston
winston.addColors(logColors);

/**
 * Custom log format for better readability
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.printf(({ timestamp, level, message, metadata, stack }) => {
    let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      log += ` | ${JSON.stringify(metadata)}`;
    }
    
    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

/**
 * Console format with colors
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, metadata }) => {
    let log = `[${timestamp}] ${level}: ${message}`;
    
    // Add metadata for console in a more readable format
    if (metadata && Object.keys(metadata).length > 0) {
      const metaStr = Object.entries(metadata)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(', ');
      log += ` (${metaStr})`;
    }
    
    return log;
  })
);

/**
 * Determine log level based on environment
 * @returns {string} The appropriate log level
 */
const getLogLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return 'warn';
    case 'test':
      return 'error';
    case 'development':
    default:
      return 'debug';
  }
};

/**
 * Create transports based on environment
 * @returns {winston.transport[]} Array of winston transports
 */
const createTransports = () => {
  const transports = [];
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';
  
  // Console transport (always enabled except in test)
  if (!isTest) {
    transports.push(
      new winston.transports.Console({
        level: getLogLevel(),
        format: consoleFormat
      })
    );
  }
  
  // File transports for non-test environments
  if (!isTest) {
    const logDir = path.join(__dirname, '../../logs');
    
    // Error log file
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        tailable: true
      })
    );
    
    // Combined log file
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        level: getLogLevel(),
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 10,
        tailable: true
      })
    );
    
    // HTTP requests log (production only)
    if (isProduction) {
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, 'http.log'),
          level: 'http',
          format: logFormat,
          maxsize: 10485760, // 10MB
          maxFiles: 3,
          tailable: true
        })
      );
    }
  }
  
  return transports;
};

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  levels: logLevels,
  level: getLogLevel(),
  format: logFormat,
  transports: createTransports(),
  exitOnError: false,
  
  // Handle uncaught exceptions and rejections
  exceptionHandlers: process.env.NODE_ENV !== 'test' ? [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/exceptions.log'),
      format: logFormat
    })
  ] : [],
  
  rejectionHandlers: process.env.NODE_ENV !== 'test' ? [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/rejections.log'),
      format: logFormat
    })
  ] : []
});

/**
 * Enhanced logging methods with context support
 */
class Logger {
  /**
   * Create a child logger with persistent context
   * @param {Object} context - Context to be included in all logs
   * @returns {Logger} Child logger instance
   * 
   * @example
   * const userLogger = logger.child({ userId: '12345', action: 'login' });
   * userLogger.info('User logged in successfully');
   */
  child(context) {
    return new Logger(this.logger.child(context));
  }
  
  constructor(winstonLogger = logger) {
    this.logger = winstonLogger;
  }
  
  /**
   * Log error messages
   * @param {string} message - Error message
   * @param {Error|Object} meta - Error object or metadata
   * 
   * @example
   * logger.error('Database connection failed', error);
   * logger.error('User not found', { userId: '123', action: 'lookup' });
   */
  error(message, meta = {}) {
    this.logger.error(message, meta);
  }
  
  /**
   * Log warning messages
   * @param {string} message - Warning message
   * @param {Object} meta - Additional metadata
   * 
   * @example
   * logger.warn('Cache miss for user data', { userId: '123' });
   */
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }
  
  /**
   * Log informational messages
   * @param {string} message - Info message
   * @param {Object} meta - Additional metadata
   * 
   * @example
   * logger.info('User registered successfully', { userId: '123', email: 'user@example.com' });
   */
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }
  
  /**
   * Log HTTP request/response information
   * @param {string} message - HTTP message
   * @param {Object} meta - Request/response metadata
   * 
   * @example
   * logger.http('POST /api/users', { 
   *   statusCode: 201, 
   *   responseTime: 150,
   *   userId: '123' 
   * });
   */
  http(message, meta = {}) {
    this.logger.http(message, meta);
  }
  
  /**
   * Log verbose messages (detailed operational info)
   * @param {string} message - Verbose message
   * @param {Object} meta - Additional metadata
   * 
   * @example
   * logger.verbose('Cache updated', { cacheKey: 'user:123', ttl: 3600 });
   */
  verbose(message, meta = {}) {
    this.logger.verbose(message, meta);
  }
  
  /**
   * Log debug messages (development info)
   * @param {string} message - Debug message
   * @param {Object} meta - Additional metadata
   * 
   * @example
   * logger.debug('Query executed', { query: 'SELECT * FROM users', executionTime: 25 });
   */
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }
  
  /**
   * Log silly messages (very detailed debug info)
   * @param {string} message - Silly message
   * @param {Object} meta - Additional metadata
   */
  silly(message, meta = {}) {
    this.logger.silly(message, meta);
  }
  
  /**
   * Time a function execution
   * @param {string} label - Timer label
   * @returns {Function} Function to end the timer
   * 
   * @example
   * const endTimer = logger.timer('database-query');
   * // ... perform operation
   * endTimer(); // Logs: "database-query completed in 150ms"
   */
  timer(label) {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.info(`${label} completed`, { duration: `${duration}ms` });
    };
  }
  
  /**
   * Log and measure async function performance
   * @param {string} operation - Operation name
   * @param {Function} fn - Async function to measure
   * @param {Object} context - Additional context
   * @returns {Promise} Function result
   * 
   * @example
   * const user = await logger.measure('user-lookup', 
   *   () => User.findById(userId), 
   *   { userId }
   * );
   */
  async measure(operation, fn, context = {}) {
    const endTimer = this.timer(operation);
    try {
      this.debug(`Starting ${operation}`, context);
      const result = await fn();
      endTimer();
      this.debug(`${operation} succeeded`, { ...context, success: true });
      return result;
    } catch (error) {
      endTimer();
      this.error(`${operation} failed`, { ...context, error: error.message, stack: error.stack });
      throw error;
    }
  }
}

// Create default logger instance
const defaultLogger = new Logger();

/**
 * Create logs directory if it doesn't exist
 */
const ensureLogDirectory = async () => {
  if (process.env.NODE_ENV === 'test') return;
  
  try {
    const { mkdir } = await import('fs/promises');
    const logDir = path.join(__dirname, '../../logs');
    await mkdir(logDir, { recursive: true });
    defaultLogger.debug('Log directory ensured', { path: logDir });
  } catch (error) {
    console.error('Failed to create log directory:', error.message);
  }
};

// Initialize log directory
ensureLogDirectory();

export default defaultLogger;
export { Logger, logLevels, logColors };
