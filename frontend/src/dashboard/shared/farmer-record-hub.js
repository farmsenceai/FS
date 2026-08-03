(function () {
  const STORAGE_KEY = 'farmsense_farmer_operational_context';
  let choicesCache = null;

  async function api(path, options = {}) {
    const response = await fetch(`/api/v2${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('fs_token') || ''}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.error || body.message || body.msg || `Request failed (${response.status})`);
      error.status = response.status;
      error.details = body.details;
      throw error;
    }
    return body;
  }

  function today() {
    const date = new Date();
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  function escape(value) { const div = document.createElement('div'); div.textContent = value == null ? '' : String(value); return div.innerHTML; }
  function getContext() {
    try { return { date: today(), ...JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}') }; }
    catch (_error) { return { farmId: '', batchId: '', date: today() }; }
  }
  function setContext(next) {
    const context = { ...getContext(), ...next };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    return context;
  }

  async function loadChoices(user, refresh = false) {
    if (choicesCache && !refresh) return choicesCache;
    const userId = user && (user.id || user._id || user.userId);
    if (!userId) throw new Error('Your signed-in user ID is unavailable. Please sign in again.');
    const assignmentBody = await api(`/users/${encodeURIComponent(userId)}/assignments`);
    const assignments = assignmentBody.assignments || [];
    const groups = await Promise.all(assignments.map(async assignment => {
      const farmId = assignment.farmId?._id || assignment.farmId;
      const [farmBody, batchBody] = await Promise.all([
        api(`/farms/${farmId}`),
        api(`/farms/${farmId}/batches?status=active&limit=100`)
      ]);
      const farm = farmBody.farm || farmBody.data || farmBody;
      return (batchBody.data || batchBody.batches || []).map(batch => ({ farm, batch }));
    }));
    choicesCache = groups.flat();
    return choicesCache;
  }

  async function ensureContext(user) {
    const choices = await loadChoices(user);
    const saved = getContext();
    const selected = choices.find(choice =>
      String(choice.farm._id) === String(saved.farmId) &&
      String(choice.batch._id) === String(saved.batchId)
    ) || choices[0];
    if (!selected) return { choices, context: saved, selected: null };
    const context = setContext({
      farmId: String(selected.farm._id),
      batchId: String(selected.batch._id),
      date: saved.date || today()
    });
    return { choices, context, selected };
  }

  function contextControls(choices, context) {
    return `<div class="fcrh-context"><label><span>Assigned farm and active batch</span><select id="fcrh-context-batch">${choices.map(({ farm, batch }) => {
      const value = `${farm._id}|${batch._id}`;
      const selected = String(context.farmId) === String(farm._id) && String(context.batchId) === String(batch._id);
      return `<option value="${escape(value)}" ${selected ? 'selected' : ''}>${escape(farm.name)} · ${escape(batch.code || batch._id)} · ${escape(batch.breed || batch.birdType || 'Breed unavailable')}</option>`;
    }).join('')}</select></label><label><span>Operational date</span><input id="fcrh-context-date" type="date" max="${today()}" value="${escape(context.date)}"></label></div>`;
  }

  function bindContextControls(onChange) {
    const batch = document.getElementById('fcrh-context-batch');
    const date = document.getElementById('fcrh-context-date');
    const apply = () => {
      const [farmId, batchId] = batch.value.split('|');
      const context = setContext({ farmId, batchId, date: date.value || today() });
      onChange(context);
    };
    batch?.addEventListener('change', apply);
    date?.addEventListener('change', apply);
  }

  function effectiveRecords(records) {
    const primaries = records.filter(record => !record.correctsRecordId);
    return primaries.map(primary => {
      const corrections = records
        .filter(record => String(record.correctsRecordId?._id || record.correctsRecordId || '') === String(primary._id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const effective = corrections[0] || primary;
      return { ...effective, originalRecordId: primary._id, correctionCount: corrections.length };
    });
  }

  function completeness(record) {
    const sections = {
      feedWater: record?.feed?.consumedKg != null && record?.water?.consumedLiters != null,
      health: record?.mortality?.count != null && record?.culls?.count != null && record?.avgWeightGrams != null,
      environment: record?.sensorReadings?.temperatureC != null && record?.sensorReadings?.humidityPct != null
    };
    const completed = Object.values(sections).filter(Boolean).length;
    return { sections, completed, total: 3, percent: Math.round(completed / 3 * 100) };
  }

  function reading(record, focus) {
    if (focus === 'feed') return `Feed: ${record.feed?.consumedKg ?? '—'} kg · Water: ${record.water?.consumedLiters ?? '—'} L`;
    if (focus === 'health') return `Mortality: ${record.mortality?.count ?? '—'} · Culls: ${record.culls?.count ?? '—'} · Avg weight: ${record.avgWeightGrams ?? '—'} g`;
    const sensor = record.sensorReadings || {};
    return `Temperature: ${sensor.temperatureC ?? '—'} °C · Humidity: ${sensor.humidityPct ?? '—'}% · Ammonia: ${sensor.ammoniaPpm ?? '—'} ppm · CO₂: ${sensor.co2Ppm ?? '—'} ppm`;
  }

  function openRecord(context, focus) {
    setContext(context);
    history.replaceState({}, document.title, location.pathname);
    window.farmerRecordEntryFocus = focus;
    document.querySelector('.db-sidebar-link[data-page="DailyRecordEntry"]')?.click();
  }

  async function load(config, user) {
    const root = document.getElementById('fcrh-root');
    if (!root) return;
    try {
      const state = await ensureContext(user);
      if (!state.choices.length) {
        root.innerHTML = '<div class="fcrh-card fcrh-empty"><h3>No active assigned batches</h3><p>An administrator must assign you to a farm with an active batch.</p></div>';
        return;
      }
      const { context, selected } = state;
      const start = `${context.date}T00:00:00.000Z`;
      const end = `${context.date}T23:59:59.999Z`;
      const body = await api(`/farms/${context.farmId}/batches/${context.batchId}/records?fromDate=${encodeURIComponent(start)}&toDate=${encodeURIComponent(end)}&limit=100`);
      const records = effectiveRecords(body.data || body.records || []);
      const record = records[0] || null;
      const status = completeness(record);
      root.innerHTML = `${contextControls(state.choices, context)}<div class="fcrh-callout"><div><h3>${escape(config.actionTitle)}</h3><p>${escape(selected.farm.name)} · ${escape(selected.batch.code || selected.batch._id)} · ${new Date(`${context.date}T00:00:00`).toLocaleDateString()}</p></div><button class="fcrh-btn" id="fcrh-open">${record ? 'Review or correct record' : escape(config.actionLabel)}</button></div><section class="fcrh-card"><div class="fcrh-status-head"><div><h3>Daily completeness</h3><div class="fcrh-sub">${status.completed} of ${status.total} operational sections complete</div></div><strong>${status.percent}%</strong></div><div class="fcrh-progress"><span style="width:${status.percent}%"></span></div><div class="fcrh-pills"><span class="${status.sections.feedWater ? 'done' : ''}">Feed & water</span><span class="${status.sections.health ? 'done' : ''}">Bird health</span><span class="${status.sections.environment ? 'done' : ''}">Environment</span></div></section><section class="fcrh-card"><h3>${record ? 'Effective daily record' : 'No daily record'}</h3>${record ? `<div class="fcrh-row"><time>${new Date(record.recordDate).toLocaleDateString()}</time><span>${escape(reading(record, config.focus))}</span></div>${record.correctionCount ? `<div class="fcrh-note">${record.correctionCount} append-only correction${record.correctionCount === 1 ? '' : 's'} recorded; latest values are shown.</div>` : ''}` : '<div class="fcrh-empty-small">No values have been submitted for this batch and date. Missing values are shown as unavailable, never as zero.</div>'}</section>`;
      document.getElementById('fcrh-open').addEventListener('click', () => openRecord(context, config.focus));
      bindContextControls(() => load(config, user));
    } catch (error) {
      root.innerHTML = `<div class="fcrh-card fcrh-empty"><h3>${error.status === 403 ? 'Access denied' : 'Could not load operational records'}</h3><p>${escape(error.message)}</p></div>`;
    }
  }

  function render(config, user) {
    setTimeout(() => load(config, user), 0);
    return `<style>.fcrh-page{padding:20px;background:#f5f6fa;min-height:100%;font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937}.fcrh-context{display:grid;grid-template-columns:minmax(260px,2fr) minmax(170px,1fr);gap:12px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:14px;margin-bottom:14px}.fcrh-context label{display:flex;flex-direction:column;gap:5px}.fcrh-context span{font-size:11px;font-weight:700;color:#4b5563}.fcrh-context select,.fcrh-context input{box-sizing:border-box;width:100%;padding:9px;border:1px solid #cbd5e1;border-radius:8px;background:#fff}.fcrh-callout,.fcrh-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:17px;margin-bottom:14px}.fcrh-callout{display:flex;align-items:center;justify-content:space-between;gap:14px;border-left:4px solid #16a34a;background:#f0fdf4}.fcrh-callout h3,.fcrh-card h3{margin:0 0 5px}.fcrh-callout p,.fcrh-sub{margin:0;color:#6b7280}.fcrh-btn{border:0;border-radius:8px;padding:10px 13px;background:#166534;color:#fff;font-weight:700;cursor:pointer}.fcrh-status-head{display:flex;justify-content:space-between;align-items:center}.fcrh-progress{height:8px;background:#e5e7eb;border-radius:999px;overflow:hidden;margin:12px 0}.fcrh-progress span{display:block;height:100%;background:#16a34a}.fcrh-pills{display:flex;gap:8px;flex-wrap:wrap}.fcrh-pills span{padding:4px 8px;border-radius:999px;background:#f3f4f6;color:#6b7280}.fcrh-pills .done{background:#dcfce7;color:#166534}.fcrh-row{display:grid;grid-template-columns:110px 1fr;gap:12px;padding:9px 0}.fcrh-row time,.fcrh-note,.fcrh-empty-small{color:#6b7280}.fcrh-note{padding-top:9px;border-top:1px solid #eef0f2}.fcrh-empty{text-align:center;padding:38px}@media(max-width:650px){.fcrh-context{grid-template-columns:1fr}.fcrh-callout{align-items:stretch;flex-direction:column}.fcrh-row{grid-template-columns:1fr}}</style><section class="fcrh-page" id="fcrh-root"><div class="fcrh-card fcrh-empty">Loading assigned farm, batch, and date…</div></section>`;
  }

  window.FarmerCanonicalRecordHub = {
    api, bindContextControls, completeness, contextControls, effectiveRecords,
    ensureContext, escape, getContext, render, setContext, today
  };
})();
