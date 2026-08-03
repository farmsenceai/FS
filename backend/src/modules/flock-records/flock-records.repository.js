const FlockRecord = require('./flock-records.model');
const paginate = require('../../shared/db/pagination');

function requireScope(businessId, farmId, batchId) {
  if (businessId === undefined || businessId === null) {
    throw new TypeError('businessId is required for flock record repository operations');
  }
  if (farmId === undefined || farmId === null) {
    throw new TypeError('farmId is required for flock record repository operations');
  }
  if (batchId === undefined || batchId === null) {
    throw new TypeError('batchId is required for flock record repository operations');
  }
}

function requireActor(actorUserId) {
  if (!actorUserId) throw new TypeError('actorUserId is required for correction writes');
}

async function create(businessId, farmId, batchId, data, { session } = {}) {
  requireScope(businessId, farmId, batchId);
  const record = new FlockRecord({ ...data, businessId, farmId, batchId });
  return record.save({ session });
}

async function findById(businessId, farmId, batchId, recordId, { session } = {}) {
  requireScope(businessId, farmId, batchId);
  const query = FlockRecord.findOne({
    _id: recordId,
    businessId,
    farmId,
    batchId
  });
  if (session) query.session(session);
  return query.exec();
}

async function listForBatch(
  businessId,
  farmId,
  batchId,
  { fromDate, toDate, page, limit } = {}
) {
  requireScope(businessId, farmId, batchId);
  const filter = { businessId, farmId, batchId };
  if (fromDate || toDate) {
    filter.recordDate = {};
    if (fromDate) filter.recordDate.$gte = new Date(fromDate);
    if (toDate) filter.recordDate.$lte = new Date(toDate);
  }
  return paginate(FlockRecord.find(filter), { page, limit, sort: '-recordDate' });
}

async function listForBusinessRole(farmId, batchId, { fromDate, toDate, page, limit } = {}) {
  if (!farmId) throw new TypeError('farmId is required');
  if (!batchId) throw new TypeError('batchId is required');
  const filter = { farmId, batchId };
  if (fromDate || toDate) {
    filter.recordDate = {};
    if (fromDate) filter.recordDate.$gte = new Date(fromDate);
    if (toDate) filter.recordDate.$lte = new Date(toDate);
  }
  return paginate(FlockRecord.find(filter), { page, limit, sort: '-recordDate' });
}

async function findForBatchAndDate(
  businessId,
  farmId,
  batchId,
  recordDate,
  { session } = {}
) {
  requireScope(businessId, farmId, batchId);
  const query = FlockRecord.findOne({
    businessId,
    farmId,
    batchId,
    recordDate: new Date(recordDate),
    correctsRecordId: { $exists: false }
  });
  if (session) query.session(session);
  return query.exec();
}

async function createCorrection(
  businessId,
  farmId,
  batchId,
  originalRecordId,
  data,
  actorUserId,
  { session } = {}
) {
  requireScope(businessId, farmId, batchId);
  requireActor(actorUserId);
  return create(
    businessId,
    farmId,
    batchId,
    { ...data, correctsRecordId: originalRecordId, createdBy: actorUserId },
    { session }
  );
}

module.exports = {
  create,
  findById,
  listForBatch,
  listForBusinessRole,
  findForBatchAndDate,
  createCorrection
};
