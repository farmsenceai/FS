const mongoose = require('mongoose');

const performanceSnapshotSchema = new mongoose.Schema({
  key: { type: String, default: 'current', unique: true },
  averageFcr: { type: Number, required: true, min: 0 },
  previousFcr: { type: Number, required: true, min: 0 },
  averageWeightKg: { type: Number, required: true, min: 0 },
  previousWeightKg: { type: Number, required: true, min: 0 },
  averageDailyGainG: { type: Number, required: true, min: 0 },
  previousDailyGainG: { type: Number, required: true, min: 0 },
  mortalityRatePct: { type: Number, required: true, min: 0, max: 100 },
  previousMortalityRatePct: { type: Number, required: true, min: 0, max: 100 },
  livabilityPct: { type: Number, required: true, min: 0, max: 100 },
  previousLivabilityPct: { type: Number, required: true, min: 0, max: 100 },
  performanceScore: { type: Number, required: true, min: 0, max: 100 },
  previousPerformanceScore: { type: Number, required: true, min: 0, max: 100 },
  benchmarkPercentile: { type: Number, required: true, min: 0, max: 100 },
  insightTitle: { type: String, required: true, trim: true },
  insightText: { type: String, required: true, trim: true },
  updatedFor: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('PerformanceSnapshot', performanceSnapshotSchema);
