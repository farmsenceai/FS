/* backend/models/SiteVisit.js */
const mongoose = require('mongoose');

const siteVisitSchema = new mongoose.Schema(
  {
    farmName: { type: String, required: true, trim: true },
    task: { type: String, required: true, trim: true },
    visitDate: { type: Date, required: true },
    time: { type: String, required: true, trim: true }, // display string e.g. "10:30 AM"
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager', required: true },
    location: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteVisit', siteVisitSchema);