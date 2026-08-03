require('dotenv').config();
const mongoose = require('mongoose');

const BirdHealthSnapshot = require('../models/BirdHealthSnapshot');
const BirdHealthCase = require('../models/BirdHealthCase');
const VaccinationSchedule = require('../models/VaccinationSchedule');
const BirdHealthAlert = require('../models/BirdHealthAlert');
const BirdHealthRecord = require('../models/BirdHealthRecord');

const at = (value) => new Date(value);

const snapshot = {
  key: 'current',
  overallHealthScore: 92,
  previousHealthScore: 87,
  vaccinationCompliance: 98,
  previousVaccinationCompliance: 96,
  totalBirds: 9600,
  healthyBirds: 8832,
  sickBirds: 636,
  sickBirdsToday: 120,
  criticalBirds: 132,
  sickBirdsYesterday: 135,
  monthlyMortalityPct: 2.35,
  previousMonthlyMortalityPct: 2.7,
  healthChecksCompleted: 8,
  healthChecksTotal: 10,
  healthChecksYesterday: 6,
  periodLabel: 'This Week',
  updatedFor: at('2024-05-22T10:30:00+05:30'),
  weeklyTrend: [
    { label: '16 May', healthy: 92, sick: 4.5, mortality: 1.5 },
    { label: '17 May', healthy: 93, sick: 4.0, mortality: 1.4 },
    { label: '18 May', healthy: 91, sick: 5.2, mortality: 1.7 },
    { label: '19 May', healthy: 90, sick: 6.1, mortality: 1.9 },
    { label: '20 May', healthy: 92, sick: 4.6, mortality: 1.6 },
    { label: '21 May', healthy: 93, sick: 4.1, mortality: 1.5 },
    { label: '22 May', healthy: 92, sick: 4.2, mortality: 1.5 }
  ],
  quickChecks: [
    { label: 'Activity Level', status: 'Normal' },
    { label: 'Feed Consumption', status: 'Normal' },
    { label: 'Water Consumption', status: 'Normal' },
    { label: 'Respiratory Rate', status: 'Normal' },
    { label: 'Droppings', status: 'Normal' },
    { label: 'Body Temperature', status: 'Normal' },
    { label: 'Flock Uniformity', status: 'Warning' },
    { label: 'Litter Condition', status: 'Normal' }
  ],
  commonIssues: [
    { label: 'Respiratory Issues', count: 48, color: '#ef4444' },
    { label: 'Digestive Issues', count: 32, color: '#f59e0b' },
    { label: 'Stress', count: 20, color: '#3b82f6' },
    { label: 'Infectious Diseases', count: 16, color: '#8b5cf6' },
    { label: 'Others', count: 12, color: '#6b7280' }
  ]
};

