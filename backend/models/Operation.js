const mongoose = require('mongoose');

const operationSchema = new mongoose.Schema(
  {
    iconBg: { type: String, default: '#dcfce7' },
    title: { type: String, required: true, trim: true },
    sub: { type: String, default: '', trim: true },
    time: { type: String, required: true, trim: true }, // display string, e.g. "06:00 AM"
    status: { type: String, default: 'Scheduled' }, // 'Completed' | 'In Progress' | 'Scheduled'
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Operation', operationSchema);
