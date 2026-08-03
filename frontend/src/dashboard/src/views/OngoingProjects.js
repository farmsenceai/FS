/* views/OngoingProjects.js */

window.metaOngoingProjects = {
  title: 'Ongoing Projects',
  subtitle: 'Read-only project progress and work updates from canonical farm records.'
};

const OP_API = '/api/v2';
const opState = { user: null, farms: [], projectSummaries: new Map(), projects: [], workUpdates: [], feeSummary: null, selectedFarmId: '', selectedProjectId: '', search: '' };

function opEscape(value) {
  const div = document.createElement('div');
  div.textContent = value == null ? '' : String(value);
  return div.innerHTML;
}

function opToken() { return localStorage.getItem('fs_token'); }
function opLabel(value) { return String(value || 'unknown').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase()); }
function opDate(value, includeTime = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return includeTime ? date.toLocaleString() : date.toLocaleDateString();
}
function opId(value) { return String(value?._id || value || ''); }
function opMoney(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));
}

async function opFetch(path) {
  const response = await fetch(`${OP_API}${path}`, { headers: { Authorization: `Bearer ${opToken()}` } });
  let data = {};
  try { data = await response.json(); } catch { data = {}; }
  if ([401, 403].includes(response.status)) throw new Error(data.error || data.msg || 'Your account cannot access these project records.');
  if (!response.ok) throw new Error(data.error || data.message || 'Project data could not be loaded.');
  return data;
}

