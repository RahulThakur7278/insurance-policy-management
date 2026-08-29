'use strict';

/**
 * @file tests/upload.test.js
 * @description Tests for upload route/controller.
 *              We mock multer entirely to isolate the controller logic
 *              from the multipart streaming internals of multer v2.
 */

const request = require('supertest');

// ─── Mock multer before requiring app ───────────────────────────────────────
// This simulates multer injecting req.file or not.
jest.mock('../src/config/multer', () => {
  const single = jest.fn(() => (req, _res, next) => {
    // Default: no file (test overrides per-test if needed)
    req.file = single.__mockFile;
    next();
  });
  single.__mockFile = undefined;
  return { single };
});

// ─── Mock upload service ──────────────────────────────────────────────────
jest.mock('../src/services/upload.service', () => ({
  processUpload: jest.fn().mockResolvedValue({
    totalRowsParsed: 5,
    agents: 2,
    users: 3,
    accounts: 3,
    categories: 2,
    carriers: 2,
    policies: 5,
  }),
}));

// Re-require the multer mock so we can set __mockFile per test
const multerMock = require('../src/config/multer');
const app = require('../src/app');

describe('POST /api/v1/upload', () => {
  beforeEach(() => {
    multerMock.single.__mockFile = undefined;
  });

  it('should return 400 when no file is attached', async () => {
    // no file set → req.file = undefined
    const res = await request(app).post('/api/v1/upload');
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 201 with summary when a file is provided', async () => {
    // Simulate multer injecting a file object
    multerMock.single.__mockFile = {
      originalname: 'data.csv',
      path: '/tmp/fake-upload.csv',
      mimetype: 'text/csv',
    };
    const res = await request(app).post('/api/v1/upload');
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalRowsParsed');
  });
});
