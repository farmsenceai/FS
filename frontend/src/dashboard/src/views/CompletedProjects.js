/* views/CompletedProjects.js */

window.metaCompletedProjects = {
  title: 'Completed Projects',
  subtitle: 'Read-only results from completed FarmSence farm engagements.'
};

const CP_API = '/api/v2';
const CP_PAGE_SIZE = 5;
const CP_ON_TIME_TOLERANCE_MS = 2 * 24 * 60 * 60 * 1000;
const cpState = { rows: [], filtered: [], page: 1, expandedId: '', loading: true, error: '' };

function cpEscape(value) {
  const node = document.createElement('div');
  node.textContent = value == null ? '' : String(value);
  return node.innerHTML;
}
function cpId(value) { return String(value?._id || value || ''); }
function cpToken() { return localStorage.getItem('fs_token'); }
function cpDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function cpMoney(value) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0)); }
function cpNumber(value) { return new Intl.NumberFormat('en-IN').format(Number(value || 0)); }
function cpCsv(value) { return `"${String(value == null ? '' : value).replaceAll('"', '""')}"`; }
function cpClassify(farm) {
  const completed = new Date(farm.closedAt).getTime();
  const target = new Date(farm.expectedTenureEndDate).getTime();
  if (!farm.expectedTenureEndDate || !Number.isFinite(completed) || !Number.isFinite(target)) return { key: 'unknown', label: 'Not tracked' };
  const difference = completed - target;
  // Completion within ±2 calendar days of the target is considered on time.
  if (Math.abs(difference) <= CP_ON_TIME_TOLERANCE_MS) return { key: 'on-time', label: 'On Time' };
  return difference < 0 ? { key: 'early', label: 'Early' } : { key: 'delayed', label: 'Delayed' };
}
function cpStars(rating) {
  return Array.from({ length: 5 }, (_, index) => `<i class="fa-solid fa-star cp-star ${index < Math.round(rating) ? 'full' : ''}"></i>`).join('');
}
async function cpFetch(path) {
  const response = await fetch(`${CP_API}${path}`, { headers: { Authorization: `Bearer ${cpToken()}` } });
  let data = {};
  try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) throw new Error(data.error || data.message || 'Completed project data could not be loaded.');
  return data;
}

