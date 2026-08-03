/* views/FeedAndWater.js - MongoDB-backed Business Dashboard view */

window.metaFeedAndWater = {
  title: 'Feed & Water Management',
  subtitle: 'Monitor feed and water consumption, inventory and efficiency across all batches.'
};

const FW_API = '/api/feed-water';
const fwState = { page: 1, limit: 5, search: '', status: 'All', totalPages: 1, batches: new Map(), inventory: [], systems: [], alerts: [], snapshot: null, trendDays: 7 };

function fwEscape(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function fwToken() { return localStorage.getItem('fs_token'); }

async function fwFetch(path, options = {}) {
  const response = await fetch(`${FW_API}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${fwToken()}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
  });
  if (response.status === 401 || response.status === 403) {
    window.location.href = '/src/pages/sign-in.html';
    throw new Error('Your session is not authorized for Feed & Water Management.');
  }
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.blob();
  if (!response.ok) throw new Error(data.message || 'Feed & Water request failed.');
  return data;
}

function fwLoading() { return '<div class="fw-loading">Loading live data…</div>'; }
function fwEmpty(message) { return `<div class="fw-empty">${fwEscape(message)}</div>`; }
function fwFormat(value, digits = 0) { return Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits }); }
function fwToast(message, type = 'success') {
  let toast = document.getElementById('fw-toast');
  if (!toast) { toast = document.createElement('div'); toast.id = 'fw-toast'; document.body.appendChild(toast); }
  toast.className = `fw-toast ${type}`;
  toast.textContent = message;
  setTimeout(() => { toast.className = 'fw-toast'; }, 2600);
}

function fwStat(icon, bg, label, value, sub, direction, change) {
  return `<article class="fw-stat"><div class="fw-stat-icon" style="background:${bg}">${icon}</div><span>${label}</span><strong>${value}</strong><small>${sub}</small><em class="${direction}"><i class="fa-solid fa-arrow-trend-${direction === 'up' ? 'up' : 'down'}"></i> ${change}</em></article>`;
}

function fwModal(title, content, wide = false) {
  const host = document.getElementById('fw-modal-host');
  host.innerHTML = `<div class="fw-backdrop" data-close-modal></div><section class="fw-modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${fwEscape(title)}"><header><h3>${fwEscape(title)}</h3><button type="button" data-close-modal aria-label="Close">×</button></header><div class="fw-modal-body">${content}</div></section>`;
  host.classList.add('open');
}

function fwCloseModal() { const host = document.getElementById('fw-modal-host'); if (host) { host.classList.remove('open'); host.innerHTML = ''; } }

function fwSummaryRow(label, value, danger = false) {
  return `<div class="fw-summary-row"><span>${label}</span><strong class="${danger ? 'danger' : ''}">${value}</strong></div>`;
}

function fwTrendChart(points) {
  if (!points.length) return fwEmpty('No consumption trend is available.');
  const selected = points.slice(-fwState.trendDays);
  const width = 460, height = 180, left = 30, top = 15, bottom = 30;
  const plotW = width - left - 15, plotH = height - top - bottom;
  const feedMax = Math.max(...selected.map((p) => p.feedKg), 1);
  const waterMax = Math.max(...selected.map((p) => p.waterLitres), 1);
  const coords = (field, max) => selected.map((point, index) => {
    const x = left + (selected.length === 1 ? plotW / 2 : index * plotW / (selected.length - 1));
    const y = top + plotH - (point[field] / max * plotH);
    return { x, y, point };
  });
  const feed = coords('feedKg', feedMax), water = coords('waterLitres', waterMax);
  const poly = (items) => items.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${width} ${height}" class="fw-chart" role="img" aria-label="Feed and water consumption trend">
    ${[0, 1, 2, 3].map((i) => `<line x1="${left}" y1="${top + i * plotH / 3}" x2="${width - 15}" y2="${top + i * plotH / 3}" stroke="#eef0f4"/>`).join('')}
    <polyline points="${poly(feed)}" fill="none" stroke="#16a34a" stroke-width="2.5"/>
    <polyline points="${poly(water)}" fill="none" stroke="#3b82f6" stroke-width="2.5"/>
    ${feed.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="#16a34a"><title>${fwEscape(p.point.label)}: ${fwFormat(p.point.feedKg)} kg</title></circle>`).join('')}
    ${water.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="#3b82f6"><title>${fwEscape(p.point.label)}: ${fwFormat(p.point.waterLitres)} L</title></circle>`).join('')}
    ${feed.map((p) => `<text x="${p.x}" y="${height - 8}" text-anchor="middle" font-size="8" fill="#8b93a5">${fwEscape(p.point.label)}</text>`).join('')}
  </svg>`;
}

async function fwLoadDashboard() {
  const data = await fwFetch('/dashboard');
  const canonical = await window.FarmSenseCanonicalOperations.load();
  const s = { ...data.snapshot };
  const daily = new Map();
  canonical.records.forEach(record => {
    const key = new Date(record.recordDate).toISOString().slice(0, 10);
    const row = daily.get(key) || { feedKg: 0, waterLitres: 0 };
    row.feedKg += Number(record.feed?.consumedKg || 0);
    row.waterLitres += Number(record.water?.consumedLiters || 0);
    daily.set(key, row);
  });
  s.trend = [...daily.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, row]) => ({ label: new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }), ...row }));
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  s.feedConsumedTodayKg = daily.get(today)?.feedKg || 0;
  s.waterConsumedTodayLitres = daily.get(today)?.waterLitres || 0;
  s.feedConsumedYesterdayKg = daily.get(yesterday)?.feedKg || 0;
  s.waterConsumedYesterdayLitres = daily.get(yesterday)?.waterLitres || 0;
  s.batchesMonitored = canonical.batches.filter(batch => batch.status === 'active').length;
  data.batchCount = canonical.records.length;
  fwState.snapshot = s;
  const feedChange = ((s.feedConsumedTodayKg - s.feedConsumedYesterdayKg) / s.feedConsumedYesterdayKg * 100).toFixed(1);
  const waterChange = ((s.waterConsumedTodayLitres - s.waterConsumedYesterdayLitres) / s.waterConsumedYesterdayLitres * 100).toFixed(1);
  document.getElementById('fw-stats').innerHTML = [
    fwStat('F', '#d1fae5', 'Total Feed Consumed (Today)', `${fwFormat(s.feedConsumedTodayKg)} kg`, '', 'up', `${feedChange}% vs yesterday`),
    fwStat('W', '#cffafe', 'Total Water Consumed (Today)', `${fwFormat(s.waterConsumedTodayLitres)} L`, '', 'up', `${waterChange}% vs yesterday`),
    fwStat('R', '#fce7f3', 'Feed Conversion Ratio (Avg.)', fwFormat(s.averageFcr, 2), '', s.averageFcr <= s.previousAverageFcr ? 'down' : 'up', `${Math.abs(s.averageFcr - s.previousAverageFcr).toFixed(2)} vs last week`),
    fwStat('E', '#fed7aa', 'Feed Efficiency (Avg.)', `${fwFormat(s.averageFeedEfficiencyPct, 1)}%`, '', 'up', `${(s.averageFeedEfficiencyPct - s.previousFeedEfficiencyPct).toFixed(1)}% vs last week`),
    fwStat('B', '#dbeafe', 'Batches Monitored', fwFormat(s.batchesMonitored), 'Active Batches', 'up', `${data.batchCount} readings`)
  ].join('');
  document.getElementById('fw-trend').innerHTML = fwTrendChart(s.trend);
  const feedWastePct = s.totalFeedOfferedKg ? s.feedWastageKg / s.totalFeedOfferedKg * 100 : 0;
  const waterWastePct = s.totalWaterSuppliedLitres ? s.waterWastageLitres / s.totalWaterSuppliedLitres * 100 : 0;
  document.getElementById('fw-feed-summary').innerHTML = [
    fwSummaryRow('Total Feed Offered', `${fwFormat(s.totalFeedOfferedKg)} kg`), fwSummaryRow('Feed Consumed', `${fwFormat(s.feedConsumedTodayKg)} kg`),
    fwSummaryRow('Feed Wastage', `${fwFormat(s.feedWastageKg)} kg (${feedWastePct.toFixed(2)}%)`, true), fwSummaryRow('Avg. Feed / Bird', `${fwFormat(s.averageFeedPerBirdKg, 3)} kg`),
    fwSummaryRow('Feed Conversion Ratio (Avg.)', fwFormat(s.averageFcr, 2))
  ].join('');
  document.getElementById('fw-water-summary').innerHTML = [
    fwSummaryRow('Total Water Supplied', `${fwFormat(s.totalWaterSuppliedLitres)} L`), fwSummaryRow('Water Consumed', `${fwFormat(s.waterConsumedTodayLitres)} L`),
    fwSummaryRow('Water Wastage', `${fwFormat(s.waterWastageLitres)} L (${waterWastePct.toFixed(2)}%)`, true), fwSummaryRow('Avg. Water / Bird', `${fwFormat(s.averageWaterPerBirdLitres, 3)} L`),
    fwSummaryRow('Water Quality (TDS)', `${fwFormat(s.waterTdsPpm)} ppm`)
  ].join('');
  fwRenderWastage(s.wastageBreakdown);
  document.getElementById('fw-inventory-summary').innerHTML = `${fwSummaryMetric('Total Stock', `${fwFormat(data.inventorySummary.totalStockKg)} kg`)}${fwSummaryMetric('Sufficient for', `${fwFormat(data.inventorySummary.sufficientDays, 1)} Days`)}${fwSummaryMetric('Low Stock Alert', `${fwFormat(data.inventorySummary.lowStockKg)} kg`, true)}`;
}

