/* views/BirdsHealth.js - MongoDB-backed Business Dashboard view */

window.metaBirdsHealth = {
  title: 'Birds Health',
  subtitle: 'Monitor flock health, vaccinations, treatments, alerts, and mortality.'
};

const BH_API = '/api/birds-health';
const bhState = {
  page: 1,
  limit: 5,
  search: '',
  severity: 'All',
  totalPages: 1,
  cases: new Map(),
  snapshot: null
};

function bhEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function bhToken() {
  return localStorage.getItem('fs_token');
}

async function bhFetch(path, options = {}) {
  const token = bhToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BH_API}${path}`, { ...options, headers });
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('fs_token');
    localStorage.removeItem('fs_user');
    window.location.href = '../pages/sign-in.html';
    throw new Error('Your session has expired.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) throw new Error(data.message || 'Birds Health request failed');
  return data;
}

function bhFormatDate(value, includeTime = false) {
  if (!value) return '—';
  const options = includeTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' };
  return new Date(value).toLocaleString('en-IN', options);
}

function bhRelativeTime(value) {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (!Number.isFinite(minutes)) return '';
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} h ago`;
  return bhFormatDate(value);
}

function bhLoading(message = 'Loading…') {
  return `<div class="bh-state"><span class="bh-spinner"></span>${bhEscape(message)}</div>`;
}

function bhError(message) {
  return `<div class="bh-state bh-state-error">${bhEscape(message)}</div>`;
}

function bhStatCard(icon, bg, label, value, sub, trend, change) {
  const direction = trend === 'up' ? '<i class="fa-solid fa-arrow-trend-up"></i>' : trend === 'down' ? '<i class="fa-solid fa-arrow-trend-down"></i>' : '';
  return `
    <div class="bh-stat-card">
      <div class="bh-stat-icon" style="background:${bg}">${icon}</div>
      <div class="bh-stat-label">${bhEscape(label)}</div>
      <div class="bh-stat-value">${bhEscape(value)}</div>
      <div class="bh-stat-sub">${bhEscape(sub)}</div>
      <div class="bh-stat-trend bh-trend-${trend || 'flat'}">${direction} ${bhEscape(change)}</div>
    </div>`;
}

function bhCaseRow(item) {
  const severityClass = String(item.severity || '').toLowerCase();
  return `
    <tr>
      <td><div class="bh-batch-name">${bhEscape(item.batchId)}</div><div class="bh-farm-name">${bhEscape(item.farm)}${item.shed ? ` · ${bhEscape(item.shed)}` : ''}${item.source === 'farmer' ? ' · Farmer submission' : ''}</div></td>
      <td>${Number(item.sickBirds).toLocaleString('en-IN')}</td>
      <td>${Number(item.sickPercentage).toFixed(2)}%</td>
      <td>${bhEscape(item.symptoms)}</td>
      <td>${bhFormatDate(item.detectedOn, true)}</td>
      <td><span class="bh-status-badge bh-severity-${severityClass}">${bhEscape(item.severity)}</span></td>
      <td>${bhEscape(item.actionTaken)}</td>
      <td>${bhEscape(item.veterinarian)}</td>
      <td>${item.source === 'farmer' ? '<span class="bh-status-badge bh-severity-mild">Shared</span>' : '<span class="bh-status-badge">Recorded</span>'}</td>
    </tr>`;
}

function bhHealthCheckRow(item) {
  return `
    <div class="bh-check-row">
      <div class="bh-check-label">${bhEscape(item.label)}</div>
      <span class="bh-check-badge bh-check-${String(item.status).toLowerCase()}">${bhEscape(item.status)}</span>
    </div>`;
}

function bhVaccinationRow(item, withAction = false) {
  return `
    <div class="bh-vax-item">
      <div class="bh-vax-icon"><i class="fa-solid fa-syringe"></i></div>
      <div class="bh-vax-body">
        <div class="bh-vax-name">${bhEscape(item.name)}</div>
        <div class="bh-vax-date">${bhEscape(item.batchId)} · ${bhEscape(item.farm)} · ${bhFormatDate(item.scheduledDate)}</div>
      </div>
      <span class="bh-vax-badge bh-vax-${String(item.status).toLowerCase()}">${bhEscape(item.status)}</span>
    </div>`;
}