function cpInjectStyles() {
  if (document.getElementById('completed-projects-styles')) return;
  const style = document.createElement('style');
  style.id = 'completed-projects-styles';
  style.textContent = `
    .cp-page,.cp-page *{box-sizing:border-box}.cp-page{padding:20px;background:#f5f6fa;min-height:100%;font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033}
    .cp-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:18px}.cp-stat,.cp-card,.cp-table-wrap,.cp-filters{background:#fff;border:1px solid #e5e7eb;border-radius:10px}.cp-stat{padding:15px;display:flex;gap:11px;align-items:center}.cp-stat-icon{width:42px;height:42px;border-radius:9px;background:#ecfdf3;color:#16a34a;display:grid;place-items:center;font-size:20px}.cp-stat-value{font-size:19px;font-weight:800}.cp-stat-label,.cp-muted{font-size:11px;color:#667085}.cp-stat-sub{font-size:10px;color:#98a2b3;margin-top:2px}
    .cp-filters{padding:12px 15px;display:grid;grid-template-columns:minmax(220px,1fr) repeat(2,minmax(135px,auto)) auto auto auto;gap:9px;margin-bottom:14px}.cp-input,.cp-select,.cp-date{height:38px;border:1px solid #d1d5db;border-radius:7px;padding:0 10px;background:#fff;color:#344054;font:inherit;min-width:0}.cp-button{height:38px;border:1px solid #16a34a;border-radius:7px;background:#fff;color:#15803d;padding:0 13px;font:inherit;font-weight:700;cursor:pointer}.cp-button:disabled{opacity:.45;cursor:not-allowed}
    .cp-table-wrap{overflow:hidden;margin-bottom:16px}.cp-table-scroll{overflow-x:auto}.cp-table{width:100%;border-collapse:collapse}.cp-table th,.cp-table td{text-align:left;padding:11px 13px;border-bottom:1px solid #eef0f3;vertical-align:middle}.cp-table th{font-size:11px;color:#667085;background:#f8fafc;white-space:nowrap}.cp-project{font-weight:800}.cp-farm{font-size:11px;color:#667085;margin-top:3px}.cp-batch{display:inline-block;margin-top:4px;padding:2px 7px;border-radius:5px;background:#f2f4f7;font-size:10px}.cp-status{display:inline-block;margin-top:4px;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:800}.cp-status.early{background:#dcfce7;color:#166534}.cp-status.on-time{background:#dbeafe;color:#1d4ed8}.cp-status.delayed{background:#fee2e2;color:#991b1b}.cp-status.unknown{background:#f2f4f7;color:#475467}.cp-star{color:#e5e7eb}.cp-star.full{color:#f59e0b}.cp-rating{font-size:10px;color:#667085;margin-top:2px}.cp-detail-row td{background:#f8fafc;padding:16px}.cp-detail-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.cp-fact{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:11px}.cp-fact span{display:block;font-size:10px;color:#667085;margin-bottom:4px}.cp-fact.description{grid-column:1/-1}.cp-footer{display:flex;justify-content:space-between;align-items:center;padding:11px 15px}.cp-pages{display:flex;gap:4px}.cp-page-btn{width:30px;height:30px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer}.cp-page-btn.active{background:#16a34a;color:#fff;border-color:#16a34a}.cp-empty,.cp-error,.cp-loading{padding:44px;text-align:center;color:#667085}.cp-error{color:#b42318}
    .cp-bottom{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}.cp-card{overflow:hidden}.cp-head{padding:13px 16px;border-bottom:1px solid #eef0f3;font-weight:800}.cp-body{padding:16px}.cp-gallery-empty{min-height:190px;display:grid;place-items:center;text-align:center;color:#667085;background:#f8fafc;border:1px dashed #d0d5dd;border-radius:8px;padding:20px}.cp-donut-wrap{display:flex;align-items:center;gap:20px;justify-content:center}.cp-donut{width:128px;height:128px;border-radius:50%;display:grid;place-items:center;position:relative}.cp-donut:after{content:"";position:absolute;width:82px;height:82px;border-radius:50%;background:#fff}.cp-donut-center{z-index:1;text-align:center;font-size:24px;font-weight:800}.cp-donut-center small{display:block;font-size:9px;color:#667085;font-weight:500}.cp-legend{display:grid;gap:8px}.cp-legend-row{display:grid;grid-template-columns:10px 1fr auto;gap:7px;align-items:center}.cp-dot{width:10px;height:10px;border-radius:50%}.cp-rating-top{display:flex;gap:16px;align-items:flex-start}.cp-rating-big{font-size:34px;font-weight:800}.cp-bars{flex:1}.cp-bar-row{display:grid;grid-template-columns:25px 1fr 22px;gap:6px;align-items:center;margin-bottom:4px;font-size:10px}.cp-bar{height:7px;background:#f2f4f7;border-radius:9px;overflow:hidden}.cp-bar-fill{height:100%;background:#16a34a}.cp-review{background:#f8fafc;border-radius:8px;padding:9px 11px;margin-top:9px;font-size:11px;line-height:1.4}.cp-review strong{display:block;margin-top:5px}.cp-review-empty{color:#667085;text-align:center;padding:30px 0}
    @media(max-width:1150px){.cp-stats{grid-template-columns:repeat(3,1fr)}.cp-bottom{grid-template-columns:1fr 1fr}.cp-bottom .cp-card:last-child{grid-column:1/-1}.cp-filters{grid-template-columns:1fr 1fr 1fr}.cp-detail-grid{grid-template-columns:1fr 1fr}}@media(max-width:700px){.cp-stats,.cp-bottom,.cp-filters{grid-template-columns:1fr}.cp-bottom .cp-card:last-child{grid-column:auto}.cp-detail-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}

function cpStat(label, value, sub, icon) {
  return `<div class="cp-stat"><div class="cp-stat-icon">${icon}</div><div><div class="cp-stat-value">${value}</div><div class="cp-stat-label">${label}</div><div class="cp-stat-sub">${sub}</div></div></div>`;
}
function cpMetrics() {
  const rows = cpState.rows;
  const rated = rows.filter(row => row.reviewCount > 0);
  const average = rated.length ? rated.reduce((sum, row) => sum + row.averageRating, 0) / rated.length : null;
  const year = new Date().getFullYear();
  return {
    total: rows.length,
    // Capacity is historical batch throughput: summed initial placements across every batch at each closed farm.
    // It is not simultaneous physical shed capacity.
    capacity: rows.reduce((sum, row) => sum + row.totalBatchCapacity, 0),
    thisYear: rows.filter(row => new Date(row.closedAt).getFullYear() === year).length,
    value: rows.reduce((sum, row) => sum + row.projectValue, 0),
    average, ratedCount: rated.length
  };
}
function cpRenderStats() {
  const metrics = cpMetrics();
  document.getElementById('cp-stats').innerHTML = [
    cpStat('Total Completed Projects', cpNumber(metrics.total), 'Closed farms', '<i class="fa-solid fa-check"></i>'),
    cpStat('Total Capacity', cpNumber(metrics.capacity), 'Most recent batch birds', '<i class="fa-solid fa-bullseye"></i>'),
    cpStat('Completed This Year', cpNumber(metrics.thisYear), 'Closed farms', '<i class="fa-regular fa-calendar-check"></i>'),
    cpStat('Total Project Value', cpMoney(metrics.value), 'Farm-level fee totals', '₹'),
    cpStat('Average Project Rating', metrics.average == null ? 'No ratings yet' : `${metrics.average.toFixed(1)}/5`, metrics.ratedCount ? `From ${metrics.ratedCount} rated project${metrics.ratedCount === 1 ? '' : 's'}` : 'No reviewed projects', '<i class="fa-solid fa-star"></i>')
  ].join('');
}
function cpCapacityBand(capacity) {
  if (capacity < 15000) return 'under-15k';
  if (capacity <= 20000) return '15k-20k';
  return 'over-20k';
}
function cpApplyFilters() {
  const search = document.getElementById('cp-search').value.trim().toLowerCase();
  const farm = document.getElementById('cp-farm-filter').value;
  const capacity = document.getElementById('cp-capacity-filter').value;
  const from = document.getElementById('cp-from').value ? new Date(`${document.getElementById('cp-from').value}T00:00:00`).getTime() : -Infinity;
  const to = document.getElementById('cp-to').value ? new Date(`${document.getElementById('cp-to').value}T23:59:59`).getTime() : Infinity;
  cpState.filtered = cpState.rows.filter(row => {
    const haystack = `${row.farmName} ${row.location} ${row.batchCode} ${row.breed}`.toLowerCase();
    const completed = new Date(row.closedAt).getTime();
    return (!search || haystack.includes(search)) && (!farm || row.farmId === farm) && (!capacity || cpCapacityBand(row.capacity) === capacity) && completed >= from && completed <= to;
  });
  cpState.page = 1;
  cpRenderTable();
}
function cpPopulateFilters() {
  const farms = [...new Map(cpState.rows.map(row => [row.farmId, row.farmName])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  document.getElementById('cp-farm-filter').innerHTML = `<option value="">All Farms</option>${farms.map(([id, name]) => `<option value="${cpEscape(id)}">${cpEscape(name)}</option>`).join('')}`;
  const capacityLabels = { 'under-15k': 'Under 15,000', '15k-20k': '15,000–20,000', 'over-20k': 'Over 20,000' };
  const availableBands = [...new Set(cpState.rows.filter(row => row.capacity > 0).map(row => cpCapacityBand(row.capacity)))];
  document.getElementById('cp-capacity-filter').innerHTML = `<option value="">All Capacity</option>${availableBands.map(band => `<option value="${band}">${capacityLabels[band]}</option>`).join('')}`;
}
function cpRow(row) {
  const expanded = cpState.expandedId === row.farmId;
  const projectHistory = row.projects.length ? row.projects.map(project => `<div class="cp-fact"><span>${cpEscape(project.status)} · ${Number(project.percentComplete || 0)}%</span><strong>${cpEscape(project.title)}</strong><div class="cp-muted">${cpDate(project.startDate)} <i class="fa-solid fa-arrow-right"></i> ${cpDate(project.targetDate)}</div></div>`).join('') : '<div class="cp-fact"><span>Construction history</span>No construction projects recorded.</div>';
  const updates = row.workUpdates.slice(0, 4).map(update => `<div class="cp-fact"><span>${cpDate(update.createdAt)}</span>${cpEscape(update.note)}</div>`).join('');
  return `<tr><td><div class="cp-project">${cpEscape(row.farmName)}</div><span class="cp-batch">${cpEscape(row.batchCode || 'No batch')}</span></td><td>${cpEscape(row.location || 'Location not recorded')}</td><td><strong>${row.capacity ? `${cpNumber(row.capacity)} birds` : 'No batch capacity'}</strong><div class="cp-muted">${cpEscape(row.breed || '—')}</div></td><td>${cpEscape(cpDate(row.closedAt))}<br><span class="cp-status ${row.classification.key}">${row.classification.label}</span></td><td><strong>${cpEscape(cpMoney(row.projectValue))}</strong></td><td>${row.reviewCount ? `<div>${cpStars(row.averageRating)}</div><div class="cp-rating">${row.averageRating.toFixed(1)} · ${row.reviewCount} review${row.reviewCount === 1 ? '' : 's'}</div>` : '<span class="cp-muted">Not yet rated</span>'}</td><td><button class="cp-button" data-cp-details="${cpEscape(row.farmId)}">${expanded ? 'Hide Details' : 'View Details'}</button></td></tr>${expanded ? `<tr class="cp-detail-row"><td colspan="7"><div class="cp-detail-grid"><div class="cp-fact"><span>Expected tenure end</span><strong>${row.expectedTenureEndDate ? cpEscape(cpDate(row.expectedTenureEndDate)) : 'Not tracked'}</strong></div><div class="cp-fact"><span>Closed</span><strong>${cpEscape(cpDate(row.closedAt))}</strong></div>${projectHistory}${updates}<div class="cp-fact description"><span>Farm history</span>${row.projects.length} construction project${row.projects.length === 1 ? '' : 's'} · ${row.workUpdates.length} work update${row.workUpdates.length === 1 ? '' : 's'}</div></div></td></tr>` : ''}`;
}
function cpRenderTable() {
  const tbody = document.getElementById('cp-table-body');
  const total = cpState.filtered.length;
  const pages = Math.max(1, Math.ceil(total / CP_PAGE_SIZE));
  cpState.page = Math.min(cpState.page, pages);
  const start = (cpState.page - 1) * CP_PAGE_SIZE;
  const visible = cpState.filtered.slice(start, start + CP_PAGE_SIZE);
  tbody.innerHTML = visible.length ? visible.map(cpRow).join('') : `<tr><td colspan="7"><div class="cp-empty">${cpState.rows.length ? 'No completed farms match these filters.' : 'No farm tenures have been completed yet.'}</div></td></tr>`;
  document.getElementById('cp-showing').textContent = total ? `Showing ${start + 1} to ${Math.min(start + CP_PAGE_SIZE, total)} of ${total} projects` : 'Showing 0 projects';
  document.getElementById('cp-pages').innerHTML = Array.from({ length: pages }, (_, index) => `<button class="cp-page-btn ${index + 1 === cpState.page ? 'active' : ''}" data-cp-page="${index + 1}">${index + 1}</button>`).join('');
  tbody.querySelectorAll('[data-cp-details]').forEach(button => button.addEventListener('click', () => { cpState.expandedId = cpState.expandedId === button.dataset.cpDetails ? '' : button.dataset.cpDetails; cpRenderTable(); }));
  document.querySelectorAll('[data-cp-page]').forEach(button => button.addEventListener('click', () => { cpState.page = Number(button.dataset.cpPage); cpRenderTable(); }));
}
function cpRenderBottom() {
  const counts = { early: 0, 'on-time': 0, delayed: 0, unknown: 0 };
  cpState.rows.forEach(row => { counts[row.classification.key] += 1; });
  const total = cpState.rows.length;
  const earlyPct = total ? counts.early / total * 100 : 0;
  const onTimePct = total ? counts['on-time'] / total * 100 : 0;
  const delayedPct = total ? counts.delayed / total * 100 : 0;
  document.getElementById('cp-donut').style.background = total ? `conic-gradient(#16a34a 0 ${earlyPct}%,#3b82f6 ${earlyPct}% ${earlyPct + onTimePct}%,#ef4444 ${earlyPct + onTimePct}% ${earlyPct + onTimePct + delayedPct}%,#d1d5db 0)` : '#eef0f3';
  document.getElementById('cp-donut-center').innerHTML = `${total}<small>COMPLETED</small>`;
  document.getElementById('cp-legend').innerHTML = [['Early', counts.early, '#16a34a'], ['On Time', counts['on-time'], '#3b82f6'], ['Delayed', counts.delayed, '#ef4444'], ...(counts.unknown ? [['Not tracked', counts.unknown, '#d1d5db']] : [])].map(([label, count, color]) => `<div class="cp-legend-row"><span class="cp-dot" style="background:${color}"></span><span>${label}</span><strong>${count} (${total ? Math.round(count / total * 100) : 0}%)</strong></div>`).join('');
  const reviews = cpState.rows.flatMap(row => row.reviews.map(review => ({ ...review, farmName: row.farmName })));
  const distribution = [5, 4, 3, 2, 1].map(star => [star, cpState.rows.reduce((sum, row) => sum + Number(row.distribution[star] || 0), 0)]);
  const reviewCount = distribution.reduce((sum, entry) => sum + entry[1], 0);
  const average = reviewCount ? distribution.reduce((sum, [star, count]) => sum + star * count, 0) / reviewCount : 0;
  document.getElementById('cp-satisfaction').innerHTML = reviewCount ? `<div class="cp-rating-top"><div><div class="cp-rating-big">${average.toFixed(1)}</div><div>${cpStars(average)}</div><div class="cp-muted">${reviewCount} review${reviewCount === 1 ? '' : 's'}</div></div><div class="cp-bars">${distribution.map(([star, count]) => `<div class="cp-bar-row"><span>${star} <i class="fa-solid fa-star"></i></span><div class="cp-bar"><div class="cp-bar-fill" style="width:${count / reviewCount * 100}%"></div></div><strong>${count}</strong></div>`).join('')}</div></div>${reviews.filter(review => review.reviewText).slice(0, 2).map(review => `<div class="cp-review">“${cpEscape(review.reviewText)}”<strong>${cpEscape(review.farmerName)} · ${cpEscape(review.farmName)}</strong></div>`).join('')}` : '<div class="cp-review-empty">No reviews yet.</div>';
}
function cpExport() {
  if (!cpState.filtered.length) return;
  const headers = ['Farm', 'Location', 'Batch', 'Breed', 'Capacity', 'Closed At', 'Expected Tenure End', 'Schedule', 'Farm Fee Total', 'Average Rating', 'Review Count'];
  const lines = [headers, ...cpState.filtered.map(row => [row.farmName, row.location, row.batchCode, row.breed, row.capacity, row.closedAt, row.expectedTenureEndDate, row.classification.label, row.projectValue, row.reviewCount ? row.averageRating.toFixed(2) : '', row.reviewCount])].map(values => values.map(cpCsv).join(','));
  const url = URL.createObjectURL(new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `completed-projects-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 0);
}
async function cpLoadFarm(farm) {
  const farmId = cpId(farm);
  const [batchesResult, feeSummary, rating, projectsResult, updatesResult] = await Promise.all([cpFetch(`/farms/${farmId}/batches?limit=100`), cpFetch(`/farmer-fees/summary?farmId=${encodeURIComponent(farmId)}`), cpFetch(`/farms/${farmId}/rating`), cpFetch(`/farms/${farmId}/projects?limit=100`), cpFetch(`/farms/${farmId}/work-updates?limit=100`)]);
  const batches = (batchesResult.data || []).slice().sort((a, b) => new Date(b.placedAt || b.createdAt) - new Date(a.placedAt || a.createdAt));
  const batch = batches[0] || null;
  return [{ farmId, farmName: farm.name || farm.code, location: farm.location?.address || '', closedAt: farm.closedAt, expectedTenureEndDate: farm.expectedTenureEndDate, classification: cpClassify(farm), batchCode: batch?.code || '', breed: batch?.breed || '', capacity: Number(batch?.initialBirdCount || 0), totalBatchCapacity: batches.reduce((sum, item) => sum + Number(item.initialBirdCount || 0), 0), projectValue: Number(feeSummary.totalPaid || 0) + Number(feeSummary.totalPending || 0), reviewCount: Number(rating.reviewCount || 0), averageRating: Number(rating.averageRating || 0), distribution: rating.distribution || {}, reviews: (rating.recentReviews || []).map(review => ({ rating: Number(review.rating), reviewText: review.reviewText || '', farmerName: review.farmerId?.name || 'Unknown farmer' })), projects: projectsResult.data || [], workUpdates: updatesResult.data || [] }];
}
async function cpInit() {
  ['cp-search', 'cp-farm-filter', 'cp-capacity-filter', 'cp-from', 'cp-to'].forEach(id => document.getElementById(id).addEventListener(id === 'cp-search' ? 'input' : 'change', cpApplyFilters));
  document.getElementById('cp-export').addEventListener('click', cpExport);
  try {
    const farmsResult = await cpFetch('/farms?limit=100');
    // Parallel farm fan-out matches Ongoing Projects and avoids sequential request latency.
    const closedFarms = (farmsResult.data || []).filter(farm => farm.status === 'closed');
    const results = await Promise.allSettled(closedFarms.map(cpLoadFarm));
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length === results.length && failures.length) throw failures[0].reason;
    cpState.rows = results.filter(result => result.status === 'fulfilled').flatMap(result => result.value).sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt));
    cpState.filtered = cpState.rows.slice(); cpState.loading = false;
    cpPopulateFilters(); cpRenderStats(); cpRenderTable(); cpRenderBottom();
    document.getElementById('cp-export').disabled = !cpState.rows.length;
    if (failures.length) document.getElementById('cp-data-note').textContent = `${failures.length} farm${failures.length === 1 ? '' : 's'} could not be loaded.`;
  } catch (error) {
    cpState.error = error.message; cpState.loading = false;
    document.getElementById('cp-table-body').innerHTML = `<tr><td colspan="7"><div class="cp-error">${cpEscape(error.message)}</div></td></tr>`;
    document.getElementById('cp-showing').textContent = 'Project data unavailable'; document.getElementById('cp-export').disabled = true;
  }
}

function viewCompletedProjects() {
  cpInjectStyles();
  cpState.rows = []; cpState.filtered = []; cpState.page = 1; cpState.expandedId = ''; cpState.loading = true; cpState.error = '';
  setTimeout(cpInit, 0);
  return `<div class="cp-page"><div id="cp-stats" class="cp-stats">${['Farms','Capacity','This year','Value','Rating'].map(label => cpStat(label, '—', 'Loading real data…', '·')).join('')}</div><div class="cp-filters"><input id="cp-search" class="cp-input" type="search" placeholder="Search by farm name, location or batch..."><select id="cp-farm-filter" class="cp-select"><option value="">All Farms</option></select><select id="cp-capacity-filter" class="cp-select"><option value="">All Capacity</option><option value="under-15k">Under 15,000</option><option value="15k-20k">15,000–20,000</option><option value="over-20k">Over 20,000</option></select><input id="cp-from" class="cp-date" type="date" title="Completed from"><input id="cp-to" class="cp-date" type="date" title="Completed through"><button id="cp-export" class="cp-button" disabled>Export Report</button></div><div id="cp-data-note" class="cp-muted" style="margin:-7px 0 10px"></div><div class="cp-table-wrap"><div class="cp-table-scroll"><table class="cp-table"><thead><tr><th>Farm</th><th>Location</th><th>Batch & Capacity</th><th>Completed On</th><th>Project Value</th><th>Rating</th><th>Actions</th></tr></thead><tbody id="cp-table-body"><tr><td colspan="7"><div class="cp-loading">Loading completed farms…</div></td></tr></tbody></table></div><div class="cp-footer"><span id="cp-showing" class="cp-muted">Loading farm count…</span><div id="cp-pages" class="cp-pages"></div></div></div><div class="cp-bottom"><section class="cp-card"><div class="cp-head">Project Gallery</div><div class="cp-body"><div class="cp-gallery-empty"><div><strong>Project photos are not yet tracked in the system</strong><div class="cp-muted" style="margin-top:6px">Photos will appear here when project media is supported.</div></div></div></div></section><section class="cp-card"><div class="cp-head">Completion Summary</div><div class="cp-body cp-donut-wrap"><div id="cp-donut" class="cp-donut"><div id="cp-donut-center" class="cp-donut-center">—<small>LOADING</small></div></div><div id="cp-legend" class="cp-legend"><span class="cp-muted">Loading schedule results…</span></div></div></section><section class="cp-card"><div class="cp-head">Customer Satisfaction</div><div id="cp-satisfaction" class="cp-body"><div class="cp-review-empty">Loading real reviews…</div></div></section></div></div>`;
}
