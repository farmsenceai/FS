const mongoose = require('mongoose');

const trendPointSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  healthy: { type: Number, required: true, min: 0, max: 100 },
  sick: { type: Number, required: true, min: 0, max: 100 },
  mortality: { type: Number, required: true, min: 0, max: 100 }
}, { _id: false });

const namedStatusSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Normal', 'Warning', 'Critical'], default: 'Normal' }
}, { _id: false });

const issueSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  count: { type: Number, required: true, min: 0 },
  color: { type: String, required: true, trim: true }
}, { _id: false });

const birdHealthSnapshotSchema = new mongoose.Schema({
  key: { type: String, default: 'current', unique: true },
  overallHealthScore: { type: Number, required: true, min: 0, max: 100 },
  previousHealthScore: { type: Number, required: true, min: 0, max: 100 },
  vaccinationCompliance: { type: Number, required: true, min: 0, max: 100 },
  previousVaccinationCompliance: { type: Number, required: true, min: 0, max: 100 },
  totalBirds: { type: Number, required: true, min: 0 },
  healthyBirds: { type: Number, required: true, min: 0 },
  sickBirds: { type: Number, required: true, min: 0 },
  sickBirdsToday: { type: Number, required: true, min: 0 },
  criticalBirds: { type: Number, required: true, min: 0 },
  sickBirdsYesterday: { type: Number, required: true, min: 0 },
  monthlyMortalityPct: { type: Number, required: true, min: 0, max: 100 },
  previousMonthlyMortalityPct: { type: Number, required: true, min: 0, max: 100 },
  healthChecksCompleted: { type: Number, required: true, min: 0 },
  healthChecksTotal: { type: Number, required: true, min: 0 },
  healthChecksYesterday: { type: Number, required: true, min: 0 },
  weeklyTrend: { type: [trendPointSchema], default: [] },
  quickChecks: { type: [namedStatusSchema], default: [] },
  commonIssues: { type: [issueSchema], default: [] },
  periodLabel: { type: String, default: 'This Week', trim: true },
  updatedFor: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('BirdHealthSnapshot', birdHealthSnapshotSchema);
