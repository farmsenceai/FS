const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const validator = require('../src/modules/farm-assignments/farm-assignments.validator');

describe('farm assignment validation', () => {
  const base = { userId: 'farmer-id', startsAt: '2026-08-09T00:00:00.000Z' };

  it('accepts and preserves a supported assignment role', () => {
    const result = validator.validateCreate({ ...base, role: 'farm_manager' });
    assert.equal(result.role, 'farm_manager');
  });

  it('rejects unsupported assignment roles', () => {
    assert.throws(
      () => validator.validateCreate({ ...base, role: 'administrator' }),
      error => error.code === 'VALIDATION_ERROR' && error.details.some(detail => detail.startsWith('role must be one of:'))
    );
  });
});
