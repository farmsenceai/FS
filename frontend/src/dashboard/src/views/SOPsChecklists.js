/* views/SOPsChecklists.js */

window.metaSOPsChecklists = {
  title: 'SOPs & Checklists',
  subtitle: 'Standardize farm operations with step-by-step SOPs and smart checklists.'
};

/* ── Helper functions ── */

function scOverviewStat(iconSvg, iconBg, value, label) {
  return `
    <div class="sc-ov-stat">
      <div class="sc-ov-icon" style="background:${iconBg}">${iconSvg}</div>
      <div class="sc-ov-value">${value}</div>
      <div class="sc-ov-label">${label}</div>
    </div>`;
}

function scQuickAction(iconSvg, label) {
  return `
    <div class="sc-qa-item">
      <div class="sc-qa-icon">${iconSvg}</div>
      <div class="sc-qa-label">${label}</div>
    </div>`;
}

function scImportantLink(iconSvg, iconBg, label) {
  return `
    <div class="sc-link-row">
      <span class="sc-link-icon" style="background:${iconBg}">${iconSvg}</span>
      <span class="sc-link-label">${label}</span>
      <span class="sc-link-arrow">›</span>
    </div>`;
}

function scFeaturedCard(type, typeColor, iconSvg, iconBg, title, desc, tags, downloads, readTime) {
  const tagHtml = tags.map(t => `<span class="sc-card-tag" style="background:${t.bg};color:${t.color}">${t.label}</span>`).join('');
  return `
    <div class="sc-feat-card" style="background:${iconBg}1a">
      <span class="sc-feat-type" style="background:${typeColor}1a;color:${typeColor}">${type}</span>
      <div class="sc-feat-icon" style="background:${iconBg}">${iconSvg}</div>
      <div class="sc-feat-title">${title}</div>
      <div class="sc-feat-desc">${desc}</div>
      <div class="sc-feat-tags">${tagHtml}</div>
      <div class="sc-feat-footer">
        <span class="sc-feat-meta">${scIcons.download} ${downloads}</span>
        <span class="sc-feat-meta">${scIcons.clock} ${readTime}</span>
      </div>
    </div>`;
}

function scCategoryCard(iconSvg, iconBg, title, count) {
  return `
    <div class="sc-cat-card">
      <div class="sc-cat-icon" style="background:${iconBg}">${iconSvg}</div>
      <div class="sc-cat-body">
        <div class="sc-cat-title">${title}</div>
        <div class="sc-cat-count">${count}</div>
      </div>
    </div>`;
}

function scTableRow(type, typeColor, typeBg, title, category, applicableFor, lastUpdated, updatedBy, downloads) {
  return `
    <tr>
      <td><span class="sc-table-badge" style="background:${typeBg};color:${typeColor}">${type}</span></td>
      <td class="sc-table-title">${title}</td>
      <td>${category}</td>
      <td>${applicableFor}</td>
      <td>${lastUpdated}</td>
      <td>${updatedBy}</td>
      <td>${downloads}</td>
      <td>
        <div class="sc-table-actions">
          <button class="sc-view-btn">View</button>
          <span class="sc-more-btn">⋮</span>
        </div>
      </td>
    </tr>`;
}

function scMostDownloadedRow(num, title, downloads) {
  return `
    <div class="sc-md-row">
      <span class="sc-md-num">${num}</span>
      <div class="sc-md-body">
        <div class="sc-md-title">${title}</div>
        <div class="sc-md-sub">${downloads} downloads</div>
      </div>
    </div>`;
}

function scRecentlyUpdatedRow(iconSvg, iconBg, title, date) {
  return `
    <div class="sc-ru-row">
      <span class="sc-ru-icon" style="background:${iconBg}">${iconSvg}</span>
      <div class="sc-ru-body">
        <div class="sc-ru-title">${title}</div>
        <div class="sc-ru-date">Updated on ${date}</div>
      </div>
    </div>`;
}