function fwSummaryMetric(label, value, danger = false) { return `<div><span>${label}</span><strong class="${danger ? 'danger' : ''}">${value}</strong></div>`; }

function fwRenderWastage(items) {
  const total = items.reduce((sum, item) => sum + item.amountKg, 0);
  let offset = 0;
  const circumference = 251.3;
  const arcs = items.map((item) => {
    const length = total ? item.amountKg / total * circumference : 0;
    const arc = `<circle cx="50" cy="50" r="40" fill="none" stroke="${item.color}" stroke-width="14" stroke-dasharray="${length} ${circumference}" stroke-dashoffset="-${offset}"/>`;
    offset += length;
    return arc;
  }).join('');
  document.getElementById('fw-wastage').innerHTML = `<svg viewBox="0 0 100 100"><g transform="rotate(-90 50 50)">${arcs}</g><text x="50" y="47" text-anchor="middle" font-size="11" font-weight="800">${fwFormat(total)} kg</text><text x="50" y="59" text-anchor="middle" font-size="7" fill="#6b7280">Total Wastage</text></svg><div>${items.map((item) => `<p><i style="background:${item.color}"></i>${fwEscape(item.label)}: ${fwFormat(item.amountKg)} kg (${total ? Math.round(item.amountKg / total * 100) : 0}%)</p>`).join('')}</div>`;
}

