/* views/BatchManagement.js */

window.metaBatchManagement = {
  title: 'Batch Management',
  subtitle: 'Monitor and manage your farm operations in real-time.'
};

/* ── API base ── */
const BM_API = '/api/batch';

/* ── Helper functions (rendering) ── */

function bmStatCard(icon, bg, label, value, sub, trend, change) {
  const isUp = trend === 'up';
  const trendColor = isUp ? '#16a34a' : '#ef4444';
  const trendArrow = `<i class="fa-solid fa-arrow-trend-${isUp ? 'up' : 'down'}"></i>`;
  return `
    <div class="bm-stat-card">
      <div class="bm-stat-icon" style="background:${bg}">${icon}</div>
      <div class="bm-stat-right">
        <div class="bm-stat-label">${label}</div>
        <div class="bm-stat-value">${value}</div>
        <div class="bm-stat-sub">${sub}</div>
        ${trend ? `<div class="bm-stat-trend" style="color:${trendColor}">${trendArrow} ${change}</div>` : ''}
      </div>
    </div>`;
}

function bmBatchRow(b) {
  const status = b.status || 'New';
  const sc = status === 'Excellent' ? 'bm-s-excellent' : status === 'Good' ? 'bm-s-good' : 'bm-s-avg';
  const mortColor = parseFloat(b.mortality) > 2.4 ? '#ef4444' : '#111827';
  const doaLabel = b.doa ? new Date(b.doa).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  return `
    <tr>
      <td>
        <div class="bm-batch-id"><a href="#" class="bm-batch-link">${b.batchId}</a></div>
        <div class="bm-farm-name">${b.farm}${b.shed ? ` · ${b.shed}` : ''} ${b.source === 'farmer' ? '<span class="bm-farmer-source">Farmer submission</span>' : ''}</div>
      </td>
      <td>${b.breed}</td>
      <td>${doaLabel}</td>
      <td>${Number(b.birds).toLocaleString()}</td>
      <td>${b.ageDays} Days</td>
      <td style="color:${mortColor};font-weight:${parseFloat(b.mortality) > 2.4 ? '700' : '400'};">${Number(b.mortality).toFixed(2)}%</td>
      <td>${Number.isFinite(Number(b.fcr)) ? Number(b.fcr).toFixed(2) : 'Not reported'}</td>
      <td><span class="bm-status-badge ${sc}">${status}</span></td>
      <td><span class="bm-more"><i class="fa-solid fa-ellipsis-vertical"></i></span></td>
    </tr>`;
}

function bmOpsRow(op) {
  const sc = op.status === 'Completed' ? 'bm-ops-completed' : op.status === 'In Progress' ? 'bm-ops-inprogress' : 'bm-ops-scheduled';
  return `
    <div class="bm-ops-row">
      <div class="bm-ops-icon" style="background:${op.iconBg}"></div>
      <div class="bm-ops-body">
        <div class="bm-ops-title">${op.title}</div>
        <div class="bm-ops-sub">${op.sub}</div>
      </div>
      <div class="bm-ops-time">${op.time}</div>
      <span class="bm-ops-badge ${sc}">${op.status}</span>
    </div>`;
}

function bmAlertRow(a) {
  return `
    <div class="bm-alert-row">
      <div class="bm-alert-icon" style="background:${a.iconBg}">${a.icon || ''}</div>
      <div class="bm-alert-body">
        <div class="bm-alert-title">${a.title}</div>
        <div class="bm-alert-desc">${a.desc}</div>
      </div>
      <div class="bm-alert-time">${a.time}</div>
    </div>`;
}

function bmInventoryRow(item) {
  return `
    <div class="bm-inv-row">
      <div class="bm-inv-icon"></div>
      <div class="bm-inv-body">
        <div class="bm-inv-label">${item.label}</div>
        <div class="bm-inv-status">${item.status}</div>
      </div>
      <div class="bm-inv-bar-wrap">
        <div class="bm-inv-bar" style="width:${item.barWidth}%;background:${item.barColor};"></div>
      </div>
      <div class="bm-inv-detail">${item.detail || ''}</div>
    </div>`;
}

function bmFarmRow(f) {
  const starHtml = Array.from({ length: 5 }, (_, i) => `<i class="fa-solid fa-star" style="color:${i < f.stars ? '#f59e0b' : '#d1d5db'};"></i>`).join('');
  return `
    <tr>
      <td>${f.name}</td>
      <td>${f.batches}</td>
      <td>${Number(f.birds).toLocaleString()}</td>
      <td>${Number(f.mortality).toFixed(2)}%</td>
      <td>${Number.isFinite(Number(f.fcr)) ? Number(f.fcr).toFixed(2) : 'Not reported'}</td>
      <td>${starHtml}</td>
    </tr>`;
}

