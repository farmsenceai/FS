const mongoose = require('mongoose');

const birdHealthRecordSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Health Check', 'Treatment', 'Vaccination', 'Mortality', 'Health Summary'], required: true, index: true },
  batchId: { type: String, required: true, trim: true, uppercase: true, index: true },
  farm: { type: String, required: true, trim: true },
  recordedAt: { type: Date, required: true, index: true },
  summary: { type: String, required: true, trim: true },
  createdBy: { type: String, default: 'FarmSence Health Team', trim: true }
}, { timestamps: true });

module.exports = mongoose.model('BirdHealthRecord', birdHealthRecordSchema);
