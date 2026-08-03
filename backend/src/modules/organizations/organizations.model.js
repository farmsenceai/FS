const mongoose = require('mongoose');
const excludeSoftDeletedPlugin = require('../../shared/db/softDelete.plugin');

const { Schema } = mongoose;

const legalSchema = new Schema(
  {
    registrationNumber: { type: String, trim: true },
    taxId: { type: String, trim: true },
    countryCode: { type: String, required: true, uppercase: true, trim: true }
  },
  { _id: false }
);

const contactsSchema = new Schema(
  {
    billingEmail: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    address: Schema.Types.Mixed
  },
  { _id: false }
);

const brandingSchema = new Schema(
  {
    logoAssetId: Schema.Types.ObjectId,
    primaryColor: { type: String, trim: true }
  },
  { _id: false }
);

const organizationSchema = new Schema(
  {
    legalName: { type: String, required: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'closed'],
      default: 'pending'
    },
    legal: { type: legalSchema, required: true },
    contacts: { type: contactsSchema, required: true },
    branding: { type: brandingSchema, default: () => ({}) },
    defaultCurrency: { type: String, default: 'INR', uppercase: true, trim: true },
    timezone: { type: String, default: 'Asia/Kolkata', trim: true },
    approvedAt: Date,
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    version: { type: Number, default: 1 },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true, collection: 'organizations' }
);

organizationSchema.plugin(excludeSoftDeletedPlugin);

organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index(
  { 'legal.taxId': 1 },
  { unique: true, partialFilterExpression: { 'legal.taxId': { $type: 'string' } } }
);
organizationSchema.index(
  { 'legal.registrationNumber': 1 },
  {
    unique: true,
    partialFilterExpression: { 'legal.registrationNumber': { $type: 'string' } }
  }
);
organizationSchema.index({ status: 1, createdAt: -1 });

organizationSchema.pre('save', function incrementAuditVersion() {
  if (!this.isNew && this.isModified()) {
    this.version = (this.version || 1) + 1;
  }
});

organizationSchema.methods.softDelete = function softDelete(userId) {
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

module.exports =
  mongoose.models.Organization || mongoose.model('Organization', organizationSchema);
