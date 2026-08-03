const mongoose = require('mongoose');

const birdHealthAlertSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  batchId: { type: String, default: '', trim: true, uppercase: true, index: true },
  type: { type: String, enum: ['mortality', 'sickness', 'vaccination', 'health-check', 'general'], default: 'general' },
  severity: { type: String, enum: ['info', 'success', 'warning', 'critical'], default: 'info', index: true },
  occurredAt: { type: Date, required: true, index: true },
  read: { type: Boolean, default: false, index: true }
}, { timestamps: true });

module.exports = mongoose.model('BirdHealthAlert', birdHealthAlertSchema);
