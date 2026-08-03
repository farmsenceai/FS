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

function documentRow(icon, name, version, project, batch, type, uploadedOn, time, uploadedBy, avatar) {
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
      <td style="text-align:center;color:#9ca3af;cursor:pointer;">... D</td>
    </tr>`;
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
  
  const pdfPath = user && user.pdfPath ? window.location.origin + user.pdfPath : '#';
  const displayStyle = user && user.pdfPath ? 'inline-flex' : 'none';

  return `
  <div class="db-scrollable">

    <!-- Stat row -->
    <div class="db-stat-row">
      ${statCard('', '#dcfce7', 'Total Documents', '128', 'All Projects', 'up', '')}
      ${statCard('', '#e9d5ff', 'DPR Documents', '24', 'Detailed Project Reports', 'up', '')}
      ${statCard('', '#fce7f3', 'Downloaded', '52', 'This Month', 'up', '')}
      ${statCard('', '#fed7aa', 'Verified Documents', '100%', 'By Farmsence.ai', 'up', '')}
      ${statCard('', '#cffafe', 'Storage Used', '4.8 GB', 'of 10 GB', 'up', '')}
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
            <input type="text" class="db-search-input" placeholder="Search documents by name or keyword..." style="flex:1;">
          </div>
          <div style="display:flex;gap:10px;">
            <select class="db-select">
              <option>All Projects</option>
            </select>
            <select class="db-select">
              <option>All Document Types</option>
            </select>
            <button style="padding:6px 12px;border:1px solid #e8eaf0;border-radius:6px;background:#fff;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;color:#6b7280;">Filter</button>
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
            <tbody>
              ${documentRow('D', 'Green Valley Farm - DPR.pdf', 'v1.2', 'Green Valley Farm', 'Batch #104', 'DPR', '12 May 2024', '10:30 AM', 'Farmsence.ai', 'F')}
              ${documentRow('D', 'Project Agreement.pdf', '', 'Green Valley Farm', 'Batch #104', 'Agreement', '12 May 2024', '09:15 AM', 'Navin Kumar', 'N')}
              ${documentRow('D', 'BOQ - Civil Works.xlsx', '', 'Green Valley Farm', 'Batch #104', 'BOQ', '11 May 2024', '04:45 PM', 'Farmsence.ai', 'F')}
              ${documentRow('D', 'Layout Plan.pdf', '', 'Green Valley Farm', 'Batch #104', 'Drawing', '10 May 2024', '02:25 PM', 'Rakesh Yadav', 'R')}
              ${documentRow('D', 'Structural Design.pdf', '', 'Green Valley Farm', 'Batch #104', 'Design', '09 May 2024', '11:30 AM', 'Farmsence.ai', 'F')}
              ${documentRow('D', 'Estimate & Cost Sheet.xlsx', '', 'Green Valley Farm', 'Batch #104', 'Estimate', '08 May 2024', '05:05 PM', 'Navin Kumar', 'N')}
              ${documentRow('D', 'Land Documents.pdf', '', 'Green Valley Farm', 'Batch #104', 'Legal', '07 May 2024', '03:40 PM', 'Navin Kumar', 'N')}
              ${documentRow('D', 'Environmental NOC.pdf', '', 'Green Valley Farm', 'Batch #104', 'NOC', '06 May 2024', '09:10 PM', 'Farmsence.ai', 'F')}
            </tbody>
          </table>
        </div>
        <div class="db-pagination">
          <button class="db-pagination-btn">‹</button>
          <button class="db-pagination-btn active">1</button>
          <button class="db-pagination-btn">2</button>
          <button class="db-pagination-btn">3</button>
          <span style="color:#9ca3af;font-size:10px;">...</span>
          <button class="db-pagination-btn">16</button>
          <button class="db-pagination-btn">›</button>
        </div>
        <div style="text-align:center;padding:10px;font-size:11px;color:#9ca3af;">Showing 1 to 8 of 128 documents</div>
      </div>

      <!-- Detailed Project Report (DPR) -->
      <div style="display:flex;flex-direction:column;gap:16px;">
        <div class="db-dpr-card">
          <div class="db-card-header">
            <span class="db-card-title">Detailed Project Report (DPR)</span>
            <a href="#" class="db-card-link">View DPR Summary</a>
          </div>
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 160'%3E%3Crect fill='%23f3f4f6' width='300' height='160'/%3E%3Crect fill='%23d1d5db' x='40' y='30' width='220' height='100' rx='4'/%3E%3C/svg%3E" class="db-dpr-image" alt="Farm">
          <div class="db-dpr-header">
            <div class="db-dpr-badge">DETAILED PROJECT REPORT</div>
            <div class="db-dpr-title">POULTRY FARM</div>
            <div class="db-dpr-subtitle">Green Valley Farm</div>
          </div>
          <div class="db-dpr-info">
            <div class="db-dpr-info-item">
              <div class="db-dpr-info-icon">F</div>
              <div style="flex:1;">
                <div class="db-dpr-info-label">Project Name</div>
                <div class="db-dpr-info-value">Green Valley Farm</div>
              </div>
            </div>
            <div class="db-dpr-info-item">
              <div class="db-dpr-info-icon">L</div>
              <div style="flex:1;">
                <div class="db-dpr-info-label">Location</div>
                <div class="db-dpr-info-value">Rajahmumdry, Andhra Pradesh</div>
              </div>
            </div>
            <div class="db-dpr-info-item">
              <div class="db-dpr-info-icon">C</div>
              <div style="flex:1;">
                <div class="db-dpr-info-label">Capacity</div>
                <div class="db-dpr-info-value">18,000 Broiler Birds</div>
              </div>
            </div>
            <div class="db-dpr-info-item">
              <div class="db-dpr-info-icon">P</div>
              <div style="flex:1;">
                <div class="db-dpr-info-label">Project Type</div>
                <div class="db-dpr-info-value">Poultry Shed Construction</div>
              </div>
            </div>
            <div class="db-dpr-info-item">
              <div class="db-dpr-info-icon">R</div>
              <div style="flex:1;">
                <div class="db-dpr-info-label">Report Version</div>
                <div class="db-dpr-info-value">v1.2</div>
              </div>
            </div>
            <div class="db-dpr-info-item">
              <div class="db-dpr-info-icon">D</div>
              <div style="flex:1;">
                <div class="db-dpr-info-label">Date Prepared</div>
                <div class="db-dpr-info-value">12 May 2024</div>
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
            <button class="db-dpr-btn db-dpr-btn-primary">
              <span>D</span> Download DPR
            </button>
            <button class="db-dpr-btn db-dpr-btn-secondary">Preview</button>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="db-card">
          <div class="db-card-header">
            <span class="db-card-title">Quick Actions</span>
          </div>
          <div class="db-quick-actions">
            <div class="db-quick-action">
              <div class="db-quick-action-icon">U</div>
              <div class="db-quick-action-label">Upload Document</div>
              <div class="db-quick-action-sub">Add new document</div>
            </div>
            <div class="db-quick-action">
              <div class="db-quick-action-icon">R</div>
              <div class="db-quick-action-label">Request Document</div>
              <div class="db-quick-action-sub">Request from team</div>
            </div>
            <div class="db-quick-action">
              <div class="db-quick-action-icon">C</div>
              <div class="db-quick-action-label">Document Checklist</div>
              <div class="db-quick-action-sub">View requirements</div>
            </div>
            <div class="db-quick-action">
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
        <div style="padding:14px 16px;">
          ${categoryItem('DPR', 'DPR Documents', 24)}
          ${categoryItem('A', 'Agreements', 12)}
          ${categoryItem('B', 'BOQ & Estimates', 15)}
          ${categoryItem('L', 'Legal Documents', 10)}
          ${categoryItem('D', 'Drawings & Designs', 18)}
          ${categoryItem('N', 'NOC & Approvals', 9)}
        </div>
      </div>

      <!-- Document Checklist -->
      <div class="db-card">
        <div class="db-card-header">
          <span class="db-card-title">Document Checklist</span>
          <a href="#" class="db-card-link">View Checklist</a>
        </div>
        <div class="db-pie-wrapper">
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
        <div style="padding:14px 16px;">
          ${activityItem('D', 'You downloaded Green Valley Farm - DPR.pdf', 'Today, 10:30 AM')}
          ${activityItem('U', 'Rakesh Yadav uploaded Structural Design.pdf', 'Today, 09:15 AM')}
          ${activityItem('R', 'You requested For the NOC document', 'Yesterday, 11:45 PM')}
          ${activityItem('V', 'Farmsence.ai verified Land Documents.pdf', 'Yesterday, 11:45 AM')}
          ${activityItem('U', 'Navin Kumar uploaded Estimate & Cost Sheet.xlsx', '22 May 2024, 05:10 PM')}
        </div>
      </div>

    </div>

  </div>
  `;
}
