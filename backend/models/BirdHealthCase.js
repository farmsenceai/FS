const mongoose = require('mongoose');

const birdHealthCaseSchema = new mongoose.Schema({
  batchId: { type: String, required: true, trim: true, uppercase: true, index: true },
  farm: { type: String, required: true, trim: true, index: true },
  shed: { type: String, default: '', trim: true },
  batchTotal: { type: Number, required: true, min: 1 },
  sickBirds: { type: Number, required: true, min: 0 },
  symptoms: { type: String, required: true, trim: true },
  detectedOn: { type: Date, required: true, index: true },
  severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'], required: true, index: true },
  actionTaken: { type: String, required: true, trim: true },
  veterinarian: { type: String, required: true, trim: true },
  treatmentStatus: { type: String, enum: ['Monitoring', 'Under Treatment', 'Recovered'], default: 'Under Treatment', index: true },
  notes: { type: String, default: '', trim: true }
  ,mortalityCount: { type: Number, default: 0, min: 0 }
  ,cause: { type: String, default: '', trim: true }
  ,source: { type: String, enum: ['seed', 'business', 'farmer'], default: 'business' }
  ,submittedByUserId: { type: String, default: '', trim: true, index: true }
  ,submittedByName: { type: String, default: '', trim: true }
}, { timestamps: true });

birdHealthCaseSchema.index({ farm: 1, detectedOn: -1 });

module.exports = mongoose.model('BirdHealthCase', birdHealthCaseSchema);
