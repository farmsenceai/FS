const mongoose = require('mongoose');

const trendPointSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  temperatureC: { type: Number, required: true },
  humidityPct: { type: Number, required: true, min: 0, max: 100 },
  ammoniaPpm: { type: Number, required: true, min: 0 },
  co2Ppm: { type: Number, required: true, min: 0 }
}, { _id: false });

const distributionSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  percentage: { type: Number, required: true, min: 0, max: 100 },
  count: { type: Number, required: true, min: 0 },
  color: { type: String, required: true, trim: true }
}, { _id: false });

const environmentSnapshotSchema = new mongoose.Schema({
  key: { type: String, default: 'current', unique: true },
  averageTemperatureC: { type: Number, required: true },
  previousTemperatureC: { type: Number, required: true },
  averageHumidityPct: { type: Number, required: true, min: 0, max: 100 },
  previousHumidityPct: { type: Number, required: true, min: 0, max: 100 },
  airQualityIndex: { type: Number, required: true, min: 0 },
  previousAirQualityIndex: { type: Number, required: true, min: 0 },
  averageAmmoniaPpm: { type: Number, required: true, min: 0 },
  previousAmmoniaPpm: { type: Number, required: true, min: 0 },
  averageCo2Ppm: { type: Number, required: true, min: 0 },
  previousCo2Ppm: { type: Number, required: true, min: 0 },
  environmentScore: { type: Number, required: true, min: 0, max: 100 },
  previousEnvironmentScore: { type: Number, required: true, min: 0, max: 100 },
  trend: { type: [trendPointSchema], default: [] },
  distribution: { type: [distributionSchema], default: [] },
  tips: { type: [String], default: [] },
  updatedFor: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('EnvironmentSnapshot', environmentSnapshotSchema);
