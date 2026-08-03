/* views-farmer/Dashboard.js - live rollup of farmer operational APIs */
window.metaDashboard = {
  title: 'My Dashboard',
  subtitle: 'Live overview of your assigned farms and shared operational records.'
};

function fmdMoney(value) {
  const decimal = value && typeof value === 'object' && value.$numberDecimal
    ? value.$numberDecimal
    : value;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(Number(decimal || 0));
}

function fmdEscape(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
}

function fmdUserId(user) {
  return user && (user.id || user._id || user.userId);
}

async function fmdFetch(url) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${localStorage.getItem('fs_token') || ''}` }
  });
  const data = await response.json().catch(() => ({}));
  if ([401, 403].includes(response.status)) {
    window.location.href = '../pages/sign-in.html';
    throw new Error(data.error || data.message || data.msg || 'Your farmer session is not authorized.');
  }
  if (!response.ok) throw new Error(data.error || data.message || data.msg || 'Dashboard request failed.');
  return data;
}

async function fmdFetchAssignedBatches(user) {
  const userId = fmdUserId(user);
  if (!userId) throw new Error('Your signed-in user ID is unavailable. Please sign in again.');

  const assignmentBody = await fmdFetch(`/api/v2/users/${encodeURIComponent(userId)}/assignments`);
  const assignments = assignmentBody.assignments || [];
  const today = fmdTodayRange();

  const farms = await Promise.all(assignments.map(async assignment => {
    const farmId = assignment.farmId?._id || assignment.farmId;
    const [farmBody, facilityBody, batchBody] = await Promise.all([
      fmdFetch(`/api/v2/farms/${farmId}`),
      fmdFetch(`/api/v2/farms/${farmId}/facilities?limit=100`),
      fmdFetch(`/api/v2/farms/${farmId}/batches?limit=100`)
    ]);

    const farm = farmBody.farm || farmBody.data || farmBody;
    const facilities = facilityBody.data || facilityBody.facilities || [];
    const batches = batchBody.data || batchBody.batches || [];
    const batchesWithRecords = await Promise.all(batches.map(async batch => {
      const recordBody = await fmdFetch(`/api/v2/farms/${farmId}/batches/${batch._id}/records?fromDate=${encodeURIComponent(today.start)}&toDate=${encodeURIComponent(today.end)}&limit=100`);
      return {
        ...batch,
        todayRecord: fmdEffectiveRecord(recordBody.data || recordBody.records || [])
      };
    }));

    return {
      farm,
      facilities,
      batches: batchesWithRecords
    };
  }));

  const rows = farms.flatMap(({ farm, facilities, batches }) => batches.map(batch => {
    const facilityId = batch.facilityId?._id || batch.facilityId;
    const facility = facilities.find(item => String(item._id) === String(facilityId));
    const birds = Number(batch.currentBirdCountCached ?? batch.initialBirdCount ?? 0);

    return {
      id: batch._id,
      batchId: batch.code || batch.name || batch._id,
      farm: farm.name || 'Farm',
      shed: facility?.name || facility?.code || '—',
      birds,
      placedAt: batch.placedAt,
      ageDays: fmdAgeDays(batch.placedAt),
      status: batch.status || 'active',
      todayRecord: batch.todayRecord
    };
  }));

  return {
    farms,
    batches: rows,
    summary: fmdBatchSummary(rows),
    checklist: fmdChecklistSummary(rows)
  };
}

function fmdTodayRange() {
  const today = new Date();
  return {
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString(),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString()
  };
}

function fmdEffectiveRecord(records) {
  const primary = records.find(record => !record.correctsRecordId) || null;
  if (!primary) return records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
  return records
    .filter(record => record.correctsRecordId && String(record.correctsRecordId._id || record.correctsRecordId) === String(primary._id))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || primary;
}

function fmdAgeDays(value) {
  if (!value) return '—';
  const placed = new Date(value);
  if (Number.isNaN(placed.getTime())) return '—';
  return Math.max(0, Math.floor((Date.now() - placed.getTime()) / 86400000));
}

function fmdIsActive(status) {
  return String(status || '').toLowerCase() === 'active';
}

function fmdBatchSummary(batches) {
  const active = batches.filter(batch => fmdIsActive(batch.status));
  return {
    activeBatches: active.length,
    completedBatches: batches.length - active.length,
    totalBirds: active.reduce((sum, batch) => sum + batch.birds, 0)
  };
}

function fmdChecklistSummary(batches) {
  const records = batches.map(batch => ({ batch, record: batch.todayRecord })).filter(item => item.record);
  const feedRecords = records.filter(({ record }) => record.feed || record.water);
  const healthRecords = records.filter(({ record }) => record.mortality || record.culls);
  const environmentRecords = records.filter(({ record }) => record.sensorReadings);
  const feedTodayKg = feedRecords.reduce((sum, { record }) => sum + Number(record.feed?.consumedKg || 0), 0);
  const waterTodayLitres = feedRecords.reduce((sum, { record }) => sum + Number(record.water?.consumedLiters || 0), 0);
  const mortalityToday = healthRecords.reduce((sum, { record }) => sum + Number(record.mortality?.count || 0), 0);
  const cullsToday = healthRecords.reduce((sum, { record }) => sum + Number(record.culls?.count || 0), 0);
  const environmentSheds = new Set(environmentRecords.map(({ batch }) => `${batch.farm}|${batch.shed}`)).size;

  return {
    feedTodayKg,
    waterTodayLitres,
    feedSubmitted: feedRecords.length > 0,
    healthSubmitted: healthRecords.length > 0,
    environmentSubmitted: environmentRecords.length > 0,
    mortalityToday,
    cullsToday,
    environmentSheds
  };
}

function fmdStat(label, value, sub, color, page) {
  return `<button class="fmd-stat" data-go="${page}"><i style="background:${color}"></i><span><strong>${value}</strong><em>${label}</em><small>${sub}</small></span></button>`;
}

function fmdTask(done, label, detail, page) {
  return `<button class="fmd-task" data-go="${page}"><b class="${done ? 'done' : ''}">${done ? '✓' : '!'}</b><span><strong>${label}</strong><small>${detail}</small></span><i>Open →</i></button>`;
}

function fmdBatchRow(item) {
  const badgeClass = ['active', 'excellent', 'good'].includes(String(item.status).toLowerCase()) ? 'good' : 'watch';
  const age = item.ageDays === '—' ? '—' : `${item.ageDays} days`;
  return `<tr><td><strong>${fmdEscape(item.batchId)}</strong><small>${fmdEscape(item.farm)}</small></td><td>${fmdEscape(item.shed)}</td><td>${Number(item.birds).toLocaleString('en-IN')}</td><td>${age}</td><td><span class="fmd-badge ${badgeClass}">${fmdEscape(item.status)}</span></td></tr>`;
}

async function fmdLoad(user) {
  const [batchData, earningsData] = await Promise.all([
    fmdFetchAssignedBatches(user),
    fmdFetch('/api/v2/compensation-claims/mine/summary')
  ]);

  const batch = batchData.summary;
  const activeRows = batchData.batches.filter(item => fmdIsActive(item.status)).slice(0, 5);
  const checklist = batchData.checklist;
  const earnings = earningsData;

  document.getElementById('fmd-stats').innerHTML = [
    fmdStat('Active Batches', batch.activeBatches, `${batch.completedBatches} completed`, '#16a34a', 'MyBatches'),
    fmdStat('Total Birds', Number(batch.totalBirds).toLocaleString('en-IN'), 'Assigned active batches', '#3b82f6', 'MyBatches'),
    fmdStat('Feed Logged Today', `${Number(checklist.feedTodayKg).toLocaleString('en-IN')} kg`, `${Number(checklist.waterTodayLitres).toLocaleString('en-IN')} L water`, '#f59e0b', 'FeedAndWater'),
    fmdStat('Pending Earnings', fmdMoney(earnings.pendingAmount), 'Business review queue', '#a855f7', 'MyEarnings')
  ].join('');

  document.getElementById('fmd-tasks').innerHTML = [
    fmdTask(checklist.feedSubmitted, 'Feed & water entry', checklist.feedSubmitted ? 'Today’s consumption is shared.' : 'No entry submitted today.', 'FeedAndWater'),
    fmdTask(checklist.environmentSubmitted, 'Environment readings', checklist.environmentSubmitted ? `${checklist.environmentSheds} shed readings available.` : 'Add current shed conditions.', 'Environment'),
    fmdTask(checklist.healthSubmitted, 'Bird health review', checklist.healthSubmitted ? `${checklist.mortalityToday} mortality and ${checklist.cullsToday} culls recorded today.` : 'No health entry submitted today.', 'BirdsHealth'),
    fmdTask(batch.activeBatches > 0, 'Batch records', `${batch.activeBatches} active assigned batch records available.`, 'MyBatches')
  ].join('');

  document.getElementById('fmd-batches').innerHTML = activeRows.length
    ? activeRows.map(fmdBatchRow).join('')
    : '<tr><td colspan="5" class="fmd-empty">No active batches. Add one from My Batches.</td></tr>';
}

function fmdWire() {
  document.getElementById('fmd-root').addEventListener('click', event => {
    const target = event.target.closest('[data-go]');
    if (!target) return;
    document.querySelector(`.db-sidebar-link[data-page="${target.dataset.go}"]`)?.click();
  });
}

function injectDashboardStyles() {
  if (document.getElementById('fmd-styles')) return;
  const style = document.createElement('style');
  style.id = 'fmd-styles';
  style.textContent = `.fmd-page,.fmd-page *{box-sizing:border-box}.fmd-page{padding:20px;background:#f5f6fa;min-height:100%;font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033}.fmd-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px}.fmd-stat,.fmd-card{background:#fff;border:1px solid #e8eaf0;border-radius:10px}.fmd-stat{display:flex;text-align:left;align-items:center;gap:11px;padding:14px;cursor:pointer}.fmd-stat i{width:10px;height:42px;border-radius:8px}.fmd-stat span strong,.fmd-stat span em,.fmd-stat span small{display:block}.fmd-stat strong{font-size:18px}.fmd-stat em{font-style:normal;color:#667085}.fmd-stat small{font-size:9px;color:#98a2b3}.fmd-grid{display:grid;grid-template-columns:380px 1fr;gap:16px}.fmd-card{overflow:hidden}.fmd-card header{display:flex;justify-content:space-between;padding:12px 15px;border-bottom:1px solid #eef0f3}.fmd-card h3{margin:0;font-size:13px}.fmd-card header span{font-size:10px;color:#16a34a}.fmd-task{display:flex;width:100%;align-items:center;text-align:left;gap:10px;border:0;border-bottom:1px solid #f3f4f6;background:#fff;padding:11px 14px;cursor:pointer}.fmd-task>b{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#fef3c7;color:#b45309}.fmd-task>b.done{background:#d1fae5;color:#047857}.fmd-task span{flex:1}.fmd-task span strong,.fmd-task span small{display:block}.fmd-task span small{color:#98a2b3}.fmd-task>i{font-size:10px;color:#16a34a;font-style:normal}.fmd-table-wrap{overflow:auto}.fmd-table{width:100%;border-collapse:collapse}.fmd-table th{padding:9px 12px;text-align:left;background:#f9fafb;color:#667085;font-size:10px;text-transform:uppercase}.fmd-table td{padding:10px 12px;border-top:1px solid #f1f3f5}.fmd-table td strong,.fmd-table td small{display:block}.fmd-table td small{color:#98a2b3}.fmd-badge{padding:3px 7px;border-radius:5px;font-size:9px;font-weight:700}.fmd-badge.good{background:#d1fae5;color:#047857}.fmd-badge.watch{background:#fef3c7;color:#b45309}.fmd-empty{text-align:center;color:#98a2b3}@media(max-width:900px){.fmd-stats{grid-template-columns:repeat(2,1fr)}.fmd-grid{grid-template-columns:1fr}}@media(max-width:600px){.fmd-page{padding:12px}.fmd-stats{grid-template-columns:1fr}}`;
  document.head.appendChild(style);
}

function viewDashboard(user) {
  injectDashboardStyles();
  setTimeout(() => {
    fmdWire();
    fmdLoad(user).catch(error => {
      document.getElementById('fmd-root').innerHTML = `<div class="fmd-card" style="padding:20px">${fmdEscape(error.message)}</div>`;
    });
  }, 0);

  return `<div class="fmd-page" id="fmd-root"><div class="fmd-stats" id="fmd-stats"></div><div class="fmd-grid"><section class="fmd-card"><header><h3>Operational Checklist</h3><span>Live status</span></header><div id="fmd-tasks">Loading…</div></section><section class="fmd-card"><header><h3>My Active Batches</h3><span>Assigned farms</span></header><div class="fmd-table-wrap"><table class="fmd-table"><thead><tr><th>Batch / Farm</th><th>Shed</th><th>Birds</th><th>Age</th><th>Status</th></tr></thead><tbody id="fmd-batches"><tr><td colspan="5">Loading…</td></tr></tbody></table></div></section></div></div>`;
}
