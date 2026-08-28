'use strict';

/**
 * @file config/database.js
 * @description Mongoose connection factory with retry logic.
 */

const mongoose = require('mongoose');
const logger = require('./logger');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

async function connectDB(attempt = 1) {
  const uri = process.env.NODE_ENV === 'test'
    ? process.env.MONGO_URI_TEST
    : process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables.');
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info(`✅ MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    if (attempt <= MAX_RETRIES) {
      logger.warn(`MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return connectDB(attempt + 1);
    }
    logger.error('MongoDB connection exhausted all retries.', error);
    throw error;
  }

  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected.'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected.'));
  mongoose.connection.on('error', (err) => logger.error('MongoDB runtime error:', err));
}

module.exports = connectDB;