async function fwLoadBatches() {
  const canonical = await window.FarmSenseCanonicalOperations.load();
  const rows = canonical.batches.map(batch => {
    const records = canonical.records.filter(record => String(record.batchId) === String(batch._id));
    const feed = records.reduce((sum, record) => sum + Number(record.feed?.consumedKg || 0), 0);
    const water = records.reduce((sum, record) => sum + Number(record.water?.consumedLiters || 0), 0);
    const birds = Number(batch.currentBirdCountCached ?? batch.initialBirdCount ?? 0);
    return { _id: batch._id, batchId: batch.code, farm: batch.farm?.name || 'Unknown farm', birds, ageDays: Math.max(0, Math.floor((Date.now() - new Date(batch.placedAt).getTime()) / 86400000)), feedConsumedKg: feed, averageFeedPerBirdKg: birds ? feed / birds : 0, fcr: null, waterConsumedLitres: water, averageWaterPerBirdLitres: birds ? water / birds : 0, status: batch.status };
  }).filter(item => (!fwState.search || `${item.batchId} ${item.farm}`.toLowerCase().includes(fwState.search.toLowerCase())) && (fwState.status === 'All' || item.status.toLowerCase() === fwState.status.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(rows.length / fwState.limit));
  const data = { batches: rows.slice((fwState.page - 1) * fwState.limit, fwState.page * fwState.limit), page: fwState.page, totalPages };
  fwState.totalPages = data.totalPages;
  fwState.batches = new Map(data.batches.map((item) => [item._id, item]));
  const body = document.getElementById('fw-batch-body');
  body.innerHTML = data.batches.length ? data.batches.map((item) => `<tr>
    <td><strong>${fwEscape(item.batchId)}</strong><small>${fwEscape(item.farm)}${item.source === 'farmer' ? ` · Farmer: ${fwEscape(item.submittedByName || 'Submitted')}${item.shed ? ` · ${fwEscape(item.shed)}` : ''}` : ''}</small></td><td>${fwFormat(item.birds)}</td><td>${fwFormat(item.ageDays)}</td>
    <td>${fwFormat(item.feedConsumedKg)}</td><td>${fwFormat(item.averageFeedPerBirdKg, 3)}</td><td>${item.fcr == null ? 'Not reported' : fwFormat(item.fcr, 2)}</td>
    <td>${fwFormat(item.waterConsumedLitres)}</td><td>${fwFormat(item.averageWaterPerBirdLitres, 3)}</td><td><span class="fw-badge ${item.status.toLowerCase()}">${fwEscape(item.status)}</span></td>
    </tr>`).join('') : `<tr><td colspan="9">${fwEmpty('No batch readings match the selected filters.')}</td></tr>`;
  document.getElementById('fw-pagination').innerHTML = `<button type="button" data-page="${Math.max(1, data.page - 1)}" ${data.page <= 1 ? 'disabled' : ''}>‹</button>${Array.from({ length: data.totalPages }, (_, index) => index + 1).map((page) => `<button type="button" data-page="${page}" class="${page === data.page ? 'active' : ''}">${page}</button>`).join('')}<button type="button" data-page="${Math.min(data.totalPages, data.page + 1)}" ${data.page >= data.totalPages ? 'disabled' : ''}>›</button>`;
}

async function fwLoadInventory() {
  const data = await fwFetch('/inventory');
  fwState.inventory = data.inventory;
  document.getElementById('fw-inventory-list').innerHTML = data.inventory.map((item) => `<tr><td>${fwEscape(item.feedType)}</td><td>${fwFormat(item.stockKg)} kg</td><td>${fwFormat(item.sufficientDays, 1)} Days</td></tr>`).join('');
}

async function fwLoadSystems() {
  const data = await fwFetch('/water-systems');
  fwState.systems = data.systems;
  document.getElementById('fw-systems').innerHTML = data.systems.map((item) => `<div class="fw-system"><b>${fwEscape(item.icon)}</b><span><strong>${fwEscape(item.label)}</strong><small>${fwEscape(item.value)}</small></span><em class="fw-badge ${item.status.toLowerCase()}">${fwEscape(item.status)}</em></div>`).join('');
}

async function fwLoadAlerts() {
  const data = await fwFetch('/alerts');
  fwState.alerts = data.alerts;
  document.getElementById('fw-alerts').innerHTML = data.alerts.slice(0, 4).map(fwAlertRow).join('') || fwEmpty('No feed or water alerts.');
}

function fwAlertRow(item) { return `<div class="fw-alert ${item.read ? 'read' : ''}"><i class="${item.severity}"></i><span><strong>${fwEscape(item.title)}</strong><small>${new Date(item.occurredAt).toLocaleString('en-IN')}</small></span><em class="fw-badge ${item.severity}">${fwEscape(item.severity)}</em></div>`;
}

function fwInventoryModal() { fwModal('Feed Inventory', `<table class="fw-table"><thead><tr><th>Feed Type</th><th>Stock</th><th>Days</th><th>Threshold</th></tr></thead><tbody>${fwState.inventory.map((item) => `<tr><td>${fwEscape(item.feedType)}</td><td>${fwFormat(item.stockKg)} kg</td><td>${fwFormat(item.sufficientDays, 1)}</td><td>${fwFormat(item.lowStockThresholdKg)} kg</td></tr>`).join('')}</tbody></table>`, true);
}

function fwSystemsModal() { fwModal('Water System Status', `<div class="fw-modal-list">${fwState.systems.map((item) => `<div class="fw-modal-row"><span><strong>${fwEscape(item.label)}</strong><small>${fwEscape(item.value)} ? ${fwEscape(item.status)}</small></span></div>`).join('')}</div>`);
}

function fwAlertsModal() { fwModal('Feed & Water Alerts', `<div class="fw-modal-list">${fwState.alerts.map((item) => fwAlertRow(item)).join('')}</div>`, true); }

function fwWastageModal() {
  const items = fwState.snapshot?.wastageBreakdown || [];
  fwModal('Feed Wastage Analysis', `<table class="fw-table"><thead><tr><th>Cause</th><th>Amount</th><th>Share</th></tr></thead><tbody>${items.map((item) => `<tr><td><i class="fw-color" style="background:${item.color}"></i>${fwEscape(item.label)}</td><td>${fwFormat(item.amountKg)} kg</td><td>${fwState.snapshot.feedWastageKg ? Math.round(item.amountKg / fwState.snapshot.feedWastageKg * 100) : 0}%</td></tr>`).join('')}</tbody></table>`);
}

async function fwDownloadReport() {
  const blob = await fwFetch('/report/download');
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = 'feed-water-report.txt'; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url); fwToast('Consumption report downloaded.');
}

