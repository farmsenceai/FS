/* Canonical batchwise revenue view. All values come from batch-sales, batch-expenses,
   bird_batches, farms, and daily_flock_records through the v2 aggregation API. */

window.metaBatchwiseRevenue = {
  title: 'Batchwise Revenue',
  subtitle: 'Recorded sale revenue by batch and farm.'
};

const BR_API_URL = '/api/v2/financial/batchwise-revenue';
const BR_COLORS = ['#16a34a', '#3b82f6', '#a855f7', '#f97316', '#14b8a6', '#ef4444', '#0ea5e9', '#84cc16'];

function brEscape(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function brNumber(value, digits = 0) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return 'Not available';
  return Number(value).toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function brMoney(value) { return value === null || value === undefined ? 'Not available' : `₹ ${brNumber(value, 0)}`; }
function brDate(value) { return value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'Not available'; }
function brPct(value) { return value === null || value === undefined ? 'Not available' : `${brNumber(value, 2)}%`; }
function brBatchName(row) { return row.batchCode || String(row.batchId || 'Unknown batch'); }
function brFarmName(row) { return row.farmName || row.farmCode || 'Farm name unavailable'; }

async function brFetch(rangeDays) {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - rangeDays + 1);
  const query = new URLSearchParams({ from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10), granularity: rangeDays <= 31 ? 'day' : 'week' });
  const token = localStorage.getItem('fs_token');
  const response = await fetch(`${BR_API_URL}?${query}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) {
    localStorage.removeItem('fs_token'); localStorage.removeItem('fs_user');
    window.location.href = '../pages/sign-in.html';
    throw new Error('Please sign in again.');
  }
  if (response.status === 403) throw new Error('Financial data access is forbidden for this account.');
  if (!response.ok) throw new Error(body.error || body.msg || 'Could not load recorded revenue.');
  return body;
}

function brStat(label, value, note = '') {
  return `<div class="br-stat"><span>${brEscape(label)}</span><strong>${value}</strong>${note ? `<small>${note}</small>` : ''}</div>`;
}

function brEmpty(message) { return `<div class="br-empty">${brEscape(message)}</div>`; }

function brTrend(data) {
  const rows = data.trend || [];
  if (!rows.length) return brEmpty('No sale events were recorded in this period.');
  const width = 720, height = 220, left = 58, bottom = 34, top = 16, right = 16;
  const max = Math.max(...rows.map(row => Number(row.revenue) || 0), 1);
  const barWidth = Math.max(4, (width - left - right) / rows.length * .65);
  const bars = rows.map((row, index) => {
    const slot = (width - left - right) / rows.length;
    const h = (Number(row.revenue) || 0) / max * (height - top - bottom);
    const x = left + index * slot + (slot - barWidth) / 2;
    const label = String(row.period || '').slice(5);
    return `<rect x="${x}" y="${height-bottom-h}" width="${barWidth}" height="${h}" rx="3" fill="#16a34a"><title>${brEscape(row.period)}: ${brMoney(row.revenue)}</title></rect>${rows.length <= 16 ? `<text x="${x + barWidth/2}" y="${height-12}" text-anchor="middle">${brEscape(label)}</text>` : ''}`;
  }).join('');
  return `<svg class="br-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Recorded revenue by sale date"><line x1="${left}" y1="${height-bottom}" x2="${width-right}" y2="${height-bottom}" stroke="#d1d5db"/><text x="4" y="20">${brEscape(brMoney(max))}</text><text x="4" y="${height-bottom}">₹ 0</text>${bars}</svg><p class="br-caption">Discrete recorded revenue bucketed by sale date. Days without a sale are zero; no values are interpolated.</p>`;
}

function brDistribution(data) {
  const rows = data.batches || [], total = Number(data.stats?.totalRevenue) || 0;
  if (!rows.length) return brEmpty('No batch revenue to distribute.');
  return rows.map((row, index) => {
    const pct = total ? Number(row.revenue) / total * 100 : 0;
    return `<div class="br-bar-row"><div><strong>${brEscape(brBatchName(row))}</strong><small>${brEscape(brFarmName(row))}</small></div><div class="br-track"><i style="width:${pct}%;background:${BR_COLORS[index % BR_COLORS.length]}"></i></div><span>${brPct(pct)}<small>${brMoney(row.revenue)}</small></span></div>`;
  }).join('');
}

function brFarms(data) {
  const rows = data.revenueByFarm || [], max = Math.max(...rows.map(row => Number(row.revenue) || 0), 1);
  if (!rows.length) return brEmpty('No farm revenue to show.');
  return rows.map((row, index) => `<div class="br-bar-row"><div><strong>${brEscape(row.farmName || 'Farm name unavailable')}</strong><small>${brNumber(row.batchCount)} batch${row.batchCount === 1 ? '' : 'es'}</small></div><div class="br-track"><i style="width:${Number(row.revenue)/max*100}%;background:${BR_COLORS[index % BR_COLORS.length]}"></i></div><span>${brMoney(row.revenue)}</span></div>`).join('');
}

function brFacts(data) {
  const rows = data.batches || [], stats = data.stats || {};
  if (!rows.length) return brEmpty('Factual comparisons will appear after sales are recorded.');
  const perBird = [...rows].filter(row => row.revenuePerBird !== null).sort((a,b) => b.revenuePerBird-a.revenuePerBird);
  const facts = [
    `${brBatchName(stats.highestRevenueBatch)} has the highest recorded revenue (${brMoney(stats.highestRevenueBatch?.revenue)}).`,
    `${brBatchName(stats.lowestRevenueBatch)} has the lowest recorded revenue (${brMoney(stats.lowestRevenueBatch?.revenue)}).`,
    perBird.length ? `${brBatchName(perBird[0])} has the highest recorded revenue per bird (${brMoney(perBird[0].revenuePerBird)}).` : null,
    stats.revenueChangePercent === null ? 'A prior-period revenue comparison is unavailable.' : `Recorded revenue changed ${brPct(Math.abs(stats.revenueChangePercent))} ${stats.revenueChangePercent >= 0 ? 'up' : 'down'} versus the equal preceding period.`
  ].filter(Boolean);
  return facts.map(fact => `<div class="br-fact"><i class="fa-solid fa-circle-info"></i><span>${brEscape(fact)}</span></div>`).join('');
}

function brSaleState(value) {
  return ({ partially_sold: 'Partially sold', sold_profitable: 'Sold — positive direct profit', sold_loss: 'Sold — direct loss', no_sales: 'No sales' })[value] || value || 'Not available';
}

function brRows(data) {
  const rows = data.batches || [];
  if (!rows.length) return `<tr><td colspan="15">${brEmpty('No recorded batch sales in this period.')}</td></tr>`;
  return rows.map(row => `<tr>
    <td><strong>${brEscape(brBatchName(row))}</strong><small>${brEscape(brFarmName(row))}</small></td>
    <td>${brNumber(row.quantitySold)}</td><td>${brNumber(row.saleEventCount)}</td><td>${brDate(row.firstSaleDate)} – ${brDate(row.lastSaleDate)}</td>
    <td>${brMoney(row.revenue)}</td><td>${brMoney(row.weightedAvgPricePerKg)}</td><td>${brMoney(row.revenuePerBird)}</td>
    <td>${brNumber(row.weightedAvgSaleWeightKg, 3)}${row.weightedAvgSaleWeightKg === null ? '' : ' kg'}</td>
    <td title="Estimated from recorded feed and weight observations">${row.operations?.estimatedFcr === null ? 'Not available' : brNumber(row.operations.estimatedFcr, 3)}</td>
    <td>${brPct(row.operations?.mortalityPercent)}</td><td>${brMoney(row.directExpenseTotal)}</td><td>${brMoney(row.directProfit)}</td>
    <td>${brPct(row.directProfitMarginPercent)}</td><td>${brEscape(brSaleState(row.saleState))}</td><td>${brEscape(row.batchStatus || 'Not available')}</td>
  </tr>`).join('');
}

function brCompleteness(data) {
  const c = data.completeness || {};
  return `<div class="br-completeness"><strong>Data completeness</strong><span>${brNumber(c.saleEventCount)} sale events across ${brNumber(c.batchesWithSales)} of ${brNumber(c.batchCountInScope)} batches in scope.</span><span>${brNumber(c.batchesWithFlockRecords)} batches have operational records; ${brNumber(c.batchesEligibleForEstimatedFcr)} have enough observations for estimated FCR.</span><span>${brNumber(c.batchesWithoutDirectExpenses)} batches are missing direct expenses. Shared farm expenses are excluded from each batch's direct profit.</span></div>`;
}

