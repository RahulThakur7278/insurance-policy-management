'use strict';

/**
 * @file routes/index.js
 * @description Root API router – mounts all sub-routers.
 */

const { Router } = require('express');
const router = Router();

router.use('/upload', require('./upload.routes'));
router.use('/policies', require('./policy.routes'));
router.use('/messages', require('./scheduledMessage.routes'));
router.use('/system', require('./system.routes'));

module.exports = router;
