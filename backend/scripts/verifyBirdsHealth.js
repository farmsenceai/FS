require('dotenv').config();

const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = require('../app');
const BirdHealthCase = require('../models/BirdHealthCase');
const VaccinationSchedule = require('../models/VaccinationSchedule');
const BirdHealthAlert = require('../models/BirdHealthAlert');

async function main() {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    throw new Error('MONGO_URI and JWT_SECRET are required');
  }

  await mongoose.connect(process.env.MONGO_URI);
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/birds-health`;
  const businessToken = jwt.sign({ userId: 'birds-health-verifier', role: 'business' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const farmerToken = jwt.sign({ userId: 'birds-health-verifier', role: 'farmer' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  let createdCaseId;
  let vaccinationBefore;
  let alertBefore;

  async function request(path, { method = 'GET', token = businessToken, body } = {}) {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : await response.text();
    return { response, payload };
  }

  try {
    assert.equal((await request('/dashboard', { token: null })).response.status, 401);
    assert.equal((await request('/dashboard', { token: farmerToken })).response.status, 403);

    const dashboard = await request('/dashboard');
    assert.equal(dashboard.response.status, 200);
    assert.equal(dashboard.payload.snapshot.sickBirdsToday, 120);

    const cases = await request('/cases?page=1&limit=5');
    assert.equal(cases.response.status, 200);
    assert.equal(cases.payload.cases.length, 5);
    assert.equal(cases.payload.total, 16);
    assert.equal(cases.payload.totalPages, 4);

    const search = await request('/cases?search=GVF-B104');
    assert.equal(search.payload.total, 1);

    const created = await request('/cases', {
      method: 'POST',
      body: {
        batchId: 'VERIFY-001', farm: 'Verification Farm', batchTotal: 1000, sickBirds: 10,
        symptoms: 'Automated verification case', detectedOn: new Date().toISOString(), severity: 'Mild',
        actionTaken: 'Monitoring', veterinarian: 'Dr. Verification', treatmentStatus: 'Monitoring'
      }
    });
    assert.equal(created.response.status, 201);
    createdCaseId = created.payload.healthCase._id;

    const updated = await request(`/cases/${createdCaseId}`, { method: 'PUT', body: { sickBirds: 8, severity: 'Moderate' } });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.payload.healthCase.sickBirds, 8);

    const vaccinations = await request('/vaccinations');
    assert.equal(vaccinations.payload.vaccinations.length, 7);
    vaccinationBefore = vaccinations.payload.vaccinations.find((item) => item.status === 'Upcoming');
    const completed = await request(`/vaccinations/${vaccinationBefore._id}`, { method: 'PUT', body: { status: 'Completed' } });
    assert.equal(completed.payload.vaccination.status, 'Completed');

    const alerts = await request('/alerts?read=false');
    assert.ok(alerts.payload.alerts.length > 0);
    alertBefore = alerts.payload.alerts[0];
    const markedRead = await request(`/alerts/${alertBefore._id}/read`, { method: 'PUT' });
    assert.equal(markedRead.payload.alert.read, true);

    const records = await request('/records');
    assert.equal(records.payload.records.length, 7);
    const download = await request(`/records/${records.payload.records[0]._id}/download`);
    assert.equal(download.response.status, 200);
    assert.match(download.response.headers.get('content-disposition'), /^attachment;/);
    assert.match(download.payload, /FarmSence AI - Birds Health Record/);

    const deleted = await request(`/cases/${createdCaseId}`, { method: 'DELETE' });
    assert.equal(deleted.response.status, 200);
    createdCaseId = null;

    console.log('Birds Health API verified: auth, dashboard, pagination, search, CRUD, vaccination, alerts, and downloads.');
  } finally {
    if (createdCaseId) await BirdHealthCase.findByIdAndDelete(createdCaseId);
    if (vaccinationBefore) {
      await VaccinationSchedule.findByIdAndUpdate(vaccinationBefore._id, {
        status: vaccinationBefore.status,
        completedAt: vaccinationBefore.completedAt || null
      });
    }
    if (alertBefore) await BirdHealthAlert.findByIdAndUpdate(alertBefore._id, { read: alertBefore.read });
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
