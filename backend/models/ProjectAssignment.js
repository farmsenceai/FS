/* backend/models/ProjectAssignment.js */
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    farmName: { type: String, required: true, trim: true },
    batch: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager', required: true },
    startDate: { type: Date, required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['On Track', 'At Risk', 'Delayed', 'Completed'],
      default: 'On Track',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProjectAssignment', assignmentSchema);