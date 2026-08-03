const mongoose = require('mongoose');

const performanceDriverSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true, unique: true },
  title: { type: String, required: true, trim: true },
  metricLabel: { type: String, required: true, trim: true },
  displayValue: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Good', 'Average'], required: true },
  icon: { type: String, default: 'P', trim: true },
  color: { type: String, required: true, trim: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('PerformanceDriver', performanceDriverSchema);