/* ── CSS injected once ── */
function injectSOPsChecklistsStyles() {
  if (document.getElementById('sc-styles')) return;
  const style = document.createElement('style');
  style.id = 'sc-styles';
  style.textContent = `
    .sc-scrollable { padding: 16px 20px; background: #f5f6fa; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #1a1a2e; }
    .sc-layout { display: grid; grid-template-columns: 1fr 300px; gap: 16px; align-items: start; }

    /* ── Top row: Overview | Quick Actions | Important Links ── */
    .sc-top-row { display: grid; grid-template-columns: 1.4fr 1.4fr 1fr; gap: 14px; margin-bottom: 16px; grid-column: 1/-1; }
    .sc-card { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; overflow: hidden; }
    .sc-card-pad { padding: 18px; }
    .sc-card-title-lg { font-size: 14px; font-weight: 800; margin-bottom: 16px; }

    .sc-ov-grid { display: grid; grid-template-columns: repeat(4, 1fr); }
    .sc-ov-stat { text-align: center; position: relative; padding: 0 6px; }
    .sc-ov-stat:not(:last-child)::after { content: ''; position: absolute; right: 0; top: 8px; bottom: 8px; width: 1px; background: #f0f1f4; }
    .sc-ov-icon { width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; }
    .sc-ov-value { font-size: 22px; font-weight: 800; }
    .sc-ov-label { font-size: 10.5px; color: #6b7280; margin-top: 2px; }

    .sc-qa-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .sc-qa-item { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; }
    .sc-qa-icon { width: 44px; height: 44px; background: #f0fdf4; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .sc-qa-label { font-size: 11px; font-weight: 600; color: #374151; text-align: center; line-height: 1.3; }

    .sc-link-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid #f9fafb; cursor: pointer; }
    .sc-link-row:last-child { border-bottom: none; }
    .sc-link-icon { width: 28px; height: 28px; border-radius: 7px; background: #f0fdf4; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .sc-link-label { flex: 1; font-size: 11.5px; font-weight: 600; color: #374151; }
    .sc-link-arrow { color: #9ca3af; font-size: 15px; }

    /* ── Filter bar ── */
    .sc-filter-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; grid-column: 1/-1; }
    .sc-tab-group { display: flex; gap: 6px; background: #fff; border: 1px solid #e8eaf0; border-radius: 8px; padding: 4px; }
    .sc-tab { background: none; border: none; padding: 6px 14px; font-size: 11.5px; font-weight: 600; color: #6b7280; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 5px; }
    .sc-tab.active { background: #f0fdf4; color: #16a34a; }
    .sc-tab-count { background: #e8eaf0; color: #6b7280; border-radius: 10px; padding: 0 6px; font-size: 10px; font-weight: 700; }
    .sc-tab.active .sc-tab-count { background: #16a34a; color: #fff; }
    .sc-select { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 11.5px; background: #fff; cursor: pointer; color: #374151; }
    .sc-sort-label { font-size: 11.5px; color: #6b7280; font-weight: 600; margin-left: auto; }

    /* ── Featured SOPs grid ── */
    .sc-feat-section { grid-column: 1/-1; margin-bottom: 18px; }
    .sc-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .sc-section-title { font-size: 15px; font-weight: 800; }
    .sc-section-link { font-size: 12px; color: #16a34a; font-weight: 700; text-decoration: none; }
    .sc-feat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
    .sc-feat-card { background: #fff; border: 1px solid #e8eaf0; border-radius: 10px; padding: 18px; position: relative; text-align: center; }
    .sc-feat-type { position: absolute; top: 14px; left: 14px; font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 5px; }
    .sc-feat-icon { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 14px auto 14px; }
    .sc-feat-title { font-size: 13.5px; font-weight: 800; margin-bottom: 6px; }
    .sc-feat-desc { font-size: 11px; color: #6b7280; line-height: 1.4; margin-bottom: 12px; min-height: 44px; }
    .sc-feat-tags { display: flex; gap: 6px; justify-content: center; margin-bottom: 14px; flex-wrap: wrap; }
    .sc-card-tag { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 5px; }
    .sc-feat-footer { display: flex; align-items: center; justify-content: center; gap: 12px; padding-top: 12px; border-top: 1px solid #f3f4f6; font-size: 10.5px; color: #6b7280; }
    .sc-feat-meta { display: flex; align-items: center; gap: 4px; }
    .sc-feat-bookmark { margin-left: auto; cursor: pointer; color: #9ca3af; }

    /* ── Browse by category ── */
    .sc-cat-section { grid-column: 1/-1; margin-bottom: 18px; }
    .sc-cat-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 10px; }
    .sc-cat-card { background: #fff; border: 1px solid #e8eaf0; border-radius: 10px; padding: 12px; display: flex; align-items: center; gap: 9px; }
    .sc-cat-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .sc-cat-title { font-size: 11px; font-weight: 700; }
    .sc-cat-count { font-size: 9.5px; color: #9ca3af; margin-top: 1px; }

    /* ── Recent SOPs table ── */
    .sc-table-section { grid-column: 1/-1; }
    .sc-table-card { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; overflow: hidden; }
    .sc-table { width: 100%; border-collapse: collapse; }
    .sc-table th { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .4px; padding: 10px 16px; text-align: left; background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
    .sc-table td { padding: 11px 16px; font-size: 12px; border-bottom: 1px solid #f9fafb; color: #374151; }
    .sc-table tr:last-child td { border-bottom: none; }
    .sc-table-badge { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 5px; }
    .sc-table-title { font-weight: 700; color: #111827; }
    .sc-table-actions { display: flex; align-items: center; gap: 8px; }
    .sc-view-btn { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 5px 14px; font-size: 11px; font-weight: 600; color: #374151; cursor: pointer; }
    .sc-more-btn { color: #9ca3af; cursor: pointer; font-size: 14px; }
    .sc-table-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; font-size: 11.5px; color: #6b7280; }
    .sc-pagination { display: flex; align-items: center; gap: 5px; }
    .sc-page-btn { width: 26px; height: 26px; border: 1px solid #e5e7eb; background: #fff; border-radius: 6px; font-size: 11px; cursor: pointer; color: #6b7280; display: flex; align-items: center; justify-content: center; }
    .sc-page-btn.active { background: #16a34a; color: #fff; border-color: #16a34a; font-weight: 700; }

    /* ── Right rail ── */
    .sc-right-rail { display: flex; flex-direction: column; gap: 14px; }
    .sc-card-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 10px; }
    .sc-card-header-title { font-size: 13px; font-weight: 800; }
    .sc-card-header-link { font-size: 11px; color: #16a34a; font-weight: 700; text-decoration: none; }

    .sc-md-list { padding: 4px 16px 14px; }
    .sc-md-row { display: flex; align-items: flex-start; gap: 10px; padding: 9px 0; border-bottom: 1px solid #f9fafb; }
    .sc-md-row:last-child { border-bottom: none; }
    .sc-md-num { width: 20px; height: 20px; background: #f3f4f6; border-radius: 50%; font-size: 10px; font-weight: 800; color: #6b7280; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
    .sc-md-title { font-size: 11.5px; font-weight: 700; line-height: 1.35; margin-bottom: 2px; }
    .sc-md-sub { font-size: 10px; color: #9ca3af; }

    .sc-ru-list { padding: 4px 16px 14px; }
    .sc-ru-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid #f9fafb; }
    .sc-ru-row:last-child { border-bottom: none; }
    .sc-ru-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .sc-ru-title { font-size: 11.5px; font-weight: 700; }
    .sc-ru-date { font-size: 10px; color: #9ca3af; margin-top: 1px; }

    .sc-need-card { background: #fff; border: 1px solid #e8eaf0; border-radius: 10px; padding: 18px 16px; text-align: center; }
    .sc-need-title { font-size: 14px; font-weight: 800; margin-bottom: 4px; }
    .sc-need-desc { font-size: 11px; color: #6b7280; margin-bottom: 14px; line-height: 1.4; }
    .sc-need-btn { width: 100%; background: #16a34a; color: #fff; border: none; border-radius: 8px; padding: 10px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; margin-bottom: 10px; }
    .sc-need-foot { font-size: 10.5px; color: #9ca3af; }
  `;
  document.head.appendChild(style);
}