function brRender(data) {
  const s = data.stats || {}, high = s.highestRevenueBatch, low = s.lowestRevenueBatch;
  return `${brCompleteness(data)}
  <div class="br-stats">
    ${brStat('Recorded Revenue', brMoney(s.totalRevenue), `${brNumber(data.completeness?.saleEventCount)} sale events`)}
    ${brStat('Average / Selling Batch', brMoney(s.averageRevenuePerBatch))}
    ${brStat('Batches With Sales', brNumber(s.batchesWithSales), `${brNumber(data.completeness?.batchCountInScope)} batches in scope`)}
    ${brStat('Highest Revenue Batch', high ? brEscape(brBatchName(high)) : 'Not available', high ? brMoney(high.revenue) : '')}
    ${brStat('Lowest Revenue Batch', low ? brEscape(brBatchName(low)) : 'Not available', low ? brMoney(low.revenue) : '')}
    ${brStat('Vs Equal Prior Period', brPct(s.revenueChangePercent))}
  </div>
  <section class="br-card"><h3>Recorded Revenue Trend</h3>${brTrend(data)}</section>
  <div class="br-grid"><section class="br-card"><h3>Revenue Distribution by Batch</h3>${brDistribution(data)}</section><section class="br-card"><h3>Revenue by Farm</h3>${brFarms(data)}</section><section class="br-card"><h3>Computed Facts</h3>${brFacts(data)}</section></div>
  <section class="br-card"><h3>Batch Revenue Ledger</h3><p class="br-caption">Direct profit is recorded revenue minus batch-linked expenses. It excludes unallocated shared farm expenses and is not accounting net profit.</p><div class="br-table-wrap"><table><thead><tr><th>Batch / Farm</th><th>Birds Sold</th><th>Sale Events</th><th>Sale Date Range</th><th>Revenue</th><th>Avg Price / kg</th><th>Revenue / Bird</th><th>Avg Sale Weight</th><th>Est. FCR</th><th>Mortality</th><th>Direct Expenses</th><th>Direct Profit</th><th>Direct Margin</th><th>Sale State</th><th>Batch Status</th></tr></thead><tbody>${brRows(data)}</tbody></table></div></section>`;
}

