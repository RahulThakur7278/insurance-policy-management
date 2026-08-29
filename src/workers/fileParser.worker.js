'use strict';

/**
 * @file workers/fileParser.worker.js
 * @description Worker thread that parses an XLSX or CSV file and posts
 *              the structured row data back to the main thread.
 *              Runs in isolation so the event loop is never blocked.
 *
 * workerData shape:
 *   { filePath: string, fileType: 'xlsx' | 'csv' }
 *
 * Messages posted back to main thread:
 *   { type: 'progress', parsed: number }
 *   { type: 'done', data: object[] }
 *   { type: 'error', message: string }
 */

const { workerData, parentPort } = require('worker_threads');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { parse } = require('csv-parse/sync');

const { filePath, fileType } = workerData;

function normaliseHeaders(row) {
  const normalised = {};
  for (const [key, value] of Object.entries(row)) {
    const normKey = key.trim().toLowerCase().replace(/\s+/g, '_');
    normalised[normKey] = typeof value === 'string' ? value.trim() : value;
  }
  return normalised;
}

try {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  let rows = [];

  if (fileType === 'csv') {
    const content = fs.readFileSync(filePath, 'utf8');
    rows = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } else {
    // xlsx / xls
    const workbook = XLSX.readFile(filePath, { cellDates: true, dense: false });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('XLSX file has no sheets.');
    const worksheet = workbook.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  }

  if (!rows.length) {
    throw new Error('The uploaded file contains no data rows.');
  }

  const BATCH = 500;
  const result = [];

  for (let i = 0; i < rows.length; i++) {
    result.push(normaliseHeaders(rows[i]));

    // Report progress every BATCH rows
    if ((i + 1) % BATCH === 0) {
      parentPort.postMessage({ type: 'progress', parsed: i + 1 });
    }
  }

  parentPort.postMessage({ type: 'done', data: result });

} catch (err) {
  parentPort.postMessage({ type: 'error', message: err.message });
  process.exit(1);
}
