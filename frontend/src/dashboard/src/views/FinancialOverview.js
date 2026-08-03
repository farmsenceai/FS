/* Canonical financial overview. Values come only from recorded sales and expenses. */
window.metaFinancialOverview = {
  title: 'Financials Overview',
  subtitle: 'Recorded revenue, expenses, and operational profit.'
};

const FO_OVERVIEW_URL = '/api/v2/financial/overview';
const FO_BATCHES_URL = '/api/v2/financial/batches';
const FO_COLORS = ['#16a34a', '#ef4444', '#3b82f6', '#a855f7', '#f97316', '#14b8a6', '#0ea5e9'];

function foEscape(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function foNumber(value, digits = 0) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return 'Not available';
  return Number(value).toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function foMoney(value) { return value === null || value === undefined ? 'Not available' : `₹ ${foNumber(value)}`; }
function foPercent(value) { return value === null || value === undefined ? 'Not available' : `${foNumber(value, 2)}%`; }
function foLabel(value) { return String(value || 'other').replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()); }

function foPeriod(days) {
  const to = new Date(), from = new Date(to);
  from.setUTCDate(from.getUTCDate() - days + 1);
  return new URLSearchParams({ from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10), granularity: days <= 31 ? 'day' : 'week' });
}
async function foFetch(url, query) {
  const token = localStorage.getItem('fs_token');
  const response = await fetch(`${url}?${query}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) {
    localStorage.removeItem('fs_token'); localStorage.removeItem('fs_user');
    window.location.href = '../pages/sign-in.html';
    throw new Error('Please sign in again.');
  }
  if (response.status === 403) throw new Error('Financial data access is forbidden for this account.');
  if (!response.ok) throw new Error(body.error || body.msg || 'Could not load financial data.');
  return body;
}

function foChange(value) {
  if (value === null || value === undefined) return 'Prior-period comparison unavailable';
  return `${foNumber(Math.abs(value), 2)}% ${value >= 0 ? 'up' : 'down'} vs equal prior period`;
}
function foStat(label, value, note) {
  return `<div class="fo-stat"><span>${foEscape(label)}</span><strong>${value}</strong><small>${foEscape(note || '')}</small></div>`;
}
function foEmpty(message) { return `<div class="fo-empty">${foEscape(message)}</div>`; }

function foTrend(data) {
  const rows = data.trend || [];
  if (!rows.length) return foEmpty('No sales or expenses were recorded in this period.');
  const width = 760, height = 235, left = 60, right = 18, top = 18, bottom = 35;
  const values = rows.flatMap(row => [Number(row.revenue)||0, Number(row.expenses)||0, Math.max(Number(row.operationalProfit)||0, 0)]);
  const max = Math.max(...values, 1), slot = (width-left-right)/rows.length, bar = Math.max(3, slot*.23);
  const series = [['revenue','#16a34a'],['expenses','#ef4444'],['operationalProfit','#3b82f6']];
  const marks = rows.map((row,index) => series.map(([key,color], offset) => {
    const raw = Number(row[key]) || 0, shown = Math.max(raw, 0), h = shown/max*(height-top-bottom);
    const x = left + index*slot + slot*.12 + offset*bar;
    return `<rect x="${x}" y="${height-bottom-h}" width="${bar-1}" height="${h}" rx="2" fill="${color}"><title>${foEscape(row.period)} ${foLabel(key)}: ${foMoney(raw)}</title></rect>`;
  }).join('') + (rows.length <= 16 ? `<text x="${left+index*slot+slot/2}" y="${height-12}" text-anchor="middle">${foEscape(String(row.period).slice(5))}</text>` : '')).join('');
  return `<div class="fo-legend"><span><i style="background:#16a34a"></i>Revenue</span><span><i style="background:#ef4444"></i>Expenses</span><span><i style="background:#3b82f6"></i>Operational profit</span></div><svg class="fo-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Recorded revenue, expenses, and operational profit"><line x1="${left}" y1="${height-bottom}" x2="${width-right}" y2="${height-bottom}" stroke="#d1d5db"/><text x="4" y="20">${foEscape(foMoney(max))}</text><text x="22" y="${height-bottom}">₹ 0</text>${marks}</svg><p class="fo-note">Negative operational-profit buckets are reported in tooltips and totals; bars stop at the zero baseline.</p>`;
}

function foExpenseBreakdown(data) {
  const rows = data.expenseBreakdown || [], total = Number(data.totals?.totalExpenses) || 0;
  if (!rows.length) return foEmpty('No expenses were recorded in this period.');
  return rows.map((row,index) => {
    const pct = row.percent ?? (total ? Number(row.amount)/total*100 : null);
    return `<div class="fo-bar"><div><strong>${foEscape(foLabel(row.category))}</strong><small>${foNumber(row.entryCount)} entries</small></div><div class="fo-track"><i style="width:${pct || 0}%;background:${FO_COLORS[index%FO_COLORS.length]}"></i></div><span>${foPercent(pct)}<small>${foMoney(row.amount)}</small></span></div>`;
  }).join('');
}

function foRecordedFlow(data) {
  const flow = data.recordedInflowsOutflows || {};
  return `<div class="fo-flow"><div><span>Recorded sale inflows</span><strong class="positive">${foMoney(flow.inflows)}</strong></div><div><span>Recorded expense outflows</span><strong class="negative">${foMoney(flow.outflows)}</strong></div><div><span>Net recorded flow</span><strong>${foMoney(flow.netRecordedFlow)}</strong></div></div><p class="fo-note">This is a transaction rollup rather than a cash-flow statement.</p>`;
}

function foRevenueSource(data) {
  const source = (data.revenueBreakdown || [])[0];
  if (!source) return foEmpty('No recorded revenue source in this period.');
  return `<div class="fo-source"><i class="fa-solid fa-drumstick-bite"></i><div><span>Live bird sales</span><strong>${foMoney(source.amount)}</strong><small>${foNumber(source.eventCount)} sale events · ${source.percent === null ? 'share unavailable' : foPercent(source.percent)} of recorded revenue</small></div></div><p class="fo-note">Live bird sales are currently the only canonical revenue source. No artificial source split is shown.</p>`;
}

function foCompleteness(data) {
  const c = data.completeness || {};
  return `<div class="fo-completeness"><strong>Data completeness</strong><span>${foNumber(c.saleEventCount)} sales and ${foNumber(c.expenseEntryCount)} expenses recorded.</span><span>${foNumber(c.batchesWithSalesAndDirectExpenses)} of ${foNumber(c.batchCountInScope)} batches have both sales and direct expenses.</span><span>${foNumber(c.batchesWithoutSales)} without sales; ${foNumber(c.batchesWithoutDirectExpenses)} without direct expenses.</span></div>`;
}

function foBatchRows(payload) {
  const rows = payload.data || [];
  if (!rows.length) return `<tr><td colspan="9">${foEmpty('No batches have period sales or direct expenses.')}</td></tr>`;
  return rows.map(row => `<tr><td><strong>${foEscape(row.batchCode || row.batchId)}</strong><small>${foEscape(row.farmName || row.farmCode || 'Farm name unavailable')}</small></td><td>${foNumber(row.quantitySold)}</td><td>${foMoney(row.revenue)}</td><td>${foMoney(row.directExpenseTotal)}</td><td>${foMoney(row.grossProfit)}</td><td>${foMoney(row.directProfit)}</td><td>${foPercent(row.directProfitMarginPercent)}</td><td>${foEscape(foLabel(row.saleState))}</td><td>${foEscape(row.batchStatus || 'Not available')}</td></tr>`).join('');
}

function foRender(overview, batches) {
  const t = overview.totals || {}, c = overview.changes || {};
  return `${foCompleteness(overview)}<div class="fo-stats">
    ${foStat('Recorded Revenue', foMoney(t.revenue), foChange(c.revenue))}
    ${foStat('Recorded Expenses', foMoney(t.totalExpenses), foChange(c.totalExpenses))}
    ${foStat('Gross Profit', foMoney(t.grossProfit), 'Revenue less recorded feed, chicks, and medicine/vaccines')}
    ${foStat('Operational Profit', foMoney(t.operationalProfit), foChange(c.operationalProfit))}
    ${foStat('Operational Margin', foPercent(t.profitMarginPercent), 'Operational profit ÷ recorded revenue')}
    ${foStat('Cost / Bird Sold', foMoney(overview.costPerBirdSold), 'All recorded period expenses ÷ birds sold')}
  </div>
  <div class="fo-main"><section class="fo-card fo-wide"><h3>Recorded Financial Trend</h3>${foTrend(overview)}</section><section class="fo-card"><h3>Expenses by Category</h3>${foExpenseBreakdown(overview)}</section></div>
  <div class="fo-grid fo-grid-two"><section class="fo-card"><h3>Recorded Inflows and Outflows</h3>${foRecordedFlow(overview)}</section><section class="fo-card"><h3>Revenue Source</h3>${foRevenueSource(overview)}</section></div>
  <section class="fo-card"><h3>Batch Profitability — Recorded Direct Costs</h3><p class="fo-note">Direct profit excludes unallocated shared farm expenses. Gross profit subtracts only recorded feed, chicks, and medicine/vaccines.</p><div class="fo-table-wrap"><table><thead><tr><th>Batch / Farm</th><th>Birds Sold</th><th>Revenue</th><th>Direct Expenses</th><th>Gross Profit</th><th>Direct Profit</th><th>Direct Margin</th><th>Sale State</th><th>Batch Status</th></tr></thead><tbody>${foBatchRows(batches)}</tbody></table></div></section>`;
}

function foStyles() {
  if (document.getElementById('fo-styles')) return;
  const style = document.createElement('style'); style.id = 'fo-styles';
  style.textContent = `.fo-page{padding:20px;background:#f5f6fa;min-height:100%;color:#18212f}.fo-toolbar{display:flex;justify-content:flex-end;margin-bottom:12px}.fo-toolbar select{padding:8px 30px 8px 10px;border:1px solid #dce1e8;border-radius:7px;background:#fff}.fo-stats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;margin-bottom:16px}.fo-stat,.fo-card,.fo-completeness{background:#fff;border:1px solid #e5e9ef;border-radius:10px}.fo-stat{padding:14px;display:flex;flex-direction:column;gap:5px}.fo-stat span,.fo-stat small,.fo-note,.fo-bar small,.fo-source small{color:#687386;font-size:11px}.fo-stat strong{font-size:18px}.fo-card{padding:16px;margin-bottom:16px}.fo-card h3{font-size:14px;margin:0 0 14px}.fo-main{display:grid;grid-template-columns:1.6fr 1fr;gap:16px}.fo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.fo-grid-two{grid-template-columns:repeat(2,1fr)}.fo-legend{display:flex;gap:18px;color:#687386;font-size:11px}.fo-legend span{display:flex;align-items:center;gap:5px}.fo-legend i{width:8px;height:8px;border-radius:50%}.fo-chart{width:100%;height:235px}.fo-chart text{font-size:10px;fill:#718096}.fo-bar{display:grid;grid-template-columns:130px 1fr 105px;align-items:center;gap:10px;margin:12px 0}.fo-bar div:first-child,.fo-bar span{display:flex;flex-direction:column}.fo-bar span{text-align:right}.fo-track{height:12px;background:#eef1f4;border-radius:8px;overflow:hidden}.fo-track i{height:100%;display:block;border-radius:8px}.fo-flow>div{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eef1f4}.positive{color:#15803d}.negative{color:#dc2626}.fo-source{display:flex;align-items:center;gap:14px;padding:15px;background:#f0fdf4;border-radius:9px}.fo-source>i{font-size:25px;color:#15803d}.fo-source div{display:flex;flex-direction:column;gap:4px}.fo-source strong{font-size:20px}.fo-completeness{padding:11px 14px;margin-bottom:14px;display:flex;gap:18px;align-items:center;font-size:11px;color:#596579}.fo-completeness strong{color:#273244;white-space:nowrap}.fo-table-wrap{overflow:auto}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:9px 10px;border-bottom:1px solid #edf0f3;white-space:nowrap;font-size:11px}th{background:#f8fafb;color:#667085;text-transform:uppercase;font-size:9px}td:first-child{color:#15803d}td small{display:block;color:#8a94a3;margin-top:2px}.fo-empty,.fo-loading,.fo-error{padding:30px;text-align:center;color:#687386}.fo-error{color:#b42318;background:#fff;border:1px solid #fecdca;border-radius:10px}.fo-retry{margin-top:12px;padding:7px 12px;border:0;border-radius:6px;background:#15803d;color:#fff;cursor:pointer}@media(max-width:1200px){.fo-stats{grid-template-columns:repeat(3,1fr)}.fo-main,.fo-grid{grid-template-columns:1fr}.fo-completeness{align-items:flex-start;flex-direction:column;gap:5px}}@media(max-width:700px){.fo-stats{grid-template-columns:1fr 1fr}.fo-page{padding:12px}}`;
  document.head.appendChild(style);
}

async function foLoad(days) {
  const root = document.getElementById('fo-content'); if (!root) return;
  root.innerHTML = '<div class="fo-loading">Loading recorded financial data…</div>';
  const query = foPeriod(days);
  try {
    const [overview, batches] = await Promise.all([foFetch(FO_OVERVIEW_URL, query), foFetch(FO_BATCHES_URL, new URLSearchParams([...query, ['limit','1000']]))]);
    root.innerHTML = foRender(overview, batches);
  } catch (error) {
    root.innerHTML = `<div class="fo-error">${foEscape(error.message)}<br><button class="fo-retry" id="fo-retry">Retry</button></div>`;
    document.getElementById('fo-retry')?.addEventListener('click', () => foLoad(days));
  }
}

function viewFinancialOverview() {
  foStyles();
  setTimeout(() => { const range=document.getElementById('fo-range'); range?.addEventListener('change',()=>foLoad(Number(range.value))); foLoad(Number(range?.value||30)); }, 0);
  return `<div class="fo-page"><div class="fo-toolbar"><label>Reporting period&nbsp; <select id="fo-range"><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 365 days</option></select></label></div><div id="fo-content"><div class="fo-loading">Loading recorded financial data…</div></div></div>`;
}
