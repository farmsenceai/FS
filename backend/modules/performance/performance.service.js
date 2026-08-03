const PerformanceSnapshot = require('../../models/PerformanceSnapshot');
const PerformanceBatch = require('../../models/PerformanceBatch');
const PerformanceDriver = require('../../models/PerformanceDriver');
const PerformanceRecommendation = require('../../models/PerformanceRecommendation');

function httpError(message, status = 400) { const error = new Error(message); error.status = status; return error; }
function positiveInteger(value, fallback, max = 100) { const parsed = Number.parseInt(value, 10); return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback; }
function escapeRegex(value) { return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function numberField(body, field, min = 0, max = Infinity) {
  if (body[field] === undefined) return undefined;
  const value = Number(body[field]);
  if (!Number.isFinite(value) || value < min || value > max) throw httpError(`${field} must be a valid number between ${min} and ${max === Infinity ? 'the supported maximum' : max}`);
  return value;
}

function batchPayload(body, partial = false) {
  const required = ['batchId', 'farm', 'birds', 'fcr', 'averageDailyGainG', 'averageWeightKg', 'mortalityRatePct', 'livabilityPct', 'performanceScore', 'status', 'completedAt'];
  if (!partial) {
    const missing = required.filter((field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === '');
    if (missing.length) throw httpError(`Missing required fields: ${missing.join(', ')}`);
  }
  const payload = {};
  ['batchId', 'farm', 'status', 'notes'].forEach((field) => { if (body[field] !== undefined) payload[field] = String(body[field]).trim(); });
  const definitions = { birds: [1, Infinity], fcr: [0, 10], averageDailyGainG: [0, 500], averageWeightKg: [0, 20], mortalityRatePct: [0, 100], livabilityPct: [0, 100], performanceScore: [0, 100] };
  Object.entries(definitions).forEach(([field, [min, max]]) => { const value = numberField(body, field, min, max); if (value !== undefined) payload[field] = value; });
  if (body.completedAt !== undefined) { const date = new Date(body.completedAt); if (Number.isNaN(date.getTime())) throw httpError('completedAt must be a valid date'); payload.completedAt = date; }
  return payload;
}

async function syncSnapshotFromLatest() {
  const [latest, previous] = await PerformanceBatch.find().sort({ completedAt: -1 }).limit(2).lean();
  if (!latest) return;
  await PerformanceSnapshot.updateOne({ key: 'current' }, { $set: {
    averageFcr: latest.fcr, previousFcr: previous?.fcr ?? latest.fcr,
    averageWeightKg: latest.averageWeightKg, previousWeightKg: previous?.averageWeightKg ?? latest.averageWeightKg,
    averageDailyGainG: latest.averageDailyGainG, previousDailyGainG: previous?.averageDailyGainG ?? latest.averageDailyGainG,
    mortalityRatePct: latest.mortalityRatePct, previousMortalityRatePct: previous?.mortalityRatePct ?? latest.mortalityRatePct,
    livabilityPct: latest.livabilityPct, previousLivabilityPct: previous?.livabilityPct ?? latest.livabilityPct,
    performanceScore: latest.performanceScore, previousPerformanceScore: previous?.performanceScore ?? latest.performanceScore,
    updatedFor: latest.completedAt
  } });
}

async function getDashboard() {
  const snapshot = await PerformanceSnapshot.findOne({ key: 'current' }).lean();
  if (!snapshot) throw httpError('Performance seed data is missing. Run npm run seed:performance.', 404);
  const [batchCount, openRecommendations, bestFcr, bestAdg, lowestMortality, highestLivability] = await Promise.all([
    PerformanceBatch.countDocuments(), PerformanceRecommendation.countDocuments({ completed: false }),
    PerformanceBatch.findOne().sort({ fcr: 1 }).lean(), PerformanceBatch.findOne().sort({ averageDailyGainG: -1 }).lean(),
    PerformanceBatch.findOne().sort({ mortalityRatePct: 1 }).lean(), PerformanceBatch.findOne().sort({ livabilityPct: -1 }).lean()
  ]);
  return { snapshot, batchCount, openRecommendations, best: { fcr: bestFcr, adg: bestAdg, mortality: lowestMortality, livability: highestLivability } };
}

async function getBatches(query = {}) {
  const page = positiveInteger(query.page, 1, 100000), limit = positiveInteger(query.limit, 6, 50), filter = {};
  if (query.status && query.status !== 'All') filter.status = query.status;
  if (query.search) { const regex = new RegExp(escapeRegex(query.search), 'i'); filter.$or = [{ batchId: regex }, { farm: regex }]; }
  const [batches, total] = await Promise.all([PerformanceBatch.find(filter).sort({ completedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), PerformanceBatch.countDocuments(filter)]);
  return { batches, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

async function getTrend(query = {}) {
  const limit = positiveInteger(query.limit, 6, 12);
  const batches = await PerformanceBatch.find().sort({ completedAt: -1 }).limit(limit).lean();
  return { batches: batches.reverse() };
}

async function createBatch(body) { const batch = await PerformanceBatch.create(batchPayload(body)); await syncSnapshotFromLatest(); return batch; }
async function updateBatch(id, body) { const batch = await PerformanceBatch.findById(id); if (!batch) throw httpError('Performance batch not found', 404); Object.assign(batch, batchPayload(body, true)); await batch.save(); await syncSnapshotFromLatest(); return batch; }
async function deleteBatch(id) { const batch = await PerformanceBatch.findByIdAndDelete(id); if (!batch) throw httpError('Performance batch not found', 404); await syncSnapshotFromLatest(); return { id: batch.id }; }
async function getBatch(id) { const batch = await PerformanceBatch.findById(id).lean(); if (!batch) throw httpError('Performance batch not found', 404); return batch; }
async function getDrivers() { return { drivers: await PerformanceDriver.find().sort({ sortOrder: 1 }).lean() }; }
async function getRecommendations() { return { recommendations: await PerformanceRecommendation.find().sort({ completed: 1, sortOrder: 1 }).lean() }; }
async function updateRecommendation(id, body) { const recommendation = await PerformanceRecommendation.findById(id); if (!recommendation) throw httpError('Performance recommendation not found', 404); if (body.completed !== undefined) recommendation.completed = Boolean(body.completed); if (body.priority !== undefined) recommendation.priority = String(body.priority); if (body.text !== undefined) recommendation.text = String(body.text).trim(); await recommendation.save(); return recommendation; }

module.exports = { createBatch, deleteBatch, getBatch, getBatches, getDashboard, getDrivers, getRecommendations, getTrend, updateBatch, updateRecommendation };
