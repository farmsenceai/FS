/* views/Payments.js */

window.metaPayments = {
  title: 'Payments',
  subtitle: 'Track and review farmer fees across all farms.'
};

const payState = { fees: [], claims: [], range: 12 };

function payEscape(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function payMoney(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function payDate(value, fallback = 'Not set') {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : fallback;
}

function payPerson(fee) { return fee.farmerId && typeof fee.farmerId === 'object' ? fee.farmerId.name : 'Unknown farmer'; }
function payFarm(fee) { return fee.farmId && typeof fee.farmId === 'object' ? fee.farmId.name : 'Unknown farm'; }
function payIsOverdue(fee, now = new Date()) { return fee.status === 'pending' && fee.dueDate && new Date(fee.dueDate) < now; }
function payStatus(fee) { return payIsOverdue(fee) ? 'Overdue' : `${fee.status || 'pending'}`.replace(/^./, (c) => c.toUpperCase()); }
function payStatusClass(fee) { return payIsOverdue(fee) || fee.status === 'cancelled' ? 'pm-status-overdue' : fee.status === 'paid' ? 'pm-status-paid' : 'pm-status-pending'; }

async function payFetchFees() {
  const response = await fetch('/api/v2/farmer-fees?limit=1000', { headers: { Authorization: `Bearer ${localStorage.getItem('fs_token')}` } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Unable to load payment data.');
  return Array.isArray(payload.data) ? payload.data : [];
}

async function payFetchClaims() {
  const response = await fetch('/api/v2/compensation-claims?limit=1000', { headers: { Authorization: `Bearer ${localStorage.getItem('fs_token')}` } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Unable to load compensation claims.');
  return Array.isArray(payload.data) ? payload.data : [];
}

function payStatCard(icon, bg, label, value, sub) {
  return `<div class="pm-stat-card"><div class="pm-stat-icon" style="background:${bg}">${icon}</div><div class="pm-stat-right"><div class="pm-stat-value">${value}</div><div class="pm-stat-label">${label}</div><div class="pm-stat-sub">${sub}</div></div></div>`;
}

function payEmpty(message) { return `<div class="pm-empty"><div class="pm-empty-icon"><i class="fa-solid fa-circle-info"></i></div><div>${payEscape(message)}</div></div>`; }

function payClaimRows(claims) {
  if (!claims.length) return '<tr><td colspan="7" class="pm-page-info">No compensation claims found.</td></tr>';
  return claims.map((claim) => `<tr>
    <td><strong>${payEscape(claim.claimNumber)}</strong><div class="pm-proj-batch">${payDate(claim.serviceDate)}</div></td>
    <td><div class="pm-proj-name">${payEscape(claim.farmerId?.name || 'Unknown farmer')}</div><div class="pm-proj-batch">${payEscape(claim.farmId?.name || 'Unknown farm')} · ${payEscape(claim.batchId?.code || 'Unknown batch')}</div></td>
    <td>${payEscape(claim.description)}</td><td>${payMoney(claim.amount?.$numberDecimal || claim.amount)}</td>
    <td><span class="pm-status-badge ${claim.status === 'paid' || claim.status === 'approved' ? 'pm-status-paid' : claim.status === 'rejected' ? 'pm-status-overdue' : 'pm-status-pending'}">${payEscape(claim.status)}</span></td>
    <td>${payEscape(claim.reviewerNote || '—')}</td>
    <td>${claim.status === 'pending' ? `<button data-pay-review="${claim._id}" data-status="approved">Approve</button> <button data-pay-review="${claim._id}" data-status="rejected">Reject</button>` : claim.status === 'approved' ? `<button data-pay-review="${claim._id}" data-status="paid">Mark paid</button>` : 'Complete'}</td>
  </tr>`).join('');
}

function payUpcomingRow(fee) {
  const date = new Date(fee.dueDate);
  return `<div class="pm-upcoming-row"><div class="pm-upcoming-date"><div class="pm-upcoming-day">${date.getDate()}</div><div class="pm-upcoming-month">${date.toLocaleDateString('en-IN', { month: 'short' })}</div></div><div class="pm-upcoming-body"><div class="pm-upcoming-vendor">${payEscape(payPerson(fee))}</div><div class="pm-upcoming-farm">${payEscape(payFarm(fee))} · ${payEscape(fee.description || 'Farmer fee')}</div></div><div class="pm-upcoming-right"><div class="pm-upcoming-amount">${payMoney(fee.amount)}</div><span class="pm-status-badge pm-status-pending">Pending</span></div></div>`;
}

function payRecentRow(fee) {
  return `<div class="pm-recent-row"><div class="pm-recent-icon-wrap"><i class="fa-solid fa-check"></i></div><div class="pm-recent-body"><div class="pm-recent-name">${payEscape(payPerson(fee))}</div><div class="pm-recent-farm">${payEscape(payFarm(fee))} · ${payEscape(fee.description || 'Farmer fee')}</div></div><div class="pm-recent-right"><div class="pm-recent-date">${payDate(fee.paidAt)}</div><div class="pm-recent-amount">${payMoney(fee.amount)}</div><span class="pm-status-badge pm-status-paid">Paid</span></div></div>`;
}

function payDonutSegment(percent, color, offset) {
  const circumference = 2 * Math.PI * 50;
  return `<circle cx="65" cy="65" r="50" fill="none" stroke="${color}" stroke-width="18" stroke-dasharray="${circumference * percent} ${circumference}" stroke-dashoffset="${circumference * (0.25 - offset)}" transform="rotate(-90 65 65)"/>`;
}

function paySummary(fees) {
  const now = new Date();
  const paid = fees.filter((f) => f.status === 'paid').reduce((sum, f) => sum + Number(f.amount || 0), 0);
  const overdue = fees.filter((f) => payIsOverdue(f, now)).reduce((sum, f) => sum + Number(f.amount || 0), 0);
  const pendingNotOverdue = fees.filter((f) => f.status === 'pending' && !payIsOverdue(f, now)).reduce((sum, f) => sum + Number(f.amount || 0), 0);
  const total = paid + pendingNotOverdue + overdue;
  const pct = (value) => total ? value / total : 0;
  return `<div class="pm-summary-body"><div class="pm-summary-info">
    <div class="pm-summary-row"><div class="pm-summary-label">Total Fee Value</div><div class="pm-summary-val">${payMoney(total)}</div></div>
    <div class="pm-summary-row"><div class="pm-summary-label">Total Paid</div><div class="pm-summary-val green">${payMoney(paid)} <span class="pm-summary-pct">(${Math.round(pct(paid) * 100)}%)</span></div></div>
    <div class="pm-summary-row"><div class="pm-summary-label">Pending (not overdue)</div><div class="pm-summary-val amber">${payMoney(pendingNotOverdue)} <span class="pm-summary-pct">(${Math.round(pct(pendingNotOverdue) * 100)}%)</span></div></div>
    <div class="pm-summary-row"><div class="pm-summary-label">Overdue</div><div class="pm-summary-val red">${payMoney(overdue)} <span class="pm-summary-pct">(${Math.round(pct(overdue) * 100)}%)</span></div></div>
    <div class="pm-legend"><div class="pm-legend-item"><span class="pm-legend-dot" style="background:#16a34a"></span>Paid</div><div class="pm-legend-item"><span class="pm-legend-dot" style="background:#f97316"></span>Pending</div><div class="pm-legend-item"><span class="pm-legend-dot" style="background:#ef4444"></span>Overdue</div></div>
  </div><div class="pm-donut-wrap"><svg viewBox="0 0 130 130" width="130" height="130"><circle cx="65" cy="65" r="50" fill="none" stroke="#f3f4f6" stroke-width="18"/>${payDonutSegment(pct(paid), '#16a34a', 0)}${payDonutSegment(pct(pendingNotOverdue), '#f97316', pct(paid))}${payDonutSegment(pct(overdue), '#ef4444', pct(paid) + pct(pendingNotOverdue))}</svg><div class="pm-donut-label"><div class="pm-donut-center-val">${payMoney(total)}</div><div class="pm-donut-center-sub">Fee value</div></div></div></div>`;
}

function payTrend(fees, monthsBack) {
  const now = new Date();
  const months = Array.from({ length: monthsBack }, (_, index) => new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - index), 1));
  const rows = months.map((month) => ({ month, paid: 0, pending: 0, count: 0 }));
  const key = (date) => `${date.getFullYear()}-${date.getMonth()}`;
  const byMonth = new Map(rows.map((row) => [key(row.month), row]));
  fees.forEach((fee) => {
    // Paid is recognized at paidAt; pending is scheduled at dueDate, falling back to createdAt.
    const rawDate = fee.status === 'paid' ? fee.paidAt : fee.status === 'pending' ? (fee.dueDate || fee.createdAt) : null;
    const date = rawDate ? new Date(rawDate) : null;
    const row = date && byMonth.get(key(date));
    if (!row) return;
    row[fee.status] += Number(fee.amount || 0); row.count += 1;
  });
  const max = Math.max(1, ...rows.flatMap((r) => [r.paid, r.pending]));
  const point = (value, index) => `${20 + index * (360 / Math.max(1, rows.length - 1))},${90 - (value / max) * 75}`;
  const paidPoints = rows.map((r, i) => point(r.paid, i)).join(' ');
  const pendingPoints = rows.map((r, i) => point(r.pending, i)).join(' ');
  const labels = rows.map((r, i) => `<text x="${20 + i * (360 / Math.max(1, rows.length - 1))}" y="114" text-anchor="middle" font-size="7" fill="#9ca3af">${r.month.toLocaleDateString('en-IN', { month: 'short' })}</text>`).join('');
  const paidValues = rows.filter((r) => r.paid > 0);
  const highest = paidValues.length ? paidValues.reduce((a, b) => a.paid > b.paid ? a : b) : null;
  const average = paidValues.length ? paidValues.reduce((sum, r) => sum + r.paid, 0) / paidValues.length : 0;
  return `<div class="pm-trend-body"><div class="pm-trend-legend"><div class="pm-trend-legend-item"><span class="pm-trend-legend-line" style="background:#16a34a"></span>Paid by paid date</div><div class="pm-trend-legend-item"><span class="pm-trend-legend-line" style="background:#f97316"></span>Pending by due date</div></div><svg viewBox="0 0 400 120" style="width:100%;height:120px"><line x1="20" y1="90" x2="380" y2="90" stroke="#e5e7eb"/><polyline points="${paidPoints}" fill="none" stroke="#16a34a" stroke-width="2"/><polyline points="${pendingPoints}" fill="none" stroke="#f97316" stroke-width="2" stroke-dasharray="5,3"/>${labels}</svg><div class="pm-trend-footer"><div><div class="pm-trend-footer-label">Highest paid month</div><div class="pm-trend-footer-val">${payMoney(highest ? highest.paid : 0)}</div><div class="pm-proj-batch">${highest ? highest.month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'No paid fees'}</div></div><div><div class="pm-trend-footer-label">Average paid month</div><div class="pm-trend-footer-val">${payMoney(average)}</div><div class="pm-proj-batch">Months with payments</div></div><div><div class="pm-trend-footer-label">Transactions in range</div><div class="pm-trend-footer-val">${rows.reduce((sum, r) => sum + r.count, 0)}</div><div class="pm-proj-batch">Paid and pending</div></div></div></div>`;
}

function payRender() {
  const fees = payState.fees;
  const now = new Date();
  const paid = fees.filter((f) => f.status === 'paid');
  const pending = fees.filter((f) => f.status === 'pending');
  const paidTotal = paid.reduce((sum, f) => sum + Number(f.amount || 0), 0);
  const paidYear = paid.filter((f) => f.paidAt && new Date(f.paidAt).getFullYear() === now.getFullYear()).reduce((sum, f) => sum + Number(f.amount || 0), 0);
  const pendingTotal = pending.reduce((sum, f) => sum + Number(f.amount || 0), 0);
  const overdueTotal = pending.filter((f) => payIsOverdue(f, now)).reduce((sum, f) => sum + Number(f.amount || 0), 0);
  document.getElementById('pm-stats').innerHTML = payStatCard('<i class="fa-solid fa-indian-rupee-sign"></i>', '#dcfce7', 'Total Payments Made', payMoney(paidTotal), 'All paid farmer fees') + payStatCard('<i class="fa-solid fa-check"></i>', '#dbeafe', 'Paid This Year', payMoney(paidYear), String(now.getFullYear())) + payStatCard('<i class="fa-regular fa-clock"></i>', '#fef9c3', 'Pending Payments', payMoney(pendingTotal), `${pending.length} pending fees`) + payStatCard('<i class="fa-solid fa-triangle-exclamation"></i>', '#f3e8ff', 'Overdue Payments', payMoney(overdueTotal), 'Pending fees past due') + payStatCard('<i class="fa-solid fa-receipt"></i>', '#fff7ed', 'Total Transactions', fees.length, 'Includes cancelled fees');
  document.getElementById('pm-farmer-claims').innerHTML = payClaimRows(payState.claims);
  document.querySelectorAll('[data-pay-review]').forEach(button => button.addEventListener('click', () => payReviewClaim(button.dataset.payReview, button.dataset.status)));
  document.getElementById('pm-summary').innerHTML = paySummary(fees);
  document.getElementById('pm-trend').innerHTML = payTrend(fees, payState.range);
  const upcoming = pending.filter((f) => f.dueDate && new Date(f.dueDate) >= now).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5);
  document.getElementById('pm-upcoming').innerHTML = upcoming.length ? upcoming.map(payUpcomingRow).join('') : payEmpty('No upcoming pending payments.');
  const recent = paid.filter((f) => f.paidAt).sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt)).slice(0, 5);
  document.getElementById('pm-recent').innerHTML = recent.length ? recent.map(payRecentRow).join('') : payEmpty('No paid farmer fees yet.');
}

async function payInit() {
  try { [payState.fees, payState.claims] = await Promise.all([payFetchFees(), payFetchClaims()]); payRender(); }
  catch (error) { document.querySelectorAll('[data-pm-loading]').forEach((el) => { el.innerHTML = payEmpty(error.message); }); }
  document.getElementById('pm-range')?.addEventListener('change', (event) => { payState.range = Number(event.target.value); document.getElementById('pm-trend').innerHTML = payTrend(payState.fees, payState.range); });
}

async function payReviewClaim(id, status) {
  const reviewerNote = status === 'rejected' ? prompt('Reason for rejection (required):') : (prompt('Reviewer note (optional):', '') || '');
  if (status === 'rejected' && !reviewerNote) return;
  const paymentReference = status === 'paid' ? prompt('Payment reference (required):') : '';
  if (status === 'paid' && !paymentReference) return;
  try {
    const response = await fetch(`/api/v2/compensation-claims/${id}/review`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${localStorage.getItem('fs_token')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewerNote, paymentReference })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Unable to review claim.');
    payState.claims = await payFetchClaims();
    payRender();
  } catch (error) {
    alert(error.message);
  }
}

function injectPaymentsStyles() {
  if (document.getElementById('payments-styles')) return;
  const style = document.createElement('style'); style.id = 'payments-styles'; style.textContent = `
    .pm-scrollable{padding:20px;background:#f5f6fa;min-height:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#1a1a2e}.pm-stat-row{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:18px}.pm-stat-card,.pm-card{background:#fff;border-radius:10px;border:1px solid #e8eaf0}.pm-stat-card{padding:14px 16px;display:flex;gap:12px}.pm-stat-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}.pm-stat-value{font-size:18px;font-weight:800}.pm-stat-label{font-size:11px;font-weight:600;color:#374151}.pm-stat-sub,.pm-proj-batch{font-size:10px;color:#9ca3af}.pm-card{overflow:hidden;margin-bottom:16px}.pm-card-header{display:flex;align-items:center;justify-content:space-between;padding:13px 16px 10px;border-bottom:1px solid #f3f4f6}.pm-card-title{font-size:13px;font-weight:700}.pm-card-link{font-size:11px;color:#16a34a;font-weight:600}.pm-two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}.pm-two-col>.pm-card{margin-bottom:0}.pm-table{width:100%;border-collapse:collapse}.pm-table th{font-size:10px;color:#9ca3af;text-transform:uppercase;padding:8px 14px;text-align:left;background:#f9fafb}.pm-table td{padding:10px 14px;font-size:12px;border-bottom:1px solid #f3f4f6}.pm-proj-name{font-weight:600}.pm-status-badge{display:inline-flex;padding:3px 10px;border-radius:5px;font-size:10px;font-weight:700}.pm-status-paid{background:#d1fae5;color:#059669}.pm-status-pending{background:#fef3c7;color:#d97706}.pm-status-overdue{background:#fee2e2;color:#dc2626}.pm-page-info{padding:20px!important;text-align:center;color:#9ca3af}.pm-summary-body{padding:16px;display:flex;align-items:center;gap:20px}.pm-summary-info{flex:1}.pm-summary-row{margin-bottom:8px}.pm-summary-label{font-size:11px;color:#6b7280}.pm-summary-val{font-size:15px;font-weight:800}.pm-summary-pct{font-size:11px;color:#9ca3af}.green{color:#059669}.amber{color:#d97706}.red{color:#dc2626}.pm-donut-wrap{position:relative}.pm-donut-label{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}.pm-donut-center-val{font-size:11px;font-weight:800}.pm-donut-center-sub{font-size:9px;color:#6b7280}.pm-legend{display:flex;gap:10px;margin-top:12px}.pm-legend-item{display:flex;align-items:center;gap:5px;font-size:10px}.pm-legend-dot{width:8px;height:8px;border-radius:50%}.pm-recent-row,.pm-upcoming-row{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid #f9fafb}.pm-recent-icon-wrap{width:30px;height:30px;background:#f0fdf4;color:#16a34a;border-radius:8px;display:flex;align-items:center;justify-content:center}.pm-recent-body,.pm-upcoming-body{flex:1;min-width:0}.pm-recent-name,.pm-upcoming-vendor{font-size:12px;font-weight:600}.pm-recent-farm,.pm-upcoming-farm,.pm-recent-date{font-size:10px;color:#9ca3af}.pm-recent-right,.pm-upcoming-right{text-align:right}.pm-recent-amount,.pm-upcoming-amount{font-size:13px;font-weight:700}.pm-upcoming-date{width:38px;text-align:center}.pm-upcoming-day{font-size:18px;font-weight:800}.pm-upcoming-month{font-size:10px;color:#9ca3af;text-transform:uppercase}.pm-trend-body{padding:14px 16px}.pm-trend-legend{display:flex;gap:16px;margin-bottom:10px}.pm-trend-legend-item{display:flex;align-items:center;gap:5px;font-size:11px;color:#6b7280}.pm-trend-legend-line{width:18px;height:3px}.pm-trend-footer{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px;padding-top:12px;border-top:1px solid #f3f4f6;text-align:center}.pm-trend-footer-label{font-size:10px;color:#6b7280}.pm-trend-footer-val{font-size:15px;font-weight:800}.pm-trend-select{padding:5px 8px;border:1px solid #e5e7eb;border-radius:6px;background:#fff}.pm-empty{min-height:140px;padding:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#6b7280;gap:8px}.pm-empty-icon{font-size:24px;color:#9ca3af}.pm-methods-body{padding:16px}.pm-methods-placeholder{border:1px dashed #d1d5db;border-radius:8px;background:#f9fafb}.pm-loading{color:#9ca3af;text-align:center;padding:24px}@media(max-width:1100px){.pm-stat-row{grid-template-columns:repeat(2,1fr)}.pm-main{grid-template-columns:1fr!important}}@media(max-width:700px){.pm-stat-row,.pm-two-col{grid-template-columns:1fr}.pm-scrollable{padding:12px}}
  `; document.head.appendChild(style);
}

function viewPayments() {
  injectPaymentsStyles(); setTimeout(payInit, 0);
  return `<div class="pm-scrollable">
    <div class="pm-card"><div class="pm-card-header"><span class="pm-card-title">Farmer Compensation Claims</span><span class="pm-card-link">Canonical review queue</span></div><div style="overflow:auto"><table class="pm-table"><thead><tr><th>Claim / Date</th><th>Farmer / Farm / Batch</th><th>Description</th><th>Amount</th><th>Status</th><th>Reviewer note</th><th>Actions</th></tr></thead><tbody id="pm-farmer-claims" data-pm-loading><tr><td colspan="7" class="pm-page-info">Loading compensation claims…</td></tr></tbody></table></div></div>
    <div class="pm-stat-row" id="pm-stats" data-pm-loading>${payStatCard('…','#f3f4f6','Loading','—','Fetching farmer fees')}</div>
    <div class="pm-main" style="display:grid;grid-template-columns:1fr 380px;gap:16px;margin-bottom:16px"><div>
      <div class="pm-card"><div class="pm-card-header"><span class="pm-card-title">Payment Transactions</span></div>${payEmpty('Vendor and contractor payment tracking is not yet part of the system')}</div>
      <div class="pm-two-col"><div class="pm-card"><div class="pm-card-header"><span class="pm-card-title">Payment Trend</span><select id="pm-range" class="pm-trend-select"><option value="12">Last 12 Months</option><option value="6">Last 6 Months</option></select></div><div id="pm-trend" data-pm-loading class="pm-loading">Loading trend…</div></div><div class="pm-card"><div class="pm-card-header"><span class="pm-card-title">Upcoming Payments</span></div><div id="pm-upcoming" data-pm-loading class="pm-loading">Loading upcoming payments…</div></div></div>
    </div><div><div class="pm-card"><div class="pm-card-header"><span class="pm-card-title">Payment Summary</span></div><div id="pm-summary" data-pm-loading class="pm-loading">Loading summary…</div></div><div class="pm-card"><div class="pm-card-header"><span class="pm-card-title">Recent Payments</span></div><div id="pm-recent" data-pm-loading class="pm-loading">Loading recent payments…</div></div><div class="pm-card"><div class="pm-card-header"><span class="pm-card-title">Payment Methods</span></div><div class="pm-methods-body"><div class="pm-methods-placeholder">${payEmpty('Payment method breakdown is not yet tracked')}</div></div></div></div></div>
  </div>`;
}