function brStyles() {
  if (document.getElementById('br-styles')) return;
  const style = document.createElement('style'); style.id = 'br-styles';
  style.textContent = `.br-page{padding:20px;background:#f5f6fa;min-height:100%;color:#18212f}.br-toolbar{display:flex;justify-content:flex-end;margin-bottom:12px}.br-toolbar select{padding:8px 30px 8px 10px;border:1px solid #dce1e8;border-radius:7px;background:#fff}.br-stats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;margin-bottom:16px}.br-stat,.br-card,.br-completeness{background:#fff;border:1px solid #e5e9ef;border-radius:10px}.br-stat{padding:14px;display:flex;flex-direction:column;gap:5px}.br-stat span,.br-stat small,.br-caption,.br-bar-row small{color:#687386;font-size:11px}.br-stat strong{font-size:18px}.br-card{padding:16px;margin-bottom:16px}.br-card h3{font-size:14px;margin:0 0 14px}.br-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}.br-chart{width:100%;height:220px}.br-chart text{font-size:10px;fill:#718096}.br-bar-row{display:grid;grid-template-columns:130px 1fr 100px;align-items:center;gap:10px;margin:12px 0}.br-bar-row div:first-child,.br-bar-row span{display:flex;flex-direction:column}.br-bar-row span{text-align:right}.br-track{height:12px;background:#eef1f4;border-radius:8px;overflow:hidden}.br-track i{display:block;height:100%;border-radius:8px}.br-fact{display:flex;gap:9px;padding:9px 0;border-bottom:1px solid #f0f2f5;font-size:12px;line-height:1.45}.br-fact i{color:#16a34a;margin-top:2px}.br-completeness{padding:11px 14px;margin-bottom:14px;display:flex;gap:18px;align-items:center;font-size:11px;color:#596579}.br-completeness strong{color:#273244;white-space:nowrap}.br-table-wrap{overflow:auto}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:9px 10px;border-bottom:1px solid #edf0f3;white-space:nowrap;font-size:11px}th{background:#f8fafb;color:#667085;text-transform:uppercase;font-size:9px}td:first-child{color:#15803d}td small{display:block;color:#8a94a3;margin-top:2px}.br-empty,.br-loading,.br-error{padding:30px;text-align:center;color:#687386}.br-error{color:#b42318;background:#fff;border:1px solid #fecdca;border-radius:10px}.br-retry{margin-top:12px;padding:7px 12px;border:0;border-radius:6px;background:#15803d;color:#fff;cursor:pointer}@media(max-width:1200px){.br-stats{grid-template-columns:repeat(3,1fr)}.br-grid{grid-template-columns:1fr}.br-completeness{align-items:flex-start;flex-direction:column;gap:5px}}@media(max-width:700px){.br-stats{grid-template-columns:1fr 1fr}.br-page{padding:12px}}`;
  document.head.appendChild(style);
}

async function brLoad(days) {
  const root = document.getElementById('br-content');
  if (!root) return;
  root.innerHTML = '<div class="br-loading">Loading recorded sales and operational data…</div>';
  try { root.innerHTML = brRender(await brFetch(days)); }
  catch (error) { root.innerHTML = `<div class="br-error">${brEscape(error.message)}<br><button class="br-retry" id="br-retry">Retry</button></div>`; document.getElementById('br-retry')?.addEventListener('click', () => brLoad(days)); }
}

function viewBatchwiseRevenue() {
  brStyles();
  setTimeout(() => {
    const range = document.getElementById('br-range');
    range?.addEventListener('change', () => brLoad(Number(range.value)));
    brLoad(Number(range?.value || 30));
  }, 0);
  return `<div class="br-page"><div class="br-toolbar"><label>Reporting period&nbsp; <select id="br-range"><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 365 days</option></select></label></div><div id="br-content"><div class="br-loading">Loading recorded sales and operational data…</div></div></div>`;
}