function opInjectStyles() {
  if (document.getElementById('ongoing-projects-styles')) return;
  const style = document.createElement('style');
  style.id = 'ongoing-projects-styles';
  style.textContent = `
    .op-page,.op-page *{box-sizing:border-box}.op-page{padding:20px;background:#f5f6fa;min-height:100%;font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033}
    .op-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:16px;overflow:hidden}.op-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 17px;border-bottom:1px solid #eef0f3}.op-title{font-size:15px;font-weight:800}.op-muted{color:#667085;font-size:11px;margin-top:3px}.op-body{padding:16px}.op-user{display:flex;align-items:center;gap:10px}.op-avatar{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:#dcfce7;color:#166534;font-weight:800}
    .op-selector{display:grid;grid-template-columns:minmax(220px,1fr) minmax(260px,2fr);gap:10px}.op-input,.op-select{width:100%;height:40px;border:1px solid #d1d5db;border-radius:8px;padding:0 11px;background:#fff;color:#111827}.op-farm-grid{display:flex;gap:14px;overflow-x:auto;padding:2px 2px 10px}.op-farm-card{border:1px solid #e5e7eb;border-radius:10px;background:#fff;padding:0;text-align:left;color:inherit;cursor:pointer;min-width:224px;width:224px;overflow:hidden;transition:transform .15s,box-shadow .15s}.op-farm-card:hover{transform:translateY(-2px);box-shadow:0 7px 20px rgba(15,23,42,.09)}.op-farm-card.active{border-color:#16a34a;box-shadow:0 0 0 2px #dcfce7}.op-farm-visual{height:112px;background:#e5e7eb;position:relative}.op-farm-visual:after{content:"";position:absolute;width:60%;height:68%;left:20%;bottom:0;background:#93c5fd}.op-farm-content{padding:13px 15px}.op-card-progress{margin-top:12px}.op-dashboard-grid{display:grid;grid-template-columns:minmax(280px,.9fr) minmax(360px,1.15fr) minmax(300px,.95fr);gap:16px;align-items:stretch}.op-dashboard-grid>.op-card{margin-bottom:0}.op-list{max-height:650px;overflow:auto;padding:8px 18px}.op-project{border-bottom:1px solid #eef0f3;padding:13px 0;color:inherit}.op-project:last-child{border-bottom:0}.op-row{display:flex;align-items:center;justify-content:space-between;gap:10px}.op-name{font-weight:800}.op-description{color:#667085;font-size:11px;margin-top:7px;line-height:1.45}.op-badge{display:inline-block;border-radius:999px;padding:3px 8px;font-size:10px;font-weight:800}.op-completed{background:#dcfce7;color:#166534}.op-in-progress{background:#dbeafe;color:#1d4ed8}.op-planned{background:#fef3c7;color:#92400e}.op-blocked,.op-cancelled{background:#fee2e2;color:#991b1b}
    .op-detail-grid{display:grid;grid-template-columns:1fr;gap:0}.op-fact{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid #eef0f3}.op-fact span{color:#667085;font-size:11px}.op-progress-track{height:8px;background:#e5e7eb;border-radius:999px;overflow:hidden;margin-top:8px}.op-progress-fill{height:100%;background:#16a34a;border-radius:999px}.op-progress-ring{width:150px;height:150px;border-radius:50%;display:grid;place-items:center;margin:4px auto 22px;position:relative}.op-progress-ring:after{content:"";width:126px;height:126px;border-radius:50%;background:#fff;position:absolute}.op-ring-value{position:relative;z-index:1;text-align:center;color:#16a34a;font-size:31px;font-weight:800}.op-ring-value small{display:block;color:#98a2b3;font-size:10px;font-weight:500;margin-top:3px}.op-updates{display:grid;gap:12px;max-height:570px;overflow:auto}.op-update{display:grid;grid-template-columns:58px 1fr;gap:12px;padding:7px 0}.op-update-icon{width:58px;height:58px;background:#f3f4f6;border-radius:7px}.op-update-meta{color:#98a2b3;font-size:10px;margin-top:6px}.op-empty,.op-loading,.op-error{padding:34px;text-align:center;color:#667085}.op-error{color:#b42318;background:#fff7f7}.op-link-btn{border:0;background:none;color:#166534;font:inherit;font-weight:700;cursor:pointer;padding:0}
    .op-financial-grid{display:grid;grid-template-columns:minmax(310px,.85fr) minmax(480px,1.65fr);gap:20px;margin-top:20px;align-items:stretch}.op-financial-grid>.op-card{margin-bottom:0}.op-financial-body{padding:20px}.op-financial-totals{display:grid;gap:10px}.op-financial-total{padding:17px 15px;background:#f8f9fa;border-radius:8px}.op-financial-label{color:#667085;font-size:12px}.op-financial-value{font-size:18px;font-weight:800;margin-top:4px;color:#101828}.op-payment-progress{margin-top:26px}.op-payment-meta{display:flex;align-items:center;justify-content:space-between;color:#667085;font-size:12px;margin-bottom:11px}.op-payment-meta strong{color:#16a34a}.op-payment-track{height:7px;background:#eef0f3;border-radius:999px;overflow:hidden}.op-payment-fill{height:100%;background:#16a34a;border-radius:999px}.op-breakdown-body{padding:20px}.op-table-wrap{overflow-x:auto}.op-table{width:100%;border-collapse:collapse}.op-table th,.op-table td{text-align:left;padding:15px 13px;border-bottom:1px solid #eef0f3;white-space:nowrap}.op-table th{font-size:11px;color:#667085;background:#f8f9fa;font-weight:700}.op-table td{font-size:12px}.op-table td:first-child{font-weight:700}.op-table td:nth-child(n+2),.op-table th:nth-child(n+2){text-align:right}.op-fee-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;background:#16b981}.op-fee-dot.paid{background:#f97316}
    @media(max-width:1100px){.op-dashboard-grid{grid-template-columns:1fr 1fr}.op-dashboard-grid>.op-card:last-child{grid-column:1/-1}.op-financial-grid{grid-template-columns:1fr}}@media(max-width:760px){.op-dashboard-grid,.op-selector{grid-template-columns:1fr}.op-dashboard-grid>.op-card:last-child{grid-column:auto}}
  `;
  document.head.appendChild(style);
}

function opSelectedFarm() { return opState.farms.find(item => opId(item) === String(opState.selectedFarmId)); }
function opSelectedProject() { return opState.projects.find(item => opId(item) === String(opState.selectedProjectId)); }
function opManagerNames(project) {
  return (project?.managerIds || []).map(manager => typeof manager === 'object' ? manager.name : `Manager ${manager}`).filter(Boolean).join(', ') || 'Unassigned';
}
function opAuthor(update) {
  if (update.createdBy && typeof update.createdBy === 'object') return update.createdBy.name || 'Unknown author';
  return 'Unknown author';
}