function bhAlertRow(item, withAction = false) {
  const icon = { critical: '<i class="fa-solid fa-triangle-exclamation"></i>', warning: '<i class="fa-solid fa-triangle-exclamation"></i>', info: '<i class="fa-solid fa-info"></i>', success: '<i class="fa-solid fa-check"></i>' }[item.severity] || '<i class="fa-solid fa-info"></i>';
  return `
    <div class="bh-alert-item ${item.read ? '' : 'bh-alert-unread'}">
      <div class="bh-alert-icon bh-alert-${bhEscape(item.severity)}">${icon}</div>
      <div class="bh-alert-body">
        <div class="bh-alert-title">${bhEscape(item.title)}</div>
        <div class="bh-alert-sub">${bhEscape(item.message)}</div>
      </div>
      <div class="bh-alert-time">${bhRelativeTime(item.occurredAt)}</div>
    </div>`;
}

function bhRecordRow(item) {
  return `
    <div class="bh-record-item">
      <div class="bh-record-icon"><i class="fa-solid fa-file-lines"></i></div>
      <div class="bh-record-name"><strong>${bhEscape(item.name)}</strong><span>${bhEscape(item.batchId)} · ${bhEscape(item.type)}</span></div>
      <div class="bh-record-date">${bhFormatDate(item.recordedAt, true)}</div>
      <button type="button" class="bh-icon-btn" data-download-record="${item._id}" aria-label="Download ${bhEscape(item.name)}"><i class="fa-solid fa-download"></i></button>
    </div>`;
}

function bhIssueItem(item, total) {
  const percentage = total ? Math.round((item.count / total) * 100) : 0;
  return `
    <div class="bh-issue-item">
      <span class="bh-issue-dot" style="background:${bhEscape(item.color)}"></span>
      <span class="bh-issue-label">${bhEscape(item.label)}</span>
      <span class="bh-issue-count">${Number(item.count).toLocaleString('en-IN')} (${percentage}%)</span>
    </div>`;
}

function bhRenderTrend(points) {
  if (!points?.length) return bhLoading('No health trend available');
  const width = 460;
  const height = 160;
  const left = 40;
  const right = 18;
  const top = 10;
  const bottom = 32;
  const x = (index) => left + (index * (width - left - right)) / Math.max(1, points.length - 1);
  const y = (value) => top + ((100 - Number(value)) / 100) * (height - top - bottom);
  const series = [
    ['healthy', '#16a34a'],
    ['sick', '#f59e0b'],
    ['mortality', '#ef4444']
  ];
  const grids = [0, 25, 50, 75, 100].map((value) => {
    const py = y(value);
    return `<line x1="${left}" y1="${py}" x2="${width - right}" y2="${py}" stroke="#eef0f4"/><text x="4" y="${py + 3}" font-size="8" fill="#9ca3af">${value}</text>`;
  }).join('');
  const lines = series.map(([key, color]) => {
    const coords = points.map((point, index) => `${x(index).toFixed(1)},${y(point[key]).toFixed(1)}`).join(' ');
    const dots = points.map((point, index) => `<circle cx="${x(index).toFixed(1)}" cy="${y(point[key]).toFixed(1)}" r="2.8" fill="${color}"><title>${bhEscape(point.label)}: ${point[key]}%</title></circle>`).join('');
    return `<polyline points="${coords}" fill="none" stroke="${color}" stroke-width="2.2"/>${dots}`;
  }).join('');
  const labels = points.map((point, index) => `<text x="${x(index) - 12}" y="${height - 8}" font-size="8" fill="#9ca3af">${bhEscape(point.label)}</text>`).join('');
  return `<svg viewBox="0 0 ${width} ${height}" class="bh-chart-svg">${grids}${lines}${labels}</svg>`;
}

function bhModal(title, body, footer = '') {
  const root = document.getElementById('bh-modal-root');
  if (!root) return;
  root.innerHTML = `
    <div class="bh-modal-backdrop" data-close-modal="true"></div>
    <section class="bh-modal" role="dialog" aria-modal="true" aria-labelledby="bh-modal-title">
      <header class="bh-modal-header"><h3 id="bh-modal-title">${bhEscape(title)}</h3><button type="button" class="bh-icon-btn" data-close-modal="true" aria-label="Close">×</button></header>
      <div class="bh-modal-body">${body}</div>
      ${footer ? `<footer class="bh-modal-footer">${footer}</footer>` : ''}
    </section>`;
  root.classList.add('open');
}

function bhCloseModal() {
  const root = document.getElementById('bh-modal-root');
  if (!root) return;
  root.classList.remove('open');
  root.innerHTML = '';
}

