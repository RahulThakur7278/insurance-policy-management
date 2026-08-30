'use strict';

/**
 * @file server.js
 * @description Main entry point. Connects to MongoDB, starts the Express server,
 *              and initializes background services (CPU monitor, cron scheduler).
 */

require('dotenv').config();
require('express-async-errors');

const http = require('http');
const app = require('./app');
const logger = require('./config/logger');
const connectDB = require('./config/database');
const cpuMonitor = require('./services/cpuMonitor.service');
const cronScheduler = require('./services/cronScheduler.service');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Create HTTP server
    const server = http.createServer(app);

    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });

    // 3. Start background services
    cpuMonitor.start(server);
    cronScheduler.start();

    // 4. Graceful shutdown handlers
    const shutdown = (signal) => {
      logger.warn(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        cpuMonitor.stop();
        cronScheduler.stop();
        process.exit(0);
      });

      // Force shutdown after 10s
      setTimeout(() => {
        logger.error('Forced shutdown after timeout.');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
      shutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('Failed to bootstrap application:', error);
    process.exit(1);
  }
}

bootstrap();
