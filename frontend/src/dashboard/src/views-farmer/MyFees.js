window.metaMyFees = { title: 'My Fees', subtitle: 'Review your fee balance and recorded payment history' };

async function fmfApi(path) {
  const response = await fetch(`/api/v2${path}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('fs_token') || ''}` }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || body.message || body.msg || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return body;
}
function fmfEsc(value) { const div = document.createElement('div'); div.textContent = value == null ? '' : String(value); return div.innerHTML; }

function viewMyFees(user) {
  setTimeout(() => fmfLoad(user), 0);
  return `<style>
    .fmf-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:18px}.fmf-card,.fmf-table-wrap{background:#fff;border:1px solid #e4e9e5;border-radius:14px;padding:18px}.fmf-value{font-size:26px;font-weight:700;margin-top:6px}.fmf-muted{color:#637068}.fmf-table{width:100%;border-collapse:collapse}.fmf-table th,.fmf-table td{text-align:left;padding:12px;border-bottom:1px solid #edf0ed;white-space:nowrap}.fmf-badge{display:inline-block;padding:4px 9px;border-radius:999px;font-size:12px;background:#fff1cf;color:#775100}.fmf-badge.paid{background:#e8f5eb;color:#17632a}.fmf-badge.cancelled{background:#eceeef;color:#596168}.fmf-empty{text-align:center;padding:36px}.fmf-scroll{overflow:auto}
  </style><section id="fmf-root"><div class="fmf-empty">Loading fees…</div></section>`;
}

async function fmfLoad(user) {
  const root = document.getElementById('fmf-root');
  if (!root) return;
  try {
    const farmerId = user && (user.id || user._id || user.userId);
    if (!farmerId) throw new Error('Your signed-in user ID is unavailable. Please sign in again.');
    const [summaryBody, feesBody] = await Promise.all([
      fmfApi(`/farmer-fees/summary?farmerId=${encodeURIComponent(farmerId)}`),
      fmfApi(`/farmer-fees?farmerId=${encodeURIComponent(farmerId)}&limit=100`)
    ]);
    const summary = summaryBody.data || summaryBody.summary || summaryBody;
    const fees = feesBody.data || feesBody.fees || [];
    const currency = summary.currency || fees[0]?.currency || 'INR';
    const money = value => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(value || 0));
    root.innerHTML = `<div class="fmf-cards"><div class="fmf-card"><div class="fmf-muted">Pending</div><div class="fmf-value">${money(summary.totalPending ?? summary.pendingTotal ?? summary.pending)}</div></div><div class="fmf-card"><div class="fmf-muted">Paid</div><div class="fmf-value">${money(summary.totalPaid ?? summary.paidTotal ?? summary.paid)}</div></div></div><div class="fmf-table-wrap"><h3>Fee ledger</h3>${fees.length ? `<div class="fmf-scroll"><table class="fmf-table"><thead><tr><th>Description</th><th>Due</th><th>Amount</th><th>Status</th><th>Payment reference</th><th>Paid at</th></tr></thead><tbody>${fees.map(fee => `<tr><td>${fmfEsc(fee.description || 'Fee')}</td><td>${fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : '—'}</td><td>${money(fee.amount)}</td><td><span class="fmf-badge ${fmfEsc(fee.status)}">${fmfEsc(fee.status || 'pending')}</span></td><td>${fmfEsc(fee.paymentReference || '—')}</td><td>${fee.paidAt ? new Date(fee.paidAt).toLocaleString() : '—'}</td></tr>`).join('')}</tbody></table></div>` : '<div class="fmf-empty"><h3>No fees recorded</h3><p class="fmf-muted">Fees assigned by an administrator will appear here.</p></div>'}</div>`;
  } catch (error) {
    root.innerHTML = `<div class="fmf-empty"><h3>${error.status === 403 ? 'Access denied' : 'Could not load fees'}</h3><p class="fmf-muted">${fmfEsc(error.message)}</p></div>`;
  }
}
