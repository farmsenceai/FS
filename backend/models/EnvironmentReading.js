const mongoose = require('mongoose');

const environmentReadingSchema = new mongoose.Schema({
  batchId: { type: String, required: true, trim: true, uppercase: true, index: true },
  farm: { type: String, required: true, trim: true, index: true },
  house: { type: String, required: true, trim: true, index: true },
  birds: { type: Number, required: true, min: 1 },
  temperatureC: { type: Number, required: true },
  humidityPct: { type: Number, required: true, min: 0, max: 100 },
  ammoniaPpm: { type: Number, required: true, min: 0 },
  co2Ppm: { type: Number, required: true, min: 0 },
  airQualityIndex: { type: Number, required: true, min: 0 },
  airQualityLabel: { type: String, enum: ['Excellent', 'Good', 'Moderate', 'Poor'], required: true },
  status: { type: String, enum: ['excellent', 'good', 'moderate', 'warning'], required: true, index: true },
  recordedAt: { type: Date, required: true, index: true },
  notes: { type: String, default: '', trim: true }
  ,source: { type: String, enum: ['seed', 'business', 'farmer'], default: 'business' }
  ,submittedByUserId: { type: String, default: '', trim: true, index: true }
  ,submittedByName: { type: String, default: '', trim: true }
}, { timestamps: true });

environmentReadingSchema.index({ farm: 1, house: 1, recordedAt: -1 });

module.exports = mongoose.model('EnvironmentReading', environmentReadingSchema);
