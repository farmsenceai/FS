window.metaDailyRecordEntry = { title: 'Daily Flock Record', subtitle: 'Record or correct daily batch operations' };

let fdrState = { user: null, context: null, choices: [], selected: null, primary: null, effective: null, focus: 'feed' };
const fdrHub = () => window.FarmerCanonicalRecordHub;

function viewDailyRecordEntry(user, focus = 'feed') {
  fdrState.user = user;
  fdrState.focus = focus;
  setTimeout(() => fdrInit(user), 0);
  return `<style>
    .fdr-page{padding:20px;background:#f5f6fa;min-height:100%;font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937}.fdr-shell{display:grid;gap:14px}.fdr-card{background:#fff;border:1px solid #e4e9e5;border-radius:14px;padding:18px}.fdr-entry-title{margin:0 0 16px}.fdr-summary{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap}.fdr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px}.fdr-field{display:flex;flex-direction:column;gap:6px}.fdr-field input,.fdr-field select,.fdr-field textarea{box-sizing:border-box;width:100%;border:1px solid #cbd4cd;border-radius:8px;padding:10px;font:inherit}.fdr-field textarea{min-height:90px}.fdr-span{grid-column:1/-1}.fdr-btn{border:0;border-radius:8px;padding:11px 16px;background:#236b3b;color:#fff;cursor:pointer;font-weight:700}.fdr-btn:disabled{opacity:.6;cursor:not-allowed}.fdr-muted{color:#637068}.fdr-banner,.fdr-success,.fdr-error{padding:12px;border-radius:9px}.fdr-banner{background:#fff4d8;color:#6d5000}.fdr-success{background:#e8f5eb;color:#17632a}.fdr-error{background:#fdeaea;color:#902929}.fdr-empty{text-align:center;padding:44px 18px}.fdr-advanced{margin-top:16px}.fdr-progress{height:8px;background:#e5e7eb;border-radius:999px;overflow:hidden;margin-top:9px}.fdr-progress span{display:block;height:100%;background:#16a34a}.fdr-history{margin-top:10px;padding-top:10px;border-top:1px solid #edf0ed}.fdr-page[data-focus="feed"] [data-fdr-section]:not([data-fdr-section="feed"]),.fdr-page[data-focus="health"] [data-fdr-section]:not([data-fdr-section="health"]),.fdr-page[data-focus="environment"] [data-fdr-section]:not([data-fdr-section="environment"]){display:none}
  </style><section class="fdr-page" id="fdr-root" data-focus="${focus}"><div class="fdr-card fdr-empty">Loading operational context…</div></section>`;
}

