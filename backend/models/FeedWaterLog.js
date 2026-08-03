const mongoose = require('mongoose');

const feedWaterLogSchema = new mongoose.Schema({
  submittedByUserId: { type: String, required: true, trim: true, index: true },
  submittedByName: { type: String, default: '', trim: true },
  farm: { type: String, required: true, trim: true, index: true },
  shed: { type: String, required: true, trim: true, index: true },
  batchId: { type: String, required: true, trim: true, uppercase: true, index: true },
  birds: { type: Number, required: true, min: 1 },
  ageDays: { type: Number, required: true, min: 0 },
  feedConsumedKg: { type: Number, required: true, min: 0 },
  waterConsumedLitres: { type: Number, required: true, min: 0 },
  fcr: { type: Number, required: true, min: 0 },
  logDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/, index: true },
  loggedAt: { type: Date, required: true, index: true },
  notes: { type: String, default: '', trim: true }
}, { timestamps: true });

feedWaterLogSchema.index({ submittedByUserId: 1, logDate: 1, loggedAt: -1 });
feedWaterLogSchema.index({ submittedByUserId: 1, farm: 1, batchId: 1, logDate: 1 });

module.exports = mongoose.model('FeedWaterLog', feedWaterLogSchema);
