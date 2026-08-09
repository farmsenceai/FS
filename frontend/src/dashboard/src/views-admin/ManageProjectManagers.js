/* views-admin/ManageProjectManagers.js */

window.metaManageProjectManagers = {
  title: 'Manage Project Managers',
  subtitle: 'Live project manager accounts, assignments, ratings, and account status.'
};

function injectManageProjectManagersStyles() {
  if (document.getElementById('apm-styles')) return;
  const style = document.createElement('style');
  style.id = 'apm-styles';
  style.textContent = `
    .apm-page,.apm-page *{box-sizing:border-box}.apm-page{padding:20px;background:#f5f6fa;min-height:100%;font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#172033}.apm-toolbar,.apm-tools,.apm-actions,.apm-footer{display:flex;align-items:center;gap:8px}.apm-toolbar{justify-content:space-between;margin-bottom:14px}.apm-tools{flex-wrap:wrap}.apm-page button,.apm-page input,.apm-page select{font:inherit}.apm-page button{border:1px solid #dfe3ea;background:#fff;border-radius:7px;padding:7px 11px;cursor:pointer}.apm-page button.primary{background:#16a34a;color:#fff;border-color:#16a34a}.apm-page button.danger{color:#dc2626}.apm-page button:disabled{opacity:.5;cursor:wait}.apm-tools input,.apm-tools select,.apm-form input,.apm-form select{border:1px solid #d9dee8;border-radius:7px;padding:8px;background:#fff}.apm-tools input{min-width:220px}.apm-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px}.apm-stat,.apm-card{background:#fff;border:1px solid #e8eaf0;border-radius:10px}.apm-stat{padding:14px}.apm-stat strong,.apm-stat span,.apm-stat small{display:block}.apm-stat strong{font-size:19px}.apm-stat span{color:#667085;margin-top:2px}.apm-stat small{color:#98a2b3;font-size:10px;margin-top:2px}.apm-card{overflow:hidden}.apm-card>header,.apm-footer{justify-content:space-between;padding:12px 15px}.apm-card>header{border-bottom:1px solid #eef0f3}.apm-card h3{margin:0;font-size:13px}.apm-table-wrap{overflow:auto}.apm-table{width:100%;border-collapse:collapse}.apm-table th{padding:9px 12px;text-align:left;background:#f9fafb;color:#667085;font-size:10px;text-transform:uppercase;white-space:nowrap}.apm-table td{padding:10px 12px;border-top:1px solid #f1f3f5;font-size:11px;white-space:nowrap}.apm-person{display:flex;align-items:center;gap:9px}.apm-avatar{width:31px;height:31px;border-radius:50%;display:grid;place-items:center;background:#d1fae5;color:#047857;font-weight:700}.apm-person strong,.apm-person small{display:block}.apm-person small{color:#98a2b3}.apm-badge{padding:3px 8px;border-radius:5px;font-size:9px;font-weight:700}.apm-badge.active{background:#d1fae5;color:#047857}.apm-badge.suspended{background:#fee2e2;color:#b91c1c}.apm-star{color:#f59e0b}.apm-actions button{font-size:9px;padding:4px 7px}.apm-footer{color:#8b93a5;font-size:10px}.apm-empty{text-align:center;color:#8b93a5;padding:26px}.apm-modal-host{display:none}.apm-modal-host.open{display:block;position:fixed;inset:0;z-index:1000}.apm-backdrop{position:absolute;inset:0;background:#11182788}.apm-modal{position:relative;background:#fff;width:min(650px,calc(100% - 28px));max-height:90vh;overflow:auto;margin:5vh auto;border-radius:12px;box-shadow:0 24px 70px #0003}.apm-modal>header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #e8eaf0}.apm-modal h3{margin:0}.apm-modal>header button{border:0;font-size:20px}.apm-modal-body{padding:16px}.apm-form{display:grid;grid-template-columns:1fr 1fr;gap:11px}.apm-form label{display:flex;flex-direction:column;gap:5px;font-size:11px;font-weight:600;color:#475467}.apm-form label.full{grid-column:1/-1}.apm-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}@media(max-width:850px){.apm-stats{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.apm-page{padding:12px}.apm-toolbar{align-items:stretch;flex-direction:column}.apm-stats,.apm-form{grid-template-columns:1fr}.apm-form label.full{grid-column:auto}}
  `;
  document.head.appendChild(style);
}