async function fdrInit(user = fdrState.user) {
  const root = document.getElementById('fdr-root');
  if (!root) return;
  root.innerHTML = '<div class="fdr-card fdr-empty">Loading assigned farm, active batch, and date…</div>';
  try {
    const shared = await fdrHub().ensureContext(user);
    if (!shared.selected) {
      root.innerHTML = '<div class="fdr-card fdr-empty"><h3>No active assigned batches</h3><p class="fdr-muted">An administrator must assign you to a farm with an active batch before records can be entered.</p></div>';
      return;
    }
    fdrState = { ...fdrState, ...shared, user };
    const { context, selected } = fdrState;
    const entryTitle = { feed: 'Feed & Water Entry', health: 'Bird Health Entry', environment: 'Environment Entry' }[fdrState.focus];
    root.innerHTML = `<div class="fdr-shell">${fdrHub().contextControls(fdrState.choices, context)}<div class="fdr-card fdr-summary"><div><h3 style="margin:0 0 5px">${fdrEsc(selected.farm.name || 'Farm')}</h3><div class="fdr-muted">${fdrEsc(selected.batch.code || selected.batch._id)} · ${fdrEsc(selected.batch.breed || selected.batch.birdType || 'Breed unavailable')}</div></div><div><strong id="fdr-bird-count">${Number(selected.batch.currentBirdCountCached ?? selected.batch.initialBirdCount ?? 0).toLocaleString()}</strong><div class="fdr-muted">current birds</div></div></div><div id="fdr-message"></div><form id="fdr-form" class="fdr-card"><h3 class="fdr-entry-title">${entryTitle}</h3><div id="fdr-mode"></div><div class="fdr-grid"><label class="fdr-field" data-fdr-section="feed"><span>Feed consumed (kg)</span><input name="feedConsumedKg" type="number" min="0" step="0.01"></label><label class="fdr-field" data-fdr-section="feed"><span>Water consumed (litres)</span><input name="waterConsumedLiters" type="number" min="0" step="0.01"></label><label class="fdr-field" data-fdr-section="health"><span>Average weight (grams)</span><input name="avgWeight" type="number" min="0" max="100000" step="1"></label><label class="fdr-field" data-fdr-section="health"><span>Mortality count</span><input name="mortalityCount" type="number" min="0" step="1"></label><label class="fdr-field" data-fdr-section="health"><span>Mortality cause</span><input name="mortalityCause" maxlength="300"></label><label class="fdr-field" data-fdr-section="health"><span>Cull count</span><input name="cullsCount" type="number" min="0" step="1"></label><label class="fdr-field" data-fdr-section="health"><span>Cull reason</span><input name="cullsReason" maxlength="300"></label><label class="fdr-field fdr-span" data-fdr-section="${fdrState.focus}"><span>Observations</span><textarea name="observations" maxlength="2000"></textarea></label></div><div class="fdr-advanced" data-fdr-section="environment"><div class="fdr-grid"><label class="fdr-field"><span>Temperature (°C)</span><input name="temperatureC" type="number" min="0" max="60" step="0.1"></label><label class="fdr-field"><span>Humidity (%)</span><input name="humidityPct" type="number" min="0" max="100" step="0.1"></label><label class="fdr-field"><span>Ammonia (ppm)</span><input name="ammoniaPpm" type="number" min="0" max="1000" step="0.1"></label><label class="fdr-field"><span>CO₂ (ppm)</span><input name="co2Ppm" type="number" min="0" max="100000" step="0.1"></label><label class="fdr-field"><span>Reading source</span><select name="sensorSource"><option value="manual">Manual</option><option value="sensor_device">Sensor device</option><option value="estimated">Estimated</option></select></label></div></div><div id="fdr-completeness"></div><div style="margin-top:18px"><button class="fdr-btn" type="submit">Save ${entryTitle.toLowerCase()}</button></div></form></div>`;
    fdrHub().bindContextControls(context => {
      fdrHub().setContext(context);
      fdrInit(user);
    });
    document.getElementById('fdr-form').addEventListener('input', fdrRenderCompleteness);
    document.getElementById('fdr-form').addEventListener('submit', fdrSubmit);
    await fdrCheckExisting();
  } catch (error) {
    root.innerHTML = `<div class="fdr-card fdr-empty"><h3>${error.status === 403 ? 'Access denied' : 'Could not load daily record'}</h3><p class="fdr-muted">${fdrEsc(error.message)}</p></div>`;
  }
}

async function fdrCheckExisting() {
  const { farmId, batchId, date } = fdrState.context;
  const body = await fdrHub().api(`/farms/${farmId}/batches/${batchId}/records?fromDate=${encodeURIComponent(`${date}T00:00:00.000Z`)}&toDate=${encodeURIComponent(`${date}T23:59:59.999Z`)}&limit=100`);
  const records = body.data || body.records || [];
  fdrState.primary = records.find(record => !record.correctsRecordId) || null;
  const corrections = fdrState.primary ? records.filter(record => String(record.correctsRecordId?._id || record.correctsRecordId || '') === String(fdrState.primary._id)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];
  fdrState.effective = corrections[0] || fdrState.primary;
  document.getElementById('fdr-mode').innerHTML = fdrState.primary ? `<div class="fdr-banner">A primary record already exists for this batch and date. Saving creates an append-only correction; the original remains in the audit history.${corrections.length ? `<div class="fdr-history">${corrections.length} prior correction${corrections.length === 1 ? '' : 's'}.</div>` : ''}</div>` : '<div class="fdr-muted" style="margin-bottom:14px">No record exists for this batch and date. Your first save creates the single primary record.</div>';
  document.querySelector('#fdr-form button[type="submit"]').textContent = fdrState.primary ? 'Save correction' : 'Save daily record';
  if (fdrState.effective) fdrPopulate(fdrState.effective); else fdrClearValues();
  fdrRenderCompleteness();
}

function fdrPayload() {
  const form = new FormData(document.getElementById('fdr-form'));
  const number = name => form.get(name) === '' ? undefined : Number(form.get(name));
  const text = name => String(form.get(name) || '').trim() || undefined;
  const payload = {
    recordDate: fdrState.context.date,
    feed: { consumedKg: number('feedConsumedKg') },
    water: { consumedLiters: number('waterConsumedLiters') },
    mortality: { count: number('mortalityCount'), cause: text('mortalityCause') },
    culls: { count: number('cullsCount'), reason: text('cullsReason') },
    avgWeightGrams: number('avgWeight'),
    observations: text('observations')
  };
  const sensors = { temperatureC: number('temperatureC'), humidityPct: number('humidityPct'), ammoniaPpm: number('ammoniaPpm'), co2Ppm: number('co2Ppm'), source: form.get('sensorSource') };
  if (Object.values(sensors).some(value => value !== undefined && value !== '' && value !== 'manual')) payload.sensorReadings = sensors;
  return payload;
}

