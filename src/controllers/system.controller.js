'use strict';

/**
 * @file controllers/system.controller.js
 * @description System-level endpoints (CPU stats, health).
 */

const { getCpuUsage } = require('../services/cpuMonitor.service');
const { success } = require('../utils/apiResponse');
const os = require('os');

/**
 * GET /api/v1/system/cpu
 */
const getCpuStats = async (_req, res) => {
  const usage = await getCpuUsage();
  return success(res, {
    cpuUsagePercent: usage,
    threshold: parseFloat(process.env.CPU_THRESHOLD || '70'),
    cpuCount: os.cpus().length,
    platform: os.platform(),
    uptime: process.uptime(),
    memoryUsedMB: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024),
    memoryTotalMB: Math.round(os.totalmem() / 1024 / 1024),
  }, 'CPU stats retrieved.');
};

module.exports = { getCpuStats };
