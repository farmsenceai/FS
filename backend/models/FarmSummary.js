const mongoose = require('mongoose');

const farmSummarySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    batches: { type: Number, default: 0, min: 0 },
    birds: { type: Number, default: 0, min: 0 },
    mortality: { type: Number, default: 0, min: 0 },
    fcr: { type: Number, default: 0, min: 0 },
    stars: { type: Number, default: 0, min: 0, max: 5 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('FarmSummary', farmSummarySchema);
