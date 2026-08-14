/* views/DownloadReports.js */

window.metaDownloadReports = {
  title: 'Download Reports',
  subtitle: 'Generate and export your farm data as PDF or Excel.'
};

/* ── Helper functions ── */

function statCard(icon, bg, label, value, sub, trend, change) {
  const isUp = trend === 'up';
  const trendColor = isUp ? '#16a34a' : '#ef4444';
  const trendArrow = `<i class="fa-solid fa-arrow-trend-${isUp ? 'up' : 'down'}"></i>`;
  return `
    <div class="db-stat-card">
      <div class="db-stat-icon" style="background:${bg}">${icon}</div>
      <div class="db-stat-label">${label}</div>
      <div class="db-stat-value">${value}</div>
      <div class="db-stat-sub">${sub}</div>
      <div class="db-stat-trend" style="color:${trendColor}">${trendArrow} ${change}</div>
    </div>`;
}

function documentRow(icon, name, version, project, batch, type, uploadedOn, time, uploadedBy, avatar, id = '') {
  const typeColors = {
    'DPR': '#dc2626',
    'Agreement': '#16a34a',
    'BOQ': '#16a34a',
    'Drawing': '#ea580c',
    'Design': '#2563eb',
    'Estimate': '#ea580c',
    'Legal': '#d97706',
    'NOC': '#059669'
  };
  const typeBg = {
    'DPR': '#fee2e2',
    'Agreement': '#dcfce7',
    'BOQ': '#dcfce7',
    'Drawing': '#fff7ed',
    'Design': '#dbeafe',
    'Estimate': '#fff7ed',
    'Legal': '#fef3c7',
    'NOC': '#d1fae5'
  };
  const bgColor = typeBg[type] || '#f3f4f6';
  const textColor = typeColors[type] || '#6b7280';
  return `
    <tr>
      <td><span style="display:inline-flex;align-items:center;gap:8px;"><span style="color:#dc2626;font-size:14px;">${icon}</span><div><strong>${name}</strong><br><span style="color:#9ca3af;font-size:11px;">${version}</span></div></span></td>
      <td><strong>${project}</strong><br><span style="color:#9ca3af;font-size:11px;">${batch}</span></td>
      <td><span style="display:inline-flex;align-items:center;padding:3px 8px;border-radius:4px;background:${bgColor};color:${textColor};font-size:10px;font-weight:700;">${type}</span></td>
      <td>${uploadedOn}<br><span style="color:#9ca3af;font-size:11px;">${time}</span></td>
      <td><span style="display:flex;align-items:center;gap:6px;"><span style="width:24px;height:24px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:12px;">${avatar}</span>${uploadedBy}</span></td>
      <td style="text-align:center;"><button class="db-dpr-btn db-dpr-btn-secondary" style="padding:5px 9px" data-dr-download="${drEscape(id)}">Download</button></td>
    </tr>`;
}

