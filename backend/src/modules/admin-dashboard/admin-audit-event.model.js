const mongoose = require('mongoose');

const adminAuditEventSchema = new mongoose.Schema({
  action: { type: String, required: true, index: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorName: { type: String, trim: true },
  actorEmail: { type: String, trim: true },
  targetType: { type: String, required: true },
  targetId: { type: String, required: true },
  targetLabel: { type: String, trim: true },
  ipAddress: { type: String, trim: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: () => ({}) }
}, { timestamps: true, collection: 'admin_audit_events' });

adminAuditEventSchema.index({ createdAt: -1 });
module.exports = mongoose.models.AdminAuditEvent
  || mongoose.model('AdminAuditEvent', adminAuditEventSchema);