function viewManageProjectManagers() {
  injectManageProjectManagersStyles();
  setTimeout(apmInit, 0);
  return `
    <div class="apm-page" id="apm-root">
      <div id="apm-feedback"></div>
      <div class="apm-toolbar"><div><strong>Project manager directory</strong><div style="font-size:10px;color:#8b93a5">MongoDB-backed platform records</div></div><div class="apm-tools"><input type="search" id="apm-search" placeholder="Search managers…"><select id="apm-status"><option value="all">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></select><button id="apm-refresh">Refresh</button><button class="primary" id="apm-add">Add Project Manager</button></div></div>
      <div class="apm-stats"><div class="apm-stat"><strong id="apm-total">—</strong><span>Total PMs</span><small>Across all businesses</small></div><div class="apm-stat"><strong id="apm-projects">—</strong><span>Active Projects</span><small>Current assignments</small></div><div class="apm-stat"><strong id="apm-rating">—</strong><span>Average Rating</span><small>Recorded feedback</small></div><div class="apm-stat"><strong id="apm-suspended">—</strong><span>Suspended</span><small>Account status</small></div></div>
      <section class="apm-card"><header><h3>All Project Managers</h3><span id="apm-result-count"></span></header><div class="apm-table-wrap"><table class="apm-table"><thead><tr><th>Manager</th><th>Business</th><th>Role</th><th>Active Projects</th><th>Rating</th><th>Status</th><th>Actions</th></tr></thead><tbody id="apm-body"><tr><td colspan="7" class="apm-empty">Loading project managers…</td></tr></tbody></table></div><footer class="apm-footer"><span id="apm-page-info"></span><div><button id="apm-prev">Previous</button><button id="apm-next">Next</button></div></footer></section>
      <div class="apm-modal-host" id="apm-modal"><div class="apm-backdrop" data-apm-close></div><div class="apm-modal"><header><h3 id="apm-modal-title">Add Project Manager</h3><button data-apm-close>×</button></header><div class="apm-modal-body"><div class="apm-form"><label>Name<input id="apm-name" required></label><label>Email<input id="apm-email" type="email" required></label><label>Phone<input id="apm-phone" required></label><label>Role / Title<input id="apm-role" value="Project Manager"></label><label>Business<select id="apm-business"><option value="">Not assigned</option></select></label><label>Team size<input id="apm-team-size" type="number" min="0" value="0"></label></div><div class="apm-modal-actions"><button data-apm-close>Cancel</button><button class="primary" id="apm-save">Save Project Manager</button></div></div></div></div>
    </div>`;
}

let apmState = { page:1,totalPages:1,search:'',status:'all',editingId:null,managers:new Map(),businesses:[] };

function apmInit() {
  const root = document.getElementById('apm-root'); if (!root) return;
  apmState = { page:1,totalPages:1,search:'',status:'all',editingId:null,managers:new Map(),businesses:[] };
  root.addEventListener('click', async event => {
    const button = event.target.closest('button'); if (!button) return;
    try {
      if (button.id === 'apm-add') apmOpen();
      else if (button.id === 'apm-refresh') await apmLoad();
      else if (button.id === 'apm-save') await apmSave(button);
      else if (button.id === 'apm-prev' && apmState.page > 1) { apmState.page -= 1; await apmLoad(); }
      else if (button.id === 'apm-next' && apmState.page < apmState.totalPages) { apmState.page += 1; await apmLoad(); }
      else if (button.dataset.apmEdit) apmOpen(apmState.managers.get(button.dataset.apmEdit));
      else if (button.dataset.apmStatus) await apmToggleStatus(button.dataset.apmStatus, button.dataset.status);
      else if (button.hasAttribute('data-apm-close')) apmClose();
    } catch (error) { FarmSenseAdminApi.feedback('apm-feedback', error.message, 'error'); }
  });
  document.getElementById('apm-search').addEventListener('input', FarmSenseAdminApi.debounce(event => { apmState.search=event.target.value.trim();apmState.page=1;apmLoad(); }));
  document.getElementById('apm-status').addEventListener('change', event => { apmState.status=event.target.value;apmState.page=1;apmLoad(); });
  Promise.all([apmLoadBusinesses(), apmLoad()]).catch(error => FarmSenseAdminApi.feedback('apm-feedback',error.message,'error'));
}

async function apmLoadBusinesses() {
  const result = await FarmSenseAdminApi.request('/businesses?status=all&limit=100');
  apmState.businesses = result.data || [];
  const select = document.getElementById('apm-business');
  select.innerHTML = '<option value="">Not assigned</option>' + apmState.businesses.map(item => `<option value="${item.id}">${FarmSenseAdminApi.escapeHTML(item.displayName || item.legalName)}</option>`).join('');
}

