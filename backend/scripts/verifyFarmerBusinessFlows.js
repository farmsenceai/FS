require('dotenv').config();
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../app');
const Batch = require('../models/Batch');
const FarmSummary = require('../models/FarmSummary');
const EnvironmentReading = require('../models/EnvironmentReading');
const EnvironmentSnapshot = require('../models/EnvironmentSnapshot');
const EnvironmentParameter = require('../models/EnvironmentParameter');
const BirdHealthCase = require('../models/BirdHealthCase');
const BirdHealthSnapshot = require('../models/BirdHealthSnapshot');
const FarmerEarningClaim = require('../models/FarmerEarningClaim');

async function main() {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) throw new Error('MONGO_URI and JWT_SECRET are required');
  await mongoose.connect(process.env.MONGO_URI); const server = app.listen(0); await new Promise((resolve) => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`; const farmer = jwt.sign({ userId: 'farmer-flow-verifier', name: 'Flow Verifier', role: 'farmer' }, process.env.JWT_SECRET, { expiresIn: '5m' }); const otherFarmer = jwt.sign({ userId: 'other-flow-verifier', role: 'farmer' }, process.env.JWT_SECRET, { expiresIn: '5m' }); const business = jwt.sign({ userId: 'business-flow-verifier', role: 'business' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  let batchId, environmentId, healthId, claimId; const environmentSnapshot = await EnvironmentSnapshot.findOne({ key: 'current' }).lean(); const parameters = await EnvironmentParameter.find().lean(); const healthSnapshot = await BirdHealthSnapshot.findOne({ key: 'current' }).lean();
  async function request(path, { method = 'GET', token = farmer, body } = {}) { const response = await fetch(`${origin}${path}`, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }); const payload = await response.json(); return { response, payload }; }
  try {
    assert.equal((await request('/api/batch/farmer/summary', { token: business })).response.status, 403);
    const createdBatch = await request('/api/batch/farmer/batches', { method: 'POST', body: { batchId: 'VERIFY-FARMER-BATCH', farm: 'Farmer Flow Farm', shed: 'Verifier Shed', breed: 'Broiler', doa: new Date().toISOString(), birds: 1000, mortality: 1.2, fcr: 1.55, lifecycleStatus: 'Active' } }); assert.equal(createdBatch.response.status, 201); batchId = createdBatch.payload.batch._id;
    const businessBatch = await request('/api/batch/batches?search=VERIFY-FARMER-BATCH', { token: business }); assert.equal(businessBatch.payload.total, 1); assert.equal(businessBatch.payload.batches[0].source, 'farmer');
    assert.equal((await request(`/api/batch/farmer/batches/${batchId}`, { method: 'PUT', token: otherFarmer, body: {} })).response.status, 404);

    const environment = await request('/api/environment/farmer/readings', { method: 'POST', body: { batchId: 'VERIFY-FARMER-BATCH', farm: 'Farmer Flow Farm', house: 'Verifier Shed', birds: 1000, temperatureC: 29.5, humidityPct: 62, ammoniaPpm: 11, co2Ppm: 600, airQualityIndex: 40, airQualityLabel: 'Good', status: 'good', recordedAt: new Date().toISOString() } }); assert.equal(environment.response.status, 201); environmentId = environment.payload.reading._id;
    const businessEnvironment = await request('/api/environment/readings?search=VERIFY-FARMER-BATCH', { token: business }); assert.equal(businessEnvironment.payload.total, 1); assert.equal(businessEnvironment.payload.readings[0].source, 'farmer');

    const health = await request('/api/birds-health/farmer/events', { method: 'POST', body: { batchId: 'VERIFY-FARMER-BATCH', farm: 'Farmer Flow Farm', shed: 'Verifier Shed', batchTotal: 1000, sickBirds: 5, mortalityCount: 2, cause: 'Verification observation', symptoms: 'Verification observation', detectedOn: new Date().toISOString(), severity: 'Mild', actionTaken: 'Monitoring', veterinarian: 'Not assigned', treatmentStatus: 'Monitoring' } }); assert.equal(health.response.status, 201); healthId = health.payload.event._id;
    const businessHealth = await request('/api/birds-health/cases?search=VERIFY-FARMER-BATCH', { token: business }); assert.equal(businessHealth.payload.total, 1); assert.equal(businessHealth.payload.cases[0].source, 'farmer'); assert.equal(businessHealth.payload.cases[0].mortalityCount, 2);

    const earning = await request('/api/financial/farmer/claims', { method: 'POST', body: { batchId: 'VERIFY-FARMER-BATCH', farm: 'Farmer Flow Farm', amount: 12345, description: 'End-to-end verification claim', serviceDate: new Date().toISOString() } }); assert.equal(earning.response.status, 201); claimId = earning.payload.claim._id;
    const businessClaims = await request('/api/financial/claims?search=VERIFY-FARMER-BATCH', { token: business }); assert.equal(businessClaims.payload.claims.length, 1);
    const approved = await request(`/api/financial/claims/${claimId}/status`, { method: 'PUT', token: business, body: { status: 'Approved', businessNote: 'Verified' } }); assert.equal(approved.payload.claim.status, 'Approved');
    const farmerClaims = await request('/api/financial/farmer/claims'); assert.equal(farmerClaims.payload.claims.find((item) => item._id === claimId).status, 'Approved');

    assert.equal((await request(`/api/birds-health/farmer/events/${healthId}`, { method: 'DELETE' })).response.status, 200); healthId = null;
    assert.equal((await request(`/api/environment/farmer/readings/${environmentId}`, { method: 'DELETE' })).response.status, 200); environmentId = null;
    assert.equal((await request(`/api/batch/farmer/batches/${batchId}`, { method: 'DELETE' })).response.status, 200); batchId = null;
    console.log('Farmer-to-business workflows verified: batches, environment, birds health, and earning claims propagate end to end with ownership and role controls.');
  } finally {
    if (batchId) await Batch.findByIdAndDelete(batchId); if (environmentId) await EnvironmentReading.findByIdAndDelete(environmentId); if (healthId) await BirdHealthCase.findByIdAndDelete(healthId); if (claimId) await FarmerEarningClaim.findByIdAndDelete(claimId); await FarmSummary.deleteOne({ name: 'Farmer Flow Farm' });
    if (environmentSnapshot) await EnvironmentSnapshot.replaceOne({ key: 'current' }, environmentSnapshot, { upsert: true });
    await Promise.all(parameters.map((item) => EnvironmentParameter.replaceOne({ _id: item._id }, item, { upsert: true })));
    if (healthSnapshot) await BirdHealthSnapshot.replaceOne({ key: 'current' }, healthSnapshot, { upsert: true });
    await new Promise((resolve) => server.close(resolve)); await mongoose.disconnect();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
