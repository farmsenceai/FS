/* views-admin/ManageFarmers.js */

window.metaManageFarmers = {
  title: 'Manage Farmers',
  subtitle: 'View, approve, and manage farmer accounts on the platform.'
};

function amfStatCard(iconBg, iconSvg, label, value, sub) {
  return `
    <div class="amf-stat-card">
      <div class="amf-stat-icon" style="background:${iconBg}">${iconSvg}</div>
      <div class="amf-stat-body">
        <div class="amf-stat-value">${value}</div>
        <div class="amf-stat-label">${label}</div>
        <div class="amf-stat-sub">${sub}</div>
      </div>
    </div>`;
}

function amfFarmerRow(initials, name, requestedFarm, assignmentText, location, batches, status, id, assignments) {
  const statusClass = status === 'Active' ? 'amf-status--ok' : status === 'Pending' ? 'amf-status--pending' : 'amf-status--suspended';
  return `
    <tr>
      <td>
        <div class="amf-farmer-cell">
          <div class="amf-avatar">${initials}</div>
          <div>
            <div class="amf-farmer-name">${name}</div>
            <div class="amf-farmer-farm"><strong>Farmer's stated farm (unverified):</strong> ${requestedFarm || 'Not provided'}</div>
            <div class="amf-farmer-farm"><strong>Real assignment:</strong> ${assignmentText}</div>
          </div>
        </div>
      </td>
      <td>${location}</td>
      <td>${batches}</td>
      <td><span class="amf-status-badge ${statusClass}">${status}</span></td>
      <td>
        <div class="amf-actions">
          <button class="amf-action-btn" data-amf-view="${id}">View</button>
          <button class="amf-action-btn" data-amf-edit="${id}">Edit Profile</button>
          <button class="amf-action-btn" data-amf-assign="${id}">Assign to Farm</button>
          ${(assignments || []).map(assignment => `<button class="amf-end-btn" data-amf-end="${assignment._id}" data-amf-farm="${assignment.farmId?._id || assignment.farmId}" title="End assignment">End ${FarmSenseAdminApi.escapeHTML(assignment.farmName || 'Assignment')}</button>`).join('')}
          <button class="amf-more-btn" data-amf-status="${id}" data-name="${FarmSenseAdminApi.escapeHTML(name)}" data-status="${String(status).toLowerCase()}">&#8942;</button>
        </div>
      </td>
    </tr>`;
}