function fwWireEvents() {
  const root = document.getElementById('fw-root');
  root.addEventListener('click', async (event) => {
    if (event.target.matches('[data-close-modal]')) { fwCloseModal(); return; }
    const button = event.target.closest('button'); if (!button) return;
    try {
      if (button.id === 'fw-refresh') await fwRefresh();
      else if (button.dataset.page) { fwState.page = Number(button.dataset.page); await fwLoadBatches(); }
      else if (button.dataset.downloadReport !== undefined) await fwDownloadReport();
      else if (button.dataset.viewWastage !== undefined) fwWastageModal();
      else if (button.dataset.viewInventory !== undefined) fwInventoryModal();
      else if (button.dataset.viewSystems !== undefined) fwSystemsModal();
      else if (button.dataset.viewAlerts !== undefined) fwAlertsModal();
    } catch (error) { fwToast(error.message, 'error'); }
  });
  document.getElementById('fw-search').addEventListener('input', (event) => { clearTimeout(window.fwSearchTimer); window.fwSearchTimer = setTimeout(() => { fwState.search = event.target.value.trim(); fwState.page = 1; fwLoadBatches().catch((error) => fwToast(error.message, 'error')); }, 300); });
  document.getElementById('fw-status-filter').addEventListener('change', (event) => { fwState.status = event.target.value; fwState.page = 1; fwLoadBatches().catch((error) => fwToast(error.message, 'error')); });
  document.getElementById('fw-trend-days').addEventListener('change', (event) => { fwState.trendDays = Number(event.target.value); document.getElementById('fw-trend').innerHTML = fwTrendChart(fwState.snapshot?.trend || []); });
}

