process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const assert = require('node:assert/strict');
const { afterEach, describe, it } = require('node:test');
const User = require('../models/User');
const Farm = require('../src/modules/farms/farms.model');
const service = require('../modules/auth/auth.service');

const originalFindById = User.findById;
const originalFarmFindOne = Farm.findOne;

afterEach(() => { User.findById = originalFindById; Farm.findOne = originalFarmFindOne; });

describe('farmer self-profile completion', () => {
  it('updates only the authenticated farmer profile and marks it complete', async () => {
    const farmer = {
      id: 'farmer-1', role: 'farmer', agreedToTerms: true, termsVersion: '1.0',
      async save() {},
      toSafeObject() {
        return { id: this.id, role: this.role, name: this.name, email: this.email, phone: this.phone, requestedFarmId: this.requestedFarmId, profileCompletedAt: this.profileCompletedAt, agreedToTerms: this.agreedToTerms, termsVersion: this.termsVersion };
      }
    };
    User.findById = async id => { assert.equal(id, 'farmer-1'); return farmer; };
    Farm.findOne = () => ({ select: () => ({ lean: () => ({ exec: async () => ({ _id: '507f1f77bcf86cd799439011' }) }) }) });

    const result = await service.updateMyProfile('farmer-1', {
      name: 'Meera Singh', email: 'MEERA@example.test', phone: '+91 90000 00000', requestedFarmId: '507f1f77bcf86cd799439011'
    });
    assert.equal(result.user.email, 'meera@example.test');
    assert.equal(result.user.phone, '+919000000000');
    assert.equal(result.user.requestedFarmId, '507f1f77bcf86cd799439011');
    assert.ok(result.user.profileCompletedAt instanceof Date);
  });

  it('rejects protected fields and allows business profile edits', async () => {
    await assert.rejects(
      service.updateMyProfile('farmer-1', { name: 'X', email: 'x@example.test', phone: '12345678', requestedFarmId: '507f1f77bcf86cd799439011', role: 'admin' }),
      error => error.status === 400 && /not allowed/.test(error.message)
    );
    const business = { role: 'business', async save() {}, toSafeObject() { return { role: this.role, name: this.name, email: this.email, phone: this.phone }; } };
    User.findById = async () => business;
    const result = await service.updateMyProfile('business-1', { name: 'Business User', email: 'business@example.test', phone: '12345678' });
    assert.equal(result.user.name, 'Business User');
    assert.equal(result.user.email, 'business@example.test');
  });

  it('updates the authenticated user avatar', async () => {
    const user = { avatar: '', async save() {}, toSafeObject() { return { avatar: this.avatar }; } };
    User.findById = async id => { assert.equal(id, 'user-1'); return user; };
    const result = await service.updateMyAvatar('user-1', '/uploads/avatars/user-1.png');
    assert.equal(result.user.avatar, '/uploads/avatars/user-1.png');
  });
});
