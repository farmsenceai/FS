const mongoose = require('mongoose');
const tenantEnvelopePlugin = require('../../shared/db/tenantEnvelope.plugin');
const excludeSoftDeletedPlugin = require('../../shared/db/softDelete.plugin');

const { Schema } = mongoose;

const farmAssignmentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startsAt: { type: Date, required: true },
  endsAt: Date,
  status: {
    type: String,
    enum: ['active', 'paused', 'ended'],
    default: 'active'
  },
  assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: {
    type: String,
    enum: ['farm_owner', 'farm_manager', 'supervisor', 'worker', 'veterinarian', 'consultant', 'viewer'],
    default: 'worker'
  },
  notes: { type: String, trim: true }
});

farmAssignmentSchema.plugin(tenantEnvelopePlugin, {
  requireBusinessId: true,
  requireFarmId: true
});
farmAssignmentSchema.plugin(excludeSoftDeletedPlugin);

farmAssignmentSchema.index({ userId: 1, status: 1, startsAt: 1, endsAt: 1 });
farmAssignmentSchema.index({ businessId: 1, farmId: 1, status: 1 });
farmAssignmentSchema.index(
  { farmId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'active', deletedAt: null }
  }
);

module.exports =
  mongoose.models.FarmAssignment ||
  mongoose.model('FarmAssignment', farmAssignmentSchema, 'farm_assignments');
