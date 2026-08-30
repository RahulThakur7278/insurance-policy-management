'use strict';

/**
 * @file middleware/validate.middleware.js
 * @description express-validator result checker middleware.
 */

const { validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().reduce((acc, e) => {
      acc[e.path || e.param] = e.msg;
      return acc;
    }, {});
    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: 'Validation failed.',
      errors: formatted,
    });
  }
  next();
};

module.exports = { validate };
