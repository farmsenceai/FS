const mongoose = require('mongoose');

const environmentParameterSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true, unique: true },
  label: { type: String, required: true, trim: true },
  value: { type: Number, required: true },
  unit: { type: String, default: '', trim: true },
  status: { type: String, enum: ['optimal', 'good', 'moderate', 'warning', 'poor', 'critical'], required: true },
  acceptableRange: { type: String, required: true, trim: true },
  icon: { type: String, default: 'E', trim: true },
  sortOrder: { type: Number, default: 0 },
  updatedFor: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('EnvironmentParameter', environmentParameterSchema);
