/* views-admin/ManageBusinesses.js - canonical organisations UI (filename retained for routing compatibility) */

window.metaManageBusinesses = {
  title: 'Manage Organisations',
  subtitle: 'Create organisations and review their farms, managers, and farmers.'
};

const AMB_V2_API = `${window.FARMSENCE_API_BASE_URL || window.location.origin}/api/v2`;
let ambState = { page: 1, totalPages: 1, status: 'all', search: '', dashboards: new Map() };

async function ambRequest(path, options = {}) {
  const response = await fetch(`${AMB_V2_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('fs_token') || ''}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || body.message || body.msg || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return body;
}

function ambEsc(value) { return FarmSenseAdminApi.escapeHTML(value == null ? '' : value); }
function ambOrgId(value) { return String(value?.id || value?._id || ''); }

function injectManageBusinessesStyles() {
  if (document.getElementById('amb-styles')) return;
  const style = document.createElement('style');
  style.id = 'amb-styles';
  style.textContent = `
    .amb-page{padding:20px;background:#f5f6fa;min-height:100%;font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937}.amb-head,.amb-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.amb-head{margin-bottom:15px}.amb-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:14px}.amb-btn{border:0;border-radius:8px;padding:9px 13px;background:#166534;color:#fff;font-weight:700;cursor:pointer}.amb-btn.secondary{background:#fff;color:#166534;border:1px solid #16a34a}.amb-btn:disabled{opacity:.5}.amb-tools{display:flex;gap:8px;align-items:center}.amb-input,.amb-select{box-sizing:border-box;padding:9px;border:1px solid #d1d5db;border-radius:7px;font:inherit}.amb-table-wrap{overflow:auto}.amb-table{width:100%;border-collapse:collapse}.amb-table th,.amb-table td{text-align:left;padding:11px;border-bottom:1px solid #eef0f2;white-space:nowrap}.amb-table th{font-size:10px;color:#6b7280;background:#f9fafb}.amb-count{font-weight:800}.amb-muted{color:#6b7280}.amb-empty{text-align:center;padding:36px}.amb-footer{display:flex;justify-content:space-between;align-items:center;margin-top:12px}.amb-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.amb-person{padding:11px 0;border-bottom:1px solid #eef0f2}.amb-person:last-child{border-bottom:0}.amb-person strong,.amb-person span{display:block}.amb-farms{font-size:11px;color:#6b7280;margin-top:3px}.amb-modal{display:none;position:fixed;inset:0;z-index:2600;background:rgba(15,23,42,.65);align-items:center;justify-content:center;padding:20px}.amb-modal.open{display:flex}.amb-dialog{box-sizing:border-box;width:min(650px,100%);background:#fff;border-radius:14px;padding:20px}.amb-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}.amb-field{display:flex;flex-direction:column;gap:5px}.amb-field span{font-size:11px;font-weight:700;color:#4b5563}.amb-field input{box-sizing:border-box;width:100%;padding:9px;border:1px solid #d1d5db;border-radius:7px}.amb-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.amb-error{padding:10px;background:#fef2f2;color:#991b1b;border-radius:8px;margin-bottom:12px}.amb-hidden{display:none}@media(max-width:700px){.amb-head,.amb-card-head,.amb-footer{align-items:stretch;flex-direction:column}.amb-tools,.amb-form-grid{display:grid;grid-template-columns:1fr}.amb-input,.amb-select{width:100%}}
  `;
  document.head.appendChild(style);
}

function viewManageBusinesses() {
  injectManageBusinessesStyles();
  setTimeout(ambInit, 0);
  return `<section class="amb-page" id="amb-root"><div id="amb-feedback"></div><div class="amb-card amb-empty">Loading organisations…</div></section><div class="amb-modal" id="amb-modal"></div>`;
}

function ambInit() {
  if (!document.getElementById('amb-root')) return;
  ambState = { page: 1, totalPages: 1, status: 'all', search: '', dashboards: new Map() };
  ambRenderListShell();
  ambLoad();
}

function ambRenderListShell() {
  const root = document.getElementById('amb-root');
  root.innerHTML = `<div id="amb-feedback"></div><div class="amb-head"><div><h3 style="margin:0">Organisations</h3><div class="amb-muted">Canonical organisation accounts and their farm teams.</div></div><button class="amb-btn" id="amb-create">Create Organisation</button></div><div class="amb-card"><div class="amb-card-head"><strong>All Organisations</strong><div class="amb-tools"><select class="amb-select" id="amb-filter"><option value="all">All statuses</option><option value="active">Active</option><option value="pending">Pending</option><option value="suspended">Suspended</option><option value="closed">Closed</option></select><input class="amb-input" id="amb-search" type="search" placeholder="Search organisations…"></div></div><div class="amb-table-wrap" style="margin-top:12px"><table class="amb-table"><thead><tr><th>Organisation</th><th>Billing contact</th><th>Farms</th><th>Managers</th><th>Farmers</th><th>Status</th><th></th></tr></thead><tbody id="amb-body"><tr><td colspan="7" class="amb-empty">Loading organisations…</td></tr></tbody></table></div><div class="amb-footer"><span id="amb-page-info"></span><div><button class="amb-btn secondary" id="amb-prev">Previous</button> <button class="amb-btn secondary" id="amb-next">Next</button></div></div></div>`;
  document.getElementById('amb-create').addEventListener('click', ambOpenCreate);
  document.getElementById('amb-filter').value = ambState.status;
  document.getElementById('amb-search').value = ambState.search;
  document.getElementById('amb-filter').addEventListener('change', event => { ambState.status = event.target.value; ambState.page = 1; ambLoad(); });
  document.getElementById('amb-search').addEventListener('input', FarmSenseAdminApi.debounce(event => { ambState.search = event.target.value.trim().toLowerCase(); ambState.page = 1; ambLoad(); }));
  document.getElementById('amb-prev').addEventListener('click', () => { if (ambState.page > 1) { ambState.page -= 1; ambLoad(); } });
  document.getElementById('amb-next').addEventListener('click', () => { if (ambState.page < ambState.totalPages) { ambState.page += 1; ambLoad(); } });
}

async function ambLoad() {
  const body = document.getElementById('amb-body');
  if (!body) return;
  body.innerHTML = '<tr><td colspan="7" class="amb-empty">Loading organisation summaries…</td></tr>';
  const params = new URLSearchParams({ page: ambState.page, limit: 20 });
  if (ambState.status !== 'all') params.set('status', ambState.status);
  try {
    const result = await ambRequest(`/organizations?${params}`);
    const visible = (result.data || []).filter(org => !ambState.search || `${org.displayName || ''} ${org.legalName || ''} ${org.contacts?.billingEmail || ''}`.toLowerCase().includes(ambState.search));
    const dashboards = await Promise.all(visible.map(org => ambRequest(`/organizations/${ambOrgId(org)}/dashboard`)));
    ambState.dashboards = new Map(dashboards.map(item => [ambOrgId(item.organization), item]));
    ambState.totalPages = result.meta?.totalPages || 1;
    body.innerHTML = visible.length ? visible.map(org => {
      const id = ambOrgId(org); const summary = ambState.dashboards.get(id)?.summary || {};
      return `<tr><td><strong>${ambEsc(org.displayName || org.legalName)}</strong><div class="amb-muted">${ambEsc(org.legalName || '')}</div></td><td>${ambEsc(org.contacts?.billingEmail || '—')}</td><td class="amb-count">${summary.farmCount ?? 0}</td><td class="amb-count">${summary.managerCount ?? 0}</td><td class="amb-count">${summary.farmerCount ?? 0}</td><td>${ambEsc(FarmSenseAdminApi.label(org.status))}</td><td><button class="amb-btn secondary" data-amb-view="${id}">View</button></td></tr>`;
    }).join('') : '<tr><td colspan="7" class="amb-empty">No organisations match these filters.</td></tr>';
    document.getElementById('amb-page-info').textContent = `Page ${result.meta?.page || 1} of ${ambState.totalPages} · ${result.meta?.total || 0} organisations`;
    document.getElementById('amb-prev').disabled = ambState.page <= 1;
    document.getElementById('amb-next').disabled = ambState.page >= ambState.totalPages;
    body.querySelectorAll('[data-amb-view]').forEach(button => button.addEventListener('click', () => ambShowDetail(button.dataset.ambView)));
  } catch (error) {
    body.innerHTML = `<tr><td colspan="7" class="amb-empty">${ambEsc(error.message)}</td></tr>`;
    FarmSenseAdminApi.feedback('amb-feedback', error.message, 'error');
  }
}

async function ambShowDetail(id) {
  const root = document.getElementById('amb-root');
  root.innerHTML = '<div class="amb-card amb-empty">Loading organisation workspace…</div>';
  try {
    const data = ambState.dashboards.get(String(id)) || await ambRequest(`/organizations/${id}/dashboard`);
    const org = data.organization; const summary = data.summary;
    root.innerHTML = `<div id="amb-feedback"></div><div class="amb-head"><div><button class="amb-btn secondary" id="amb-back">← Back to Organisations</button><h3>${ambEsc(org.displayName || org.legalName)}</h3><div class="amb-muted">${ambEsc(org.legalName)} · ${ambEsc(org.contacts?.billingEmail || 'No billing contact')}</div></div><div class="amb-tools"><button class="amb-btn secondary" id="amb-edit">Edit</button><button class="amb-btn secondary" id="amb-status">${org.status === 'active' ? 'Suspend' : 'Activate'}</button><button class="amb-btn secondary" id="amb-delete">Delete</button></div></div><div class="amb-card">${summary.farmCount} farms · ${summary.managerCount} managers · ${summary.farmerCount} farmers · ${ambEsc(FarmSenseAdminApi.label(org.status))}</div><div class="amb-grid"><section class="amb-card"><h3>Farms</h3>${data.farms.length ? data.farms.map(farm => `<div class="amb-person"><strong>${ambEsc(farm.name)}</strong><span>${ambEsc(farm.code)} · ${ambEsc(FarmSenseAdminApi.label(farm.status))}</span><button class="amb-btn secondary" style="margin-top:7px" data-amb-farm="${farm._id}">Open Farm Operations</button></div>`).join('') : '<div class="amb-muted">No farms yet.</div>'}</section><section class="amb-card"><h3>Managers</h3>${data.managers.length ? data.managers.map(item => `<div class="amb-person"><strong>${ambEsc(item.manager.name)}</strong><span>${ambEsc(item.manager.title || 'Manager')} · ${ambEsc(item.manager.email || item.manager.phone || 'No contact')}</span><div class="amb-farms">${ambEsc(item.farms.map(farm => farm.name).join(', '))}</div></div>`).join('') : '<div class="amb-muted">No assigned managers.</div>'}</section><section class="amb-card"><h3>Farmers</h3>${data.farmers.length ? data.farmers.map(item => `<div class="amb-person"><strong>${ambEsc(item.name)}</strong><span>${ambEsc(item.email || item.phone || 'No contact')}</span><div class="amb-farms">${ambEsc(item.farms.map(farm => farm.name).join(', '))}</div></div>`).join('') : '<div class="amb-muted">No assigned farmers.</div>'}</section></div>`;
    document.getElementById('amb-back').addEventListener('click', () => { ambRenderListShell(); ambLoad(); });
    document.getElementById('amb-edit').addEventListener('click', () => ambEditOrganization(org));
    document.getElementById('amb-status').addEventListener('click', () => ambChangeOrganizationStatus(org));
    document.getElementById('amb-delete').addEventListener('click', () => ambDeleteOrganization(org));
    root.querySelectorAll('[data-amb-farm]').forEach(button => button.addEventListener('click', () => ambOpenFarm(button.dataset.ambFarm)));
  } catch (error) { root.innerHTML = `<div class="amb-card amb-empty"><h3>Could not load organisation</h3><p>${ambEsc(error.message)}</p><button class="amb-btn secondary" onclick="ambRenderListShell();ambLoad()">Back to Organisations</button></div>`; }
}

async function ambEditOrganization(org) {
  const displayName = prompt('Display name:', org.displayName || ''); if (displayName === null) return;
  const legalName = prompt('Legal name:', org.legalName || ''); if (legalName === null) return;
  const billingEmail = prompt('Billing email:', org.contacts?.billingEmail || ''); if (billingEmail === null) return;
  const phone = prompt('Phone number:', org.contacts?.phone || ''); if (phone === null) return;
  try {
    await ambRequest(`/organizations/${ambOrgId(org)}`, { method: 'PATCH', body: JSON.stringify({ displayName, legalName, contacts: { ...(org.contacts || {}), billingEmail, phone } }) });
    ambState.dashboards.delete(ambOrgId(org)); await ambShowDetail(ambOrgId(org));
  } catch (error) { FarmSenseAdminApi.feedback('amb-feedback', error.message, 'error'); }
}

async function ambChangeOrganizationStatus(org) {
  const next = org.status === 'active' ? 'suspended' : 'active';
  if (!confirm(`${FarmSenseAdminApi.label(next)} ${org.displayName || org.legalName}?`)) return;
  try {
    if (next === 'suspended') await ambRequest(`/organizations/${ambOrgId(org)}/suspend`, { method: 'POST', body: JSON.stringify({ reason: 'Changed by platform administrator' }) });
    else await FarmSenseAdminApi.request(`/businesses/${ambOrgId(org)}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'active' }) });
    ambState.dashboards.delete(ambOrgId(org)); await ambShowDetail(ambOrgId(org));
  } catch (error) { FarmSenseAdminApi.feedback('amb-feedback', error.message, 'error'); }
}

