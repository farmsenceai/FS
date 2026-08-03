const mongoose = require('mongoose');
const excludeSoftDeletedPlugin = require('../../shared/db/softDelete.plugin');

const { Schema } = mongoose;
const schema = new Schema({
  farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR', uppercase: true, trim: true },
  description: { type: String, required: true, trim: true },
  status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
  dueDate: Date,
  paidAt: Date,
  paidBy: { type: Schema.Types.ObjectId, ref: 'User' },
  paymentReference: { type: String, trim: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true, collection: 'farmer_fees' });

schema.plugin(excludeSoftDeletedPlugin);
schema.index({ farmerId: 1, status: 1 });
schema.index({ farmId: 1, status: 1 });
schema.index({ farmerId: 1, createdAt: -1 });

module.exports = mongoose.models.FarmerFee || mongoose.model('FarmerFee', schema);
