/**
 * API Response Utility
 *
 * Provides standardized response helpers to ensure all API endpoints
 * return consistent JSON structures.
 *
 * Usage:
 *   const apiResponse = require('./utils/apiResponse');
 *   res.status(200).json(apiResponse.success({ complaints: [...] }));
 *   res.status(400).json(apiResponse.error('Invalid input', { field: 'email' }));
 */

/**
 * Success response format
 * @param {*} data - Response data payload
 * @param {string} message - Optional success message
 * @param {number} statusCode - HTTP status code (default 200)
 */
const success = (data, message = "Success", statusCode = 200) => {
  return {
    success: true,
    message,
    statusCode,
    data,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Error response format
 * @param {string} message - Error message
 * @param {*} details - Optional error details (validation errors, etc.)
 * @param {number} statusCode - HTTP status code (default 400)
 */
const error = (message = "An error occurred", details = null, statusCode = 400) => {
  return {
    success: false,
    message,
    statusCode,
    ...(details && { details }),
    timestamp: new Date().toISOString(),
  };
};

/**
 * Paginated response format
 * @param {array} data - Array of items
 * @param {number} page - Current page
 * @param {number} pages - Total pages
 * @param {number} total - Total item count
 * @param {string} message - Optional message
 */
const paginated = (data, { page, pages, total, count, message = "Success" }) => {
  return {
    success: true,
    message,
    statusCode: 200,
    data,
    pagination: {
      page,
      pages,
      total,
      count,
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Validation error response (400 Bad Request)
 * @param {array|object} errors - Array of error messages or object of field errors
 */
const validationError = (errors) => {
  return error("Validation failed", Array.isArray(errors) ? { errors } : errors, 400);
};

/**
 * Not found response (404)
 * @param {string} resource - Resource name (e.g., 'Complaint')
 */
const notFound = (resource = "Resource") => {
  return error(`${resource} not found`, null, 404);
};

/**
 * Unauthorized response (401)
 */
const unauthorized = (message = "Authentication required") => {
  return error(message, null, 401);
};

/**
 * Forbidden response (403)
 */
const forbidden = (message = "Access denied") => {
  return error(message, null, 403);
};

/**
 * Server error response (500)
 * @param {string} message - Error message
 */
const serverError = (message = "Internal server error") => {
  return error(message, null, 500);
};

module.exports = {
  success,
  error,
  paginated,
  validationError,
  notFound,
  unauthorized,
  forbidden,
  serverError,
};
