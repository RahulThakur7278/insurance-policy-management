'use strict';

/**
 * @file tests/scheduledMessage.test.js
 */

const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/services/scheduledMessage.service', () => ({
  createScheduledMessage: jest.fn().mockResolvedValue({
    _id: 'abc123',
    message: 'Hello World',
    day: 'monday',
    time: '09:00',
    isDelivered: false,
  }),
  getScheduledMessages: jest.fn().mockResolvedValue({ data: [], total: 0 }),
}));

describe('POST /api/v1/messages/schedule', () => {
  it('should return 422 when body is empty', async () => {
    const res = await request(app).post('/api/v1/messages/schedule').send({});
    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toHaveProperty('message');
    expect(res.body.errors).toHaveProperty('day');
    expect(res.body.errors).toHaveProperty('time');
  });

  it('should return 422 for invalid time format', async () => {
    const res = await request(app).post('/api/v1/messages/schedule').send({
      message: 'Test',
      day: 'monday',
      time: '25:99', // invalid
    });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors).toHaveProperty('time');
  });

  it('should return 201 with valid payload', async () => {
    const res = await request(app).post('/api/v1/messages/schedule').send({
      message: 'Hello World',
      day: 'monday',
      time: '09:00',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('message', 'Hello World');
  });
});

describe('GET /api/v1/messages/schedule', () => {
  it('should return 200 with list', async () => {
    const res = await request(app).get('/api/v1/messages/schedule');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
