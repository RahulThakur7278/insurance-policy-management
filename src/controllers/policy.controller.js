'use strict';

/**
 * @file controllers/policy.controller.js
 */

const policyService = require('../services/policy.service');
const { success, paginated } = require('../utils/apiResponse');

/**
 * GET /api/v1/policies/search?username=John&page=1&limit=10
 */
const searchPolicies = async (req, res) => {
  const { username, page = 1, limit = 10 } = req.query;
  const { data, total } = await policyService.searchPoliciesByUsername(
    username,
    Number(page),
    Number(limit),
  );
  return paginated(res, data, page, limit, total, 'Policies retrieved successfully.');
};

/**
 * GET /api/v1/policies/aggregated
 */
const getAggregatedPolicies = async (req, res) => {
  const data = await policyService.getAggregatedPoliciesByUser();
  return success(res, data, 'Aggregated policies by user retrieved successfully.');
};

module.exports = { searchPolicies, getAggregatedPolicies };
