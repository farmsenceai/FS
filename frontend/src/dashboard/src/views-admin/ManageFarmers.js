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

function amfFarmerRow(item, assignments) {
  const esc = FarmSenseAdminApi.escapeHTML;
  const status = FarmSenseAdminApi.label(item.status);
  const statusClass = item.status === 'active' ? 'amf-status--ok' : item.status === 'pending' ? 'amf-status--pending' : 'amf-status--suspended';
  const name = esc(item.name || 'Name not provided');
  const primary = assignments[0];
  const assignmentLabel = assignments.length ? (assignments.length === 1 ? primary.farmName : `${primary.farmName} +${assignments.length - 1}`) : 'No farm assigned';
  const assignmentRole = primary ? FarmSenseAdminApi.label(primary.role || 'worker') : 'Unassigned';
  const location = item.farms?.[0]?.location || 'Location not provided';
  const onboarding = item.profileCompletedAt ? 'Profile complete' : item.status === 'pending' ? 'Approval pending' : 'Profile incomplete';
  return `
    <tr data-amf-row="${item.id}">
      <td>
        <div class="amf-farmer-cell">
          <div class="amf-avatar">${FarmSenseAdminApi.initials(item.name || item.email)}</div>
          <div>
            <div class="amf-farmer-name">${name}</div>
            <div class="amf-farmer-farm">${esc(item.email || '')}</div>
            <div class="amf-farmer-farm">${esc(item.phone || 'Phone not provided')}</div>
          </div>
        </div>
      </td>
      <td><span class="amf-status-badge ${item.profileCompletedAt?'amf-status--ok':'amf-status--pending'}">${esc(onboarding)}</span></td>
      <td><strong>${esc(assignmentLabel)}</strong><div class="amf-farmer-farm">${esc(assignmentRole)}${primary?.startsAt ? ` · ${FarmSenseAdminApi.formatDate(primary.startsAt)}` : ''}</div></td>
      <td>${esc(location)}</td>
      <td><strong>${Number(item.activeBatches||0)} active ${Number(item.activeBatches||0)===1?'batch':'batches'}</strong><div class="amf-farmer-farm">${assignments.length?'Canonical farm data':'No active operations'}</div></td>
      <td><span class="amf-status-badge ${statusClass}">${status}</span></td>
      <td>${item.lastActivityAt ? FarmSenseAdminApi.formatDate(item.lastActivityAt,true) : 'Never'}</td>
      <td>
        <div class="amf-actions">
          <button class="amf-action-btn" ${assignments.length?`data-amf-view="${item.id}"`:`data-amf-assign="${item.id}"`}>${assignments.length?'View Profile':'Assign Farm'}</button>
          <details class="amf-menu"><summary class="amf-more-btn">&#8942;</summary><div class="amf-menu-items"><button data-amf-view="${item.id}">View Profile</button><button data-amf-edit="${item.id}">Edit Profile</button><button data-amf-assign="${item.id}">${assignments.length?'Add Farm Assignment':'Assign to Farm'}</button><button data-amf-status="${item.id}" data-name="${name}" data-status="${item.status}">${item.status==='active'?'Suspend Account':'Activate Account'}</button>${assignments.map(assignment=>`<button class="danger" data-amf-end="${assignment._id}" data-amf-farm="${assignment.farmId?._id||assignment.farmId}" data-farm-name="${esc(assignment.farmName||'farm')}">End ${esc(assignment.farmName||'Assignment')} assignment</button>`).join('')}</div></details>
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
    .amf-menu{position:relative}.amf-menu summary{list-style:none}.amf-menu summary::-webkit-details-marker{display:none}.amf-menu-items{position:absolute;right:0;top:34px;z-index:30;width:190px;padding:6px;background:#fff;border:1px solid #e5e7eb;border-radius:9px;box-shadow:0 14px 35px rgba(15,23,42,.16)}.amf-menu-items button{display:block;width:100%;border:0;background:#fff;padding:8px;text-align:left;border-radius:6px;cursor:pointer;font:inherit;font-size:11px}.amf-menu-items button:hover{background:#f3f4f6}.amf-menu-items button.danger{color:#b91c1c}.amf-table-wrap{overflow-x:auto}.amf-primary-btn{border:0;background:#166534;color:#fff;border-radius:7px;padding:8px 12px;font-weight:700;cursor:pointer}.amf-drawer{position:fixed;inset:0;z-index:2600;background:rgba(15,23,42,.45);display:flex;justify-content:flex-end}.amf-drawer.amf-hidden{display:none}.amf-drawer-panel{width:min(520px,100%);height:100%;overflow:auto;background:#fff;padding:22px;box-sizing:border-box;box-shadow:-15px 0 45px rgba(15,23,42,.18)}.amf-drawer-head{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #e5e7eb;padding-bottom:14px}.amf-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}.amf-detail{padding:12px;background:#f8fafc;border-radius:8px}.amf-detail span{display:block;color:#6b7280;font-size:10px;margin-bottom:4px}
    .amf-toolbar { display:flex; gap:8px; align-items:center; }
    .amf-filter { border:1px solid #e5e7eb; border-radius:7px; padding:7px 10px; background:#fff; font-size:12px; }
    .amf-footer { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border-top:1px solid #f3f4f6; color:#6b7280; font-size:11px; }
    .amf-page-btn { border:1px solid #d1d5db; background:#fff; border-radius:6px; padding:5px 10px; cursor:pointer; margin-left:5px; }
    .amf-page-btn:disabled { opacity:.45; cursor:not-allowed; }
    .amf-modal{position:fixed;inset:0;z-index:2500;background:rgba(15,23,42,.6);display:flex;align-items:center;justify-content:center;padding:20px}.amf-modal.amf-hidden{display:none}.amf-modal-card{width:min(500px,100%);background:#fff;border-radius:12px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.25)}.amf-modal-card h3{margin:0 0 8px}.amf-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.amf-modal-btn{border:0;border-radius:7px;padding:8px 12px;cursor:pointer;background:#166534;color:#fff}.amf-modal-btn.secondary{background:#fff;color:#374151;border:1px solid #d1d5db}.amf-farm-select{width:100%;box-sizing:border-box;padding:10px;border:1px solid #d1d5db;border-radius:8px;margin-top:10px}.amf-hint{padding:9px;border-radius:7px;background:#fffbeb;color:#92400e;font-size:11px;margin:10px 0}@media(max-width:1100px){.amf-stat-strip{grid-template-columns:repeat(2,1fr)}.amf-table{min-width:1100px}}@media(max-width:650px){.amf-stat-strip{grid-template-columns:1fr}.amf-toolbar{flex-wrap:wrap}.amf-search-input{width:100%}.amf-detail-grid{grid-template-columns:1fr}}
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
      ${amfStatCard('#fffbeb', svgPending, 'Awaiting Verification', '<span id="amf-pending">—</span>', 'Admin approval pending')}
      ${amfStatCard('#f0fdf4', svgSusp, 'Assigned to Farms', '<span id="amf-assigned">—</span>', 'Active assignments')}
    </div>

    <div class="amf-card">
      <div class="amf-card-header">
        <span class="amf-card-title">All Farmers</span>
        <div class="amf-toolbar">
          <button class="amf-primary-btn" id="amf-export">Export</button><select class="amf-filter" id="amf-filter"><option value="all">All account statuses</option><option value="active">Active</option><option value="pending">Awaiting approval</option><option value="suspended">Suspended</option><option value="rejected">Rejected</option></select>
          <input type="search" id="amf-search" class="amf-search-input" placeholder="Search name, email or phone">
        </div>
      </div>
      <div class="amf-table-wrap"><table class="amf-table">
        <thead>
          <tr><th>Farmer</th><th>Onboarding</th><th>Assigned Farm</th><th>Location</th><th>Operations</th><th>Account</th><th>Last Activity</th><th>Actions</th></tr>
        </thead>
        <tbody id="amf-body"><tr><td colspan="8">${FarmSenseAdminApi.message('Loading farmers…')}</td></tr></tbody>
      </table></div>
      <div class="amf-footer"><span id="amf-page-info"></span><div><button class="amf-page-btn" id="amf-prev">Previous</button><button class="amf-page-btn" id="amf-next">Next</button></div></div>
    </div>

    <div class="amf-modal amf-hidden" id="amf-assign-modal"><div class="amf-modal-card"><h3>Assign farmer to a farm</h3><div id="amf-assign-farmer"></div><div class="amf-hint" id="amf-requested-hint"></div><label>Canonical Farm</label><select id="amf-farm-picker" class="amf-farm-select"></select><label style="display:block;margin-top:12px">Assignment Role</label><select id="amf-role-picker" class="amf-farm-select"><option value="farm_owner">Farm Owner</option><option value="farm_manager">Farm Manager</option><option value="supervisor">Supervisor</option><option value="worker" selected>Worker</option><option value="veterinarian">Veterinarian</option><option value="consultant">Consultant</option><option value="viewer">Viewer</option></select><div class="amf-modal-actions"><button class="amf-modal-btn secondary" id="amf-assign-cancel">Cancel</button><button class="amf-modal-btn" id="amf-assign-confirm">Confirm Assignment</button></div></div></div>
    <div class="amf-drawer amf-hidden" id="amf-drawer"><aside class="amf-drawer-panel"><div class="amf-drawer-head"><div><h3 id="amf-drawer-title" style="margin:0">Farmer Profile</h3><div class="amf-farmer-farm">Authoritative account and assignment data</div></div><button class="amf-more-btn" id="amf-drawer-close">×</button></div><div id="amf-drawer-body"></div></aside></div>

  </div>`;
}

