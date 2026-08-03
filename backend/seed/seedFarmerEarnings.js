require('dotenv').config();
const mongoose = require('mongoose');
const FarmerEarningClaim = require('../models/FarmerEarningClaim');

const daysAgo = (days) => new Date(Date.now() - days * 86400000);
const claims = [
  { claimNumber: 'FCL-SEED-109', batchId: 'FARM-109', farm: 'Demo Farmer Farm', amount: 176500, description: 'Completed batch settlement', serviceDate: daysAgo(30), status: 'Paid', submittedByUserId: 'seed-farmer', submittedByName: 'Demo Farmer', paidAt: daysAgo(20), reviewedAt: daysAgo(21) },
  { claimNumber: 'FCL-SEED-106', batchId: 'FARM-106', farm: 'Demo Farmer Farm', amount: 168200, description: 'Completed batch settlement', serviceDate: daysAgo(60), status: 'Paid', submittedByUserId: 'seed-farmer', submittedByName: 'Demo Farmer', paidAt: daysAgo(50), reviewedAt: daysAgo(51) },
  { claimNumber: 'FCL-SEED-103', batchId: 'FARM-103', farm: 'Demo Farmer Farm', amount: 171900, description: 'Completed batch settlement', serviceDate: daysAgo(90), status: 'Paid', submittedByUserId: 'seed-farmer', submittedByName: 'Demo Farmer', paidAt: daysAgo(80), reviewedAt: daysAgo(81) },
  { claimNumber: 'FCL-SEED-113', batchId: 'FARM-113', farm: 'Demo Farmer Farm', amount: 42000, description: 'Interim growing-service claim', serviceDate: daysAgo(2), status: 'Pending', submittedByUserId: 'seed-farmer', submittedByName: 'Demo Farmer', expectedPayoutDate: new Date(Date.now() + 10 * 86400000) }
];

async function seed() { if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured'); await mongoose.connect(process.env.MONGO_URI); await FarmerEarningClaim.deleteMany({}); await FarmerEarningClaim.insertMany(claims); console.log(`Seeded Farmer Earnings: ${claims.length} claims.`); }
seed().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => mongoose.disconnect());
