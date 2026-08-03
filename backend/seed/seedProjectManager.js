/* backend/seed/seedProjectManager.js
   Seeds MongoDB Atlas with sample data matching the ProjectManager.js view.

   Run with:  node seed/seedProjectManager.js
   (run from inside the backend/ folder, so it picks up your existing .env / db config)
*/
require('dotenv').config();
const mongoose = require('mongoose');

const Manager = require('../models/Manager');
const ProjectAssignment = require('../models/ProjectAssignment');
const SiteVisit = require('../models/SiteVisit');
const Activity = require('../models/Activity');
const TaskOverview = require('../models/TaskOverview');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function seed() {
  if (!MONGO_URI) {
    console.error('No MONGO_URI / MONGODB_URI found in environment. Check your .env file.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('MongoDB Connected for seeding:', mongoose.connection.host);

  // Clear existing data for a clean reseed
  await Promise.all([
    Manager.deleteMany({}),
    ProjectAssignment.deleteMany({}),
    SiteVisit.deleteMany({}),
    Activity.deleteMany({}),
    TaskOverview.deleteMany({}),
  ]);

  const managers = await Manager.insertMany([
    { name: 'Navin Kumar', email: 'navin.kumar@farmsence.ai', phone: '+91 98765 43210', role: 'Team Lead', teamSize: 14, projectsCount: 6, performancePct: 85, rating: 4.8 },
    { name: 'Rakesh Yadav', email: 'rakesh.yadav@farmsence.ai', phone: '+91 91234 56789', role: '', teamSize: 12, projectsCount: 4, performancePct: 78, rating: 4.6 },
    { name: 'Sandeep Reddy', email: 'sandeep.reddy@farmsence.ai', phone: '+91 99887 66554', role: '', teamSize: 16, projectsCount: 3, performancePct: 65, rating: 4.5 },
    { name: 'Imran Khan', email: 'imran.khan@farmsence.ai', phone: '+91 88991 23456', role: '', teamSize: 14, projectsCount: 2, performancePct: 60, rating: 4.3 },
  ]);

  const byName = Object.fromEntries(managers.map((m) => [m.name, m]));

  await ProjectAssignment.insertMany([
    { farmName: 'Green Valley Farm', batch: 'Batch #104', location: 'Rajahmundry, AP', manager: byName['Navin Kumar']._id, startDate: new Date('2024-04-12'), progress: 72, status: 'On Track' },
    { farmName: 'Sunrise Farm', batch: 'Batch #105', location: 'Kakinada, AP', manager: byName['Rakesh Yadav']._id, startDate: new Date('2024-04-18'), progress: 58, status: 'On Track' },
    { farmName: 'Krishna Farms', batch: 'Batch #106', location: 'Nellore, AP', manager: byName['Sandeep Reddy']._id, startDate: new Date('2024-04-22'), progress: 45, status: 'At Risk' },
    { farmName: 'Annapurna Farm', batch: 'Batch #107', location: 'Tirupati, AP', manager: byName['Imran Khan']._id, startDate: new Date('2024-04-25'), progress: 30, status: 'Delayed' },
    { farmName: 'Sai Poultry Farm', batch: 'Batch #108', location: 'Vizag, AP', manager: byName['Navin Kumar']._id, startDate: new Date('2024-04-28'), progress: 65, status: 'On Track' },
  ]);

  const thisYear = new Date().getFullYear();
  await SiteVisit.insertMany([
    { farmName: 'Green Valley Farm', task: 'Electrical Inspection', visitDate: new Date(`${thisYear}-05-24`), time: '10:30 AM', manager: byName['Navin Kumar']._id, location: 'Rajahmundry, AP' },
    { farmName: 'Sunrise Farm', task: 'Roofing Work Inspection', visitDate: new Date(`${thisYear}-05-25`), time: '11:00 AM', manager: byName['Rakesh Yadav']._id, location: 'Kakinada, AP' },
    { farmName: 'Krishna Farms', task: 'Equipment Installation Check', visitDate: new Date(`${thisYear}-05-26`), time: '02:00 PM', manager: byName['Sandeep Reddy']._id, location: 'Nellore, AP' },
    { farmName: 'Annapurna Farm', task: 'Pillar Casting Inspection', visitDate: new Date(`${thisYear}-05-27`), time: '10:00 AM', manager: byName['Imran Khan']._id, location: 'Tirupati, AP' },
  ]);

  await Activity.insertMany([
    { title: 'Foundation completed at Green Valley Farm', by: 'By Navin Kumar', type: 'completed' },
    { title: 'Material delivery recorded at Sunrise Farm', by: 'By Rakesh Yadav', type: 'delivery' },
    { title: 'Site photos updated at Krishna Farms', by: 'By Sandeep Reddy', type: 'photo' },
    { title: 'Electrical conduit installation started at Annapurna Farm', by: 'By Imran Khan', type: 'installation' },
  ]);

  await TaskOverview.create({
    key: 'singleton',
    completed: 72,
    inProgress: 32,
    delayed: 14,
    pending: 10,
    notStarted: 0,
  });

  console.log('Seed complete:');
  console.log(`  Managers: ${managers.length}`);
  console.log('  Assignments: 5');
  console.log('  Site visits: 4');
  console.log('  Activities: 4');
  console.log('  Task overview: 1');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});