async function apmLoad() {
  const body=document.getElementById('apm-body'); if(!body)return;
  body.innerHTML='<tr><td colspan="7" class="apm-empty">Loading project managers…</td></tr>';
  const params=new URLSearchParams({page:apmState.page,limit:20,status:apmState.status});if(apmState.search)params.set('search',apmState.search);
  try {
    const result=await FarmSenseAdminApi.request(`/project-managers?${params}`); const stats=result.stats||{}; const rows=result.data||[];
    document.getElementById('apm-total').textContent=stats.total??0;document.getElementById('apm-projects').textContent=stats.activeProjects??0;document.getElementById('apm-rating').textContent=stats.averageRating==null?'No ratings':`${stats.averageRating}/5`;document.getElementById('apm-suspended').textContent=stats.suspended??0;
    apmState.totalPages=result.meta?.totalPages||1;apmState.managers=new Map(rows.map(item=>[String(item.id),item]));document.getElementById('apm-result-count').textContent=`${result.meta?.total||0} records`;
    body.innerHTML=rows.length?rows.map(item=>`<tr><td><div class="apm-person"><div class="apm-avatar">${FarmSenseAdminApi.initials(item.name)}</div><span><strong>${FarmSenseAdminApi.escapeHTML(item.name)}</strong><small>${FarmSenseAdminApi.escapeHTML(item.email)}</small></span></div></td><td>${FarmSenseAdminApi.escapeHTML(item.business?.name||'Not assigned')}</td><td>${FarmSenseAdminApi.escapeHTML(item.role)}</td><td>${item.activeProjects||0}</td><td><span class="apm-star">★</span> ${item.rating??'Not rated'}</td><td><span class="apm-badge ${item.status}">${FarmSenseAdminApi.label(item.status)}</span></td><td><div class="apm-actions"><button data-apm-edit="${item.id}">Edit</button><button class="${item.status==='active'?'danger':''}" data-apm-status="${item.id}" data-status="${item.status}">${item.status==='active'?'Suspend':'Activate'}</button></div></td></tr>`).join(''):'<tr><td colspan="7" class="apm-empty">No project managers match these filters.</td></tr>';
    document.getElementById('apm-page-info').textContent=`Page ${result.meta?.page||1} of ${apmState.totalPages}`;document.getElementById('apm-prev').disabled=apmState.page<=1;document.getElementById('apm-next').disabled=apmState.page>=apmState.totalPages;
  } catch(error){body.innerHTML=`<tr><td colspan="7" class="apm-empty" style="color:#b91c1c">${FarmSenseAdminApi.escapeHTML(error.message)}</td></tr>`;FarmSenseAdminApi.feedback('apm-feedback',error.message,'error');}
}

function apmOpen(manager=null){apmState.editingId=manager?.id||null;document.getElementById('apm-modal-title').textContent=manager?'Edit Project Manager':'Add Project Manager';document.getElementById('apm-name').value=manager?.name||'';document.getElementById('apm-email').value=manager?.email||'';document.getElementById('apm-phone').value=manager?.phone||'';document.getElementById('apm-role').value=manager?.role||'Project Manager';document.getElementById('apm-business').value=manager?.business?.id||'';document.getElementById('apm-team-size').value=manager?.teamSize||0;document.getElementById('apm-modal').classList.add('open');}
function apmClose(){document.getElementById('apm-modal')?.classList.remove('open');}

async function apmSave(button){const payload={name:document.getElementById('apm-name').value,email:document.getElementById('apm-email').value,phone:document.getElementById('apm-phone').value,role:document.getElementById('apm-role').value,businessId:document.getElementById('apm-business').value||null,teamSize:Number(document.getElementById('apm-team-size').value)||0};button.disabled=true;try{await FarmSenseAdminApi.request(apmState.editingId?`/project-managers/${apmState.editingId}`:'/project-managers',{method:apmState.editingId?'PATCH':'POST',body:JSON.stringify(payload)});apmClose();FarmSenseAdminApi.feedback('apm-feedback',apmState.editingId?'Project manager updated successfully.':'Project manager created successfully.');await apmLoad();}finally{button.disabled=false;}}

async function apmToggleStatus(id,currentStatus){const status=currentStatus==='active'?'suspended':'active';if(!confirm(`${FarmSenseAdminApi.label(status)} this project manager?`))return;await FarmSenseAdminApi.request(`/project-managers/${id}/status`,{method:'PATCH',body:JSON.stringify({status})});FarmSenseAdminApi.feedback('apm-feedback',`Project manager ${status} successfully.`);await apmLoad();}
