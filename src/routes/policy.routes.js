'use strict';

/**
 * @file routes/policy.routes.js
 */

const { Router } = require('express');
const { query } = require('express-validator');
const { searchPolicies, getAggregatedPolicies } = require('../controllers/policy.controller');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

/**
 * @route   GET /api/v1/policies/search
 * @desc    Search policies by username (first name)
 * @query   username (required), page, limit
 */
router.get(
  '/search',
  [
    query('username').notEmpty().withMessage('username query parameter is required.').trim(),
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.').toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100.').toInt(),
  ],
  validate,
  searchPolicies,
);

/**
 * @route   GET /api/v1/policies/aggregated
 * @desc    Get policy count and stats aggregated per user
 */
router.get('/aggregated', getAggregatedPolicies);

module.exports = router;
