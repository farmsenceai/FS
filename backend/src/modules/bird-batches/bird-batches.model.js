const mongoose = require('mongoose');
const tenantEnvelopePlugin = require('../../shared/db/tenantEnvelope.plugin');
const excludeSoftDeletedPlugin = require('../../shared/db/softDelete.plugin');

const { Schema } = mongoose;

const birdBatchSchema = new Schema({
  // One-time migration traceability back to the read-only legacy Batch document.
  legacySourceId: Schema.Types.ObjectId,
  code: { type: String, required: true, trim: true },
  facilityId: { type: Schema.Types.ObjectId, ref: 'Facility', required: true },
  breed: { type: String, required: true, trim: true },
  birdType: {
    type: String,
    enum: ['broiler', 'layer', 'breeder'],
    required: true
  },
  initialBirdCount: { type: Number, required: true, min: 0 },
  // NON-authoritative cache: recalculated from daily_flock_records mortality and culls.
  // Never accept this field directly from user input.
  currentBirdCountCached: { type: Number, min: 0 },
  placedAt: { type: Date, required: true },
  expectedHarvestAt: Date,
  actualHarvestAt: Date,
  status: {
    type: String,
    enum: ['planned', 'active', 'completed', 'terminated'],
    default: 'planned'
  },
  sourceHatchery: { type: String, trim: true },
  notes: { type: String, trim: true },
  version: { type: Number, default: 1 }
});

birdBatchSchema.plugin(tenantEnvelopePlugin, {
  requireBusinessId: true,
  requireFarmId: true
});
birdBatchSchema.plugin(excludeSoftDeletedPlugin);

birdBatchSchema.index(
  { farmId: 1, code: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
birdBatchSchema.index({ legacySourceId: 1 }, { unique: true, sparse: true });
birdBatchSchema.index({ businessId: 1, farmId: 1, status: 1 });
birdBatchSchema.index({ facilityId: 1, status: 1 });

birdBatchSchema.pre('save', function incrementAuditVersion() {
  if (!this.isNew && this.isModified()) {
    this.version = (this.version || 1) + 1;
  }
});

module.exports =
  mongoose.models.BirdBatch || mongoose.model('BirdBatch', birdBatchSchema, 'bird_batches');
