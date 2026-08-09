/* views-admin/Overview.js */

window.metaOverview = {
  title: 'Platform Overview',
  subtitle: 'A birds-eye view of FarmSenceAI across all farms, farmers, and businesses.'
};

function adoStatCard(iconBg, iconSvg, label, value, sub) {
  return `
    <div class="ado-stat-card">
      <div class="ado-stat-icon" style="background:${iconBg}">${iconSvg}</div>
      <div class="ado-stat-body">
        <div class="ado-stat-value">${value}</div>
        <div class="ado-stat-label">${label}</div>
        <div class="ado-stat-sub">${sub}</div>
      </div>
    </div>`;
}

function adoSignupRow(name, type, joined, status) {
  const statusClass = status === 'Active' ? 'ado-status--ok' : status === 'Pending Review' ? 'ado-status--pending' : 'ado-status--suspended';
  return `
    <tr>
      <td class="ado-name">${name}</td>
      <td>${type}</td>
      <td>${joined}</td>
      <td><span class="ado-status-badge ${statusClass}">${status}</span></td>
    </tr>`;
}

function injectOverviewStyles() {
  if (document.getElementById('ado-styles')) return;
  const style = document.createElement('style');
  style.id = 'ado-styles';
  style.textContent = `
    .ado-scrollable { padding: 20px; background: #f5f6fa; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #1a1a2e; }
    .ado-stat-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
    .ado-stat-card { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; padding: 14px 16px; display: flex; align-items: center; gap: 12px; }
    .ado-stat-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ado-stat-value { font-size: 19px; font-weight: 800; color: #111827; line-height: 1.1; }
    .ado-stat-label { font-size: 11px; color: #6b7280; margin-top: 1px; }
    .ado-stat-sub { font-size: 10px; color: #9ca3af; margin-top: 1px; }

    .ado-card { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; overflow: hidden; }
    .ado-card-header { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px 10px; border-bottom: 1px solid #f3f4f6; }
    .ado-card-title { font-size: 13px; font-weight: 700; }
    .ado-card-link { font-size: 11px; color: #16a34a; text-decoration: none; font-weight: 600; }

    .ado-table { width: 100%; border-collapse: collapse; }
    .ado-table th { font-size: 11px; font-weight: 700; color: #6b7280; padding: 10px 14px; text-align: left; background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
    .ado-table td { padding: 11px 14px; border-bottom: 1px solid #f9fafb; font-size: 12.5px; color: #374151; }
    .ado-table tr:last-child td { border-bottom: none; }
    .ado-name { font-weight: 700; color: #111827; }
    .ado-status-badge { padding: 3px 9px; border-radius: 5px; font-size: 10px; font-weight: 700; white-space: nowrap; }
    .ado-status--ok { background: #d1fae5; color: #16a34a; }
    .ado-status--pending { background: #fef3c7; color: #d97706; }
    .ado-status--suspended { background: #fee2e2; color: #dc2626; }
  `;
  document.head.appendChild(style);
}

function viewOverview(user) {
  injectOverviewStyles();

  const svgFarms = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="9" width="16" height="8" rx="1.5" stroke="#16a34a" stroke-width="1.5"/><path d="M2 9l8-6 8 6" stroke="#16a34a" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  const svgFarmers = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="#3b82f6" stroke-width="1.5"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/></svg>';
  const svgBiz = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="7" width="14" height="10" rx="1.5" stroke="#a855f7" stroke-width="1.5"/><path d="M7 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="#a855f7" stroke-width="1.5"/></svg>';
  const svgRev = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="#f59e0b" stroke-width="1.5"/><path d="M10 6v8M7.5 8a2 2 0 0 1 2.5-2c1.4 0 2.5.9 2.5 2s-1.1 2-2.5 2-2.5.9-2.5 2 1.1 2 2.5 2 2.5-.9 2.5-2" stroke="#f59e0b" stroke-width="1.3" stroke-linecap="round"/></svg>';
  window.adoOverviewIcons = { svgFarms, svgFarmers, svgBiz, svgRev };

  setTimeout(adoLoadOverview, 0);
  return `
  <div class="ado-scrollable">
    <div id="ado-feedback"></div>

    <div class="ado-stat-strip" id="ado-stats">
      ${adoStatCard('#f0fdf4', svgFarms, 'Total Farms', '—', 'Loading')}
      ${adoStatCard('#eff6ff', svgFarmers, 'Total Farmers', '—', 'Loading')}
      ${adoStatCard('#faf5ff', svgBiz, 'Total Businesses', '—', 'Loading')}
      ${adoStatCard('#fffbeb', svgRev, 'Platform Revenue (MTD)', '—', 'Not connected')}
    </div>

    <div class="ado-card">
      <div class="ado-card-header">
        <span class="ado-card-title">Recent Signups</span>
        <button type="button" class="ado-card-link" id="ado-view-users" style="border:0;background:none;cursor:pointer">View All Farmers &#8594;</button>
      </div>
      <table class="ado-table">
        <thead>
          <tr><th>Name / Org</th><th>Account Type</th><th>Joined</th><th>Status</th></tr>
        </thead>
        <tbody id="ado-signups"><tr><td colspan="4">${FarmSenseAdminApi.message('Loading platform data…')}</td></tr></tbody>
      </table>
    </div>

  </div>`;
}

async function adoLoadOverview() {
  const statsElement = document.getElementById('ado-stats');
  const signupsElement = document.getElementById('ado-signups');
  if (!statsElement || !signupsElement) return;

  document.getElementById('ado-view-users')?.addEventListener('click', () => {
    FarmSenseAdminApi.navigate('ManageFarmers');
  });

  try {
    const { overview } = await FarmSenseAdminApi.request('/overview');
    const stats = overview.stats || {};
    const { svgFarms, svgFarmers, svgBiz, svgRev } = window.adoOverviewIcons;
    statsElement.innerHTML = `
      ${adoStatCard('#f0fdf4', svgFarms, 'Total Farms', stats.totalFarms ?? 0, 'MongoDB records')}
      ${adoStatCard('#eff6ff', svgFarmers, 'Total Farmers', stats.totalFarmers ?? 0, 'Registered accounts')}
      ${adoStatCard('#faf5ff', svgBiz, 'Total Businesses', stats.totalBusinesses ?? 0, 'Organizations')}
      ${adoStatCard('#fffbeb', svgRev, 'Platform Revenue (MTD)', stats.platformRevenueMtd == null ? 'Not connected' : `₹ ${Number(stats.platformRevenueMtd).toLocaleString('en-IN')}`, stats.platformRevenueMtd == null ? 'Payments module pending' : 'This month')}`;

    const signups = overview.recentSignups || [];
    signupsElement.innerHTML = signups.length
      ? signups.map(item => adoSignupRow(
          FarmSenseAdminApi.escapeHTML(item.name),
          FarmSenseAdminApi.label(item.type),
          FarmSenseAdminApi.formatDate(item.joinedAt),
          FarmSenseAdminApi.label(item.status === 'pending' ? 'pending review' : item.status)
        )).join('')
      : `<tr><td colspan="4">${FarmSenseAdminApi.message('No signups found.')}</td></tr>`;
  } catch (error) {
    FarmSenseAdminApi.feedback('ado-feedback', error.message, 'error');
    statsElement.innerHTML = FarmSenseAdminApi.message(error.message, 'error');
    signupsElement.innerHTML = `<tr><td colspan="4">${FarmSenseAdminApi.message(error.message, 'error')}</td></tr>`;
  }
}
