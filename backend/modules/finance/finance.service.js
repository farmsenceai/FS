const FarmerEarningClaim = require('../../models/FarmerEarningClaim');
const canonical = require('../../src/modules/financial-aggregations/financial-aggregations.service');

function httpError(message, status = 400) { const error = new Error(message); error.status = status; return error; }
function escapeRegex(value) { return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function claimPayload(body) {
  const required = ['batchId', 'farm', 'amount', 'description', 'serviceDate'];
  const missing = required.filter(field => body[field] === undefined || body[field] === null || String(body[field]).trim() === '');
  if (missing.length) throw httpError(`Missing required fields: ${missing.join(', ')}`);
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw httpError('amount must be greater than zero');
  const serviceDate = new Date(body.serviceDate);
  if (Number.isNaN(serviceDate.getTime())) throw httpError('serviceDate must be valid');
  return { batchId: String(body.batchId).trim(), farm: String(body.farm).trim(), amount, description: String(body.description).trim(), serviceDate };
}
async function nextClaimNumber() { return `FCL-${String(Date.now()).slice(-8)}`; }

const getOverview = (user, query) => canonical.overview(user, query);
const getBatches = (user, query) => canonical.batches(user, query);
const getBatchwiseRevenue = (user, query) => canonical.batchwiseRevenue(user, query);
const getProfitForecast = (user, query) => canonical.forecast(user, query);
const getHistoricalReports = (user, query) => canonical.historical(user, query);
const getSavings = () => canonical.retiredSavings();

async function getFarmerSummary(userId) {
  const claims = await FarmerEarningClaim.find({ submittedByUserId: userId }).sort({ createdAt: -1 }).lean();
  const paid = claims.filter(item => item.status === 'Paid');
  const pending = claims.filter(item => ['Pending', 'Approved'].includes(item.status));
  const currentMonth = new Date(); currentMonth.setDate(1); currentMonth.setHours(0, 0, 0, 0);
  return { summary: { thisMonth: claims.filter(item => item.createdAt >= currentMonth && item.status !== 'Rejected').reduce((sum, item) => sum + item.amount, 0), pendingAmount: pending.reduce((sum, item) => sum + item.amount, 0), lifetimeEarnings: paid.reduce((sum, item) => sum + item.amount, 0), lastPayout: paid[0] || null } };
}
async function getFarmerClaims(userId) { return { claims: await FarmerEarningClaim.find({ submittedByUserId: userId }).sort({ createdAt: -1 }).lean() }; }
async function createFarmerClaim(user, body) { return FarmerEarningClaim.create({ ...claimPayload(body), claimNumber: await nextClaimNumber(), submittedByUserId: user.userId, submittedByName: user.name || user.email || 'Farmer' }); }
async function updateFarmerClaim(userId, id, body) { const claim = await FarmerEarningClaim.findOne({ _id: id, submittedByUserId: userId }); if (!claim) throw httpError('Earning claim not found', 404); if (claim.status !== 'Pending') throw httpError('Only pending claims can be edited'); Object.assign(claim, claimPayload(body)); await claim.save(); return claim; }
async function deleteFarmerClaim(userId, id) { const claim = await FarmerEarningClaim.findOneAndDelete({ _id: id, submittedByUserId: userId, status: 'Pending' }); if (!claim) throw httpError('Only pending claims can be deleted', 404); return { id: claim.id }; }
async function getClaims(query = {}) {
  const filter = {};
  if (query.status && query.status !== 'All') filter.status = query.status;
  if (query.search) { const regex = new RegExp(escapeRegex(query.search), 'i'); filter.$or = [{ claimNumber: regex }, { batchId: regex }, { farm: regex }, { submittedByName: regex }]; }
  return { claims: await FarmerEarningClaim.find(filter).sort({ createdAt: -1 }).lean() };
}
async function updateClaimStatus(id, body) { const allowed = ['Pending', 'Approved', 'Paid', 'Rejected']; if (!allowed.includes(body.status)) throw httpError('Invalid claim status'); const claim = await FarmerEarningClaim.findById(id); if (!claim) throw httpError('Earning claim not found', 404); claim.status = body.status; claim.businessNote = String(body.businessNote || '').trim(); claim.reviewedAt = new Date(); if (body.status === 'Paid') claim.paidAt = new Date(); await claim.save(); return claim; }

module.exports = { getOverview, getBatches, getBatchwiseRevenue, getProfitForecast, getHistoricalReports, getSavings, getFarmerSummary, getFarmerClaims, createFarmerClaim, updateFarmerClaim, deleteFarmerClaim, getClaims, updateClaimStatus };
