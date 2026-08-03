const mongoose = require('mongoose');
const excludeSoftDeletedPlugin = require('../../shared/db/softDelete.plugin');
const { Schema } = mongoose;

const schema = new Schema({
  farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'FarmProject' },
  note: { type: String, required: true, trim: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true, collection: 'farm_work_updates' });
schema.plugin(excludeSoftDeletedPlugin);
schema.index({ farmId: 1, createdAt: -1 });
schema.index({ projectId: 1, createdAt: -1 });
module.exports = mongoose.models.FarmWorkUpdate || mongoose.model('FarmWorkUpdate', schema);
