/* views/ProjectManager.js */

window.metaProjectManager = {
  title: 'Project Management Team',
  subtitle: 'Read-only canonical manager, project, feedback, and activity data.'
};

const PM_API = '/api/v2';
const pmState = { managers: [], farms: [], projects: [], histories: new Map(), ratings: new Map(), overallRating: 0, overallReviewCount: 0, activities: [], showAllManagers: false, showAllProjects: false, showAllPerformance: false, showAllActivities: false };

function pmEscape(value) { const node = document.createElement('div'); node.textContent = value == null ? '' : String(value); return node.innerHTML; }
function pmId(value) { return String(value?._id || value || ''); }
function pmToken() { return localStorage.getItem('fs_token'); }
function pmInitials(name) { return String(name || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(); }
function pmDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
function pmRelative(value) {
  const date = new Date(value); if (Number.isNaN(date.getTime())) return '—';
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'Just now'; if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`; if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`; return pmDate(date);
}
async function pmFetch(path) {
  const response = await fetch(`${PM_API}${path}`, { headers: { Authorization: `Bearer ${pmToken()}` } });
  let data = {}; try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) throw new Error(data.error || data.message || 'Project management data could not be loaded.');
  return data;
}

// This is a presentation mapping derived from canonical project fields, not a separately stored status.
function pmDisplayStatus(project) {
  if (project.status === 'completed') return { key: 'completed', label: 'Completed' };
  if (project.status === 'blocked') return { key: 'at-risk', label: 'At Risk' };
  if (project.status === 'planned') return { key: 'not-started', label: 'Not Started' };
  if (project.status === 'cancelled') return { key: 'cancelled', label: 'Cancelled' };
  if (project.status === 'in_progress') {
    const target = new Date(project.targetDate).getTime();
    return Number.isFinite(target) && target < Date.now() ? { key: 'delayed', label: 'Delayed' } : { key: 'in-progress', label: 'In Progress' };
  }
  return { key: 'not-started', label: 'Not Started' };
}

