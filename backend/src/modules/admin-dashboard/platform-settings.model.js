const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true },
  requireBusinessApproval: { type: Boolean, default: true },
  requireFarmerApproval: { type: Boolean, default: false },
  autoSuspendPaymentFailures: { type: Boolean, default: true },
  monthlyPayoutCycle: { type: Boolean, default: true },
  holdPayoutsForBatchReview: { type: Boolean, default: false },
  emailAdminsOnSignup: { type: Boolean, default: true },
  emailAdminsOnHealthEvents: { type: Boolean, default: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, collection: 'platform_settings' });

module.exports = mongoose.models.PlatformSettings
  || mongoose.model('PlatformSettings', platformSettingsSchema);