async function bhLoadDashboard() {
  const stats = document.getElementById('bh-stat-row');
  try {
    const data = await bhFetch('/dashboard');
    const canonical = await window.FarmSenseCanonicalOperations.load();
    const cutoff = Date.now() - (30 * 86400000);
    const recent = canonical.records.filter(record => new Date(record.recordDate).getTime() >= cutoff);
    const mortalityCount = recent.reduce((sum, record) => sum + Number(record.mortality?.count || 0), 0);
    const cullsCount = recent.reduce((sum, record) => sum + Number(record.culls?.count || 0), 0);
    const totalBirds = canonical.batches.reduce((sum, batch) => sum + Number(batch.currentBirdCountCached ?? batch.initialBirdCount ?? 0), 0);
    const byDay = new Map();
    recent.forEach(record => {
      const key = new Date(record.recordDate).toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) || 0) + Number(record.mortality?.count || 0) + Number(record.culls?.count || 0));
    });
    const snapshot = { ...data.snapshot };
    snapshot.totalBirds = totalBirds;
    snapshot.monthlyMortalityPct = totalBirds ? mortalityCount / totalBirds * 100 : 0;
    snapshot.weeklyTrend = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-7).map(([date, losses]) => ({ label: new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }), healthy: totalBirds ? Math.max(0, 100 - losses / totalBirds * 100) : 0, sick: 0, mortality: totalBirds ? losses / totalBirds * 100 : 0 }));
    snapshot.commonIssues = [{ label: 'Mortality', count: mortalityCount, color: '#ef4444' }, { label: 'Culls', count: cullsCount, color: '#f59e0b' }];
    bhState.snapshot = snapshot;
    const sickTodayPct = snapshot.totalBirds ? (snapshot.sickBirdsToday / snapshot.totalBirds * 100).toFixed(2) : '0.00';
    stats.innerHTML = [
      bhStatCard('<i class="fa-solid fa-heart-pulse"></i>', '#f0fdf4', 'Overall Health Score', snapshot.overallHealthScore, 'Excellent', 'up', `${snapshot.overallHealthScore - snapshot.previousHealthScore} vs last week`),
      bhStatCard('<i class="fa-solid fa-check"></i>', '#eff6ff', 'Vaccination Compliance', `${snapshot.vaccinationCompliance}%`, 'On Schedule', 'up', `${snapshot.vaccinationCompliance - snapshot.previousVaccinationCompliance}% vs last week`),
      bhStatCard('+', '#fff7ed', 'Sick Birds (Today)', snapshot.sickBirdsToday.toLocaleString('en-IN'), `${sickTodayPct}% of total`, snapshot.sickBirdsToday <= snapshot.sickBirdsYesterday ? 'down' : 'up', `${Math.abs(snapshot.sickBirdsToday - snapshot.sickBirdsYesterday)} vs yesterday`),
      bhStatCard('<i class="fa-solid fa-arrow-down"></i>', '#fdf2f8', 'Mortality (This Month)', `${snapshot.monthlyMortalityPct}%`, '', snapshot.monthlyMortalityPct <= snapshot.previousMonthlyMortalityPct ? 'down' : 'up', `${Math.abs(snapshot.monthlyMortalityPct - snapshot.previousMonthlyMortalityPct).toFixed(2)}% vs last month`),
      bhStatCard('<i class="fa-solid fa-clipboard-check"></i>', '#eff6ff', 'Health Checks (Today)', `${snapshot.healthChecksCompleted} / ${snapshot.healthChecksTotal}`, 'Completed', snapshot.healthChecksCompleted >= snapshot.healthChecksYesterday ? 'up' : 'down', `${Math.abs(snapshot.healthChecksCompleted - snapshot.healthChecksYesterday)} vs yesterday`)
    ].join('');

    document.getElementById('bh-trend-period').textContent = `(${snapshot.periodLabel})`;
    document.getElementById('bh-trend-chart').innerHTML = bhRenderTrend(snapshot.weeklyTrend);

    const distribution = [
      ['Healthy', snapshot.healthyBirds, '#16a34a'],
      ['Sick', snapshot.sickBirds, '#f59e0b'],
      ['Critical', snapshot.criticalBirds, '#ef4444']
    ];
    document.getElementById('bh-distribution').innerHTML = `
      <div class="bh-donut" style="--healthy:${snapshot.healthyBirds / snapshot.totalBirds * 100}%;--sick:${(snapshot.healthyBirds + snapshot.sickBirds) / snapshot.totalBirds * 100}%"><strong>${snapshot.totalBirds.toLocaleString('en-IN')}</strong><span>Total Birds</span></div>
      <div class="bh-donut-legend">${distribution.map(([label, value, color]) => `<div><span style="background:${color}"></span><b>${label}</b><strong>${value.toLocaleString('en-IN')}</strong><em>${(value / snapshot.totalBirds * 100).toFixed(1)}%</em></div>`).join('')}</div>`;
    document.getElementById('bh-check-list').innerHTML = snapshot.quickChecks.slice(0, 6).map(bhHealthCheckRow).join('');
    const issueTotal = snapshot.commonIssues.reduce((sum, item) => sum + item.count, 0);
    document.getElementById('bh-issues-list').innerHTML = snapshot.commonIssues.map((item) => bhIssueItem(item, issueTotal)).join('');
    document.getElementById('bh-issue-total').textContent = issueTotal.toLocaleString('en-IN');
  } catch (error) {
    stats.innerHTML = bhError(error.message);
    ['bh-trend-chart', 'bh-distribution', 'bh-check-list', 'bh-issues-list'].forEach((id) => {
      const element = document.getElementById(id);
      if (element) element.innerHTML = bhError(error.message);
    });
  }
}

