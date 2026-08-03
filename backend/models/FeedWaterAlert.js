const mongoose = require('mongoose');

const feedWaterAlertSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  batchId: { type: String, default: '', trim: true, uppercase: true, index: true },
  severity: { type: String, enum: ['normal', 'warning', 'high'], required: true, index: true },
  occurredAt: { type: Date, required: true, index: true },
  read: { type: Boolean, default: false, index: true }
}, { timestamps: true });

module.exports = mongoose.model('FeedWaterAlert', feedWaterAlertSchema);
