'use strict';

/**
 * @file controllers/scheduledMessage.controller.js
 */

const { StatusCodes } = require('http-status-codes');
const scheduledMessageService = require('../services/scheduledMessage.service');
const { created, paginated } = require('../utils/apiResponse');

/**
 * POST /api/v1/messages/schedule
 * Body: { message, day, time }
 */
const createMessage = async (req, res) => {
  const doc = await scheduledMessageService.createScheduledMessage(req.body);
  return created(res, doc, 'Message scheduled successfully.');
};

/**
 * GET /api/v1/messages/schedule?isDelivered=false&page=1&limit=20
 */
const getMessages = async (req, res) => {
  const { isDelivered, page = 1, limit = 20 } = req.query;
  const { data, total } = await scheduledMessageService.getScheduledMessages({
    isDelivered,
    page: Number(page),
    limit: Number(limit),
  });
  return paginated(res, data, page, limit, total, 'Scheduled messages retrieved.');
};

module.exports = { createMessage, getMessages };
