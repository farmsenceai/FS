const mongoose = require('mongoose');

const performanceRecommendationSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium', index: true },
  completed: { type: Boolean, default: false, index: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('PerformanceRecommendation', performanceRecommendationSchema);
