const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const validator = require('../src/modules/flock-records/flock-records.validator');

describe('flock record ROI and sensor extension', () => {
  it('accepts optional farmer-reported ROI and manual sensor readings', () => {
    const result = validator.validate({
      recordDate: '2026-07-19',
      roi: { reportedRevenue: 1000, reportedCost: 700, reportedProfit: 300, notes: 'Self reported' },
      sensorReadings: { temperatureC: 29.5, humidityPct: 61, ammoniaPpm: 8, co2Ppm: 450, source: 'manual' }
    });
    assert.equal(result.roi.reportedProfit, 300);
    assert.equal(result.sensorReadings.source, 'manual');
    assert.equal(result.recordDate, '2026-07-19T00:00:00.000Z');
  });

  it('requires a date-only operational day and enforces realistic measurement bounds', () => {
    assert.throws(() => validator.validate({
      recordDate: '2026-07-19T12:30:00.000Z',
      feed: { consumedKg: 20, inventedMetric: 1 },
      avgWeightGrams: 100001,
      sensorReadings: { temperatureC: 61, humidityPct: 101, ammoniaPpm: 1001, co2Ppm: 100001 }
    }), error => (
      error.code === 'VALIDATION_ERROR' &&
      error.details.includes('recordDate must use YYYY-MM-DD') &&
      error.details.includes('feed.inventedMetric is not an allowed field') &&
      error.details.includes('sensorReadings.humidityPct must be no greater than 100')
    ));
  });

  it('rejects negative metrics, unknown sensor sources, and unknown nested fields', () => {
    assert.throws(() => validator.validate({
      recordDate: '2026-07-19',
      roi: { reportedCost: -1, authoritativeProfit: 5 },
      sensorReadings: { humidityPct: -2, source: 'automatic' }
    }), error => error.code === 'VALIDATION_ERROR' && error.details.length === 4);
  });
});
