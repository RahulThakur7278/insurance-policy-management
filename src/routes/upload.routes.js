'use strict';

/**
 * @file routes/upload.routes.js
 * @description POST /api/v1/upload
 */

const { Router } = require('express');
const upload = require('../config/multer');
const { uploadFile } = require('../controllers/upload.controller');

const router = Router();

/**
 * Multer v2 throws errors asynchronously; wrap single() so errors
 * are forwarded to the Express global error handler via next(err).
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const multerSingle = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};

/**
 * @route   POST /api/v1/upload
 * @desc    Upload an XLSX or CSV file; data is parsed via Worker Thread
 *          and bulk-upserted into all 6 MongoDB collections.
 * @access  Public
 * @body    multipart/form-data  →  field: "file"
 */
router.post('/', multerSingle, uploadFile);

module.exports = router;
