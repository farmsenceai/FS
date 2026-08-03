require('dotenv').config();

const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../app');
const FeedWaterBatch = require('../models/FeedWaterBatch');
const FeedInventoryItem = require('../models/FeedInventoryItem');
const WaterSystemStatus = require('../models/WaterSystemStatus');
const FeedWaterAlert = require('../models/FeedWaterAlert');
const FeedWaterLog = require('../models/FeedWaterLog');
const FeedWaterSnapshot = require('../models/FeedWaterSnapshot');

async function main() {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) throw new Error('MONGO_URI and JWT_SECRET are required');
  await mongoose.connect(process.env.MONGO_URI);
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/feed-water`;
  const business = jwt.sign({ userId: 'feed-water-verifier', role: 'business' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const farmer = jwt.sign({ userId: 'seed-farmer', email: 'seed-farmer@example.test', role: 'farmer' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const otherFarmer = jwt.sign({ userId: 'other-farmer-verifier', role: 'farmer' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  let createdBatchId, createdInventoryId, createdFarmerLogId, createdFarmerInventoryId, systemBefore, alertBefore, snapshotBefore;

  async function request(path, { method = 'GET', token = business, body } = {}) {
    const response = await fetch(`${base}${path}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const type = response.headers.get('content-type') || '';
    const payload = type.includes('application/json') ? await response.json() : await response.text();
    return { response, payload };
  }

  try {
    assert.equal((await request('/dashboard', { token: null })).response.status, 401);
    assert.equal((await request('/dashboard', { token: farmer })).response.status, 403);
    const dashboard = await request('/dashboard');
    assert.equal(dashboard.response.status, 200);
    assert.equal(dashboard.payload.snapshot.feedConsumedTodayKg, 4250);
    assert.equal(dashboard.payload.inventorySummary.totalStockKg, 12450);
    snapshotBefore = dashboard.payload.snapshot;

    const batches = await request('/batches?page=1&limit=5');
    assert.equal(batches.payload.batches.length, 5);
    assert.equal(batches.payload.total, 20);
    assert.equal(batches.payload.totalPages, 4);
    assert.equal((await request('/batches?search=GVF-B104')).payload.total, 1);
    assert.ok((await request('/batches?status=Excellent')).payload.total > 0);

    const created = await request('/batches', { method: 'POST', body: { batchId: 'VERIFY-FW-001', farm: 'Verification Farm', birds: 1000, ageDays: 21, feedConsumedKg: 82, fcr: 1.55, waterConsumedLitres: 210, measuredAt: new Date().toISOString(), status: 'Good', notes: 'Temporary API verification' } });
    assert.equal(created.response.status, 201);
    createdBatchId = created.payload.batch._id;
    assert.equal(created.payload.batch.averageFeedPerBirdKg, 0.082);
    const updated = await request(`/batches/${createdBatchId}`, { method: 'PUT', body: { feedConsumedKg: 84, status: 'Excellent' } });
    assert.equal(updated.payload.batch.averageFeedPerBirdKg, 0.084);
    assert.equal(updated.payload.batch.status, 'Excellent');

    const inventory = await request('/inventory');
    assert.equal(inventory.payload.inventory.length, 4);
    const inventoryCreated = await request('/inventory', { method: 'POST', body: { feedType: 'Verification Feed', stockKg: 500, sufficientDays: 2, lowStockThresholdKg: 400 } });
    assert.equal(inventoryCreated.response.status, 201);
    createdInventoryId = inventoryCreated.payload.item._id;
    const inventoryUpdated = await request(`/inventory/${createdInventoryId}`, { method: 'PUT', body: { stockKg: 450 } });
    assert.equal(inventoryUpdated.payload.item.stockKg, 450);

    const systems = await request('/water-systems');
    assert.equal(systems.payload.systems.length, 5);
    systemBefore = systems.payload.systems[0];
    const systemUpdated = await request(`/water-systems/${systemBefore._id}`, { method: 'PUT', body: { value: '2.5 bar', status: 'Good' } });
    assert.equal(systemUpdated.payload.system.value, '2.5 bar');

    const alerts = await request('/alerts?read=false');
    assert.ok(alerts.payload.alerts.length > 0);
    alertBefore = alerts.payload.alerts[0];
    assert.equal((await request(`/alerts/${alertBefore._id}/read`, { method: 'PUT' })).payload.alert.read, true);

    const report = await request('/report/download');
    assert.equal(report.response.status, 200);
    assert.match(report.response.headers.get('content-disposition'), /^attachment;/);
    assert.match(report.payload, /Feed & Water Consumption Report/);

    assert.equal((await request('/farmer/summary', { token: business })).response.status, 403);
    const farmerSummary = await request('/farmer/summary', { token: farmer });
    assert.equal(farmerSummary.response.status, 200);
    assert.equal(farmerSummary.payload.summary.feedTodayKg, 2140);
    assert.equal(farmerSummary.payload.summary.waterTodayLitres, 4850);
    const farmerLogs = await request('/farmer/logs', { token: farmer });
    assert.equal(farmerLogs.payload.total, 4);

    const farmerCreated = await request('/farmer/logs', { method: 'POST', token: farmer, body: {
      farm: 'Sample Farm', shed: 'Verification Shed', batchId: 'VERIFY-FW-FARMER', birds: 1000,
      ageDays: 20, feedConsumedKg: 100, waterConsumedLitres: 250, fcr: 1.55, loggedAt: new Date().toISOString(), notes: 'Temporary farmer propagation test'
    } });
    assert.equal(farmerCreated.response.status, 201);
    createdFarmerLogId = farmerCreated.payload.log._id;
    const propagated = await request('/batches?search=VERIFY-FW-FARMER');
    assert.equal(propagated.payload.total, 1);
    assert.equal(propagated.payload.batches[0].source, 'farmer');
    assert.equal(propagated.payload.batches[0].feedConsumedKg, 100);
    assert.equal((await request('/dashboard')).payload.snapshot.feedConsumedTodayKg, 4350);

    assert.equal((await request(`/farmer/logs/${createdFarmerLogId}`, { method: 'PUT', token: otherFarmer, body: { feedConsumedKg: 999 } })).response.status, 404);
    const farmerUpdated = await request(`/farmer/logs/${createdFarmerLogId}`, { method: 'PUT', token: farmer, body: { feedConsumedKg: 120 } });
    assert.equal(farmerUpdated.payload.log.feedConsumedKg, 120);
    assert.equal((await request('/batches?search=VERIFY-FW-FARMER')).payload.batches[0].feedConsumedKg, 120);
    assert.equal((await request('/dashboard')).payload.snapshot.feedConsumedTodayKg, 4370);

    const stockReported = await request('/farmer/inventory', { method: 'POST', token: farmer, body: {
      farm: 'Sample Farm', feedType: 'Verification Farmer Feed', stockKg: 333, sufficientDays: 1.5, lowStockThresholdKg: 250
    } });
    assert.equal(stockReported.response.status, 200);
    createdFarmerInventoryId = stockReported.payload.item._id;
    assert.equal((await request('/inventory')).payload.inventory.some((item) => item.feedType === 'Verification Farmer Feed' && item.source === 'farmer'), true);

    assert.equal((await request(`/farmer/logs/${createdFarmerLogId}`, { method: 'DELETE', token: farmer })).response.status, 200);
    createdFarmerLogId = null;
    assert.equal((await request('/batches?search=VERIFY-FW-FARMER')).payload.total, 0);
    assert.equal((await request('/dashboard')).payload.snapshot.feedConsumedTodayKg, 4250);

    assert.equal((await request(`/batches/${createdBatchId}`, { method: 'DELETE' })).response.status, 200);
    createdBatchId = null;
    assert.equal((await request(`/inventory/${createdInventoryId}`, { method: 'DELETE' })).response.status, 200);
    createdInventoryId = null;
    console.log('Feed & Water verified end to end: farmer CRUD and stock reports propagate to business aggregates, KPIs, inventory, filters, and downloads.');
  } finally {
    if (createdBatchId) await FeedWaterBatch.findByIdAndDelete(createdBatchId);
    if (createdInventoryId) await FeedInventoryItem.findByIdAndDelete(createdInventoryId);
    if (createdFarmerLogId) await FeedWaterLog.findByIdAndDelete(createdFarmerLogId);
    await FeedWaterBatch.deleteMany({ batchId: 'VERIFY-FW-FARMER' });
    if (createdFarmerInventoryId) await FeedInventoryItem.findByIdAndDelete(createdFarmerInventoryId);
    if (snapshotBefore) await FeedWaterSnapshot.updateOne({ key: 'current' }, { $set: {
      feedConsumedTodayKg: snapshotBefore.feedConsumedTodayKg, waterConsumedTodayLitres: snapshotBefore.waterConsumedTodayLitres,
      totalFeedOfferedKg: snapshotBefore.totalFeedOfferedKg, totalWaterSuppliedLitres: snapshotBefore.totalWaterSuppliedLitres,
      averageFeedPerBirdKg: snapshotBefore.averageFeedPerBirdKg, averageWaterPerBirdLitres: snapshotBefore.averageWaterPerBirdLitres,
      batchesMonitored: snapshotBefore.batchesMonitored, updatedFor: snapshotBefore.updatedFor, trend: snapshotBefore.trend
    } });
    if (systemBefore) await WaterSystemStatus.findByIdAndUpdate(systemBefore._id, { label: systemBefore.label, value: systemBefore.value, status: systemBefore.status, updatedFor: systemBefore.updatedFor });
    if (alertBefore) await FeedWaterAlert.findByIdAndUpdate(alertBefore._id, { read: alertBefore.read });
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
