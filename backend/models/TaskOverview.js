/* backend/models/TaskOverview.js */
/* Singleton document holding the Task & Activity Overview donut numbers.
   Not derived from other collections yet (no per-task model exists in the
   app), so it is stored directly and can be edited/seeded as needed. */
const mongoose = require('mongoose');

const taskOverviewSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'singleton', unique: true },
    completed: { type: Number, default: 0 },
    inProgress: { type: Number, default: 0 },
    delayed: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    notStarted: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TaskOverview', taskOverviewSchema);