const cases = [
  ['GVF-B104', 'Green Valley Farm', 2000, 35, 'Sneezing, Low Activity', '2024-05-22T09:30:00+05:30', 'Mild', 'Vitamin C + Electrolytes', 'Dr. R. Kumar', 'Under Treatment'],
  ['SRF-B102', 'Sunrise Farm', 2500, 18, 'Reduced Feed Intake', '2024-05-22T07:45:00+05:30', 'Mild', 'Multivitamin + Probiotics', 'Dr. S. Reddy', 'Monitoring'],
  ['KRF-B098', 'Krishna Farm', 2000, 52, 'Coughing, Watery Eyes', '2024-05-21T18:15:00+05:30', 'Moderate', 'Antibiotic Course Started', 'Dr. R. Kumar', 'Under Treatment'],
  ['ANF-B097', 'Annapurna Farm', 2200, 25, 'Ruffled Feathers, Lethargy', '2024-05-21T11:20:00+05:30', 'Mild', 'Vitamin + Mineral Mix', 'Dr. P. Sharma', 'Under Treatment'],
  ['SAF-B096', 'Sai Poultry Farm', 2400, 6, 'Minor Diarrhea', '2024-05-20T09:10:00+05:30', 'Mild', 'Probiotic + ORS', 'Dr. S. Reddy', 'Recovered'],
  ['GVF-B103', 'Green Valley Farm', 1800, 14, 'Nasal Discharge', '2024-05-19T15:40:00+05:30', 'Moderate', 'Isolation + Respiratory Support', 'Dr. R. Kumar', 'Under Treatment'],
  ['SRF-B101', 'Sunrise Farm', 2100, 9, 'Leg Weakness', '2024-05-19T10:15:00+05:30', 'Mild', 'Calcium + Vitamin D3', 'Dr. P. Sharma', 'Monitoring'],
  ['KRF-B095', 'Krishna Farm', 1950, 21, 'Loose Droppings', '2024-05-18T14:30:00+05:30', 'Moderate', 'Water Sanitation + Probiotic', 'Dr. S. Reddy', 'Recovered'],
  ['ANF-B094', 'Annapurna Farm', 1700, 7, 'Heat Stress', '2024-05-18T12:05:00+05:30', 'Mild', 'Cooling + Electrolytes', 'Dr. P. Sharma', 'Recovered'],
  ['SAF-B093', 'Sai Poultry Farm', 2300, 11, 'Reduced Water Intake', '2024-05-17T17:25:00+05:30', 'Mild', 'Water Line Flush', 'Dr. S. Reddy', 'Monitoring'],
  ['GVF-B092', 'Green Valley Farm', 2000, 43, 'Severe Respiratory Distress', '2024-05-17T08:50:00+05:30', 'Severe', 'Isolation + Veterinary Treatment', 'Dr. R. Kumar', 'Under Treatment'],
  ['SRF-B090', 'Sunrise Farm', 1850, 5, 'Ruffled Feathers', '2024-05-16T16:35:00+05:30', 'Mild', 'Vitamin Supplement', 'Dr. P. Sharma', 'Recovered']
].map(([batchId, farm, batchTotal, sickBirds, symptoms, detectedOn, severity, actionTaken, veterinarian, treatmentStatus]) => ({
  batchId, farm, batchTotal, sickBirds, symptoms, detectedOn: at(detectedOn), severity, actionTaken, veterinarian, treatmentStatus
}));

const farmerCases = [
  ['FARM-112', 'Demo Farmer Farm', 'Shed 1', 7500, 0, 12, 'Natural', 'Mild', 'Routine observation', 'Not assigned', 'Monitoring', 0],
  ['FARM-113', 'Demo Farmer Farm', 'Shed 2', 6000, 8, 18, 'Heat stress', 'Moderate', 'Cooling and electrolytes', 'Dr. S. Reddy', 'Under Treatment', 0],
  ['FARM-114', 'Demo Farmer Farm', 'Shed 3', 5000, 0, 8, 'Natural', 'Mild', 'Routine observation', 'Not assigned', 'Monitoring', 0],
  ['FARM-113', 'Demo Farmer Farm', 'Shed 2', 6000, 14, 14, 'Respiratory', 'Moderate', 'Isolation and veterinary review', 'Dr. S. Reddy', 'Under Treatment', 1]
].map(([batchId, farm, shed, batchTotal, sickBirds, mortalityCount, cause, severity, actionTaken, veterinarian, treatmentStatus, daysBack]) => ({
  batchId, farm, shed, batchTotal, sickBirds, mortalityCount, cause, symptoms: cause, severity, actionTaken, veterinarian, treatmentStatus,
  detectedOn: new Date(Date.now() - daysBack * 86400000), source: 'farmer', submittedByUserId: 'seed-farmer', submittedByName: 'Demo Farmer'
}));

const vaccinations = [
  ['Newcastle Disease (ND)', 'GVF-B104', 'Green Valley Farm', '2024-05-18T09:00:00+05:30', 'Completed', 'Dr. R. Kumar'],
  ['Infectious Bronchitis (IB)', 'SRF-B102', 'Sunrise Farm', '2024-05-25T09:00:00+05:30', 'Upcoming', ''],
  ['Gumboro Disease (IBD)', 'KRF-B098', 'Krishna Farm', '2024-06-01T09:00:00+05:30', 'Upcoming', ''],
  ['Fowl Pox', 'ANF-B097', 'Annapurna Farm', '2024-06-08T09:00:00+05:30', 'Upcoming', ''],
  ['Ranikhet (ND) Booster', 'SAF-B096', 'Sai Poultry Farm', '2024-06-15T09:00:00+05:30', 'Upcoming', ''],
  ['Marek Disease', 'GVF-B103', 'Green Valley Farm', '2024-05-10T09:00:00+05:30', 'Completed', 'Dr. S. Reddy'],
  ['Gumboro Booster', 'SRF-B101', 'Sunrise Farm', '2024-05-12T09:00:00+05:30', 'Completed', 'Dr. P. Sharma']
].map(([name, batchId, farm, scheduledDate, status, administeredBy]) => ({
  name, batchId, farm, scheduledDate: at(scheduledDate), status, administeredBy,
  completedAt: status === 'Completed' ? at(scheduledDate) : null
}));

