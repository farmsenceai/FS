/* views/Environment.js - MongoDB-backed Business Dashboard view */

window.metaEnvironment = { title: 'Environment Management', subtitle: 'Monitor and control environmental conditions for optimal bird health and productivity.' };

const ENV_API = '/api/environment';
const envState = { page: 1, limit: 5, search: '', status: 'All', readings: new Map(), parameters: [], alerts: [], records: [], snapshot: null, trendDays: 7 };

function envEscape(value) { return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
function envToken() { return localStorage.getItem('fs_token'); }
function envFormat(value, digits = 0) { return Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits }); }
function envDateInput(value) { return value ? new Date(value).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16); }
function envLoading() { return '<div class="env-loading">Loading live environment data…</div>'; }
function envEmpty(message) { return `<div class="env-empty">${envEscape(message)}</div>`; }

async function envFetch(path, options = {}) {
  const response = await fetch(`${ENV_API}${path}`, { ...options, headers: { Authorization: `Bearer ${envToken()}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) } });
  if (response.status === 401 || response.status === 403) { window.location.href = '/src/pages/sign-in.html'; throw new Error('Your session is not authorized for Environment Management.'); }
  const type = response.headers.get('content-type') || '';
  const data = type.includes('application/json') ? await response.json() : await response.blob();
  if (!response.ok) throw new Error(data.message || 'Environment request failed.');
  return data;
}

function envToast(message, type = 'success') {
  let toast = document.getElementById('env-toast');
  if (!toast) { toast = document.createElement('div'); toast.id = 'env-toast'; document.body.appendChild(toast); }
  toast.className = `env-toast ${type}`; toast.textContent = message; setTimeout(() => { toast.className = 'env-toast'; }, 2600);
}

function envModal(title, body, wide = false) {
  const host = document.getElementById('env-modal-host');
  host.innerHTML = `<div class="env-backdrop" data-close-modal></div><section class="env-modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${envEscape(title)}"><header><h3>${envEscape(title)}</h3><button type="button" data-close-modal aria-label="Close">×</button></header><div class="env-modal-body">${body}</div></section>`;
  host.classList.add('open');
}
function envCloseModal() { const host = document.getElementById('env-modal-host'); if (host) { host.innerHTML = ''; host.classList.remove('open'); } }

function envStat(icon, bg, label, value, sub, direction, change) { return `<article class="env-stat"><b style="background:${bg}">${icon}</b><span>${label}</span><strong>${value}</strong><small>${sub}</small><em class="${direction}"><i class="fa-solid fa-arrow-trend-${direction === 'up' ? 'up' : 'down'}"></i> ${change}</em></article>`; }

function envTrendLegacy(points) {
  const items = points.slice(-envState.trendDays); if (!items.length) return envEmpty('No trend data is available.');
  const series = [{ key: 'temperatureC', color: '#ef4444' }, { key: 'humidityPct', color: '#3b82f6' }, { key: 'ammoniaPpm', color: '#16a34a' }, { key: 'co2Ppm', color: '#8b5cf6' }];
  const w = 460, h = 180, left = 25, top = 15, plotW = 420, plotH = 130;
  const lines = series.map(({ key, color }) => {
    const values = items.map((item) => item[key]), min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
    const coords = items.map((item, index) => ({ x: left + (items.length === 1 ? plotW / 2 : index * plotW / (items.length - 1)), y: top + plotH - ((item[key] - min) / range * plotH), item }));
    return `<polyline points="${coords.map((p) => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.3"/>${coords.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${color}"><title>${envEscape(p.item.label)}: ${envFormat(p.item[key], key === 'co2Ppm' ? 0 : 1)}</title></circle>`).join('')}`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" class="env-chart" role="img" aria-label="Environment trend">${[0, 1, 2, 3].map((i) => `<line x1="${left}" y1="${top + i * plotH / 3}" x2="${left + plotW}" y2="${top + i * plotH / 3}" stroke="#eef0f4"/>`).join('')}${lines}${items.map((item, index) => `<text x="${left + (items.length === 1 ? plotW / 2 : index * plotW / (items.length - 1))}" y="170" text-anchor="middle" font-size="8" fill="#8b93a5">${envEscape(item.label)}</text>`).join('')}</svg>`;
}

async function envLoadDashboardLegacy() {
  const data = await envFetch('/dashboard'), s = data.snapshot; envState.snapshot = s;
  document.getElementById('env-stats').innerHTML = [
    envStat('T', '#dcfce7', 'Temperature (Avg.)', `${envFormat(s.averageTemperatureC, 1)} °C`, '', 'up', `${Math.abs(s.averageTemperatureC - s.previousTemperatureC).toFixed(1)}°C vs yesterday`),
    envStat('H', '#cffafe', 'Humidity (Avg.)', `${envFormat(s.averageHumidityPct, 1)}%`, '', 'up', `${Math.abs(s.averageHumidityPct - s.previousHumidityPct).toFixed(1)}% vs yesterday`),
    envStat('AQ', '#f0fdf4', 'Air Quality Index', envFormat(s.airQualityIndex), 'Good', s.airQualityIndex <= s.previousAirQualityIndex ? 'down' : 'up', `${Math.abs(s.airQualityIndex - s.previousAirQualityIndex)} vs yesterday`),
    envStat('A', '#fef3c7', 'Ammonia (Avg.)', `${envFormat(s.averageAmmoniaPpm, 1)} ppm`, '', s.averageAmmoniaPpm <= s.previousAmmoniaPpm ? 'down' : 'up', `${Math.abs(s.averageAmmoniaPpm - s.previousAmmoniaPpm).toFixed(1)} ppm vs yesterday`),
    envStat('C', '#f3f4f6', 'CO2 (Avg.)', `${envFormat(s.averageCo2Ppm)} ppm`, '', s.averageCo2Ppm <= s.previousCo2Ppm ? 'down' : 'up', `${Math.abs(s.averageCo2Ppm - s.previousCo2Ppm)} ppm vs yesterday`),
    envStat('S', '#d1fae5', 'Environment Score', `${s.environmentScore} / 100`, 'Excellent', 'up', `${s.environmentScore - s.previousEnvironmentScore} vs last week`)
  ].join('');
  document.getElementById('env-trend').innerHTML = envTrend(s.trend);
  envRenderDistribution(s.distribution);
  document.getElementById('env-tips').innerHTML = s.tips.slice(0, 5).map((tip) => `<div class="env-tip"><b><i class="fa-solid fa-check"></i></b><span>${envEscape(tip)}</span></div>`).join('');
}

async function envLoadParametersLegacy() {
  const data = await envFetch('/parameters'); envState.parameters = data.parameters;
  document.getElementById('env-parameters').innerHTML = data.parameters.map((item) => `<div class="env-parameter"><b>${envEscape(item.icon)}</b><span><small>${envEscape(item.label)}</small><strong>${envFormat(item.value, Number.isInteger(item.value) ? 0 : 1)} ${envEscape(item.unit)}</strong></span><em><i class="env-badge ${item.status}">${envEscape(item.status)}</i><small>${envEscape(item.acceptableRange)}</small></em></div>`).join('');
}

function envRenderDistribution(items) {
  const circumference = 251.3; let offset = 0;
  const arcs = items.map((item) => { const len = item.percentage / 100 * circumference, result = `<circle cx="50" cy="50" r="40" fill="none" stroke="${item.color}" stroke-width="14" stroke-dasharray="${len} ${circumference}" stroke-dashoffset="-${offset}"/>`; offset += len; return result; }).join('');
  document.getElementById('env-distribution').innerHTML = `<svg viewBox="0 0 100 100"><g transform="rotate(-90 50 50)">${arcs}</g><text x="50" y="47" text-anchor="middle" font-size="10" font-weight="800">All Houses</text><text x="50" y="58" text-anchor="middle" font-size="7" fill="#6b7280">Overall Status</text></svg><div>${items.map((item) => `<p><i style="background:${item.color}"></i>${envEscape(item.label)}: ${item.percentage}% (${item.count})</p>`).join('')}</div>`;
}

async function envLoadReadingsLegacy() {
  const query = new URLSearchParams({ page: envState.page, limit: envState.limit, search: envState.search, status: envState.status });
  const data = await envFetch(`/readings?${query}`); envState.readings = new Map(data.readings.map((item) => [item._id, item]));
  document.getElementById('env-reading-body').innerHTML = data.readings.length ? data.readings.map((item) => `<tr><td><strong>${envEscape(item.batchId)}</strong><small>${envEscape(item.farm)}${item.source === 'farmer' ? ' · Farmer submission' : ''}</small></td><td>${envEscape(item.house)}</td><td>${envFormat(item.birds)}</td><td>${envFormat(item.temperatureC, 1)}°C</td><td>${envFormat(item.humidityPct, 1)}%</td><td>${envFormat(item.ammoniaPpm, 1)} ppm</td><td>${envFormat(item.co2Ppm)} ppm</td><td>${envEscape(item.airQualityLabel)} (${envFormat(item.airQualityIndex)})</td><td><i class="env-badge ${item.status}">${envEscape(item.status)}</i></td></tr>`).join('') : `<tr><td colspan="9">${envEmpty('No environment readings match these filters.')}</td></tr>`;
  document.getElementById('env-pagination').innerHTML = `<button type="button" data-page="${Math.max(1, data.page - 1)}" ${data.page <= 1 ? 'disabled' : ''}>‹</button>${Array.from({ length: data.totalPages }, (_, i) => i + 1).map((page) => `<button type="button" data-page="${page}" class="${page === data.page ? 'active' : ''}">${page}</button>`).join('')}<button type="button" data-page="${Math.min(data.totalPages, data.page + 1)}" ${data.page >= data.totalPages ? 'disabled' : ''}>›</button>`;
}

async function envLoadParameters() {
  const [data, canonical] = await Promise.all([envFetch('/parameters'), window.FarmSenseCanonicalOperations.load()]);
  const latest = canonical.records.filter(record => record.sensorReadings).sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate))[0]?.sensorReadings || {};
  const targets = canonical.facilities.find(facility => facility.environmentTargets && Object.values(facility.environmentTargets).some(Number.isFinite))?.environmentTargets || {};
  const definitions = [
    { test: /temperature/i, value: latest.temperatureC, range: Number.isFinite(targets.temperatureMin) || Number.isFinite(targets.temperatureMax) ? `${targets.temperatureMin ?? '—'}–${targets.temperatureMax ?? '—'} °C` : null },
    { test: /humidity/i, value: latest.humidityPct, range: Number.isFinite(targets.humidityMin) || Number.isFinite(targets.humidityMax) ? `${targets.humidityMin ?? '—'}–${targets.humidityMax ?? '—'}%` : null },
    { test: /ammonia/i, value: latest.ammoniaPpm, range: Number.isFinite(targets.ammoniaMax) ? `≤ ${targets.ammoniaMax} ppm` : null },
    { test: /co2/i, value: latest.co2Ppm, range: Number.isFinite(targets.co2Max) ? `≤ ${targets.co2Max} ppm` : null }
  ];
  envState.parameters = data.parameters.map(item => { const definition = definitions.find(candidate => candidate.test.test(item.label)); return definition ? { ...item, value: definition.value, acceptableRange: definition.range || item.acceptableRange } : item; });
  document.getElementById('env-parameters').innerHTML = envState.parameters.map(item => `<div class="env-parameter"><b>${envEscape(item.icon)}</b><span><small>${envEscape(item.label)}</small><strong>${Number.isFinite(item.value) ? `${envFormat(item.value, Number.isInteger(item.value) ? 0 : 1)} ${envEscape(item.unit)}` : 'Not reported'}</strong></span><em><i class="env-badge ${item.status}">${envEscape(item.status)}</i><small>${envEscape(item.acceptableRange)}</small></em></div>`).join('');
}

function envAlertRow(item) { return `<div class="env-alert ${item.read ? 'read' : ''}"><i class="${item.severity}"></i><span><strong>${envEscape(item.title)}</strong><small>${new Date(item.occurredAt).toLocaleString('en-IN')}</small></span><em class="env-badge ${item.severity}">${item.severity}</em></div>`; }
async function envLoadAlerts() { const data = await envFetch('/alerts'); envState.alerts = data.alerts; document.getElementById('env-alerts').innerHTML = data.alerts.slice(0, 4).map((item) => envAlertRow(item)).join('') || envEmpty('No environment alerts.'); }

async function envLoadRecords() {
  const data = await envFetch('/records'); envState.records = data.records;
  document.getElementById('env-records').innerHTML = data.records.slice(0, 5).map((item) => `<div class="env-record"><b>D</b><span><strong>${envEscape(item.title)}</strong><small>${new Date(item.recordedAt).toLocaleString('en-IN')}</small></span><button type="button" data-download-record="${item._id}" aria-label="Download ${envEscape(item.title)}">Download</button></div>`).join('') || envEmpty('No environmental records.');
}

function envParametersModal() { envModal('Environmental Parameters', `<div class="env-modal-list">${envState.parameters.map((item) => `<div class="env-modal-row"><span><strong>${envEscape(item.label)}</strong><small>${envFormat(item.value, Number.isInteger(item.value) ? 0 : 1)} ${envEscape(item.unit)} · ${envEscape(item.status)} · ${envEscape(item.acceptableRange)}</small></span></div>`).join('')}</div>`); }
function envAlertsModal() { envModal('Environment Alerts', `<div class="env-modal-list">${envState.alerts.map((item) => envAlertRow(item)).join('')}</div>`, true); }
function envDistributionModal() { envModal('Environmental Parameter Distribution', `<table class="env-table"><thead><tr><th>Status</th><th>Percentage</th><th>Houses</th></tr></thead><tbody>${envState.snapshot.distribution.map((item) => `<tr><td><i class="env-color" style="background:${item.color}"></i>${envEscape(item.label)}</td><td>${item.percentage}%</td><td>${item.count}</td></tr>`).join('')}</tbody></table>`); }
function envTipsModal() { envModal('Environment Tips', envState.snapshot.tips.map((tip) => `<div class="env-tip"><b><i class="fa-solid fa-check"></i></b><span>${envEscape(tip)}</span></div>`).join('')); }
function envRecordsModal() { envModal('Environmental Records', `<div class="env-modal-list">${envState.records.map((item) => `<div class="env-modal-row"><span><strong>${envEscape(item.title)}</strong><small>${new Date(item.recordedAt).toLocaleString('en-IN')}</small></span><button type="button" data-download-record="${item._id}">Download</button></div>`).join('')}</div>`, true); }

async function envDownload(path, filename) { const blob = await envFetch(path), url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url); envToast('Environment report downloaded.'); }

function envWireEvents() {
  const root = document.getElementById('env-root');
  root.addEventListener('click', async (event) => {
    if (event.target.matches('[data-close-modal]')) { envCloseModal(); return; }
    const button = event.target.closest('button'); if (!button) return;
    try {
      if (button.id === 'env-refresh') await envRefresh(); else if (button.id === 'env-download-summary') await envDownload('/report/download', 'environment-summary.txt');
      else if (button.dataset.page) { envState.page = Number(button.dataset.page); await envLoadReadings(); }
      else if (button.dataset.viewParameters !== undefined) envParametersModal(); else if (button.dataset.viewAlerts !== undefined) envAlertsModal(); else if (button.dataset.viewDistribution !== undefined) envDistributionModal(); else if (button.dataset.viewTips !== undefined) envTipsModal(); else if (button.dataset.viewRecords !== undefined) envRecordsModal(); else if (button.dataset.downloadRecord) await envDownload(`/records/${button.dataset.downloadRecord}/download`, 'environment-record.txt');
    } catch (error) { envToast(error.message, 'error'); }
  });
  document.getElementById('env-search').addEventListener('input', (event) => { clearTimeout(window.envSearchTimer); window.envSearchTimer = setTimeout(() => { envState.search = event.target.value.trim(); envState.page = 1; envLoadReadings().catch((error) => envToast(error.message, 'error')); }, 300); });
  document.getElementById('env-status-filter').addEventListener('change', (event) => { envState.status = event.target.value; envState.page = 1; envLoadReadings().catch((error) => envToast(error.message, 'error')); });
  document.getElementById('env-trend-days').addEventListener('change', (event) => { envState.trendDays = Number(event.target.value); document.getElementById('env-trend').innerHTML = envTrend(envState.snapshot?.trend || []); });
}

async function envRefresh() { await Promise.all([envLoadDashboard(), envLoadParameters(), envLoadReadings(), envLoadAlerts(), envLoadRecords()]); envToast('Environment data refreshed.'); }
async function initEnvironment() { envWireEvents(); try { await Promise.all([envLoadDashboard(), envLoadParameters(), envLoadReadings(), envLoadAlerts(), envLoadRecords()]); } catch (error) { envToast(error.message, 'error'); } }

function injectEnvironmentStyles() {
  if (document.getElementById('environment-styles')) return;
  const style = document.createElement('style'); style.id = 'environment-styles'; style.textContent = `
    .env-page{padding:20px;background:#f5f6fa;min-height:100%;font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033}.env-page button,.env-page input,.env-page select,.env-page textarea{font:inherit}.env-toolbar,.env-toolbar-actions,.env-filters{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.env-toolbar{justify-content:space-between;margin-bottom:14px}.env-page button{border:1px solid #dfe3ea;background:#fff;border-radius:6px;padding:7px 10px;cursor:pointer;color:#344054}.env-page button:hover{border-color:#16a34a}.env-page button.primary{background:#16a34a;color:#fff;border-color:#16a34a}.env-page button.danger,.env-actions .danger{color:#dc2626}.env-page button:disabled{opacity:.45;cursor:not-allowed}.env-stats{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:16px}.env-stat,.env-card{background:#fff;border:1px solid #e8eaf0;border-radius:10px}.env-stat{padding:13px}.env-stat>b{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;margin-bottom:7px}.env-stat>span,.env-stat>small{display:block;color:#6b7280;font-size:10px}.env-stat>strong{display:block;font-size:20px;margin:3px 0}.env-stat>em{font-size:9px;font-style:normal;font-weight:700}.env-stat>em.up{color:#16a34a}.env-stat>em.down{color:#ef4444}.env-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}.env-grid-alerts{display:grid;grid-template-columns:1fr 2fr;gap:16px;margin-bottom:16px}.env-card{overflow:hidden;margin-bottom:16px}.env-grid-2 .env-card,.env-grid-alerts .env-card{margin-bottom:0}.env-card-header{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 16px;border-bottom:1px solid #f0f2f5}.env-card-header h3{font-size:13px;margin:0}.env-link{border:0!important;color:#16a34a!important;background:transparent!important;padding:2px!important;font-weight:700}.env-card-body{padding:14px 16px}.env-legend{display:flex;gap:14px;flex-wrap:wrap;color:#6b7280;font-size:10px}.env-legend i,.env-color{display:inline-block;width:11px;height:4px;border-radius:3px;margin-right:4px}.env-chart{width:100%;height:205px}.env-parameter{display:flex;gap:10px;align-items:center;padding:8px;border:1px solid #eef0f4;border-radius:7px;margin-bottom:7px}.env-parameter>b{width:32px;height:32px;border-radius:7px;background:#ecfdf3;display:grid;place-items:center}.env-parameter>span{flex:1}.env-parameter span small,.env-parameter span strong,.env-parameter em small{display:block}.env-parameter em{text-align:right;font-style:normal}.env-parameter small{color:#8b93a5;font-size:9px}.env-badge{display:inline-block;border-radius:5px;padding:3px 7px;font-size:10px;font-style:normal;font-weight:700;background:#eef2f7}.env-badge.optimal,.env-badge.good,.env-badge.excellent,.env-badge.normal{background:#d1fae5;color:#047857}.env-badge.moderate,.env-badge.warning{background:#fef3c7;color:#b45309}.env-badge.poor,.env-badge.critical,.env-badge.high{background:#fee2e2;color:#b91c1c}.env-table-wrap{overflow:auto}.env-table{width:100%;border-collapse:collapse}.env-table th{background:#f9fafb;color:#8991a2;text-transform:uppercase;letter-spacing:.35px;font-size:10px;text-align:left;padding:9px 11px;white-space:nowrap}.env-table td{border-top:1px solid #f3f4f6;padding:9px 11px;font-size:11px;white-space:nowrap}.env-table td small{display:block;color:#9ca3af}.env-actions{display:flex;gap:4px}.env-actions button{font-size:10px;padding:3px 6px}.env-pagination{display:flex;justify-content:center;gap:4px;padding:10px}.env-pagination button{min-width:29px;padding:5px}.env-pagination button.active{background:#16a34a;color:#fff;border-color:#16a34a}.env-alert,.env-record{display:flex;align-items:center;gap:9px;padding:10px 14px;border-bottom:1px solid #f3f4f6}.env-alert>i{width:9px;height:9px;border-radius:50%;background:#10b981}.env-alert>i.warning{background:#f59e0b}.env-alert>i.high{background:#ef4444}.env-alert>span,.env-record>span{flex:1;min-width:0}.env-alert span strong,.env-alert span small,.env-record span strong,.env-record span small{display:block}.env-alert small,.env-record small{font-size:9px;color:#8b93a5;margin-top:2px}.env-alert.read{opacity:.62}.env-alert button,.env-record button{font-size:9px;padding:4px 6px}.env-record>b{width:30px;height:30px;border-radius:6px;background:#f3f4f6;display:grid;place-items:center}.env-distribution{display:grid;grid-template-columns:145px 1fr;gap:15px;align-items:center;padding:14px}.env-distribution svg{width:140px}.env-distribution p{font-size:11px;margin:8px 0}.env-distribution i{width:10px;height:10px}.env-tip{display:flex;gap:8px;align-items:flex-start;background:#f0fdf4;color:#065f46;border-radius:6px;padding:9px;margin-bottom:7px;font-size:10px}.env-loading,.env-empty{text-align:center;color:#8b93a5;padding:24px}.env-modal-host{display:none}.env-modal-host.open{display:block;position:fixed;inset:0;z-index:1000}.env-backdrop{position:absolute;inset:0;background:#11182788}.env-modal{position:relative;background:#fff;width:min(600px,calc(100% - 30px));max-height:88vh;overflow:auto;margin:6vh auto;border-radius:12px;box-shadow:0 24px 70px #0003}.env-modal.wide{width:min(930px,calc(100% - 30px))}.env-modal>header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #e8eaf0}.env-modal h3{margin:0}.env-modal>header button{border:0;font-size:22px}.env-modal-body{padding:16px}.env-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}.env-form-grid label{display:flex;flex-direction:column;gap:5px;font-size:11px;font-weight:600;color:#475467}.env-form-grid label.full{grid-column:1/-1}.env-form-grid input,.env-form-grid select,.env-form-grid textarea,.env-filters input,.env-filters select,.env-card-header select{border:1px solid #d9dee8;border-radius:6px;padding:8px;background:#fff}.env-form-grid textarea{min-height:65px}.env-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.env-modal-list{border:1px solid #eef0f4;border-radius:8px;overflow:hidden}.env-modal-row{display:flex;gap:10px;align-items:center;padding:11px;border-bottom:1px solid #eef0f4}.env-modal-row:last-child{border-bottom:0}.env-modal-row span{flex:1}.env-modal-row strong,.env-modal-row small{display:block}.env-modal-row small{color:#8b93a5;margin-top:2px}.env-toast{position:fixed;right:22px;bottom:22px;z-index:1100;background:#172033;color:#fff;border-radius:8px;padding:10px 14px;opacity:0;transform:translateY(12px);pointer-events:none;transition:.2s}.env-toast.success,.env-toast.error{opacity:1;transform:none}.env-toast.error{background:#b91c1c}@media(max-width:1200px){.env-stats{grid-template-columns:repeat(3,1fr)}}@media(max-width:850px){.env-grid-2,.env-grid-alerts{grid-template-columns:1fr}.env-stats{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.env-page{padding:12px}.env-stats{grid-template-columns:1fr}.env-toolbar{align-items:flex-start;flex-direction:column}.env-form-grid{grid-template-columns:1fr}.env-form-grid label.full{grid-column:auto}.env-distribution{grid-template-columns:1fr}}
  `; document.head.appendChild(style);
}

function viewEnvironment() {
  injectEnvironmentStyles(); setTimeout(initEnvironment, 0);
  return `<div class="env-page" id="env-root"><div class="env-toolbar"><div class="env-filters"><input id="env-search" type="search" placeholder="Search batch, farm or house"><select id="env-status-filter"><option>All</option><option value="excellent">Excellent</option><option value="good">Good</option><option value="moderate">Moderate</option><option value="warning">Warning</option></select></div><div class="env-toolbar-actions"><button type="button" id="env-download-summary">Download Summary</button><button type="button" id="env-refresh">Refresh</button></div></div>
    <div class="env-stats" id="env-stats">${envLoading()}</div>
    <div class="env-grid-2"><section class="env-card"><header class="env-card-header"><h3>Environment Trend</h3><select id="env-trend-days"><option value="7">Last 7 Days</option><option value="5">Last 5 Days</option></select></header><div class="env-card-body"><div class="env-legend"><span><i style="background:#ef4444"></i>Temperature (°C)</span><span><i style="background:#3b82f6"></i>Humidity (%)</span><span><i style="background:#16a34a"></i>Ammonia (ppm)</span><span><i style="background:#8b5cf6"></i>CO2 (ppm)</span></div><div id="env-trend">${envLoading()}</div></div></section><section class="env-card"><header class="env-card-header"><h3>Environmental Status (Current)</h3><button type="button" class="env-link" data-view-parameters>View Parameters <i class="fa-solid fa-arrow-right"></i></button></header><div class="env-card-body" id="env-parameters">${envLoading()}</div></section></div>
    <div class="env-grid-alerts"><section class="env-card"><header class="env-card-header"><h3>Environment Alerts</h3><button type="button" class="env-link" data-view-alerts>View All <i class="fa-solid fa-arrow-right"></i></button></header><div id="env-alerts">${envLoading()}</div></section><section class="env-card"><header class="env-card-header"><h3>House / Batch Environment Overview</h3><span>Live MongoDB readings</span></header><div class="env-table-wrap"><table class="env-table"><thead><tr><th>Batch / Farm</th><th>House</th><th>Birds</th><th>Temp.</th><th>Humidity</th><th>NH3</th><th>CO2</th><th>Air Quality</th><th>Status</th></tr></thead><tbody id="env-reading-body"><tr><td colspan="9">${envLoading()}</td></tr></tbody></table></div><div class="env-pagination" id="env-pagination"></div></section></div>
    <div class="env-grid-2"><section class="env-card"><header class="env-card-header"><h3>Environmental Parameter Distribution</h3><button type="button" class="env-link" data-view-distribution>View Details <i class="fa-solid fa-arrow-right"></i></button></header><div class="env-distribution" id="env-distribution">${envLoading()}</div></section><div><section class="env-card"><header class="env-card-header"><h3>Environmental Records</h3><button type="button" class="env-link" data-view-records>View All Records <i class="fa-solid fa-arrow-right"></i></button></header><div id="env-records">${envLoading()}</div></section><section class="env-card"><header class="env-card-header"><h3>Environment Tips</h3><button type="button" class="env-link" data-view-tips>View All Tips <i class="fa-solid fa-arrow-right"></i></button></header><div class="env-card-body" id="env-tips">${envLoading()}</div></section></div></div><div class="env-modal-host" id="env-modal-host"></div></div>`;
}

/* Canonical read-only data adapters. Unsupported alert/report/tip widgets keep their existing sources. */
function envCanonicalMetric(value, suffix = '', digits = 1) {
  return Number.isFinite(value) ? `${envFormat(value, digits)}${suffix}` : 'Not reported';
}

function envTrend(points) {
  const items = points.slice(-envState.trendDays);
  if (!items.length) return envEmpty('No trend data is available.');
  const series = [{ key: 'temperatureC', color: '#ef4444' }, { key: 'humidityPct', color: '#3b82f6' }, { key: 'ammoniaPpm', color: '#16a34a' }, { key: 'co2Ppm', color: '#8b5cf6' }];
  const w = 460, h = 180, left = 25, top = 15, plotW = 420, plotH = 130;
  const lines = series.map(({ key, color }) => {
    const reported = items.map((item, index) => ({ item, index, value: item[key] })).filter(point => Number.isFinite(point.value));
    if (!reported.length) return '';
    const values = reported.map(point => point.value), min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
    const coords = reported.map(point => ({ x: left + (items.length === 1 ? plotW / 2 : point.index * plotW / (items.length - 1)), y: top + plotH - ((point.value - min) / range * plotH), ...point }));
    return `<polyline points="${coords.map(point => `${point.x},${point.y}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.3"/>${coords.map(point => `<circle cx="${point.x}" cy="${point.y}" r="3" fill="${color}"><title>${envEscape(point.item.label)}: ${envFormat(point.value, key === 'co2Ppm' ? 0 : 1)}</title></circle>`).join('')}`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" class="env-chart" role="img" aria-label="Environment trend">${[0, 1, 2, 3].map(i => `<line x1="${left}" y1="${top + i * plotH / 3}" x2="${left + plotW}" y2="${top + i * plotH / 3}" stroke="#eef0f4"/>`).join('')}${lines}${items.map((item, index) => `<text x="${left + (items.length === 1 ? plotW / 2 : index * plotW / (items.length - 1))}" y="170" text-anchor="middle" font-size="8" fill="#8b93a5">${envEscape(item.label)}</text>`).join('')}</svg>`;
}

async function envLoadDashboard() {
  const [data, canonical] = await Promise.all([envFetch('/dashboard'), window.FarmSenseCanonicalOperations.load()]);
  const s = { ...data.snapshot };
  const sensorRecords = canonical.records.filter(record => record.sensorReadings && Object.values(record.sensorReadings).some(Number.isFinite));
  const average = key => { const values = sensorRecords.map(record => record.sensorReadings?.[key]).filter(Number.isFinite); return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null; };
  s.averageTemperatureC = average('temperatureC'); s.averageHumidityPct = average('humidityPct'); s.averageAmmoniaPpm = average('ammoniaPpm'); s.averageCo2Ppm = average('co2Ppm');
  s.trend = sensorRecords.sort((a, b) => new Date(a.recordDate) - new Date(b.recordDate)).map(record => ({ label: new Date(record.recordDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), ...record.sensorReadings }));
  envState.snapshot = s;
  document.getElementById('env-stats').innerHTML = [
    envStat('T', '#dcfce7', 'Temperature (Avg.)', envCanonicalMetric(s.averageTemperatureC, ' °C'), '', '', ''),
    envStat('H', '#cffafe', 'Humidity (Avg.)', envCanonicalMetric(s.averageHumidityPct, '%'), '', '', ''),
    envStat('AQ', '#f0fdf4', 'Air Quality Index', envFormat(s.airQualityIndex), 'Good', s.airQualityIndex <= s.previousAirQualityIndex ? 'down' : 'up', `${Math.abs(s.airQualityIndex - s.previousAirQualityIndex)} vs yesterday`),
    envStat('A', '#fef3c7', 'Ammonia (Avg.)', envCanonicalMetric(s.averageAmmoniaPpm, ' ppm'), '', '', ''),
    envStat('C', '#f3f4f6', 'CO2 (Avg.)', envCanonicalMetric(s.averageCo2Ppm, ' ppm', 0), '', '', ''),
    envStat('S', '#d1fae5', 'Environment Score', `${s.environmentScore} / 100`, 'Excellent', 'up', `${s.environmentScore - s.previousEnvironmentScore} vs last week`)
  ].join('');
  document.getElementById('env-trend').innerHTML = envTrend(s.trend);
  envRenderDistribution(s.distribution);
  document.getElementById('env-tips').innerHTML = s.tips.slice(0, 5).map(tip => `<div class="env-tip"><b><i class="fa-solid fa-check"></i></b><span>${envEscape(tip)}</span></div>`).join('');
}

async function envLoadReadings() {
  const [canonical, existing] = await Promise.all([
    window.FarmSenseCanonicalOperations.load(),
    envFetch('/readings?limit=1000').catch(() => ({ readings: [] }))
  ]);
  const all = canonical.records.filter(record => record.sensorReadings).map(record => {
    const facility = canonical.facilities.find(item => String(item._id) === String(record.batch?.facilityId));
    const prior = (existing.readings || []).find(item => String(item.batchId) === String(record.batch?.code));
    return { _id: record._id, batchId: record.batch?.code, farm: record.farm?.name, house: facility?.name || prior?.house || 'Not reported', birds: record.batch?.currentBirdCountCached ?? record.batch?.initialBirdCount, ...record.sensorReadings, airQualityLabel: prior?.airQualityLabel || 'Not reported', airQualityIndex: prior?.airQualityIndex, status: prior?.status || 'reported' };
  }).filter(item => !envState.search || `${item.batchId} ${item.farm} ${item.house}`.toLowerCase().includes(envState.search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(all.length / envState.limit));
  const readings = all.slice((envState.page - 1) * envState.limit, envState.page * envState.limit);
  envState.readings = new Map(readings.map(item => [item._id, item]));
  document.getElementById('env-reading-body').innerHTML = readings.length ? readings.map(item => `<tr><td><strong>${envEscape(item.batchId)}</strong><small>${envEscape(item.farm)}</small></td><td>${envEscape(item.house)}</td><td>${envFormat(item.birds)}</td><td>${envCanonicalMetric(item.temperatureC, '°C')}</td><td>${envCanonicalMetric(item.humidityPct, '%')}</td><td>${envCanonicalMetric(item.ammoniaPpm, ' ppm')}</td><td>${envCanonicalMetric(item.co2Ppm, ' ppm', 0)}</td><td>${envEscape(item.airQualityLabel)}${Number.isFinite(item.airQualityIndex) ? ` (${envFormat(item.airQualityIndex)})` : ''}</td><td><i class="env-badge ${item.status}">${envEscape(item.status)}</i></td></tr>`).join('') : `<tr><td colspan="9">${envEmpty('No environment readings match these filters.')}</td></tr>`;
  document.getElementById('env-pagination').innerHTML = `<button type="button" data-page="${Math.max(1, envState.page - 1)}" ${envState.page <= 1 ? 'disabled' : ''}>‹</button>${Array.from({ length: totalPages }, (_, index) => index + 1).map(page => `<button type="button" data-page="${page}" class="${page === envState.page ? 'active' : ''}">${page}</button>`).join('')}<button type="button" data-page="${Math.min(totalPages, envState.page + 1)}" ${envState.page >= totalPages ? 'disabled' : ''}>›</button>`;
}