function opRelevantProject(projects = []) {
  const rank = { in_progress: 0, blocked: 1, planned: 2, completed: 3, cancelled: 4 };
  return projects.slice().sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9) || new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))[0] || null;
}

function opVisibleFarms() {
  const needle = opState.search.toLowerCase();
  return opState.farms.filter(farm => `${farm.code || ''} ${farm.name || ''} ${farm.status || ''}`.toLowerCase().includes(needle));
}

function opRenderFarmOptions() {
  const select = document.getElementById('op-farm-select');
  const farms = opVisibleFarms();
  select.innerHTML = `<option value="">Select a farm…</option>${farms.map(farm => `<option value="${opId(farm)}" ${opId(farm) === String(opState.selectedFarmId) ? 'selected' : ''}>${opEscape(farm.code)} · ${opEscape(farm.name)} · ${opLabel(farm.status)}</option>`).join('')}`;
  if (!farms.some(farm => opId(farm) === String(opState.selectedFarmId))) select.value = '';
}

function opRenderFarmGrid() {
  const grid = document.getElementById('op-farm-grid');
  const farms = opVisibleFarms();
  if (!farms.length) { grid.innerHTML = `<div class="op-empty">${opState.farms.length ? 'No farms match this search.' : 'No farms are available.'}</div>`; return; }
  grid.innerHTML = farms.map(farm => {
    const summary = opState.projectSummaries.get(opId(farm));
    if (summary?.error) return `<button class="op-farm-card" data-op-farm="${opId(farm)}"><div class="op-farm-visual"></div><div class="op-farm-content"><div class="op-name">${opEscape(farm.name)}</div><div class="op-muted">${opEscape(farm.code)}</div><div class="op-error" style="padding:12px 0 0;background:none;text-align:left">Project summary unavailable</div></div></button>`;
    if (!summary) return `<button class="op-farm-card" data-op-farm="${opId(farm)}"><div class="op-farm-visual"></div><div class="op-farm-content"><div class="op-name">${opEscape(farm.name)}</div><div class="op-muted">${opEscape(farm.code)}</div><div class="op-loading" style="padding:12px 0 0">Loading projects…</div></div></button>`;
    const project = summary.project;
    if (!project) return `<button class="op-farm-card ${opId(farm) === String(opState.selectedFarmId) ? 'active' : ''}" data-op-farm="${opId(farm)}"><div class="op-farm-visual"></div><div class="op-farm-content"><div class="op-name">${opEscape(farm.name)}</div><div class="op-muted">${opEscape(farm.code)} · ${opEscape(opLabel(farm.status))}</div><div class="op-empty" style="padding:12px 0 0;text-align:left">No projects logged yet.</div></div></button>`;
    const percent = Math.min(100, Math.max(0, Number(project.percentComplete || 0)));
    return `<button class="op-farm-card ${opId(farm) === String(opState.selectedFarmId) ? 'active' : ''}" data-op-farm="${opId(farm)}"><div class="op-farm-visual"></div><div class="op-farm-content"><div class="op-name">${opEscape(farm.name)}</div><div class="op-muted">${opEscape(project.title)}</div><div class="op-row" style="margin-top:10px"><span class="op-badge op-${opEscape(project.status).replaceAll('_','-')}">${opEscape(opLabel(project.status))}</span><strong>${percent}%</strong></div></div></button>`;
  }).join('');
  grid.querySelectorAll('[data-op-farm]').forEach(card => card.addEventListener('click', () => opLoadFarm(card.dataset.opFarm)));
}

