const mongoose = require('mongoose');

const feedWaterBatchSchema = new mongoose.Schema({
  batchId: { type: String, required: true, trim: true, uppercase: true, index: true },
  farm: { type: String, required: true, trim: true, index: true },
  birds: { type: Number, required: true, min: 1 },
  ageDays: { type: Number, required: true, min: 0 },
  feedConsumedKg: { type: Number, required: true, min: 0 },
  averageFeedPerBirdKg: { type: Number, required: true, min: 0 },
  fcr: { type: Number, required: true, min: 0 },
  waterConsumedLitres: { type: Number, required: true, min: 0 },
  averageWaterPerBirdLitres: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Excellent', 'Good', 'Average', 'Warning'], required: true, index: true },
  measuredAt: { type: Date, required: true, index: true },
  notes: { type: String, default: '', trim: true },
  source: { type: String, enum: ['seed', 'business', 'farmer'], default: 'business', index: true },
  aggregateKey: { type: String, trim: true, unique: true, sparse: true },
  submittedByUserId: { type: String, default: '', trim: true, index: true },
  submittedByName: { type: String, default: '', trim: true },
  shed: { type: String, default: '', trim: true },
  logDate: { type: String, default: '', trim: true, index: true }
}, { timestamps: true });

feedWaterBatchSchema.index({ farm: 1, measuredAt: -1 });

module.exports = mongoose.model('FeedWaterBatch', feedWaterBatchSchema);
