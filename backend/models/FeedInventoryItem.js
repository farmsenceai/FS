const mongoose = require('mongoose');

const feedInventoryItemSchema = new mongoose.Schema({
  feedType: { type: String, required: true, trim: true, unique: true },
  stockKg: { type: Number, required: true, min: 0 },
  sufficientDays: { type: Number, required: true, min: 0 },
  lowStockThresholdKg: { type: Number, required: true, min: 0 },
  updatedFor: { type: Date, required: true },
  source: { type: String, enum: ['seed', 'business', 'farmer'], default: 'business', index: true },
  submittedByUserId: { type: String, default: '', trim: true, index: true },
  submittedByName: { type: String, default: '', trim: true },
  farm: { type: String, default: '', trim: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('FeedInventoryItem', feedInventoryItemSchema);
