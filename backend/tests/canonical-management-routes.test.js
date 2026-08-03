process.env.ENABLE_CANONICAL_V2 = 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const assert = require('node:assert/strict');
const { after, before, describe, it } = require('node:test');
const jwt = require('jsonwebtoken');
const app = require('../app');

describe('canonical manager and farm-project route authorization', () => {
  const port = 5052;
  const base = `http://localhost:${port}/api/v2`;
  const id = '507f1f77bcf86cd799439011';
  const farmerToken = jwt.sign({ userId: id, role: 'farmer' }, process.env.JWT_SECRET);
  let server;

  before(() => { server = app.listen(port); });
  after(async () => { if (server) await new Promise(resolve => server.close(resolve)); });

  async function request(path, method = 'GET', body) {
    return fetch(`${base}${path}`, {
      method,
      headers: { Authorization: `Bearer ${farmerToken}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
  }

  it('returns 403 to farmers on admin-only management routes', async () => {
    const cases = [
      ['/managers', 'GET'], ['/managers', 'POST', { name: 'Denied' }], ['/managers/performance', 'GET'],
      [`/managers/${id}`, 'GET'], [`/managers/${id}`, 'PATCH', { title: 'Denied' }],
      [`/managers/${id}`, 'DELETE'], [`/managers/${id}/farms`, 'GET'],
      [`/farms/${id}/managers`, 'GET'], [`/farms/${id}/managers`, 'POST', { managerId: id }],
      [`/farms/${id}/managers/${id}/end`, 'POST'],
      [`/farms/${id}/projects`, 'POST', { title: 'Denied' }],
      [`/farms/${id}/projects/${id}`, 'PATCH', { status: 'completed' }],
      [`/farms/${id}/work-updates`, 'GET'], [`/farms/${id}/work-updates`, 'POST', { note: 'Denied' }], ['/work-updates/recent', 'GET'],
      ['/farmer-fees', 'POST', { farmerId: id, farmId: id, amount: 1, description: 'Denied' }],
      [`/farmer-fees/summary?farmId=${id}`, 'GET'],
      [`/farmer-fees/${id}`, 'PATCH', { amount: 1 }],
      [`/farmer-fees/${id}`, 'DELETE'],
      [`/farms/${id}/batch-sales`, 'GET'], [`/farms/${id}/batch-sales`, 'POST', { batchId: id }],
      [`/farms/${id}/batch-sales/${id}`, 'GET'], [`/farms/${id}/batch-sales/${id}`, 'PATCH', { notes: 'Denied' }], [`/farms/${id}/batch-sales/${id}`, 'DELETE'],
      [`/farms/${id}/batch-expenses`, 'GET'], [`/farms/${id}/batch-expenses`, 'POST', { batchId: null }],
      [`/farms/${id}/batch-expenses/${id}`, 'GET'], [`/farms/${id}/batch-expenses/${id}`, 'PATCH', { description: 'Denied' }], [`/farms/${id}/batch-expenses/${id}`, 'DELETE']
    ];
    for (const [path, method, body] of cases) {
      const response = await request(path, method, body);
      assert.equal(response.status, 403, `${method} ${path}`);
    }
  });
});
