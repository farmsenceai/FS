const mongoose = require('mongoose');
const tenantEnvelopePlugin = require('../../shared/db/tenantEnvelope.plugin');
const excludeSoftDeletedPlugin = require('../../shared/db/softDelete.plugin');

const { Schema } = mongoose;

const feedSchema = new Schema(
  {
    consumedKg: { type: Number, min: 0 },
    remainingStockKg: { type: Number, min: 0 }
  },
  { _id: false }
);

const waterSchema = new Schema(
  { consumedLiters: { type: Number, min: 0 } },
  { _id: false }
);

const mortalitySchema = new Schema(
  {
    count: { type: Number, default: 0, min: 0 },
    cause: { type: String, trim: true }
  },
  { _id: false }
);

const cullsSchema = new Schema(
  {
    count: { type: Number, default: 0, min: 0 },
    reason: { type: String, trim: true }
  },
  { _id: false }
);

const roiSchema = new Schema(
  {
    // Farmer-entered/self-reported values only. Authoritative computed profitability
    // must remain separate and must never silently overwrite these figures.
    reportedRevenue: { type: Number, min: 0 },
    reportedCost: { type: Number, min: 0 },
    reportedProfit: { type: Number, min: 0 },
    notes: { type: String, trim: true }
  },
  { _id: false }
);

const sensorReadingsSchema = new Schema(
  {
    temperatureC: { type: Number, min: 0 },
    humidityPct: { type: Number, min: 0 },
    ammoniaPpm: { type: Number, min: 0 },
    co2Ppm: { type: Number, min: 0 },
    source: {
      type: String,
      enum: ['manual', 'sensor_device', 'estimated'],
      default: 'manual'
    }
  },
  { _id: false }
);

const flockRecordSchema = new Schema({
  // One-time migration traceability to the primary legacy daily-data source.
  legacySourceId: Schema.Types.ObjectId,
  // Operational day represented by this record, independent of submission timestamps.
  recordDate: { type: Date, required: true },
  feed: { type: feedSchema, default: undefined },
  water: { type: waterSchema, default: undefined },
  mortality: { type: mortalitySchema, default: () => ({}) },
  culls: { type: cullsSchema, default: () => ({}) },
  avgWeightGrams: { type: Number, min: 0 },
  observations: { type: String, trim: true },
  roi: { type: roiSchema, default: undefined },
  sensorReadings: { type: sensorReadingsSchema, default: undefined },
  enteredVia: {
    type: String,
    enum: ['manual', 'offline_sync', 'import'],
    default: 'manual'
  },
  // Supports draft/submission/verification/locking in the offline-capable workflow.
  syncStatus: {
    type: String,
    enum: ['draft', 'submitted', 'verified', 'locked'],
    default: 'submitted'
  },
  // Corrections are append-only compensating records; originals are never overwritten.
  correctsRecordId: { type: Schema.Types.ObjectId, ref: 'FlockRecord' }
});

flockRecordSchema.plugin(tenantEnvelopePlugin, {
  requireBusinessId: true,
  requireFarmId: true
});
flockRecordSchema.path('batchId').required(true);
flockRecordSchema.plugin(excludeSoftDeletedPlugin);

flockRecordSchema.index({ batchId: 1, recordDate: -1 });
flockRecordSchema.index({ businessId: 1, farmId: 1, recordDate: -1 });
flockRecordSchema.index({ legacySourceId: 1 }, { unique: true, sparse: true });
flockRecordSchema.index(
  { batchId: 1, recordDate: 1 },
  {
    name: 'unique_primary_record_per_batch_day',
    unique: true,
    partialFilterExpression: {
      deletedAt: null,
      correctsRecordId: { $exists: false }
    }
  }
);

module.exports =
  mongoose.models.FlockRecord ||
  mongoose.model('FlockRecord', flockRecordSchema, 'daily_flock_records');
