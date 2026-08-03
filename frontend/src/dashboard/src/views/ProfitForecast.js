/* Statistical profit forecast. Never substitutes mock values when unavailable. */
window.metaProfitForecast = {
  title: 'Profit Forecast',
  subtitle: 'Estimated profitability from verified completed-batch history.'
};

const PF_API_URL = '/api/v2/financial/forecast';

function pfEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function pfNumber(value, digits = 0) {
  return value === null || value === undefined || !Number.isFinite(Number(value))
    ? 'Not available'
    : Number(value).toLocaleString('en-IN', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
}
function pfMoney(value) {
  return value === null || value === undefined
    ? 'Not available'
    : new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(value));
}
function pfPct(value) {
  return value === null || value === undefined ? 'Not available' : `${pfNumber(value, 2)}%`;
}
function pfDate(value) {
  return value
    ? new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    })
    : 'Not available';
}
function pfQuery(horizonDays) {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 729);
  return new URLSearchParams({
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    granularity: 'month',
    horizonDays: String(horizonDays)
  });
}
async function pfFetch(horizonDays) {
  const token = localStorage.getItem('fs_token');
  const response = await fetch(`${PF_API_URL}?${pfQuery(horizonDays)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) {
    localStorage.removeItem('fs_token');
    localStorage.removeItem('fs_user');
    window.location.href = '../pages/sign-in.html';
    throw new Error('Please sign in again.');
  }
  if (response.status === 403) throw new Error('Financial data access is forbidden for this account.');
  if (!response.ok) throw new Error(body.error || body.msg || 'Could not evaluate forecast availability.');
  return body;
}

function pfStat(label, value, note, tone = '') {
  return `<article class="pf-stat ${tone}">
    <span class="pf-stat-label">${pfEscape(label)}</span>
    <strong>${value}</strong>
    <small>${pfEscape(note || '')}</small>
  </article>`;
}
function pfSectionHead(title, description, tag = '') {
  return `<header class="pf-section-head"><div><h3>${pfEscape(title)}</h3><p>${pfEscape(description)}</p></div>${tag ? `<span>${pfEscape(tag)}</span>` : ''}</header>`;
}
function pfMethod(data) {
  const method = data.method || {};
  const sample = data.historicalSample || {};
  return `<section class="pf-card pf-method-card">
    ${pfSectionHead('Method and eligibility', 'The rules used to decide whether a forecast may be shown.', method.version || 'Method unavailable')}
    <div class="pf-metric-grid">
      <div><span>Eligible history</span><strong>${pfNumber(sample.eligibleBatchCount)} completed batches</strong></div>
      <div><span>Minimum sample</span><strong>${pfNumber(sample.minimumRequired)} batches</strong></div>
      <div><span>Back-test limit</span><strong>${pfPct(method.backtestMaxWapePercent)} WAPE</strong></div>
      <div><span>Excluded history</span><strong>${pfNumber(sample.excludedCompletedBatchCount || 0)} batches</strong></div>
    </div>
    <p class="pf-disclosure">${pfEscape(method.description || '')}</p>
  </section>`;
}
function pfUnavailable(data) {
  const sample = data.historicalSample || {};
  const backtest = data.backtest;
  return `<section class="pf-unavailable">
    <div class="pf-unavailable-icon"><i class="fa-solid fa-chart-line"></i></div>
    <span class="pf-eyebrow">Readiness check</span>
    <h2>Forecast unavailable</h2>
    <p>${pfEscape(data.reason || 'The verified-history requirements are not met.')}</p>
    <div class="pf-readiness-grid">
      <div><span>Eligible completed batches</span><strong>${pfNumber(sample.eligibleBatchCount)} of ${pfNumber(sample.minimumRequired)} required</strong></div>
      <div><span>Held-out validation</span><strong>${backtest ? (backtest.passed ? 'Passed' : 'Failed') : 'Not run'}</strong></div>
      <div><span>Revenue / expense WAPE</span><strong>${backtest ? `${pfPct(backtest.revenueWapePercent)} / ${pfPct(backtest.expenseWapePercent)}` : 'Not available'}</strong></div>
    </div>
    <div class="pf-info-banner"><i class="fa-solid fa-circle-info"></i><span>No estimate, sensitivity value, or factual comparison is displayed until both the sample and back-test gates pass.</span></div>
  </section>${pfMethod(data)}`;
}
function pfScenario(label, row, note, tone, icon) {
  return `<article class="pf-scenario ${tone}">
    <header><div class="pf-scenario-icon"><i class="${icon}"></i></div><div><span>${pfEscape(label)}</span><small>${pfEscape(note)}</small></div></header>
    <div class="pf-scenario-profit"><span>Estimated profit</span><strong>${pfMoney(row?.profit)}</strong></div>
    <dl>
      <div><dt>Revenue</dt><dd>${pfMoney(row?.revenue)}</dd></div>
      <div><dt>Expenses</dt><dd>${pfMoney(row?.expenses)}</dd></div>
      <div><dt>Margin</dt><dd>${pfPct(row?.marginPercent)}</dd></div>
    </dl>
  </article>`;
}
function pfRows(data) {
  return (data.batches || []).map(batch => `<tr>
    <td class="pf-batch-cell"><strong>${pfEscape(batch.batchCode || batch.batchId)}</strong><small>${pfEscape(batch.farmName || 'Farm name unavailable')}</small></td>
    <td>${pfDate(batch.expectedHarvestAt)}</td>
    <td class="pf-num">${pfNumber(batch.estimatedBirdsToSell)}</td>
    <td class="pf-num">${pfMoney(batch.recordedRevenue)}</td>
    <td class="pf-num">${pfMoney(batch.recordedExpenses)}</td>
    <td class="pf-num">${pfMoney(batch.estimate?.baseline?.revenue)}</td>
    <td class="pf-num">${pfMoney(batch.estimate?.baseline?.expenses)}</td>
    <td class="pf-num pf-profit">${pfMoney(batch.estimate?.baseline?.profit)}</td>
    <td class="pf-num">${pfPct(batch.estimate?.baseline?.marginPercent)}</td>
    <td class="pf-num">${pfPct(batch.comparisons?.currentMortalityPercent)}<small>History ${pfPct(batch.comparisons?.historicalMortalityPercent)}</small></td>
    <td class="pf-num">${pfNumber(batch.comparisons?.currentEstimatedFcr, 3)}<small>History ${pfNumber(batch.comparisons?.historicalEstimatedFcr, 3)}</small></td>
  </tr>`).join('');
}
function pfBacktest(data) {
  const backtest = data.backtest || {};
  return `<section class="pf-card">
    ${pfSectionHead('Held-out back-test', 'Historical estimates compared with later completed batches.', 'Accuracy gate passed')}
    <div class="pf-metric-grid">
      <div><span>Held-out batches</span><strong>${pfNumber(backtest.holdoutCount)}</strong></div>
      <div><span>Revenue WAPE</span><strong>${pfPct(backtest.revenueWapePercent)}</strong></div>
      <div><span>Expense WAPE</span><strong>${pfPct(backtest.expenseWapePercent)}</strong></div>
      <div><span>Profit MAE</span><strong>${pfMoney(backtest.profitMae)}</strong></div>
    </div>
    <p class="pf-disclosure">Enabled because revenue and expense weighted absolute percentage errors are within the ${pfPct(backtest.thresholdPercent)} threshold. Held-out batches are evaluated chronologically.</p>
  </section>`;
}
function pfRender(data) {
  if (!data.available) return pfUnavailable(data);
  const sensitivity = data.sensitivity || {};
  const assumptions = sensitivity.assumptions || {};
  const rows = pfRows(data);
  return `<section class="pf-kpi-block">
    <div class="pf-primary-stats">
      ${pfStat('Estimated Revenue', pfMoney(sensitivity.baseline?.revenue), `${data.horizonDays}-day horizon`, 'revenue')}
      ${pfStat('Estimated Expenses', pfMoney(sensitivity.baseline?.expenses), 'Recorded plus historical baseline', 'expenses')}
      ${pfStat('Estimated Profit', pfMoney(sensitivity.baseline?.profit), 'Revenue minus expenses', 'profit')}
      ${pfStat('Estimated Margin', pfPct(sensitivity.baseline?.marginPercent), 'Profit divided by revenue', 'margin')}
    </div>
    <div class="pf-validation-strip">
      <div><i class="fa-solid fa-database"></i><span>Historical sample<strong>${pfNumber(data.historicalSample?.eligibleBatchCount)} eligible batches</strong></span></div>
      <div><i class="fa-solid fa-shield-check"></i><span>Held-out validation<strong>Passed on ${pfNumber(data.backtest?.holdoutCount)} batches</strong></span></div>
      <div><i class="fa-solid fa-calendar-check"></i><span>Forecast horizon<strong>Next ${pfNumber(data.horizonDays)} days</strong></span></div>
    </div>
  </section>
  <section class="pf-card">
    ${pfSectionHead('Sensitivity range', 'Fixed input changes around the baseline; these are not probability-weighted outcomes.', '±10% inputs')}
    <div class="pf-scenarios">
      ${pfScenario('Lower sensitivity', sensitivity.lower, assumptions.lower, 'lower', 'fa-solid fa-arrow-trend-down')}
      ${pfScenario('Baseline estimate', sensitivity.baseline, 'Recency-weighted historical medians', 'baseline', 'fa-solid fa-chart-line')}
      ${pfScenario('Upper sensitivity', sensitivity.upper, assumptions.upper, 'upper', 'fa-solid fa-arrow-trend-up')}
    </div>
    <p class="pf-disclosure">These are fixed input sensitivities, not probabilities or best/worst predictions.</p>
  </section>
  <section class="pf-card pf-batch-section">
    ${pfSectionHead('Active batch estimates', 'Eligible active or planned batches expected to harvest inside the selected horizon.', `${(data.batches || []).length} batches`)}
    <div class="pf-table-note"><i class="fa-solid fa-circle-info"></i><span>Estimated birds to sell subtract recorded mortality, culls, and prior partial sales. Scroll horizontally to compare all recorded and estimated values.</span></div>
    <div class="pf-table-wrap">
      <table class="pf-table">
        <thead><tr><th>Batch / Farm</th><th>Expected harvest</th><th>Birds to sell</th><th>Recorded revenue</th><th>Recorded expenses</th><th>Final revenue</th><th>Final expenses</th><th>Profit</th><th>Margin</th><th>Mortality</th><th>Estimated FCR</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="11" class="pf-empty">No eligible batches in this horizon.</td></tr>'}</tbody>
      </table>
    </div>
  </section>
  <div class="pf-detail-grid">
    ${pfBacktest(data)}
    <section class="pf-card">
      ${pfSectionHead('Computed facts', 'Plain statements calculated from the same verified history.', 'No advice')}
      <div class="pf-facts">${(data.factualComparisons || []).map(text => `<div class="pf-fact"><i class="fa-solid fa-circle-check"></i><span>${pfEscape(text)}</span></div>`).join('') || '<div class="pf-empty">No factual comparisons available.</div>'}</div>
    </section>
  </div>
  ${pfMethod(data)}`;
}

function pfStyles() {
  if (document.getElementById('pf-styles')) return;
  const style = document.createElement('style');
  style.id = 'pf-styles';
  style.textContent = `
    .pf-page,.pf-page *{box-sizing:border-box}.pf-page{padding:20px;background:#f5f6fa;min-height:100%;color:#18212f;font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.pf-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:16px;padding:20px;border:1px solid #dfe7e1;border-radius:14px;background:linear-gradient(135deg,#f0fdf4 0%,#fff 72%)}.pf-eyebrow{display:block;margin-bottom:5px;color:#15803d;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.pf-hero h2{margin:0 0 5px;font-size:20px}.pf-hero p{max-width:680px;margin:0;color:#64748b;line-height:1.5}.pf-horizon{display:flex;min-width:190px;flex-direction:column;gap:5px}.pf-horizon span{font-size:10px;font-weight:800;color:#475569;text-transform:uppercase}.pf-horizon select{width:100%;padding:10px 32px 10px 11px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#172033;font:inherit;font-weight:700}.pf-primary-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.pf-stat,.pf-card,.pf-unavailable{background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 1px 2px rgba(15,23,42,.03)}.pf-stat{position:relative;overflow:hidden;padding:16px}.pf-stat:before{position:absolute;inset:0 auto 0 0;width:4px;background:#94a3b8;content:""}.pf-stat.revenue:before{background:#3b82f6}.pf-stat.expenses:before{background:#f59e0b}.pf-stat.profit:before{background:#16a34a}.pf-stat.margin:before{background:#8b5cf6}.pf-stat-label{display:block;color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase}.pf-stat strong{display:block;margin:7px 0 4px;font-size:21px;line-height:1.1}.pf-stat small{color:#94a3b8;font-size:10px}.pf-validation-strip{display:grid;grid-template-columns:repeat(3,1fr);margin:12px 0 16px;border:1px solid #e2e8f0;border-radius:12px;background:#fff}.pf-validation-strip>div{display:flex;align-items:center;gap:10px;padding:12px 16px;border-right:1px solid #e2e8f0}.pf-validation-strip>div:last-child{border-right:0}.pf-validation-strip i{color:#16a34a;font-size:16px}.pf-validation-strip span,.pf-validation-strip strong{display:block}.pf-validation-strip span{color:#64748b;font-size:10px}.pf-validation-strip strong{margin-top:2px;color:#1e293b;font-size:12px}.pf-card{padding:17px;margin-bottom:16px}.pf-section-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:14px}.pf-section-head h3{margin:0 0 4px;font-size:14px}.pf-section-head p{margin:0;color:#64748b;font-size:11px;line-height:1.45}.pf-section-head>span{flex:none;padding:4px 9px;border-radius:999px;background:#ecfdf3;color:#15803d;font-size:9px;font-weight:800}.pf-scenarios{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.pf-scenario{padding:15px;border:1px solid #e2e8f0;border-radius:11px;background:#fff}.pf-scenario>header{display:flex;align-items:center;gap:9px}.pf-scenario-icon{display:grid;width:34px;height:34px;flex:none;place-items:center;border-radius:9px;background:#f1f5f9;color:#475569}.pf-scenario header span,.pf-scenario header small{display:block}.pf-scenario header span{font-weight:800}.pf-scenario header small{margin-top:2px;color:#64748b;font-size:9px}.pf-scenario-profit{padding:14px 0 11px}.pf-scenario-profit span{display:block;color:#64748b;font-size:10px}.pf-scenario-profit strong{display:block;margin-top:3px;font-size:22px}.pf-scenario dl{display:grid;gap:7px;margin:0}.pf-scenario dl div{display:flex;justify-content:space-between;gap:10px;padding-top:7px;border-top:1px solid rgba(148,163,184,.2)}.pf-scenario dt{color:#64748b}.pf-scenario dd{margin:0;font-weight:800}.pf-scenario.lower{background:#fffaf2;border-color:#fed7aa}.pf-scenario.lower .pf-scenario-icon{background:#ffedd5;color:#c2410c}.pf-scenario.baseline{background:#f4fdf7;border-color:#86efac;box-shadow:0 6px 18px rgba(22,163,74,.08)}.pf-scenario.baseline .pf-scenario-icon{background:#dcfce7;color:#15803d}.pf-scenario.upper{background:#f5f9ff;border-color:#bfdbfe}.pf-scenario.upper .pf-scenario-icon{background:#dbeafe;color:#1d4ed8}.pf-disclosure{margin:13px 0 0;padding-top:11px;border-top:1px solid #edf1f5;color:#64748b;font-size:10px;line-height:1.5}.pf-table-note,.pf-info-banner{display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border-radius:8px;background:#eff6ff;color:#1e40af;font-size:10px;line-height:1.45}.pf-table-wrap{margin-top:12px;overflow:auto;border:1px solid #e2e8f0;border-radius:9px}.pf-table{width:100%;min-width:1260px;border-collapse:separate;border-spacing:0}.pf-table th,.pf-table td{padding:10px 11px;border-bottom:1px solid #edf1f5;background:#fff;text-align:left;white-space:nowrap;font-size:10px}.pf-table th{position:sticky;top:0;z-index:2;background:#f8fafc;color:#64748b;font-size:9px;text-transform:uppercase}.pf-table th:first-child,.pf-table td:first-child{position:sticky;left:0;z-index:1}.pf-table th:first-child{z-index:3}.pf-table tr:last-child td{border-bottom:0}.pf-table tbody tr:hover td{background:#f8fafc}.pf-table tbody tr:hover td:first-child{background:#f8fafc}.pf-batch-cell strong,.pf-batch-cell small,.pf-table td small{display:block}.pf-batch-cell strong{color:#15803d}.pf-batch-cell small,.pf-table td small{margin-top:2px;color:#94a3b8}.pf-num{text-align:right!important;font-variant-numeric:tabular-nums}.pf-profit{font-weight:800;color:#166534}.pf-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.pf-detail-grid>.pf-card{height:calc(100% - 16px)}.pf-metric-grid,.pf-readiness-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.pf-metric-grid>div,.pf-readiness-grid>div{padding:11px;border-radius:8px;background:#f8fafc}.pf-metric-grid span,.pf-metric-grid strong,.pf-readiness-grid span,.pf-readiness-grid strong{display:block}.pf-metric-grid span,.pf-readiness-grid span{color:#64748b;font-size:9px;text-transform:uppercase}.pf-metric-grid strong,.pf-readiness-grid strong{margin-top:4px;font-size:12px}.pf-facts{display:grid;gap:8px}.pf-fact{display:flex;gap:9px;padding:10px;border:1px solid #e5e7eb;border-radius:8px;background:#fafafa;font-size:11px;line-height:1.45}.pf-fact i{margin-top:2px;color:#16a34a}.pf-unavailable{padding:30px;margin-bottom:16px;text-align:center}.pf-unavailable-icon{display:grid;width:54px;height:54px;margin:0 auto 12px;place-items:center;border-radius:50%;background:#f1f5f9;color:#64748b;font-size:22px}.pf-unavailable h2{margin:0 0 7px;font-size:20px}.pf-unavailable>p{max-width:680px;margin:0 auto;color:#64748b;line-height:1.55}.pf-readiness-grid{grid-template-columns:repeat(3,1fr);max-width:850px;margin:20px auto;text-align:left}.pf-unavailable .pf-info-banner{max-width:850px;margin:0 auto;text-align:left}.pf-empty{padding:24px!important;text-align:center!important;color:#64748b}.pf-loading,.pf-error{padding:40px;text-align:center;color:#64748b}.pf-error{border:1px solid #fecaca;border-radius:12px;background:#fff;color:#b91c1c}.pf-retry{margin-top:12px;padding:8px 13px;border:0;border-radius:7px;background:#15803d;color:#fff;cursor:pointer}@media(max-width:1150px){.pf-primary-stats{grid-template-columns:repeat(2,1fr)}.pf-scenarios,.pf-detail-grid{grid-template-columns:1fr}.pf-metric-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:760px){.pf-page{padding:12px}.pf-hero{align-items:stretch;flex-direction:column;padding:16px}.pf-horizon{width:100%}.pf-primary-stats,.pf-validation-strip,.pf-readiness-grid{grid-template-columns:1fr}.pf-validation-strip>div{border-right:0;border-bottom:1px solid #e2e8f0}.pf-validation-strip>div:last-child{border-bottom:0}.pf-section-head{flex-direction:column}.pf-metric-grid{grid-template-columns:1fr 1fr}.pf-stat strong{font-size:18px}}@media(max-width:430px){.pf-primary-stats,.pf-metric-grid{grid-template-columns:1fr}.pf-page{padding:9px}.pf-card{padding:14px}}
  `;
  document.head.appendChild(style);
}

async function pfLoad(days) {
  const root = document.getElementById('pf-content');
  if (!root) return;
  root.innerHTML = '<div class="pf-loading"><i class="fa-solid fa-spinner fa-spin"></i><p>Evaluating verified history and held-out accuracy…</p></div>';
  try {
    root.innerHTML = pfRender(await pfFetch(days));
  } catch (error) {
    root.innerHTML = `<div class="pf-error">${pfEscape(error.message)}<br><button class="pf-retry" id="pf-retry">Retry</button></div>`;
    document.getElementById('pf-retry')?.addEventListener('click', () => pfLoad(days));
  }
}

function viewProfitForecast() {
  pfStyles();
  setTimeout(() => {
    const horizon = document.getElementById('pf-horizon');
    horizon?.addEventListener('change', () => pfLoad(Number(horizon.value)));
    pfLoad(Number(horizon?.value || 60));
  }, 0);
  return `<div class="pf-page">
    <section class="pf-hero">
      <div><span class="pf-eyebrow">Verified historical model</span><h2>Profit forecast</h2><p>Projected financial outcomes for batches approaching harvest, based on canonical sales, direct expenses, and operational records.</p></div>
      <label class="pf-horizon"><span>Forecast horizon</span><select id="pf-horizon"><option value="30">Next 30 days</option><option value="60" selected>Next 60 days</option><option value="90">Next 90 days</option><option value="180">Next 180 days</option></select></label>
    </section>
    <div id="pf-content"><div class="pf-loading"><i class="fa-solid fa-spinner fa-spin"></i><p>Evaluating verified history and held-out accuracy…</p></div></div>
  </div>`;
}
