const mongoose = require('mongoose');

const performanceBatchSchema = new mongoose.Schema({
  batchId: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true },
  farm: { type: String, required: true, trim: true, index: true },
  birds: { type: Number, required: true, min: 1 },
  fcr: { type: Number, required: true, min: 0 },
  averageDailyGainG: { type: Number, required: true, min: 0 },
  averageWeightKg: { type: Number, required: true, min: 0 },
  mortalityRatePct: { type: Number, required: true, min: 0, max: 100 },
  livabilityPct: { type: Number, required: true, min: 0, max: 100 },
  performanceScore: { type: Number, required: true, min: 0, max: 100 },
  status: { type: String, enum: ['Excellent', 'Good', 'Average'], required: true, index: true },
  completedAt: { type: Date, required: true, index: true },
  notes: { type: String, default: '', trim: true }
}, { timestamps: true });

performanceBatchSchema.index({ farm: 1, completedAt: -1 });

module.exports = mongoose.model('PerformanceBatch', performanceBatchSchema);
