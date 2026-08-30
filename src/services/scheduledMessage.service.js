'use strict';

/**
 * @file services/scheduledMessage.service.js
 */

const ScheduledMessage = require('../models/scheduledMessage.model');
const { AppError } = require('../utils/AppError');
const { StatusCodes } = require('http-status-codes');

/**
 * Create and persist a scheduled message.
 * @param {{ message: string, day: string, time: string }} payload
 * @returns {Promise<ScheduledMessage>}
 */
async function createScheduledMessage(payload) {
  const { message, day, time } = payload;

  if (!message || !day || !time) {
    throw new AppError('message, day, and time are all required.', StatusCodes.BAD_REQUEST);
  }

  return ScheduledMessage.create({ message, day: day.toLowerCase(), time });
}

/**
 * Retrieve all scheduled messages with optional filtering.
 * @param {{ isDelivered?: boolean, page?: number, limit?: number }} filters
 */
async function getScheduledMessages({ isDelivered, page = 1, limit = 20 } = {}) {
  const query = {};
  if (isDelivered !== undefined) query.isDelivered = isDelivered === 'true' || isDelivered === true;

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    ScheduledMessage.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ScheduledMessage.countDocuments(query),
  ]);

  return { data, total };
}

module.exports = { createScheduledMessage, getScheduledMessages };
