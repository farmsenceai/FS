require('dotenv').config();
const mongoose = require('mongoose');
const FeedWaterSnapshot = require('../models/FeedWaterSnapshot');
const FeedWaterBatch = require('../models/FeedWaterBatch');
const FeedInventoryItem = require('../models/FeedInventoryItem');
const WaterSystemStatus = require('../models/WaterSystemStatus');
const FeedWaterAlert = require('../models/FeedWaterAlert');
const FeedWaterLog = require('../models/FeedWaterLog');

const at = (value) => new Date(value);

const snapshot = {
  key: 'current', feedConsumedTodayKg: 4250, feedConsumedYesterdayKg: 4118,
  waterConsumedTodayLitres: 11250, waterConsumedYesterdayLitres: 10944,
  averageFcr: 1.62, previousAverageFcr: 1.66, averageFeedEfficiencyPct: 61.7,
  previousFeedEfficiencyPct: 59.6, batchesMonitored: 8, totalFeedOfferedKg: 4750,
  feedWastageKg: 500, averageFeedPerBirdKg: 0.078, totalWaterSuppliedLitres: 11800,
  waterWastageLitres: 550, averageWaterPerBirdLitres: 0.207, waterTdsPpm: 320,
  inventorySufficientDays: 5.8, lowStockAlertKg: 2000,
  updatedFor: at('2024-05-22T10:30:00+05:30'),
  trend: [
    { label: '16 May', feedKg: 3400, waterLitres: 9000 },
    { label: '17 May', feedKg: 3650, waterLitres: 9600 },
    { label: '18 May', feedKg: 3820, waterLitres: 10100 },
    { label: '19 May', feedKg: 4010, waterLitres: 10450 },
    { label: '20 May', feedKg: 4120, waterLitres: 10800 },
    { label: '22 May', feedKg: 4250, waterLitres: 11250 }
  ],
  wastageBreakdown: [
    { label: 'Spillage', amountKg: 200, color: '#10b981' },
    { label: 'Feeder Residue', amountKg: 150, color: '#f97316' },
    { label: 'Moisture Damage', amountKg: 80, color: '#fbbf24' },
    { label: 'Rodent / Insects', amountKg: 50, color: '#ef4444' },
    { label: 'Others', amountKg: 20, color: '#d1d5db' }
  ]
};

const batchRows = [
  ['GVF-B104', 'Green Valley Farm', 20000, 32, 1680, 1.58, 4320, 'Good'],
  ['SRF-B102', 'Sunrise Farm', 25000, 26, 2050, 1.60, 5300, 'Good'],
  ['KRF-B098', 'Krishna Farm', 18000, 42, 1520, 1.70, 3780, 'Average'],
  ['ANF-B097', 'Amorapura Farm', 22000, 36, 1720, 1.55, 4600, 'Good'],
  ['SAF-B096', 'Sai Poultry Farm', 22000, 29, 1430, 1.48, 3300, 'Excellent'],
  ['GVF-B103', 'Green Valley Farm', 19500, 28, 1580, 1.59, 4100, 'Good'],
  ['SRF-B101', 'Sunrise Farm', 24000, 34, 1930, 1.64, 5000, 'Good'],
  ['KRF-B095', 'Krishna Farm', 17500, 39, 1490, 1.72, 3650, 'Average'],
  ['ANF-B094', 'Amorapura Farm', 21000, 25, 1610, 1.57, 4250, 'Good'],
  ['SAF-B093', 'Sai Poultry Farm', 21500, 31, 1510, 1.51, 3500, 'Excellent'],
  ['GVF-B092', 'Green Valley Farm', 18800, 44, 1640, 1.78, 3950, 'Warning'],
  ['SRF-B090', 'Sunrise Farm', 23000, 22, 1760, 1.56, 4700, 'Good']
].map(([batchId, farm, birds, ageDays, feedConsumedKg, fcr, waterConsumedLitres, status], index) => ({
  batchId, farm, birds, ageDays, feedConsumedKg,
  averageFeedPerBirdKg: Number((feedConsumedKg / birds).toFixed(3)), fcr, waterConsumedLitres,
  averageWaterPerBirdLitres: Number((waterConsumedLitres / birds).toFixed(3)), status,
  measuredAt: at(`2024-05-${String(22 - Math.floor(index / 5)).padStart(2, '0')}T${String(10 - (index % 5)).padStart(2, '0')}:30:00+05:30`),
  source: 'seed'
}));

const inventory = [
  ['Starter Crumbs', 3200, 4.1, 2500], ['Grower Mash', 4750, 5.8, 3000],
  ['Finisher Pellets', 3500, 6.2, 2500], ['Pre-starter Crumbs', 1000, 2.9, 2000]
].map(([feedType, stockKg, sufficientDays, lowStockThresholdKg]) => ({ feedType, stockKg, sufficientDays, lowStockThresholdKg, updatedFor: snapshot.updatedFor, source: 'seed' }));

const systems = [
  ['main-line', 'Main Water Line Pressure', '2.4 bar', 'Normal', 'W', 1],
  ['nipple-drinkers', 'Nipple Drinkers (Avg. Flow Rate)', '80 ml/min', 'Normal', 'N', 2],
  ['water-tds', 'Water Quality (TDS)', '320 ppm', 'Good', 'T', 3],
  ['tank-level', 'Water Tank Level', '75%', 'Normal', '%', 4],
  ['backup', 'Backup System', '', 'Online', 'B', 5]
].map(([key, label, value, status, icon, sortOrder]) => ({ key, label, value, status, icon, sortOrder, updatedFor: snapshot.updatedFor }));

