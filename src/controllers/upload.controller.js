'use strict';

/**
 * @file controllers/upload.controller.js
 * @description Handles XLSX/CSV file upload to seed MongoDB via Worker Thread.
 */

const { StatusCodes } = require('http-status-codes');
const { processUpload } = require('../services/upload.service');
const { created } = require('../utils/apiResponse');
const { AppError } = require('../utils/AppError');

/**
 * POST /api/v1/upload
 * Accepts a single file (field name: "file") of type XLSX, XLS, or CSV.
 */
const uploadFile = async (req, res) => {
  if (!req.file) {
    throw new AppError('No file was uploaded. Please send a file with field name "file".', StatusCodes.BAD_REQUEST);
  }

  const summary = await processUpload(req.file);

  return created(res, summary, 'File uploaded and data inserted successfully.');
};

module.exports = { uploadFile };
