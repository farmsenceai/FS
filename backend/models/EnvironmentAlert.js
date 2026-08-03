const mongoose = require('mongoose');

const environmentAlertSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  batchId: { type: String, default: '', trim: true, uppercase: true, index: true },
  house: { type: String, default: '', trim: true },
  severity: { type: String, enum: ['normal', 'warning', 'high'], required: true, index: true },
  occurredAt: { type: Date, required: true, index: true },
  read: { type: Boolean, default: false, index: true }
}, { timestamps: true });

module.exports = mongoose.model('EnvironmentAlert', environmentAlertSchema);
