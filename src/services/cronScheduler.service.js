'use strict';

/**
 * @file services/cronScheduler.service.js
 * @description Runs a cron job every minute to deliver ScheduledMessages
 *              whose day + time match the current wall-clock time.
 *
 * Cron expression: "* * * * *"  →  runs at the start of every minute.
 *
 * For each undelivered message where:
 *   msg.day  === current day-of-week  (e.g. "monday")
 *   msg.time === current HH:MM        (e.g. "14:30")
 *
 * We mark the message as delivered and set deliveredAt.
 */

const cron = require('node-cron');
const logger = require('../config/logger');
const ScheduledMessage = require('../models/scheduledMessage.model');

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

let _task = null;

async function deliverDueMessages() {
  const now = new Date();
  const currentDay = DAYS[now.getDay()];
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${hh}:${mm}`;

  logger.info(`[Cron] Checking scheduled messages for ${currentDay} ${currentTime}`);

  try {
    const messages = await ScheduledMessage.find({
      day: currentDay,
      time: currentTime,
      isDelivered: false,
    });

    if (!messages.length) {
      logger.info('[Cron] No messages to deliver at this time.');
      return;
    }

    const ids = messages.map((m) => m._id);
    const result = await ScheduledMessage.updateMany(
      { _id: { $in: ids } },
      { $set: { isDelivered: true, deliveredAt: now } },
    );

    logger.info(`[Cron] Delivered ${result.modifiedCount} message(s) for ${currentDay} ${currentTime}`);

    // In a real system you would push to a queue / websocket / email here
    for (const msg of messages) {
      logger.info(`[Cron] Message delivered → "${msg.message}"`);
    }
  } catch (err) {
    logger.error('[Cron] Error delivering scheduled messages:', err);
  }
}

/**
 * Start the cron scheduler (every minute).
 */
function start() {
  if (_task) return;
  _task = cron.schedule('* * * * *', deliverDueMessages, { scheduled: true, timezone: 'UTC' });
  logger.info('[Cron] Scheduler started (every minute).');
}

/**
 * Stop the cron scheduler.
 */
function stop() {
  if (_task) {
    _task.stop();
    _task = null;
    logger.info('[Cron] Scheduler stopped.');
  }
}

module.exports = { start, stop, deliverDueMessages };
