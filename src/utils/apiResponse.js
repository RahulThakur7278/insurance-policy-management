'use strict';

/**
 * @file utils/apiResponse.js
 * @description Standardised JSON response helpers.
 */

const success = (res, data = null, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const created = (res, data = null, message = 'Resource created') =>
  success(res, data, message, 201);

const paginated = (res, data, page, limit, total, message = 'Success') =>
  res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  });

const error = (res, message = 'Internal Server Error', statusCode = 500, errors = null) =>
  res.status(statusCode).json({ success: false, message, errors });

module.exports = { success, created, paginated, error };
