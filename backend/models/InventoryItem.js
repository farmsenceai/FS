const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    status: { type: String, default: '', trim: true },
    barWidth: { type: Number, default: 0, min: 0, max: 100 },
    barColor: { type: String, default: '#16a34a' },
    detail: { type: String, default: '', trim: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