async function fwRefresh() {
  await Promise.all([fwLoadDashboard(), fwLoadBatches(), fwLoadInventory(), fwLoadSystems(), fwLoadAlerts()]);
  fwToast('Feed & Water data refreshed.');
}

async function initFeedAndWater() {
  fwWireEvents();
  try { await Promise.all([fwLoadDashboard(), fwLoadBatches(), fwLoadInventory(), fwLoadSystems(), fwLoadAlerts()]); }
  catch (error) { fwToast(error.message, 'error'); }
}

function injectFeedAndWaterStyles() {
  if (document.getElementById('feed-water-styles')) return;
  const style = document.createElement('style'); style.id = 'feed-water-styles'; style.textContent = `
    .fw-page{padding:20px;background:#f5f6fa;min-height:100%;font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033}.fw-page button,.fw-page input,.fw-page select,.fw-page textarea{font:inherit}.fw-topbar,.fw-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}.fw-topbar-actions,.fw-filters{display:flex;gap:8px;flex-wrap:wrap}.fw-page button{border:1px solid #dfe3ea;background:#fff;border-radius:6px;padding:7px 11px;cursor:pointer;color:#344054}.fw-page button:hover{border-color:#16a34a}.fw-page button.primary{background:#16a34a;color:#fff;border-color:#16a34a}.fw-page button.danger,.fw-actions .danger{color:#dc2626}.fw-page button:disabled{opacity:.45;cursor:not-allowed}.fw-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:16px}.fw-stat,.fw-card{background:#fff;border:1px solid #e8eaf0;border-radius:10px}.fw-stat{padding:14px 16px}.fw-stat-icon{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-weight:800;margin-bottom:8px}.fw-stat span,.fw-stat small{display:block;color:#6b7280;font-size:11px}.fw-stat strong{display:block;font-size:21px;margin:3px 0}.fw-stat em{font-style:normal;font-size:10px;font-weight:700}.fw-stat em.up{color:#16a34a}.fw-stat em.down{color:#ef4444}.fw-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}.fw-card{overflow:hidden;margin-bottom:16px}.fw-grid-2 .fw-card{margin-bottom:0}.fw-card-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 16px;border-bottom:1px solid #f0f2f5}.fw-card-header h3{font-size:13px;margin:0}.fw-link{border:0!important;color:#16a34a!important;padding:2px!important;font-weight:700;background:transparent!important}.fw-card-body{padding:14px 16px}.fw-legend{display:flex;gap:18px;color:#6b7280;font-size:11px}.fw-legend i,.fw-color{display:inline-block;width:11px;height:4px;border-radius:3px;margin-right:5px}.fw-chart{width:100%;height:205px}.fw-summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:14px 16px}.fw-summary-grid>div>span{display:block;color:#6b7280;font-size:11px;margin-bottom:6px}.fw-summary-box{background:#f9fafb;border:1px solid #f0f2f5;border-radius:7px;padding:10px}.fw-summary-row{display:flex;justify-content:space-between;gap:12px;font-size:11px;padding:5px 0}.fw-summary-row strong.danger,.fw-summary-metrics strong.danger{color:#ef4444}.fw-table-wrap{overflow:auto}.fw-table{width:100%;border-collapse:collapse}.fw-table th{background:#f9fafb;color:#8991a2;text-transform:uppercase;letter-spacing:.35px;font-size:10px;text-align:left;padding:9px 12px;white-space:nowrap}.fw-table td{border-top:1px solid #f3f4f6;padding:9px 12px;font-size:12px;white-space:nowrap}.fw-table td small{display:block;color:#9ca3af;margin-top:2px}.fw-actions{display:flex;gap:5px}.fw-actions button{padding:3px 6px;font-size:10px}.fw-badge{display:inline-block;border-radius:5px;padding:3px 7px;font-size:10px;font-style:normal;font-weight:700;background:#eef2f7}.fw-badge.good,.fw-badge.excellent,.fw-badge.normal,.fw-badge.online{background:#d1fae5;color:#047857}.fw-badge.average,.fw-badge.warning{background:#fef3c7;color:#b45309}.fw-badge.high,.fw-badge.critical,.fw-badge.offline{background:#fee2e2;color:#b91c1c}.fw-pagination{display:flex;justify-content:center;gap:4px;padding:10px}.fw-pagination button{min-width:29px;padding:5px}.fw-pagination button.active{background:#16a34a;color:#fff;border-color:#16a34a}.fw-wastage{display:grid;grid-template-columns:150px 1fr;align-items:center;gap:18px;padding:14px}.fw-wastage svg{width:145px}.fw-wastage p{font-size:11px;margin:8px 0}.fw-wastage i{width:11px;height:11px}.fw-summary-metrics{display:grid;grid-template-columns:repeat(3,1fr);padding:14px;border-bottom:1px solid #f0f2f5}.fw-summary-metrics div{text-align:center}.fw-summary-metrics span,.fw-summary-metrics strong{display:block}.fw-summary-metrics span{font-size:10px;color:#6b7280}.fw-summary-metrics strong{font-size:16px;margin-top:4px}.fw-system,.fw-alert{display:flex;align-items:center;gap:10px;padding:11px 16px;border-bottom:1px solid #f3f4f6}.fw-system>b{width:34px;height:34px;border-radius:8px;background:#e0f2fe;display:grid;place-items:center}.fw-system span,.fw-alert span{flex:1;min-width:0}.fw-system span strong,.fw-system span small,.fw-alert span strong,.fw-alert span small{display:block}.fw-system small,.fw-alert small{color:#8b93a5;font-size:10px;margin-top:3px}.fw-alert>i{width:9px;height:9px;border-radius:50%;background:#10b981}.fw-alert>i.warning{background:#f59e0b}.fw-alert>i.high{background:#ef4444}.fw-alert.read{opacity:.65}.fw-alert button{font-size:10px;padding:4px 7px}.fw-loading,.fw-empty{text-align:center;color:#8b93a5;padding:24px}.fw-modal-host{display:none}.fw-modal-host.open{display:block;position:fixed;inset:0;z-index:1000}.fw-backdrop{position:absolute;inset:0;background:#11182788}.fw-modal{position:relative;background:#fff;width:min(570px,calc(100% - 30px));max-height:88vh;overflow:auto;margin:6vh auto;border-radius:12px;box-shadow:0 24px 70px #0003}.fw-modal.wide{width:min(900px,calc(100% - 30px))}.fw-modal>header{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid #e8eaf0}.fw-modal>header h3{margin:0;font-size:16px}.fw-modal>header button{border:0;font-size:22px;padding:0}.fw-modal-body{padding:16px}.fw-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.fw-form-grid label{display:flex;flex-direction:column;gap:5px;font-size:11px;font-weight:600;color:#475467}.fw-form-grid label.full{grid-column:1/-1}.fw-form-grid input,.fw-form-grid select,.fw-form-grid textarea,.fw-filters input,.fw-filters select,.fw-card-header select{border:1px solid #d9dee8;border-radius:6px;padding:8px;background:#fff}.fw-form-grid textarea{min-height:70px;resize:vertical}.fw-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.fw-modal-list{border:1px solid #eef0f4;border-radius:8px;overflow:hidden}.fw-modal-row{display:flex;align-items:center;gap:12px;padding:12px;border-bottom:1px solid #eef0f4}.fw-modal-row:last-child{border-bottom:0}.fw-modal-row span{flex:1}.fw-modal-row strong,.fw-modal-row small{display:block}.fw-modal-row small{color:#8b93a5;margin-top:3px}.fw-toast{position:fixed;right:22px;bottom:22px;z-index:1100;background:#172033;color:#fff;border-radius:8px;padding:10px 14px;opacity:0;transform:translateY(12px);pointer-events:none;transition:.2s}.fw-toast.success,.fw-toast.error{opacity:1;transform:none}.fw-toast.error{background:#b91c1c}@media(max-width:1100px){.fw-stats{grid-template-columns:repeat(3,1fr)}}@media(max-width:780px){.fw-grid-2,.fw-summary-grid{grid-template-columns:1fr}.fw-stats{grid-template-columns:repeat(2,1fr)}.fw-form-grid{grid-template-columns:1fr}.fw-form-grid label.full{grid-column:auto}.fw-topbar{align-items:flex-start;flex-direction:column}}@media(max-width:500px){.fw-page{padding:12px}.fw-stats{grid-template-columns:1fr}.fw-wastage{grid-template-columns:1fr}.fw-summary-metrics{grid-template-columns:1fr;gap:10px}}
  `; document.head.appendChild(style);
}

