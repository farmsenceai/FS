require('dotenv').config();
const mongoose = require('mongoose');
const EnvironmentSnapshot = require('../models/EnvironmentSnapshot');
const EnvironmentParameter = require('../models/EnvironmentParameter');
const EnvironmentReading = require('../models/EnvironmentReading');
const EnvironmentAlert = require('../models/EnvironmentAlert');
const EnvironmentRecord = require('../models/EnvironmentRecord');

const at = (value) => new Date(value);
const updatedFor = at('2024-05-22T10:30:00+05:30');

const snapshot = {
  key: 'current', averageTemperatureC: 28.4, previousTemperatureC: 27.8,
  averageHumidityPct: 58.6, previousHumidityPct: 56.5, airQualityIndex: 42,
  previousAirQualityIndex: 47, averageAmmoniaPpm: 12.4, previousAmmoniaPpm: 11.2,
  averageCo2Ppm: 620, previousCo2Ppm: 590, environmentScore: 92, previousEnvironmentScore: 89,
  updatedFor,
  trend: [
    { label: '16 May', temperatureC: 27.2, humidityPct: 54.1, ammoniaPpm: 10.2, co2Ppm: 560 },
    { label: '17 May', temperatureC: 27.5, humidityPct: 55.0, ammoniaPpm: 10.7, co2Ppm: 575 },
    { label: '18 May', temperatureC: 27.8, humidityPct: 56.1, ammoniaPpm: 11.0, co2Ppm: 585 },
    { label: '19 May', temperatureC: 28.0, humidityPct: 56.8, ammoniaPpm: 11.5, co2Ppm: 600 },
    { label: '20 May', temperatureC: 28.2, humidityPct: 57.4, ammoniaPpm: 11.9, co2Ppm: 610 },
    { label: '22 May', temperatureC: 28.4, humidityPct: 58.6, ammoniaPpm: 12.4, co2Ppm: 620 }
  ],
  distribution: [
    { label: 'Optimal', percentage: 72, count: 27, color: '#10b981' },
    { label: 'Moderate', percentage: 18, count: 7, color: '#fbbf24' },
    { label: 'Poor', percentage: 8, count: 3, color: '#ef4444' },
    { label: 'Critical', percentage: 2, count: 1, color: '#9ca3af' }
  ],
  tips: [
    'Maintain temperature between 18–32°C for optimal growth.',
    'Keep ammonia levels below 25 ppm for better respiratory health.',
    'Ensure proper ventilation to reduce CO2 buildup.',
    'Regularly monitor humidity to prevent litter moisture.',
    'Use the environment sensors for real-time monitoring.'
  ]
};

const parameters = [
  ['temperature', 'Temperature', 28.4, '°C', 'optimal', '18 - 32°C', 'T', 1],
  ['humidity', 'Humidity', 58.6, '%', 'optimal', '45 - 70%', 'H', 2],
  ['air-quality', 'Air Quality Index', 42, '', 'good', '0 - 500', 'AQ', 3],
  ['ammonia', 'Ammonia (NH3)', 12.4, 'ppm', 'good', '0 - 25 ppm', 'A', 4],
  ['co2', 'Carbon Dioxide (CO2)', 620, 'ppm', 'good', '0 - 1000 ppm', 'C', 5],
  ['light', 'Light Intensity', 28, 'Lux', 'optimal', '20 - 40 Lux', 'L', 6]
].map(([key, label, value, unit, status, acceptableRange, icon, sortOrder]) => ({ key, label, value, unit, status, acceptableRange, icon, sortOrder, updatedFor }));

const rows = [
  ['GVF-B104', 'Green Valley Farm', '1', 20000, 27.8, 56.2, 18.5, 610, 45, 'Good', 'good'],
  ['SRF-B102', 'Sunrise Farm', '1', 25000, 30.1, 63.5, 22.1, 720, 68, 'Moderate', 'moderate'],
  ['KRF-B098', 'Krishna Farm', '2', 18000, 27.2, 54.1, 11.2, 520, 40, 'Good', 'good'],
  ['ANF-B097', 'Amorapura Farm', '2', 22000, 28.6, 57.8, 10.8, 580, 40, 'Good', 'good'],
  ['SAF-B096', 'Sai Poultry Farm', '3', 22000, 27.9, 59.2, 9.6, 590, 38, 'Good', 'good'],
  ['GVF-B103', 'Green Valley Farm', '2', 19500, 29.2, 61.0, 14.2, 650, 52, 'Good', 'good'],
  ['SRF-B101', 'Sunrise Farm', '2', 24000, 31.4, 67.2, 24.5, 780, 74, 'Moderate', 'warning'],
  ['KRF-B095', 'Krishna Farm', '1', 17500, 27.0, 53.8, 10.4, 510, 36, 'Excellent', 'excellent'],
  ['ANF-B094', 'Amorapura Farm', '1', 21000, 28.1, 56.7, 11.0, 565, 39, 'Good', 'good'],
  ['SAF-B093', 'Sai Poultry Farm', '2', 21500, 27.6, 58.0, 9.2, 575, 35, 'Excellent', 'excellent'],
  ['GVF-B092', 'Green Valley Farm', '3', 18800, 32.3, 71.0, 27.5, 910, 91, 'Poor', 'warning'],
  ['SRF-B090', 'Sunrise Farm', '3', 23000, 28.8, 60.4, 13.1, 630, 48, 'Good', 'good']
].map(([batchId, farm, house, birds, temperatureC, humidityPct, ammoniaPpm, co2Ppm, airQualityIndex, airQualityLabel, status], index) => ({
  batchId, farm, house, birds, temperatureC, humidityPct, ammoniaPpm, co2Ppm, airQualityIndex, airQualityLabel, status,
  recordedAt: at(`2024-05-${String(22 - Math.floor(index / 5)).padStart(2, '0')}T${String(10 - (index % 5)).padStart(2, '0')}:00:00+05:30`)
}));

