'use strict';

/**
 * @file middleware/errorHandler.middleware.js
 * @description Centralised error handling and 404 handler.
 */

const { StatusCodes } = require('http-status-codes');
const logger = require('../config/logger');
const { AppError } = require('../utils/AppError');

/**
 * Express 404 handler – must be placed after all routes.
 */
const notFoundHandler = (req, res, _next) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
};

/**
 * Express global error handler – must have 4 parameters.
 * @param {Error} err
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  logger.error(`[ErrorHandler] ${req.method} ${req.originalUrl} →`, err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).reduce((acc, e) => {
      acc[e.path] = e.message;
      return acc;
    }, {});
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(StatusCodes.CONFLICT).json({
      success: false,
      message: `Duplicate value for field: ${field}.`,
    });
  }

  // Mongoose CastError
  if (err.name === 'CastError') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: `Invalid value for field "${err.path}": ${err.value}`,
    });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(StatusCodes.REQUEST_TOO_LONG).json({
      success: false,
      message: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 50}MB.`,
    });
  }

  // Operational errors (AppError)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }

  // Unknown / programming errors – don't leak internals in production
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message =
    process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message;

  return res.status(statusCode).json({ success: false, message });
};

module.exports = { notFoundHandler, errorHandler };
