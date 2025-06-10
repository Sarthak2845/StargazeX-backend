/**
 * Global error handling middleware
 */

// Custom error class for API errors
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  
  // Log error
  console.error(`[ERROR] ${statusCode} - ${message}`);
  
  // Only send detailed errors in development
  const response = {
    error: true,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };
  
  // Send response
  res.status(statusCode).json(response);
};

// Not found middleware
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Not found - ${req.originalUrl}`);
  next(error);
};

module.exports = {
  ApiError,
  errorHandler,
  notFound
};