'use strict';

/**
 * @file services/policy.service.js
 * @description Business logic for policy search, detail lookup, and aggregation.
 */

const User = require('../models/user.model');
const Policy = require('../models/policy.model');
const { AppError } = require('../utils/AppError');
const { StatusCodes } = require('http-status-codes');

/**
 * Find all policies belonging to a user, matched by first name (case-insensitive).
 *
 * @param {string} username - Partial or full first name to search.
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<{ data: object[], total: number }>}
 */
async function searchPoliciesByUsername(username, page = 1, limit = 10) {
  if (!username || !username.trim()) {
    throw new AppError('username query parameter is required.', StatusCodes.BAD_REQUEST);
  }

  const skip = (page - 1) * limit;

  // Find matching users
  const users = await User.find(
    { firstName: { $regex: username.trim(), $options: 'i' } },
    '_id firstName email',
  ).lean();

  if (!users.length) {
    return { data: [], total: 0 };
  }

  const userIds = users.map((u) => u._id);

  const [data, total] = await Promise.all([
    Policy.find({ userId: { $in: userIds } })
      .populate('userId', 'firstName email phone state')
      .populate('categoryId', 'categoryName')
      .populate('companyId', 'companyName')
      .skip(skip)
      .limit(limit)
      .lean(),
    Policy.countDocuments({ userId: { $in: userIds } }),
  ]);

  return { data, total };
}

/**
 * Return aggregated policy stats grouped by user.
 *
 * Pipeline:
 *   1. Group by userId → count, list of policyNumbers, min start, max end
 *   2. Lookup User to get name + email
 *   3. Lookup Category breakdown (sub-pipeline)
 *
 * @returns {Promise<object[]>}
 */
async function getAggregatedPoliciesByUser() {
  return Policy.aggregate([
    {
      $group: {
        _id: '$userId',
        totalPolicies: { $sum: 1 },
        policyNumbers: { $push: '$policyNumber' },
        earliestStart: { $min: '$policyStartDate' },
        latestEnd: { $max: '$policyEndDate' },
        categories: { $addToSet: '$categoryId' },
        carriers: { $addToSet: '$companyId' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmpty: false } },
    {
      $lookup: {
        from: 'categories',
        localField: 'categories',
        foreignField: '_id',
        as: 'categoryDetails',
      },
    },
    {
      $lookup: {
        from: 'carriers',
        localField: 'carriers',
        foreignField: '_id',
        as: 'carrierDetails',
      },
    },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        userName: '$user.firstName',
        userEmail: '$user.email',
        totalPolicies: 1,
        policyNumbers: 1,
        earliestStart: 1,
        latestEnd: 1,
        categories: '$categoryDetails.categoryName',
        carriers: '$carrierDetails.companyName',
      },
    },
    { $sort: { totalPolicies: -1 } },
  ]);
}

module.exports = { searchPoliciesByUsername, getAggregatedPoliciesByUser };
