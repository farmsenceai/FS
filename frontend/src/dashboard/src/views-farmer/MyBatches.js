window.metaMyBatches = { title: 'My Batches', subtitle: 'View batches at your assigned farms' };

let fmbState = null;
async function fmbApi(path) {
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
function fmbEsc(value) { const div = document.createElement('div'); div.textContent = value == null ? '' : String(value); return div.innerHTML; }
function fmbDate(value) { return value ? new Date(value).toLocaleDateString() : '—'; }

function viewMyBatches(user) {
  setTimeout(() => fmbInit(user), 0);
  return `<style>
    .fmb-page{padding:20px;background:#f5f6fa;min-height:100%;font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937}.fmb-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:15px}.fmb-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:14px}.fmb-table-wrap{overflow:auto}.fmb-table{width:100%;border-collapse:collapse}.fmb-table th,.fmb-table td{text-align:left;padding:10px;border-bottom:1px solid #eef0f2;white-space:nowrap}.fmb-table th{font-size:10px;color:#6b7280;background:#f9fafb}.fmb-muted{color:#6b7280}.fmb-empty{text-align:center;padding:38px}.fmb-badge{display:inline-block;padding:3px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:10px}.fmb-badge.active{background:#dcfce7;color:#166534}
  </style><section class="fmb-page" id="fmb-root"><div class="fmb-card fmb-empty">Loading assigned farm batches…</div></section>`;
}

async function fmbInit(user) {
  const root = document.getElementById('fmb-root');
  if (!root) return;
  const userId = user && (user.id || user._id || user.userId);
  try {
    const assignmentBody = await fmbApi(`/users/${encodeURIComponent(userId)}/assignments`);
    const assignments = assignmentBody.assignments || [];
    const farms = await Promise.all(assignments.map(async assignment => {
      const farmId = assignment.farmId?._id || assignment.farmId;
      const [farmBody, facilityBody, batchBody] = await Promise.all([
        fmbApi(`/farms/${farmId}`),
        fmbApi(`/farms/${farmId}/facilities?limit=100`),
        fmbApi(`/farms/${farmId}/batches?limit=100`)
      ]);
      return { farm: farmBody.farm, facilities: facilityBody.data || [], batches: batchBody.data || [] };
    }));
    fmbState = { farms };
    fmbRender();
  } catch (error) {
    root.innerHTML = `<div class="fmb-card fmb-empty"><h3>${error.status === 403 ? 'Access denied' : 'Could not load batches'}</h3><p class="fmb-muted">${fmbEsc(error.message)}</p></div>`;
  }
}

function fmbRender() {
  const root = document.getElementById('fmb-root');
  if (!fmbState.farms.length) {
    root.innerHTML = '<div class="fmb-card fmb-empty"><h3>No active farm assignment</h3><p class="fmb-muted">Your administrator must assign you to a farm before its batches can appear here.</p></div>';
    return;
  }
  root.innerHTML = `<div class="fmb-head"><div><h3 style="margin:0">Assigned bird batches</h3><div class="fmb-muted">Use these batches when entering daily operational records.</div></div></div>${fmbState.farms.map(({ farm, facilities, batches }) => `<article class="fmb-card"><div class="fmb-head"><div><strong>${fmbEsc(farm.name)}</strong><div class="fmb-muted">${fmbEsc(farm.code)} · ${fmbEsc(farm.location?.address || 'Address unavailable')}</div></div><span class="fmb-badge">${batches.length} batches</span></div><div class="fmb-table-wrap"><table class="fmb-table"><thead><tr><th>Code</th><th>Breed</th><th>Bird type</th><th>Facility</th><th>Initial birds</th><th>Current birds</th><th>Placed</th><th>Status</th></tr></thead><tbody>${batches.length ? batches.map(batch => `<tr><td><strong>${fmbEsc(batch.code)}</strong></td><td>${fmbEsc(batch.breed)}</td><td>${fmbEsc(batch.birdType)}</td><td>${fmbEsc(facilities.find(item => String(item._id) === String(batch.facilityId?._id || batch.facilityId))?.name || '—')}</td><td>${Number(batch.initialBirdCount || 0).toLocaleString()}</td><td>${Number(batch.currentBirdCountCached ?? batch.initialBirdCount ?? 0).toLocaleString()}</td><td>${fmbDate(batch.placedAt)}</td><td><span class="fmb-badge ${fmbEsc(batch.status)}">${fmbEsc(batch.status)}</span></td></tr>`).join('') : '<tr><td colspan="8" class="fmb-empty">No batches have been assigned at this farm.</td></tr>'}</tbody></table></div></article>`).join('')}`;
}
