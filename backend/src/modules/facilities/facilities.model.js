const mongoose = require('mongoose');
const tenantEnvelopePlugin = require('../../shared/db/tenantEnvelope.plugin');
const excludeSoftDeletedPlugin = require('../../shared/db/softDelete.plugin');

const { Schema } = mongoose;

const dimensionsSchema = new Schema(
  {
    lengthM: Number,
    widthM: Number,
    heightM: Number
  },
  { _id: false }
);

const geoSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number]
  },
  { _id: false }
);

const environmentTargetsSchema = new Schema(
  {
    temperatureMin: Number,
    temperatureMax: Number,
    humidityMin: Number,
    humidityMax: Number,
    ammoniaMax: Number,
    co2Max: Number
  },
  { _id: false }
);

const facilitySchema = new Schema({
  code: { type: String, required: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: [
      'shed',
      'house',
      'feed_store',
      'medicine_store',
      'water_system',
      'utility',
      'office',
      'other'
    ],
    required: true
  },
  parentFacilityId: { type: Schema.Types.ObjectId, ref: 'Facility' },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active'
  },
  capacity: Number,
  dimensions: { type: dimensionsSchema, default: () => ({}) },
  geo: { type: geoSchema, default: () => ({ type: 'Point', coordinates: [] }) },
  environmentTargets: { type: environmentTargetsSchema, default: () => ({}) },
  metadata: { type: Schema.Types.Mixed, default: () => ({}) }
});

facilitySchema.plugin(tenantEnvelopePlugin, {
  requireBusinessId: true,
  requireFarmId: true
});
facilitySchema.plugin(excludeSoftDeletedPlugin);

facilitySchema.index(
  { farmId: 1, code: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
facilitySchema.index({ businessId: 1, farmId: 1, type: 1, status: 1 });
facilitySchema.index({ parentFacilityId: 1 });

facilitySchema.pre('validate', async function validateParentFarm() {
  if (!this.parentFacilityId) return;

  const query = this.constructor.findOne({
    _id: this.parentFacilityId,
    businessId: this.businessId,
    farmId: this.farmId
  });
  const session = this.$session();
  if (session) query.session(session);
  const parent = await query.exec();

  if (!parent) {
    this.invalidate(
      'parentFacilityId',
      'Parent facility must exist and belong to the same organization and farm'
    );
  }
});

module.exports = mongoose.models.Facility || mongoose.model('Facility', facilitySchema);
