/* views/Dashboard.js */

window.metaDashboard = {
  title: 'Dashboard',
  subtitle: "Here's what's happening with your farm today."
};

/* ── Helper functions ── */

function hmMetricCard(icon, iconBg, label, value, sub, trend, change) {
  const isUp = trend === 'up';
  const trendColor = isUp ? '#16a34a' : '#ef4444';
  const trendArrow = `<i class="fa-solid fa-arrow-trend-${isUp ? 'up' : 'down'}"></i>`;
  return `
    <div class="hm-metric-card">
      <div class="hm-metric-icon" style="background:${iconBg}">${icon}</div>
      <div class="hm-metric-body">
        <div class="hm-metric-label">${label}</div>
        <div class="hm-metric-value">${value}</div>
        <div class="hm-metric-sub">${sub}</div>
        ${change ? `<div class="hm-metric-trend" style="color:${trendColor}">${trendArrow} ${change}</div>` : ''}
      </div>
    </div>`;
}

function hmAlertItem(icon, iconColor, title, desc, time, type) {
  const colors = { warning: '#f59e0b', success: '#16a34a', info: '#3b82f6', danger: '#ef4444' };
  const bgs    = { warning: '#fff7ed', success: '#f0fdf4', info: '#eff6ff', danger: '#fef2f2' };
  return `
    <div class="hm-alert-item">
      <div class="hm-alert-icon" style="background:${bgs[type]};color:${colors[type]}">${icon}</div>
      <div class="hm-alert-body">
        <div class="hm-alert-title">${title}</div>
        <div class="hm-alert-desc">${desc}</div>
      </div>
      <div class="hm-alert-time">${time}</div>
    </div>`;
}

function hmProgressBar(label, pct, color) {
  return `
    <div class="hm-pb-row">
      <div class="hm-pb-label">${label}</div>
      <div class="hm-pb-track"><div class="hm-pb-fill" style="width:${pct}%;background:${color}"></div></div>
      <div class="hm-pb-val">₹ ${label === 'Batch #101' ? '1,80,000' : label === 'Batch #102' ? '2,20,000' : label === 'Batch #103' ? '2,40,000' : '2,90,000'}</div>
    </div>`;
}

function hmQuickAction(icon, iconBg, label) {
  return `
    <div class="hm-qa-item">
      <div class="hm-qa-icon" style="background:${iconBg}">${icon}</div>
      <div class="hm-qa-label">${label}</div>
    </div>`;
}

function hmKbItem(icon, iconBg, label) {
  return `
    <div class="hm-kb-item">
      <div class="hm-kb-icon" style="background:${iconBg}">${icon}</div>
      <div class="hm-kb-label">${label}</div>
    </div>`;
}