const alerts = [
  { title: 'High mortality detected in Batch KRF-B098', message: 'Mortality is 2.90% which is above the normal range.', batchId: 'KRF-B098', type: 'mortality', severity: 'critical', occurredAt: at('2024-05-22T06:20:00+05:30'), read: false },
  { title: 'Sick birds percentage increased in Batch GVF-B104', message: '1.75% birds are showing symptoms.', batchId: 'GVF-B104', type: 'sickness', severity: 'warning', occurredAt: at('2024-05-22T08:30:00+05:30'), read: false },
  { title: 'Vaccination due tomorrow for Batch SRF-B102', message: 'IB vaccination is due on 25 May 2024.', batchId: 'SRF-B102', type: 'vaccination', severity: 'info', occurredAt: at('2024-05-24T09:00:00+05:30'), read: false },
  { title: 'Health check completed for Batch SAF-B096', message: 'All parameters are normal.', batchId: 'SAF-B096', type: 'health-check', severity: 'success', occurredAt: at('2024-05-22T10:15:00+05:30'), read: true },
  { title: 'Follow-up due for Batch GVF-B092', message: 'Veterinary follow-up is scheduled for this afternoon.', batchId: 'GVF-B092', type: 'health-check', severity: 'warning', occurredAt: at('2024-05-21T11:00:00+05:30'), read: false }
];

const records = [
  ['Health Check Report - GVF-B104', 'Health Check', 'GVF-B104', 'Green Valley Farm', '2024-05-22T08:30:00+05:30', 'Routine flock examination completed. Activity and feed consumption were satisfactory; 35 birds remain under observation.'],
  ['Treatment Report - SRF-B102', 'Treatment', 'SRF-B102', 'Sunrise Farm', '2024-05-22T07:45:00+05:30', 'Multivitamin and probiotic support started for reduced feed intake. Review scheduled after 24 hours.'],
  ['Vaccination Report - KRF-B098', 'Vaccination', 'KRF-B098', 'Krishna Farm', '2024-05-21T18:15:00+05:30', 'Vaccination record reviewed during respiratory treatment. No adverse reaction recorded.'],
  ['Mortality Report - ANF-B097', 'Mortality', 'ANF-B097', 'Annapurna Farm', '2024-05-21T11:20:00+05:30', 'Daily mortality and clinical observations recorded. Supportive treatment is in progress.'],
  ['Health Summary - SAF-B096', 'Health Summary', 'SAF-B096', 'Sai Poultry Farm', '2024-05-20T09:10:00+05:30', 'Flock health parameters returned to normal after probiotic and ORS support.'],
  ['Respiratory Follow-up - GVF-B092', 'Treatment', 'GVF-B092', 'Green Valley Farm', '2024-05-19T16:00:00+05:30', 'Severe respiratory cases isolated. Veterinary treatment and twice-daily monitoring continue.'],
  ['Weekly Health Summary - All Farms', 'Health Summary', 'ALL-BATCHES', 'All Farms', '2024-05-19T18:00:00+05:30', 'Weekly review covering health scores, vaccinations, mortality and open treatment cases across all active farms.']
].map(([name, type, batchId, farm, recordedAt, summary]) => ({ name, type, batchId, farm, recordedAt: at(recordedAt), summary }));

async function seed() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured');
  await mongoose.connect(process.env.MONGO_URI);

  await Promise.all([
    BirdHealthSnapshot.deleteMany({}),
    BirdHealthCase.deleteMany({}),
    VaccinationSchedule.deleteMany({}),
    BirdHealthAlert.deleteMany({}),
    BirdHealthRecord.deleteMany({})
  ]);

  await Promise.all([
    BirdHealthSnapshot.create(snapshot),
    BirdHealthCase.insertMany([...cases, ...farmerCases]),
    VaccinationSchedule.insertMany(vaccinations),
    BirdHealthAlert.insertMany(alerts),
    BirdHealthRecord.insertMany(records)
  ]);

  console.log(`Seeded Birds Health: 1 snapshot, ${cases.length} business cases, ${farmerCases.length} farmer events, ${vaccinations.length} vaccinations, ${alerts.length} alerts, ${records.length} records.`);
}

seed()
  .catch((error) => {
    console.error('Birds Health seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
