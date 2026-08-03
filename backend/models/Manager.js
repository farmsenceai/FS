/* backend/models/Manager.js */
const mongoose = require('mongoose');

function deriveInitials(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

const managerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    phone: { type: String, required: true, trim: true },
    role: { type: String, default: '', trim: true }, // e.g. 'Team Lead' or ''
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
      index: true
    },
    initials: { type: String, trim: true },
    teamSize: { type: Number, default: 0, min: 0 },
    projectsCount: { type: Number, default: 0, min: 0 },
    performancePct: { type: Number, default: 0, min: 0, max: 100 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

managerSchema.index({ status: 1, createdAt: -1 });
managerSchema.index({ businessId: 1, status: 1 });

// Synchronous hook (no `next` callback) — avoids a kareem/insertMany
// incompatibility where the callback-style signature isn't invoked correctly.
managerSchema.pre('validate', function () {
  if (this.name) this.initials = deriveInitials(this.name);
});

module.exports = mongoose.model('Manager', managerSchema);
