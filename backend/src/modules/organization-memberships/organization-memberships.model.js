const mongoose = require('mongoose');
const tenantEnvelopePlugin = require('../../shared/db/tenantEnvelope.plugin');
const excludeSoftDeletedPlugin = require('../../shared/db/softDelete.plugin');

const { Schema } = mongoose;

const organizationMembershipSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: {
    type: String,
    enum: ['owner', 'admin', 'manager', 'member'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'invited', 'suspended'],
    default: 'active'
  },
  invitedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  joinedAt: Date
});

organizationMembershipSchema.plugin(tenantEnvelopePlugin, {
  requireBusinessId: true,
  requireFarmId: false
});
organizationMembershipSchema.plugin(excludeSoftDeletedPlugin);

organizationMembershipSchema.index(
  { businessId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      deletedAt: null,
      status: { $in: ['active', 'invited'] }
    }
  }
);
organizationMembershipSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('OrganizationMembership', organizationMembershipSchema);
