const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const validator = require('../src/modules/farms/farms.validator');

function payload(coordinates) {
  return {
    code: 'TEST-001',
    name: 'Test Farm',
    farmType: 'broiler',
    location: {
      address: 'Test address',
      countryCode: 'IN',
      timezone: 'Asia/Kolkata',
      ...(coordinates ? { geo: { type: 'Point', coordinates } } : {})
    }
  };
}

describe('farm coordinate validation', () => {
  it('accepts an optional expected tenure end date and normalizes it', () => {
    const result = validator.validateCreate({ ...payload(), expectedTenureEndDate: '2026-10-15' });
    assert.ok(result.expectedTenureEndDate instanceof Date);
    assert.throws(
      () => validator.validateUpdate({ expectedTenureEndDate: 'not-a-date' }),
      error => error.code === 'VALIDATION_ERROR'
    );
    assert.equal(validator.validateUpdate({ expectedTenureEndDate: null }).expectedTenureEndDate, null);
  });
  it('allows a farm to be created without coordinates', () => {
    const result = validator.validateCreate(payload());
    assert.equal(Object.hasOwn(result.location, 'geo'), false);
  });

  it('accepts valid GeoJSON longitude and latitude', () => {
    assert.deepEqual(
      validator.validateCreate(payload([77.5946, 12.9716])).location.geo.coordinates,
      [77.5946, 12.9716]
    );
  });

  it('rejects coordinates outside GeoJSON bounds before MongoDB', () => {
    assert.throws(
      () => validator.validateCreate(payload([1234, 5678])),
      error => error.code === 'VALIDATION_ERROR' &&
        error.details.includes('location.geo.coordinates longitude must be between -180 and 180') &&
        error.details.includes('location.geo.coordinates latitude must be between -90 and 90')
    );
  });
});