function opRenderProjects() {
  const panel = document.getElementById('op-project-list');
  const farm = opSelectedFarm();
  document.getElementById('op-project-heading').textContent = farm ? `${farm.name} Projects` : 'Farm Projects';
  if (!farm) { panel.innerHTML = '<div class="op-empty">Loading project information…</div>'; return; }
  if (!opState.projects.length) { panel.innerHTML = '<div class="op-empty">No projects logged for this farm yet.</div>'; return; }
  panel.innerHTML = opState.projects.map(project => { const percent = Math.min(100, Math.max(0, Number(project.percentComplete || 0))); return `<div class="op-project"><div class="op-row"><span class="op-name">${opEscape(project.title)}</span><span class="op-badge op-${opEscape(project.status).replaceAll('_','-')}">${opEscape(opLabel(project.status))}</span></div><div class="op-progress-track"><div class="op-progress-fill" style="width:${percent}%"></div></div><div class="op-row" style="margin-top:6px"><span class="op-muted">${percent}% complete</span><span class="op-muted">${opEscape(opLabel(project.priority))} priority</span></div><div class="op-muted">${opDate(project.startDate)} <i class="fa-solid fa-arrow-right"></i> ${opDate(project.targetDate)} · ${opEscape(opManagerNames(project))}</div></div>`; }).join('');
}

function opRenderDetail() {
  const body = document.getElementById('op-project-detail');
  const project = opSelectedProject();
  const farm = opSelectedFarm();
  document.getElementById('op-overview-heading').textContent = farm ? `Project Overview - ${farm.name}` : 'Project Overview';
  if (!project) { body.innerHTML = '<div class="op-empty">Loading primary project overview…</div>'; return; }
  const percent = Math.min(100, Math.max(0, Number(project.percentComplete || 0)));
  body.innerHTML = `<div class="op-progress-ring" style="background:conic-gradient(#16a34a ${percent * 3.6}deg,#f3f4f6 0deg)"><div class="op-ring-value">${percent}%<small>Overall Progress</small></div></div><div class="op-detail-grid"><div class="op-fact"><span>Project</span><strong>${opEscape(project.title)}</strong></div><div class="op-fact"><span>Status</span><span class="op-badge op-${opEscape(project.status).replaceAll('_','-')}">${opEscape(opLabel(project.status))}</span></div><div class="op-fact"><span>Priority</span><strong>${opEscape(opLabel(project.priority))}</strong></div><div class="op-fact"><span>Start Date</span><strong>${opDate(project.startDate)}</strong></div><div class="op-fact"><span>Expected Completion</span><strong>${opDate(project.targetDate)}</strong></div>${project.completedAt ? `<div class="op-fact"><span>Completed At</span><strong>${opDate(project.completedAt, true)}</strong></div>` : ''}<div class="op-fact"><span>Project Manager</span><strong>${opEscape(opManagerNames(project))}</strong></div><div class="op-fact" style="display:block"><span>Description</span><div class="op-description">${opEscape(project.description || 'No description')}</div></div></div>`;
}

function opRenderUpdates() {
  const body = document.getElementById('op-update-list');
  const visible = opState.workUpdates;
  document.getElementById('op-updates-title').textContent = 'Recent Site Activity';
  body.innerHTML = visible.length ? visible.slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(update => `<div class="op-update"><div class="op-update-icon"></div><div><strong>${opEscape(update.note)}</strong><div class="op-update-meta">${update.projectId ? `${opEscape(update.projectId.title || 'Linked project')} · ` : ''}${opEscape(opAuthor(update))}<br>${opDate(update.createdAt, true)}</div></div></div>`).join('') : '<div class="op-empty">No work updates logged for this farm yet.</div>';
}

