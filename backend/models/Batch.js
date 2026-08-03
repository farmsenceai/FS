const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    batchId: { type: String, required: true, unique: true, trim: true },
    farm: { type: String, required: true, trim: true },
    shed: { type: String, default: '', trim: true },
    breed: { type: String, required: true, trim: true },
    doa: { type: Date, required: true }, // Date of Arrival — age is derived from this, not stored
    birds: { type: Number, required: true, min: 0 },
    mortality: { type: Number, default: 0, min: 0 }, // percentage, e.g. 2.10
    fcr: { type: Number, default: 0, min: 0 },
    status: { type: String, default: 'New', trim: true }, // 'Excellent' | 'Good' | 'Average' | 'New'
    lifecycleStatus: { type: String, enum: ['Active', 'Completed'], default: 'Active' },
    source: { type: String, enum: ['seed', 'business', 'farmer'], default: 'business' },
    submittedByUserId: { type: String, default: '', trim: true, index: true },
    submittedByName: { type: String, default: '', trim: true },
    notes: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

// Plain synchronous hook (no `next` callback arg) — safe with both save() and insertMany(),
// avoids the "next is not a function" TypeError some Mongoose/kareem versions throw
// when a callback-style pre('validate') hook is used with insertMany.
batchSchema.pre('validate', function () {
  if (this.batchId) this.batchId = this.batchId.trim().toUpperCase();
});

module.exports = mongoose.model('Batch', batchSchema);