const farmerRows = [
  ['FARM-112', 'Demo Farmer Farm', 'Shed 1', 7500, 28.8, 61, 10, 610, 38, 'Good', 'good'],
  ['FARM-113', 'Demo Farmer Farm', 'Shed 2', 6000, 31.2, 68, 16, 760, 72, 'Moderate', 'warning'],
  ['FARM-114', 'Demo Farmer Farm', 'Shed 3', 5000, 28.2, 62, 9, 580, 34, 'Excellent', 'excellent']
].map(([batchId, farm, house, birds, temperatureC, humidityPct, ammoniaPpm, co2Ppm, airQualityIndex, airQualityLabel, status], index) => ({
  batchId, farm, house, birds, temperatureC, humidityPct, ammoniaPpm, co2Ppm, airQualityIndex, airQualityLabel, status,
  recordedAt: new Date(Date.now() - index * 60 * 60 * 1000), source: 'farmer', submittedByUserId: 'seed-farmer', submittedByName: 'Demo Farmer'
}));

const alerts = [
  { title: 'Ammonia level is high in Batch GVF-B104 House 2', batchId: 'GVF-B104', house: '2', severity: 'warning', occurredAt: at('2024-05-22T10:15:00+05:30'), read: false },
  { title: 'High temperature detected in Batch SRF-B102 House 1', batchId: 'SRF-B102', house: '1', severity: 'high', occurredAt: at('2024-05-22T09:43:00+05:30'), read: false },
  { title: 'CO2 level is above normal in Batch KRF-B098 House 3', batchId: 'KRF-B098', house: '3', severity: 'warning', occurredAt: at('2024-05-22T08:20:00+05:30'), read: false },
  { title: 'Environment conditions are normal. All other batches', severity: 'normal', occurredAt: at('2024-05-22T07:30:00+05:30'), read: true }
];

const records = [
  ['Environment Report - GVF-B104', 'GVF-B104', 'Green Valley Farm', '2024-05-22T10:00:00+05:30', 'House readings reviewed. Temperature and humidity are acceptable; ammonia requires continued observation.'],
  ['Environment Report - SRF-B102', 'SRF-B102', 'Sunrise Farm', '2024-05-22T10:00:00+05:30', 'High temperature alert recorded for House 1. Ventilation response and follow-up monitoring initiated.'],
  ['Environment Report - KRF-B098', 'KRF-B098', 'Krishna Farm', '2024-05-22T10:00:00+05:30', 'CO2 and air-quality readings reviewed. Corrective ventilation action documented.'],
  ['Weekly Environment Summary', '', 'All Farms', '2024-05-22T09:00:00+05:30', 'Weekly summary of temperature, humidity, ammonia, CO2, light, and air-quality performance across all houses.'],
  ['Environment Compliance Report', '', 'All Farms', '2024-05-15T10:30:00+05:30', 'Environmental operating ranges and recorded exceptions reviewed for the weekly compliance period.']
].map(([title, batchId, farm, recordedAt, summary]) => ({ title, batchId, farm, recordedAt: at(recordedAt), summary }));

async function seed() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured');
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([EnvironmentSnapshot.deleteMany({}), EnvironmentParameter.deleteMany({}), EnvironmentReading.deleteMany({}), EnvironmentAlert.deleteMany({}), EnvironmentRecord.deleteMany({})]);
  await Promise.all([EnvironmentSnapshot.create(snapshot), EnvironmentParameter.insertMany(parameters), EnvironmentReading.insertMany([...rows, ...farmerRows]), EnvironmentAlert.insertMany(alerts), EnvironmentRecord.insertMany(records)]);
  console.log('Seeded Environment: 1 snapshot, 6 parameters, 12 business readings, 3 farmer readings, 4 alerts, 5 records.');
  await mongoose.disconnect();
}

seed().catch(async (error) => { console.error(error); await mongoose.disconnect(); process.exitCode = 1; });
