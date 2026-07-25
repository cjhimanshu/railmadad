/**
 * Centralized Logging Module
 *
 * Provides structured logging with different severity levels.
 * Environment-aware: enables debug logs in development, filters in production.
 *
 * Usage:
 *   const logger = require('./utils/logger');
 *   logger.info('Server started', { port: 5000 });
 *   logger.error('Database error', { code: 'ECONNREFUSED' });
 *   logger.warn('High memory usage', { usage: '85%' });
 *   logger.debug('Processing complaint', { id: '12345' });
 */

const isDev = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

// Color codes for terminal output (disabled in production/test)
const colors = {
  reset: "\x1b[0m",
  debug: "\x1b[36m", // cyan
  info: "\x1b[32m", // green
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
};

const getColor = (level) => (isDev ? colors[level] || "" : "");
const getReset = () => (isDev ? colors.reset : "");

/**
 * Format timestamp in ISO format (YYYY-MM-DDTHH:mm:ss.SSSZ)
 */
const getTimestamp = () => new Date().toISOString();

/**
 * Format context object into readable string
 */
const formatContext = (context) => {
  if (!context || Object.keys(context).length === 0) return "";
  return " " + JSON.stringify(context);
};

/**
 * Log message with structured format
 * Format: [TIMESTAMP] [LEVEL] message context
 */
const log = (level, message, context = {}) => {
  const timestamp = getTimestamp();
  const color = getColor(level);
  const reset = getReset();
  const contextStr = formatContext(context);
  const levelUpper = level.toUpperCase();

  const output = `${color}[${timestamp}] [${levelUpper}]${reset} ${message}${contextStr}`;

  // Use appropriate console method
  if (level === "error" || level === "warn") {
    console.error(output);
  } else {
    console.log(output);
  }
};

module.exports = {
  /**
   * Debug level - detailed diagnostic information
   * Only logged in development mode
   */
  debug: (message, context = {}) => {
    if (isDev && !isTest) {
      log("debug", message, context);
    }
  },

  /**
   * Info level - general informational messages
   * Always logged (except in test mode)
   */
  info: (message, context = {}) => {
    if (!isTest) {
      log("info", message, context);
    }
  },

  /**
   * Warn level - warning messages for potentially problematic situations
   * Always logged (except in test mode)
   */
  warn: (message, context = {}) => {
    if (!isTest) {
      log("warn", message, context);
    }
  },

  /**
   * Error level - error messages for serious problems
   * Always logged (except in test mode)
   */
  error: (message, context = {}) => {
    if (!isTest) {
      log("error", message, context);
    }
  },

  /**
   * Express middleware for request logging
   * Logs incoming requests and outgoing responses
   */
  requestLogger: (req, res, next) => {
    // Store request start time
    const startTime = Date.now();
    const { method, path, ip } = req;

    // Override res.json to intercept response
    const originalJson = res.json.bind(res);
    res.json = function (data) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Only log if enabled in development
      if (isDev) {
        console.log(
          `${getColor("info")}[${getTimestamp()}] [REQUEST]${getReset} ` +
            `${method} ${path} ${statusCode} ${duration}ms (${ip || "unknown-ip"})`
        );
      }

      return originalJson(data);
    };

    next();
  },
};
