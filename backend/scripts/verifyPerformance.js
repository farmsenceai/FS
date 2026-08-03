require('dotenv').config();
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../app');
const PerformanceBatch = require('../models/PerformanceBatch');
const PerformanceSnapshot = require('../models/PerformanceSnapshot');
const PerformanceRecommendation = require('../models/PerformanceRecommendation');

async function main() {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) throw new Error('MONGO_URI and JWT_SECRET are required');
  await mongoose.connect(process.env.MONGO_URI); const server = app.listen(0); await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/performance`, business = jwt.sign({ userId: 'performance-verifier', role: 'business' }, process.env.JWT_SECRET, { expiresIn: '5m' }), farmer = jwt.sign({ userId: 'performance-verifier', role: 'farmer' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  let createdBatchId, recommendationBefore, snapshotBefore;
  async function request(path, { method = 'GET', token = business, body } = {}) { const response = await fetch(`${base}${path}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }); const type = response.headers.get('content-type') || '', payload = type.includes('application/json') ? await response.json() : await response.text(); return { response, payload }; }
  try {
    assert.equal((await request('/dashboard', { token: null })).response.status, 401); assert.equal((await request('/dashboard', { token: farmer })).response.status, 403);
    const dashboard = await request('/dashboard'); assert.equal(dashboard.response.status, 200); assert.equal(dashboard.payload.snapshot.averageFcr, 1.62); assert.equal(dashboard.payload.snapshot.performanceScore, 88); snapshotBefore = dashboard.payload.snapshot;
    const batches = await request('/batches?page=1&limit=6'); assert.equal(batches.payload.batches.length, 6); assert.equal(batches.payload.total, 12); assert.equal(batches.payload.totalPages, 2);
    assert.equal((await request('/batches?search=B1-106')).payload.total, 1); assert.ok((await request('/batches?status=Excellent')).payload.total > 0);
    assert.equal((await request('/trend?limit=6')).payload.batches.length, 6); assert.equal((await request('/trend?limit=12')).payload.batches.length, 12);
    const created = await request('/batches', { method: 'POST', body: { batchId: 'VERIFY-PERF-001', farm: 'Verification Farm', birds: 1000, fcr: 1.50, averageDailyGainG: 58, averageWeightKg: 1.55, mortalityRatePct: 1.5, livabilityPct: 98.5, performanceScore: 93, status: 'Excellent', completedAt: new Date().toISOString(), notes: 'Temporary verification batch' } });
    assert.equal(created.response.status, 201); createdBatchId = created.payload.batch._id; assert.equal((await request('/dashboard')).payload.snapshot.performanceScore, 93);
    const updated = await request(`/batches/${createdBatchId}`, { method: 'PUT', body: { fcr: 1.48, performanceScore: 94 } }); assert.equal(updated.payload.batch.fcr, 1.48); assert.equal((await request('/dashboard')).payload.snapshot.averageFcr, 1.48);
    const drivers = await request('/drivers'); assert.equal(drivers.payload.drivers.length, 5);
    const recommendations = await request('/recommendations'); assert.equal(recommendations.payload.recommendations.length, 6); recommendationBefore = recommendations.payload.recommendations[0];
    const toggled = await request(`/recommendations/${recommendationBefore._id}`, { method: 'PUT', body: { completed: !recommendationBefore.completed } }); assert.equal(toggled.payload.recommendation.completed, !recommendationBefore.completed);
    const batchReport = await request(`/batches/${createdBatchId}/report`); assert.equal(batchReport.response.status, 200); assert.match(batchReport.payload, /Batch Performance Report/);
    const report = await request('/report/download'); assert.equal(report.response.status, 200); assert.match(report.payload, /Performance Summary/);
    assert.equal((await request(`/batches/${createdBatchId}`, { method: 'DELETE' })).response.status, 200); createdBatchId = null; assert.equal((await request('/dashboard')).payload.snapshot.performanceScore, 88);
    console.log('Performance API verified: auth, KPIs, trend, filters, pagination, CRUD, recommendations, drivers, and downloads.');
  } finally {
    if (createdBatchId) await PerformanceBatch.findByIdAndDelete(createdBatchId);
    if (snapshotBefore) await PerformanceSnapshot.updateOne({ key: 'current' }, { $set: { averageFcr: snapshotBefore.averageFcr, previousFcr: snapshotBefore.previousFcr, averageWeightKg: snapshotBefore.averageWeightKg, previousWeightKg: snapshotBefore.previousWeightKg, averageDailyGainG: snapshotBefore.averageDailyGainG, previousDailyGainG: snapshotBefore.previousDailyGainG, mortalityRatePct: snapshotBefore.mortalityRatePct, previousMortalityRatePct: snapshotBefore.previousMortalityRatePct, livabilityPct: snapshotBefore.livabilityPct, previousLivabilityPct: snapshotBefore.previousLivabilityPct, performanceScore: snapshotBefore.performanceScore, previousPerformanceScore: snapshotBefore.previousPerformanceScore, updatedFor: snapshotBefore.updatedFor } });
    if (recommendationBefore) await PerformanceRecommendation.findByIdAndUpdate(recommendationBefore._id, { completed: recommendationBefore.completed });
    await new Promise((resolve) => server.close(resolve)); await mongoose.disconnect();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
