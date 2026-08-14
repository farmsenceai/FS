require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../src/modules/organizations/organizations.model');
const Farm = require('../src/modules/farms/farms.model');
const Facility = require('../src/modules/facilities/facilities.model');
const BirdBatch = require('../src/modules/bird-batches/bird-batches.model');
const FlockRecord = require('../src/modules/flock-records/flock-records.model');
const businessDashboardService = require('../src/modules/business-dashboard/business-dashboard.service');

const MARKER = '[DEMO-LIVE-FARM-VIEW]';
const FARM_CODE = 'AAA-LIVE-DEMO';
const BATCH_CODE = 'AAA-LIVE-DEMO-B001';

async function run() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured.');
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const admin = await User.findOne({ role: 'admin', accountStatus: { $ne: 'suspended' } }).sort({ createdAt: 1 });
    if (!admin) throw new Error('An active admin account is required to own demo records.');
    const organization = await Organization.findOne({ deletedAt: null }).sort({ createdAt: 1 });
    if (!organization) throw new Error('An organization is required before Live Farm View data can be seeded.');

    const farm = await Farm.findOneAndUpdate(
      { businessId: organization._id, code: FARM_CODE },
      {
        $set: {
          name: 'AAA Live Poultry Farm [DEMO]',
          status: 'active',
          farmType: 'broiler',
          location: { address: 'Demo Broiler Site, Karnataka', stateProvince: 'Karnataka', countryCode: 'IN', timezone: 'Asia/Kolkata' },
          capacity: { birdCapacity: 15000, areaSqM: 1800 },
          tags: ['demo', 'live-farm-view'],
          openedAt: new Date('2026-07-01T00:00:00.000Z'),
          createdBy: admin._id,
          deletedAt: null
        },
        $setOnInsert: { businessId: organization._id }
      },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );

    const facility = await Facility.findOneAndUpdate(
      { businessId: organization._id, farmId: farm._id, code: 'BROODER-01' },
      {
        $set: {
          name: 'Brooder Area', type: 'shed', status: 'active', capacity: 15000,
          environmentTargets: { temperatureMin: 28, temperatureMax: 32, humidityMin: 55, humidityMax: 70, ammoniaMax: 20, co2Max: 1500 },
          metadata: { marker: MARKER }, createdBy: admin._id, deletedAt: null
        }
      },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );

    const placedAt = new Date();
    placedAt.setUTCDate(placedAt.getUTCDate() - 18);
    const expectedHarvestAt = new Date();
    expectedHarvestAt.setUTCDate(expectedHarvestAt.getUTCDate() + 24);
    const batch = await BirdBatch.findOneAndUpdate(
      { businessId: organization._id, farmId: farm._id, code: BATCH_CODE },
      {
        $set: {
          facilityId: facility._id, breed: 'Cobb 500', birdType: 'broiler', initialBirdCount: 14500,
          currentBirdCountCached: 14472, placedAt, expectedHarvestAt, status: 'active',
          sourceHatchery: 'FarmSence Demo Hatchery', notes: `${MARKER} active flock`,
          createdBy: admin._id, source: 'import', deletedAt: null
        }
      },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );

    const today = new Date();
    const recordDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const record = await FlockRecord.findOneAndUpdate(
      { businessId: organization._id, farmId: farm._id, batchId: batch._id, recordDate, correctsRecordId: { $exists: false } },
      {
        $set: {
          feed: { consumedKg: 1180, remainingStockKg: 4320 },
          water: { consumedLiters: 2475 },
          mortality: { count: 6, cause: 'Routine demo mortality record' },
          culls: { count: 1, reason: 'Routine demo welfare cull' },
          avgWeightGrams: 1125,
          observations: `${MARKER} birds active, feeding normally, and evenly distributed.`,
          sensorReadings: { temperatureC: 30.2, humidityPct: 63, ammoniaPpm: 11, co2Ppm: 720, source: 'sensor_device' },
          enteredVia: 'import', syncStatus: 'verified', createdBy: admin._id, source: 'sensor', deletedAt: null
        },
        $setOnInsert: { businessId: organization._id, farmId: farm._id, batchId: batch._id, recordDate }
      },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );

    const dashboard = await businessDashboardService.getDashboard({ role: 'business' });
    if (String(dashboard.farm?.id) !== String(farm._id) || String(dashboard.batch?.id) !== String(batch._id) || !dashboard.latestRecord) {
      throw new Error('Seeded records were created, but Business Dashboard did not select them.');
    }

    console.log(JSON.stringify({
      farm: { id: farm._id, name: farm.name, status: farm.status },
      facility: { id: facility._id, name: facility.name },
      batch: { id: batch._id, code: batch.code, status: batch.status, currentBirdCount: batch.currentBirdCountCached },
      latestRecord: { id: record._id, recordDate: record.recordDate, temperatureC: record.sensorReadings.temperatureC, humidityPct: record.sensorReadings.humidityPct, feedKg: record.feed.consumedKg, waterLiters: record.water.consumedLiters },
      dashboardVerified: true
    }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
