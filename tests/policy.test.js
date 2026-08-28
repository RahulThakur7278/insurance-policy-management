'use strict';

/**
 * @file tests/policy.test.js
 */

const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/services/policy.service', () => ({
  searchPoliciesByUsername: jest.fn().mockResolvedValue({
    data: [{ policyNumber: 'POL-001' }],
    total: 1,
  }),
  getAggregatedPoliciesByUser: jest.fn().mockResolvedValue([
    { userName: 'John', totalPolicies: 3 },
  ]),
}));

describe('GET /api/v1/policies/search', () => {
  it('should return 422 when username is missing', async () => {
    const res = await request(app).get('/api/v1/policies/search');
    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('should return 200 with paginated results', async () => {
    const res = await request(app).get('/api/v1/policies/search?username=John');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('pagination');
  });
});

describe('GET /api/v1/policies/aggregated', () => {
  it('should return 200 with aggregated results', async () => {
    const res = await request(app).get('/api/v1/policies/aggregated');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
