require('dotenv').config();
const mongoose = require('mongoose');
const PerformanceSnapshot = require('../models/PerformanceSnapshot');
const PerformanceBatch = require('../models/PerformanceBatch');
const PerformanceDriver = require('../models/PerformanceDriver');
const PerformanceRecommendation = require('../models/PerformanceRecommendation');

const at = (value) => new Date(value);
const snapshot = {
  key: 'current', averageFcr: 1.62, previousFcr: 1.67, averageWeightKg: 1.45, previousWeightKg: 1.38,
  averageDailyGainG: 54.2, previousDailyGainG: 51.7, mortalityRatePct: 2.35, previousMortalityRatePct: 2.70,
  livabilityPct: 97.65, previousLivabilityPct: 97.30, performanceScore: 88, previousPerformanceScore: 85,
  benchmarkPercentile: 78, insightTitle: 'Great Job!', insightText: 'Your performance is better than 78% of all farms. Keep maintaining good feed efficiency.',
  updatedFor: at('2024-05-22T10:00:00+05:30')
};

const batches = [
  ['B1-106', 'Green Valley Farm', 20000, 1.62, 54.2, 1.45, 2.35, 97.65, 88, 'Good', '2024-05-22'],
  ['B1-105', 'Green Valley Farm', 20000, 1.68, 51.8, 1.38, 2.68, 97.32, 85, 'Good', '2024-04-22'],
  ['B1-104', 'Green Valley Farm', 20000, 1.58, 56.8, 1.48, 1.80, 98.20, 82, 'Excellent', '2024-03-22'],
  ['B1-103', 'Sunrise Farm', 25000, 1.72, 49.6, 1.32, 2.90, 97.10, 78, 'Average', '2024-02-22'],
  ['B1-102', 'Sunrise Farm', 25000, 1.76, 48.3, 1.28, 3.20, 96.80, 76, 'Average', '2024-01-22'],
  ['B1-101', 'Krishna Farm', 18000, 1.81, 47.2, 1.22, 3.45, 96.55, 72, 'Average', '2023-12-22'],
  ['B1-100', 'Amorapura Farm', 22000, 1.79, 47.8, 1.24, 3.30, 96.70, 73, 'Average', '2023-11-22'],
  ['B1-099', 'Sai Poultry Farm', 21000, 1.70, 50.1, 1.31, 2.85, 97.15, 77, 'Good', '2023-10-22'],
  ['B1-098', 'Krishna Farm', 17500, 1.74, 49.0, 1.29, 3.05, 96.95, 75, 'Average', '2023-09-22'],
  ['B1-097', 'Sunrise Farm', 24000, 1.66, 52.0, 1.36, 2.55, 97.45, 81, 'Good', '2023-08-22'],
  ['B1-096', 'Green Valley Farm', 19500, 1.64, 53.2, 1.40, 2.40, 97.60, 84, 'Good', '2023-07-22'],
  ['B1-095', 'Sai Poultry Farm', 20500, 1.69, 50.8, 1.34, 2.75, 97.25, 79, 'Good', '2023-06-22']
].map(([batchId, farm, birds, fcr, averageDailyGainG, averageWeightKg, mortalityRatePct, livabilityPct, performanceScore, status, completedAt]) => ({ batchId, farm, birds, fcr, averageDailyGainG, averageWeightKg, mortalityRatePct, livabilityPct, performanceScore, status, completedAt: at(`${completedAt}T10:00:00+05:30`) }));

const drivers = [
  ['feed-efficiency', 'Feed Efficiency', 'FCR', '1.62', 'Good', 'F', '#dbeafe', 1],
  ['growth', 'Growth Performance', 'ADG', '54.2 g', 'Good', 'G', '#dcfce7', 2],
  ['uniformity', 'Bird Uniformity', 'CV% of Body Weight', '8.5%', 'Good', 'U', '#fef3c7', 3],
  ['mortality', 'Mortality Control', 'Mortality Rate', '2.35%', 'Average', 'M', '#fee2e2', 4],
  ['livability', 'Livability', 'Survival Rate', '97.65%', 'Good', 'L', '#dcfce7', 5]
].map(([key, title, metricLabel, displayValue, status, icon, color, sortOrder]) => ({ key, title, metricLabel, displayValue, status, icon, color, sortOrder }));

const recommendations = [
  ['Maintain current feed quality to sustain low FCR.', 'High', 1],
  ['Ensure proper ventilation to reduce mortality.', 'High', 2],
  ['Monitor bird uniformity in the next 7 days.', 'Medium', 3],
  ['Optimize lighting program for better growth.', 'Medium', 4],
  ['Review water-to-feed ratio for average-performing batches.', 'Low', 5],
  ['Compare weekly weights against breed standards.', 'Low', 6]
].map(([text, priority, sortOrder]) => ({ text, priority, sortOrder, completed: false }));

async function seed() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured');
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([PerformanceSnapshot.deleteMany({}), PerformanceBatch.deleteMany({}), PerformanceDriver.deleteMany({}), PerformanceRecommendation.deleteMany({})]);
  await Promise.all([PerformanceSnapshot.create(snapshot), PerformanceBatch.insertMany(batches), PerformanceDriver.insertMany(drivers), PerformanceRecommendation.insertMany(recommendations)]);
  console.log('Seeded Performance: 1 snapshot, 12 batches, 5 drivers, 6 recommendations.');
  await mongoose.disconnect();
}

seed().catch(async (error) => { console.error(error); await mongoose.disconnect(); process.exitCode = 1; });