function injectBatchManagementStyles() {
  if (document.getElementById('bm-styles')) return;
  const style = document.createElement('style');
  style.id = 'bm-styles';
  style.textContent = `
    .bm-scrollable, .bm-scrollable * { box-sizing: border-box; }
    .bm-scrollable { padding: 20px; background: #f5f6fa; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #1a1a2e; }

    /* Stat row */
    .bm-stat-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 18px; }
    .bm-stat-card { background: #fff; border-radius: 10px; padding: 14px 16px; border: 1px solid #e8eaf0; display: flex; align-items: flex-start; gap: 12px; min-width: 0; }
    .bm-stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
    .bm-stat-right { flex: 1; min-width: 0; }
    .bm-stat-label { font-size: 11px; color: #6b7280; margin-bottom: 2px; }
    .bm-stat-value { font-size: 20px; font-weight: 800; line-height: 1.1; }
    .bm-stat-sub { font-size: 10px; color: #9ca3af; margin-top: 2px; }
    .bm-stat-trend { font-size: 10px; font-weight: 600; margin-top: 4px; }

    /* Main two-column layout (batches + right side panel) */
    .bm-main-grid { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 16px; margin-bottom: 16px; width: 100%; align-items: start; }
    .bm-main-grid > div { min-width: 0; }

    /* Cards */
    .bm-card { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; overflow: hidden; margin-bottom: 16px; width: 100%; }
    .bm-card-header { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px 10px; border-bottom: 1px solid #f3f4f6; gap: 8px; }
    .bm-card-title { font-size: 13px; font-weight: 700; }
    .bm-card-subtitle { font-size: 11px; color: #9ca3af; margin-left: 6px; }
    .bm-card-link { font-size: 11px; color: #16a34a; text-decoration: none; font-weight: 600; white-space: nowrap; cursor: pointer; }

    /* Bottom three-up row (Today's Ops / Alerts / Inventory) */
    .bm-three-col { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 16px; width: 100%; }
    .bm-three-col > .bm-card { margin-bottom: 0; min-width: 0; }

    /* Table */
    .bm-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .bm-table th { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px; padding: 8px 14px; text-align: left; background: #f9fafb; border-bottom: 1px solid #f3f4f6; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bm-table td { padding: 10px 14px; font-size: 12px; border-bottom: 1px solid #f9fafb; vertical-align: middle; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bm-table tr:last-child td { border-bottom: none; }
    .bm-batch-link { color: #16a34a; font-weight: 700; text-decoration: none; font-size: 12px; }
    .bm-farm-name { font-size: 10px; color: #9ca3af; margin-top: 1px; }
    .bm-farmer-source { display: inline-block; margin-left: 4px; padding: 1px 4px; border-radius: 4px; background: #d1fae5; color: #047857; font-size: 8px; font-weight: 700; }
    .bm-more { font-size: 18px; color: #9ca3af; cursor: pointer; }
    .bm-status-badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 5px; font-size: 10px; font-weight: 700; }
    .bm-s-excellent { background: #d1fae5; color: #059669; }
    .bm-s-good { background: #dbeafe; color: #2563eb; }
    .bm-s-avg { background: #fef3c7; color: #d97706; }
    .bm-table-footer { padding: 10px 16px; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
    .bm-empty { padding: 20px 16px; font-size: 12px; color: #9ca3af; text-align: center; }

    /* Farm Performance panel */
    .bm-perf-body { padding: 14px 16px; }
    .bm-perf-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
    .bm-perf-cell { background: #f9fafb; border-radius: 8px; padding: 10px 12px; min-width: 0; }
    .bm-perf-label { font-size: 10px; color: #6b7280; margin-bottom: 3px; }
    .bm-perf-val { font-size: 17px; font-weight: 800; }
    .bm-perf-change { font-size: 10px; font-weight: 600; margin-top: 3px; }
    .bm-perf-up { color: #16a34a; }
    .bm-perf-dn { color: #ef4444; }

    /* FCR Trend chart */
    .bm-chart-title { font-size: 11px; font-weight: 700; margin-bottom: 8px; display: flex; justify-content: space-between; }
    .bm-chart-legend { font-size: 10px; color: #9ca3af; }

    /* Today's Operations */
    .bm-ops-row { display: flex; align-items: center; gap: 10px; padding: 9px 16px; border-bottom: 1px solid #f9fafb; }
    .bm-ops-row:last-child { border-bottom: none; }
    .bm-ops-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
    .bm-ops-body { flex: 1; min-width: 0; }
    .bm-ops-title { font-size: 12px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bm-ops-sub { font-size: 10px; color: #9ca3af; margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bm-ops-time { font-size: 11px; color: #6b7280; flex-shrink: 0; min-width: 52px; text-align: right; }
    .bm-ops-badge { padding: 3px 10px; border-radius: 5px; font-size: 10px; font-weight: 700; flex-shrink: 0; }
    .bm-ops-completed { background: #d1fae5; color: #059669; }
    .bm-ops-inprogress { background: #fef3c7; color: #d97706; }
    .bm-ops-scheduled { background: #f3f4f6; color: #6b7280; }
    .bm-ops-footer-link { display: block; text-align: center; padding: 9px; font-size: 11px; font-weight: 600; color: #16a34a; text-decoration: none; border-top: 1px solid #f3f4f6; cursor: pointer; }

    /* Alerts */
    .bm-alert-row { display: flex; align-items: flex-start; gap: 10px; padding: 9px 16px; border-bottom: 1px solid #f9fafb; }
    .bm-alert-row:last-child { border-bottom: none; }
    .bm-alert-icon { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
    .bm-alert-body { flex: 1; min-width: 0; }
    .bm-alert-title { font-size: 12px; font-weight: 600; }
    .bm-alert-desc { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .bm-alert-time { font-size: 10px; color: #9ca3af; flex-shrink: 0; }
    .bm-alert-footer-link { display: block; text-align: center; padding: 9px; font-size: 11px; font-weight: 600; color: #16a34a; text-decoration: none; border-top: 1px solid #f3f4f6; cursor: pointer; }

    /* Resource Inventory */
    .bm-inv-body-wrap { padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
    .bm-inv-row { display: flex; align-items: center; gap: 10px; }
    .bm-inv-icon { width: 28px; height: 28px; background: #f3f4f6; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
    .bm-inv-body { flex: 1; min-width: 0; }
    .bm-inv-label { font-size: 12px; font-weight: 600; }
    .bm-inv-status { font-size: 10px; color: #6b7280; margin-top: 1px; }
    .bm-inv-bar-wrap { width: 80px; height: 6px; background: #f3f4f6; border-radius: 3px; overflow: hidden; flex-shrink: 0; }
    .bm-inv-bar { height: 100%; border-radius: 3px; }
    .bm-inv-detail { font-size: 10px; color: #9ca3af; flex-shrink: 0; min-width: 70px; text-align: right; }
    .bm-inv-link { display: block; text-align: center; padding: 9px; font-size: 11px; font-weight: 600; color: #16a34a; text-decoration: none; border-top: 1px solid #f3f4f6; cursor: pointer; }

    /* Quick Actions */
    .bm-qa-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; padding: 14px 16px; }
    .bm-qa-btn { background: #f9fafb; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; border: 1px solid #e8eaf0; transition: background .15s; min-width: 0; }
    .bm-qa-btn:hover { background: #f0fdf4; }
    .bm-qa-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; }
    .bm-qa-label { font-size: 10px; font-weight: 600; color: #374151; text-align: center; line-height: 1.3; }

    /* Modal */
    .bm-modal-overlay { position: fixed; inset: 0; background: rgba(17,24,39,.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
    .bm-modal { background: #fff; border-radius: 12px; width: 100%; max-width: 560px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; }
    .bm-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f3f4f6; }
    .bm-modal-title { font-size: 14px; font-weight: 700; }
    .bm-modal-close { cursor: pointer; font-size: 18px; color: #9ca3af; background: none; border: none; line-height: 1; }
    .bm-modal-body { padding: 16px 20px; overflow-y: auto; }
    .bm-form-row { margin-bottom: 12px; display: flex; flex-direction: column; gap: 5px; }
    .bm-form-row label { font-size: 11px; font-weight: 600; color: #374151; }
    .bm-form-row input, .bm-form-row select { padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 12px; font-family: inherit; }
    .bm-form-error { color: #ef4444; font-size: 11px; margin-top: 6px; min-height: 14px; }
    .bm-modal-footer { padding: 12px 20px; border-top: 1px solid #f3f4f6; display: flex; justify-content: flex-end; gap: 10px; }
    .bm-btn { padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid transparent; }
    .bm-btn-primary { background: #16a34a; color: #fff; }
    .bm-btn-primary:hover { background: #15803d; }
    .bm-btn-secondary { background: #f3f4f6; color: #374151; }
    .bm-modal-list-row { padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
    .bm-modal-list-row:last-child { border-bottom: none; }
  `;
  document.head.appendChild(style);
}

