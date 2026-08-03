const EnvironmentSnapshot = require('../../models/EnvironmentSnapshot');
const EnvironmentParameter = require('../../models/EnvironmentParameter');
const EnvironmentReading = require('../../models/EnvironmentReading');
const EnvironmentAlert = require('../../models/EnvironmentAlert');
const EnvironmentRecord = require('../../models/EnvironmentRecord');

function httpError(message, status = 400) { const error = new Error(message); error.status = status; return error; }
function positiveInteger(value, fallback, max = 100) { const parsed = Number.parseInt(value, 10); return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback; }
function escapeRegex(value) { return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function numberField(body, field, min = 0, max = Infinity) {
  if (body[field] === undefined) return undefined;
  const value = Number(body[field]);
  if (!Number.isFinite(value) || value < min || value > max) throw httpError(`${field} must be between ${min} and ${max === Infinity ? 'a valid maximum' : max}`);
  return value;
}

function readingPayload(body, partial = false) {
  const required = ['batchId', 'farm', 'house', 'birds', 'temperatureC', 'humidityPct', 'ammoniaPpm', 'co2Ppm', 'airQualityIndex', 'airQualityLabel', 'status', 'recordedAt'];
  if (!partial) {
    const missing = required.filter((field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === '');
    if (missing.length) throw httpError(`Missing required fields: ${missing.join(', ')}`);
  }
  const payload = {};
  ['batchId', 'farm', 'house', 'airQualityLabel', 'status', 'notes'].forEach((field) => { if (body[field] !== undefined) payload[field] = String(body[field]).trim(); });
  const definitions = { birds: [1, Infinity], temperatureC: [-50, 70], humidityPct: [0, 100], ammoniaPpm: [0, 1000], co2Ppm: [0, 100000], airQualityIndex: [0, 500] };
  Object.entries(definitions).forEach(([field, [min, max]]) => { const value = numberField(body, field, min, max); if (value !== undefined) payload[field] = value; });
  if (body.recordedAt !== undefined) { const date = new Date(body.recordedAt); if (Number.isNaN(date.getTime())) throw httpError('recordedAt must be a valid date'); payload.recordedAt = date; }
  return payload;
}

async function getDashboard() {
  const snapshot = await EnvironmentSnapshot.findOne({ key: 'current' }).lean();
  if (!snapshot) throw httpError('Environment seed data is missing. Run npm run seed:environment.', 404);
  const [readingCount, unreadAlerts, parameterCount] = await Promise.all([EnvironmentReading.countDocuments(), EnvironmentAlert.countDocuments({ read: false }), EnvironmentParameter.countDocuments()]);
  return { snapshot, readingCount, unreadAlerts, parameterCount };
}

async function getParameters() { return { parameters: await EnvironmentParameter.find().sort({ sortOrder: 1 }).lean() }; }

async function updateParameter(id, body) {
  const parameter = await EnvironmentParameter.findById(id);
  if (!parameter) throw httpError('Environment parameter not found', 404);
  ['label', 'unit', 'status', 'acceptableRange', 'icon'].forEach((field) => { if (body[field] !== undefined) parameter[field] = String(body[field]).trim(); });
  const value = numberField(body, 'value', -100, 100000);
  if (value !== undefined) parameter.value = value;
  parameter.updatedFor = new Date();
  await parameter.save();
  const snapshotFields = {
    temperature: 'averageTemperatureC',
    humidity: 'averageHumidityPct',
    'air-quality': 'airQualityIndex',
    ammonia: 'averageAmmoniaPpm',
    co2: 'averageCo2Ppm'
  };
  if (snapshotFields[parameter.key]) {
    await EnvironmentSnapshot.updateOne({ key: 'current' }, {
      $set: { [snapshotFields[parameter.key]]: parameter.value, updatedFor: parameter.updatedFor }
    });
  }
  return parameter;
}

async function getReadings(query = {}) {
  const page = positiveInteger(query.page, 1, 100000), limit = positiveInteger(query.limit, 5, 50), filter = {};
  if (query.status && query.status !== 'All') filter.status = query.status;
  if (query.search) { const regex = new RegExp(escapeRegex(query.search), 'i'); filter.$or = [{ batchId: regex }, { farm: regex }, { house: regex }]; }
  const [readings, total] = await Promise.all([EnvironmentReading.find(filter).sort({ recordedAt: -1, batchId: 1 }).skip((page - 1) * limit).limit(limit).lean(), EnvironmentReading.countDocuments(filter)]);
  return { readings, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

async function createReading(body) { return EnvironmentReading.create(readingPayload(body)); }
async function updateReading(id, body) { const item = await EnvironmentReading.findById(id); if (!item) throw httpError('Environment reading not found', 404); Object.assign(item, readingPayload(body, true)); await item.save(); return item; }
async function deleteReading(id) { const item = await EnvironmentReading.findByIdAndDelete(id); if (!item) throw httpError('Environment reading not found', 404); return { id: item.id }; }

async function syncLiveEnvironment() {
  const latest = await EnvironmentReading.aggregate([
    { $sort: { recordedAt: -1 } },
    { $group: { _id: { farm: '$farm', house: '$house' }, reading: { $first: '$$ROOT' } } }
  ]);
  if (!latest.length) return;
  const readings = latest.map((item) => item.reading); const average = (field) => +(readings.reduce((sum, item) => sum + Number(item[field] || 0), 0) / readings.length).toFixed(2);
  const values = { averageTemperatureC: average('temperatureC'), averageHumidityPct: average('humidityPct'), airQualityIndex: Math.round(average('airQualityIndex')), averageAmmoniaPpm: average('ammoniaPpm'), averageCo2Ppm: Math.round(average('co2Ppm')), updatedFor: new Date() };
  await EnvironmentSnapshot.findOneAndUpdate({ key: 'current' }, { $set: values }, { upsert: true });
  const map = { temperature: values.averageTemperatureC, humidity: values.averageHumidityPct, 'air-quality': values.airQualityIndex, ammonia: values.averageAmmoniaPpm, co2: values.averageCo2Ppm };
  await Promise.all(Object.entries(map).map(([key, value]) => EnvironmentParameter.updateOne({ key }, { $set: { value, updatedFor: values.updatedFor } })));
}

async function getFarmerSummary(userId) {
  const readings = await EnvironmentReading.find({ submittedByUserId: userId }).sort({ recordedAt: -1 }).lean();
  const latest = [...new Map(readings.map((item) => [`${item.farm}|${item.house}`, item])).values()];
  const average = (field) => latest.length ? +(latest.reduce((sum, item) => sum + Number(item[field] || 0), 0) / latest.length).toFixed(2) : 0;
  return { summary: { sheds: latest.length, averageTemperatureC: average('temperatureC'), averageHumidityPct: average('humidityPct'), averageAmmoniaPpm: average('ammoniaPpm'), averageCo2Ppm: Math.round(average('co2Ppm')), warningSheds: latest.filter((item) => item.status === 'warning').length } };
}

async function getFarmerReadings(userId, query = {}) {
  const page = positiveInteger(query.page, 1, 100000), limit = positiveInteger(query.limit, 10, 50), filter = { submittedByUserId: userId };
  if (query.search) { const regex = new RegExp(escapeRegex(query.search), 'i'); filter.$or = [{ batchId: regex }, { farm: regex }, { house: regex }]; }
  const [readings, total] = await Promise.all([EnvironmentReading.find(filter).sort({ recordedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), EnvironmentReading.countDocuments(filter)]);
  return { readings, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

async function createFarmerReading(user, body) {
  const reading = await EnvironmentReading.create({ ...readingPayload(body), source: 'farmer', submittedByUserId: user.userId, submittedByName: user.name || user.email || 'Farmer' }); await syncLiveEnvironment(); return reading;
}
async function updateFarmerReading(user, id, body) {
  const item = await EnvironmentReading.findOne({ _id: id, submittedByUserId: user.userId }); if (!item) throw httpError('Environment reading not found', 404);
  Object.assign(item, readingPayload(body), { source: 'farmer' }); await item.save(); await syncLiveEnvironment(); return item;
}
async function deleteFarmerReading(userId, id) {
  const item = await EnvironmentReading.findOneAndDelete({ _id: id, submittedByUserId: userId }); if (!item) throw httpError('Environment reading not found', 404); await syncLiveEnvironment(); return { id: item.id };
}

async function getAlerts(query = {}) { const filter = {}; if (query.read === 'true') filter.read = true; if (query.read === 'false') filter.read = false; return { alerts: await EnvironmentAlert.find(filter).sort({ occurredAt: -1 }).limit(positiveInteger(query.limit, 50, 100)).lean() }; }
async function markAlertRead(id) { const alert = await EnvironmentAlert.findByIdAndUpdate(id, { read: true }, { returnDocument: 'after' }); if (!alert) throw httpError('Environment alert not found', 404); return alert; }
async function getRecords(query = {}) { return { records: await EnvironmentRecord.find().sort({ recordedAt: -1 }).limit(positiveInteger(query.limit, 50, 100)).lean() }; }
async function getRecord(id) { const record = await EnvironmentRecord.findById(id).lean(); if (!record) throw httpError('Environment record not found', 404); return record; }

module.exports = { createReading, deleteReading, getAlerts, getDashboard, getParameters, getReadings, getRecord, getRecords, markAlertRead, updateParameter, updateReading, getFarmerSummary, getFarmerReadings, createFarmerReading, updateFarmerReading, deleteFarmerReading };
