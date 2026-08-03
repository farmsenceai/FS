const Batch = require('../../models/Batch');
const Operation = require('../../models/Operation');
const Alert = require('../../models/Alert');
const InventoryItem = require('../../models/InventoryItem');
const FarmSummary = require('../../models/FarmSummary');
const MonthlySnapshot = require('../../models/MonthlySnapshot');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function ageDays(doa) {
  return Math.max(0, Math.floor((Date.now() - new Date(doa).getTime()) / MS_PER_DAY));
}

function statusFromMortality(mortality) {
  if (mortality <= 2.0) return 'Excellent';
  if (mortality <= 2.7) return 'Good';
  return 'Average';
}

async function getOrCreateSnapshot() {
  let snap = await MonthlySnapshot.findOne();
  if (!snap) snap = await MonthlySnapshot.create({});
  return snap;
}

function trend(current, previous) {
  const diff = +(current - previous).toFixed(2);
  return {
    direction: diff >= 0 ? 'up' : 'down',
    changeText: `${Math.abs(diff)} vs last month`
  };
}

function shapeBatch(batch) {
  return {
    _id: batch._id,
    batchId: batch.batchId,
    farm: batch.farm,
    breed: batch.breed,
    doa: batch.doa,
    birds: batch.birds,
    ageDays: ageDays(batch.doa),
    mortality: batch.mortality,
    fcr: batch.fcr,
    status: batch.status,
    shed: batch.shed,
    lifecycleStatus: batch.lifecycleStatus || 'Active',
    source: batch.source || 'business',
    submittedByName: batch.submittedByName,
    notes: batch.notes
  };
}

async function getOverview() {
  const batches = await Batch.find({ lifecycleStatus: { $ne: 'Completed' } });
  const snap = await getOrCreateSnapshot();

  const activeBatches = batches.length;
  const farmsCount = new Set(batches.map((b) => b.farm)).size;
  const totalBirds = batches.reduce((sum, b) => sum + b.birds, 0);
  const avgAgeDays = activeBatches
    ? Math.round(batches.reduce((sum, b) => sum + ageDays(b.doa), 0) / activeBatches)
    : 0;
  const avgMortality = activeBatches
    ? +(batches.reduce((sum, b) => sum + b.mortality, 0) / activeBatches).toFixed(2)
    : 0;
  const avgFcr = activeBatches
    ? +(batches.reduce((sum, b) => sum + b.fcr, 0) / activeBatches).toFixed(2)
    : 0;

  return {
    activeBatches,
    farmsCount,
    totalBirds,
    avgAgeDays,
    avgMortality,
    mortalityTrend: trend(avgMortality, snap.prevMonthAvgMortality),
    avgFcr,
    fcrTrend: trend(avgFcr, snap.prevMonthAvgFcr)
  };
}

