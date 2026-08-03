const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { buildFinancialDashboardFixture } = require('../data/financial-dashboard-demo.fixture');

describe('financial dashboard canonical demo fixture', () => {
  const fixture = buildFinancialDashboardFixture(new Date('2026-07-23T12:00:00Z'));

  it('has stable reserved identities and diverse connected cohorts', () => {
    assert.equal(fixture.completed.length, 8);
    assert.equal(fixture.active.length, 3);
    assert.equal(new Set([...fixture.completed, ...fixture.active].map(row => row.code)).size, 11);
    assert.ok([...fixture.completed, ...fixture.active].every(row => row.code.startsWith(fixture.prefix)));
    assert.equal(new Set(fixture.completed.map(row => row.farmIndex)).size, 3);
  });

  it('provides enough smooth completed history for minimum-sample and held-out tests', () => {
    assert.ok(fixture.completed.length >= 5);
    assert.ok(fixture.completed.every(row => row.actualHarvestAt && row.initialBirdCount > 0 && row.revenuePerBird > row.expensePerBird));
    assert.ok(fixture.completed.every((row, index, rows) => index === 0 || row.actualHarvestAt > rows[index - 1].actualHarvestAt));
  });

  it('has active batches within multiple forecast horizons and a real partial sale', () => {
    assert.deepEqual(fixture.active.map(row => row.harvestInDays), [18, 28, 42]);
    assert.equal(fixture.active.filter(row => row.partialSaleQuantity > 0).length, 1);
  });

  it('covers every canonical expense category and sums allocations exactly', () => {
    assert.deepEqual(Object.keys(fixture.expenseShares).sort(), ['chicks', 'feed', 'labor', 'medicine_vaccines', 'other', 'transport', 'utilities']);
    assert.equal(Object.values(fixture.expenseShares).reduce((sum, value) => sum + value, 0), 1);
  });
});
