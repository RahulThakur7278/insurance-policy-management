'use strict';

/**
 * @file routes/scheduledMessage.routes.js
 */

const { Router } = require('express');
const { body, query } = require('express-validator');
const { createMessage, getMessages } = require('../controllers/scheduledMessage.controller');
const { validate } = require('../middleware/validate.middleware');

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const router = Router();

/**
 * @route   POST /api/v1/messages/schedule
 * @desc    Schedule a message to be inserted at a specific day and time
 * @body    { message: string, day: string, time: "HH:MM" }
 */
router.post(
  '/schedule',
  [
    body('message')
      .notEmpty().withMessage('message is required.')
      .isString().withMessage('message must be a string.')
      .isLength({ max: 2000 }).withMessage('message cannot exceed 2000 characters.')
      .trim(),
    body('day')
      .notEmpty().withMessage('day is required.')
      .toLowerCase()
      .isIn(DAYS).withMessage(`day must be one of: ${DAYS.join(', ')}.`),
    body('time')
      .notEmpty().withMessage('time is required.')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('time must be in HH:MM (24-hour) format.'),
  ],
  validate,
  createMessage,
);

/**
 * @route   GET /api/v1/messages/schedule
 * @desc    List all scheduled messages (filterable by delivery status)
 * @query   isDelivered (boolean), page, limit
 */
router.get(
  '/schedule',
  [
    query('isDelivered').optional().isBoolean().withMessage('isDelivered must be true or false.'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  getMessages,
);

module.exports = router;
