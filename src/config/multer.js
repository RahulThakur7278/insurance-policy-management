'use strict';

/**
 * @file config/multer.js
 * @description Multer v2 configuration for XLSX/CSV file uploads.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('../utils/AppError');
const { StatusCodes } = require('http-status-codes');

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

/**
 * Multer v2 fileFilter – called with (req, file) and returns a Promise<boolean>.
 * Returning false rejects the file; throwing rejects with an error.
 */
const fileFilter = async (_req, file) => {
  const ALLOWED_MIMES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv',
    'application/octet-stream', // some clients send this for xlsx
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = ALLOWED_MIMES.includes(file.mimetype) || ['.xlsx', '.xls', '.csv'].includes(ext);
  if (!allowed) {
    throw new AppError('Only XLSX/XLS/CSV files are allowed.', StatusCodes.BAD_REQUEST);
  }
  return true;
};

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10);

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
});

module.exports = upload;
