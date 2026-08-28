/**
 * @file scripts/generateSampleData.js
 * @description Generates a sample XLSX file for testing the upload API.
 *              Run: node scripts/generateSampleData.js
 */

'use strict';

require('dotenv').config();
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const rows = [
  {
    agent_name: 'Agent Smith',
    first_name: 'John',
    dob: '1990-05-15',
    address: '123 Main St, Springfield',
    phone: '+1-555-0101',
    state: 'IL',
    zip_code: '62701',
    email: 'john.doe@example.com',
    gender: 'male',
    user_type: 'standard',
    account_name: 'John\'s Account',
    category_name: 'Auto Insurance',
    company_name: 'State Farm',
    policy_number: 'POL-2024-001',
    policy_start_date: '2024-01-01',
    policy_end_date: '2025-01-01',
  },
  {
    agent_name: 'Agent Smith',
    first_name: 'Jane',
    dob: '1985-11-22',
    address: '456 Oak Ave, Chicago',
    phone: '+1-555-0202',
    state: 'IL',
    zip_code: '60601',
    email: 'jane.smith@example.com',
    gender: 'female',
    user_type: 'premium',
    account_name: 'Jane\'s Account',
    category_name: 'Health Insurance',
    company_name: 'Blue Cross',
    policy_number: 'POL-2024-002',
    policy_start_date: '2024-03-01',
    policy_end_date: '2025-03-01',
  },
  {
    agent_name: 'Agent Johnson',
    first_name: 'John',
    dob: '1990-05-15',
    address: '123 Main St, Springfield',
    phone: '+1-555-0101',
    state: 'IL',
    zip_code: '62701',
    email: 'john.doe@example.com',
    gender: 'male',
    user_type: 'standard',
    account_name: 'John\'s Account',
    category_name: 'Life Insurance',
    company_name: 'MetLife',
    policy_number: 'POL-2024-003',
    policy_start_date: '2024-06-01',
    policy_end_date: '2034-06-01',
  },
  {
    agent_name: 'Agent Johnson',
    first_name: 'Alice',
    dob: '1992-07-30',
    address: '789 Pine Rd, Naperville',
    phone: '+1-555-0303',
    state: 'IL',
    zip_code: '60540',
    email: 'alice.johnson@example.com',
    gender: 'female',
    user_type: 'admin',
    account_name: 'Alice\'s Account',
    category_name: 'Home Insurance',
    company_name: 'Allstate',
    policy_number: 'POL-2024-004',
    policy_start_date: '2024-02-15',
    policy_end_date: '2025-02-15',
  },
  {
    agent_name: 'Agent Brown',
    first_name: 'Bob',
    dob: '1978-03-10',
    address: '321 Elm St, Peoria',
    phone: '+1-555-0404',
    state: 'IL',
    zip_code: '61602',
    email: 'bob.williams@example.com',
    gender: 'male',
    user_type: 'standard',
    account_name: 'Bob\'s Account',
    category_name: 'Auto Insurance',
    company_name: 'Geico',
    policy_number: 'POL-2024-005',
    policy_start_date: '2024-04-01',
    policy_end_date: '2025-04-01',
  },
];

const worksheet = XLSX.utils.json_to_sheet(rows);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'PolicyData');

const outDir = path.join(__dirname, '..', 'sample_data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, 'sample_insurance_data.xlsx');
XLSX.writeFile(workbook, outPath);

console.log(`✅ Sample XLSX generated: ${outPath}`);
