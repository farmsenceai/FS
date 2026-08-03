const repository = require('./business-dashboard.repository');

class DashboardError extends Error { constructor(message, status) { super(message); this.status = status; } }
const number = value => Number(value?.toString?.() ?? value ?? 0);
const sum = (items, field) => items.reduce((total, item) => total + number(item[field]), 0);

async function getDashboard(user, query = {}) {
  if (user?.role !== 'business') throw new DashboardError('Business dashboard access required', 403);
  // Product policy: the business dashboard is a platform-wide read view.
  // It deliberately does not require an organization membership.
  const data = await repository.loadDashboard(null, query.farmId);
  if (data.forbiddenFarm) throw new DashboardError('Farm was not found', 404);
  const { selectedFarm: farm, activeBatch: batch, latestRecord: record } = data;
  const revenue = sum(data.sales, 'revenue');
  const expenses = sum(data.expenses, 'amount');
  const currentBirds = batch ? number(batch.currentBirdCountCached ?? batch.initialBirdCount) : null;
  const mortalityCount = record ? number(record.mortality?.count) : null;
  const mortalityPct = record && currentBirds ? mortalityCount / (currentBirds + mortalityCount) * 100 : null;
  const project = data.projects.find(item => item.status === 'in_progress') || data.projects[0] || null;
  const placedAt = batch?.placedAt ? new Date(batch.placedAt) : null;
  const ageDays = placedAt ? Math.max(0, Math.floor((Date.now() - placedAt.getTime()) / 86400000)) : null;

  return {
    generatedAt: new Date().toISOString(),
    scope: 'platform',
    organization: { id: null, name: 'All organizations' },
    farms: data.farms.map(item => ({ id: item._id, name: item.name, code: item.code, status: item.status })),
    farm: farm ? { id: farm._id, name: farm.name, code: farm.code, status: farm.status, farmType: farm.farmType, capacity: farm.capacity } : null,
    batch: batch ? { id: batch._id, code: batch.code, status: batch.status, breed: batch.breed, birdType: batch.birdType, initialBirdCount: batch.initialBirdCount, currentBirds, ageDays, expectedHarvestAt: batch.expectedHarvestAt } : null,
    latestRecord: record ? { recordDate: record.recordDate, feedKg: record.feed?.consumedKg ?? null, waterLiters: record.water?.consumedLiters ?? null, mortalityCount, mortalityPct, averageWeightGrams: record.avgWeightGrams ?? null, temperatureC: record.sensorReadings?.temperatureC ?? null, humidityPct: record.sensorReadings?.humidityPct ?? null, ammoniaPpm: record.sensorReadings?.ammoniaPpm ?? null, co2Ppm: record.sensorReadings?.co2Ppm ?? null, source: record.source, syncStatus: record.syncStatus } : null,
    finance: { revenue, expenses, profit: revenue - expenses, saleCount: data.sales.length, expenseCount: data.expenses.length },
    project: project ? { id: project._id, title: project.title, status: project.status, percentComplete: project.percentComplete, targetDate: project.targetDate } : null,
    manager: data.managerAssignment?.managerId ? { name: data.managerAssignment.managerId.name, title: data.managerAssignment.managerId.title } : null,
    upcomingPayment: data.fees[0] ? { amount: data.fees[0].amount, currency: data.fees[0].currency, dueDate: data.fees[0].dueDate, description: data.fees[0].description } : null,
    counts: { farms: data.farms.length, batches: data.batches.length, activeBatches: data.batches.filter(item => item.status === 'active').length, projects: data.projects.length, pendingPayments: data.fees.length },
  };
}

module.exports = { DashboardError, getDashboard };
