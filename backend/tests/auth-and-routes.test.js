process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS || '4';

const assert = require('node:assert/strict');
const { after, before, describe, it } = require('node:test');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const passport = require('passport');

const app = require('../app');
const User = require('../models/User');

const hasMongo = Boolean(process.env.MONGO_URI);
const suite = hasMongo ? describe : describe.skip;

suite('authentication and protected routes', () => {
  const port = 5051;
  const base = `http://localhost:${port}`;
  const stamp = Date.now();
  const password = 'CodexTest123';
  const emails = {
    admin: `test-admin-${stamp}@example.test`,
    business: `test-business-${stamp}@example.test`,
    farmer: `test-farmer-${stamp}@example.test`,
    google: `test-google-${stamp}@example.test`
  };
  let server;
  let tokens = {};

  before(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    server = app.listen(port);
  });

  after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    await User.deleteMany({ email: { $in: Object.values(emails) } });
    await mongoose.disconnect();
  });

  async function request(path, options = {}) {
    const res = await fetch(`${base}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    let body = {};
    try {
      body = await res.json();
    } catch {
      body = {};
    }

    return { body, status: res.status };
  }

  function auth(token) {
    return { Authorization: `Bearer ${token}` };
  }

  async function register(role) {
    const result = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: emails[role], password, role })
    });
    assert.equal(result.status, 201);
    assert.equal(result.body.success, true);
    assert.equal(result.body.user.role, role);
    assert.equal(result.body.user.accountStatus, role === 'farmer' ? 'pending' : 'active');
    assert.ok(result.body.token);
    tokens[role] = result.body.token;
    return result;
  }

  it('registers email/password users with roles', async () => {
    await register('business');
    await register('farmer');
    await register('admin');
  });

  it('blocks a new farmer until an administrator approves the account', async () => {
    const pending = await request('/api/auth/me', { headers: auth(tokens.farmer) });
    assert.equal(pending.status, 403);
    assert.equal(pending.body.code, 'ACCOUNT_PENDING');

    await User.updateOne(
      { email: emails.farmer },
      { $set: { accountStatus: 'active', approvedAt: new Date() } }
    );
    const approved = await request('/api/auth/me', { headers: auth(tokens.farmer) });
    assert.equal(approved.status, 200);
    assert.equal(approved.body.user.accountStatus, 'active');
  });

  it('logs in and rejects role mismatches', async () => {
    const login = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: emails.business, password, role: 'business' })
    });
    assert.equal(login.status, 200);
    assert.equal(login.body.user.role, 'business');
    assert.ok(login.body.token);

    const mismatch = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: emails.business, password, role: 'farmer' })
    });
    assert.equal(mismatch.status, 403);
  });

  it('returns current user from /api/auth/me', async () => {
    const me = await request('/api/auth/me', {
      headers: auth(tokens.business)
    });
    assert.equal(me.status, 200);
    assert.equal(me.body.success, true);
    assert.equal(me.body.user.email, emails.business);
    assert.equal(me.body.user.role, 'business');
  });

  it('rejects missing and invalid tokens', async () => {
    assert.equal((await request('/api/auth/me')).status, 401);
    assert.equal((await request('/api/auth/me', { headers: auth('bad-token') })).status, 401);
  });

  it('protects route groups and enforces role authorization', async () => {
    const checks = [
      ['/api/pm/overview', tokens.business, tokens.farmer],
      ['/api/batch/overview', tokens.business, tokens.farmer],
      ['/api/birds-health/dashboard', tokens.business, tokens.farmer],
      ['/api/feed-water/dashboard', tokens.business, tokens.farmer],
      ['/api/environment/dashboard', tokens.business, tokens.farmer],
      ['/api/performance/dashboard', tokens.business, tokens.farmer],
      ['/api/financial/batches', tokens.business, tokens.farmer],
      ['/api/contact/all', tokens.admin, tokens.business]
    ];

    for (const [path, allowedToken, deniedToken] of checks) {
      assert.equal((await request(path)).status, 401, `${path} should require auth`);
      const allowed = await request(path, { headers: auth(allowedToken) });
      assert.notEqual(allowed.status, 401, `${path} should accept valid auth`);
      assert.notEqual(allowed.status, 403, `${path} should authorize allowed role`);
      assert.equal((await request(path, { headers: auth(deniedToken) })).status, 403, `${path} should reject denied role`);
    }

    const farmerFeedWaterPath = '/api/feed-water/farmer/summary';
    assert.equal((await request(farmerFeedWaterPath)).status, 401, `${farmerFeedWaterPath} should require auth`);
    assert.equal((await request(farmerFeedWaterPath, { headers: auth(tokens.farmer) })).status, 200, `${farmerFeedWaterPath} should accept farmer auth`);
    assert.equal((await request(farmerFeedWaterPath, { headers: auth(tokens.business) })).status, 403, `${farmerFeedWaterPath} should reject business auth`);
  });

  it('creates OAuth users with the selected role', async () => {
    const strategy = passport._strategy('google');
    assert.ok(strategy, 'Google strategy should be registered');

    const profile = {
      id: `google-${stamp}`,
      displayName: 'Google Test User',
      emails: [{ value: emails.google }],
      photos: [{ value: 'https://example.test/avatar.png' }]
    };

    const user = await new Promise((resolve, reject) => {
      strategy._verify({ query: { state: 'farmer' } }, 'access-token', 'refresh-token', profile, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    assert.equal(user.email, emails.google);
    assert.equal(user.role, 'farmer');
    assert.equal(user.authMethod, 'google');
    assert.equal(user.googleId, profile.id);
    assert.equal(user.accountStatus, 'pending');

    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      authMethod: user.authMethod,
      role: user.role
    }, process.env.JWT_SECRET);

    const pending = await request('/api/auth/me', { headers: auth(token) });
    assert.equal(pending.status, 403);
    await User.updateOne({ _id: user._id }, { $set: { accountStatus: 'active', approvedAt: new Date() } });
    const me = await request('/api/auth/me', { headers: auth(token) });
    assert.equal(me.status, 200);
    assert.equal(me.body.user.role, 'farmer');
  });
});
