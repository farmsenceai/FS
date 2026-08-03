const mongoose = require('mongoose');

const environmentRecordSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  batchId: { type: String, default: '', trim: true, uppercase: true, index: true },
  farm: { type: String, default: '', trim: true },
  recordedAt: { type: Date, required: true, index: true },
  summary: { type: String, required: true, trim: true },
  createdBy: { type: String, default: 'FarmSence Environment Team', trim: true }
}, { timestamps: true });

module.exports = mongoose.model('EnvironmentRecord', environmentRecordSchema);