function injectManageFarmersStyles() {
  if (document.getElementById('amf-styles')) return;
  const style = document.createElement('style');
  style.id = 'amf-styles';
  style.textContent = `
    .amf-scrollable { padding: 20px; background: #f5f6fa; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #1a1a2e; }
    .amf-stat-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
    .amf-stat-card { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; padding: 14px 16px; display: flex; align-items: center; gap: 12px; }
    .amf-stat-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .amf-stat-value { font-size: 19px; font-weight: 800; color: #111827; line-height: 1.1; }
    .amf-stat-label { font-size: 11px; color: #6b7280; margin-top: 1px; }
    .amf-stat-sub { font-size: 10px; color: #9ca3af; margin-top: 1px; }

    .amf-card { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; overflow: hidden; }
    .amf-card-header { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px 10px; border-bottom: 1px solid #f3f4f6; }
    .amf-card-title { font-size: 13px; font-weight: 700; }
    .amf-search-input { border: 1px solid #e5e7eb; border-radius: 7px; padding: 7px 12px; font-size: 12px; color: #374151; outline: none; background: #f9fafb; width: 220px; }
    .amf-search-input:focus { border-color: #16a34a; background: #fff; }

    .amf-table { width: 100%; border-collapse: collapse; }
    .amf-table th { font-size: 11px; font-weight: 700; color: #6b7280; padding: 10px 14px; text-align: left; background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
    .amf-table td { padding: 11px 14px; border-bottom: 1px solid #f9fafb; font-size: 12.5px; color: #374151; vertical-align: middle; }
    .amf-table tr:last-child td { border-bottom: none; }
    .amf-farmer-cell { display: flex; align-items: center; gap: 9px; }
    .amf-avatar { width: 32px; height: 32px; border-radius: 50%; background: #d1fae5; color: #16a34a; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .amf-farmer-name { font-size: 12.5px; font-weight: 700; color: #111827; }
    .amf-farmer-farm { font-size: 10.5px; color: #9ca3af; }
    .amf-status-badge { padding: 3px 9px; border-radius: 5px; font-size: 10px; font-weight: 700; white-space: nowrap; }
    .amf-status--ok { background: #d1fae5; color: #16a34a; }
    .amf-status--pending { background: #fef3c7; color: #d97706; }
    .amf-status--suspended { background: #fee2e2; color: #dc2626; }
    .amf-actions { display: flex; align-items: center; gap: 6px; }
    .amf-action-btn { border: 1.5px solid #16a34a; color: #16a34a; background: #fff; border-radius: 7px; padding: 5px 12px; font-size: 11px; font-weight: 600; cursor: pointer; }
    .amf-more-btn { border: 1px solid #e5e7eb; background: #fff; border-radius: 7px; padding: 4px 8px; font-size: 14px; color: #6b7280; cursor: pointer; }
    .amf-end-btn { border:1px solid #fecaca; color:#b91c1c; background:#fff; border-radius:7px; padding:5px 9px; font-size:10px; cursor:pointer; }
    .amf-toolbar { display:flex; gap:8px; align-items:center; }
    .amf-filter { border:1px solid #e5e7eb; border-radius:7px; padding:7px 10px; background:#fff; font-size:12px; }
    .amf-footer { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border-top:1px solid #f3f4f6; color:#6b7280; font-size:11px; }
    .amf-page-btn { border:1px solid #d1d5db; background:#fff; border-radius:6px; padding:5px 10px; cursor:pointer; margin-left:5px; }
    .amf-page-btn:disabled { opacity:.45; cursor:not-allowed; }
    .amf-modal{position:fixed;inset:0;z-index:2500;background:rgba(15,23,42,.6);display:flex;align-items:center;justify-content:center;padding:20px}.amf-modal.amf-hidden{display:none}.amf-modal-card{width:min(500px,100%);background:#fff;border-radius:12px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.25)}.amf-modal-card h3{margin:0 0 8px}.amf-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.amf-modal-btn{border:0;border-radius:7px;padding:8px 12px;cursor:pointer;background:#166534;color:#fff}.amf-modal-btn.secondary{background:#fff;color:#374151;border:1px solid #d1d5db}.amf-farm-select{width:100%;box-sizing:border-box;padding:10px;border:1px solid #d1d5db;border-radius:8px;margin-top:10px}.amf-hint{padding:9px;border-radius:7px;background:#fffbeb;color:#92400e;font-size:11px;margin:10px 0}
  `;
  document.head.appendChild(style);
}

