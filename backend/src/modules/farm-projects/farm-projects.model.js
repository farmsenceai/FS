const mongoose = require('mongoose');
const excludeSoftDeletedPlugin = require('../../shared/db/softDelete.plugin');
const { Schema } = mongoose;

const schema = new Schema({
  farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: { type: String, enum: ['planned', 'in_progress', 'blocked', 'completed', 'cancelled'], default: 'planned' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  startDate: Date,
  targetDate: Date,
  completedAt: Date,
  percentComplete: { type: Number, min: 0, max: 100, default: 0 },
  managerIds: [{ type: Schema.Types.ObjectId, ref: 'CanonicalManager' }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true, collection: 'farm_projects' });
schema.plugin(excludeSoftDeletedPlugin);
schema.index({ farmId: 1, status: 1 });
module.exports = mongoose.models.FarmProject || mongoose.model('FarmProject', schema);