function pmInjectStyles() {
  if (document.getElementById('project-manager-styles')) return;
  const style = document.createElement('style'); style.id = 'project-manager-styles'; style.textContent = `
    .pm-page,.pm-page *{box-sizing:border-box}.pm-page{padding:20px;background:#f5f6fa;min-height:100%;font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033}.pm-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:16px}.pm-stat,.pm-card{background:#fff;border:1px solid #e5e7eb;border-radius:10px}.pm-stat{padding:14px;display:flex;align-items:center;gap:10px}.pm-stat-icon{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#dcfce7;color:#15803d;font-weight:800}.pm-stat-value{font-size:19px;font-weight:800}.pm-stat-label,.pm-muted{font-size:11px;color:#667085}.pm-stat-sub{font-size:10px;color:#98a2b3;margin-top:2px}.pm-top{display:grid;grid-template-columns:420px 1fr;gap:16px;margin-bottom:16px}.pm-bottom{display:grid;grid-template-columns:360px 1fr 340px;gap:16px;margin-bottom:16px}.pm-card{overflow:hidden}.pm-head{padding:13px 16px;border-bottom:1px solid #eef0f3;display:flex;align-items:center;justify-content:space-between;gap:10px}.pm-title{font-weight:800}.pm-link{border:0;background:none;color:#15803d;font:inherit;font-size:11px;font-weight:700;cursor:pointer}.pm-link:disabled{color:#98a2b3;cursor:not-allowed}.pm-empty,.pm-loading,.pm-error{padding:34px 18px;text-align:center;color:#667085}.pm-error{color:#b42318}.pm-manager{display:grid;grid-template-columns:40px minmax(0,1fr) 62px;gap:10px;align-items:center;padding:11px 16px;border-bottom:1px solid #f2f4f7}.pm-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#dcfce7;color:#15803d;font-weight:800}.pm-name{font-weight:800}.pm-contact{font-size:10px;color:#667085;margin-top:3px}.pm-title-line{font-size:11px;color:#475467;margin-top:2px}.pm-lead{display:inline-block;background:#dcfce7;color:#166534;border-radius:5px;padding:2px 6px;font-size:9px;font-weight:800;margin-left:5px}.pm-count{text-align:center}.pm-count strong{display:block;font-size:16px}.pm-count span{font-size:9px;color:#98a2b3}.pm-table-wrap{overflow:auto}.pm-table{width:100%;border-collapse:collapse}.pm-table th,.pm-table td{text-align:left;padding:10px 12px;border-bottom:1px solid #f2f4f7;vertical-align:middle}.pm-table th{font-size:10px;color:#667085;background:#f8fafc;white-space:nowrap}.pm-project-name{font-weight:800}.pm-farm-name{font-size:10px;color:#667085;margin-top:3px}.pm-manager-cell{display:flex;align-items:center;gap:6px;white-space:nowrap}.pm-mini-avatar{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#dcfce7;color:#15803d;font-size:9px;font-weight:800}.pm-progress{width:90px;height:7px;background:#eef0f3;border-radius:9px;overflow:hidden;margin-top:4px}.pm-progress>span{display:block;height:100%;background:#16a34a}.pm-badge{display:inline-block;padding:3px 8px;border-radius:999px;font-size:9px;font-weight:800;white-space:nowrap}.pm-completed{background:#dcfce7;color:#166534}.pm-in-progress{background:#dbeafe;color:#1d4ed8}.pm-delayed,.pm-cancelled{background:#fee2e2;color:#991b1b}.pm-at-risk{background:#fef3c7;color:#92400e}.pm-not-started{background:#f2f4f7;color:#475467}.pm-donut-body{padding:16px;display:flex;gap:18px;align-items:center}.pm-donut{width:125px;height:125px;border-radius:50%;display:grid;place-items:center;position:relative;flex:none}.pm-donut:after{content:"";position:absolute;width:80px;height:80px;background:#fff;border-radius:50%}.pm-donut-center{position:relative;z-index:1;text-align:center;font-size:22px;font-weight:800}.pm-donut-center small{display:block;font-size:9px;color:#667085;font-weight:500}.pm-legend{display:grid;gap:7px;flex:1}.pm-legend-row{display:grid;grid-template-columns:9px 1fr auto;gap:7px;align-items:center;font-size:10px}.pm-dot{width:9px;height:9px;border-radius:50%}.pm-gap-empty{margin:16px;min-height:180px;border:1px dashed #d0d5dd;border-radius:8px;background:#f8fafc;display:grid;place-items:center;text-align:center;color:#667085;padding:20px}.pm-perf{display:grid;grid-template-columns:34px minmax(80px,1fr) minmax(95px,1.3fr) 48px;gap:8px;align-items:center;padding:10px 16px}.pm-perf-bar{height:7px;background:#eef0f3;border-radius:9px;overflow:hidden}.pm-perf-bar span{display:block;height:100%;background:#16a34a}.pm-rating{color:#f59e0b;font-weight:800;white-space:nowrap}.pm-activity{display:grid;grid-template-columns:28px 1fr auto;gap:9px;padding:10px 16px;border-bottom:1px solid #f2f4f7}.pm-activity-icon{width:28px;height:28px;border-radius:7px;background:#dcfce7;color:#15803d;display:grid;place-items:center}.pm-activity-note{font-size:11px;font-weight:700}.pm-activity-meta{font-size:9px;color:#98a2b3;margin-top:3px}.pm-activity-time{font-size:9px;color:#98a2b3;white-space:nowrap}.pm-footer{padding:9px 16px;border-top:1px solid #eef0f3}.pm-full{grid-column:1/-1}@media(max-width:1120px){.pm-stats{grid-template-columns:repeat(3,1fr)}.pm-bottom{grid-template-columns:1fr 1fr}.pm-bottom>.pm-card:last-child{grid-column:1/-1}}@media(max-width:760px){.pm-stats,.pm-top,.pm-bottom{grid-template-columns:1fr}.pm-bottom>.pm-card:last-child{grid-column:auto}}
  `; document.head.appendChild(style);
}