function opRenderFinancialSummary() {
  const summaryBody = document.getElementById('op-financial-summary');
  const breakdownBody = document.getElementById('op-financial-breakdown');
  const farm = opSelectedFarm();
  document.getElementById('op-financial-heading').textContent = farm ? `Financial Summary - ${farm.name}` : 'Financial Summary';
  if (!farm) {
    summaryBody.innerHTML = '<div class="op-empty">Select a farm to view its farmer fee summary.</div>';
    breakdownBody.innerHTML = '<div class="op-empty">Select a farm to view its farmer breakdown.</div>';
    return;
  }
  const summary = opState.feeSummary;
  if (!summary) {
    summaryBody.innerHTML = '<div class="op-loading">Loading financial summary…</div>';
    breakdownBody.innerHTML = '<div class="op-loading">Loading farmer breakdown…</div>';
    return;
  }
  const farmers = Array.isArray(summary.farmers) ? summary.farmers : [];
  if (!farmers.length && !summary.pendingCount && !summary.paidCount) {
    summaryBody.innerHTML = '<div class="op-empty">No farmer fees have been recorded for this farm yet.</div>';
    breakdownBody.innerHTML = '<div class="op-empty">Farmer fee details will appear here once fees are recorded.</div>';
    return;
  }
  const totalFees = Number(summary.totalPending || 0) + Number(summary.totalPaid || 0);
  const paidPercent = totalFees ? Math.round((Number(summary.totalPaid || 0) / totalFees) * 100) : 0;
  summaryBody.innerHTML = `<div class="op-financial-totals"><div class="op-financial-total"><div class="op-financial-label">Total Pending</div><div class="op-financial-value">${opEscape(opMoney(summary.totalPending))}</div></div><div class="op-financial-total"><div class="op-financial-label">Total Paid</div><div class="op-financial-value">${opEscape(opMoney(summary.totalPaid))}</div></div><div class="op-financial-total"><div class="op-financial-label">Pending Fees</div><div class="op-financial-value">${Number(summary.pendingCount || 0)}</div></div><div class="op-financial-total"><div class="op-financial-label">Paid Fees</div><div class="op-financial-value">${Number(summary.paidCount || 0)}</div></div></div><div class="op-payment-progress"><div class="op-payment-meta"><span>Payment Progress</span><strong>${paidPercent}% Paid</strong></div><div class="op-payment-track"><div class="op-payment-fill" style="width:${paidPercent}%"></div></div></div>`;
  breakdownBody.innerHTML = `<div class="op-table-wrap"><table class="op-table"><thead><tr><th>Farmer</th><th><span class="op-fee-dot"></span>Pending Amount</th><th><span class="op-fee-dot paid"></span>Paid Amount</th></tr></thead><tbody>${farmers.map(farmer => `<tr><td>${opEscape(farmer.name || 'Unknown farmer')}</td><td>${opEscape(opMoney(farmer.pending))}</td><td>${opEscape(opMoney(farmer.paid))}</td></tr>`).join('')}</tbody></table></div>`;
}

async function opLoadFarm(farmId) {
  opState.selectedFarmId = farmId; opState.selectedProjectId = ''; opState.projects = []; opState.workUpdates = []; opState.feeSummary = null;
  opRenderFarmOptions(); opRenderFarmGrid();
  document.getElementById('op-project-list').innerHTML = '<div class="op-loading">Loading projects…</div>';
  document.getElementById('op-update-list').innerHTML = '<div class="op-loading">Loading work updates…</div>';
  opRenderFinancialSummary();
  if (!farmId) { opRenderProjects(); opRenderDetail(); opRenderUpdates(); return; }
  try {
    const [projects, updates, feeSummary] = await Promise.all([opFetch(`/farms/${farmId}/projects?limit=100`), opFetch(`/farms/${farmId}/work-updates?limit=100`), opFetch(`/farmer-fees/summary?farmId=${encodeURIComponent(farmId)}`)]);
    if (String(opState.selectedFarmId) !== String(farmId)) return;
    opState.projects = projects.data || []; opState.workUpdates = updates.data || []; opState.feeSummary = feeSummary;
    opState.selectedProjectId = opId(opRelevantProject(opState.projects));
    opState.projectSummaries.set(String(farmId), { project: opRelevantProject(opState.projects), projects: opState.projects });
    opRenderFarmGrid(); opRenderProjects(); opRenderDetail(); opRenderUpdates(); opRenderFinancialSummary();
  } catch (error) {
    document.getElementById('op-project-list').innerHTML = `<div class="op-error">${opEscape(error.message)}</div>`;
    document.getElementById('op-project-detail').innerHTML = '<div class="op-empty">Project details unavailable.</div>';
    document.getElementById('op-update-list').innerHTML = `<div class="op-error">${opEscape(error.message)}</div>`;
    document.getElementById('op-financial-summary').innerHTML = `<div class="op-error">${opEscape(error.message)}</div>`;
    document.getElementById('op-financial-breakdown').innerHTML = `<div class="op-error">${opEscape(error.message)}</div>`;
  }
}

