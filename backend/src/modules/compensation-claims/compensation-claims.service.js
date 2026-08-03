const mongoose = require('mongoose');
const repository = require('./compensation-claims.repository');
const validator = require('./compensation-claims.validator');
const policy = require('./compensation-claims.policy');
const batchesRepository = require('../bird-batches/bird-batches.repository');
const { actorId } = require('../../shared/auth/roleAccess');

class CompensationClaimServiceError extends Error {
  constructor(message, code, status) { super(message); this.code = code; this.status = status; }
}
function allow(value, message = 'You are not allowed to perform this action') {
  if (!value) throw new CompensationClaimServiceError(message, 'POLICY_DENIED', 403);
}
function found(value) {
  if (!value) throw new CompensationClaimServiceError('Compensation claim not found', 'NOT_FOUND', 404);
  return value;
}
async function batchInScope(businessId, farmId, batchId) {
  return found(await batchesRepository.findById(businessId, farmId, batchId));
}
function claimNumber() {
  const id = new mongoose.Types.ObjectId();
  return { id, number: `CMP-${new Date().getUTCFullYear()}-${String(id).slice(-8).toUpperCase()}` };
}
function audit(user, action, claim) {
  console.log({ event: 'audit_event', occurredAt: new Date().toISOString(), actor: { type: 'user', id: actorId(user) }, action, entity: { type: 'compensation_claim', id: claim._id }, outcome: 'success' });
}

async function createClaim(user, businessId, farmId, batchId, payload) {
  allow(await policy.canSubmit(user, farmId), 'You can only submit claims for an actively assigned farm');
  await batchInScope(businessId, farmId, batchId);
  const data = validator.validateCreate(payload);
  const generated = claimNumber();
  const claim = await repository.create({
    _id: generated.id,
    claimNumber: generated.number,
    businessId,
    farmId,
    batchId,
    farmerId: actorId(user),
    createdBy: actorId(user),
    ...data
  });
  audit(user, 'compensation_claim.submitted', claim);
  return claim;
}
async function listMine(user, filters) {
  allow(user?.role === 'farmer');
  return repository.listMine(actorId(user), filters);
}
async function summaryMine(user) {
  allow(user?.role === 'farmer');
  return repository.summaryMine(actorId(user));
}
async function updateMine(user, businessId, farmId, batchId, id, payload) {
  await batchInScope(businessId, farmId, batchId);
  const claim = found(await repository.findScoped(businessId, farmId, batchId, id));
  allow(policy.canMutateOwnPending(user, claim), 'Only your own pending claims can be edited');
  allow(await policy.canSubmit(user, farmId), 'Your active farm assignment is required to edit this claim');
  const updated = await repository.update(claim, validator.validateUpdate(payload));
  audit(user, 'compensation_claim.updated', updated);
  return updated;
}
async function deleteMine(user, businessId, farmId, batchId, id) {
  await batchInScope(businessId, farmId, batchId);
  const claim = found(await repository.findScoped(businessId, farmId, batchId, id));
  allow(policy.canMutateOwnPending(user, claim), 'Only your own pending claims can be deleted');
  allow(await policy.canSubmit(user, farmId), 'Your active farm assignment is required to delete this claim');
  const deleted = await repository.remove(claim, actorId(user));
  audit(user, 'compensation_claim.deleted', deleted);
  return deleted;
}
async function listForReview(user, filters) {
  allow(policy.canListAll(user));
  return repository.listAll(filters);
}
async function reviewClaim(user, id, payload) {
  allow(policy.canReview(user));
  const claim = found(await repository.findById(id));
  const data = validator.validateReview(payload);
  if (data.status === 'paid' && claim.status !== 'approved') {
    throw new CompensationClaimServiceError('Only an approved claim can be marked paid', 'CONFLICT', 409);
  }
  if (['approved', 'rejected'].includes(data.status) && claim.status !== 'pending') {
    throw new CompensationClaimServiceError('Only a pending claim can be approved or rejected', 'CONFLICT', 409);
  }
  const updated = await repository.update(claim, {
    ...data,
    reviewedBy: actorId(user),
    reviewedAt: new Date(),
    ...(data.status === 'paid' ? { paidAt: new Date() } : {})
  });
  audit(user, `compensation_claim.${data.status}`, updated);
  return updated;
}

module.exports = { CompensationClaimServiceError, createClaim, listMine, summaryMine, updateMine, deleteMine, listForReview, reviewClaim };