function pmManagerProjects(managerId) { return pmState.projects.filter(project => (project.managerIds || []).some(manager => pmId(manager) === managerId)); }
function pmManagerRow(manager) {
  const projects = pmManagerProjects(pmId(manager)); const lead = /\b(lead|head)\b/i.test(manager.title || '');
  return `<div class="pm-manager"><div class="pm-avatar">${pmEscape(pmInitials(manager.name))}</div><div><div class="pm-name">${pmEscape(manager.name)}${lead ? '<span class="pm-lead">Lead</span>' : ''}</div><div class="pm-title-line">${pmEscape(manager.title || 'Project Manager')}</div><div class="pm-contact">${pmEscape([manager.email, manager.phone].filter(Boolean).join(' · ') || 'No contact recorded')}</div></div><div class="pm-count"><strong>${projects.length}</strong><span>Projects</span></div></div>`;
}
function pmProjectRow(project) {
  const farm = pmState.farms.find(item => pmId(item) === pmId(project.farmId)); const status = pmDisplayStatus(project); const managers = project.managerIds || []; const progress = Math.min(100, Math.max(0, Number(project.percentComplete || 0)));
  return `<tr><td><div class="pm-project-name">${pmEscape(project.title)}</div><div class="pm-farm-name">${pmEscape(farm?.name || 'Unknown farm')}</div></td><td>${pmEscape(farm?.location?.address || 'Location not recorded')}</td><td>${managers.length ? managers.map(manager => `<div class="pm-manager-cell"><span class="pm-mini-avatar">${pmEscape(pmInitials(manager.name))}</span>${pmEscape(manager.name || 'Unknown')}</div>`).join('') : '<span class="pm-muted">Unassigned</span>'}</td><td>${pmEscape(pmDate(project.startDate))}</td><td><strong>${progress}%</strong><div class="pm-progress"><span style="width:${progress}%"></span></div></td><td><span class="pm-badge pm-${status.key}">${status.label}</span></td></tr>`;
}
function pmRenderStats() {
  const active = pmState.managers.filter(manager => manager.status === 'active').length;
  const ongoing = pmState.projects.filter(project => project.status === 'in_progress').length;
  const year = new Date().getFullYear(); const thisYear = pmState.projects.filter(project => project.completedAt && new Date(project.completedAt).getFullYear() === year).length;
  const across = pmState.managers.reduce((sum, manager) => sum + pmManagerProjects(pmId(manager)).length, 0);
  const cards = [['Active', active, 'Managers', '<i class="fa-solid fa-user-tie"></i>'], ['Ongoing', ongoing, 'Projects', '<i class="fa-solid fa-arrow-trend-up"></i>'], ['This Year', thisYear, 'Completed', '<i class="fa-solid fa-check"></i>'], ['Across Projects', across, 'Manager assignments', '<i class="fa-solid fa-diagram-project"></i>'], ['From Client Feedback', pmState.overallReviewCount ? `${pmState.overallRating.toFixed(1)}/5` : 'No ratings', `${pmState.overallReviewCount} reviews`, '<i class="fa-solid fa-star"></i>']];
  document.getElementById('pm-stats').innerHTML = cards.map(([label, value, sub, icon]) => `<div class="pm-stat"><div class="pm-stat-icon">${icon}</div><div><div class="pm-stat-label">${label}</div><div class="pm-stat-value">${value}</div><div class="pm-stat-sub">${sub}</div></div></div>`).join('');
}
function pmRenderManagers() {
  const rows = pmState.showAllManagers ? pmState.managers : pmState.managers.slice(0, 5);
  document.getElementById('pm-managers').innerHTML = rows.length ? rows.map(pmManagerRow).join('') : '<div class="pm-empty">No canonical managers have been recorded.</div>';
  document.getElementById('pm-all-managers').textContent = pmState.showAllManagers ? 'Show Fewer' : 'View All Managers';
}
function pmRenderProjects() {
  const rows = pmState.showAllProjects ? pmState.projects : pmState.projects.slice(0, 7);
  document.getElementById('pm-projects').innerHTML = rows.length ? rows.map(pmProjectRow).join('') : '<tr><td colspan="6" class="pm-empty">No canonical farm projects have been recorded.</td></tr>';
  document.getElementById('pm-all-projects').textContent = pmState.showAllProjects ? 'Show Fewer' : 'View All Projects';
}
function pmRenderDistribution() {
  const colors = { completed: '#16a34a', 'in-progress': '#3b82f6', delayed: '#ef4444', 'at-risk': '#f59e0b', 'not-started': '#98a2b3', cancelled: '#7f1d1d' };
  const labels = { completed: 'Completed', 'in-progress': 'In Progress', delayed: 'Delayed', 'at-risk': 'At Risk', 'not-started': 'Not Started', cancelled: 'Cancelled' };
  const counts = Object.fromEntries(Object.keys(colors).map(key => [key, 0])); pmState.projects.forEach(project => { counts[pmDisplayStatus(project).key] += 1; });
  const total = pmState.projects.length; let cursor = 0; const parts = Object.keys(colors).map(key => { const start = cursor; cursor += total ? counts[key] / total * 100 : 0; return `${colors[key]} ${start}% ${cursor}%`; });
  document.getElementById('pm-donut').style.background = total ? `conic-gradient(${parts.join(',')})` : '#eef0f3'; document.getElementById('pm-donut-total').innerHTML = `${total}<small>PROJECTS</small>`;
  document.getElementById('pm-legend').innerHTML = Object.keys(colors).map(key => `<div class="pm-legend-row"><span class="pm-dot" style="background:${colors[key]}"></span><span>${labels[key]}</span><strong>${counts[key]}</strong></div>`).join('');
}
function pmPerformance(manager) {
  const projects = pmManagerProjects(pmId(manager)); const active = projects.filter(project => !['completed', 'cancelled'].includes(project.status));
  // Performance progress is average percentComplete across active assigned projects; all-completed portfolios show 100%.
  const progress = active.length ? Math.round(active.reduce((sum, project) => sum + Number(project.percentComplete || 0), 0) / active.length) : (projects.length && projects.every(project => project.status === 'completed') ? 100 : 0);
  const rating = pmState.ratings.get(pmId(manager)); return { progress, projects, rating };
}
function pmRenderPerformance() {
  const managers = (pmState.showAllPerformance ? pmState.managers : pmState.managers.slice(0, 5));
  document.getElementById('pm-performance').innerHTML = managers.length ? managers.map(manager => { const data = pmPerformance(manager); return `<div class="pm-perf"><div class="pm-avatar" style="width:34px;height:34px">${pmEscape(pmInitials(manager.name))}</div><div><div class="pm-name">${pmEscape(manager.name)}</div><div class="pm-muted">${data.projects.length} projects</div></div><div><div class="pm-perf-bar"><span style="width:${data.progress}%"></span></div><div class="pm-muted">${data.progress}% active progress</div></div><div class="pm-rating">${data.rating?.reviewCount ? `<i class="fa-solid fa-star"></i> ${Number(data.rating.averageRating).toFixed(1)}` : 'No rating'}</div></div>`; }).join('') : '<div class="pm-empty">No manager performance data yet.</div>';
  document.getElementById('pm-all-performance').textContent = pmState.showAllPerformance ? 'Show Fewer' : 'View Detailed Performance';
}
function pmRenderActivities() {
  const rows = pmState.showAllActivities ? pmState.activities : pmState.activities.slice(0, 5);
  document.getElementById('pm-activities').innerHTML = rows.length ? rows.map(update => `<div class="pm-activity"><div class="pm-activity-icon"><i class="fa-solid fa-check"></i></div><div><div class="pm-activity-note">${pmEscape(update.note)}</div><div class="pm-activity-meta">${pmEscape(update.farmId?.name || 'Unknown farm')} · ${pmEscape(update.createdBy?.name || 'Unknown author')}</div></div><div class="pm-activity-time">${pmEscape(pmRelative(update.createdAt))}</div></div>`).join('') : '<div class="pm-empty">No recent work updates.</div>';
  document.getElementById('pm-all-activities').textContent = pmState.showAllActivities ? 'Show Fewer' : 'View All';
}
function pmBind() {
  document.getElementById('pm-all-managers').addEventListener('click', () => { pmState.showAllManagers = !pmState.showAllManagers; pmRenderManagers(); });
  document.getElementById('pm-all-projects').addEventListener('click', () => { pmState.showAllProjects = !pmState.showAllProjects; pmRenderProjects(); });
  document.getElementById('pm-all-performance').addEventListener('click', () => { pmState.showAllPerformance = !pmState.showAllPerformance; pmRenderPerformance(); });
  document.getElementById('pm-all-activities').addEventListener('click', () => { pmState.showAllActivities = !pmState.showAllActivities; pmRenderActivities(); });
}
async function pmInit() {
  pmBind();
  try {
    const [managerResult, farmResult, performance, activityResult] = await Promise.all([pmFetch('/managers?limit=100'), pmFetch('/farms?limit=100'), pmFetch('/managers/performance'), pmFetch('/work-updates/recent?limit=10')]);
    pmState.managers = managerResult.data || []; pmState.farms = farmResult.data || []; pmState.overallRating = Number(performance.overallAverageRating || 0); pmState.overallReviewCount = Number(performance.overallReviewCount || 0); pmState.ratings = new Map((performance.managers || []).map(row => [pmId(row.managerId), row])); pmState.activities = activityResult.data || [];
    // Farm projects and manager assignment histories are loaded concurrently to avoid sequential N+1 latency.
    const [projectResults, historyResults] = await Promise.all([
      Promise.allSettled(pmState.farms.map(farm => pmFetch(`/farms/${pmId(farm)}/projects?limit=100`))),
      Promise.allSettled(pmState.managers.map(manager => pmFetch(`/managers/${pmId(manager)}/farms`)))
    ]);
    pmState.projects = projectResults.filter(result => result.status === 'fulfilled').flatMap(result => result.value.data || []).sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
    historyResults.forEach((result, index) => { if (result.status === 'fulfilled') pmState.histories.set(pmId(pmState.managers[index]), result.value.assignments || []); });
    pmRenderStats(); pmRenderManagers(); pmRenderProjects(); pmRenderDistribution(); pmRenderPerformance(); pmRenderActivities();
  } catch (error) {
    document.getElementById('pm-projects').innerHTML = `<tr><td colspan="6"><div class="pm-error">${pmEscape(error.message)}</div></td></tr>`;
    ['pm-managers', 'pm-performance', 'pm-activities'].forEach(id => { document.getElementById(id).innerHTML = `<div class="pm-error">${pmEscape(error.message)}</div>`; });
  }
}