/* ── Modal helpers ── */
function bmCloseModal() {
  const el = document.getElementById('bm-modal-root');
  if (el) el.remove();
}

function bmOpenModal(title, bodyHtml, footerHtml) {
  bmCloseModal();
  const wrap = document.createElement('div');
  wrap.id = 'bm-modal-root';
  wrap.className = 'bm-modal-overlay';
  wrap.innerHTML = `
    <div class="bm-modal">
      <div class="bm-modal-header">
        <span class="bm-modal-title">${title}</span>
        <button class="bm-modal-close" id="bm-modal-close-btn">&times;</button>
      </div>
      <div class="bm-modal-body">${bodyHtml}</div>
      ${footerHtml ? `<div class="bm-modal-footer">${footerHtml}</div>` : ''}
    </div>`;
  document.body.appendChild(wrap);
  wrap.addEventListener('click', (e) => { if (e.target === wrap) bmCloseModal(); });
  document.getElementById('bm-modal-close-btn').addEventListener('click', bmCloseModal);
  return wrap;
}

/* ── Data fetch + "View All" style modals ── */
async function bmFetchJson(url, options) {
  const token = localStorage.getItem('fs_token');
  const fetchOptions = options ? { ...options } : {};
  const headers = { ...(fetchOptions.headers || {}) };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  fetchOptions.headers = headers;

  const res = await fetch(url, fetchOptions);
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    localStorage.removeItem('fs_token');
    localStorage.removeItem('fs_user');
    window.location.href = '../pages/sign-in.html';
    throw new Error(data.msg || 'Please sign in again.');
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function bmShowAllBatches() {
  bmOpenModal('All Active Batches', '<div class="bm-empty">Loading…</div>');
  try {
    const { batches } = await bmFetchJson(`${BM_API}/batches`);
    const rows = batches.map(b => `
      <div class="bm-modal-list-row">
        <strong>${b.batchId}</strong> — ${b.farm} · ${b.breed}<br>
        <span style="color:#6b7280">${Number(b.birds).toLocaleString()} birds · ${b.ageDays} days · Mortality ${Number(b.mortality).toFixed(2)}% · FCR ${Number(b.fcr).toFixed(2)} · ${b.status}</span>
      </div>`).join('') || '<div class="bm-empty">No batches found.</div>';
    document.querySelector('#bm-modal-root .bm-modal-body').innerHTML = rows;
  } catch (e) {
    document.querySelector('#bm-modal-root .bm-modal-body').innerHTML = `<div class="bm-empty">Failed to load: ${e.message}</div>`;
  }
}

async function bmShowAllOperations() {
  bmOpenModal('Full Schedule — Today\'s Operations', '<div class="bm-empty">Loading…</div>');
  try {
    const { operations } = await bmFetchJson(`${BM_API}/operations`);
    document.querySelector('#bm-modal-root .bm-modal-body').innerHTML = operations.map(bmOpsRow).join('') || '<div class="bm-empty">No operations scheduled.</div>';
  } catch (e) {
    document.querySelector('#bm-modal-root .bm-modal-body').innerHTML = `<div class="bm-empty">Failed to load: ${e.message}</div>`;
  }
}

async function bmShowAllAlerts() {
  bmOpenModal('All Alerts & Notifications', '<div class="bm-empty">Loading…</div>');
  try {
    const { alerts } = await bmFetchJson(`${BM_API}/alerts`);
    document.querySelector('#bm-modal-root .bm-modal-body').innerHTML = alerts.map(bmAlertRow).join('') || '<div class="bm-empty">No alerts.</div>';
  } catch (e) {
    document.querySelector('#bm-modal-root .bm-modal-body').innerHTML = `<div class="bm-empty">Failed to load: ${e.message}</div>`;
  }
}

async function bmShowAllInventory() {
  bmOpenModal('Resource Inventory — Full Detail', '<div class="bm-empty">Loading…</div>');
  try {
    const { inventory } = await bmFetchJson(`${BM_API}/inventory`);
    document.querySelector('#bm-modal-root .bm-modal-body').innerHTML = inventory.map(bmInventoryRow).join('') || '<div class="bm-empty">No inventory records.</div>';
  } catch (e) {
    document.querySelector('#bm-modal-root .bm-modal-body').innerHTML = `<div class="bm-empty">Failed to load: ${e.message}</div>`;
  }
}

async function bmShowPerformanceReport() {
  bmOpenModal('Farm Performance Report', '<div class="bm-empty">Loading…</div>');
  try {
    const p = await bmFetchJson(`${BM_API}/performance`);
    document.querySelector('#bm-modal-root .bm-modal-body').innerHTML = `
      <div class="bm-modal-list-row"><strong>Mortality %:</strong> ${p.mortality.value}% (<i class="fa-solid fa-arrow-trend-${p.mortality.trend.direction === 'up' ? 'up' : 'down'}"></i> ${p.mortality.trend.changeText})</div>
      <div class="bm-modal-list-row"><strong>FCR (Avg.):</strong> ${p.fcr.value} (<i class="fa-solid fa-arrow-trend-${p.fcr.trend.direction === 'up' ? 'up' : 'down'}"></i> ${p.fcr.trend.changeText})</div>
      <div class="bm-modal-list-row"><strong>Weight (Avg.):</strong> ${p.weight.value} kg — ${p.weight.trendText}</div>
      <div class="bm-modal-list-row"><strong>ADG (Avg.):</strong> ${p.adg.value} g — ${p.adg.trendText}</div>
      <div class="bm-modal-list-row"><strong>Feed Consumed:</strong> ${Number(p.feedConsumed.value).toLocaleString()} kg — ${p.feedConsumed.trendText}</div>
      <div class="bm-modal-list-row"><strong>Water Consumed:</strong> ${Number(p.waterConsumed.value).toLocaleString()} L — ${p.waterConsumed.trendText}</div>`;
  } catch (e) {
    document.querySelector('#bm-modal-root .bm-modal-body').innerHTML = `<div class="bm-empty">Failed to load: ${e.message}</div>`;
  }
}

async function bmRefreshAll() {
  bmLoadCanonicalOverview();
  bmLoadCanonicalBatches();
  bmLoadOperations();
  bmLoadAlerts();
  bmLoadInventory();
  bmLoadCanonicalFarms();
  bmLoadPerformance();
}

async function bmLoadOverview() {
  const el = document.getElementById('bm-stat-row');
  if (!el) return;
  try {
    const o = await bmFetchJson(`${BM_API}/overview`);
    el.innerHTML = [
      bmStatCard('', '#dcfce7', 'Active Batches', String(o.activeBatches).padStart(2, '0'), `Across ${o.farmsCount} Farms`, '', ''),
      bmStatCard('', '#dbeafe', 'Total Birds', o.totalBirds.toLocaleString(), 'Placed Birds', '', ''),
      bmStatCard('', '#fff7ed', 'Average Age', `${o.avgAgeDays} Days`, 'All Active Batches', '', ''),
      bmStatCard('', '#fce7f3', 'Average Mortality', `${o.avgMortality}%`, 'This Month', o.mortalityTrend.direction, o.mortalityTrend.changeText),
      bmStatCard('', '#f3e8ff', 'FCR (Avg.)', o.avgFcr, 'This Month', o.fcrTrend.direction, o.fcrTrend.changeText)
    ].join('');
  } catch (e) {
    el.innerHTML = `<div class="bm-empty">Failed to load stats: ${e.message}</div>`;
  }
}

async function bmLoadBatches() {
  const tbody = document.getElementById('bm-batches-tbody');
  const footer = document.getElementById('bm-batches-footer');
  if (!tbody) return;
  try {
    const { batches, total } = await bmFetchJson(`${BM_API}/batches?limit=8`);
    tbody.innerHTML = batches.map(bmBatchRow).join('') || '<tr><td colspan="9" class="bm-empty">No batches yet.</td></tr>';
    if (footer) footer.textContent = `Showing 1 to ${batches.length} of ${total} active batches`;
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="9" class="bm-empty">Failed to load: ${e.message}</td></tr>`;
  }
}

async function bmLoadOperations() {
  const el = document.getElementById('bm-ops-list');
  if (!el) return;
  try {
    const { operations } = await bmFetchJson(`${BM_API}/operations?limit=5`);
    el.innerHTML = operations.map(bmOpsRow).join('') || '<div class="bm-empty">No operations today.</div>';
  } catch (e) {
    el.innerHTML = `<div class="bm-empty">Failed to load: ${e.message}</div>`;
  }
}

async function bmLoadAlerts() {
  const el = document.getElementById('bm-alerts-list');
  if (!el) return;
  try {
    const { alerts } = await bmFetchJson(`${BM_API}/alerts?limit=4`);
    el.innerHTML = alerts.map(bmAlertRow).join('') || '<div class="bm-empty">No alerts.</div>';
  } catch (e) {
    el.innerHTML = `<div class="bm-empty">Failed to load: ${e.message}</div>`;
  }
}

async function bmLoadInventory() {
  const el = document.getElementById('bm-inventory-list');
  if (!el) return;
  try {
    const { inventory } = await bmFetchJson(`${BM_API}/inventory?limit=5`);
    el.innerHTML = inventory.map(bmInventoryRow).join('') || '<div class="bm-empty">No inventory records.</div>';
  } catch (e) {
    el.innerHTML = `<div class="bm-empty">Failed to load: ${e.message}</div>`;
  }
}

async function bmLoadFarms() {
  const tbody = document.getElementById('bm-farms-tbody');
  if (!tbody) return;
  try {
    const { farms } = await bmFetchJson(`${BM_API}/farms?limit=4`);
    tbody.innerHTML = farms.map(bmFarmRow).join('') || '<tr><td colspan="6" class="bm-empty">No farm data.</td></tr>';
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" class="bm-empty">Failed to load: ${e.message}</td></tr>`;
  }
}

async function bmLoadPerformance() {
  const el = document.getElementById('bm-perf-body');
  const chartEl = document.getElementById('bm-fcr-chart');
  if (!el) return;
  try {
    const p = await bmFetchJson(`${BM_API}/performance`);
    const cell = (label, val, dir, text) => `
      <div class="bm-perf-cell">
        <div class="bm-perf-label">${label}</div>
        <div class="bm-perf-val">${val}</div>
        <div class="bm-perf-change ${dir === 'down' ? 'bm-perf-dn' : 'bm-perf-up'}"><i class="fa-solid fa-arrow-trend-${dir === 'down' ? 'down' : 'up'}"></i> ${text}</div>
      </div>`;
    el.innerHTML = [
      cell('Mortality %', `${p.mortality.value}%`, p.mortality.trend.direction, p.mortality.trend.changeText),
      cell('FCR (Avg.)', p.fcr.value, p.fcr.trend.direction, p.fcr.trend.changeText),
      cell('Weight (Avg.)', `${p.weight.value} kg`, 'up', p.weight.trendText.replace(/^\S+\s*/, '')),
      cell('ADG (Avg.)', `${p.adg.value} g`, 'up', p.adg.trendText.replace(/^\S+\s*/, '')),
      cell('Feed Consumed', `${Number(p.feedConsumed.value).toLocaleString()} kg`, 'up', p.feedConsumed.trendText.replace(/^\S+\s*/, '')),
      cell('Water Consumed', `${Number(p.waterConsumed.value).toLocaleString()} L`, 'up', p.waterConsumed.trendText.replace(/^\S+\s*/, ''))
    ].join('');

    if (chartEl && p.fcrTrend7d && p.fcrTrend7d.length) {
      chartEl.innerHTML = bmRenderFcrChart(p.fcrTrend7d);
    }
  } catch (e) {
    el.innerHTML = `<div class="bm-empty">Failed to load: ${e.message}</div>`;
  }
}

function bmRenderFcrChart(points) {
  const w = 320, h = 100, padX = 20, padRight = 25;
  const values = points.map(p => p.value);
  const min = Math.min(...values) - 0.1;
  const max = Math.max(...values) + 0.1;
  const range = max - min || 1;
  const step = (w - padX - padRight) / (points.length - 1 || 1);

  const coords = points.map((p, i) => {
    const x = padX + i * step;
    const y = 90 - ((p.value - min) / range) * 70;
    return { x, y, label: p.label };
  });

  const poly = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const area = `${poly} ${coords[coords.length - 1].x.toFixed(1)},90 ${coords[0].x.toFixed(1)},90`;
  const circles = coords.map(c => `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="3" fill="#16a34a"/>`).join('');
  const labels = coords.map(c => `<text x="${(c.x - 10).toFixed(1)}" y="97" font-size="7" fill="#9ca3af">${c.label}</text>`).join('');

  return `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:100px;">
      <line x1="0" y1="10" x2="${w}" y2="10" stroke="#f3f4f6" stroke-width="1"/>
      <line x1="0" y1="35" x2="${w}" y2="35" stroke="#f3f4f6" stroke-width="1"/>
      <line x1="0" y1="60" x2="${w}" y2="60" stroke="#f3f4f6" stroke-width="1"/>
      <line x1="0" y1="85" x2="${w}" y2="85" stroke="#f3f4f6" stroke-width="1"/>
      <defs>
        <linearGradient id="bmFcrGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#16a34a" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="#16a34a" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <polygon points="${area}" fill="url(#bmFcrGrad)"/>
      <polyline points="${poly}" fill="none" stroke="#16a34a" stroke-width="2"/>
      ${circles}
      ${labels}
    </svg>`;
}

/* ── Wire up static (non-data) event listeners: modals, add-batch, quick actions ── */
function bmWireEvents() {
  const bind = (id, handler) => { const el = document.getElementById(id); if (el) el.addEventListener('click', (e) => { e.preventDefault(); handler(); }); };

  bind('bm-view-all-batches', bmShowAllBatches);
  bind('bm-view-full-schedule', bmShowAllOperations);
  bind('bm-view-all-alerts-header', bmShowAllAlerts);
  bind('bm-view-all-alerts-footer', bmShowAllAlerts);
  bind('bm-view-all-inventory', bmShowAllInventory);
  bind('bm-view-report', bmShowPerformanceReport);
}

async function bmCanonicalRows() {
  const data = await window.FarmSenseCanonicalOperations.load();
  const recordsByBatch = new Map();
  data.records.forEach(record => {
    const key = String(record.batchId);
    if (!recordsByBatch.has(key)) recordsByBatch.set(key, []);
    recordsByBatch.get(key).push(record);
  });
  const batches = data.batches.map(batch => {
    const records = recordsByBatch.get(String(batch._id)) || [];
    const losses = records.reduce((sum, record) => sum + Number(record.mortality?.count || 0) + Number(record.culls?.count || 0), 0);
    return {
      batchId: batch.code,
      farm: batch.farm?.name || 'Unknown farm',
      shed: data.facilities.find(item => String(item._id) === String(batch.facilityId))?.name || '',
      breed: batch.breed || batch.birdType,
      doa: batch.placedAt,
      birds: batch.currentBirdCountCached ?? Math.max(0, Number(batch.initialBirdCount || 0) - losses),
      ageDays: Math.max(0, Math.floor((Date.now() - new Date(batch.placedAt).getTime()) / 86400000)),
      mortality: batch.initialBirdCount ? losses / batch.initialBirdCount * 100 : 0,
      fcr: null,
      status: String(batch.status || 'planned').replace(/^./, char => char.toUpperCase()),
      raw: batch
    };
  });
  return { data, batches };
}

async function bmLoadCanonicalOverview() {
  const el = document.getElementById('bm-stat-row');
  try {
    const { data, batches } = await bmCanonicalRows();
    const active = batches.filter(item => item.raw.status === 'active');
    const totalBirds = active.reduce((sum, item) => sum + Number(item.birds || 0), 0);
    const avgAge = active.length ? Math.round(active.reduce((sum, item) => sum + item.ageDays, 0) / active.length) : 0;
    const avgMortality = active.length ? active.reduce((sum, item) => sum + item.mortality, 0) / active.length : 0;
    el.innerHTML = [
      bmStatCard('', '#dcfce7', 'Active Batches', String(active.length).padStart(2, '0'), `Across ${new Set(active.map(item => item.raw.farmId)).size} Farms`, '', ''),
      bmStatCard('', '#dbeafe', 'Total Birds', totalBirds.toLocaleString('en-IN'), 'Current Birds', '', ''),
      bmStatCard('', '#fff7ed', 'Average Age', `${avgAge} Days`, 'All Active Batches', '', ''),
      bmStatCard('', '#fce7f3', 'Average Mortality', `${avgMortality.toFixed(2)}%`, 'Canonical flock records', '', ''),
      bmStatCard('', '#f3e8ff', 'FCR (Avg.)', 'Not reported', 'No canonical FCR field', '', '')
    ].join('');
  } catch (error) { el.innerHTML = `<div class="bm-empty">Failed to load stats: ${error.message}</div>`; }
}

async function bmLoadCanonicalBatches() {
  const tbody = document.getElementById('bm-batches-tbody');
  const footer = document.getElementById('bm-batches-footer');
  try {
    const { batches } = await bmCanonicalRows();
    const visible = batches.slice(0, 8);
    tbody.innerHTML = visible.map(bmBatchRow).join('') || '<tr><td colspan="9" class="bm-empty">No batches yet.</td></tr>';
    if (footer) footer.textContent = `Showing 1 to ${visible.length} of ${batches.length} batches`;
  } catch (error) { tbody.innerHTML = `<tr><td colspan="9" class="bm-empty">Failed to load: ${error.message}</td></tr>`; }
}

async function bmLoadCanonicalFarms() {
  const tbody = document.getElementById('bm-farms-tbody');
  try {
    const { data, batches } = await bmCanonicalRows();
    const farms = data.farms.slice(0, 4).map(farm => {
      const own = batches.filter(item => String(item.raw.farmId) === String(farm._id));
      return { name: farm.name, batches: own.filter(item => item.raw.status === 'active').length, birds: own.reduce((sum, item) => sum + Number(item.birds || 0), 0), mortality: own.length ? own.reduce((sum, item) => sum + item.mortality, 0) / own.length : 0, fcr: null, stars: 4 };
    });
    tbody.innerHTML = farms.map(bmFarmRow).join('') || '<tr><td colspan="6" class="bm-empty">No farm data.</td></tr>';
  } catch (error) { tbody.innerHTML = `<tr><td colspan="6" class="bm-empty">Failed to load: ${error.message}</td></tr>`; }
}

/* ── Init (called after the returned HTML has been inserted into the DOM) ── */
function initBatchManagement() {
  bmWireEvents();
  bmRefreshAll();
}

/* ── Main view function ── */
function viewBatchManagement(user) {
  injectBatchManagementStyles();

  // The HTML below is inserted synchronously by the router; scheduling init
  // on the next tick guarantees the elements it queries (#bm-stat-row etc.)
  // already exist in the DOM.
  setTimeout(initBatchManagement, 0);

  return `
  <div class="bm-scrollable">

    <!-- Stat row -->
    <div class="bm-stat-row" id="bm-stat-row">
      <div class="bm-empty">Loading stats…</div>
    </div>

    <!-- Main content: left (table + bottom) + right (performance panel) -->
    <div class="bm-main-grid">

      <!-- Left column -->
      <div>
        <!-- Active Batches Overview -->
        <div class="bm-card" style="margin-bottom:16px;">
          <div class="bm-card-header">
            <span class="bm-card-title">Active Batches Overview</span>
            <a href="#" class="bm-card-link" id="bm-view-all-batches">View All Batches <i class="fa-solid fa-arrow-right"></i></a>
          </div>
          <table class="bm-table">
            <thead>
              <tr>
                <th>Batch / Farm</th>
                <th>Breed</th>
                <th>DOA</th>
                <th>Birds Placed</th>
                <th>Current Age</th>
                <th>Mortality</th>
                <th>FCR</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="bm-batches-tbody">
              <tr><td colspan="9" class="bm-empty">Loading batches…</td></tr>
            </tbody>
          </table>
          <div class="bm-table-footer" id="bm-batches-footer">Loading…</div>
        </div>

        <!-- Bottom three columns -->
        <div class="bm-three-col">

          <!-- Today's Operations -->
          <div class="bm-card">
            <div class="bm-card-header">
              <span class="bm-card-title">Today's Operations</span>
            </div>
            <div id="bm-ops-list"><div class="bm-empty">Loading…</div></div>
            <a href="#" class="bm-ops-footer-link" id="bm-view-full-schedule">View Full Schedule <i class="fa-solid fa-arrow-right"></i></a>
          </div>

          <!-- Alerts & Notifications -->
          <div class="bm-card">
            <div class="bm-card-header">
              <span class="bm-card-title">Alerts &amp; Notifications</span>
              <a href="#" class="bm-card-link" id="bm-view-all-alerts-header">View All <i class="fa-solid fa-arrow-right"></i></a>
            </div>
            <div id="bm-alerts-list"><div class="bm-empty">Loading…</div></div>
            <a href="#" class="bm-alert-footer-link" id="bm-view-all-alerts-footer">View All Alerts <i class="fa-solid fa-arrow-right"></i></a>
          </div>

          <!-- Resource Inventory -->
          <div class="bm-card">
            <div class="bm-card-header">
              <span class="bm-card-title">Resource Inventory</span>
              <a href="#" class="bm-card-link" id="bm-view-all-inventory">View All <i class="fa-solid fa-arrow-right"></i></a>
            </div>
            <div class="bm-inv-body-wrap" id="bm-inventory-list">
              <div class="bm-empty">Loading…</div>
            </div>
          </div>

        </div>

        <!-- Farm-wise Summary -->
        <div class="bm-card" style="margin-bottom:16px;">
          <div class="bm-card-header">
            <span class="bm-card-title">Farm-wise Summary</span>
          </div>
          <table class="bm-table">
            <thead>
              <tr>
                <th>Farm Name</th>
                <th>Active Batches</th>
                <th>Birds</th>
                <th>Avg. Mortality %</th>
                <th>Avg. FCR</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody id="bm-farms-tbody">
              <tr><td colspan="6" class="bm-empty">Loading…</td></tr>
            </tbody>
          </table>
        </div>

      </div>

      <!-- Right column: Farm Performance -->
      <div>
        <div class="bm-card">
          <div class="bm-card-header">
            <span class="bm-card-title">Farm Performance <span class="bm-card-subtitle">(This Month)</span></span>
            <a href="#" class="bm-card-link" id="bm-view-report">View Report <i class="fa-solid fa-arrow-right"></i></a>
          </div>
          <div class="bm-perf-body">
            <div class="bm-perf-grid" id="bm-perf-body">
              <div class="bm-empty">Loading…</div>
            </div>

            <!-- FCR Trend chart -->
            <div class="bm-chart-title">
              FCR Trend (Last 7 Days)
              <span class="bm-chart-legend">— FCR (Avg.)</span>
            </div>
            <div id="bm-fcr-chart"></div>
          </div>
        </div>
      </div>

    </div>

  </div>`;
}

async function bmShowAllBatchesLegacy() {
  bmOpenModal('All Active Batches', '<div class="bm-empty">Loading…</div>');
  try {
    const { batches } = await bmCanonicalRows();
    document.querySelector('#bm-modal-root .bm-modal-body').innerHTML = batches.map(batch => `<div class="bm-modal-list-row"><strong>${batch.batchId}</strong> — ${batch.farm} · ${batch.breed}<br><span style="color:#6b7280">${Number(batch.birds).toLocaleString('en-IN')} birds · ${batch.ageDays} days · Mortality ${Number(batch.mortality).toFixed(2)}% · ${batch.status}</span></div>`).join('') || '<div class="bm-empty">No batches found.</div>';
  } catch (error) {
    document.querySelector('#bm-modal-root .bm-modal-body').innerHTML = `<div class="bm-empty">Failed to load: ${error.message}</div>`;
  }
}