async function opInit() {
  document.getElementById('op-farm-search').addEventListener('input', event => { opState.search = event.target.value.trim(); opRenderFarmOptions(); opRenderFarmGrid(); });
  document.getElementById('op-farm-select').addEventListener('change', event => opLoadFarm(event.target.value));
  try {
    const result = await opFetch('/farms?limit=100');
    opState.farms = (result.data || []).filter(farm => farm.status === 'active' || farm.status === 'planned'); opRenderFarmOptions(); opRenderFarmGrid();
    document.getElementById('op-farm-help').textContent = opState.farms.length ? `${opState.farms.length} farm${opState.farms.length === 1 ? '' : 's'} available` : 'No farms available';
    await Promise.all(opState.farms.map(async farm => {
      try {
        const result = await opFetch(`/farms/${opId(farm)}/projects?limit=100`);
        const projects = result.data || [];
        opState.projectSummaries.set(opId(farm), { project: opRelevantProject(projects), projects });
      } catch (error) { opState.projectSummaries.set(opId(farm), { error: error.message }); }
      opRenderFarmGrid();
    }));
    const initialFarm = opState.farms.find(farm => opState.projectSummaries.get(opId(farm))?.project) || opState.farms[0];
    if (initialFarm) await opLoadFarm(opId(initialFarm));
  } catch (error) {
    document.getElementById('op-farm-controls').innerHTML = `<div class="op-error">${opEscape(error.message)}</div>`;
  }
}

function viewOngoingProjects(user) {
  opInjectStyles();
  opState.user = user || JSON.parse(localStorage.getItem('fs_user') || 'null');
  opState.farms = []; opState.projectSummaries = new Map(); opState.projects = []; opState.workUpdates = []; opState.feeSummary = null; opState.selectedFarmId = ''; opState.selectedProjectId = ''; opState.search = '';
  setTimeout(opInit, 0);
  const displayName = opState.user?.name || opState.user?.email || 'Business user';
  const initial = displayName.charAt(0).toUpperCase();
  return `<div class="op-page"><section class="op-card"><div class="op-head"><div><div class="op-title">Farm Projects</div><div class="op-muted">Real-time, read-only progress from canonical project records.</div></div><div class="op-user"><div class="op-avatar">${opEscape(initial)}</div><div><strong>${opEscape(displayName)}</strong><div class="op-muted">${opEscape(opState.user?.email || opState.user?.phone || '')}</div></div></div></div><div class="op-body" id="op-farm-controls"><div class="op-selector"><input id="op-farm-search" class="op-input" type="search" placeholder="Search farms by code, name or status"><select id="op-farm-select" class="op-select"><option value="">Loading farms…</option></select></div><div id="op-farm-help" class="op-muted" style="margin-top:8px">Loading canonical farms…</div></div></section><section style="margin-bottom:18px"><div id="op-farm-grid" class="op-farm-grid"><div class="op-loading">Loading farm project summaries…</div></div></section><div class="op-dashboard-grid"><section class="op-card"><div class="op-head"><div id="op-overview-heading" class="op-title">Project Overview</div></div><div id="op-project-detail" class="op-body"><div class="op-loading">Loading primary project overview…</div></div></section><section class="op-card"><div class="op-head"><div><div id="op-project-heading" class="op-title">Farm Projects</div><div class="op-muted">All real project progress for the selected farm.</div></div></div><div id="op-project-list" class="op-list"><div class="op-loading">Loading project information…</div></div></section><section class="op-card"><div class="op-head"><div><div id="op-updates-title" class="op-title">Recent Site Activity</div><div class="op-muted">Newest work updates first.</div></div></div><div id="op-update-list" class="op-body op-updates"><div class="op-loading">Loading work updates…</div></div></section></div><div class="op-financial-grid"><section class="op-card"><div class="op-head"><div id="op-financial-heading" class="op-title">Financial Summary</div></div><div id="op-financial-summary" class="op-financial-body"><div class="op-loading">Loading financial summary…</div></div></section><section class="op-card"><div class="op-head"><div class="op-title">Farmer Fee Breakdown</div></div><div id="op-financial-breakdown" class="op-breakdown-body"><div class="op-loading">Loading farmer breakdown…</div></div></section></div></div>`;
}
