const mongoose = require('mongoose');
const excludeSoftDeletedPlugin = require('../../shared/db/softDelete.plugin');

const { Schema } = mongoose;
const schema = new Schema({
  managerId: { type: Schema.Types.ObjectId, ref: 'CanonicalManager', required: true },
  farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: true },
  status: { type: String, enum: ['active', 'ended'], default: 'active' },
  startsAt: { type: Date, default: Date.now },
  endsAt: Date,
  assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true, collection: 'manager_farm_assignments' });

schema.plugin(excludeSoftDeletedPlugin);
schema.index(
  { managerId: 1, farmId: 1 },
  { unique: true, partialFilterExpression: { status: 'active', deletedAt: null } }
);
schema.index({ farmId: 1, status: 1 });
schema.index({ managerId: 1, status: 1 });

module.exports = mongoose.models.ManagerFarmAssignment ||
  mongoose.model('ManagerFarmAssignment', schema);