function viewManageFarmers(user) {
  injectManageFarmersStyles();

  const svgTotal = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="#16a34a" stroke-width="1.5"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round"/></svg>';
  const svgActive = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="#3b82f6" stroke-width="1.5"/><path d="M7 10l2 2 4-4" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const svgPending = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="#f59e0b" stroke-width="1.5"/><path d="M10 6.5v4l3 2" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/></svg>';
  const svgSusp = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="#ef4444" stroke-width="1.5"/><path d="M7 7l6 6M13 7l-6 6" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/></svg>';

  setTimeout(() => amfInit(), 0);
  return `
  <div class="amf-scrollable">
    <div id="amf-feedback"></div>

    <div class="amf-stat-strip">
      ${amfStatCard('#f0fdf4', svgTotal, 'Total Farmers', '<span id="amf-total">—</span>', 'All time')}
      ${amfStatCard('#eff6ff', svgActive, 'Active Accounts', '<span id="amf-active">—</span>', 'Current')}
      ${amfStatCard('#fffbeb', svgPending, 'Pending Approval', '<span id="amf-pending">—</span>', 'Awaiting review')}
      ${amfStatCard('#fef2f2', svgSusp, 'Suspended', '<span id="amf-suspended">—</span>', 'Current')}
    </div>

    <div class="amf-card">
      <div class="amf-card-header">
        <span class="amf-card-title">All Farmers</span>
        <div class="amf-toolbar">
          <select class="amf-filter" id="amf-filter"><option value="all">All statuses</option><option value="active">Active</option><option value="pending">Pending</option><option value="suspended">Suspended</option><option value="rejected">Rejected</option></select>
          <input type="search" id="amf-search" class="amf-search-input" placeholder="Search farmers...">
        </div>
      </div>
      <table class="amf-table">
        <thead>
          <tr><th>Farmer</th><th>Location</th><th>Active Batches</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody id="amf-body"><tr><td colspan="5">${FarmSenseAdminApi.message('Loading farmers…')}</td></tr></tbody>
      </table>
      <div class="amf-footer"><span id="amf-page-info"></span><div><button class="amf-page-btn" id="amf-prev">Previous</button><button class="amf-page-btn" id="amf-next">Next</button></div></div>
    </div>

    <div class="amf-modal amf-hidden" id="amf-assign-modal"><div class="amf-modal-card"><h3>Assign farmer to a farm</h3><div id="amf-assign-farmer"></div><div class="amf-hint" id="amf-requested-hint"></div><select id="amf-farm-picker" class="amf-farm-select"></select><div class="amf-modal-actions"><button class="amf-modal-btn secondary" id="amf-assign-cancel">Cancel</button><button class="amf-modal-btn" id="amf-assign-confirm">Confirm Assignment</button></div></div></div>

  </div>`;
}

let amfState = { page: 1, totalPages: 1, search: '', status: 'all', farms: [], farmers: new Map(), assignments: new Map(), assigningFarmerId: null };

