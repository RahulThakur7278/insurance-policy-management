'use strict';

/**
 * @file services/upload.service.js
 * @description Orchestrates file parsing (via Worker Thread) and bulk
 *              upsert into all 6 MongoDB collections.
 *
 * Expected normalised column names from the spreadsheet:
 *   agent_name
 *   first_name, dob, address, phone, state, zip_code, email, gender, user_type
 *   account_name
 *   category_name
 *   company_name
 *   policy_number, policy_start_date, policy_end_date
 */

const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');
const { parseFileInWorker } = require('../workers/workerPool');
const { AppError } = require('../utils/AppError');
const { StatusCodes } = require('http-status-codes');

const Agent = require('../models/agent.model');
const User = require('../models/user.model');
const Account = require('../models/account.model');
const Category = require('../models/category.model');
const Carrier = require('../models/carrier.model');
const Policy = require('../models/policy.model');

/**
 * Determines file type from extension.
 * @param {string} filename
 * @returns {'xlsx'|'csv'}
 */
function resolveFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (['.xlsx', '.xls'].includes(ext)) return 'xlsx';
  if (ext === '.csv') return 'csv';
  throw new AppError('Unsupported file type. Use XLSX or CSV.', StatusCodes.BAD_REQUEST);
}

/**
 * Safe date parser – returns undefined if the value is empty/invalid.
 * @param {*} value
 * @returns {Date|undefined}
 */
function parseDate(value) {
  if (!value) return undefined;
  if (value instanceof Date) return isNaN(value) ? undefined : value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

/**
 * Bulk-upsert documents using bulkWrite for efficiency.
 * @param {import('mongoose').Model} Model
 * @param {object[]} docs
 * @param {string} matchField - The field used as the upsert key.
 */
async function bulkUpsert(Model, docs, matchField) {
  if (!docs.length) return { upsertedCount: 0, modifiedCount: 0 };

  const ops = docs.map((doc) => ({
    updateOne: {
      filter: { [matchField]: doc[matchField] },
      update: { $setOnInsert: doc },
      upsert: true,
    },
  }));

  return Model.bulkWrite(ops, { ordered: false });
}

/**
 * Main upload orchestrator.
 * @param {Express.Multer.File} file
 * @returns {Promise<object>} - Upload summary.
 */
async function processUpload(file) {
  const fileType = resolveFileType(file.originalname);
  logger.info(`Processing upload: ${file.originalname} (${fileType})`);

  // Step 1: Parse file in a Worker Thread
  let rows;
  try {
    rows = await parseFileInWorker(file.path, fileType);
  } finally {
    // Always clean up the temp file
    fs.unlink(file.path, (err) => {
      if (err) logger.warn(`Could not delete temp file: ${file.path}`, err);
    });
  }

  if (!rows.length) {
    throw new AppError('Uploaded file has no data rows.', StatusCodes.UNPROCESSABLE_ENTITY);
  }

  logger.info(`Worker parsed ${rows.length} rows. Starting DB upserts…`);

  // Step 2: Extract unique sets for each collection
  const agentSet = new Map();
  const userSet = new Map();
  const accountSet = new Map();
  const categorySet = new Map();
  const carrierSet = new Map();
  const policyRows = [];

  for (const row of rows) {
    // Agent
    if (row.agent_name && !agentSet.has(row.agent_name)) {
      agentSet.set(row.agent_name, { agentName: row.agent_name });
    }

    // User (keyed by email)
    if (row.email && !userSet.has(row.email)) {
      userSet.set(row.email, {
        firstName: row.first_name || row.firstname || '',
        dob: parseDate(row.dob || row.date_of_birth),
        address: row.address || '',
        phone: row.phone || row.phone_number || '',
        state: row.state || '',
        zipCode: row.zip_code || row.zipcode || row.zip || '',
        email: row.email,
        gender: (row.gender || 'prefer_not_to_say').toLowerCase(),
        userType: (row.user_type || row.usertype || 'standard').toLowerCase(),
      });
    }

    // Account
    if (row.account_name && row.email) {
      const key = `${row.account_name}__${row.email}`;
      if (!accountSet.has(key)) accountSet.set(key, { accountName: row.account_name, _userEmail: row.email });
    }

    // Category (LOB)
    if (row.category_name && !categorySet.has(row.category_name)) {
      categorySet.set(row.category_name, { categoryName: row.category_name });
    }

    // Carrier
    if (row.company_name && !carrierSet.has(row.company_name)) {
      carrierSet.set(row.company_name, { companyName: row.company_name });
    }

    // Policy raw (resolve refs later)
    if (row.policy_number) {
      policyRows.push({
        policyNumber: row.policy_number,
        policyStartDate: parseDate(row.policy_start_date),
        policyEndDate: parseDate(row.policy_end_date),
        _categoryName: row.category_name,
        _companyName: row.company_name,
        _userEmail: row.email,
      });
    }
  }

  // Step 3: Upsert independent collections in parallel
  const [agentResult, categoryResult, carrierResult] = await Promise.all([
    bulkUpsert(Agent, [...agentSet.values()], 'agentName'),
    bulkUpsert(Category, [...categorySet.values()], 'categoryName'),
    bulkUpsert(Carrier, [...carrierSet.values()], 'companyName'),
  ]);

  // Step 4: Upsert users
  await bulkUpsert(User, [...userSet.values()], 'email');

  // Step 5: Build ID lookup maps from DB
  const [allUsers, allCategories, allCarriers] = await Promise.all([
    User.find({ email: { $in: [...userSet.keys()] } }, '_id email').lean(),
    Category.find({ categoryName: { $in: [...categorySet.keys()] } }, '_id categoryName').lean(),
    Carrier.find({ companyName: { $in: [...carrierSet.keys()] } }, '_id companyName').lean(),
  ]);

  const userIdMap = new Map(allUsers.map((u) => [u.email, u._id]));
  const categoryIdMap = new Map(allCategories.map((c) => [c.categoryName, c._id]));
  const carrierIdMap = new Map(allCarriers.map((c) => [c.companyName, c._id]));

  // Step 6: Upsert accounts (need userId)
  const accountDocs = [];
  for (const acc of accountSet.values()) {
    const userId = userIdMap.get(acc._userEmail);
    if (userId) accountDocs.push({ accountName: acc.accountName, userId });
  }
  const accountResult = await bulkUpsert(Account, accountDocs, 'accountName');

  // Step 7: Upsert policies (need all 3 refs)
  const policyDocs = [];
  for (const p of policyRows) {
    const userId = userIdMap.get(p._userEmail);
    const categoryId = categoryIdMap.get(p._categoryName);
    const companyId = carrierIdMap.get(p._companyName);

    if (!userId || !categoryId || !companyId) {
      logger.warn(`Skipping policy ${p.policyNumber}: missing reference(s).`);
      continue;
    }

    policyDocs.push({
      policyNumber: p.policyNumber,
      policyStartDate: p.policyStartDate,
      policyEndDate: p.policyEndDate,
      categoryId,
      companyId,
      userId,
    });
  }

  const policyResult = await bulkUpsert(Policy, policyDocs, 'policyNumber');

  const summary = {
    totalRowsParsed: rows.length,
    agents: agentResult.upsertedCount,
    users: allUsers.length,
    accounts: accountResult.upsertedCount,
    categories: categoryResult.upsertedCount,
    carriers: carrierResult.upsertedCount,
    policies: policyResult.upsertedCount,
  };

  logger.info('Upload complete:', summary);
  return summary;
}

module.exports = { processUpload };
