window.metaMyWorkToday = { title: 'My Work Today', subtitle: 'Your active farms and daily flock records' };

const fmwApi = async (path) => {
  const response = await fetch(`/api/v2${path}`, { headers: { Authorization: `Bearer ${localStorage.getItem('fs_token') || ''}` } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(body.error || body.message || body.msg || 'Request failed'); error.status = response.status; throw error; }
  return body;
};

function viewMyWorkToday(user) {
  setTimeout(() => fmwLoad(user), 0);
  return `<style>
    .fmw-grid{display:grid;gap:16px}.fmw-card{background:#fff;border:1px solid #e4e9e5;border-radius:14px;padding:18px}.fmw-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.fmw-muted{color:#637068}.fmw-batches{display:grid;gap:10px;margin-top:14px}.fmw-batch{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px;border-radius:10px;background:#f7faf7}.fmw-badge{padding:4px 9px;border-radius:999px;font-size:12px;background:#e8f5eb;color:#17632a}.fmw-btn{border:0;border-radius:8px;padding:9px 12px;background:#236b3b;color:#fff;cursor:pointer}.fmw-empty{text-align:center;padding:44px 18px;background:#fff;border:1px dashed #bdc8bf;border-radius:14px}
  </style><section id="fmw-root"><div class="fmw-empty">Loading today’s work…</div></section>`;
}

async function fmwLoad(user) {
  const root = document.getElementById('fmw-root');
  if (!root) return;
  try {
    const userId = user && (user.id || user._id || user.userId);
    if (!userId) throw new Error('Your signed-in user ID is unavailable. Please sign in again.');
    const assignmentBody = await fmwApi(`/users/${encodeURIComponent(userId)}/assignments`);
    const assignments = assignmentBody.assignments || assignmentBody.data || [];
    if (!assignments.length) {
      root.innerHTML = '<div class="fmw-empty"><h3>No farm assignment yet</h3><p class="fmw-muted">Ask your business administrator to assign you to a farm.</p></div>';
      return;
    }
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();
    const farms = await Promise.all(assignments.map(async (assignment) => {
      const farmId = assignment.farmId && (assignment.farmId._id || assignment.farmId);
      const [farmBody, batchBody] = await Promise.all([fmwApi(`/farms/${farmId}`), fmwApi(`/farms/${farmId}/batches?status=active&limit=100`)]);
      const batches = batchBody.data || batchBody.batches || [];
      const rows = await Promise.all(batches.map(async batch => {
        const records = await fmwApi(`/farms/${farmId}/batches/${batch._id}/records?fromDate=${encodeURIComponent(start)}&toDate=${encodeURIComponent(end)}&limit=100`);
        return { ...batch, recorded: (records.data || records.records || []).some(record => !record.correctsRecordId) };
      }));
      return { farm: farmBody.farm || farmBody.data || farmBody, batches: rows };
    }));
    root.innerHTML = `<div class="fmw-grid">${farms.map(({ farm, batches }) => `<article class="fmw-card"><div class="fmw-head"><div><h3>${fmwEsc(farm.name || 'Farm')}</h3><div class="fmw-muted">${fmwEsc((farm.location && (farm.location.address || farm.location.name)) || 'Location not provided')}</div></div><span class="fmw-badge">${fmwEsc(farm.status || 'active')}</span></div><div class="fmw-batches">${batches.length ? batches.map(batch => `<div class="fmw-batch"><div><strong>${fmwEsc(batch.name || batch.code || 'Batch')}</strong><div class="fmw-muted">${fmwEsc(batch.status || 'active')} · ${batch.currentBirdCountCached ?? batch.initialBirdCount ?? '—'} birds · ${batch.recorded ? 'Recorded today' : 'Record pending'}</div></div><button class="fmw-btn" data-farm="${farm._id}" data-batch="${batch._id}">${batch.recorded ? 'View / correct' : 'Enter daily record'}</button></div>`).join('') : '<div class="fmw-muted">No active batches on this farm.</div>'}</div></article>`).join('')}</div>`;
    const displayedBatches = farms.flatMap(({ batches }) => batches);
    root.querySelectorAll('.fmw-batch').forEach((row, index) => {
      const batch = displayedBatches[index];
      row.querySelector('div').insertAdjacentHTML('beforeend', `<div class="fmw-muted">Code: ${fmwEsc(batch.code || '-')} | Breed: ${fmwEsc(batch.breed || '-')} | Placed: ${batch.placedAt ? new Date(batch.placedAt).toLocaleDateString() : '-'}</div>`);
      row.querySelector('button').textContent = batch.recorded ? "View / correct today's record" : "Log Today's Record";
    });
    root.querySelectorAll('[data-batch]').forEach(button => button.addEventListener('click', () => fmwOpenRecord(button.dataset.farm, button.dataset.batch)));
  } catch (error) {
    root.innerHTML = `<div class="fmw-empty"><h3>${error.status === 403 ? 'Access denied' : 'Could not load your work'}</h3><p class="fmw-muted">${fmwEsc(error.message)}</p></div>`;
  }
}

function fmwOpenRecord(farmId, batchId) {
  history.replaceState({}, document.title, `${location.pathname}?farmId=${encodeURIComponent(farmId)}&batchId=${encodeURIComponent(batchId)}`);
  const link = document.querySelector('.db-sidebar-link[data-page="DailyRecordEntry"]');
  if (link) link.click();
}

function fmwEsc(value) { const div = document.createElement('div'); div.textContent = value == null ? '' : String(value); return div.innerHTML; }
