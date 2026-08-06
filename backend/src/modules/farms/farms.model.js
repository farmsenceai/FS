const mongoose = require('mongoose');
const tenantEnvelopePlugin = require('../../shared/db/tenantEnvelope.plugin');
const excludeSoftDeletedPlugin = require('../../shared/db/softDelete.plugin');

const { Schema } = mongoose;

const geoSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  { _id: false }
);

const locationSchema = new Schema(
  {
    address: { type: String, required: true, trim: true },
    stateProvince: { type: String, trim: true },
    geo: { type: geoSchema },
    countryCode: { type: String, required: true, uppercase: true, trim: true },
    timezone: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const capacitySchema = new Schema(
  {
    birdCapacity: { type: Number, min: 0 },
    areaSqM: Number
  },
  { _id: false }
);

const contactSchema = new Schema(
  {
    name: { type: String, trim: true },
    role: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true }
  },
  { _id: false }
);

const farmSchema = new Schema({
  code: { type: String, required: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['planned', 'active', 'inactive', 'closed'],
    default: 'planned'
  },
  location: { type: locationSchema, required: true },
  capacity: { type: capacitySchema, default: () => ({}) },
  farmType: {
    type: String,
    enum: ['broiler', 'layer', 'breeder', 'mixed'],
    required: true
  },
  contacts: { type: [contactSchema], default: [] },
  openedAt: Date,
  expectedTenureEndDate: Date,
  closedAt: Date,
  tags: { type: [String], default: [] },
  version: { type: Number, default: 1 }
});

farmSchema.plugin(tenantEnvelopePlugin, { requireBusinessId: true, requireFarmId: false });
farmSchema.plugin(excludeSoftDeletedPlugin);

farmSchema.index(
  { businessId: 1, code: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
farmSchema.index({ 'location.geo': '2dsphere' });
farmSchema.index({ businessId: 1, status: 1 });

farmSchema.pre('save', function incrementAuditVersion() {
  if (!this.isNew && this.isModified()) {
    this.version = (this.version || 1) + 1;
  }
});

module.exports = mongoose.models.Farm || mongoose.model('Farm', farmSchema);