/* ── CSS injected once ── */
function injectDashboardStyles() {
  if (document.getElementById('hm-dashboard-styles')) return;
  const style = document.createElement('style');
  style.id = 'hm-dashboard-styles';
  style.textContent = `
    /* ── Base ── */
    .hm-scrollable { padding: 16px 20px; background: #f5f6fa; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #1a1a2e; }

    /* ── Farm Header ── */
    .hm-farm-header { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; padding: 12px 16px; display: flex; align-items: center; gap: 16px; margin-bottom: 14px; }
    .hm-farm-img { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; background: #d1fae5; flex-shrink: 0; display:flex;align-items:center;justify-content:center;font-size:24px; }
    .hm-farm-info { flex: 1; }
    .hm-farm-name { font-size: 15px; font-weight: 800; display: flex; align-items: center; gap: 6px; }
    .hm-farm-name .hm-verified { color: #16a34a; font-size: 13px; }
    .hm-farm-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .hm-farm-divider { width: 1px; height: 40px; background: #e8eaf0; margin: 0 8px; }
    .hm-farm-batch { text-align: center; }
    .hm-farm-batch-label { font-size: 11px; color: #6b7280; display: flex; align-items: center; gap: 4px; }
    .hm-farm-batch-val { font-size: 14px; font-weight: 700; margin-top: 2px; }
    .hm-farm-status-label { font-size: 11px; color: #6b7280; }
    .hm-farm-status-val { margin-top: 2px; }
    .hm-status-active { background: #d1fae5; color: #059669; border-radius: 6px; padding: 3px 10px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
    .hm-ai-score { text-align: left; }
    .hm-ai-score-label { font-size: 11px; color: #6b7280; }
    .hm-ai-score-val { font-size: 20px; font-weight: 800; color: #111827; margin-top: 2px; }
    .hm-ai-score-val span { font-size: 12px; font-weight: 500; color: #6b7280; }
    .hm-ai-score-badge { font-size: 11px; font-weight: 600; color: #16a34a; }
    .hm-farm-updated { margin-left: auto; text-align: right; }
    .hm-farm-updated-label { font-size: 10px; color: #9ca3af; }
    .hm-farm-updated-val { font-size: 11px; font-weight: 600; color: #374151; margin-top: 2px; }

    /* ── Metric Strip ── */
    .hm-metric-strip { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 14px; }
    .hm-metric-card { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; padding: 12px 14px; display: flex; align-items: flex-start; gap: 10px; }
    .hm-metric-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
    .hm-metric-label { font-size: 10px; color: #6b7280; margin-bottom: 2px; }
    .hm-metric-value { font-size: 16px; font-weight: 800; line-height: 1.1; }
    .hm-metric-sub { font-size: 10px; color: #9ca3af; margin-top: 1px; }
    .hm-metric-trend { font-size: 10px; font-weight: 600; margin-top: 3px; }

    /* ── Main 3-column grid ── */
    .hm-main-grid { display: grid; grid-template-columns: 1fr 320px 260px; gap: 14px; margin-bottom: 14px; }

    /* ── Card base ── */
    .hm-card { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; overflow: hidden; }
    .hm-card-header { display: flex; align-items: center; justify-content: space-between; padding: 11px 14px 9px; border-bottom: 1px solid #f3f4f6; }
    .hm-card-title { font-size: 13px; font-weight: 700; }
    .hm-card-link { font-size: 11px; color: #16a34a; text-decoration: none; font-weight: 600; }

    /* ── Live Farm View ── */
    .hm-live-feed { position: relative; background: #111; height: 170px; overflow: hidden; }
    .hm-live-feed img { width: 100%; height: 100%; object-fit: cover; }
    .hm-live-feed-placeholder { width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a3a2a,#0f2318);color:#4ade80;font-size:40px; }
    .hm-live-timestamp { position: absolute; top: 8px; left: 10px; background: rgba(0,0,0,.55); color: #fff; font-size: 10px; font-weight: 600; padding: 3px 7px; border-radius: 4px; }
    .hm-live-expand { position: absolute; top: 8px; right: 10px; background: rgba(0,0,0,.45); color: #fff; border: none; border-radius: 4px; width: 26px; height: 26px; cursor: pointer; font-size: 12px; }
    .hm-live-dot { display: inline-block; width: 7px; height: 7px; background: #22c55e; border-radius: 50%; margin-right: 4px; animation: hm-pulse 1.5s infinite; }
    @keyframes hm-pulse { 0%,100%{opacity:1}50%{opacity:.4} }
    .hm-cameras { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; padding: 10px 12px; }
    .hm-camera-thumb { background: #f3f4f6; border-radius: 6px; padding: 7px 8px; cursor: pointer; border: 1px solid #e8eaf0; }
    .hm-camera-thumb.active { border-color: #16a34a; background: #f0fdf4; }
    .hm-camera-icon { font-size: 13px; margin-bottom: 2px; }
    .hm-camera-name { font-size: 10px; font-weight: 700; color: #111827; }
    .hm-camera-loc { font-size: 9px; color: #6b7280; }

    /* ── AI Smart Alerts ── */
    .hm-ai-score-header { background: #111827; color: #fff; border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 700; }
    .hm-alert-list { padding: 4px 0; }
    .hm-alert-item { display: flex; align-items: flex-start; gap: 10px; padding: 9px 14px; border-bottom: 1px solid #f9fafb; }
    .hm-alert-item:last-child { border-bottom: none; }
    .hm-alert-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
    .hm-alert-body { flex: 1; min-width: 0; }
    .hm-alert-title { font-size: 12px; font-weight: 700; margin-bottom: 2px; }
    .hm-alert-desc { font-size: 10px; color: #6b7280; line-height: 1.4; }
    .hm-alert-time { font-size: 10px; color: #9ca3af; white-space: nowrap; flex-shrink: 0; }
    .hm-alert-footer { padding: 10px 14px; border-top: 1px solid #f3f4f6; }
    .hm-alert-view-all { font-size: 11px; color: #16a34a; font-weight: 600; text-decoration: none; }

    /* ── Project Progress ── */
    .hm-progress-section { padding: 12px 14px; }
    .hm-progress-pct { font-size: 22px; font-weight: 800; margin-bottom: 6px; }
    .hm-progress-track { height: 8px; background: #e8eaf0; border-radius: 4px; overflow: hidden; margin-bottom: 14px; }
    .hm-progress-fill { height: 100%; background: #16a34a; border-radius: 4px; }
    .hm-progress-detail { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
    .hm-progress-row { display: flex; justify-content: space-between; font-size: 11px; }
    .hm-progress-row-label { color: #6b7280; }
    .hm-progress-row-val { font-weight: 600; color: #111827; }
    .hm-manager-row { display: flex; align-items: center; gap: 8px; padding-top: 12px; border-top: 1px solid #f3f4f6; }
    .hm-manager-avatar { width: 32px; height: 32px; border-radius: 50%; background: #dbeafe; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #2563eb; }
    .hm-manager-info { flex: 1; }
    .hm-manager-role { font-size: 10px; color: #9ca3af; }
    .hm-manager-name { font-size: 12px; font-weight: 700; }
    .hm-chat-btn { background: #fff; border: 1px solid #16a34a; color: #16a34a; border-radius: 7px; padding: 5px 10px; font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap; }

    /* ── Bottom 4-column grid ── */
    .hm-bottom-grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 14px; margin-bottom: 14px; }

    /* ── Financial Overview ── */
    .hm-fin-totals { display: grid; grid-template-columns: repeat(3,1fr); gap: 0; border-bottom: 1px solid #f3f4f6; }
    .hm-fin-cell { padding: 12px 14px; }
    .hm-fin-cell + .hm-fin-cell { border-left: 1px solid #f3f4f6; }
    .hm-fin-label { font-size: 10px; color: #6b7280; margin-bottom: 3px; }
    .hm-fin-value { font-size: 16px; font-weight: 800; }
    .hm-fin-trend { font-size: 10px; font-weight: 600; margin-top: 3px; }
    .hm-fin-chart { padding: 10px 14px 4px; }
    .hm-fin-legend { display: flex; gap: 12px; margin-bottom: 6px; }
    .hm-fin-legend-item { display: flex; align-items: center; gap: 4px; font-size: 10px; color: #6b7280; }
    .hm-fin-legend-dot { width: 8px; height: 8px; border-radius: 50%; }

    /* ── Profit Forecast ── */
    .hm-pf-sub { font-size: 10px; color: #9ca3af; padding: 6px 14px 0; }
    .hm-pf-list { padding: 4px 0; }
    .hm-pf-row { display: flex; align-items: center; justify-content: space-between; padding: 7px 14px; border-bottom: 1px solid #f9fafb; }
    .hm-pf-row:last-child { border-bottom: none; }
    .hm-pf-icon { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 8px; flex-shrink: 0; }
    .hm-pf-label { flex: 1; font-size: 11px; color: #374151; display: flex; align-items: center; }
    .hm-pf-value { font-size: 12px; font-weight: 700; }
    .hm-pf-value.green { color: #16a34a; }
    .hm-pf-confidence { padding: 8px 14px; display: flex; align-items: center; gap: 8px; border-top: 1px solid #f3f4f6; }
    .hm-pf-conf-label { font-size: 10px; color: #6b7280; flex: 1; }
    .hm-pf-conf-val { font-size: 11px; font-weight: 700; color: #16a34a; }
    .hm-pf-conf-track { flex: 1; height: 5px; background: #e8eaf0; border-radius: 3px; overflow: hidden; }
    .hm-pf-conf-fill { height: 100%; background: #16a34a; border-radius: 3px; }

    /* ── Batch Performance ── */
    .hm-bp-list { padding: 8px 14px; display: flex; flex-direction: column; gap: 10px; }
    .hm-pb-row { display: flex; align-items: center; gap: 8px; }
    .hm-pb-label { font-size: 11px; color: #374151; width: 68px; flex-shrink: 0; }
    .hm-pb-track { flex: 1; height: 6px; background: #e8eaf0; border-radius: 3px; overflow: hidden; }
    .hm-pb-fill { height: 100%; border-radius: 3px; }
    .hm-pb-val { font-size: 11px; font-weight: 600; color: #111827; text-align: right; min-width: 64px; font-size: 10px; }

    /* ── Quick Actions ── */
    .hm-qa-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; padding: 12px 14px; }
    .hm-qa-item { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; }
    .hm-qa-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .hm-qa-label { font-size: 10px; color: #374151; text-align: center; font-weight: 500; line-height: 1.3; }

    /* ── Upcoming Payments ── */
    .hm-pay-section { padding: 12px 14px; }
    .hm-pay-next-label { font-size: 11px; color: #16a34a; font-weight: 700; margin-bottom: 4px; }
    .hm-pay-amount { font-size: 22px; font-weight: 800; margin-bottom: 8px; }
    .hm-pay-detail-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 5px; }
    .hm-pay-detail-label { color: #6b7280; }
    .hm-pay-detail-val { font-weight: 600; }
    .hm-pay-btns { display: flex; gap: 8px; margin-top: 12px; }
    .hm-pay-btn-primary { flex: 1; background: #16a34a; color: #fff; border: none; border-radius: 7px; padding: 8px; font-size: 12px; font-weight: 700; cursor: pointer; }
    .hm-pay-btn-secondary { flex: 1; background: #fff; color: #374151; border: 1px solid #e5e7eb; border-radius: 7px; padding: 8px; font-size: 12px; font-weight: 600; cursor: pointer; }

    /* ── Knowledge Center ── */
    .hm-kb-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; padding: 12px 14px; }
    .hm-kb-item { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; }
    .hm-kb-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .hm-kb-label { font-size: 10px; color: #374151; text-align: center; font-weight: 500; line-height: 1.3; }

    /* ── Ask Farmsence AI bar ── */
    .hm-ask-bar { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; padding: 12px 16px; display: flex; align-items: center; gap: 12px; }
    .hm-ask-icon { width: 36px; height: 36px; background: linear-gradient(135deg,#16a34a,#059669); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; flex-shrink: 0; }
    .hm-ask-text { }
    .hm-ask-title { font-size: 13px; font-weight: 700; }
    .hm-ask-sub { font-size: 10px; color: #6b7280; }
    .hm-ask-input { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 9px 14px; font-size: 12px; outline: none; color: #9ca3af; }
    .hm-ask-input:focus { border-color: #16a34a; color: #111827; }
    .hm-ask-send { background: #16a34a; color: #fff; border: none; border-radius: 8px; padding: 8px 16px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; white-space: nowrap; }

    /* Utility */
    .hm-green { color: #16a34a; }
    .hm-red { color: #ef4444; }
    .hm-badge-green { background: #d1fae5; color: #059669; border-radius: 5px; padding: 2px 8px; font-size: 11px; font-weight: 700; }
  `;
  document.head.appendChild(style);
}

function hmEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
}
function hmValue(value, suffix = '') { return value === null || value === undefined ? 'Unavailable' : `${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}${suffix}`; }
function hmMoney(value) { return value === null || value === undefined ? 'Unavailable' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value); }
function hmDate(value) { return value ? new Date(value).toLocaleDateString('en-IN') : 'Unavailable'; }

function hmRenderConnectedDashboard(data) {
  const root = document.getElementById('hm-connected-root');
  if (!root) return;
  const farm = data.farm; const batch = data.batch; const record = data.latestRecord;
  const farmOptions = data.farms.map(item => `<option value="${hmEscape(item.id)}" ${String(item.id) === String(farm?.id) ? 'selected' : ''}>${hmEscape(item.code)} · ${hmEscape(item.name)}</option>`).join('');
  const freshness = record?.recordDate ? `Operational record: ${hmDate(record.recordDate)}` : 'No operational record submitted';
  root.innerHTML = `
    <div class="hm-farm-header">
      <div class="hm-farm-img"><i class="fa-solid fa-warehouse"></i></div>
      <div class="hm-farm-info"><div class="hm-farm-name">${hmEscape(farm?.name || 'No farm available')}</div><div class="hm-farm-sub">${hmEscape(data.organization?.name || 'Organization unavailable')} · ${hmEscape(farm?.farmType || 'Type unavailable')}</div></div>
      <label>Farm<br><select id="hm-farm-select" class="lfv-card-select">${farmOptions}</select></label>
      <div class="hm-farm-batch"><div class="hm-farm-batch-label">${hmEscape(batch?.code || 'No active batch')}</div><div class="hm-farm-batch-val">${batch ? `Day ${hmValue(batch.ageDays)}` : 'Unavailable'}</div></div>
      <div><div class="hm-farm-status-label">Farm Status</div><div class="hm-farm-status-val"><span class="hm-status-active">${hmEscape(farm?.status || 'Unavailable')}</span></div></div>
      <div class="hm-farm-updated"><div class="hm-farm-updated-label">Database snapshot</div><div class="hm-farm-updated-val">${hmDate(data.generatedAt)}<br>${hmEscape(freshness)}</div></div>
    </div>
    <div class="hm-metric-strip">
      ${hmMetricCard('', '#d1fae5', 'Current Birds', hmValue(batch?.currentBirds), batch ? `${hmValue(batch.initialBirdCount)} placed` : 'No active batch', null, null)}
      ${hmMetricCard('', '#dbeafe', 'Temperature', hmValue(record?.temperatureC, '°C'), 'Latest record', null, null)}
      ${hmMetricCard('', '#fee2e2', 'Mortality', hmValue(record?.mortalityPct, '%'), record ? `${hmValue(record.mortalityCount)} birds` : 'No record', null, null)}
      ${hmMetricCard('', '#fef3c7', 'Feed', hmValue(record?.feedKg, ' kg'), 'Latest record', null, null)}
      ${hmMetricCard('', '#e0e7ff', 'Water', hmValue(record?.waterLiters, ' L'), 'Latest record', null, null)}
      ${hmMetricCard('', '#d1fae5', 'Active Batches', hmValue(data.counts.activeBatches), `${hmValue(data.counts.batches)} total`, null, null)}
    </div>
    <div class="hm-main-grid">
      <section class="hm-card"><div class="hm-card-header"><span class="hm-card-title">Latest Operational Record</span><span>${hmEscape(record?.syncStatus || 'Unavailable')}</span></div><div class="hm-progress-section">
        <div class="hm-progress-detail">
          <div class="hm-progress-row"><span class="hm-progress-row-label">Average weight</span><strong>${hmValue(record?.averageWeightGrams, ' g')}</strong></div>
          <div class="hm-progress-row"><span class="hm-progress-row-label">Humidity</span><strong>${hmValue(record?.humidityPct, '%')}</strong></div>
          <div class="hm-progress-row"><span class="hm-progress-row-label">Ammonia</span><strong>${hmValue(record?.ammoniaPpm, ' ppm')}</strong></div>
          <div class="hm-progress-row"><span class="hm-progress-row-label">CO₂</span><strong>${hmValue(record?.co2Ppm, ' ppm')}</strong></div>
          <div class="hm-progress-row"><span class="hm-progress-row-label">Source</span><strong>${hmEscape(record?.source || 'Unavailable')}</strong></div>
        </div></div></section>
      <section class="hm-card"><div class="hm-card-header"><span class="hm-card-title">Project Progress</span></div><div class="hm-progress-section">
        <div class="hm-progress-pct">${hmValue(data.project?.percentComplete, '%')}</div><div class="hm-progress-track"><div class="hm-progress-fill" style="width:${Number(data.project?.percentComplete || 0)}%"></div></div>
        <div class="hm-progress-row"><span class="hm-progress-row-label">Project</span><strong>${hmEscape(data.project?.title || 'No project')}</strong></div>
        <div class="hm-progress-row"><span class="hm-progress-row-label">Target</span><strong>${hmDate(data.project?.targetDate)}</strong></div>
        <div class="hm-manager-row"><div class="hm-manager-info"><div class="hm-manager-role">Farm Manager</div><div class="hm-manager-name">${hmEscape(data.manager?.name || 'Unassigned')}</div></div></div>
      </div></section>
      <section class="hm-card"><div class="hm-card-header"><span class="hm-card-title">Data Coverage</span></div><div class="hm-progress-section">
        <div class="hm-progress-row"><span>Farms</span><strong>${hmValue(data.counts.farms)}</strong></div><div class="hm-progress-row"><span>Projects</span><strong>${hmValue(data.counts.projects)}</strong></div><div class="hm-progress-row"><span>Pending payments</span><strong>${hmValue(data.counts.pendingPayments)}</strong></div>
      </div></section>
    </div>
    <div class="hm-bottom-grid">
      <section class="hm-card"><div class="hm-card-header"><span class="hm-card-title">Financial Overview — All Organization Farms</span></div><div class="hm-fin-totals">
        <div class="hm-fin-cell"><div class="hm-fin-label">Recorded revenue</div><div class="hm-fin-value hm-green">${hmMoney(data.finance.revenue)}</div><small>${hmValue(data.finance.saleCount)} sale records</small></div>
        <div class="hm-fin-cell"><div class="hm-fin-label">Recorded expenses</div><div class="hm-fin-value hm-red">${hmMoney(data.finance.expenses)}</div><small>${hmValue(data.finance.expenseCount)} entries</small></div>
        <div class="hm-fin-cell"><div class="hm-fin-label">Operational profit</div><div class="hm-fin-value">${hmMoney(data.finance.profit)}</div></div>
      </div></section>
      <section class="hm-card"><div class="hm-card-header"><span class="hm-card-title">Upcoming Payment</span></div><div class="hm-pay-section"><div class="hm-pay-amount">${hmMoney(data.upcomingPayment?.amount)}</div><div>${hmEscape(data.upcomingPayment?.description || 'No pending payment')}</div><div class="hm-pay-detail-row"><span>Due</span><strong>${hmDate(data.upcomingPayment?.dueDate)}</strong></div></div></section>
      <section class="hm-card"><div class="hm-card-header"><span class="hm-card-title">AI / Camera Metrics</span></div><div class="hm-pay-section">Unavailable until authoritative AI inference and camera telemetry are stored in the database.</div></section>
      <section class="hm-card"><div class="hm-card-header"><span class="hm-card-title">Profit Forecast</span></div><div class="hm-pay-section">Unavailable until the forecast has sufficient completed canonical batches.</div></section>
    </div>`;
  document.getElementById('hm-farm-select')?.addEventListener('change', event => hmLoadConnectedDashboard(event.target.value));
}

