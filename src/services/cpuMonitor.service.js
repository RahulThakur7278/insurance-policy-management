'use strict';

/**
 * @file services/cpuMonitor.service.js
 * @description Polls CPU utilization at a configurable interval.
 *              If usage exceeds the threshold (default 70%), the HTTP
 *              server is closed and the process exits so the process
 *              manager (PM2 / systemd) can restart it.
 */

const os = require('os');
const logger = require('../config/logger');

const THRESHOLD = parseFloat(process.env.CPU_THRESHOLD || '70');
const INTERVAL_MS = parseInt(process.env.CPU_CHECK_INTERVAL_MS || '5000', 10);

let _intervalId = null;

/**
 * Sample total CPU times across all cores.
 * @returns {{ idle: number, total: number }}
 */
function cpuTimes() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    for (const type of Object.keys(cpu.times)) {
      total += cpu.times[type];
    }
    idle += cpu.times.idle;
  }
  return { idle, total };
}

/**
 * Returns current CPU usage percentage (averaged over INTERVAL_MS).
 * Uses two successive snapshots to get a real delta.
 *
 * @returns {Promise<number>}
 */
function getCpuUsage() {
  return new Promise((resolve) => {
    const start = cpuTimes();
    setTimeout(() => {
      const end = cpuTimes();
      const idleDiff = end.idle - start.idle;
      const totalDiff = end.total - start.total;
      const usage = totalDiff === 0 ? 0 : 100 - (100 * idleDiff) / totalDiff;
      resolve(parseFloat(usage.toFixed(2)));
    }, 1000); // 1-second sample window
  });
}

/**
 * Start the CPU monitor. Restarts the process via process.exit() when
 * the threshold is breached (PM2/systemd will restart the process).
 *
 * @param {import('http').Server} server - The HTTP server instance to close gracefully.
 */
function start(server) {
  if (_intervalId) return; // prevent double-start

  logger.info(`CPU monitor started (threshold=${THRESHOLD}%, interval=${INTERVAL_MS}ms)`);

  _intervalId = setInterval(async () => {
    try {
      const usage = await getCpuUsage();
      logger.info(`CPU usage: ${usage}%`);

      if (usage >= THRESHOLD) {
        logger.warn(`⚠️  CPU usage ${usage}% >= ${THRESHOLD}%. Initiating server restart…`);

        // Close HTTP server gracefully, then exit
        server.close(() => {
          logger.warn('HTTP server closed due to high CPU. Process exiting for restart…');
          process.exit(0); // PM2 / systemd will restart
        });

        // Hard kill after 5 s if server.close() hangs
        setTimeout(() => {
          logger.error('Forced exit after CPU threshold exceeded.');
          process.exit(1);
        }, 5000).unref();

        clearInterval(_intervalId);
        _intervalId = null;
      }
    } catch (err) {
      logger.error('CPU monitor error:', err);
    }
  }, INTERVAL_MS);

  // Allow process to exit even if interval is active
  if (_intervalId.unref) _intervalId.unref();
}

/**
 * Stop the CPU monitor.
 */
function stop() {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
    logger.info('CPU monitor stopped.');
  }
}

module.exports = { start, stop, getCpuUsage };
