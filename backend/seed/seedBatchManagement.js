/**
 * Seeds the Batch Management collections with the sample data that used to
 * be hardcoded in BatchManagement.js.
 *
 * Run from inside backend/:
 *   node seed/seedBatchManagement.js
 *
 * Re-run any time to reset back to sample data (wipes and re-inserts the
 * 6 collections this script owns — it does not touch any other collections
 * in your database, e.g. managers/projectassignments from the Project
 * Manager feature).
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Batch = require('../models/Batch');
const Operation = require('../models/Operation');
const Alert = require('../models/Alert');
const InventoryItem = require('../models/InventoryItem');
const FarmSummary = require('../models/FarmSummary');
const MonthlySnapshot = require('../models/MonthlySnapshot');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('❌ No MONGO_URI or MONGODB_URI found in your .env file.');
  process.exit(1);
}

// Sample batches carry an "age in days" (matching the original hardcoded
// UI) rather than a fixed calendar date — the DOA is back-calculated from
// today so that age keeps advancing correctly on every future run/day,
// instead of freezing to a stale placeholder date.
function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

const batches = [
  { batchId: 'GVF-B104', farm: 'Green Valley Farm', breed: 'Cobb 430', doa: daysAgo(32), birds: 20000, mortality: 2.10, fcr: 1.58, status: 'Good', source: 'seed' },
  { batchId: 'GVF-B103', farm: 'Green Valley Farm', breed: 'Cobb 430', doa: daysAgo(39), birds: 20000, mortality: 2.45, fcr: 1.65, status: 'Good' },
  { batchId: 'SRF-B102', farm: 'Sunrise Farm', breed: 'Ross 308', doa: daysAgo(26), birds: 25000, mortality: 1.80, fcr: 1.48, status: 'Excellent' },
  { batchId: 'SRF-B101', farm: 'Sunrise Farm', breed: 'Ross 308', doa: daysAgo(34), birds: 25000, mortality: 2.30, fcr: 1.60, status: 'Good' },
  { batchId: 'KRF-B098', farm: 'Krishna Farm', breed: 'Cobb 430', doa: daysAgo(42), birds: 18000, mortality: 2.90, fcr: 1.72, status: 'Average' },
  { batchId: 'ANF-B097', farm: 'Annapurna Farm', breed: 'Ross 308', doa: daysAgo(36), birds: 22000, mortality: 3.15, fcr: 1.55, status: 'Good' },
  { batchId: 'SAF-B096', farm: 'Sai Poultry Farm', breed: 'Cobb 430', doa: daysAgo(29), birds: 22000, mortality: 1.95, fcr: 1.50, status: 'Good' },
  { batchId: 'KRF-B095', farm: 'Krishna Farm', breed: 'Ross 308', doa: daysAgo(24), birds: 20000, mortality: 1.70, fcr: 1.42, status: 'Excellent' },
  { batchId: 'FARM-112', farm: 'Demo Farmer Farm', shed: 'Shed 1', breed: 'Broiler', doa: daysAgo(18), birds: 7500, mortality: 1.4, fcr: 1.62, status: 'Excellent', lifecycleStatus: 'Active', source: 'farmer', submittedByUserId: 'seed-farmer', submittedByName: 'Demo Farmer' },
  { batchId: 'FARM-113', farm: 'Demo Farmer Farm', shed: 'Shed 2', breed: 'Broiler', doa: daysAgo(11), birds: 6000, mortality: 2.6, fcr: 1.71, status: 'Good', lifecycleStatus: 'Active', source: 'farmer', submittedByUserId: 'seed-farmer', submittedByName: 'Demo Farmer' },
  { batchId: 'FARM-114', farm: 'Demo Farmer Farm', shed: 'Shed 3', breed: 'Broiler', doa: daysAgo(4), birds: 5000, mortality: 0.8, fcr: 1.55, status: 'Excellent', lifecycleStatus: 'Active', source: 'farmer', submittedByUserId: 'seed-farmer', submittedByName: 'Demo Farmer' },
  { batchId: 'FARM-109', farm: 'Demo Farmer Farm', shed: 'Shed 1', breed: 'Broiler', doa: daysAgo(48), birds: 7200, mortality: 2.1, fcr: 1.69, status: 'Good', lifecycleStatus: 'Completed', source: 'farmer', submittedByUserId: 'seed-farmer', submittedByName: 'Demo Farmer' }
];

const operations = [
  { iconBg: '#dcfce7', title: 'Feed Preparation', sub: 'Green Valley Farm - Batch GVF-B104', time: '06:00 AM', status: 'Completed', sortOrder: 1 },
  { iconBg: '#dbeafe', title: 'Water System Check', sub: 'Sunrise Farm - Batch SRF-B102', time: '07:30 AM', status: 'Completed', sortOrder: 2 },
  { iconBg: '#fef3c7', title: 'Bird Health Inspection', sub: 'Krishna Farm - Batch KRF-B098', time: '09:00 AM', status: 'In Progress', sortOrder: 3 },
  { iconBg: '#f3e8ff', title: 'Vaccination (IB)', sub: 'Annapurna Farm - Batch ANF-B097', time: '10:30 AM', status: 'Scheduled', sortOrder: 4 },
  { iconBg: '#fff7ed', title: 'Litter Turning', sub: 'Sai Poultry Farm - Batch SAF-B096', time: '02:00 PM', status: 'Scheduled', sortOrder: 5 }
];

const alerts = [
  { iconBg: '#fee2e2', icon: '\u{1F534}', title: 'High Mortality Alert', desc: 'Batch KRF-B098 mortality is above normal range.', time: '10:15 AM', sortOrder: 1 },
  { iconBg: '#fef3c7', icon: '\u{1F7E1}', title: 'FCR Alert', desc: 'Batch KRF-B098 FCR is higher than target.', time: '10:10 AM', sortOrder: 2 },
  { iconBg: '#fef3c7', icon: '\u{1F7E1}', title: 'Feed Stock Low', desc: 'Feed stock will last for 1.5 days at Sunrise Farm.', time: '09:45 AM', sortOrder: 3 },
  { iconBg: '#dbeafe', icon: '\u{1F535}', title: 'Vaccination Due', desc: 'IB vaccination is due for Batch ANF-B097 today.', time: '08:30 AM', sortOrder: 4 }
];

const inventory = [
  { label: 'Feed Stock', status: 'Sufficient for 3.2 days', barWidth: 85, barColor: '#16a34a', detail: '', sortOrder: 1 },
  { label: 'Medicine Stock', status: 'Sufficient', barWidth: 78, barColor: '#16a34a', detail: '78%', sortOrder: 2 },
  { label: 'Vaccine Stock', status: 'Sufficient', barWidth: 65, barColor: '#3b82f6', detail: '65%', sortOrder: 3 },
  { label: 'Litter Material', status: 'Sufficient for 4 days', barWidth: 90, barColor: '#16a34a', detail: '2,100 kg', sortOrder: 4 },
  { label: 'Gas Stock', status: 'Sufficient', barWidth: 60, barColor: '#f97316', detail: '2 Cylinders', sortOrder: 5 }
];

const farmSummaries = [
  { name: 'Green Valley Farm', batches: 2, birds: 40000, mortality: 2.28, fcr: 1.62, stars: 3 },
  { name: 'Sunrise Farm', batches: 2, birds: 50000, mortality: 2.05, fcr: 1.54, stars: 4 },
  { name: 'Krishna Farm', batches: 2, birds: 38000, mortality: 2.60, fcr: 1.66, stars: 2 },
  { name: 'Annapurna Farm', batches: 1, birds: 22000, mortality: 2.15, fcr: 1.55, stars: 4 },
  { name: 'Demo Farmer Farm', batches: 3, birds: 18500, mortality: 1.6, fcr: 1.63, stars: 4 }
];

// prevMonthAvgMortality / prevMonthAvgFcr are back-calculated from the
// "vs last month" deltas that used to be hardcoded next to the stat cards
// (mortality ▲0.12%, FCR ▼0.04) so the /overview trend arrows keep working
// once mortality/FCR become live averages of the batches above.
const monthlySnapshot = {
  prevMonthAvgMortality: 2.23,
  prevMonthAvgFcr: 1.66,
  weightAvgKg: 1.45,
  weightTrendText: '▲ 0.07 kg vs last month',
  adgAvgG: 54.2,
  adgTrendText: '▲ 2.5 g vs last month',
  feedConsumedKg: 87450,
  feedTrendText: '▲ 5.2% vs last month',
  waterConsumedL: 112500,
  waterTrendText: '▲ 6.1% vs last month',
  fcrTrend7d: [
    { label: '16 May', value: 1.58 },
    { label: '17 May', value: 1.60 },
    { label: '18 May', value: 1.62 },
    { label: '19 May', value: 1.56 },
    { label: '20 May', value: 1.54 },
    { label: '21 May', value: 1.59 },
    { label: '22 May', value: 1.64 }
  ]
};

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB Connected for seeding');

  await Promise.all([
    Batch.deleteMany({}),
    Operation.deleteMany({}),
    Alert.deleteMany({}),
    InventoryItem.deleteMany({}),
    FarmSummary.deleteMany({}),
    MonthlySnapshot.deleteMany({})
  ]);
  console.log('🗑️  Cleared existing batch-management collections');

  await Batch.insertMany(batches);
  await Operation.insertMany(operations);
  await Alert.insertMany(alerts);
  await InventoryItem.insertMany(inventory);
  await FarmSummary.insertMany(farmSummaries);
  await MonthlySnapshot.create(monthlySnapshot);

  console.log('🌱 Seeded:');
  console.log(`   - ${batches.length} batches`);
  console.log(`   - ${operations.length} today's operations`);
  console.log(`   - ${alerts.length} alerts`);
  console.log(`   - ${inventory.length} inventory items`);
  console.log(`   - ${farmSummaries.length} farm summaries`);
  console.log('   - 1 monthly snapshot');

  await mongoose.disconnect();
  console.log('✅ Done. Connection closed.');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
