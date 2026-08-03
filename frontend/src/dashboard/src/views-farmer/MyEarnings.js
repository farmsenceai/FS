window.metaMyEarnings = { title: 'My Earnings', subtitle: 'Submit compensation claims and track review decisions' };

let fmeState = { user: null, choices: [], claims: new Map() };
async function fmeApi(path, options = {}) {
  const response = await fetch(`/api/v2${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('fs_token') || ''}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || body.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.details = body.details;
    throw error;
  }
  return body;
}
function fmeEsc(value) { const div = document.createElement('div'); div.textContent = value == null ? '' : String(value); return div.innerHTML; }
function fmeDecimal(value) { return value && typeof value === 'object' && value.$numberDecimal ? value.$numberDecimal : value; }
function fmeMoney(value) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(fmeDecimal(value) || 0)); }
function fmeDate(value) { return value ? new Date(value).toLocaleDateString('en-IN') : '—'; }

function viewMyEarnings(user) {
  fmeState = { user, choices: [], claims: new Map() };
  setTimeout(() => fmeInit(user), 0);
  return `<style>
    .fme-page{padding:20px;background:#f5f6fa;min-height:100%;font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937}.fme-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.fme-card,.fme-stat{background:#fff;border:1px solid #e5e7eb;border-radius:12px}.fme-card{padding:16px;margin-bottom:14px}.fme-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:14px}.fme-stat{padding:16px}.fme-stat strong,.fme-stat span{display:block}.fme-stat strong{font-size:22px}.fme-stat span,.fme-muted{color:#6b7280}.fme-btn{border:1px solid #d1d5db;border-radius:8px;padding:9px 12px;background:#fff;cursor:pointer;font-weight:700}.fme-btn.primary{border-color:#166534;background:#166534;color:#fff}.fme-btn.danger{color:#b91c1c}.fme-btn:disabled{opacity:.5;cursor:not-allowed}.fme-table-wrap{overflow:auto}.fme-table{width:100%;border-collapse:collapse}.fme-table th,.fme-table td{text-align:left;padding:10px;border-bottom:1px solid #eef0f2;white-space:nowrap}.fme-table th{font-size:10px;color:#6b7280;background:#f9fafb}.fme-badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#fef3c7;color:#92400e}.fme-badge.approved,.fme-badge.paid{background:#dcfce7;color:#166534}.fme-badge.rejected{background:#fee2e2;color:#991b1b}.fme-empty{text-align:center;padding:38px}.fme-error{padding:11px;border-radius:8px;background:#fef2f2;color:#991b1b}.fme-note{padding:11px;border-radius:8px;background:#eff6ff;color:#1e3a8a;margin-bottom:14px}.fme-modal{display:none;position:fixed;inset:0;z-index:2600;background:rgba(15,23,42,.65);align-items:center;justify-content:center;padding:20px}.fme-modal.open{display:flex}.fme-dialog{box-sizing:border-box;width:min(600px,100%);background:#fff;border-radius:14px;padding:20px}.fme-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}.fme-field{display:flex;flex-direction:column;gap:5px}.fme-field.full{grid-column:1/-1}.fme-field input,.fme-field select,.fme-field textarea{box-sizing:border-box;width:100%;padding:9px;border:1px solid #d1d5db;border-radius:7px;font:inherit}.fme-field textarea{min-height:85px}.fme-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}@media(max-width:750px){.fme-toolbar{align-items:stretch;flex-direction:column}.fme-stats,.fme-grid{grid-template-columns:1fr}.fme-field.full{grid-column:auto}}
  </style><section class="fme-page" id="fme-root"><div class="fme-card fme-empty">Loading assigned farms, batches, and compensation claims…</div></section><div class="fme-modal" id="fme-modal"></div>`;
}

async function fmeInit(user = fmeState.user) {
  const root = document.getElementById('fme-root');
  if (!root) return;
  try {
    const userId = user && (user.id || user._id || user.userId);
    if (!userId) throw new Error('Your signed-in user ID is unavailable. Please sign in again.');
    const assignmentsBody = await fmeApi(`/users/${encodeURIComponent(userId)}/assignments`);
    const groups = await Promise.all((assignmentsBody.assignments || []).map(async assignment => {
      const farmId = assignment.farmId?._id || assignment.farmId;
      const [farmBody, batchesBody] = await Promise.all([
        fmeApi(`/farms/${farmId}`),
        fmeApi(`/farms/${farmId}/batches?limit=100`)
      ]);
      const farm = farmBody.farm || farmBody.data || farmBody;
      return (batchesBody.data || batchesBody.batches || []).map(batch => ({ farm, batch }));
    }));
    fmeState.choices = groups.flat();
    await fmeLoad();
  } catch (error) {
    root.innerHTML = `<div class="fme-card fme-empty"><h3>${error.status === 403 ? 'Access denied' : 'Could not load compensation claims'}</h3><p class="fme-muted">${fmeEsc(error.message)}</p></div>`;
  }
}

async function fmeLoad() {
  const [summary, result] = await Promise.all([
    fmeApi('/compensation-claims/mine/summary'),
    fmeApi('/compensation-claims/mine?limit=100')
  ]);
  const claims = result.data || [];
  fmeState.claims = new Map(claims.map(claim => [String(claim._id), claim]));
  const root = document.getElementById('fme-root');
  root.innerHTML = `<div class="fme-toolbar"><div><h3 style="margin:0">Compensation claims</h3><div class="fme-muted">Every claim is linked to a farm and batch from your active assignments.</div></div><button class="fme-btn primary" id="fme-add" ${fmeState.choices.length ? '' : 'disabled'}>Submit claim</button></div>${fmeState.choices.length ? '' : '<div class="fme-note">No assigned batches are available. An administrator must assign you to a farm and create its batch before you can submit a claim.</div>'}<div class="fme-stats"><div class="fme-stat"><strong>${fmeMoney(summary.pendingAmount)}</strong><span>Pending or approved</span></div><div class="fme-stat"><strong>${fmeMoney(summary.paidAmount)}</strong><span>Paid compensation</span></div><div class="fme-stat"><strong>${Number(summary.count || 0).toLocaleString()}</strong><span>Total claims</span></div></div><div id="fme-message"></div><section class="fme-card"><div class="fme-table-wrap"><table class="fme-table"><thead><tr><th>Claim</th><th>Farm / Batch</th><th>Service date</th><th>Description</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>${claims.length ? claims.map(fmeRow).join('') : '<tr><td colspan="7" class="fme-empty">No compensation claims submitted.</td></tr>'}</tbody></table></div></section>`;
  document.getElementById('fme-add')?.addEventListener('click', () => fmeOpen());
  root.querySelectorAll('[data-fme-edit]').forEach(button => button.addEventListener('click', () => fmeOpen(fmeState.claims.get(button.dataset.fmeEdit))));
  root.querySelectorAll('[data-fme-delete]').forEach(button => button.addEventListener('click', () => fmeDelete(button.dataset.fmeDelete)));
}

function fmeRow(claim) {
  const farm = claim.farmId && typeof claim.farmId === 'object' ? claim.farmId : {};
  const batch = claim.batchId && typeof claim.batchId === 'object' ? claim.batchId : {};
  return `<tr><td><strong>${fmeEsc(claim.claimNumber)}</strong></td><td>${fmeEsc(farm.name || 'Unavailable')}<div class="fme-muted">${fmeEsc(batch.code || 'Unavailable')}</div></td><td>${fmeDate(claim.serviceDate)}</td><td>${fmeEsc(claim.description)}</td><td><strong>${fmeMoney(claim.amount)}</strong></td><td><span class="fme-badge ${fmeEsc(claim.status)}">${fmeEsc(claim.status)}</span>${claim.reviewerNote ? `<div class="fme-muted">${fmeEsc(claim.reviewerNote)}</div>` : ''}</td><td>${claim.status === 'pending' ? `<button class="fme-btn" data-fme-edit="${claim._id}">Edit</button> <button class="fme-btn danger" data-fme-delete="${claim._id}">Delete</button>` : '<span class="fme-muted">Reviewer controlled</span>'}</td></tr>`;
}

function fmeOpen(claim = null) {
  const modal = document.getElementById('fme-modal');
  const selectedFarm = claim ? String(claim.farmId?._id || claim.farmId) : String(fmeState.choices[0]?.farm._id || '');
  const selectedBatch = claim ? String(claim.batchId?._id || claim.batchId) : '';
  const farms = [...new Map(fmeState.choices.map(choice => [String(choice.farm._id), choice.farm])).values()];
  modal.innerHTML = `<form class="fme-dialog" id="fme-form"><h3>${claim ? 'Edit pending claim' : 'Submit compensation claim'}</h3><div class="fme-note">Only pending claims can be changed. Approval, rejection, and payment are controlled by business or admin reviewers.</div><div class="fme-error" id="fme-form-error" style="display:none"></div><div class="fme-grid"><label class="fme-field"><span>Assigned farm</span><select id="fme-farm" required ${claim ? 'disabled' : ''}>${farms.map(farm => `<option value="${farm._id}" ${String(farm._id) === selectedFarm ? 'selected' : ''}>${fmeEsc(farm.name)} · ${fmeEsc(farm.code)}</option>`).join('')}</select></label><label class="fme-field"><span>Batch</span><select id="fme-batch" required ${claim ? 'disabled' : ''}></select></label><label class="fme-field"><span>Amount (INR)</span><input id="fme-amount" type="number" min="0.01" step="0.01" value="${fmeEsc(fmeDecimal(claim?.amount) || '')}" required></label><label class="fme-field"><span>Service date</span><input id="fme-date" type="date" max="${new Date().toISOString().slice(0, 10)}" value="${claim ? new Date(claim.serviceDate).toISOString().slice(0, 10) : ''}" required></label><label class="fme-field full"><span>Description</span><textarea id="fme-description" maxlength="1000" required>${fmeEsc(claim?.description || '')}</textarea></label></div><div class="fme-actions"><button class="fme-btn" type="button" id="fme-cancel">Cancel</button><button class="fme-btn primary" type="submit">Save claim</button></div></form>`;
  modal.classList.add('open');
  const farmSelect = document.getElementById('fme-farm');
  const renderBatches = () => {
    const choices = fmeState.choices.filter(choice => String(choice.farm._id) === farmSelect.value);
    document.getElementById('fme-batch').innerHTML = choices.map((choice, index) => `<option value="${choice.batch._id}" ${String(choice.batch._id) === selectedBatch || (!selectedBatch && index === 0) ? 'selected' : ''}>${fmeEsc(choice.batch.code)} · ${fmeEsc(choice.batch.breed || choice.batch.birdType)}</option>`).join('');
  };
  farmSelect.addEventListener('change', renderBatches);
  renderBatches();
  document.getElementById('fme-cancel').addEventListener('click', fmeClose);
  document.getElementById('fme-form').addEventListener('submit', event => fmeSave(event, claim));
}
function fmeClose() { const modal = document.getElementById('fme-modal'); modal.classList.remove('open'); modal.innerHTML = ''; }

async function fmeSave(event, claim) {
  event.preventDefault();
  const farmId = document.getElementById('fme-farm').value;
  const batchId = document.getElementById('fme-batch').value;
  const button = event.currentTarget.querySelector('[type="submit"]');
  const errorBox = document.getElementById('fme-form-error');
  button.disabled = true;
  try {
    const payload = {
      amount: document.getElementById('fme-amount').value,
      serviceDate: document.getElementById('fme-date').value,
      description: document.getElementById('fme-description').value.trim()
    };
    const base = `/farms/${farmId}/batches/${batchId}/compensation-claims`;
    await fmeApi(claim ? `${base}/${claim._id}` : base, { method: claim ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
    fmeClose();
    await fmeLoad();
  } catch (error) {
    errorBox.innerHTML = `${fmeEsc(error.message)}${Array.isArray(error.details) ? `<br>${error.details.map(fmeEsc).join('<br>')}` : ''}`;
    errorBox.style.display = 'block';
    button.disabled = false;
  }
}

async function fmeDelete(id) {
  const claim = fmeState.claims.get(String(id));
  if (!claim || !confirm('Delete this pending compensation claim?')) return;
  const farmId = claim.farmId?._id || claim.farmId;
  const batchId = claim.batchId?._id || claim.batchId;
  try {
    await fmeApi(`/farms/${farmId}/batches/${batchId}/compensation-claims/${id}`, { method: 'DELETE' });
    await fmeLoad();
  } catch (error) {
    document.getElementById('fme-message').innerHTML = `<div class="fme-error">${fmeEsc(error.message)}</div>`;
  }
}