function viewFeedAndWater() {
  injectFeedAndWaterStyles(); setTimeout(initFeedAndWater, 0);
  return `<div class="fw-page" id="fw-root">
    <div class="fw-topbar"><div class="fw-filters"><input id="fw-search" type="search" placeholder="Search batch or farm"><select id="fw-status-filter"><option>All</option><option>Excellent</option><option>Good</option><option>Average</option><option>Warning</option></select></div><div class="fw-topbar-actions"><button type="button" id="fw-refresh">Refresh</button></div></div>
    <div class="fw-stats" id="fw-stats">${fwLoading()}</div>
    <div class="fw-grid-2"><section class="fw-card"><header class="fw-card-header"><h3>Feed & Water Consumption Trend</h3><select id="fw-trend-days"><option value="7">Last 7 Days</option><option value="5">Last 5 Days</option></select></header><div class="fw-card-body"><div class="fw-legend"><span><i style="background:#16a34a"></i>Feed (kg)</span><span><i style="background:#3b82f6"></i>Water (L)</span></div><div id="fw-trend">${fwLoading()}</div></div></section>
      <section class="fw-card"><header class="fw-card-header"><h3>Consumption Summary (Today)</h3><button type="button" class="fw-link" data-download-report>Download Report <i class="fa-solid fa-arrow-right"></i></button></header><div class="fw-summary-grid"><div><span>Feed Summary</span><div class="fw-summary-box" id="fw-feed-summary">${fwLoading()}</div></div><div><span>Water Summary</span><div class="fw-summary-box" id="fw-water-summary">${fwLoading()}</div></div></div></section></div>
    <section class="fw-card"><header class="fw-card-header"><h3>Batch-wise Feed & Water Overview</h3><span>Live MongoDB readings</span></header><div class="fw-table-wrap"><table class="fw-table"><thead><tr><th>Batch / Farm</th><th>Birds</th><th>Age</th><th>Feed (kg)</th><th>Feed/Bird</th><th>FCR</th><th>Water (L)</th><th>Water/Bird</th><th>Status</th><th>Actions</th></tr></thead><tbody id="fw-batch-body"><tr><td colspan="9">${fwLoading()}</td></tr></tbody></table></div><div class="fw-pagination" id="fw-pagination"></div></section>
    <div class="fw-grid-2"><section class="fw-card"><header class="fw-card-header"><h3>Feed Wastage Analysis (This Month)</h3><button type="button" class="fw-link" data-view-wastage>View All <i class="fa-solid fa-arrow-right"></i></button></header><div class="fw-wastage" id="fw-wastage">${fwLoading()}</div></section>
      <section class="fw-card"><header class="fw-card-header"><h3>Feed Inventory</h3><button type="button" class="fw-link" data-view-inventory>View Inventory <i class="fa-solid fa-arrow-right"></i></button></header><div class="fw-summary-metrics" id="fw-inventory-summary">${fwLoading()}</div><table class="fw-table"><tbody id="fw-inventory-list"></tbody></table></section></div>
    <div class="fw-grid-2"><section class="fw-card"><header class="fw-card-header"><h3>Water System Status</h3><button type="button" class="fw-link" data-view-systems>View Status <i class="fa-solid fa-arrow-right"></i></button></header><div id="fw-systems">${fwLoading()}</div></section>
      <section class="fw-card"><header class="fw-card-header"><h3>Alerts & Notifications</h3><button type="button" class="fw-link" data-view-alerts>View All <i class="fa-solid fa-arrow-right"></i></button></header><div id="fw-alerts">${fwLoading()}</div></section></div>
    <div class="fw-modal-host" id="fw-modal-host"></div></div>`;
}
