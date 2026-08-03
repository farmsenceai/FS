const DAY_MS = 86400000;
const COMPLETED_PROFILES = [
  { farmIndex: 0, daysAgo: 330, initialBirdCount: 18000, revenuePerBird: 245, expensePerBird: 205, mortalityPct: 2.6, avgWeightKg: 2.32 },
  { farmIndex: 1, daysAgo: 285, initialBirdCount: 20500, revenuePerBird: 250, expensePerBird: 208, mortalityPct: 2.2, avgWeightKg: 2.38 },
  { farmIndex: 2, daysAgo: 240, initialBirdCount: 19200, revenuePerBird: 248, expensePerBird: 207, mortalityPct: 2.9, avgWeightKg: 2.34 },
  { farmIndex: 0, daysAgo: 195, initialBirdCount: 22000, revenuePerBird: 255, expensePerBird: 211, mortalityPct: 1.9, avgWeightKg: 2.43 },
  { farmIndex: 1, daysAgo: 150, initialBirdCount: 21000, revenuePerBird: 252, expensePerBird: 209, mortalityPct: 2.4, avgWeightKg: 2.4 },
  { farmIndex: 2, daysAgo: 105, initialBirdCount: 23500, revenuePerBird: 260, expensePerBird: 214, mortalityPct: 1.7, avgWeightKg: 2.48 },
  { farmIndex: 0, daysAgo: 62, initialBirdCount: 22500, revenuePerBird: 258, expensePerBird: 212, mortalityPct: 2.1, avgWeightKg: 2.45 },
  { farmIndex: 1, daysAgo: 24, initialBirdCount: 24000, revenuePerBird: 265, expensePerBird: 217, mortalityPct: 1.6, avgWeightKg: 2.52 }
];
const ACTIVE_PROFILES = [
  { farmIndex: 0, placedDaysAgo: 28, harvestInDays: 18, initialBirdCount: 23000, partialSaleQuantity: 1800 },
  { farmIndex: 1, placedDaysAgo: 22, harvestInDays: 28, initialBirdCount: 21500, partialSaleQuantity: 0 },
  { farmIndex: 2, placedDaysAgo: 16, harvestInDays: 42, initialBirdCount: 25000, partialSaleQuantity: 0 }
];
const EXPENSE_SHARES = {
  feed: 0.6,
  chicks: 0.15,
  labor: 0.08,
  medicine_vaccines: 0.05,
  utilities: 0.04,
  transport: 0.03,
  other: 0.05
};

function utcDay(now, offsetDays) {
  const value = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  value.setUTCDate(value.getUTCDate() + offsetDays);
  return value;
}

function buildFinancialDashboardFixture(now = new Date()) {
  const completed = COMPLETED_PROFILES.map((profile, index) => ({
    ...profile,
    code: `FIN-DEMO-C${String(index + 1).padStart(2, '0')}`,
    placedAt: utcDay(now, -profile.daysAgo - 42),
    actualHarvestAt: utcDay(now, -profile.daysAgo),
    expectedHarvestAt: utcDay(now, -profile.daysAgo),
    soldFraction: 0.965 - (index % 3) * 0.005
  }));
  const active = ACTIVE_PROFILES.map((profile, index) => ({
    ...profile,
    code: `FIN-DEMO-A${String(index + 1).padStart(2, '0')}`,
    placedAt: utcDay(now, -profile.placedDaysAgo),
    expectedHarvestAt: utcDay(now, profile.harvestInDays)
  }));
  return { prefix: 'FIN-DEMO-', completed, active, expenseShares: EXPENSE_SHARES };
}

module.exports = { ACTIVE_PROFILES, COMPLETED_PROFILES, EXPENSE_SHARES, buildFinancialDashboardFixture, utcDay };