async function bhLoadCases() {
  const body = document.getElementById('bh-cases-body');
  body.innerHTML = `<tr><td colspan="9">${bhLoading('Loading health cases…')}</td></tr>`;
  const params = new URLSearchParams({ page: bhState.page, limit: bhState.limit });
  if (bhState.search) params.set('search', bhState.search);
  if (bhState.severity !== 'All') params.set('severity', bhState.severity);
  try {
    const data = await bhFetch(`/cases?${params}`);
    bhState.cases = new Map(data.cases.map((item) => [item._id, item]));
    bhState.totalPages = data.totalPages;
    body.innerHTML = data.cases.length ? data.cases.map(bhCaseRow).join('') : '<tr><td colspan="9"><div class="bh-state">No health cases match these filters.</div></td></tr>';
    document.getElementById('bh-cases-summary').textContent = data.total
      ? `Showing ${(data.page - 1) * data.limit + 1} to ${Math.min(data.page * data.limit, data.total)} of ${data.total} records`
      : 'No records';
    document.getElementById('bh-page-buttons').innerHTML = bhPagination(data.page, data.totalPages);
  } catch (error) {
    body.innerHTML = `<tr><td colspan="9">${bhError(error.message)}</td></tr>`;
  }
}

function bhPagination(page, totalPages) {
  const buttons = [];
  buttons.push(`<button type="button" class="bh-page-btn" data-page="${Math.max(1, page - 1)}" ${page <= 1 ? 'disabled' : ''}>‹</button>`);
  for (let value = 1; value <= totalPages; value += 1) {
    buttons.push(`<button type="button" class="bh-page-btn ${value === page ? 'active' : ''}" data-page="${value}">${value}</button>`);
  }
  buttons.push(`<button type="button" class="bh-page-btn" data-page="${Math.min(totalPages, page + 1)}" ${page >= totalPages ? 'disabled' : ''}>›</button>`);
  return buttons.join('');
}

async function bhLoadVaccinations() {
  const target = document.getElementById('bh-vax-list');
  try {
    const data = await bhFetch('/vaccinations?limit=5');
    target.innerHTML = data.vaccinations.length ? data.vaccinations.map(bhVaccinationRow).join('') : '<div class="bh-state">No vaccinations scheduled.</div>';
  } catch (error) {
    target.innerHTML = bhError(error.message);
  }
}

async function bhLoadAlerts() {
  const target = document.getElementById('bh-alert-list');
  try {
    const data = await bhFetch('/alerts?limit=4');
    target.innerHTML = data.alerts.length ? data.alerts.map(bhAlertRow).join('') : '<div class="bh-state">No health alerts.</div>';
  } catch (error) {
    target.innerHTML = bhError(error.message);
  }
}

async function bhLoadRecords() {
  const target = document.getElementById('bh-record-list');
  try {
    const data = await bhFetch('/records?limit=5');
    target.innerHTML = data.records.length ? data.records.map(bhRecordRow).join('') : '<div class="bh-state">No health records.</div>';
  } catch (error) {
    target.innerHTML = bhError(error.message);
  }
}

async function bhShowChecks() {
  if (!bhState.snapshot) return;
  bhModal('All Quick Health Checks', `<div class="bh-check-list">${bhState.snapshot.quickChecks.map(bhHealthCheckRow).join('')}</div>`);
}

