const mongoose = require('mongoose');
const tenantEnvelopePlugin = require('../../shared/db/tenantEnvelope.plugin');
const excludeSoftDeletedPlugin = require('../../shared/db/softDelete.plugin');

const { Schema } = mongoose;
const STATUSES = ['pending', 'approved', 'rejected', 'paid'];

const schema = new Schema({
  claimNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Schema.Types.Decimal128, required: true },
  currency: { type: String, default: 'INR', enum: ['INR'] },
  serviceDate: { type: Date, required: true },
  description: { type: String, required: true, trim: true },
  status: { type: String, enum: STATUSES, default: 'pending' },
  reviewerNote: { type: String, trim: true },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  paidAt: Date,
  paymentReference: { type: String, trim: true }
});

schema.plugin(tenantEnvelopePlugin, { requireBusinessId: true, requireFarmId: true });
schema.path('batchId').required(true);
schema.plugin(excludeSoftDeletedPlugin);
schema.index({ farmerId: 1, createdAt: -1 });
schema.index({ businessId: 1, status: 1, serviceDate: -1 });
schema.index({ farmId: 1, batchId: 1, status: 1 });

module.exports = mongoose.models.CompensationClaim ||
  mongoose.model('CompensationClaim', schema, 'compensation_claims');
module.exports.STATUSES = STATUSES;
