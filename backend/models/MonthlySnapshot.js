const mongoose = require('mongoose');

// Singleton document. Metrics that CAN be derived from live Batch data
// (avg. mortality, avg. FCR) are computed on the fly in the route handler —
// this doc only stores last month's baseline for those two, so a "vs last
// month" trend can be shown.
//
// Weight, ADG, feed consumed and water consumed aren't tracked anywhere on
// the Batch model, so — same simplification as TaskOverview in the Project
// Manager backend — they're stored directly here as a small editable
// singleton rather than computed. Extend with a dedicated collection later
// if per-batch tracking is needed.
const monthlySnapshotSchema = new mongoose.Schema(
  {
    prevMonthAvgMortality: { type: Number, default: 0 }, // e.g. 2.23
    prevMonthAvgFcr: { type: Number, default: 0 }, // e.g. 1.66

    weightAvgKg: { type: Number, default: 0 },
    weightTrendText: { type: String, default: '' },

    adgAvgG: { type: Number, default: 0 },
    adgTrendText: { type: String, default: '' },

    feedConsumedKg: { type: Number, default: 0 },
    feedTrendText: { type: String, default: '' },

    waterConsumedL: { type: Number, default: 0 },
    waterTrendText: { type: String, default: '' },

    // 7-day FCR trend line for the chart
    fcrTrend7d: [
      {
        label: { type: String, required: true }, // e.g. "16 May"
        value: { type: Number, required: true }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('MonthlySnapshot', monthlySnapshotSchema);
