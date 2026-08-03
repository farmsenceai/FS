const mongoose = require('mongoose');

const trendPointSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  feedKg: { type: Number, required: true, min: 0 },
  waterLitres: { type: Number, required: true, min: 0 }
}, { _id: false });

const wastageItemSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  amountKg: { type: Number, required: true, min: 0 },
  color: { type: String, required: true, trim: true }
}, { _id: false });

const feedWaterSnapshotSchema = new mongoose.Schema({
  key: { type: String, default: 'current', unique: true },
  feedConsumedTodayKg: { type: Number, required: true, min: 0 },
  feedConsumedYesterdayKg: { type: Number, required: true, min: 0 },
  waterConsumedTodayLitres: { type: Number, required: true, min: 0 },
  waterConsumedYesterdayLitres: { type: Number, required: true, min: 0 },
  averageFcr: { type: Number, required: true, min: 0 },
  previousAverageFcr: { type: Number, required: true, min: 0 },
  averageFeedEfficiencyPct: { type: Number, required: true, min: 0, max: 100 },
  previousFeedEfficiencyPct: { type: Number, required: true, min: 0, max: 100 },
  batchesMonitored: { type: Number, required: true, min: 0 },
  totalFeedOfferedKg: { type: Number, required: true, min: 0 },
  feedWastageKg: { type: Number, required: true, min: 0 },
  averageFeedPerBirdKg: { type: Number, required: true, min: 0 },
  totalWaterSuppliedLitres: { type: Number, required: true, min: 0 },
  waterWastageLitres: { type: Number, required: true, min: 0 },
  averageWaterPerBirdLitres: { type: Number, required: true, min: 0 },
  waterTdsPpm: { type: Number, required: true, min: 0 },
  inventorySufficientDays: { type: Number, required: true, min: 0 },
  lowStockAlertKg: { type: Number, required: true, min: 0 },
  trend: { type: [trendPointSchema], default: [] },
  wastageBreakdown: { type: [wastageItemSchema], default: [] },
  updatedFor: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('FeedWaterSnapshot', feedWaterSnapshotSchema);