let amfState = { page: 1, totalPages: 1, search: '', status: 'all', farms: [], farmers: new Map(), assignments: new Map(), assigningFarmerId: null, rows: [] };

async function amfV2Request(path, options = {}) {
  const response = await fetch(`${window.FARMSENCE_API_BASE_URL || window.location.origin}/api/v2${path}`, { ...options, headers: { Authorization: `Bearer ${localStorage.getItem('fs_token')}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(data.error?.message || data.error || data.message || data.msg || `Request failed (${response.status})`); error.status = response.status; throw error; }
  return data;
}

function amfInit() {
  if (!document.getElementById('amf-body')) return;
  amfState = { page: 1, totalPages: 1, search: '', status: 'all', farms: [], farmers: new Map(), assignments: new Map(), assigningFarmerId: null, rows: [] };
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
  document.getElementById('amf-export').addEventListener('click', amfExport);
  document.getElementById('amf-drawer-close').addEventListener('click', amfCloseDrawer);
  document.getElementById('amf-drawer').addEventListener('click', event => { if (event.target.id === 'amf-drawer') amfCloseDrawer(); });
  amfLoad();
}

async function amfLoad() {
  const body = document.getElementById('amf-body');
  if (!body) return;
  body.innerHTML = `<tr><td colspan="8">${FarmSenseAdminApi.message('Loading farmers…')}</td></tr>`;
  const params = new URLSearchParams({ page: amfState.page, limit: 20, status: amfState.status });
  if (amfState.search) params.set('search', amfState.search);
  try {
    const result = await FarmSenseAdminApi.request(`/farmers?${params}`);
    const stats = result.stats || {};
    document.getElementById('amf-total').textContent = stats.total ?? 0;
    document.getElementById('amf-active').textContent = stats.active ?? 0;
    document.getElementById('amf-pending').textContent = stats.pending ?? 0;
    document.getElementById('amf-assigned').textContent = stats.assigned ?? 0;
    amfState.totalPages = result.meta?.totalPages || 1;
    const rows = result.data || [];
    amfState.rows = rows;
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
    body.innerHTML = rows.length ? rows.map(item => amfFarmerRow(item, amfState.assignments.get(String(item.id)) || [])).join('') : `<tr><td colspan="8">${FarmSenseAdminApi.message('No farmers match these filters.')}</td></tr>`;
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
  const role = document.getElementById('amf-role-picker').value;
  if (!farmerId || !farmId) {
    FarmSenseAdminApi.feedback('amf-feedback', 'Select a farm before confirming.', 'error');
    return;
  }
  const button = document.getElementById('amf-assign-confirm');
  button.disabled = true;
  try {
    await amfV2Request(`/farms/${farmId}/assignments`, { method: 'POST', body: JSON.stringify({ userId: farmerId, role, startsAt: new Date().toISOString() }) });
    amfCloseAssign();
    FarmSenseAdminApi.feedback('amf-feedback', 'Farmer assigned successfully.');
    await amfLoad();
  } catch (error) {
    const message = error.status === 409 ? `Assignment conflict: ${error.message}` : error.message;
    FarmSenseAdminApi.feedback('amf-feedback', message, 'error');
  } finally { button.disabled = false; }
}

async function amfEndAssignment(farmId, assignmentId) {
  const assignment = [...amfState.assignments.values()].flat().find(item => String(item._id) === String(assignmentId));
  const farmer = [...amfState.farmers.values()].find(item => (amfState.assignments.get(String(item.id)) || []).some(entry => String(entry._id) === String(assignmentId)));
  if (!confirm(`End ${(farmer?.name || 'this farmer')}’s assignment to ${assignment?.farmName || 'this farm'}?\n\nThe farmer will lose access to this farm, but the account and historical records will remain available.`)) return;
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
    const requestedFarm = amfState.farms.find(farm => String(farm._id) === String(farmer.requestedFarmId));
    const esc = FarmSenseAdminApi.escapeHTML;
    document.getElementById('amf-drawer-title').textContent = farmer.name || 'Name not provided';
    document.getElementById('amf-drawer-body').innerHTML = `<div class="amf-detail-grid"><div class="amf-detail"><span>Email</span><strong>${esc(farmer.email || 'Not provided')}</strong></div><div class="amf-detail"><span>Phone</span><strong>${esc(farmer.phone || 'Not provided')}</strong></div><div class="amf-detail"><span>Account</span><strong>${esc(FarmSenseAdminApi.label(farmer.accountStatus))}</strong></div><div class="amf-detail"><span>Onboarding</span><strong>${farmer.profileCompletedAt ? 'Profile complete' : 'Profile incomplete'}</strong></div><div class="amf-detail"><span>Registered</span><strong>${FarmSenseAdminApi.formatDate(farmer.createdAt,true)}</strong></div><div class="amf-detail"><span>Approved</span><strong>${farmer.approvedAt ? FarmSenseAdminApi.formatDate(farmer.approvedAt,true) : 'Not approved'}</strong></div></div><h4>Farm Assignments</h4>${assignments.length?assignments.map(item=>`<div class="amf-detail" style="margin-bottom:8px"><strong>${esc(item.farmName)}</strong><div class="amf-farmer-farm">${esc(FarmSenseAdminApi.label(item.role||'worker'))} · Assigned ${FarmSenseAdminApi.formatDate(item.startsAt)}</div></div>`).join(''):'<div class="amf-detail">No active farm assignment</div>'}<h4>Farmer-stated farm</h4><div class="amf-detail">${esc(requestedFarm?.name||'Not provided')}</div>`;
    document.getElementById('amf-drawer').classList.remove('amf-hidden');
  } catch (error) { FarmSenseAdminApi.feedback('amf-feedback', error.message, 'error'); }
}

function amfCloseDrawer() { document.getElementById('amf-drawer')?.classList.add('amf-hidden'); }

function amfExport() {
  const quote = value => `"${String(value ?? '').replaceAll('"','""')}"`;
  const rows = [['Name','Email','Phone','Account Status','Profile Complete','Assigned Farms','Active Batches','Last Activity'], ...amfState.rows.map(item => [item.name||'',item.email||'',item.phone||'',item.status||'',item.profileCompletedAt?'Yes':'No',(amfState.assignments.get(String(item.id))||[]).map(entry=>entry.farmName).join('; '),item.activeBatches||0,item.lastActivityAt||''])];
  const blob = new Blob([rows.map(row=>row.map(quote).join(',')).join('\r\n')], { type:'text/csv;charset=utf-8' });
  const link=document.createElement('a'); link.href=URL.createObjectURL(blob); link.download=`farmers-${new Date().toISOString().slice(0,10)}.csv`; link.click(); URL.revokeObjectURL(link.href);
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