async function bhShowIssues() {
  if (!bhState.snapshot) return;
  const total = bhState.snapshot.commonIssues.reduce((sum, item) => sum + item.count, 0);
  bhModal('Common Health Issues — This Month', `<div class="bh-issues-modal">${bhState.snapshot.commonIssues.map((item) => bhIssueItem(item, total)).join('')}</div>`);
}

async function bhShowVaccinations() {
  bhModal('Vaccination Calendar & History', bhLoading());
  try {
    const data = await bhFetch('/vaccinations?limit=100');
    document.querySelector('#bh-modal-root .bh-modal-body').innerHTML = data.vaccinations.length
      ? `<div class="bh-vax-list">${data.vaccinations.map((item) => bhVaccinationRow(item, true)).join('')}</div>`
      : '<div class="bh-state">No vaccination history.</div>';
  } catch (error) {
    document.querySelector('#bh-modal-root .bh-modal-body').innerHTML = bhError(error.message);
  }
}

async function bhShowAlerts() {
  bhModal('All Health Alerts', bhLoading());
  try {
    const data = await bhFetch('/alerts?limit=100');
    document.querySelector('#bh-modal-root .bh-modal-body').innerHTML = data.alerts.length
      ? `<div class="bh-alert-list">${data.alerts.map((item) => bhAlertRow(item, true)).join('')}</div>`
      : '<div class="bh-state">No health alerts.</div>';
  } catch (error) {
    document.querySelector('#bh-modal-root .bh-modal-body').innerHTML = bhError(error.message);
  }
}

async function bhShowRecords() {
  bhModal('All Health Records', bhLoading());
  try {
    const data = await bhFetch('/records?limit=100');
    document.querySelector('#bh-modal-root .bh-modal-body').innerHTML = data.records.length
      ? `<div class="bh-records-list">${data.records.map(bhRecordRow).join('')}</div>`
      : '<div class="bh-state">No health records.</div>';
  } catch (error) {
    document.querySelector('#bh-modal-root .bh-modal-body').innerHTML = bhError(error.message);
  }
}

