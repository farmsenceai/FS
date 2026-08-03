require('dotenv').config();
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../app');
const EnvironmentReading = require('../models/EnvironmentReading');
const EnvironmentParameter = require('../models/EnvironmentParameter');
const EnvironmentAlert = require('../models/EnvironmentAlert');
const EnvironmentSnapshot = require('../models/EnvironmentSnapshot');

async function main() {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) throw new Error('MONGO_URI and JWT_SECRET are required');
  await mongoose.connect(process.env.MONGO_URI);
  const server = app.listen(0); await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/environment`;
  const business = jwt.sign({ userId: 'environment-verifier', role: 'business' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const farmer = jwt.sign({ userId: 'environment-verifier', role: 'farmer' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  let createdReadingId, parameterBefore, alertBefore;

  async function request(path, { method = 'GET', token = business, body } = {}) {
    const response = await fetch(`${base}${path}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const type = response.headers.get('content-type') || '';
    const payload = type.includes('application/json') ? await response.json() : await response.text();
    return { response, payload };
  }

  try {
    assert.equal((await request('/dashboard', { token: null })).response.status, 401);
    assert.equal((await request('/dashboard', { token: farmer })).response.status, 403);
    const dashboard = await request('/dashboard');
    assert.equal(dashboard.response.status, 200);
    assert.equal(dashboard.payload.snapshot.averageTemperatureC, 28.4);
    assert.equal(dashboard.payload.snapshot.environmentScore, 92);

    const readings = await request('/readings?page=1&limit=5');
    assert.equal(readings.payload.readings.length, 5);
    assert.equal(readings.payload.total, 15);
    assert.equal(readings.payload.totalPages, 3);
    assert.equal((await request('/readings?search=GVF-B104')).payload.total, 1);
    assert.ok((await request('/readings?status=excellent')).payload.total > 0);

    const created = await request('/readings', { method: 'POST', body: { batchId: 'VERIFY-ENV-001', farm: 'Verification Farm', house: 'Test House', birds: 1000, temperatureC: 28.5, humidityPct: 60, ammoniaPpm: 10, co2Ppm: 600, airQualityIndex: 40, airQualityLabel: 'Good', status: 'good', recordedAt: new Date().toISOString(), notes: 'Temporary verification reading' } });
    assert.equal(created.response.status, 201); createdReadingId = created.payload.reading._id;
    const updated = await request(`/readings/${createdReadingId}`, { method: 'PUT', body: { temperatureC: 29.1, status: 'moderate' } });
    assert.equal(updated.payload.reading.temperatureC, 29.1); assert.equal(updated.payload.reading.status, 'moderate');

    const parameters = await request('/parameters');
    assert.equal(parameters.payload.parameters.length, 6); parameterBefore = parameters.payload.parameters[0];
    const parameterUpdated = await request(`/parameters/${parameterBefore._id}`, { method: 'PUT', body: { value: 28.8, status: 'good' } });
    assert.equal(parameterUpdated.payload.parameter.value, 28.8);
    assert.equal((await request('/dashboard')).payload.snapshot.averageTemperatureC, 28.8);

    const alerts = await request('/alerts?read=false'); assert.ok(alerts.payload.alerts.length > 0); alertBefore = alerts.payload.alerts[0];
    assert.equal((await request(`/alerts/${alertBefore._id}/read`, { method: 'PUT' })).payload.alert.read, true);

    const records = await request('/records'); assert.equal(records.payload.records.length, 5);
    const record = await request(`/records/${records.payload.records[0]._id}/download`);
    assert.equal(record.response.status, 200); assert.match(record.response.headers.get('content-disposition'), /^attachment;/); assert.match(record.payload, /Environmental Record/);
    const report = await request('/report/download'); assert.equal(report.response.status, 200); assert.match(report.payload, /Environment Summary/);

    assert.equal((await request(`/readings/${createdReadingId}`, { method: 'DELETE' })).response.status, 200); createdReadingId = null;
    console.log('Environment API verified: auth, dashboard, filters, pagination, CRUD, parameters, alerts, records, and downloads.');
  } finally {
    if (createdReadingId) await EnvironmentReading.findByIdAndDelete(createdReadingId);
    if (parameterBefore) {
      await EnvironmentParameter.findByIdAndUpdate(parameterBefore._id, { label: parameterBefore.label, value: parameterBefore.value, unit: parameterBefore.unit, status: parameterBefore.status, acceptableRange: parameterBefore.acceptableRange, updatedFor: parameterBefore.updatedFor });
      await EnvironmentSnapshot.updateOne({ key: 'current' }, { $set: { averageTemperatureC: parameterBefore.value, updatedFor: parameterBefore.updatedFor } });
    }
    if (alertBefore) await EnvironmentAlert.findByIdAndUpdate(alertBefore._id, { read: alertBefore.read });
    await new Promise((resolve) => server.close(resolve)); await mongoose.disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