async function hmLoadConnectedDashboard(farmId = '') {
  const root = document.getElementById('hm-connected-root'); if (!root) return;
  root.innerHTML = '<div class="hm-card" style="padding:24px">Loading canonical farm data…</div>';
  try {
    const params = farmId ? `?farmId=${encodeURIComponent(farmId)}` : '';
    const response = await fetch(`/api/v2/business-dashboard${params}`, { headers: { Authorization: `Bearer ${localStorage.getItem('fs_token') || ''}` } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Unable to load dashboard data');
    hmRenderConnectedDashboard(data);
  } catch (error) { root.innerHTML = `<div class="hm-card" style="padding:24px;color:#b91c1c"><strong>Dashboard data could not be loaded.</strong><br>${hmEscape(error.message)}</div>`; }
}

/* ── Main view function ── */
function viewDashboard(user) {
  injectDashboardStyles();

  setTimeout(() => hmLoadConnectedDashboard(), 0);
  return '<div class="hm-scrollable" id="hm-connected-root"><div class="hm-card" style="padding:24px">Loading canonical farm data…</div></div>';

  return `
  <div class="hm-scrollable">

    <!-- Farm Header -->
    <div class="hm-farm-header">
      <div class="hm-farm-img"></div>
      <div class="hm-farm-info">
        <div class="hm-farm-name">Green Valley Farm <span class="hm-verified"><i class="fa-solid fa-check"></i></span></div>
        <div class="hm-farm-sub">15,000 Birds &nbsp;•&nbsp; Broiler</div>
      </div>

      <div class="hm-farm-divider"></div>

      <div class="hm-farm-batch">
        <div class="hm-farm-batch-label">Batch #104 <span style="color:#9ca3af">⊙</span></div>
        <div class="hm-farm-batch-val">Day 23 / 42</div>
      </div>

      <div class="hm-farm-divider"></div>

      <div>
        <div class="hm-farm-status-label">Farm Status <i class="fa-solid fa-arrow-down"></i></div>
        <div class="hm-farm-status-val"><span class="hm-status-active">Active <i class="fa-solid fa-arrow-trend-up"></i></span></div>
      </div>

      <div class="hm-farm-divider"></div>

      <div class="hm-ai-score">
        <div class="hm-ai-score-label">AI Health Score</div>
        <div class="hm-ai-score-val">94<span>/100</span></div>
        <div class="hm-ai-score-badge">Excellent <i class="fa-solid fa-arrow-trend-up"></i></div>
      </div>

      <div class="hm-farm-updated">
        <div class="hm-farm-updated-label">Last Updated: 10:30 AM</div>
        <div class="hm-farm-updated-val">24 May 2024</div>
      </div>
    </div>

    <!-- Metric Strip -->
    <div class="hm-metric-strip">
      ${hmMetricCard('', '#d1fae5', 'Total Birds', '15,000', '100% Placed', null, null)}
      ${hmMetricCard('', '#dbeafe', 'Avg. Temperature', '30.5°C', 'Optimal', null, null)}
      ${hmMetricCard('', '#fee2e2', 'Mortality', '1.1%', '', 'up', '0.2% vs yesterday')}
      ${hmMetricCard('', '#fef3c7', 'Feed Consumption', '1,250 kg', '', 'up', '5% vs yesterday')}
      ${hmMetricCard('', '#e0e7ff', 'Water Consumption', '18,500 L', '', 'up', '3% vs yesterday')}
      ${hmMetricCard('', '#d1fae5', 'Cameras Online', '4 / 4', 'All Online', null, null)}
    </div>

    <!-- Main 3-column grid: Live View | Alerts | Project Progress -->
    <div class="hm-main-grid">

      <!-- Live Farm View -->
      <div class="hm-card">
        <div class="hm-card-header">
          <span class="hm-card-title">Live Farm View</span>
          <span style="font-size:11px;font-weight:600;color:#16a34a;display:flex;align-items:center;gap:4px;">
            <span class="hm-live-dot"></span> Live
          </span>
        </div>
        <div class="hm-live-feed">
          <div class="hm-live-feed-placeholder"></div>
          <div class="hm-live-timestamp">24 May 2024 10:30:15 AM</div>
          <button class="hm-live-expand">⤢</button>
        </div>
        <div class="hm-cameras">
          <div class="hm-camera-thumb active">
            <div class="hm-camera-icon"></div>
            <div class="hm-camera-name">Camera 1</div>
            <div class="hm-camera-loc">Shed A</div>
          </div>
          <div class="hm-camera-thumb">
            <div class="hm-camera-icon"></div>
            <div class="hm-camera-name">Camera 2</div>
            <div class="hm-camera-loc">Shed B</div>
          </div>
          <div class="hm-camera-thumb">
            <div class="hm-camera-icon"></div>
            <div class="hm-camera-name">Camera 3</div>
            <div class="hm-camera-loc">Feed Room</div>
          </div>
          <div class="hm-camera-thumb">
            <div class="hm-camera-icon"></div>
            <div class="hm-camera-name">Camera 4</div>
            <div class="hm-camera-loc">Entrance Gate</div>
          </div>
        </div>
      </div>

      <!-- AI Smart Alerts -->
      <div class="hm-card">
        <div class="hm-card-header">
          <span class="hm-card-title">AI Smart Alerts</span>
          <span class="hm-ai-score-header">94/100</span>
        </div>
        <div class="hm-alert-list">
          ${hmAlertItem('', '#f59e0b', 'Heat stress increasing in Shed A', 'Temperature is 2.5°C above optimal range', '10:20 AM', 'warning')}
          ${hmAlertItem('', '#16a34a', 'Feed intake is normal', 'Birds are consuming feed as expected', '09:45 AM', 'success')}
          ${hmAlertItem('', '#16a34a', 'Mortality is under control', 'Current mortality is within acceptable range', '09:30 AM', 'success')}
          ${hmAlertItem('', '#3b82f6', 'Next Vaccination Due', 'IBD Vaccination due tomorrow', 'Tomorrow', 'info')}
        </div>
        <div class="hm-alert-footer">
          <a href="#" class="hm-alert-view-all">View All Alerts <i class="fa-solid fa-arrow-right"></i></a>
        </div>
      </div>

      <!-- Project Progress -->
      <div class="hm-card">
        <div class="hm-card-header">
          <span class="hm-card-title">Project Progress</span>
          <a href="#" class="hm-card-link">View Details</a>
        </div>
        <div class="hm-progress-section">
          <div style="font-size:11px;color:#6b7280;margin-bottom:2px;">Overall Progress</div>
          <div class="hm-progress-pct">72%</div>
          <div class="hm-progress-track"><div class="hm-progress-fill" style="width:72%"></div></div>
          <div class="hm-progress-detail">
            <div class="hm-progress-row"><span class="hm-progress-row-label">Current Stage</span><span class="hm-progress-row-val">Electrical Installation</span></div>
            <div class="hm-progress-row"><span class="hm-progress-row-label">Next Milestone</span><span class="hm-progress-row-val">Equipment Installation</span></div>
            <div class="hm-progress-row"><span class="hm-progress-row-label">Expected Completion</span><span class="hm-progress-row-val">15 July 2024</span></div>
          </div>
          <div class="hm-manager-row">
            <div class="hm-manager-avatar">NK</div>
            <div class="hm-manager-info">
              <div class="hm-manager-role">Project Manager</div>
              <div class="hm-manager-name">Navin Kumar</div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Bottom 4-col: Financial | Profit Forecast | Batch Perf + Quick Actions | Payments + Knowledge -->
    <div class="hm-bottom-grid">

      <!-- Financial Overview -->
      <div class="hm-card">
        <div class="hm-card-header">
          <span class="hm-card-title">Financial Overview <span style="font-size:10px;font-weight:500;color:#9ca3af;">(This Batch)</span></span>
        </div>
        <div class="hm-fin-totals">
          <div class="hm-fin-cell">
            <div class="hm-fin-label">Total Revenue</div>
            <div class="hm-fin-value">₹ 8,75,000</div>
            <div class="hm-fin-trend hm-green"><i class="fa-solid fa-arrow-trend-up"></i> 12% vs last batch</div>
          </div>
          <div class="hm-fin-cell">
            <div class="hm-fin-label">Total Expenses</div>
            <div class="hm-fin-value">₹ 6,40,000</div>
            <div class="hm-fin-trend hm-red"><i class="fa-solid fa-arrow-trend-up"></i> 8% vs last batch</div>
          </div>
          <div class="hm-fin-cell">
            <div class="hm-fin-label">Net Profit</div>
            <div class="hm-fin-value">₹ 2,35,000</div>
            <div class="hm-fin-trend hm-green"><i class="fa-solid fa-arrow-trend-up"></i> 15% vs last batch</div>
          </div>
        </div>
        <div class="hm-fin-chart">
          <div class="hm-fin-legend">
            <span class="hm-fin-legend-item"><span class="hm-fin-legend-dot" style="background:#22c55e"></span>Revenue</span>
            <span class="hm-fin-legend-item"><span class="hm-fin-legend-dot" style="background:#ef4444"></span>Expenses</span>
            <span class="hm-fin-legend-item"><span class="hm-fin-legend-dot" style="background:#3b82f6"></span>Profit</span>
          </div>
          <svg viewBox="0 0 380 110" style="width:100%;height:110px;">
            <!-- Grid -->
            <line x1="0" y1="10" x2="380" y2="10" stroke="#f3f4f6" stroke-width="1"/>
            <line x1="0" y1="35" x2="380" y2="35" stroke="#f3f4f6" stroke-width="1"/>
            <line x1="0" y1="60" x2="380" y2="60" stroke="#f3f4f6" stroke-width="1"/>
            <line x1="0" y1="85" x2="380" y2="85" stroke="#f3f4f6" stroke-width="1"/>
            <!-- Y labels -->
            <text x="0" y="9" font-size="7" fill="#9ca3af">12L</text>
            <text x="0" y="34" font-size="7" fill="#9ca3af">10L</text>
            <text x="0" y="59" font-size="7" fill="#9ca3af">8L</text>
            <text x="0" y="84" font-size="7" fill="#9ca3af">6L</text>
            <!-- Revenue (green) -->
            <polyline points="20,80 70,70 120,60 170,50 220,40 270,30 320,22 370,18" fill="none" stroke="#22c55e" stroke-width="2"/>
            <circle cx="20" cy="80" r="3" fill="#22c55e"/><circle cx="70" cy="70" r="3" fill="#22c55e"/><circle cx="120" cy="60" r="3" fill="#22c55e"/><circle cx="170" cy="50" r="3" fill="#22c55e"/><circle cx="220" cy="40" r="3" fill="#22c55e"/><circle cx="270" cy="30" r="3" fill="#22c55e"/><circle cx="320" cy="22" r="3" fill="#22c55e"/><circle cx="370" cy="18" r="3" fill="#22c55e"/>
            <!-- Expenses (red) -->
            <polyline points="20,85 70,80 120,75 170,72 220,65 270,60 320,58 370,55" fill="none" stroke="#ef4444" stroke-width="2"/>
            <circle cx="20" cy="85" r="3" fill="#ef4444"/><circle cx="70" cy="80" r="3" fill="#ef4444"/><circle cx="120" cy="75" r="3" fill="#ef4444"/><circle cx="170" cy="72" r="3" fill="#ef4444"/><circle cx="220" cy="65" r="3" fill="#ef4444"/><circle cx="270" cy="60" r="3" fill="#ef4444"/><circle cx="320" cy="58" r="3" fill="#ef4444"/><circle cx="370" cy="55" r="3" fill="#ef4444"/>
            <!-- Profit (blue) -->
            <polyline points="20,98 70,95 120,92 170,90 220,87 270,84 320,82 370,80" fill="none" stroke="#3b82f6" stroke-width="2"/>
            <circle cx="20" cy="98" r="3" fill="#3b82f6"/><circle cx="70" cy="95" r="3" fill="#3b82f6"/><circle cx="120" cy="92" r="3" fill="#3b82f6"/><circle cx="170" cy="90" r="3" fill="#3b82f6"/><circle cx="220" cy="87" r="3" fill="#3b82f6"/><circle cx="270" cy="84" r="3" fill="#3b82f6"/><circle cx="320" cy="82" r="3" fill="#3b82f6"/><circle cx="370" cy="80" r="3" fill="#3b82f6"/>
            <!-- X labels -->
            <text x="14" y="108" font-size="7" fill="#9ca3af">Day 1</text>
            <text x="62" y="108" font-size="7" fill="#9ca3af">Day 7</text>
            <text x="110" y="108" font-size="7" fill="#9ca3af">Day 14</text>
            <text x="160" y="108" font-size="7" fill="#9ca3af">Day 21</text>
            <text x="210" y="108" font-size="7" fill="#9ca3af">Day 28</text>
            <text x="260" y="108" font-size="7" fill="#9ca3af">Day 35</text>
            <text x="310" y="108" font-size="7" fill="#9ca3af">Day 42</text>
          </svg>
        </div>
      </div>

      <!-- Profit Forecast -->
      <div class="hm-card">
        <div class="hm-card-header">
          <span class="hm-card-title">Profit Forecast <span style="font-size:10px;background:#dbeafe;color:#2563eb;border-radius:4px;padding:1px 6px;font-weight:700;">AI Powered</span></span>
        </div>
        <div class="hm-pf-sub">Based on current performance and market trends</div>
        <div class="hm-pf-list">
          <div class="hm-pf-row">
            <span class="hm-pf-icon" style="background:#d1fae5;"></span>
            <span class="hm-pf-label">Expected Harvest Revenue</span>
            <span class="hm-pf-value">₹ 10,20,000</span>
          </div>
          <div class="hm-pf-row">
            <span class="hm-pf-icon" style="background:#fee2e2;"></span>
            <span class="hm-pf-label">Expected Total Expenses</span>
            <span class="hm-pf-value">₹ 7,10,000</span>
          </div>
          <div class="hm-pf-row" style="background:#f0fdf4;border-radius:6px;margin:4px 8px;">
            <span class="hm-pf-icon" style="background:#bbf7d0;"></span>
            <span class="hm-pf-label" style="font-weight:700;">Expected Net Profit</span>
            <span class="hm-pf-value green">₹ 3,10,000</span>
          </div>
          <div class="hm-pf-row">
            <span class="hm-pf-icon" style="background:#f3f4f6;"></span>
            <span class="hm-pf-label">Profit Per Bird (Expected)</span>
            <span class="hm-pf-value">₹ 20.67</span>
          </div>
          <div class="hm-pf-row">
            <span class="hm-pf-icon" style="background:#fef3c7;"></span>
            <span class="hm-pf-label">Break-even Date</span>
            <span class="hm-pf-value">12 June 2024</span>
          </div>
        </div>
        <div class="hm-pf-confidence">
          <span class="hm-pf-conf-label">Confidence Score</span>
          <div class="hm-pf-conf-track"><div class="hm-pf-conf-fill" style="width:91%"></div></div>
          <span class="hm-pf-conf-val">91%</span>
        </div>
      </div>

      <!-- Batch Performance + Quick Actions stacked -->
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="hm-card">
          <div class="hm-card-header">
            <span class="hm-card-title">Batch Performance Comparison</span>
            <a href="#" class="hm-card-link">View All</a>
          </div>
          <div class="hm-bp-list">
            ${hmProgressBar('Batch #101', 62, '#22c55e')}
            ${hmProgressBar('Batch #102', 76, '#22c55e')}
            ${hmProgressBar('Batch #103', 83, '#16a34a')}
            ${hmProgressBar('Batch #104', 45, '#f59e0b')}
          </div>
        </div>

        <div class="hm-card">
          <div class="hm-card-header">
            <span class="hm-card-title">Quick Actions</span>
          </div>
          <div class="hm-qa-grid">
            ${hmQuickAction('', '#fee2e2', 'Add Expense')}
            ${hmQuickAction('', '#fef3c7', 'Add Mortality')}
            ${hmQuickAction('', '#d1fae5', 'Add Feed')}
            ${hmQuickAction('', '#dbeafe', 'Add Note')}
            ${hmQuickAction('', '#f3e8ff', 'Download Report')}
          </div>
        </div>
      </div>

      <!-- Upcoming Payments + Knowledge Center stacked -->
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="hm-card">
          <div class="hm-card-header">
            <span class="hm-card-title">Upcoming Payments</span>
            <a href="#" class="hm-card-link">View All</a>
          </div>
          <div class="hm-pay-section">
            <div class="hm-pay-next-label">Next Installment</div>
            <div class="hm-pay-amount">₹ 5,00,000</div>
            <div class="hm-pay-detail-row"><span class="hm-pay-detail-label">Due Date</span><span class="hm-pay-detail-val">10 June 2024</span></div>
            <div class="hm-pay-detail-row"><span class="hm-pay-detail-label">For Stage</span><span class="hm-pay-detail-val">Electrical Installation</span></div>
            <div class="hm-pay-btns">
              <button class="hm-pay-btn-secondary">View Details</button>
            </div>
          </div>
        </div>

        <div class="hm-card">
          <div class="hm-card-header">
            <span class="hm-card-title">Knowledge Center</span>
            <a href="#" class="hm-card-link">View All</a>
          </div>
          <div class="hm-kb-grid">
            ${hmKbItem('<i class="fa-solid fa-play"></i>', '#fee2e2', 'Training Videos')}
            ${hmKbItem('', '#dbeafe', 'Courses')}
            ${hmKbItem('', '#d1fae5', 'Vaccination Guide')}
            ${hmKbItem('', '#fef3c7', 'SOPs & PDFs')}
          </div>
        </div>
      </div>

    </div>

    <!-- Ask Farmsence AI bar -->
    <div class="hm-ask-bar">
      <div class="hm-ask-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
      <div class="hm-ask-text">
        <div class="hm-ask-title">Ask Farmsence AI</div>
        <div class="hm-ask-sub">Your AI assistant for farm insights and recommendations</div>
      </div>
      <input class="hm-ask-input" type="text" placeholder="Ask anything... (e.g., Why is mortality high? / Feed recommendation)">
      <button class="hm-ask-send">Ask AI <i class="fa-solid fa-wand-magic-sparkles"></i></button>
    </div>

  </div>`;
}