let drState = { documents: [], filtered: [], page: 1, pageSize: 8, dashboard: null, history: null, user: null, downloads: 0 };
function drEscape(value) { return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
function drDate(value, withTime = false) { if (!value) return 'Not available'; const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString('en-IN', withTime ? { dateStyle:'medium', timeStyle:'short' } : { dateStyle:'medium' }); }
function drNumber(value, digits = 0) { return value === null || value === undefined || !Number.isFinite(Number(value)) ? 'Not available' : Number(value).toLocaleString('en-IN',{maximumFractionDigits:digits}); }
function drCsvCell(value) { const text=String(value??''); return /[",\n]/.test(text)?`"${text.replace(/"/g,'""')}"`:text; }
function drDownloadBlob(name, content, type) { const url=URL.createObjectURL(new Blob([content],{type})); const link=document.createElement('a'); link.href=url; link.download=name; document.body.appendChild(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000); }

async function drFetch(path) {
  const response = await fetch(path, { headers: { Authorization: `Bearer ${localStorage.getItem('fs_token') || ''}` } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || body.msg || `Unable to load report data (${response.status})`);
  return body;
}

function drRange() { const to=new Date(), from=new Date(to); from.setUTCDate(from.getUTCDate()-729); return `from=${from.toISOString().slice(0,10)}&to=${to.toISOString().slice(0,10)}&granularity=month`; }
function drBuildDocuments(dashboard, history) {
  const generatedAt=dashboard.generatedAt || history.generatedAt || new Date().toISOString();
  const docs=[{id:'portfolio',name:'Farm Portfolio Report.xls',version:'Current',project:'All Farms',batch:`${dashboard.counts?.farms||0} farms`,type:'DPR',date:generatedAt,author:'FarmSence.ai',kind:'portfolio'}];
  if (dashboard.farm) docs.push({id:'live',name:`${dashboard.farm.name} - Live Operations.xls`,version:'Latest record',project:dashboard.farm.name,batch:dashboard.batch?.code||'No active batch',type:'Estimate',date:dashboard.latestRecord?.recordDate||generatedAt,author:'FarmSence.ai',kind:'live'});
  (history.batches||[]).forEach(row=>docs.push({id:`batch-${row.batchId}`,name:`${row.batchCode} - Completed Batch Report.xls`,version:'Canonical',project:row.farmName||row.farmCode||'Farm',batch:row.batchCode,type:'DPR',date:row.actualHarvestAt,author:'FarmSence.ai',kind:'batch',row}));
  return docs;
}

function drRowsForDocument(doc) {
  if (doc.kind==='batch') { const r=doc.row,o=r.operations||{},f=r.financials||{}; return [['Farm',r.farmName||r.farmCode],['Batch',r.batchCode],['Placed',drDate(r.placedAt)],['Completed',drDate(r.actualHarvestAt)],['Initial birds',r.initialBirdCount],['Cycle days',r.cycleDays],['Mortality percent',o.mortalityPercent],['Livability percent',o.livabilityPercent],['Estimated FCR',o.estimatedFcr],['Latest weight kg',o.latestAvgWeightKg],['Feed consumed kg',o.totalFeedKg],['Revenue',f.revenue],['Direct expenses',f.directExpenses],['Direct profit',f.directProfit]]; }
  const d=drState.dashboard;
  if(doc.kind==='live') return [['Farm',d.farm?.name],['Farm code',d.farm?.code],['Status',d.farm?.status],['Batch',d.batch?.code],['Batch status',d.batch?.status],['Current birds',d.batch?.currentBirds],['Record date',drDate(d.latestRecord?.recordDate)],['Feed kg',d.latestRecord?.feedKg],['Water liters',d.latestRecord?.waterLiters],['Mortality count',d.latestRecord?.mortalityCount],['Temperature C',d.latestRecord?.temperatureC],['Humidity percent',d.latestRecord?.humidityPct],['Ammonia ppm',d.latestRecord?.ammoniaPpm],['CO2 ppm',d.latestRecord?.co2Ppm]];
  return [['Generated',drDate(d.generatedAt,true)],['Farm count',d.counts?.farms],['Batch count',d.counts?.batches],['Active batches',d.counts?.activeBatches],['Projects',d.counts?.projects],['Revenue',d.finance?.revenue],['Expenses',d.finance?.expenses],['Profit',d.finance?.profit]];
}

function drDownloadDocument(id) { const doc=drState.documents.find(item=>item.id===id); if(!doc)return; const rows=drRowsForDocument(doc); const html=`<table><tr><th colspan="2">${drEscape(doc.name.replace(/\.xls$/,''))}</th></tr>${rows.map(([k,v])=>`<tr><td>${drEscape(k)}</td><td>${drEscape(v)}</td></tr>`).join('')}</table>`; drDownloadBlob(doc.name,html,'application/vnd.ms-excel;charset=utf-8'); drState.downloads+=1; drRenderStats(); drAddActivity(`Downloaded ${doc.name}`); }
function drPrintDpr() { const doc=drState.documents.find(item=>item.kind==='live')||drState.documents[0]; if(!doc)return; const rows=drRowsForDocument(doc), win=window.open('','_blank'); if(!win)return drShowStatus('Allow pop-ups to preview this report.','error'); win.document.write(`<!doctype html><title>${drEscape(doc.name)}</title><style>body{font:14px Arial;padding:32px;color:#17202a}h1{color:#166534}table{border-collapse:collapse;width:100%}td{border:1px solid #ddd;padding:9px}td:first-child{font-weight:bold;width:35%}@media print{button{display:none}}</style><h1>FarmSence.ai</h1><h2>${drEscape(doc.name.replace(/\.xls$/,''))}</h2><p>Generated ${drDate(new Date(),true)}</p><table>${rows.map(([k,v])=>`<tr><td>${drEscape(k)}</td><td>${drEscape(v)}</td></tr>`).join('')}</table><p><button onclick="print()">Print / Save as PDF</button></p>`); win.document.close(); }
function drShowStatus(message,type='success'){let box=document.getElementById('dr-status');if(!box){box=document.createElement('div');box.id='dr-status';box.style.cssText='margin-bottom:12px;padding:10px 14px;border-radius:7px';document.querySelector('.db-scrollable')?.prepend(box);}box.textContent=message;box.style.background=type==='error'?'#fef2f2':'#f0fdf4';box.style.color=type==='error'?'#991b1b':'#166534';}
function drAddActivity(message){const activity=document.getElementById('dr-activity');if(activity)activity.insertAdjacentHTML('afterbegin',activityItem('D',drEscape(message),drDate(new Date(),true)));}

function drRenderStats() {
  const root=document.getElementById('dr-stats'); if(!root)return;
  const batches=drState.history?.batches||[], issueIds=new Set((drState.history?.qualityWorkQueue||[]).map(item=>String(item.batchId)));
  const verified=batches.length ? Math.round(batches.filter(item=>!issueIds.has(String(item.batchId))).length/batches.length*100) : 0;
  root.innerHTML=`${statCard('', '#dcfce7', 'Total Documents', drState.documents.length, 'Generated canonical reports', 'up', '')}${statCard('', '#e9d5ff', 'DPR Documents', batches.length, 'Completed batch reports', 'up', '')}${statCard('', '#fce7f3', 'Downloaded', drState.downloads, 'This session', 'up', '')}${statCard('', '#fed7aa', 'Verified Documents', `${verified}%`, 'Complete canonical records', 'up', '')}${statCard('', '#cffafe', 'Storage Used', '0 MB', 'Generated on demand', 'up', '')}`;
}

function drApplyFilters() {
  const search=(document.getElementById('dr-search')?.value||'').trim().toLowerCase(), project=document.getElementById('dr-project-filter')?.value||'', type=document.getElementById('dr-type-filter')?.value||'';
  drState.filtered=drState.documents.filter(doc=>(!search||`${doc.name} ${doc.project} ${doc.batch} ${doc.type}`.toLowerCase().includes(search))&&(!project||doc.project===project)&&(!type||doc.type===type));
  drState.page=1; drRenderDocuments();
}

function drRenderDocuments() {
  const rows=document.getElementById('dr-document-rows'), pager=document.getElementById('dr-pagination'), showing=document.getElementById('dr-showing'); if(!rows)return;
  const total=drState.filtered.length,pages=Math.max(1,Math.ceil(total/drState.pageSize)); drState.page=Math.min(drState.page,pages); const start=(drState.page-1)*drState.pageSize, items=drState.filtered.slice(start,start+drState.pageSize);
  rows.innerHTML=items.length?items.map(doc=>documentRow('D',drEscape(doc.name),drEscape(doc.version),drEscape(doc.project),drEscape(doc.batch),drEscape(doc.type),drDate(doc.date),new Date(doc.date||0).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}),drEscape(doc.author),'F',doc.id)).join(''):'<tr><td colspan="6" style="text-align:center;color:#6b7280">No reports match these filters.</td></tr>';
  pager.innerHTML=`<button class="db-pagination-btn" data-dr-page="${drState.page-1}" ${drState.page===1?'disabled':''}>‹</button>${Array.from({length:pages},(_,i)=>`<button class="db-pagination-btn ${drState.page===i+1?'active':''}" data-dr-page="${i+1}">${i+1}</button>`).join('')}<button class="db-pagination-btn" data-dr-page="${drState.page+1}" ${drState.page===pages?'disabled':''}>›</button>`;
  showing.textContent=`Showing ${total?start+1:0} to ${Math.min(start+drState.pageSize,total)} of ${total} documents`;
  document.querySelectorAll('[data-dr-download]').forEach(button=>button.addEventListener('click',()=>drDownloadDocument(button.dataset.drDownload)));
  document.querySelectorAll('[data-dr-page]').forEach(button=>button.addEventListener('click',()=>{const page=Number(button.dataset.drPage);if(page>=1&&page<=pages){drState.page=page;drRenderDocuments();}}));
}

function drRenderSupportingData() {
  const d=drState.dashboard,h=drState.history,batches=h.batches||[], issues=h.qualityWorkQueue||[], issueIds=new Set(issues.map(item=>String(item.batchId))), ready=batches.filter(item=>!issueIds.has(String(item.batchId))).length, pending=batches.length-ready, percent=batches.length?Math.round(ready/batches.length*100):0, circumference=282.74;
  document.getElementById('dr-dpr-farm').textContent=d.farm?.name||'No active farm'; document.getElementById('dr-dpr-project').textContent=d.farm?.name||'Not available'; document.getElementById('dr-dpr-location').textContent=d.farm?.code||'Location not exposed by report API'; document.getElementById('dr-dpr-capacity').textContent=`${drNumber(d.farm?.capacity?.birdCapacity)} ${d.farm?.farmType||''} birds`; document.getElementById('dr-dpr-type').textContent=d.project?.title||`${d.farm?.farmType||'Poultry'} operations`; document.getElementById('dr-dpr-date').textContent=drDate(d.generatedAt);
  const counts=drState.documents.reduce((map,doc)=>map.set(doc.type,(map.get(doc.type)||0)+1),new Map()); document.getElementById('dr-categories').innerHTML=`${categoryItem('DPR','DPR Documents',counts.get('DPR')||0)}${categoryItem('A','Agreements',counts.get('Agreement')||0)}${categoryItem('B','BOQ & Estimates',counts.get('Estimate')||0)}${categoryItem('L','Legal Documents',counts.get('Legal')||0)}${categoryItem('D','Drawings & Designs',counts.get('Design')||0)}${categoryItem('N','NOC & Approvals',counts.get('NOC')||0)}`;
  document.getElementById('dr-checklist').innerHTML=`<svg class="db-pie-chart" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" stroke-width="12"/><circle cx="50" cy="50" r="45" fill="none" stroke="#16a34a" stroke-width="12" stroke-dasharray="${circumference*percent/100} ${circumference}" transform="rotate(-90 50 50)"/><text x="50" y="45" text-anchor="middle" font-size="14" font-weight="800" fill="#1a1a2e">${percent}%</text><text x="50" y="58" text-anchor="middle" font-size="9" fill="#6b7280">Completed</text></svg><div class="db-pie-legend"><div class="db-pie-legend-item"><div class="db-pie-legend-dot" style="background:#16a34a"></div><span>Completed: ${ready} (${percent}%)</span></div><div class="db-pie-legend-item"><div class="db-pie-legend-dot" style="background:#ea580c"></div><span>Pending data issues: ${pending}</span></div><div class="db-pie-legend-item"><div class="db-pie-legend-dot" style="background:#d1d5db"></div><span>Total completed batches: ${batches.length}</span></div></div>`;
  document.getElementById('dr-activity').innerHTML=`${activityItem('V',`Canonical portfolio refreshed for ${d.counts?.farms||0} farms`,drDate(d.generatedAt,true))}${d.latestRecord?activityItem('U',`Latest operational record received for ${d.batch?.code||'active batch'}`,drDate(d.latestRecord.recordDate,true)):activityItem('U','No active-batch operational record is available','Current state')}${batches.slice(0,3).map(row=>activityItem('D',`${row.batchCode} completed batch report is available`,drDate(row.actualHarvestAt))).join('')}`;
}

async function drInit(user) {
  drState={...drState,user,documents:[],filtered:[],page:1,downloads:0};
  try {
    const [dashboard,history]=await Promise.all([drFetch('/api/v2/business-dashboard'),drFetch(`/api/v2/financial/historical-reports?${drRange()}`)]); drState.dashboard=dashboard;drState.history=history;drState.documents=drBuildDocuments(dashboard,history);drState.filtered=[...drState.documents];
    const projects=[...new Set(drState.documents.map(doc=>doc.project))],types=[...new Set(drState.documents.map(doc=>doc.type))]; document.getElementById('dr-project-filter').innerHTML='<option value="">All Projects</option>'+projects.map(value=>`<option value="${drEscape(value)}">${drEscape(value)}</option>`).join(''); document.getElementById('dr-type-filter').innerHTML='<option value="">All Document Types</option>'+types.map(value=>`<option value="${drEscape(value)}">${drEscape(value)}</option>`).join('');
    drRenderStats();drRenderDocuments();drRenderSupportingData(); document.getElementById('dr-filter').addEventListener('click',drApplyFilters);document.getElementById('dr-search').addEventListener('input',drApplyFilters);document.getElementById('dr-project-filter').addEventListener('change',drApplyFilters);document.getElementById('dr-type-filter').addEventListener('change',drApplyFilters);
    ['dr-download-dpr','dr-preview-dpr','dr-view-summary'].forEach(id=>document.getElementById(id)?.addEventListener('click',event=>{event.preventDefault();drPrintDpr();}));
    document.querySelector('[data-dr-quick="checklist"]')?.addEventListener('click',()=>document.getElementById('dr-checklist')?.scrollIntoView({behavior:'smooth'})); document.querySelector('[data-dr-quick="templates"]')?.addEventListener('click',()=>drDownloadBlob('farmsence-daily-record-template.csv','recordDate,batchCode,feedKg,waterLiters,mortalityCount,avgWeightGrams,temperatureC,humidityPct\n','text/csv')); document.querySelector('[data-dr-quick="request"]')?.addEventListener('click',()=>{window.location.href='mailto:?subject=FarmSence document request&body=Please provide the following farm document:';}); document.querySelector('[data-dr-quick="upload"]')?.addEventListener('click',()=>drShowStatus('Document upload storage is not configured; generated canonical reports remain available for download.','error'));
  } catch(error) { drShowStatus(error.message,'error'); const rows=document.getElementById('dr-document-rows');if(rows)rows.innerHTML=`<tr><td colspan="6">${drEscape(error.message)}</td></tr>`; }
}

function categoryItem(icon, title, count) {
  return `
    <div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #e8eaf0;border-radius:6px;margin-bottom:8px;">
      <div style="width:40px;height:40px;border-radius:8px;background:${icon === 'DPR' ? '#fecaca' : icon === 'Agreements' ? '#fbbf24' : icon === 'BOQ' ? '#86efac' : icon === 'Legal' ? '#fed7aa' : icon === 'Drawings' ? '#bfdbfe' : icon === 'NOC' ? '#d1fae5' : '#e5e7eb'};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${icon.charAt(0)}</div>
      <div style="flex:1;">
        <div style="font-size:12px;font-weight:700;color:#1a1a2e;">${title}</div>
        <div style="font-size:11px;color:#9ca3af;">${count} Files</div>
      </div>
    </div>`;
}

function activityItem(icon, title, time) {
  return `
    <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #f9fafb;align-items:flex-start;">
      <div style="width:32px;height:32px;border-radius:6px;background:#d1fae5;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#059669;font-size:14px;">${icon}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:12px;color:#1a1a2e;margin-bottom:2px;">${title}</div>
        <div style="font-size:10px;color:#9ca3af;">${time}</div>
      </div>
    </div>`;
}

/* ── CSS injected once ── */
function injectDownloadReportsStyles() {
  if (document.getElementById('download-reports-styles')) return;
  const style = document.createElement('style');
  style.id = 'download-reports-styles';
  style.textContent = `
    .db-scrollable { padding: 20px; background: #f5f6fa; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #1a1a2e; }

    /* Stat row */
    .db-stat-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 18px; }
    .db-stat-card { background: #fff; border-radius: 10px; padding: 14px 16px; border: 1px solid #e8eaf0; }
    .db-stat-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; margin-bottom: 8px; }
    .db-stat-label { font-size: 11px; color: #6b7280; margin-bottom: 3px; }
    .db-stat-value { font-size: 22px; font-weight: 800; line-height: 1.1; margin-bottom: 2px; }
    .db-stat-sub { font-size: 10px; color: #9ca3af; }
    .db-stat-trend { font-size: 10px; font-weight: 600; margin-top: 4px; }

    /* Cards */
    .db-card { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; overflow: hidden; margin-bottom: 16px; }
    .db-card-header { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px 10px; border-bottom: 1px solid #f3f4f6; }
    .db-card-title { font-size: 13px; font-weight: 700; }
    .db-card-link { font-size: 11px; color: #16a34a; text-decoration: none; font-weight: 600; }

    /* Two-column layout wrapper */
    .db-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .db-two-col > .db-card { margin-bottom: 0; }

    /* Three-column layout */
    .db-three-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
    .db-three-col > .db-card { margin-bottom: 0; }

    /* Tables */
    .db-table { width: 100%; border-collapse: collapse; }
    .db-table th { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px; padding: 8px 16px; text-align: left; background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
    .db-table td { padding: 9px 16px; font-size: 12px; border-bottom: 1px solid #f9fafb; }
    .db-table tr:last-child td { border-bottom: none; }

    /* Search and filters */
    .db-search-input { width: 100%; padding: 8px 12px; border: 1px solid #e8eaf0; border-radius: 6px; font-size: 12px; background: #fff; }
    .db-search-input::placeholder { color: #9ca3af; }
    .db-select { padding: 6px 10px; border: 1px solid #e8eaf0; border-radius: 6px; font-size: 11px; background: #fff; cursor: pointer; }

    /* Pagination */
    .db-pagination { display: flex; align-items: center; justify-content: center; gap: 4px; padding: 10px 16px; }
    .db-pagination-btn { width: 28px; height: 28px; border: 1px solid #e8eaf0; border-radius: 4px; background: #fff; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .db-pagination-btn.active { background: #16a34a; color: #fff; border-color: #16a34a; }
    .db-pagination-btn:hover { background: #f9fafb; }

    /* DPR section */
    .db-dpr-card { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; overflow: hidden; }
    .db-dpr-image { width: 100%; height: 160px; object-fit: cover; background: #f3f4f6; }
    .db-dpr-header { padding: 14px 16px; border-bottom: 1px solid #f3f4f6; }
    .db-dpr-badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 4px; background: #fef3c7; color: #92400e; font-size: 10px; font-weight: 700; margin-bottom: 6px; }
    .db-dpr-title { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
    .db-dpr-subtitle { font-size: 11px; color: #6b7280; }
    .db-dpr-info { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; }
    .db-dpr-info-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
    .db-dpr-info-item:last-child { margin-bottom: 0; }
    .db-dpr-info-icon { width: 32px; height: 32px; border-radius: 6px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px; }
    .db-dpr-info-label { font-size: 10px; color: #9ca3af; }
    .db-dpr-info-value { font-size: 12px; font-weight: 700; color: #1a1a2e; }
    .db-dpr-actions { padding: 14px 16px; display: flex; gap: 10px; }
    .db-dpr-btn { flex: 1; padding: 8px 12px; border-radius: 6px; border: none; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
    .db-dpr-btn-primary { background: #16a34a; color: #fff; }
    .db-dpr-btn-secondary { background: #f3f4f6; color: #1a1a2e; }

    /* Pie chart */
    .db-pie-wrapper { display: flex; align-items: center; justify-content: center; gap: 20px; padding: 20px 16px; }
    .db-pie-chart { width: 120px; height: 120px; }
    .db-pie-legend { flex: 1; }
    .db-pie-legend-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 11px; }
    .db-pie-legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

    /* Quick actions */
    .db-quick-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 14px 16px; }
    .db-quick-action { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px; border-radius: 6px; background: #f9fafb; text-decoration: none; color: #1a1a2e; cursor: pointer; transition: background 0.2s; }
    .db-quick-action:hover { background: #f3f4f6; }
    .db-quick-action-icon { width: 40px; height: 40px; border-radius: 8px; background: #fff; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .db-quick-action-label { font-size: 11px; font-weight: 600; text-align: center; }
    .db-quick-action-sub { font-size: 9px; color: #9ca3af; text-align: center; }
  `;
  document.head.appendChild(style);
}

/* ── Main view function ── */
function viewDownloadReports(user) {
  injectDownloadReportsStyles();
  setTimeout(() => drInit(user), 0);
  
  const pdfPath = user && user.pdfPath ? window.location.origin + user.pdfPath : '#';
  const displayStyle = user && user.pdfPath ? 'inline-flex' : 'none';

  return `
  <div class="db-scrollable">

    <!-- Stat row -->
    <div class="db-stat-row" id="dr-stats">
      ${statCard('', '#dcfce7', 'Total Documents', '—', 'Loading canonical reports', 'up', '')}
      ${statCard('', '#e9d5ff', 'DPR Documents', '—', 'Completed batch reports', 'up', '')}
      ${statCard('', '#fce7f3', 'Downloaded', '0', 'This session', 'up', '')}
      ${statCard('', '#fed7aa', 'Verified Documents', '—', 'From canonical records', 'up', '')}
      ${statCard('', '#cffafe', 'Storage Used', '0 MB', 'Generated on demand', 'up', '')}
    </div>

    <!-- Two-column: All Documents + DPR -->
    <div class="db-two-col">

      <!-- All Documents -->
      <div class="db-card">
        <div class="db-card-header">
          <span class="db-card-title">All Documents</span>
        </div>
        <div style="padding:14px 16px;border-bottom:1px solid #f3f4f6;">
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px;">
            <input type="text" class="db-search-input" id="dr-search" placeholder="Search documents by name or keyword..." style="flex:1;">
          </div>
          <div style="display:flex;gap:10px;">
            <select class="db-select" id="dr-project-filter">
              <option>All Projects</option>
            </select>
            <select class="db-select" id="dr-type-filter">
              <option>All Document Types</option>
            </select>
            <button id="dr-filter" style="padding:6px 12px;border:1px solid #e8eaf0;border-radius:6px;background:#fff;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;color:#6b7280;">Filter</button>
          </div>
        </div>
        <div style="overflow-x:auto;">
          <table class="db-table" style="min-width:700px;">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Project Name</th>
                <th>Type</th>
                <th>Uploaded On</th>
                <th>Uploaded By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="dr-document-rows"><tr><td colspan="6">Loading canonical report data…</td></tr></tbody>
          </table>
        </div>
        <div class="db-pagination" id="dr-pagination"></div>
        <div id="dr-showing" style="text-align:center;padding:10px;font-size:11px;color:#9ca3af;">Loading documents…</div>
      </div>

      <!-- Detailed Project Report (DPR) -->
      <div style="display:flex;flex-direction:column;gap:16px;">
        <div class="db-dpr-card">
          <div class="db-card-header">
            <span class="db-card-title">Detailed Project Report (DPR)</span>
            <a href="#" class="db-card-link" id="dr-view-summary">View DPR Summary</a>
          </div>
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 160'%3E%3Crect fill='%23f3f4f6' width='300' height='160'/%3E%3Crect fill='%23d1d5db' x='40' y='30' width='220' height='100' rx='4'/%3E%3C/svg%3E" class="db-dpr-image" alt="Farm">
          <div class="db-dpr-header">
            <div class="db-dpr-badge">DETAILED PROJECT REPORT</div>
            <div class="db-dpr-title">POULTRY FARM</div>
            <div class="db-dpr-subtitle" id="dr-dpr-farm">Loading farm…</div>
          </div>
          <div class="db-dpr-info">
            <div class="db-dpr-info-item">
              <div class="db-dpr-info-icon">F</div>
              <div style="flex:1;">
                <div class="db-dpr-info-label">Project Name</div>
                <div class="db-dpr-info-value" id="dr-dpr-project">Loading…</div>
              </div>
            </div>
            <div class="db-dpr-info-item">
              <div class="db-dpr-info-icon">L</div>
              <div style="flex:1;">
                <div class="db-dpr-info-label">Location</div>
                <div class="db-dpr-info-value" id="dr-dpr-location">Loading…</div>
              </div>
            </div>
            <div class="db-dpr-info-item">
              <div class="db-dpr-info-icon">C</div>
              <div style="flex:1;">
                <div class="db-dpr-info-label">Capacity</div>
                <div class="db-dpr-info-value" id="dr-dpr-capacity">Loading…</div>
              </div>
            </div>
            <div class="db-dpr-info-item">
              <div class="db-dpr-info-icon">P</div>
              <div style="flex:1;">
                <div class="db-dpr-info-label">Project Type</div>
                <div class="db-dpr-info-value" id="dr-dpr-type">Loading…</div>
              </div>
            </div>
            <div class="db-dpr-info-item">
              <div class="db-dpr-info-icon">R</div>
              <div style="flex:1;">
                <div class="db-dpr-info-label">Report Version</div>
                <div class="db-dpr-info-value">Live canonical report</div>
              </div>
            </div>
            <div class="db-dpr-info-item">
              <div class="db-dpr-info-icon">D</div>
              <div style="flex:1;">
                <div class="db-dpr-info-label">Date Prepared</div>
                <div class="db-dpr-info-value" id="dr-dpr-date">Loading…</div>
              </div>
            </div>
            <div class="db-dpr-info-item">
              <div class="db-dpr-info-icon">T</div>
              <div style="flex:1;">
                <div class="db-dpr-info-label">Prepared By</div>
                <div class="db-dpr-info-value">Farmsence.ai Engineering Team</div>
              </div>
            </div>
            <div class="db-dpr-info-item">
              <div class="db-dpr-info-icon">S</div>
              <div style="flex:1;">
                <div class="db-dpr-info-label">Status</div>
                <div class="db-dpr-info-value" style="color:#16a34a;font-weight:700;">Approved</div>
              </div>
            </div>
          </div>
          <div class="db-dpr-actions">
            <button class="db-dpr-btn db-dpr-btn-primary" id="dr-download-dpr">
              <span>D</span> Download DPR
            </button>
            <button class="db-dpr-btn db-dpr-btn-secondary" id="dr-preview-dpr">Preview</button>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="db-card">
          <div class="db-card-header">
            <span class="db-card-title">Quick Actions</span>
          </div>
          <div class="db-quick-actions">
            <div class="db-quick-action" data-dr-quick="upload">
              <div class="db-quick-action-icon">U</div>
              <div class="db-quick-action-label">Upload Document</div>
              <div class="db-quick-action-sub">Add new document</div>
            </div>
            <div class="db-quick-action" data-dr-quick="request">
              <div class="db-quick-action-icon">R</div>
              <div class="db-quick-action-label">Request Document</div>
              <div class="db-quick-action-sub">Request from team</div>
            </div>
            <div class="db-quick-action" data-dr-quick="checklist">
              <div class="db-quick-action-icon">C</div>
              <div class="db-quick-action-label">Document Checklist</div>
              <div class="db-quick-action-sub">View requirements</div>
            </div>
            <div class="db-quick-action" data-dr-quick="templates">
              <div class="db-quick-action-icon">T</div>
              <div class="db-quick-action-label">Document Templates</div>
              <div class="db-quick-action-sub">Download templates</div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Three-column: Categories + Checklist + Activity -->
    <div class="db-three-col">

      <!-- Document Categories -->
      <div class="db-card">
        <div class="db-card-header">
          <span class="db-card-title">Document Categories</span>
          <a href="#" class="db-card-link">View All</a>
        </div>
        <div style="padding:14px 16px;" id="dr-categories">Loading categories…</div>
      </div>

      <!-- Document Checklist -->
      <div class="db-card">
        <div class="db-card-header">
          <span class="db-card-title">Document Checklist</span>
          <a href="#" class="db-card-link">View Checklist</a>
        </div>
        <div class="db-pie-wrapper" id="dr-checklist">
          <svg class="db-pie-chart" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#16a34a" stroke-width="12" stroke-dasharray="226.2 377" stroke-dashoffset="0"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="#ea580c" stroke-width="12" stroke-dasharray="60.16 377" stroke-dashoffset="-226.2"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="#d1d5db" stroke-width="12" stroke-dasharray="30.08 377" stroke-dashoffset="-286.36"/>
            <text x="50" y="45" text-anchor="middle" font-size="14" font-weight="800" fill="#1a1a2e">78%</text>
            <text x="50" y="58" text-anchor="middle" font-size="9" fill="#6b7280">Completed</text>
          </svg>
          <div class="db-pie-legend">
            <div class="db-pie-legend-item">
              <div class="db-pie-legend-dot" style="background:#16a34a;"></div>
              <span>Completed: 28 (78%)</span>
            </div>
            <div class="db-pie-legend-item">
              <div class="db-pie-legend-dot" style="background:#ea580c;"></div>
              <span>Pending: 6 (17%)</span>
            </div>
            <div class="db-pie-legend-item">
              <div class="db-pie-legend-dot" style="background:#d1d5db;"></div>
              <span>Not Uploaded: 2 (5%)</span>
            </div>
          </div>
        </div>
        <div style="padding:0 16px 14px;font-size:11px;color:#059669;display:flex;align-items:center;gap:6px;background:#f0fdf4;padding:10px;border-radius:6px;margin:14px 16px 0;">
          <span style="color:#059669;font-size:14px;">C</span>
          <span>All mandatory documents are on track. Keep it up!</span>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="db-card">
        <div class="db-card-header">
          <span class="db-card-title">Recent Activity</span>
          <a href="#" class="db-card-link">View All</a>
        </div>
        <div style="padding:14px 16px;" id="dr-activity">Loading canonical activity…</div>
      </div>

    </div>

  </div>
  `;
}
