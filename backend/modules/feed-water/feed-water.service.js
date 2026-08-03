const FeedWaterSnapshot = require('../../models/FeedWaterSnapshot');
const FeedWaterBatch = require('../../models/FeedWaterBatch');
const FeedInventoryItem = require('../../models/FeedInventoryItem');
const WaterSystemStatus = require('../../models/WaterSystemStatus');
const FeedWaterAlert = require('../../models/FeedWaterAlert');
const FeedWaterLog = require('../../models/FeedWaterLog');

function httpError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function positiveInteger(value, fallback, max = 100) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanNumber(body, field, { min = 0 } = {}) {
  if (body[field] === undefined) return undefined;
  const value = Number(body[field]);
  if (!Number.isFinite(value) || value < min) throw httpError(`${field} must be a number of at least ${min}`);
  return value;
}

function batchPayload(body, partial = false) {
  const required = ['batchId', 'farm', 'birds', 'ageDays', 'feedConsumedKg', 'fcr', 'waterConsumedLitres', 'status', 'measuredAt'];
  if (!partial) {
    const missing = required.filter((field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === '');
    if (missing.length) throw httpError(`Missing required fields: ${missing.join(', ')}`);
  }

  const payload = {};
  ['batchId', 'farm', 'status', 'notes'].forEach((field) => {
    if (body[field] !== undefined) payload[field] = String(body[field]).trim();
  });
  ['birds', 'ageDays', 'feedConsumedKg', 'fcr', 'waterConsumedLitres'].forEach((field) => {
    const value = cleanNumber(body, field, { min: field === 'birds' ? 1 : 0 });
    if (value !== undefined) payload[field] = value;
  });
  if (body.measuredAt !== undefined) {
    const date = new Date(body.measuredAt);
    if (Number.isNaN(date.getTime())) throw httpError('measuredAt must be a valid date');
    payload.measuredAt = date;
  }

  const birds = payload.birds ?? Number(body.birds);
  if (Number.isFinite(birds) && birds > 0) {
    if (payload.feedConsumedKg !== undefined) payload.averageFeedPerBirdKg = Number((payload.feedConsumedKg / birds).toFixed(3));
    if (payload.waterConsumedLitres !== undefined) payload.averageWaterPerBirdLitres = Number((payload.waterConsumedLitres / birds).toFixed(3));
  }
  return payload;
}

async function getDashboard() {
  const snapshot = await FeedWaterSnapshot.findOne({ key: 'current' }).lean();
  if (!snapshot) throw httpError('Feed & Water seed data is missing. Run npm run seed:feed-water.', 404);
  const [batchCount, unreadAlerts, inventory] = await Promise.all([
    FeedWaterBatch.countDocuments(),
    FeedWaterAlert.countDocuments({ read: false }),
    FeedInventoryItem.find().lean()
  ]);
  const inventorySummary = {
    totalStockKg: inventory.reduce((sum, item) => sum + item.stockKg, 0),
    sufficientDays: snapshot.inventorySufficientDays,
    lowStockKg: snapshot.lowStockAlertKg,
    lowStockCount: inventory.filter((item) => item.stockKg <= item.lowStockThresholdKg).length
  };
  return { snapshot, batchCount, unreadAlerts, inventorySummary };
}

async function getBatches(query = {}) {
  const page = positiveInteger(query.page, 1, 100000);
  const limit = positiveInteger(query.limit, 5, 50);
  const filter = {};
  if (query.status && query.status !== 'All') filter.status = query.status;
  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ batchId: regex }, { farm: regex }];
  }
  const [batches, total] = await Promise.all([
    FeedWaterBatch.find(filter).sort({ measuredAt: -1, batchId: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    FeedWaterBatch.countDocuments(filter)
  ]);
  return { batches, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

async function createBatch(body) {
  return FeedWaterBatch.create(batchPayload(body));
}

async function updateBatch(id, body) {
  const batch = await FeedWaterBatch.findById(id);
  if (!batch) throw httpError('Batch reading not found', 404);
  if (batch.source === 'farmer') throw httpError('Farmer-submitted aggregates must be edited from the Farmer Dashboard', 409);
  const payload = batchPayload(body, true);
  Object.assign(batch, payload);
  if (body.birds !== undefined || body.feedConsumedKg !== undefined) batch.averageFeedPerBirdKg = Number((batch.feedConsumedKg / batch.birds).toFixed(3));
  if (body.birds !== undefined || body.waterConsumedLitres !== undefined) batch.averageWaterPerBirdLitres = Number((batch.waterConsumedLitres / batch.birds).toFixed(3));
  await batch.save();
  return batch;
}

async function deleteBatch(id) {
  const batch = await FeedWaterBatch.findById(id);
  if (!batch) throw httpError('Batch reading not found', 404);
  if (batch.source === 'farmer') throw httpError('Farmer-submitted aggregates must be deleted from the Farmer Dashboard', 409);
  await batch.deleteOne();
  return { id: batch.id };
}

async function getInventory() {
  return { inventory: await FeedInventoryItem.find().sort({ feedType: 1 }).lean() };
}

function inventoryPayload(body, partial = false) {
  const required = ['feedType', 'stockKg', 'sufficientDays', 'lowStockThresholdKg'];
  if (!partial) {
    const missing = required.filter((field) => body[field] === undefined || String(body[field]).trim() === '');
    if (missing.length) throw httpError(`Missing required fields: ${missing.join(', ')}`);
  }
  const payload = {};
  if (body.feedType !== undefined) payload.feedType = String(body.feedType).trim();
  ['stockKg', 'sufficientDays', 'lowStockThresholdKg'].forEach((field) => {
    const value = cleanNumber(body, field);
    if (value !== undefined) payload[field] = value;
  });
  if (Object.keys(payload).length) payload.updatedFor = new Date();
  return payload;
}

function dateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.APP_TIMEZONE || 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);
}

function farmerLogPayload(body, partial = false) {
  const required = ['farm', 'shed', 'batchId', 'birds', 'ageDays', 'feedConsumedKg', 'waterConsumedLitres', 'fcr', 'loggedAt'];
  if (!partial) {
    const missing = required.filter((field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === '');
    if (missing.length) throw httpError(`Missing required fields: ${missing.join(', ')}`);
  }
  const payload = {};
  ['farm', 'shed', 'batchId', 'notes'].forEach((field) => {
    if (body[field] !== undefined) payload[field] = String(body[field]).trim();
  });
  ['birds', 'ageDays', 'feedConsumedKg', 'waterConsumedLitres', 'fcr'].forEach((field) => {
    const value = cleanNumber(body, field, { min: field === 'birds' ? 1 : 0 });
    if (value !== undefined) payload[field] = value;
  });
  if (body.loggedAt !== undefined) {
    const loggedAt = new Date(body.loggedAt);
    if (Number.isNaN(loggedAt.getTime())) throw httpError('loggedAt must be a valid date');
    payload.loggedAt = loggedAt;
    payload.logDate = dateKey(loggedAt);
  }
  return payload;
}

function farmerAggregateKey(log) {
  return `${log.submittedByUserId}|${log.farm}|${log.batchId}|${log.logDate}`;
}

async function syncFarmerAggregate(identity) {
  const filter = {
    submittedByUserId: identity.submittedByUserId,
    farm: identity.farm,
    batchId: identity.batchId,
    logDate: identity.logDate
  };
  const logs = await FeedWaterLog.find(filter).sort({ loggedAt: -1 }).lean();
  const aggregateKey = farmerAggregateKey(identity);
  if (!logs.length) {
    await FeedWaterBatch.deleteOne({ aggregateKey });
    return;
  }
  const latest = logs[0];
  const feedConsumedKg = logs.reduce((sum, item) => sum + item.feedConsumedKg, 0);
  const waterConsumedLitres = logs.reduce((sum, item) => sum + item.waterConsumedLitres, 0);
  const averageFcr = logs.reduce((sum, item) => sum + item.fcr, 0) / logs.length;
  const status = averageFcr <= 1.6 ? 'Excellent' : averageFcr <= 1.75 ? 'Good' : averageFcr <= 1.9 ? 'Average' : 'Warning';
  await FeedWaterBatch.findOneAndUpdate({ aggregateKey }, {
    batchId: latest.batchId,
    farm: latest.farm,
    birds: latest.birds,
    ageDays: latest.ageDays,
    feedConsumedKg,
    averageFeedPerBirdKg: Number((feedConsumedKg / latest.birds).toFixed(3)),
    fcr: Number(averageFcr.toFixed(2)),
    waterConsumedLitres,
    averageWaterPerBirdLitres: Number((waterConsumedLitres / latest.birds).toFixed(3)),
    status,
    measuredAt: latest.loggedAt,
    notes: `Aggregated from ${logs.length} farmer log entr${logs.length === 1 ? 'y' : 'ies'}.`,
    source: 'farmer',
    aggregateKey,
    submittedByUserId: latest.submittedByUserId,
    submittedByName: latest.submittedByName,
    shed: [...new Set(logs.map((item) => item.shed))].join(', '),
    logDate: latest.logDate
  }, { upsert: true, returnDocument: 'after', runValidators: true });
}

async function syncTodaySnapshot(logDate) {
  if (logDate !== dateKey()) return;
  const logs = await FeedWaterLog.find({ logDate }).lean();
  const feed = logs.reduce((sum, item) => sum + item.feedConsumedKg, 0);
  const water = logs.reduce((sum, item) => sum + item.waterConsumedLitres, 0);
  const groups = new Map();
  logs.forEach((item) => groups.set(`${item.submittedByUserId}|${item.farm}|${item.batchId}`, item.birds));
  const birds = [...groups.values()].reduce((sum, value) => sum + value, 0);
  const snapshot = await FeedWaterSnapshot.findOne({ key: 'current' });
  if (!snapshot) return;
  snapshot.feedConsumedTodayKg = Number(feed.toFixed(2));
  snapshot.waterConsumedTodayLitres = Number(water.toFixed(2));
  snapshot.totalFeedOfferedKg = Number((feed + snapshot.feedWastageKg).toFixed(2));
  snapshot.totalWaterSuppliedLitres = Number((water + snapshot.waterWastageLitres).toFixed(2));
  snapshot.averageFeedPerBirdKg = birds ? Number((feed / birds).toFixed(3)) : 0;
  snapshot.averageWaterPerBirdLitres = birds ? Number((water / birds).toFixed(3)) : 0;
  snapshot.batchesMonitored = groups.size;
  snapshot.updatedFor = new Date();
  const label = new Intl.DateTimeFormat('en-GB', { timeZone: process.env.APP_TIMEZONE || 'Asia/Kolkata', day: '2-digit', month: 'short' }).format(new Date());
  const trendPoint = snapshot.trend.find((item) => item.label === label);
  if (trendPoint) { trendPoint.feedKg = feed; trendPoint.waterLitres = water; }
  else { snapshot.trend.push({ label, feedKg: feed, waterLitres: water }); snapshot.trend = snapshot.trend.slice(-7); }
  await snapshot.save();
}

async function getFarmerSummary(userId) {
  const today = dateKey();
  const [todayLogs, inventory, sevenDayLogs] = await Promise.all([
    FeedWaterLog.find({ submittedByUserId: userId, logDate: today }).lean(),
    FeedInventoryItem.find().lean(),
    FeedWaterLog.find({ submittedByUserId: userId, loggedAt: { $gte: new Date(Date.now() - 7 * 86400000) } }).lean()
  ]);
  const fcrValues = sevenDayLogs.map((item) => item.fcr).filter((value) => value > 0);
  return {
    summary: {
      feedTodayKg: todayLogs.reduce((sum, item) => sum + item.feedConsumedKg, 0),
      waterTodayLitres: todayLogs.reduce((sum, item) => sum + item.waterConsumedLitres, 0),
      shedsToday: new Set(todayLogs.map((item) => item.shed)).size,
      feedStockKg: inventory.reduce((sum, item) => sum + item.stockKg, 0),
      stockDays: inventory.length ? Math.max(...inventory.map((item) => item.sufficientDays)) : 0,
      averageFcr7Days: fcrValues.length ? Number((fcrValues.reduce((sum, value) => sum + value, 0) / fcrValues.length).toFixed(2)) : 0
    }
  };
}

async function getFarmerLogs(userId, query = {}) {
  const page = positiveInteger(query.page, 1, 100000);
  const limit = positiveInteger(query.limit, 10, 50);
  const filter = { submittedByUserId: userId };
  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ batchId: regex }, { farm: regex }, { shed: regex }];
  }
  const [logs, total] = await Promise.all([
    FeedWaterLog.find(filter).sort({ loggedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    FeedWaterLog.countDocuments(filter)
  ]);
  return { logs, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

async function createFarmerLog(user, body) {
  const payload = farmerLogPayload(body);
  const log = await FeedWaterLog.create({ ...payload, submittedByUserId: user.userId, submittedByName: user.name || user.email || 'Farmer' });
  await Promise.all([syncFarmerAggregate(log), syncTodaySnapshot(log.logDate)]);
  return log;
}

async function updateFarmerLog(user, id, body) {
  const log = await FeedWaterLog.findOne({ _id: id, submittedByUserId: user.userId });
  if (!log) throw httpError('Feed & Water log not found', 404);
  const oldIdentity = log.toObject();
  Object.assign(log, farmerLogPayload(body, true));
  await log.save();
  await syncFarmerAggregate(oldIdentity);
  await syncFarmerAggregate(log);
  await Promise.all([...new Set([oldIdentity.logDate, log.logDate])].map(syncTodaySnapshot));
  return log;
}

async function deleteFarmerLog(userId, id) {
  const log = await FeedWaterLog.findOneAndDelete({ _id: id, submittedByUserId: userId });
  if (!log) throw httpError('Feed & Water log not found', 404);
  await Promise.all([syncFarmerAggregate(log), syncTodaySnapshot(log.logDate)]);
  return { id: log.id };
}

async function reportFarmerInventory(user, body) {
  const payload = inventoryPayload(body);
  const item = await FeedInventoryItem.findOneAndUpdate({ feedType: payload.feedType }, {
    ...payload,
    source: 'farmer',
    submittedByUserId: user.userId,
    submittedByName: user.name || user.email || 'Farmer',
    farm: String(body.farm || '').trim()
  }, { upsert: true, returnDocument: 'after', runValidators: true });
  return item;
}

async function createInventory(body) {
  return FeedInventoryItem.create(inventoryPayload(body));
}

async function updateInventory(id, body) {
  const item = await FeedInventoryItem.findById(id);
  if (!item) throw httpError('Inventory item not found', 404);
  Object.assign(item, inventoryPayload(body, true));
  await item.save();
  return item;
}

async function deleteInventory(id) {
  const deleted = await FeedInventoryItem.findByIdAndDelete(id);
  if (!deleted) throw httpError('Inventory item not found', 404);
  return { id: deleted.id };
}

async function getWaterSystems() {
  return { systems: await WaterSystemStatus.find().sort({ sortOrder: 1 }).lean() };
}

async function updateWaterSystem(id, body) {
  const system = await WaterSystemStatus.findById(id);
  if (!system) throw httpError('Water system reading not found', 404);
  ['label', 'value', 'status', 'icon'].forEach((field) => {
    if (body[field] !== undefined) system[field] = String(body[field]).trim();
  });
  system.updatedFor = new Date();
  await system.save();
  return system;
}

async function getAlerts(query = {}) {
  const limit = positiveInteger(query.limit, 50, 100);
  const filter = {};
  if (query.read === 'true') filter.read = true;
  if (query.read === 'false') filter.read = false;
  return { alerts: await FeedWaterAlert.find(filter).sort({ occurredAt: -1 }).limit(limit).lean() };
}

async function markAlertRead(id) {
  const alert = await FeedWaterAlert.findByIdAndUpdate(id, { read: true }, { returnDocument: 'after' });
  if (!alert) throw httpError('Feed & Water alert not found', 404);
  return alert;
}

module.exports = {
  createBatch, createInventory, deleteBatch, deleteInventory, getAlerts, getBatches, getDashboard,
  getInventory, getWaterSystems, markAlertRead, updateBatch, updateInventory, updateWaterSystem,
  createFarmerLog, deleteFarmerLog, getFarmerLogs, getFarmerSummary, reportFarmerInventory, updateFarmerLog
};