function fdrValidatePayload(payload) {
  const errors = [];
  const losses = Number(payload.mortality.count || 0) + Number(payload.culls.count || 0);
  const available = Number(fdrState.selected.batch.initialBirdCount || 0);
  if (losses > available) errors.push(`Mortality and culls cannot exceed the initial batch count of ${available.toLocaleString()}.`);
  if (payload.mortality.count > 0 && !payload.mortality.cause) errors.push('Enter a mortality cause when mortality is greater than zero.');
  if (payload.culls.count > 0 && !payload.culls.reason) errors.push('Enter a cull reason when culls are greater than zero.');
  return errors;
}

async function fdrSubmit(event) {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button[type="submit"]');
  const message = document.getElementById('fdr-message');
  const payload = fdrPayload();
  const validation = fdrValidatePayload(payload);
  if (validation.length) {
    message.innerHTML = `<div class="fdr-error">${validation.map(fdrEsc).join('<br>')}</div>`;
    return;
  }
  button.disabled = true;
  message.innerHTML = '';
  try {
    const { farmId, batchId } = fdrState.context;
    const base = `/farms/${farmId}/batches/${batchId}/records`;
    const path = fdrState.primary ? `${base}/${fdrState.primary._id}/correct` : base;
    await fdrHub().api(path, { method: 'POST', body: JSON.stringify(payload) });
    const batchBody = await fdrHub().api(`/farms/${farmId}/batches/${batchId}`);
    const batch = batchBody.batch || batchBody.data || batchBody;
    fdrState.selected.batch = batch;
    document.getElementById('fdr-bird-count').textContent = Number(batch.currentBirdCountCached ?? batch.initialBirdCount ?? 0).toLocaleString();
    message.innerHTML = '<div class="fdr-success">Daily record saved successfully. The effective record and completeness status have been refreshed.</div>';
    await fdrCheckExisting();
  } catch (error) {
    const details = Array.isArray(error.details) ? `<br>${error.details.map(fdrEsc).join('<br>')}` : '';
    message.innerHTML = `<div class="fdr-error">${error.status === 403 ? 'Access denied: ' : ''}${fdrEsc(error.message)}${details}</div>`;
  } finally {
    button.disabled = false;
  }
}

function fdrPopulate(record) {
  const form = document.getElementById('fdr-form');
  const set = (name, value) => { if (form.elements[name]) form.elements[name].value = value == null ? '' : value; };
  set('feedConsumedKg', record.feed?.consumedKg);
  set('waterConsumedLiters', record.water?.consumedLiters);
  set('avgWeight', record.avgWeightGrams);
  set('mortalityCount', record.mortality?.count);
  set('mortalityCause', record.mortality?.cause);
  set('cullsCount', record.culls?.count);
  set('cullsReason', record.culls?.reason);
  set('observations', record.observations);
  const sensor = record.sensorReadings || {};
  set('temperatureC', sensor.temperatureC);
  set('humidityPct', sensor.humidityPct);
  set('ammoniaPpm', sensor.ammoniaPpm);
  set('co2Ppm', sensor.co2Ppm);
  set('sensorSource', sensor.source || 'manual');
}

function fdrClearValues() {
  document.querySelectorAll('#fdr-form input,#fdr-form textarea').forEach(input => { input.value = ''; });
  document.querySelector('[name="sensorSource"]').value = 'manual';
}

function fdrRenderCompleteness() {
  const payload = fdrPayload();
  const status = fdrHub().completeness(payload);
  const element = document.getElementById('fdr-completeness');
  if (!element) return;
  element.innerHTML = `<div class="fdr-muted" style="margin-top:16px"><strong>Completeness: ${status.percent}%</strong> · ${status.completed} of ${status.total} sections complete<div class="fdr-progress"><span style="width:${status.percent}%"></span></div></div>`;
}

function fdrApplyFocus(focus) {
  const targets = {
    feed: document.querySelector('[name="feedConsumedKg"]'),
    health: document.querySelector('[name="mortalityCount"]'),
    environment: document.querySelector('[name="temperatureC"]')
  };
  const target = targets[focus];
  if (!target) return;
  if (focus === 'environment') document.querySelector('.fdr-advanced').open = true;
  target.closest('.fdr-field')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => target.focus(), 250);
}

function fdrEsc(value) { return fdrHub().escape(value); }
