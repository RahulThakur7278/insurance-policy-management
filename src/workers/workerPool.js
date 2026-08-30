'use strict';

/**
 * @file workers/workerPool.js
 * @description Launches a file-parser Worker thread and returns a Promise
 *              that resolves with the parsed row data.
 */

const { Worker } = require('worker_threads');
const path = require('path');
const logger = require('../config/logger');

const WORKER_PATH = path.join(__dirname, 'fileParser.worker.js');

/**
 * Parse a file using a dedicated Worker thread.
 *
 * @param {string} filePath   - Absolute path to the uploaded file.
 * @param {'xlsx'|'csv'} fileType - File format hint.
 * @returns {Promise<object[]>} - Resolves with array of normalised row objects.
 */
function parseFileInWorker(filePath, fileType) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_PATH, {
      workerData: { filePath, fileType },
    });

    worker.on('message', (msg) => {
      if (msg.type === 'progress') {
        logger.info(`[Worker] Parsed ${msg.parsed} rows so far…`);
      } else if (msg.type === 'done') {
        resolve(msg.data);
      } else if (msg.type === 'error') {
        reject(new Error(msg.message));
      }
    });

    worker.on('error', (err) => {
      logger.error('[Worker] Thread error:', err);
      reject(err);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker exited with code ${code}`));
      }
    });
  });
}

module.exports = { parseFileInWorker };
