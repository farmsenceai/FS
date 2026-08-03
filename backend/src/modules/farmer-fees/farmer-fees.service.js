const repository = require('./farmer-fees.repository');
const validator = require('./farmer-fees.validator');
const policy = require('./farmer-fees.policy');
const User = require('../../../models/User');
const Farm = require('../farms/farms.model');
const { actorId, isAdmin, isBusiness, isFarmer } = require('../../shared/auth/roleAccess');

class FarmerFeeServiceError extends Error {
  constructor(message, code, status) { super(message); this.code = code; this.status = status; }
}
function allow(value) { if (!value) throw new FarmerFeeServiceError('You are not allowed to perform this action', 'POLICY_DENIED', 403); }
function found(value) { if (!value) throw new FarmerFeeServiceError('Farmer fee not found', 'NOT_FOUND', 404); return value; }
async function validateFarmerAndFarm(farmerId, farmId) {
  const [farmer, farm] = await Promise.all([
    User.findById(farmerId).select('role').lean().exec(),
    Farm.findById(farmId).select('_id').lean().exec()
  ]);
  if (!farmer || farmer.role !== 'farmer') throw new FarmerFeeServiceError('farmerId must reference a user with role farmer', 'VALIDATION_ERROR', 400);
  if (!farm) throw new FarmerFeeServiceError('farmId must reference an existing farm', 'VALIDATION_ERROR', 400);
}
async function createFee(actorUser, payload) {
  allow(policy.canCreateFee(actorUser));
  const data = validator.validateCreate(payload);
  await validateFarmerAndFarm(data.farmerId, data.farmId);
  return repository.create({ ...data, createdBy: actorId(actorUser) });
}
async function listFeesForAdmin(actorUser, filters = {}) {
  allow(isAdmin(actorUser) || isBusiness(actorUser));
  return repository.listAll(filters);
}
async function listMyFees(actorUser, filters = {}) {
  allow(isFarmer(actorUser));
  const safeFilters = { status: filters.status, page: filters.page, limit: filters.limit };
  return repository.listForFarmer(actorId(actorUser), safeFilters);
}
async function listFees(actorUser, filters = {}) {
  allow(policy.canListFees(actorUser));
  return isFarmer(actorUser) ? listMyFees(actorUser, filters) : listFeesForAdmin(actorUser, filters);
}
async function getFee(actorUser, feeId) {
  const fee = found(await repository.findById(feeId));
  allow(policy.canReadFee(actorUser, fee));
  return fee;
}
async function getFeeSummaryForFarmer(actorUser, farmerId) {
  let targetFarmerId = farmerId;
  if (isFarmer(actorUser)) {
    targetFarmerId = actorId(actorUser);
    if (farmerId && String(farmerId) !== String(targetFarmerId)) allow(false);
  } else {
    allow(isAdmin(actorUser) || isBusiness(actorUser));
    if (!targetFarmerId) throw new FarmerFeeServiceError('farmerId is required', 'VALIDATION_ERROR', 400);
  }
  return repository.summaryForFarmer(targetFarmerId);
}
async function getFeeSummaryForFarm(actorUser, farmId) {
  allow(isAdmin(actorUser) || isBusiness(actorUser));
  if (!farmId) throw new FarmerFeeServiceError('farmId is required', 'VALIDATION_ERROR', 400);
  return repository.getSummaryForFarm(farmId);
}
async function markFeeAsPaid(actorUser, feeId, payload) {
  const fee = found(await repository.findById(feeId));
  allow(policy.canMarkPaid(actorUser, fee));
  if (fee.status !== 'pending') throw new FarmerFeeServiceError('Only pending fees can be marked paid', 'CONFLICT', 409);
  const data = validator.validateMarkPaid(payload);
  return found(await repository.markPaid(feeId, { ...data, paidBy: actorId(actorUser) }));
}
async function updateFee(actorUser, feeId, payload) {
  allow(policy.canUpdateFee(actorUser));
  found(await repository.findById(feeId));
  const data = validator.validateUpdate(payload);
  if (data.farmerId || data.farmId) {
    const current = await repository.findById(feeId);
    await validateFarmerAndFarm(data.farmerId || current.farmerId, data.farmId || current.farmId);
  }
  return found(await repository.updateById(feeId, data));
}
async function cancelFee(actorUser, feeId) {
  allow(policy.canDeleteFee(actorUser));
  return found(await repository.softDeleteById(feeId, actorId(actorUser)));
}

module.exports = { FarmerFeeServiceError, createFee, listFeesForAdmin, listMyFees, listFees,
  getFee, getFeeSummaryForFarmer, getFeeSummaryForFarm, markFeeAsPaid, updateFee, cancelFee };