function viewProjectManager() {
  pmInjectStyles(); Object.assign(pmState, { managers: [], farms: [], projects: [], histories: new Map(), ratings: new Map(), overallRating: 0, overallReviewCount: 0, activities: [], showAllManagers: false, showAllProjects: false, showAllPerformance: false, showAllActivities: false }); setTimeout(pmInit, 0);
  return `<div class="pm-page"><div id="pm-stats" class="pm-stats">${Array.from({ length: 5 }, () => '<div class="pm-stat"><div class="pm-stat-icon">·</div><div><div class="pm-stat-value">—</div><div class="pm-muted">Loading real data…</div></div></div>').join('')}</div><div class="pm-top"><section class="pm-card"><div class="pm-head"><span class="pm-title">Project Managers</span><button id="pm-all-managers" class="pm-link">View All Managers</button></div><div id="pm-managers"><div class="pm-loading">Loading canonical managers…</div></div></section><section class="pm-card"><div class="pm-head"><span class="pm-title">Project Assignment Overview</span><button id="pm-all-projects" class="pm-link">View All Projects</button></div><div class="pm-table-wrap"><table class="pm-table"><thead><tr><th>Project / Farm</th><th>Location</th><th>Project Manager</th><th>Start Date</th><th>Progress</th><th>Status</th></tr></thead><tbody id="pm-projects"><tr><td colspan="6" class="pm-loading">Loading canonical projects…</td></tr></tbody></table></div></section></div><div class="pm-bottom"><section class="pm-card"><div class="pm-head"><span class="pm-title">Projects by Status</span></div><div class="pm-donut-body"><div id="pm-donut" class="pm-donut"><div id="pm-donut-total" class="pm-donut-center">—<small>PROJECTS</small></div></div><div id="pm-legend" class="pm-legend"><span class="pm-muted">Loading distribution…</span></div></div></section><section class="pm-card"><div class="pm-head"><span class="pm-title">Upcoming Site Visits</span></div><div class="pm-gap-empty"><div><strong>Site visit scheduling is not yet tracked in the system</strong><div class="pm-muted" style="margin-top:6px">No visit dates or inspections are fabricated here.</div></div></div></section><section class="pm-card"><div class="pm-head"><span class="pm-title">Manager Performance</span></div><div id="pm-performance"><div class="pm-loading">Loading real performance…</div></div><div class="pm-footer"><button id="pm-all-performance" class="pm-link">View Detailed Performance</button></div></section></div><section class="pm-card"><div class="pm-head"><span class="pm-title">Recent Activities</span><button id="pm-all-activities" class="pm-link">View All</button></div><div id="pm-activities"><div class="pm-loading">Loading recent work updates…</div></div></section></div>`;
}