async function bhDownloadRecord(id) {
  const token = bhToken();
  const response = await fetch(`${BH_API}/records/${id}/download`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new Error('Could not download the health record');
  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] || 'health-record.txt';
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function bhWireEvents() {
  const root = document.getElementById('bh-root');
  if (!root) return;

  root.addEventListener('click', async (event) => {
    if (event.target.matches('[data-close-modal]')) {
      bhCloseModal();
      return;
    }
    const action = event.target.closest('button');
    if (!action) return;
    try {
      if (action.dataset.closeModal) bhCloseModal();
      else if (action.id === 'bh-refresh') bhRefreshAll();
      else if (action.dataset.page) { bhState.page = Number(action.dataset.page); bhLoadCases(); }
      else if (action.id === 'bh-view-checks') bhShowChecks();
      else if (action.id === 'bh-view-issues') bhShowIssues();
      else if (action.dataset.bhView === 'records') bhShowRecords();
      else if (action.dataset.bhView === 'vaccinations') bhShowVaccinations();
      else if (action.dataset.bhView === 'alerts') bhShowAlerts();
      else if (action.dataset.downloadRecord) bhDownloadRecord(action.dataset.downloadRecord);
    } catch (error) {
      alert(error.message);
    }
  });

  document.getElementById('bh-case-search').addEventListener('input', (event) => {
    clearTimeout(window.bhSearchTimer);
    window.bhSearchTimer = setTimeout(() => {
      bhState.search = event.target.value.trim();
      bhState.page = 1;
      bhLoadCases();
    }, 300);
  });
  document.getElementById('bh-severity-filter').addEventListener('change', (event) => {
    bhState.severity = event.target.value;
    bhState.page = 1;
    bhLoadCases();
  });
}

async function bhRefreshAll() {
  await Promise.all([bhLoadDashboard(), bhLoadCases(), bhLoadVaccinations(), bhLoadAlerts(), bhLoadRecords()]);
}

function injectBirdsHealthStyles() {
  if (document.getElementById('birds-health-styles')) return;
  const style = document.createElement('style');
  style.id = 'birds-health-styles';
  style.textContent = `
    .bh-scrollable{padding:20px;background:#f5f6fa;min-height:100%;font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1a1a2e}.bh-toolbar{display:flex;justify-content:flex-end;gap:8px;margin-bottom:14px}.bh-btn,.bh-small-btn,.bh-link-btn{border:0;cursor:pointer;font:inherit}.bh-btn{border-radius:7px;padding:8px 13px;font-weight:700}.bh-btn-primary{background:#16a34a;color:#fff}.bh-btn-secondary{background:#fff;border:1px solid #dfe3e8;color:#374151}.bh-btn-danger{background:#fee2e2;color:#b91c1c}.bh-small-btn{padding:5px 8px;border-radius:6px;background:#eefbf2;color:#15803d;font-size:10px;font-weight:700}.bh-link-btn{background:transparent;color:#16a34a;font-size:11px;font-weight:700;padding:2px}.bh-stat-row{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:18px}.bh-stat-card,.bh-card{background:#fff;border:1px solid #e8eaf0;border-radius:10px}.bh-stat-card{padding:14px 16px}.bh-stat-icon{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:8px;font-weight:800}.bh-stat-label{font-size:11px;color:#6b7280}.bh-stat-value{font-size:22px;font-weight:800}.bh-stat-sub{font-size:10px;color:#9ca3af}.bh-stat-trend{font-size:10px;font-weight:700;margin-top:4px}.bh-trend-up{color:#16a34a}.bh-trend-down{color:#ef4444}.bh-card{overflow:hidden;margin-bottom:16px}.bh-card-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid #f1f3f5}.bh-card-title{font-weight:750}.bh-card-actions{display:flex;gap:8px;align-items:center}.bh-two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}.bh-side-stack{display:flex;flex-direction:column;gap:16px}.bh-side-stack .bh-card{margin:0}.bh-three-col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}.bh-three-col>.bh-card,.bh-three-col>.bh-side-stack{margin-bottom:0}.bh-chart-area{padding:14px 16px}.bh-chart-legend{display:flex;gap:15px;color:#6b7280;font-size:11px}.bh-chart-legend span{display:inline-block;width:15px;height:3px;margin-right:5px}.bh-chart-svg{width:100%;height:180px}.bh-distribution{display:flex;align-items:center;gap:22px;padding:18px}.bh-donut{width:120px;height:120px;border-radius:50%;background:conic-gradient(#16a34a 0 var(--healthy),#f59e0b var(--healthy) var(--sick),#ef4444 var(--sick) 100%);position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0}.bh-donut:before{content:"";position:absolute;inset:20px;border-radius:50%;background:#fff}.bh-donut strong,.bh-donut span{z-index:1}.bh-donut strong{font-size:16px}.bh-donut span{font-size:9px;color:#9ca3af}.bh-donut-legend{flex:1}.bh-donut-legend div{display:grid;grid-template-columns:10px 1fr auto auto;gap:7px;align-items:center;margin:9px 0;font-size:11px}.bh-donut-legend span{width:10px;height:10px;border-radius:50%}.bh-donut-legend em{color:#9ca3af;font-style:normal}.bh-check-list,.bh-vax-list,.bh-alert-list,.bh-records-list{padding:7px 0}.bh-check-row,.bh-vax-item,.bh-alert-item,.bh-record-item{display:flex;align-items:center;gap:10px;padding:9px 16px;border-bottom:1px solid #f7f7f8}.bh-check-row{justify-content:space-between}.bh-check-label{color:#374151}.bh-check-badge,.bh-status-badge,.bh-vax-badge{border-radius:5px;padding:3px 9px;font-size:10px;font-weight:750}.bh-check-normal,.bh-vax-completed{background:#d1fae5;color:#047857}.bh-check-warning,.bh-vax-upcoming{background:#dbeafe;color:#1d4ed8}.bh-check-critical,.bh-vax-overdue{background:#fee2e2;color:#b91c1c}.bh-severity-mild{background:#fef3c7;color:#b45309}.bh-severity-moderate{background:#fee2e2;color:#b91c1c}.bh-severity-severe{background:#fce7f3;color:#be185d}.bh-vax-icon,.bh-alert-icon,.bh-record-icon{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:#f3f4f6}.bh-vax-body,.bh-alert-body{flex:1}.bh-vax-name,.bh-alert-title{font-weight:650}.bh-vax-date,.bh-alert-sub,.bh-alert-time,.bh-record-date{font-size:10px;color:#9ca3af}.bh-alert-unread{background:#f8fff9}.bh-alert-critical{background:#fee2e2;color:#b91c1c}.bh-alert-warning{background:#fff7ed;color:#c2410c}.bh-alert-info{background:#dbeafe;color:#1d4ed8}.bh-alert-success{background:#d1fae5;color:#047857}.bh-record-name{flex:1;display:flex;flex-direction:column}.bh-record-name span{font-size:10px;color:#9ca3af}.bh-icon-btn{border:0;background:transparent;cursor:pointer;font-size:18px;color:#6b7280;padding:3px 7px}.bh-table-tools{display:flex;gap:8px}.bh-table-tools input,.bh-table-tools select{border:1px solid #dfe3e8;border-radius:6px;padding:7px 9px;font:inherit}.bh-table-wrap{overflow-x:auto}.bh-table{width:100%;border-collapse:collapse}.bh-table th{background:#f9fafb;color:#9ca3af;text-transform:uppercase;letter-spacing:.4px;font-size:10px;text-align:left;padding:8px 12px}.bh-table td{padding:9px 12px;border-bottom:1px solid #f6f7f8;font-size:12px;vertical-align:middle}.bh-batch-name{font-weight:750}.bh-farm-name{font-size:10px;color:#9ca3af}.bh-pagination{display:flex;justify-content:space-between;align-items:center;padding:10px 16px;color:#6b7280;font-size:11px}.bh-page-btns{display:flex;gap:4px}.bh-page-btn{width:28px;height:28px;border:1px solid #e5e7eb;border-radius:6px;background:#fff;cursor:pointer}.bh-page-btn.active{background:#16a34a;color:#fff;border-color:#16a34a}.bh-page-btn:disabled{opacity:.4;cursor:not-allowed}.bh-issues-wrap{display:flex;align-items:center;gap:16px;padding:16px}.bh-issue-circle{width:100px;height:100px;border:14px solid #eef0f2;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#6b7280;flex-shrink:0}.bh-issue-circle strong{font-size:20px;color:#111827}.bh-issues-legend,.bh-issues-modal{flex:1}.bh-issue-item{display:flex;align-items:center;gap:7px;margin:9px 0}.bh-issue-dot{width:10px;height:10px;border-radius:50%}.bh-issue-label{flex:1}.bh-issue-count{font-size:11px;color:#6b7280}.bh-state{padding:18px;color:#6b7280;display:flex;align-items:center;justify-content:center;gap:8px}.bh-state-error{color:#b91c1c;background:#fff7f7}.bh-spinner{width:14px;height:14px;border:2px solid #d1d5db;border-top-color:#16a34a;border-radius:50%;animation:bhspin .8s linear infinite}@keyframes bhspin{to{transform:rotate(360deg)}}#bh-modal-root{display:none}#bh-modal-root.open{display:block}.bh-modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:1500}.bh-modal{position:fixed;z-index:1501;left:50%;top:50%;transform:translate(-50%,-50%);width:min(760px,calc(100vw - 28px));max-height:86vh;background:#fff;border-radius:12px;box-shadow:0 24px 70px rgba(0,0,0,.25);display:flex;flex-direction:column}.bh-modal-header,.bh-modal-footer{display:flex;align-items:center;padding:14px 18px;border-bottom:1px solid #eef0f2}.bh-modal-header h3{font-size:15px;margin:0;flex:1}.bh-modal-footer{border-top:1px solid #eef0f2;border-bottom:0;gap:8px}.bh-modal-spacer{flex:1}.bh-modal-body{padding:16px;overflow:auto}.bh-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.bh-field{display:flex;flex-direction:column;gap:5px}.bh-field span{font-size:11px;font-weight:700;color:#4b5563}.bh-field input,.bh-field select,.bh-field textarea{border:1px solid #dfe3e8;border-radius:7px;padding:9px;font:inherit}.bh-field textarea{min-height:64px;resize:vertical}.bh-field-wide{grid-column:1/-1}.bh-form-error{color:#b91c1c;font-size:11px;margin-top:10px}.bh-view-footer{padding:10px 16px;border-top:1px solid #f1f3f5}.bh-view-footer .bh-link-btn{padding:0}@media(max-width:1100px){.bh-stat-row{grid-template-columns:repeat(3,1fr)}.bh-three-col{grid-template-columns:1fr 1fr}.bh-three-col>.bh-side-stack{grid-column:1/-1}}@media(max-width:760px){.bh-scrollable{padding:12px}.bh-stat-row,.bh-two-col,.bh-three-col{grid-template-columns:1fr}.bh-table-tools{width:100%;flex-wrap:wrap}.bh-table-tools input{flex:1;min-width:180px}.bh-card-header{align-items:flex-start;flex-wrap:wrap}.bh-form-grid{grid-template-columns:1fr}.bh-field-wide{grid-column:auto}.bh-distribution{align-items:flex-start;flex-wrap:wrap}}
  `;
  document.head.appendChild(style);
}

function initBirdsHealth() {
  bhWireEvents();
  bhRefreshAll();
}

function viewBirdsHealth() {
  injectBirdsHealthStyles();
  setTimeout(initBirdsHealth, 0);
  return `
    <div class="bh-scrollable" id="bh-root">
      <div class="bh-toolbar"><button type="button" class="bh-btn bh-btn-secondary" id="bh-refresh">Refresh</button></div>
      <div class="bh-stat-row" id="bh-stat-row">${bhLoading('Loading health summary…')}</div>

      <div class="bh-two-col">
        <section class="bh-card">
          <div class="bh-card-header"><span class="bh-card-title">Health Overview <span id="bh-trend-period" style="font-weight:400;color:#9ca3af"></span></span></div>
          <div class="bh-chart-area"><div class="bh-chart-legend"><div><span style="background:#16a34a"></span>Healthy Birds (%)</div><div><span style="background:#f59e0b"></span>Sick Birds (%)</div><div><span style="background:#ef4444"></span>Mortality (%)</div></div><div id="bh-trend-chart">${bhLoading()}</div></div>
        </section>
        <div class="bh-side-stack">
          <section class="bh-card"><div class="bh-card-header"><span class="bh-card-title">Health Status Distribution</span></div><div class="bh-distribution" id="bh-distribution">${bhLoading()}</div></section>
          <section class="bh-card"><div class="bh-card-header"><span class="bh-card-title">Quick Health Check</span><button type="button" class="bh-link-btn" id="bh-view-checks">View All</button></div><div class="bh-check-list" id="bh-check-list">${bhLoading()}</div></section>
        </div>
      </div>

      <section class="bh-card">
        <div class="bh-card-header"><span class="bh-card-title">Sick &amp; Treated Birds</span><div class="bh-table-tools"><input id="bh-case-search" type="search" placeholder="Search batch, farm, symptom or vet"><select id="bh-severity-filter"><option>All</option><option>Mild</option><option>Moderate</option><option>Severe</option></select></div></div>
        <div class="bh-table-wrap"><table class="bh-table"><thead><tr><th>Batch / Farm</th><th>Sick Birds</th><th>% of Total</th><th>Symptoms</th><th>Detected On</th><th>Severity</th><th>Action Taken</th><th>Veterinarian</th><th></th></tr></thead><tbody id="bh-cases-body"><tr><td colspan="9">${bhLoading()}</td></tr></tbody></table></div>
        <div class="bh-pagination"><span id="bh-cases-summary">Loading…</span><div class="bh-page-btns" id="bh-page-buttons"></div></div>
      </section>

      <div class="bh-three-col">
        <section class="bh-card"><div class="bh-card-header"><span class="bh-card-title">Common Health Issues</span><button type="button" class="bh-link-btn" id="bh-view-issues">View All</button></div><div class="bh-issues-wrap"><div class="bh-issue-circle"><strong id="bh-issue-total">—</strong><span>This Month</span></div><div class="bh-issues-legend" id="bh-issues-list">${bhLoading()}</div></div></section>
        <section class="bh-card"><div class="bh-card-header"><span class="bh-card-title">Health Records</span><button type="button" class="bh-link-btn" data-bh-view="records">View All</button></div><div class="bh-records-list" id="bh-record-list">${bhLoading()}</div><div class="bh-view-footer"><button type="button" class="bh-link-btn" data-bh-view="records">View All Health Records <i class="fa-solid fa-arrow-right"></i></button></div></section>
        <div class="bh-side-stack">
          <section class="bh-card"><div class="bh-card-header"><span class="bh-card-title">Vaccination Schedule</span><button type="button" class="bh-link-btn" data-bh-view="vaccinations">View Calendar</button></div><div class="bh-vax-list" id="bh-vax-list">${bhLoading()}</div><div class="bh-view-footer"><button type="button" class="bh-link-btn" data-bh-view="vaccinations">View All Vaccination History <i class="fa-solid fa-arrow-right"></i></button></div></section>
          <section class="bh-card"><div class="bh-card-header"><span class="bh-card-title">Alerts &amp; Notifications</span><button type="button" class="bh-link-btn" data-bh-view="alerts">View All</button></div><div class="bh-alert-list" id="bh-alert-list">${bhLoading()}</div><div class="bh-view-footer"><button type="button" class="bh-link-btn" data-bh-view="alerts">View All Alerts <i class="fa-solid fa-arrow-right"></i></button></div></section>
        </div>
      </div>
      <div id="bh-modal-root"></div>
    </div>`;
}