async function getBatches(options = {}) {
  if (typeof options !== 'object') options = { limit: options };
  const limit = options.limit ? Math.max(1, parseInt(options.limit, 10) || 0) : 0;
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const filter = {};
  if (options.search) {
    const escaped = String(options.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    filter.$or = [{ batchId: regex }, { farm: regex }, { shed: regex }, { breed: regex }, { submittedByName: regex }];
  }
  if (options.lifecycleStatus && ['Active', 'Completed'].includes(options.lifecycleStatus)) filter.lifecycleStatus = options.lifecycleStatus;
  if (options.source && ['seed', 'business', 'farmer'].includes(options.source)) filter.source = options.source;
  let query = Batch.find(filter).sort({ createdAt: -1 });
  if (limit) query = query.skip((page - 1) * limit).limit(limit);
  const [batches, total] = await Promise.all([query, Batch.countDocuments(filter)]);
  return { batches: batches.map(shapeBatch), total, page, totalPages: limit ? Math.max(1, Math.ceil(total / limit)) : 1 };
}

async function createBatch(payload) {
  const { batchId, farm, breed, doa, birds, mortality, fcr, status } = payload;

  if (!batchId || !farm || !breed || !doa || birds === undefined || birds === null) {
    const err = new Error('batchId, farm, breed, doa and birds are required');
    err.status = 400;
    throw err;
  }

  const existing = await Batch.findOne({ batchId: batchId.trim().toUpperCase() });
  if (existing) {
    const err = new Error(`Batch ID "${batchId}" already exists`);
    err.status = 400;
    throw err;
  }

  const birdsNum = Number(birds);
  if (Number.isNaN(birdsNum) || birdsNum < 0) {
    const err = new Error('birds must be a positive number');
    err.status = 400;
    throw err;
  }

  const mortalityNum = mortality !== undefined && mortality !== '' ? Number(mortality) : 0;
  const fcrNum = fcr !== undefined && fcr !== '' ? Number(fcr) : 0;

  const batch = await Batch.create({
    batchId,
    farm,
    breed,
    doa: new Date(doa),
    birds: birdsNum,
    mortality: mortalityNum,
    fcr: fcrNum,
    status: status || statusFromMortality(mortalityNum)
  });

  await FarmSummary.findOneAndUpdate(
    { name: farm },
    { $inc: { batches: 1, birds: birdsNum }, $setOnInsert: { mortality: 0, fcr: 0, stars: 0 } },
    { upsert: true, returnDocument: 'after' }
  );

  return shapeBatch(batch);
}

function httpError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function numberField(value, name, min = 0) {
  const parsed = Number(value);
  if (value === '' || value === undefined || value === null || !Number.isFinite(parsed) || parsed < min) {
    throw httpError(`${name} must be a number greater than or equal to ${min}`);
  }
  return parsed;
}

function farmerPayload(payload) {
  const required = ['batchId', 'farm', 'shed', 'breed', 'doa', 'birds'];
  required.forEach((field) => {
    if (payload[field] === undefined || payload[field] === null || String(payload[field]).trim() === '') {
      throw httpError(`${field} is required`);
    }
  });
  const doa = new Date(payload.doa);
  if (Number.isNaN(doa.getTime())) throw httpError('doa must be a valid date');
  const mortality = payload.mortality === '' || payload.mortality === undefined ? 0 : numberField(payload.mortality, 'mortality');
  const fcr = payload.fcr === '' || payload.fcr === undefined ? 0 : numberField(payload.fcr, 'fcr');
  return {
    batchId: String(payload.batchId).trim().toUpperCase(), farm: String(payload.farm).trim(), shed: String(payload.shed).trim(),
    breed: String(payload.breed).trim(), doa, birds: numberField(payload.birds, 'birds', 1), mortality, fcr,
    lifecycleStatus: payload.lifecycleStatus === 'Completed' ? 'Completed' : 'Active',
    status: payload.status || statusFromMortality(mortality), notes: String(payload.notes || '').trim()
  };
}

async function syncFarmSummary(farm) {
  if (!farm) return;
  const batches = await Batch.find({ farm, lifecycleStatus: { $ne: 'Completed' } }).lean();
  if (!batches.length) {
    await FarmSummary.deleteOne({ name: farm });
    return;
  }
  const average = (field) => +(batches.reduce((sum, batch) => sum + Number(batch[field] || 0), 0) / batches.length).toFixed(2);
  await FarmSummary.findOneAndUpdate({ name: farm }, { $set: { batches: batches.length, birds: batches.reduce((sum, batch) => sum + batch.birds, 0), mortality: average('mortality'), fcr: average('fcr') }, $setOnInsert: { stars: 0 } }, { upsert: true });
}

async function getFarmerSummary(userId) {
  const batches = await Batch.find({ submittedByUserId: userId }).lean();
  const active = batches.filter((batch) => batch.lifecycleStatus !== 'Completed');
  const average = (field) => active.length ? +(active.reduce((sum, batch) => sum + Number(batch[field] || 0), 0) / active.length).toFixed(2) : 0;
  return { summary: { activeBatches: active.length, completedBatches: batches.length - active.length, totalBirds: active.reduce((sum, batch) => sum + batch.birds, 0), averageFcr: average('fcr'), averageMortality: average('mortality') } };
}

async function getFarmerBatches(userId, query = {}) {
  const page = Math.max(1, Number(query.page) || 1); const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const filter = { submittedByUserId: userId };
  if (query.status && ['Active', 'Completed'].includes(query.status)) filter.lifecycleStatus = query.status;
  if (query.search) { const escaped = String(query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); filter.$or = ['batchId', 'farm', 'shed', 'breed'].map((field) => ({ [field]: new RegExp(escaped, 'i') })); }
  const [items, total] = await Promise.all([Batch.find(filter).sort({ lifecycleStatus: 1, doa: -1 }).skip((page - 1) * limit).limit(limit), Batch.countDocuments(filter)]);
  return { batches: items.map(shapeBatch), total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

async function createFarmerBatch(user, payload) {
  const data = farmerPayload(payload);
  if (await Batch.exists({ batchId: data.batchId })) throw httpError(`Batch ID "${data.batchId}" already exists`);
  const batch = await Batch.create({ ...data, source: 'farmer', submittedByUserId: user.userId, submittedByName: user.name || user.email || 'Farmer' });
  await syncFarmSummary(batch.farm); return shapeBatch(batch);
}

async function updateFarmerBatch(user, id, payload) {
  const batch = await Batch.findOne({ _id: id, submittedByUserId: user.userId });
  if (!batch) throw httpError('Batch not found', 404);
  const data = farmerPayload(payload); const duplicate = await Batch.exists({ batchId: data.batchId, _id: { $ne: batch._id } });
  if (duplicate) throw httpError(`Batch ID "${data.batchId}" already exists`);
  const previousFarm = batch.farm; Object.assign(batch, data, { source: 'farmer' }); await batch.save();
  await Promise.all([syncFarmSummary(previousFarm), previousFarm === batch.farm ? Promise.resolve() : syncFarmSummary(batch.farm)]); return shapeBatch(batch);
}

async function deleteFarmerBatch(userId, id) {
  const batch = await Batch.findOneAndDelete({ _id: id, submittedByUserId: userId });
  if (!batch) throw httpError('Batch not found', 404); await syncFarmSummary(batch.farm); return shapeBatch(batch);
}

async function getOperations(limitValue) {
  const limit = limitValue ? parseInt(limitValue, 10) : 0;
  let query = Operation.find({}).sort({ sortOrder: 1, createdAt: 1 });
  if (limit) query = query.limit(limit);
  const operations = await query;
  return { operations };
}

async function getAlerts(limitValue) {
  const limit = limitValue ? parseInt(limitValue, 10) : 0;
  let query = Alert.find({}).sort({ sortOrder: 1, createdAt: 1 });
  if (limit) query = query.limit(limit);
  const alerts = await query;
  return { alerts };
}

async function getInventory(limitValue) {
  const limit = limitValue ? parseInt(limitValue, 10) : 0;
  let query = InventoryItem.find({}).sort({ sortOrder: 1, createdAt: 1 });
  if (limit) query = query.limit(limit);
  const inventory = await query;
  return { inventory };
}

async function getFarms(limitValue) {
  const limit = limitValue ? parseInt(limitValue, 10) : 0;
  let query = FarmSummary.find({}).sort({ name: 1 });
  if (limit) query = query.limit(limit);
  const farms = await query;
  return { farms };
}

async function getPerformance() {
  const batches = await Batch.find({});
  const snap = await getOrCreateSnapshot();

  const avgMortality = batches.length
    ? +(batches.reduce((sum, b) => sum + b.mortality, 0) / batches.length).toFixed(2)
    : 0;
  const avgFcr = batches.length
    ? +(batches.reduce((sum, b) => sum + b.fcr, 0) / batches.length).toFixed(2)
    : 0;

  return {
    mortality: { value: avgMortality, trend: trend(avgMortality, snap.prevMonthAvgMortality) },
    fcr: { value: avgFcr, trend: trend(avgFcr, snap.prevMonthAvgFcr) },
    weight: { value: snap.weightAvgKg, trendText: snap.weightTrendText },
    adg: { value: snap.adgAvgG, trendText: snap.adgTrendText },
    feedConsumed: { value: snap.feedConsumedKg, trendText: snap.feedTrendText },
    waterConsumed: { value: snap.waterConsumedL, trendText: snap.waterTrendText },
    fcrTrend7d: snap.fcrTrend7d
  };
}

module.exports = {
  createBatch,
  getAlerts,
  getBatches,
  getFarms,
  getInventory,
  getOperations,
  getOverview,
  getPerformance,
  getFarmerSummary,
  getFarmerBatches,
  createFarmerBatch,
  updateFarmerBatch,
  deleteFarmerBatch
};
