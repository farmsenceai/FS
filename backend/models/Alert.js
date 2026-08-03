const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    iconBg: { type: String, default: '#fee2e2' },
    icon: { type: String, default: '\u{1F534}' }, // emoji, e.g. red/yellow/blue dot
    title: { type: String, required: true, trim: true },
    desc: { type: String, default: '', trim: true },
    time: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
