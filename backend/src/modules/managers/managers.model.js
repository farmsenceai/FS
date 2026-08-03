const mongoose = require('mongoose');
const excludeSoftDeletedPlugin = require('../../shared/db/softDelete.plugin');

const { Schema } = mongoose;
const managerSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  title: { type: String, trim: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  notes: { type: String, trim: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true, collection: 'canonical_managers' });

managerSchema.plugin(excludeSoftDeletedPlugin);
managerSchema.index(
  { email: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.models.CanonicalManager ||
  mongoose.model('CanonicalManager', managerSchema);
