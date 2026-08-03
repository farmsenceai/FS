const mongoose = require('mongoose');

const vaccinationScheduleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  batchId: { type: String, required: true, trim: true, uppercase: true, index: true },
  farm: { type: String, required: true, trim: true },
  scheduledDate: { type: Date, required: true, index: true },
  status: { type: String, enum: ['Upcoming', 'Completed', 'Overdue', 'Cancelled'], default: 'Upcoming', index: true },
  completedAt: { type: Date, default: null },
  administeredBy: { type: String, default: '', trim: true },
  notes: { type: String, default: '', trim: true }
}, { timestamps: true });

module.exports = mongoose.model('VaccinationSchedule', vaccinationScheduleSchema);