async function amfV2Request(path, options = {}) {
  const response = await fetch(`${window.FARMSENCE_API_BASE_URL || window.location.origin}/api/v2${path}`, { ...options, headers: { Authorization: `Bearer ${localStorage.getItem('fs_token')}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(data.error || data.message || data.msg || `Request failed (${response.status})`); error.status = response.status; throw error; }
  return data;
}

function amfInit() {
  if (!document.getElementById('amf-body')) return;
  amfState = { page: 1, totalPages: 1, search: '', status: 'all', farms: [], farmers: new Map(), assignments: new Map(), assigningFarmerId: null };
  document.getElementById('amf-search').addEventListener('input', FarmSenseAdminApi.debounce(event => {
    amfState.search = event.target.value.trim(); amfState.page = 1; amfLoad();
  }));
  document.getElementById('amf-filter').addEventListener('change', event => {
    amfState.status = event.target.value; amfState.page = 1; amfLoad();
  });
  document.getElementById('amf-prev').addEventListener('click', () => { if (amfState.page > 1) { amfState.page -= 1; amfLoad(); } });
  document.getElementById('amf-next').addEventListener('click', () => { if (amfState.page < amfState.totalPages) { amfState.page += 1; amfLoad(); } });
  document.getElementById('amf-assign-cancel').addEventListener('click', amfCloseAssign);
  document.getElementById('amf-assign-confirm').addEventListener('click', amfConfirmAssign);
  amfLoad();
}

async function amfLoad() {
  const body = document.getElementById('amf-body');
  if (!body) return;
  body.innerHTML = `<tr><td colspan="5">${FarmSenseAdminApi.message('Loading farmers…')}</td></tr>`;
  const params = new URLSearchParams({ page: amfState.page, limit: 20, status: amfState.status });
  if (amfState.search) params.set('search', amfState.search);
  try {
    const result = await FarmSenseAdminApi.request(`/farmers?${params}`);
    const stats = result.stats || {};
    document.getElementById('amf-total').textContent = stats.total ?? 0;
    document.getElementById('amf-active').textContent = stats.active ?? 0;
    document.getElementById('amf-pending').textContent = stats.pending ?? 0;
    document.getElementById('amf-suspended').textContent = stats.suspended ?? 0;
    amfState.totalPages = result.meta?.totalPages || 1;
    const rows = result.data || [];
    if (!amfState.farms.length) {
      const farmResult = await amfV2Request('/farms?limit=100');
      amfState.farms = farmResult.data || farmResult.farms || [];
    }
    const farmById = new Map(amfState.farms.map(farm => [String(farm._id), farm]));
    const assignmentPairs = await Promise.all(rows.map(async item => {
      const assignmentResult = await amfV2Request(`/users/${item.id}/assignments`);
      return [String(item.id), (assignmentResult.assignments || []).map(assignment => ({ ...assignment, farmName: farmById.get(String(assignment.farmId?._id || assignment.farmId))?.name || 'Unknown farm' }))];
    }));
    amfState.farmers = new Map(rows.map(item => [String(item.id), item]));
    amfState.assignments = new Map(assignmentPairs);
    body.innerHTML = rows.length ? rows.map(item => {
      const farm = item.farms?.[0];
      const assignments = amfState.assignments.get(String(item.id)) || [];
      const assignmentText = assignments.length ? `Assigned to: ${assignments.map(assignment => assignment.farmName).join(', ')}` : 'Not yet assigned';
      const requestedFarm = farmById.get(String(item.requestedFarmId));
      return amfFarmerRow(
        FarmSenseAdminApi.initials(item.name), FarmSenseAdminApi.escapeHTML(item.name),
        FarmSenseAdminApi.escapeHTML(requestedFarm?.name || ''),
        FarmSenseAdminApi.escapeHTML(assignmentText),
        FarmSenseAdminApi.escapeHTML(farm?.location || '—'), item.activeBatches || 0,
        FarmSenseAdminApi.label(item.status), item.id, assignments
      );
    }).join('') : `<tr><td colspan="5">${FarmSenseAdminApi.message('No farmers match these filters.')}</td></tr>`;
    document.getElementById('amf-page-info').textContent = `Page ${result.meta?.page || 1} of ${amfState.totalPages} · ${result.meta?.total || 0} farmers`;
    document.getElementById('amf-prev').disabled = amfState.page <= 1;
    document.getElementById('amf-next').disabled = amfState.page >= amfState.totalPages;
    body.querySelectorAll('[data-amf-view]').forEach(button => button.addEventListener('click', () => amfView(button.dataset.amfView)));
    body.querySelectorAll('[data-amf-edit]').forEach(button => button.addEventListener('click', () => amfEdit(button.dataset.amfEdit)));
    body.querySelectorAll('[data-amf-assign]').forEach(button => button.addEventListener('click', () => amfOpenAssign(button.dataset.amfAssign)));
    body.querySelectorAll('[data-amf-end]').forEach(button => button.addEventListener('click', () => amfEndAssignment(button.dataset.amfFarm, button.dataset.amfEnd)));
    body.querySelectorAll('[data-amf-status]').forEach(button => button.addEventListener('click', () => amfChangeStatus(button.dataset.amfStatus, button.dataset.name, button.dataset.status)));
  } catch (error) {
    body.innerHTML = `<tr><td colspan="5">${FarmSenseAdminApi.message(error.message, 'error')}</td></tr>`;
    FarmSenseAdminApi.feedback('amf-feedback', error.message, 'error');
  }
}

function amfOpenAssign(farmerId) {
  const farmer = amfState.farmers.get(String(farmerId));
  if (!farmer) return;
  amfState.assigningFarmerId = String(farmerId);
  const requestedFarm = amfState.farms.find(farm => String(farm._id) === String(farmer.requestedFarmId));
  const farms = [...amfState.farms].sort((a, b) => (String(b._id) === String(farmer.requestedFarmId)) - (String(a._id) === String(farmer.requestedFarmId)) || String(a.name || '').localeCompare(String(b.name || '')));
  document.getElementById('amf-assign-farmer').textContent = `${farmer.name} (${farmer.email})`;
  document.getElementById('amf-requested-hint').textContent = `Farmer's stated farm (unverified): ${requestedFarm?.name || 'Not provided'}`;
  document.getElementById('amf-farm-picker').innerHTML = '<option value="">Select a real farm…</option>' + farms.map(farm => {
    const match = String(farm._id) === String(farmer.requestedFarmId);
    return `<option value="${farm._id}" ${match ? 'selected' : ''}>${FarmSenseAdminApi.escapeHTML(farm.name)}${match ? ' (farmer selected)' : ''}</option>`;
  }).join('');
  document.getElementById('amf-assign-modal').classList.remove('amf-hidden');
}

function amfCloseAssign() {
  amfState.assigningFarmerId = null;
  document.getElementById('amf-assign-modal')?.classList.add('amf-hidden');
}

async function amfConfirmAssign() {
  const farmerId = amfState.assigningFarmerId;
  const farmId = document.getElementById('amf-farm-picker').value;
  if (!farmerId || !farmId) {
    FarmSenseAdminApi.feedback('amf-feedback', 'Select a farm before confirming.', 'error');
    return;
  }
  const button = document.getElementById('amf-assign-confirm');
  button.disabled = true;
  try {
    await amfV2Request(`/farms/${farmId}/assignments`, { method: 'POST', body: JSON.stringify({ userId: farmerId, startsAt: new Date().toISOString() }) });
    amfCloseAssign();
    FarmSenseAdminApi.feedback('amf-feedback', 'Farmer assigned successfully.');
    await amfLoad();
  } catch (error) {
    const message = error.status === 409 ? `Assignment conflict: ${error.message}` : error.message;
    FarmSenseAdminApi.feedback('amf-feedback', message, 'error');
  } finally { button.disabled = false; }
}

async function amfEndAssignment(farmId, assignmentId) {
  if (!confirm('End this active farm assignment?')) return;
  try {
    await amfV2Request(`/farms/${farmId}/assignments/${assignmentId}/end`, { method: 'POST' });
    FarmSenseAdminApi.feedback('amf-feedback', 'Assignment ended successfully.');
    await amfLoad();
  } catch (error) { FarmSenseAdminApi.feedback('amf-feedback', error.message, 'error'); }
}

async function amfView(id) {
  try {
    const { farmer } = await FarmSenseAdminApi.request(`/farmers/${id}`);
    const assignments = amfState.assignments.get(String(id)) || [];
    const assignmentLabel = assignments.length ? assignments.map(item => item.farmName).join(', ') : 'Not yet assigned';
    const requestedFarm = amfState.farms.find(farm => String(farm._id) === String(farmer.requestedFarmId));
    FarmSenseAdminApi.feedback('amf-feedback', `${farmer.name || 'Farmer'} · ${farmer.email} · Farmer's stated farm (unverified): ${requestedFarm?.name || 'Not provided'} · Real assignment: ${assignmentLabel} · ${FarmSenseAdminApi.label(farmer.accountStatus)} · Joined ${FarmSenseAdminApi.formatDate(farmer.createdAt)}`, 'info');
  } catch (error) { FarmSenseAdminApi.feedback('amf-feedback', error.message, 'error'); }
}

async function amfEdit(id) {
  try {
    const { farmer } = await FarmSenseAdminApi.request(`/farmers/${id}`);
    const name = prompt('Farmer name:', farmer.name || ''); if (name === null) return;
    const email = prompt('Email address:', farmer.email || ''); if (email === null) return;
    const phone = prompt('Phone number:', farmer.phone || ''); if (phone === null) return;
    await FarmSenseAdminApi.request(`/farmers/${id}`, { method: 'PATCH', body: JSON.stringify({ name, email, phone }) });
    FarmSenseAdminApi.feedback('amf-feedback', 'Farmer profile updated successfully.');
    await amfLoad();
  } catch (error) { FarmSenseAdminApi.feedback('amf-feedback', error.message, 'error'); }
}

async function amfChangeStatus(id, name, currentStatus) {
  const status = currentStatus === 'active' ? 'suspended' : 'active';
  const reason = prompt(`${FarmSenseAdminApi.label(status)} ${name}? Enter an optional reason:`, '');
  if (reason === null) return;
  try {
    await FarmSenseAdminApi.request(`/farmers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason }) });
    FarmSenseAdminApi.feedback('amf-feedback', `${name} is now ${status}.`);
    await amfLoad();
  } catch (error) { FarmSenseAdminApi.feedback('amf-feedback', error.message, 'error'); }
}
