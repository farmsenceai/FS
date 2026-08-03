const mongoose = require('mongoose');

const waterSystemStatusSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true, unique: true },
  label: { type: String, required: true, trim: true },
  value: { type: String, default: '', trim: true },
  status: { type: String, enum: ['Normal', 'Good', 'Warning', 'Critical', 'Online', 'Offline'], required: true },
  icon: { type: String, default: '•', trim: true },
  sortOrder: { type: Number, default: 0 },
  updatedFor: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('WaterSystemStatus', waterSystemStatusSchema);
