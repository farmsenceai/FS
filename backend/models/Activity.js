/* backend/models/Activity.js */
const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    by: { type: String, required: true, trim: true }, // display name, e.g. "By Navin Kumar"
    type: {
      type: String,
      enum: ['completed', 'delivery', 'photo', 'installation', 'system'],
      default: 'system',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);