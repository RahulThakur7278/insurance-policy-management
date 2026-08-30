'use strict';

/**
 * @file routes/system.routes.js
 */

const { Router } = require('express');
const { getCpuStats } = require('../controllers/system.controller');

const router = Router();

/**
 * @route   GET /api/v1/system/cpu
 * @desc    Real-time CPU and memory stats
 */
router.get('/cpu', getCpuStats);

module.exports = router;
