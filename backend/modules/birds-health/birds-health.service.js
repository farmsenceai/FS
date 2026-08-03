const BirdHealthSnapshot = require('../../models/BirdHealthSnapshot');
const BirdHealthCase = require('../../models/BirdHealthCase');
const VaccinationSchedule = require('../../models/VaccinationSchedule');
const BirdHealthAlert = require('../../models/BirdHealthAlert');
const BirdHealthRecord = require('../../models/BirdHealthRecord');
const Batch = require('../../models/Batch');

function httpError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function positiveInteger(value, fallback, max = 100) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function casePayload(body, partial = false) {
  const required = ['batchId', 'farm', 'batchTotal', 'sickBirds', 'symptoms', 'detectedOn', 'severity', 'actionTaken', 'veterinarian'];
  if (!partial) {
    const missing = required.filter((field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === '');
    if (missing.length) throw httpError(`Missing required fields: ${missing.join(', ')}`);
  }

  const payload = {};
  const strings = ['batchId', 'farm', 'symptoms', 'severity', 'actionTaken', 'veterinarian', 'treatmentStatus', 'notes'];
  strings.forEach((field) => {
    if (body[field] !== undefined) payload[field] = String(body[field]).trim();
  });

  ['batchTotal', 'sickBirds'].forEach((field) => {
    if (body[field] !== undefined) {
      const value = Number(body[field]);
      if (!Number.isFinite(value) || value < 0 || (field === 'batchTotal' && value < 1)) {
        throw httpError(`${field} must be a valid positive number`);
      }
      payload[field] = value;
    }
  });

  if (body.detectedOn !== undefined) {
    const date = new Date(body.detectedOn);
    if (Number.isNaN(date.getTime())) throw httpError('detectedOn must be a valid date');
    payload.detectedOn = date;
  }

  if (payload.sickBirds !== undefined && payload.batchTotal !== undefined && payload.sickBirds > payload.batchTotal) {
    throw httpError('sickBirds cannot exceed batchTotal');
  }

  return payload;
}

function serializeCase(item) {
  const object = item.toObject ? item.toObject() : item;
  return {
    ...object,
    sickPercentage: object.batchTotal ? Number(((object.sickBirds / object.batchTotal) * 100).toFixed(2)) : 0
  };
}

async function getDashboard() {
  const snapshot = await BirdHealthSnapshot.findOne({ key: 'current' }).lean();
  if (!snapshot) throw httpError('Birds Health seed data is missing. Run npm run seed:birds-health.', 404);

  const [caseCount, unreadAlerts, upcomingVaccinations] = await Promise.all([
    BirdHealthCase.countDocuments(),
    BirdHealthAlert.countDocuments({ read: false }),
    VaccinationSchedule.countDocuments({ status: { $in: ['Upcoming', 'Overdue'] } })
  ]);

  return { snapshot, caseCount, unreadAlerts, upcomingVaccinations };
}

async function getCases(query = {}) {
  const page = positiveInteger(query.page, 1, 100000);
  const limit = positiveInteger(query.limit, 5, 50);
  const filter = {};

  if (query.severity && query.severity !== 'All') filter.severity = query.severity;
  if (query.treatmentStatus && query.treatmentStatus !== 'All') filter.treatmentStatus = query.treatmentStatus;
  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [
      { batchId: regex },
      { farm: regex },
      { symptoms: regex },
      { veterinarian: regex }
    ];
  }

  const [items, total] = await Promise.all([
    BirdHealthCase.find(filter).sort({ detectedOn: -1 }).skip((page - 1) * limit).limit(limit),
    BirdHealthCase.countDocuments(filter)
  ]);

  return {
    cases: items.map(serializeCase),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}

async function createCase(body) {
  return serializeCase(await BirdHealthCase.create(casePayload(body)));
}

async function updateCase(id, body) {
  const healthCase = await BirdHealthCase.findById(id);
  if (!healthCase) throw httpError('Health case not found', 404);
  Object.assign(healthCase, casePayload(body, true));
  if (healthCase.sickBirds > healthCase.batchTotal) throw httpError('sickBirds cannot exceed batchTotal');
  await healthCase.save();
  return serializeCase(healthCase);
}

async function deleteCase(id) {
  const deleted = await BirdHealthCase.findByIdAndDelete(id);
  if (!deleted) throw httpError('Health case not found', 404);
  return { id: deleted.id };
}

function farmerCasePayload(body) {
  const normalized = { ...body, symptoms: body.symptoms || body.cause, actionTaken: body.actionTaken || 'Monitoring initiated', veterinarian: body.veterinarian || 'Not assigned' };
  const payload = casePayload(normalized);
  payload.shed = String(body.shed || '').trim(); if (!payload.shed) throw httpError('shed is required');
  const mortalityCount = Number(body.mortalityCount || 0); if (!Number.isFinite(mortalityCount) || mortalityCount < 0 || mortalityCount > payload.batchTotal) throw httpError('mortalityCount must be between 0 and batchTotal');
  payload.mortalityCount = mortalityCount; payload.cause = String(body.cause || payload.symptoms).trim(); return payload;
}

async function syncHealthSnapshot() {
  const [activeBatches, openCases] = await Promise.all([Batch.find({ lifecycleStatus: { $ne: 'Completed' } }).lean(), BirdHealthCase.find({ treatmentStatus: { $ne: 'Recovered' } }).lean()]);
  const totalBirds = activeBatches.reduce((sum, item) => sum + item.birds, 0) || openCases.reduce((sum, item) => sum + item.batchTotal, 0);
  const sickBirds = openCases.reduce((sum, item) => sum + item.sickBirds, 0); const startToday = new Date(); startToday.setHours(0, 0, 0, 0); const startMonth = new Date(startToday.getFullYear(), startToday.getMonth(), 1);
  const allMonth = await BirdHealthCase.find({ detectedOn: { $gte: startMonth } }).lean(); const mortality = allMonth.reduce((sum, item) => sum + Number(item.mortalityCount || 0), 0);
  const sickToday = openCases.filter((item) => new Date(item.detectedOn) >= startToday).reduce((sum, item) => sum + item.sickBirds, 0); const criticalBirds = openCases.filter((item) => item.severity === 'Severe').reduce((sum, item) => sum + item.sickBirds, 0);
  const healthScore = totalBirds ? Math.max(0, Math.round(((totalBirds - sickBirds - mortality) / totalBirds) * 100)) : 100;
  await BirdHealthSnapshot.updateOne({ key: 'current' }, { $set: { totalBirds, healthyBirds: Math.max(0, totalBirds - sickBirds), sickBirds, sickBirdsToday: sickToday, criticalBirds, monthlyMortalityPct: totalBirds ? +((mortality / totalBirds) * 100).toFixed(2) : 0, overallHealthScore: healthScore, updatedFor: new Date() } });
}

async function getFarmerSummary(userId) {
  const events = await BirdHealthCase.find({ submittedByUserId: userId }).lean(); const today = new Date(); today.setHours(0, 0, 0, 0); const week = new Date(Date.now() - 7 * 86400000);
  const recent = events.filter((item) => new Date(item.detectedOn) >= week); const birds = [...new Map(events.map((item) => [item.batchId, item.batchTotal])).values()].reduce((sum, value) => sum + value, 0); const weeklyMortality = recent.reduce((sum, item) => sum + Number(item.mortalityCount || 0), 0);
  const batches = [...new Set(events.map((item) => item.batchId))]; const vaccinationsDue = await VaccinationSchedule.countDocuments({ batchId: { $in: batches }, status: { $in: ['Upcoming', 'Overdue'] } });
  return { summary: { mortalityToday: events.filter((item) => new Date(item.detectedOn) >= today).reduce((sum, item) => sum + Number(item.mortalityCount || 0), 0), weeklyMortalityPct: birds ? +((weeklyMortality / birds) * 100).toFixed(2) : 0, vaccinationsDue, sickBirdsFlagged: events.filter((item) => item.treatmentStatus !== 'Recovered').reduce((sum, item) => sum + item.sickBirds, 0) } };
}

async function getFarmerEvents(userId, query = {}) {
  const page = positiveInteger(query.page, 1, 100000), limit = positiveInteger(query.limit, 10, 50), filter = { submittedByUserId: userId };
  if (query.search) { const regex = new RegExp(escapeRegex(query.search), 'i'); filter.$or = [{ batchId: regex }, { farm: regex }, { shed: regex }, { symptoms: regex }, { cause: regex }]; }
  const [items, total] = await Promise.all([BirdHealthCase.find(filter).sort({ detectedOn: -1 }).skip((page - 1) * limit).limit(limit), BirdHealthCase.countDocuments(filter)]);
  return { events: items.map(serializeCase), page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
async function createFarmerEvent(user, body) { const event = await BirdHealthCase.create({ ...farmerCasePayload(body), source: 'farmer', submittedByUserId: user.userId, submittedByName: user.name || user.email || 'Farmer' }); await syncHealthSnapshot(); return serializeCase(event); }
async function updateFarmerEvent(user, id, body) { const event = await BirdHealthCase.findOne({ _id: id, submittedByUserId: user.userId }); if (!event) throw httpError('Health event not found', 404); Object.assign(event, farmerCasePayload(body), { source: 'farmer' }); await event.save(); await syncHealthSnapshot(); return serializeCase(event); }
async function deleteFarmerEvent(userId, id) { const event = await BirdHealthCase.findOneAndDelete({ _id: id, submittedByUserId: userId }); if (!event) throw httpError('Health event not found', 404); await syncHealthSnapshot(); return { id: event.id }; }

async function getVaccinations(query = {}) {
  const limit = positiveInteger(query.limit, 50, 100);
  const filter = {};
  if (query.status && query.status !== 'All') filter.status = query.status;
  const vaccinations = await VaccinationSchedule.find(filter).sort({ scheduledDate: 1 }).limit(limit).lean();
  return { vaccinations };
}

async function createVaccination(body) {
  const fields = ['name', 'batchId', 'farm', 'scheduledDate'];
  const missing = fields.filter((field) => !String(body[field] || '').trim());
  if (missing.length) throw httpError(`Missing required fields: ${missing.join(', ')}`);
  return VaccinationSchedule.create({
    name: String(body.name).trim(),
    batchId: String(body.batchId).trim(),
    farm: String(body.farm).trim(),
    scheduledDate: new Date(body.scheduledDate),
    status: body.status || 'Upcoming',
    notes: String(body.notes || '').trim()
  });
}

async function updateVaccination(id, body) {
  const vaccination = await VaccinationSchedule.findById(id);
  if (!vaccination) throw httpError('Vaccination not found', 404);
  ['name', 'batchId', 'farm', 'status', 'administeredBy', 'notes'].forEach((field) => {
    if (body[field] !== undefined) vaccination[field] = String(body[field]).trim();
  });
  if (body.scheduledDate !== undefined) vaccination.scheduledDate = new Date(body.scheduledDate);
  if (body.status === 'Completed') vaccination.completedAt = body.completedAt ? new Date(body.completedAt) : new Date();
  await vaccination.save();
  return vaccination;
}

async function getAlerts(query = {}) {
  const limit = positiveInteger(query.limit, 50, 100);
  const filter = {};
  if (query.read === 'true') filter.read = true;
  if (query.read === 'false') filter.read = false;
  const alerts = await BirdHealthAlert.find(filter).sort({ occurredAt: -1 }).limit(limit).lean();
  return { alerts };
}

async function markAlertRead(id) {
  const alert = await BirdHealthAlert.findByIdAndUpdate(id, { read: true }, { returnDocument: 'after' });
  if (!alert) throw httpError('Alert not found', 404);
  return alert;
}

async function getRecords(query = {}) {
  const limit = positiveInteger(query.limit, 50, 100);
  const records = await BirdHealthRecord.find().sort({ recordedAt: -1 }).limit(limit).lean();
  return { records };
}

async function getRecord(id) {
  const record = await BirdHealthRecord.findById(id).lean();
  if (!record) throw httpError('Health record not found', 404);
  return record;
}

module.exports = {
  createCase,
  createVaccination,
  deleteCase,
  getAlerts,
  getCases,
  getDashboard,
  getRecord,
  getRecords,
  getVaccinations,
  markAlertRead,
  updateCase,
  updateVaccination,
  getFarmerSummary,
  getFarmerEvents,
  createFarmerEvent,
  updateFarmerEvent,
  deleteFarmerEvent
};
