const mongoose = require('mongoose');

const farmerEarningClaimSchema = new mongoose.Schema({
  claimNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
  batchId: { type: String, required: true, trim: true, uppercase: true, index: true },
  farm: { type: String, required: true, trim: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, required: true, trim: true },
  serviceDate: { type: Date, required: true },
  expectedPayoutDate: { type: Date, default: null },
  status: { type: String, enum: ['Pending', 'Approved', 'Paid', 'Rejected'], default: 'Pending', index: true },
  submittedByUserId: { type: String, required: true, trim: true, index: true },
  submittedByName: { type: String, default: 'Farmer', trim: true },
  businessNote: { type: String, default: '', trim: true },
  reviewedAt: { type: Date, default: null },
  paidAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('FarmerEarningClaim', farmerEarningClaimSchema);