const alerts = [
  { title: 'Good stock of Starter Crumbs is low.', severity: 'warning', occurredAt: at('2024-05-22T09:15:00+05:30'), read: false },
  { title: 'High feed wastage detected in Batch KRF-B098.', batchId: 'KRF-B098', severity: 'high', occurredAt: at('2024-05-22T08:40:00+05:30'), read: false },
  { title: 'Water tank level is below 20%. Sunrise Farm.', severity: 'warning', occurredAt: at('2024-05-22T07:30:00+05:30'), read: false },
  { title: 'Water quality check completed. All parameters are normal.', severity: 'normal', occurredAt: at('2024-05-22T06:20:00+05:30'), read: true }
];

const today = new Intl.DateTimeFormat('en-CA', { timeZone: process.env.APP_TIMEZONE || 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const farmerLogs = [
  ['seed-farmer', 'Sample Farmer', 'Sample Farm', 'Shed 1', 'Batch #112', 10000, 21, 820, 1850, 1.68, '06:15'],
  ['seed-farmer', 'Sample Farmer', 'Sample Farm', 'Shed 2', 'Batch #113', 8000, 24, 640, 1500, 1.70, '06:30'],
  ['seed-farmer', 'Sample Farmer', 'Sample Farm', 'Shed 3', 'Batch #114', 6000, 18, 380, 900, 1.65, '06:45'],
  ['seed-farmer', 'Sample Farmer', 'Sample Farm', 'Shed 1', 'Batch #112', 10000, 21, 300, 600, 1.68, '17:00'],
  ['other-seed-1', 'Farmer One', 'Partner Farm 1', 'Shed A', 'PF1-201', 6000, 20, 421, 1280, 1.60, '07:00'],
  ['other-seed-2', 'Farmer Two', 'Partner Farm 2', 'Shed A', 'PF2-202', 6000, 22, 421, 1280, 1.62, '07:10'],
  ['other-seed-3', 'Farmer Three', 'Partner Farm 3', 'Shed A', 'PF3-203', 6000, 19, 421, 1280, 1.66, '07:20'],
  ['other-seed-4', 'Farmer Four', 'Partner Farm 4', 'Shed A', 'PF4-204', 6000, 23, 421, 1280, 1.71, '07:30'],
  ['other-seed-5', 'Farmer Five', 'Partner Farm 5', 'Shed A', 'PF5-205', 6000, 25, 426, 1280, 1.75, '07:40']
].map(([submittedByUserId, submittedByName, farm, shed, batchId, birds, ageDays, feedConsumedKg, waterConsumedLitres, fcr, time]) => ({
  submittedByUserId, submittedByName, farm, shed, batchId, birds, ageDays, feedConsumedKg, waterConsumedLitres, fcr,
  logDate: today, loggedAt: at(`${today}T${time}:00+05:30`)
}));

const aggregateGroups = new Map();
farmerLogs.forEach((log) => {
  const key = `${log.submittedByUserId}|${log.farm}|${log.batchId}|${log.logDate}`;
  const group = aggregateGroups.get(key) || { ...log, feedConsumedKg: 0, waterConsumedLitres: 0, fcrTotal: 0, entries: 0, aggregateKey: key, sheds: new Set() };
  group.feedConsumedKg += log.feedConsumedKg;
  group.waterConsumedLitres += log.waterConsumedLitres;
  group.fcrTotal += log.fcr;
  group.entries += 1;
  group.sheds.add(log.shed);
  if (log.loggedAt > group.loggedAt) group.loggedAt = log.loggedAt;
  aggregateGroups.set(key, group);
});
const farmerBatches = [...aggregateGroups.values()].map((group) => {
  const fcr = Number((group.fcrTotal / group.entries).toFixed(2));
  return {
    batchId: group.batchId, farm: group.farm, birds: group.birds, ageDays: group.ageDays,
    feedConsumedKg: group.feedConsumedKg, averageFeedPerBirdKg: Number((group.feedConsumedKg / group.birds).toFixed(3)),
    fcr, waterConsumedLitres: group.waterConsumedLitres, averageWaterPerBirdLitres: Number((group.waterConsumedLitres / group.birds).toFixed(3)),
    status: fcr <= 1.6 ? 'Excellent' : fcr <= 1.75 ? 'Good' : fcr <= 1.9 ? 'Average' : 'Warning',
    measuredAt: group.loggedAt, notes: `Aggregated from ${group.entries} farmer log entr${group.entries === 1 ? 'y' : 'ies'}.`,
    source: 'farmer', aggregateKey: group.aggregateKey, submittedByUserId: group.submittedByUserId,
    submittedByName: group.submittedByName, shed: [...group.sheds].join(', '), logDate: group.logDate
  };
});

async function seed() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured');
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([
    FeedWaterSnapshot.deleteMany({}), FeedWaterBatch.deleteMany({}), FeedInventoryItem.deleteMany({}),
    WaterSystemStatus.deleteMany({}), FeedWaterAlert.deleteMany({}), FeedWaterLog.deleteMany({})
  ]);
  await Promise.all([
    FeedWaterSnapshot.create(snapshot), FeedWaterBatch.insertMany([...batchRows, ...farmerBatches]), FeedInventoryItem.insertMany(inventory),
    WaterSystemStatus.insertMany(systems), FeedWaterAlert.insertMany(alerts), FeedWaterLog.insertMany(farmerLogs)
  ]);
  console.log(`Seeded Feed & Water: 1 snapshot, ${batchRows.length} business batches, ${farmerBatches.length} farmer aggregates, ${farmerLogs.length} farmer logs, 4 inventory items, 5 water systems, 4 alerts.`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