async function ambDeleteOrganization(org) {
  if (!confirm(`Delete ${org.displayName || org.legalName}? This removes it from active listings.`)) return;
  try { await ambRequest(`/organizations/${ambOrgId(org)}`, { method: 'DELETE' }); ambRenderListShell(); await ambLoad(); FarmSenseAdminApi.feedback('amb-feedback', 'Organisation deleted.'); }
  catch (error) { FarmSenseAdminApi.feedback('amb-feedback', error.message, 'error'); }
}

function ambOpenFarm(farmId) {
  const query = new URLSearchParams(location.search); query.set('farmId', farmId);
  history.replaceState({}, document.title, `${location.pathname}?${query}`);
  FarmSenseAdminApi.navigate('FarmOperations');
}

function ambOpenCreate() {
  const modal = document.getElementById('amb-modal');
  modal.innerHTML = `<form class="amb-dialog" id="amb-create-form"><h3>Create Organisation</h3><div class="amb-error amb-hidden" id="amb-create-error"></div><div class="amb-form-grid"><label class="amb-field"><span>Display name</span><input name="displayName" required></label><label class="amb-field"><span>Legal name</span><input name="legalName" required></label><label class="amb-field"><span>Slug</span><input name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="auto-derived-from-name"></label><label class="amb-field"><span>Billing email</span><input name="billingEmail" type="email" required></label><label class="amb-field"><span>Country code</span><input name="countryCode" value="IN" minlength="2" maxlength="2" required></label></div><div class="amb-actions"><button class="amb-btn secondary" type="button" id="amb-create-cancel">Cancel</button><button class="amb-btn" type="submit">Create Organisation</button></div></form>`;
  modal.classList.add('open');
  const display = modal.querySelector('[name="displayName"]'); const slug = modal.querySelector('[name="slug"]');
  display.addEventListener('input', () => { if (!slug.dataset.edited) slug.value = display.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); });
  slug.addEventListener('input', () => { slug.dataset.edited = 'true'; });
  document.getElementById('amb-create-cancel').addEventListener('click', ambCloseCreate);
  document.getElementById('amb-create-form').addEventListener('submit', ambCreate);
}

function ambCloseCreate() { const modal = document.getElementById('amb-modal'); modal.classList.remove('open'); modal.innerHTML = ''; }
async function ambCreate(event) {
  event.preventDefault(); const form = new FormData(event.target); const button = event.target.querySelector('[type="submit"]'); const errorBox = document.getElementById('amb-create-error');
  const payload = { displayName: form.get('displayName').trim(), legalName: form.get('legalName').trim(), contacts: { billingEmail: form.get('billingEmail').trim() }, legal: { countryCode: form.get('countryCode').trim() } };
  if (form.get('slug').trim()) payload.slug = form.get('slug').trim();
  button.disabled = true; errorBox.classList.add('amb-hidden');
  try { await ambRequest('/organizations', { method: 'POST', body: JSON.stringify(payload) }); ambCloseCreate(); ambState.page = 1; await ambLoad(); FarmSenseAdminApi.feedback('amb-feedback', 'Organisation created successfully.'); }
  catch (error) { errorBox.textContent = error.message; errorBox.classList.remove('amb-hidden'); button.disabled = false; }
}
