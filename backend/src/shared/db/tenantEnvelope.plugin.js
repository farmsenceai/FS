const mongoose = require('mongoose');

/**
 * Adds the canonical tenant ownership, provenance, versioning, and deletion
 * envelope to a Mongoose schema.
 *
 * Options:
 *   requireBusinessId: false  Allow platform-level documents without a tenant.
 *   requireFarmId: true       Require farmId for farm-scoped collections.
 */
function tenantEnvelopePlugin(schema, options = {}) {
  const businessIdRequired = options.requireBusinessId !== false;
  const farmIdRequired = options.requireFarmId === true;

  schema.add({
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required() {
        return businessIdRequired;
      }
    },
    farmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      required() {
        return farmIdRequired;
      }
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BirdBatch',
      required: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdByDeviceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },
    source: {
      type: String,
      enum: ['manual', 'sensor', 'camera', 'import', 'integration', 'system', 'ai'],
      default: 'manual'
    },
    schemaVersion: {
      type: Number,
      default: 1
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  });

  schema.set('timestamps', true);

  schema.statics.findActive = function findActive(filter = {}, projection = null, queryOptions = {}) {
    return this.find({ ...filter, deletedAt: null }, projection, queryOptions);
  };

  schema.methods.softDelete = async function softDelete(userId) {
    this.deletedAt = new Date();
    this.deletedBy = userId;
    return this.save();
  };

  if (businessIdRequired) {
    schema.index({ businessId: 1, deletedAt: 1 });
  }
}

module.exports = tenantEnvelopePlugin;