/* ── SVG icons (no emojis) ── */
const scIcons = {
  bookOpen:   `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`,
  checkCircle:`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>`,
  fileText:   `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  download:   `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  fileSm:     `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  clipboardCheck: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><polyline points="9 13 11 15 15 11"/></svg>`,
  upload:     `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  helpCircle: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  download2:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  fileBlue:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  checkSm:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>`,
  videoSm:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
  shield:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  heart:      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
  feed:       `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2"><path d="M3 3l18 6-18 6V3zM3 15l18 6"/></svg>`,
  flask:      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2"><path d="M9 2v6L4 19a2 2 0 002 3h12a2 2 0 002-3l-5-11V2"/><line x1="9" y1="2" x2="15" y2="2"/></svg>`,
  settings:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 005 14.6a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 9c.39 0 .74-.16 1-.4V3a2 2 0 014 0v.09c.26.24.61.4 1 .4.39 0 .74-.16 1-.4l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019 9c0 .39.16.74.4 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  clipboard:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="16" y2="15"/></svg>`,
  alertTriangle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  grid:       `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  syringe:    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><path d="M18 2l4 4M14 6l4 4M10 10l9-9M3 21l6-6M9 16l-2-2 4-4 2 2-4 4z"/></svg>`,
  clock:      `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  bookmark:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>`,
};

/* ── Main view function ── */
function viewSOPsChecklists(user) {
  injectSOPsChecklistsStyles();

  return `
  <div class="sc-scrollable">
    <div class="sc-layout">

      <!-- Top row -->
      <div class="sc-top-row">

        <!-- Overview -->
        <div class="sc-card sc-card-pad">
          <div class="sc-card-title-lg">Overview</div>
          <div class="sc-ov-grid">
            ${scOverviewStat(scIcons.bookOpen, '#d1fae5', '126', 'Total SOPs')}
            ${scOverviewStat(scIcons.checkCircle, '#dbeafe', '84', 'Total Checklists')}
            ${scOverviewStat(scIcons.fileText, '#ede9fe', '32', 'Categories')}
            ${scOverviewStat(scIcons.download, '#ffedd5', '6,842', 'Total Downloads')}
          </div>
        </div>

        <!-- Important Links -->
        <div class="sc-card sc-card-pad">
          <div class="sc-card-title-lg">Important Links</div>
          <div>
            ${scImportantLink(scIcons.download2, '#d1fae5', 'Download SOP Templates')}
            ${scImportantLink(scIcons.fileBlue, '#dbeafe', 'SOP Creation Guide')}
            ${scImportantLink(scIcons.checkSm, '#dbeafe', 'Checklist Best Practices')}
            ${scImportantLink(scIcons.videoSm, '#dbeafe', 'Video: How to Use SOPs')}
          </div>
        </div>

      </div>

      <!-- Filter bar -->
      <div class="sc-filter-bar">
        <div class="sc-tab-group">
          <button class="sc-tab active">All</button>
          <button class="sc-tab">SOPs <span class="sc-tab-count">126</span></button>
          <button class="sc-tab">Checklists <span class="sc-tab-count">84</span></button>
        </div>
        <select class="sc-select"><option>All Categories</option></select>
        <select class="sc-select"><option>All Operations</option></select>
        <select class="sc-select"><option>All Batches</option></select>
        <span class="sc-sort-label">Sort by: <strong style="color:#111827;">Latest</strong></span>
      </div>

      <!-- Featured SOPs & Checklists -->
      <div class="sc-feat-section">
        <div class="sc-section-header">
          <span class="sc-section-title">Featured SOPs &amp; Checklists</span>
          <a href="#" class="sc-section-link">View All <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="sc-feat-grid">
          ${scFeaturedCard('SOP', '#16a34a', scIcons.shield, '#16a34a', 'Biosecurity Entry Protocol', 'Step-by-step procedure for maintaining biosecurity while entering the farm.', [{label:'Biosecurity', bg:'#d1fae5', color:'#16a34a'}, {label:'All Farms', bg:'#f3f4f6', color:'#6b7280'}], '1,245', '12 min read')}
          ${scFeaturedCard('Checklist', '#2563eb', scIcons.clipboardCheck.replace('#16a34a','#2563eb'), '#2563eb', 'Daily Farm Inspection Checklist', 'Complete daily checklist to monitor farm conditions and bird health.', [{label:'Daily Operations', bg:'#dbeafe', color:'#2563eb'}, {label:'All Batches', bg:'#f3f4f6', color:'#6b7280'}], '2,890', '8 min read')}
          ${scFeaturedCard('SOP', '#ea580c', scIcons.feed, '#ea580c', 'Feed Management SOP', 'Standard procedure for feed storage, preparation and feeding.', [{label:'Feed &amp; Nutrition', bg:'#ffedd5', color:'#ea580c'}, {label:'Broiler', bg:'#f3f4f6', color:'#6b7280'}], '1,876', '15 min read')}
          ${scFeaturedCard('Checklist', '#7c3aed', scIcons.syringe, '#7c3aed', 'Vaccination Schedule Checklist', 'Ensure timely vaccination and proper record keeping.', [{label:'Bird Health', bg:'#ede9fe', color:'#7c3aed'}, {label:'All Batches', bg:'#f3f4f6', color:'#6b7280'}], '2,132', '6 min read')}
        </div>
      </div>

      <!-- Browse by Category -->
      <div class="sc-cat-section">
        <div class="sc-section-header">
          <span class="sc-section-title">Browse by Category</span>
          <a href="#" class="sc-section-link">View All Categories <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="sc-cat-grid">
          ${scCategoryCard(scIcons.shield, '#d1fae5', 'Bioeecurity', '18 SOPs | 14 Checklists')}
          ${scCategoryCard(scIcons.heart, '#fee2e2', 'Bird Health', '22 SOPs | 18 Checklists')}
          ${scCategoryCard(scIcons.feed, '#ffedd5', 'Feed &amp; Nutrition', '16 SOPs | 12 Checklists')}
          ${scCategoryCard(scIcons.flask, '#cffafe', 'Environment', '14 SOPs | 10 Checklists')}
          ${scCategoryCard(scIcons.settings, '#d1fae5', 'Farm Operations', '24 SOPs | 20 Checklists')}
          ${scCategoryCard(scIcons.clipboard, '#cffafe', 'Records &amp; Reports', '12 SOPs | 10 Checklists')}
          ${scCategoryCard(scIcons.alertTriangle, '#fee2e2', 'Emergency', '8 SOPs | 5 Checklists')}
          ${scCategoryCard(scIcons.grid, '#f3f4f6', 'All Categories', 'View All')}
        </div>
      </div>

      <!-- Recent SOPs & Checklists table -->
      <div class="sc-table-section">
        <div class="sc-section-header">
          <span class="sc-section-title">Recent SOPs &amp; Checklists</span>
        </div>
        <div class="sc-table-card">
          <table class="sc-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Title</th>
                <th>Category</th>
                <th>Applicable For</th>
                <th>Last Updated</th>
                <th>Updated By</th>
                <th>Downloads</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${scTableRow('SOP', '#16a34a', '#d1fae5', 'Litter Management SOP', 'Farm Operations', 'Broiler, Layer', '20 May 2024', 'Dr. Ramesh Verma', '1,023')}
              ${scTableRow('Checklist', '#2563eb', '#dbeafe', 'Pre-Placement Checklist', 'Farm Operations', 'Broiler', '19 May 2024', 'Anjali Mehta', '1,842')}
              ${scTableRow('SOP', '#16a34a', '#d1fae5', 'Heat Stress Management SOP', 'Environment', 'Broiler, Layer', '18 May 2024', 'Dr. Meera Nair', '2,354')}
              ${scTableRow('Checklist', '#2563eb', '#dbeafe', 'Weekly Farm Audit Checklist', 'Farm Operations', 'All Farms', '17 May 2024', 'Suresh Patel', '1,566')}
              ${scTableRow('SOP', '#16a34a', '#d1fae5', 'Mortality Disposal SOP', 'Biosecurity', 'All Farms', '16 May 2024', 'Dr. Ramesh Verma', '987')}
            </tbody>
          </table>
          <div class="sc-table-footer">
            <span>Showing 1 to 5 of 10 items</span>
            <div class="sc-pagination">
              <span class="sc-page-btn">&#8249;</span>
              <span class="sc-page-btn active">1</span>
              <span class="sc-page-btn">2</span>
              <span class="sc-page-btn">&#8250;</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Rail -->
      <div class="sc-right-rail">

        <!-- Most Downloaded -->
        <div class="sc-card">
          <div class="sc-card-header">
            <span class="sc-card-header-title">Most Downloaded</span>
            <a href="#" class="sc-card-header-link">View All <i class="fa-solid fa-arrow-right"></i></a>
          </div>
          <div class="sc-md-list">
            ${scMostDownloadedRow(1, 'Biosecurity Entry Protocol', '2,451')}
            ${scMostDownloadedRow(2, 'Daily Farm Inspection Checklist', '2,230')}
            ${scMostDownloadedRow(3, 'Vaccination Schedule Checklist', '1,987')}
            ${scMostDownloadedRow(4, 'Feed Management SOP', '1,876')}
            ${scMostDownloadedRow(5, 'Litter Management SOP', '1,623')}
          </div>
        </div>

        <!-- Recently Updated -->
        <div class="sc-card">
          <div class="sc-card-header">
            <span class="sc-card-header-title">Recently Updated</span>
            <a href="#" class="sc-card-header-link">View All <i class="fa-solid fa-arrow-right"></i></a>
          </div>
          <div class="sc-ru-list">
            ${scRecentlyUpdatedRow(scIcons.alertTriangle, '#fee2e2', 'Heat Stress Management SOP', '20 May 2024')}
            ${scRecentlyUpdatedRow(scIcons.checkSm.replace('#2563eb','#2563eb'), '#dbeafe', 'Pre-Placement Checklist', '19 May 2024')}
            ${scRecentlyUpdatedRow(scIcons.flask, '#cffafe', 'Water Quality Monitoring Checklist', '18 May 2024')}
          </div>
        </div>

      </div>

    </div>
  </div>`;
}
