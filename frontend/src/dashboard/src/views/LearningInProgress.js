/* views/LearningInProgress.js */

window.metaLearningInProgress = {
  title: 'Learning in Progress',
  subtitle: "Here's what's happening with your farm today."
};

/* ── Helper functions ── */

function lipQuickLink(iconSvg, iconBg, label) {
  return `
    <div class="lip-ql-row">
      <span class="lip-ql-icon" style="background:${iconBg}">${iconSvg}</span>
      <span class="lip-ql-label">${label}</span>
      <span class="lip-ql-arrow">›</span>
    </div>`;
}

function lipCategoryCard(iconSvg, iconBg, title, desc, count) {
  return `
    <div class="lip-cat-card">
      <div class="lip-cat-icon" style="background:${iconBg}">${iconSvg}</div>
      <div class="lip-cat-title">${title}</div>
      <div class="lip-cat-desc">${desc}</div>
      <div class="lip-cat-count">${count} Articles</div>
    </div>`;
}

function lipResourceCard(badge, badgeColor, img, title, desc, meta, isDownload) {
  return `
    <div class="lip-res-card">
      <div class="lip-res-thumb" style="background:${img}">
        <span class="lip-res-badge" style="background:${badgeColor}">${badge}</span>
        ${badge === 'Video' ? `<div class="lip-res-play">${lipIcons.play}</div>` : ''}
      </div>
      <div class="lip-res-body">
        <div class="lip-res-title">${title}</div>
        <div class="lip-res-desc">${desc}</div>
        <div class="lip-res-meta">${isDownload ? `${lipIcons.download} <span style="color:#16a34a;font-weight:600;">${meta}</span>` : `${lipIcons.clock} ${meta}`}</div>
      </div>
    </div>`;
}

function lipPopularArticle(num, title, time) {
  return `
    <div class="lip-pop-row">
      <span class="lip-pop-num">${num}</span>
      <div class="lip-pop-body">
        <div class="lip-pop-title">${title}</div>
        <div class="lip-pop-time">${lipIcons.clock} ${time}</div>
      </div>
    </div>`;
}

function lipGuideRow(iconBg, iconColor, title, desc, fileType, pages) {
  return `
    <div class="lip-guide-row">
      <span class="lip-guide-icon" style="background:${iconBg};color:${iconColor}">${lipIcons.fileText}</span>
      <div class="lip-guide-body">
        <div class="lip-guide-title">${title}</div>
        <div class="lip-guide-desc">${desc}</div>
      </div>
      <div class="lip-guide-meta">
        <span class="lip-guide-type">${fileType}</span>
        <span class="lip-guide-pages">${pages}</span>
      </div>
    </div>`;
}

function lipVideoRow(img, title, desc, duration) {
  return `
    <div class="lip-vid-row">
      <div class="lip-vid-thumb" style="background:${img}">
        ${lipIcons.play}
        <span class="lip-vid-duration">${duration}</span>
      </div>
      <div class="lip-vid-body">
        <div class="lip-vid-title">${title}</div>
        <div class="lip-vid-desc">${desc}</div>
      </div>
      <button class="lip-vid-watch">Watch Now</button>
    </div>`;
}

/* ── CSS injected once ── */
function injectLearningInProgressStyles() {
  if (document.getElementById('lip-styles')) return;
  const style = document.createElement('style');
  style.id = 'lip-styles';
  style.textContent = `
    .lip-scrollable { padding: 16px 20px; background: #f5f6fa; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #1a1a2e; }
    .lip-layout { display: grid; grid-template-columns: 1fr 300px; gap: 16px; align-items: start; }

    /* ── Hero banner ── */
    .lip-hero { background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border-radius: 12px; padding: 24px 28px; display: flex; align-items: center; gap: 24px; margin-bottom: 18px; grid-column: 1 / -1; }
    .lip-hero-left { flex: 1; }
    .lip-hero-title { font-size: 21px; font-weight: 800; color: #14532d; margin-bottom: 8px; }
    .lip-hero-desc { font-size: 12px; color: #4b5563; line-height: 1.5; margin-bottom: 14px; }
    .lip-hero-search { display: flex; gap: 10px; max-width: 620px; }
    .lip-hero-search-box { flex: 1; display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #d1fae5; border-radius: 8px; padding: 10px 14px; }
    .lip-hero-search-box input { border: none; outline: none; flex: 1; font-size: 12px; }
    .lip-hero-search-btn { background: #16a34a; color: #fff; border: none; border-radius: 8px; padding: 10px 22px; font-size: 12.5px; font-weight: 700; cursor: pointer; }
    .lip-hero-illustration { width: 140px; flex-shrink: 0; }

    /* ── Section header ── */
    .lip-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .lip-section-title { font-size: 15px; font-weight: 800; }
    .lip-section-link { font-size: 12px; color: #16a34a; font-weight: 700; text-decoration: none; }

    /* ── Browse by Category ── */
    .lip-cat-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 20px; grid-column: 1/-1; }
    .lip-cat-card { background: #fff; border: 1px solid #e8eaf0; border-radius: 10px; padding: 16px 14px; text-align: center; }
    .lip-cat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; }
    .lip-cat-title { font-size: 12px; font-weight: 800; margin-bottom: 6px; }
    .lip-cat-desc { font-size: 10px; color: #6b7280; line-height: 1.4; margin-bottom: 8px; min-height: 42px; }
    .lip-cat-count { font-size: 10.5px; color: #16a34a; font-weight: 700; }

    /* ── Featured Resources ── */
    .lip-res-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
    .lip-res-card { background: #fff; border: 1px solid #e8eaf0; border-radius: 10px; overflow: hidden; }
    .lip-res-thumb { position: relative; width: 100%; aspect-ratio: 16/10; background-size: cover; background-position: center; }
    .lip-res-badge { position: absolute; top: 8px; left: 8px; color: #fff; font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 5px; }
    .lip-res-play { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
    .lip-res-play svg { background: rgba(0,0,0,.4); border-radius: 50%; padding: 7px; width: 28px; height: 28px; }
    .lip-res-body { padding: 12px 14px 14px; }
    .lip-res-title { font-size: 12.5px; font-weight: 800; margin-bottom: 5px; line-height: 1.3; }
    .lip-res-desc { font-size: 10.5px; color: #6b7280; line-height: 1.4; margin-bottom: 9px; min-height: 30px; }
    .lip-res-meta { font-size: 10.5px; color: #6b7280; display: flex; align-items: center; gap: 5px; }

    /* ── Guides / Training Videos two-col ── */
    .lip-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; grid-column: 1/-1; }
    .lip-card { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; overflow: hidden; }
    .lip-card-header { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px 10px; border-bottom: 1px solid #f3f4f6; }
    .lip-card-title { font-size: 13.5px; font-weight: 800; }
    .lip-card-link { font-size: 11.5px; color: #16a34a; font-weight: 700; text-decoration: none; }

    .lip-guide-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #f9fafb; }
    .lip-guide-row:last-child { border-bottom: none; }
    .lip-guide-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .lip-guide-body { flex: 1; min-width: 0; }
    .lip-guide-title { font-size: 12px; font-weight: 700; color: #2563eb; margin-bottom: 2px; }
    .lip-guide-desc { font-size: 10.5px; color: #6b7280; line-height: 1.4; }
    .lip-guide-meta { text-align: right; flex-shrink: 0; }
    .lip-guide-type { display: block; font-size: 10px; font-weight: 700; color: #ef4444; }
    .lip-guide-pages { display: block; font-size: 9.5px; color: #9ca3af; margin-top: 1px; }

    .lip-vid-row { display: flex; align-items: center; gap: 12px; padding: 11px 16px; border-bottom: 1px solid #f9fafb; }
    .lip-vid-row:last-child { border-bottom: none; }
    .lip-vid-thumb { position: relative; width: 64px; height: 44px; border-radius: 7px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background-size: cover; }
    .lip-vid-thumb svg { background: rgba(0,0,0,.4); border-radius: 50%; padding: 5px; width: 16px; height: 16px; }
    .lip-vid-duration { position: absolute; bottom: 2px; right: 3px; background: rgba(0,0,0,.6); color: #fff; font-size: 8px; font-weight: 700; padding: 1px 4px; border-radius: 3px; }
    .lip-vid-body { flex: 1; min-width: 0; }
    .lip-vid-title { font-size: 12px; font-weight: 700; margin-bottom: 2px; }
    .lip-vid-desc { font-size: 10.5px; color: #6b7280; line-height: 1.3; }
    .lip-vid-watch { background: none; border: none; color: #16a34a; font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap; }

    /* ── Footer note ── */
    .lip-footer-note { display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: #6b7280; padding: 4px 4px; grid-column: 1/-1; }

    /* ── Right rail ── */
    .lip-right-rail { display: flex; flex-direction: column; gap: 14px; }
    .lip-ql-list { padding: 4px 16px 12px; }
    .lip-ql-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid #f9fafb; cursor: pointer; }
    .lip-ql-row:last-child { border-bottom: none; }
    .lip-ql-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .lip-ql-label { flex: 1; font-size: 12px; font-weight: 700; color: #2563eb; }
    .lip-ql-arrow { color: #9ca3af; font-size: 15px; }

    .lip-pop-list { padding: 4px 16px 12px; }
    .lip-pop-row { display: flex; align-items: flex-start; gap: 10px; padding: 9px 0; border-bottom: 1px solid #f9fafb; }
    .lip-pop-row:last-child { border-bottom: none; }
    .lip-pop-num { width: 20px; height: 20px; background: #f3f4f6; border-radius: 50%; font-size: 10px; font-weight: 800; color: #6b7280; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
    .lip-pop-title { font-size: 11.5px; font-weight: 700; line-height: 1.35; margin-bottom: 3px; }
    .lip-pop-time { font-size: 10px; color: #9ca3af; display: flex; align-items: center; gap: 4px; }

    .lip-help-card { background: #fff; border: 1px solid #e8eaf0; border-radius: 10px; padding: 18px 16px; text-align: center; }
    .lip-help-title { font-size: 14px; font-weight: 800; margin-bottom: 4px; }
    .lip-help-desc { font-size: 11px; color: #6b7280; margin-bottom: 14px; }
    .lip-help-btn { width: 100%; background: #fff; border: 1px solid #16a34a; color: #16a34a; border-radius: 8px; padding: 10px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; margin-bottom: 10px; }
    .lip-help-response { font-size: 10.5px; color: #9ca3af; }
    .lip-suggest-link { display: block; text-align: right; font-size: 11.5px; color: #16a34a; font-weight: 700; text-decoration: none; margin-top: 6px; }
  `;
  document.head.appendChild(style);
}

/* ── SVG icons (no emojis) ── */
const lipIcons = {
  search:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  heart:     `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
  droplet:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>`,
  thermo:    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>`,
  trending:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  dollar:    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 4M12 17h.01"/></svg>`,
  settings:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 005 14.6a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019 9c0 .39.16.74.4 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  lock:      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
  book2:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`,
  shield:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  calculator: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8" y2="11"/><line x1="12" y1="11" x2="12" y2="11"/><line x1="16" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/><line x1="16" y1="15" x2="16" y2="15"/><line x1="8" y1="19" x2="8" y2="19"/><line x1="12" y1="19" x2="12" y2="19"/><line x1="16" y1="19" x2="16" y2="19"/></svg>`,
  fileText:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  clock:     `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  download:  `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  play:      `<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  info:      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  headset:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>`,
};

/* ── Main view function ── */
function viewLearningInProgress(user) {
  injectLearningInProgressStyles();

  return `
  <div class="lip-scrollable">
    <div class="lip-layout">

      <!-- Hero banner -->
      <div class="lip-hero">
        <div class="lip-hero-left">
          <div class="lip-hero-title">Hi John! How can we help you today?</div>
          <div class="lip-hero-desc">Find helpful articles, guides, videos and resources<br>to manage your poultry farm better.</div>
          <div class="lip-hero-search">
            <div class="lip-hero-search-box">
              ${lipIcons.search}
              <input type="text" placeholder="Search for articles, guides, SOPs, and more...">
            </div>
            <button class="lip-hero-search-btn">Search</button>
          </div>
        </div>
        <div class="lip-hero-illustration">
          <svg width="140" height="120" viewBox="0 0 140 120" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="70" cy="108" rx="40" ry="6" fill="#16a34a" opacity=".1"/>
            <rect x="44" y="70" width="14" height="32" fill="#92400e"/>
            <rect x="64" y="62" width="14" height="40" fill="#dc2626"/>
            <rect x="84" y="76" width="14" height="26" fill="#1e3a8a"/>
            <ellipse cx="55" cy="38" rx="22" ry="20" fill="#fff"/>
            <ellipse cx="55" cy="50" rx="16" ry="14" fill="#fff"/>
            <polygon points="40,35 30,32 40,28" fill="#dc2626"/>
            <circle cx="48" cy="34" r="2" fill="#1a1a1a"/>
            <polygon points="33,38 25,40 33,42" fill="#f59e0b"/>
            <path d="M40 18c4-6 12-6 16 0" stroke="#dc2626" stroke-width="4" fill="none" stroke-linecap="round"/>
            <circle cx="105" cy="22" r="9" fill="#fde68a"/>
            <line x1="105" y1="4" x2="105" y2="10" stroke="#fde68a" stroke-width="2"/>
            <line x1="118" y1="22" x2="124" y2="22" stroke="#fde68a" stroke-width="2"/>
            <line x1="115" y1="12" x2="119" y2="8" stroke="#fde68a" stroke-width="2"/>
          </svg>
        </div>
      </div>

      <!-- Browse by Category -->
      <div class="lip-section-header" style="grid-column:1/-1;margin-bottom:0;">
        <span class="lip-section-title">Browse by Category</span>
        <a href="#" class="lip-section-link">View All Categories <i class="fa-solid fa-arrow-right"></i></a>
      </div>
      <div class="lip-cat-grid">
        ${lipCategoryCard(lipIcons.heart, '#d1fae5', 'Bird Health', 'Diseases, prevention, treatment and care', '48')}
        ${lipCategoryCard(lipIcons.droplet, '#dbeafe', 'Feed &amp; Nutrition', 'Feeding management, nutrition and additives', '36')}
        ${lipCategoryCard(lipIcons.thermo, '#ffedd5', 'Environment', 'Temperature, humidity, ventilation and more', '32')}
        ${lipCategoryCard(lipIcons.trending, '#ede9fe', 'Performance', 'Growth, FCR, mortality and productivity', '27')}
        ${lipCategoryCard(lipIcons.dollar, '#fee2e2', 'Financials', 'Costs, profits, ROI and financial planning', '22')}
        ${lipCategoryCard(lipIcons.settings, '#ccfbf1', 'Farm Management', 'Best practices, planning and operations', '31')}
      </div>

      <!-- Featured Resources -->
      <div style="grid-column:1/-1;">
        <div class="lip-section-header">
          <span class="lip-section-title">Featured Resources</span>
          <a href="#" class="lip-section-link">View All <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="lip-res-grid">
          ${lipResourceCard('Guide', '#16a34a', 'linear-gradient(135deg,#1e293b,#0f172a)', 'Biosecurity Best Practices', 'A complete guide to biosecurity measures to keep your flock healthy.', '12 min read')}
          ${lipResourceCard('Article', '#3b82f6', 'linear-gradient(135deg,#78350f,#451a03)', 'Optimizing Feed Efficiency', 'Tips and techniques to improve FCR and reduce feed costs.', '8 min read')}
          ${lipResourceCard('Video', '#7c3aed', 'linear-gradient(135deg,#92400e,#451a03)', 'Ventilation Management', 'Learn how to manage ventilation for optimum bird performance.', '15 min watch')}
          ${lipResourceCard('SOP', '#16a34a', 'linear-gradient(135deg,#fef3c7,#fde68a)', 'Daily Farm Check SOP', 'Step-by-step daily checklist for better farm management.', 'Download PDF', true)}
        </div>
      </div>

      <!-- Guides + Training Videos -->
      <div class="lip-two-col">
        <div class="lip-card">
          <div class="lip-card-header">
            <span class="lip-card-title">Guides</span>
            <a href="#" class="lip-card-link">View All <i class="fa-solid fa-arrow-right"></i></a>
          </div>
          <div>
            ${lipGuideRow('#d1fae5', '#16a34a', 'Complete Poultry Farming Guide for Beginners', 'Beginner friendly guide to start and manage a successful poultry farm.', 'PDF', '24 Pages')}
            ${lipGuideRow('#dbeafe', '#2563eb', 'Nutrition Management Guide', 'Detailed information on nutrients, feed formulation and feeding stages.', 'PDF', '18 Pages')}
            ${lipGuideRow('#fee2e2', '#dc2626', 'Poultry Farm Hygiene &amp; Sanitation Guide', 'Best practices for cleaning, disinfection and sanitation on farm.', 'PDF', '16 Pages')}
          </div>
        </div>

        <div class="lip-card">
          <div class="lip-card-header">
            <span class="lip-card-title">Training Videos</span>
            <a href="#" class="lip-card-link">View All <i class="fa-solid fa-arrow-right"></i></a>
          </div>
          <div>
            ${lipVideoRow('linear-gradient(135deg,#92400e,#451a03)', 'Brooding Management Best Practices', 'Learn the key steps for successful brooding.', '12:45')}
            ${lipVideoRow('linear-gradient(135deg,#78350f,#451a03)', 'Feed Formulation Basics', 'Understand how balanced feed improves growth.', '14:20')}
            ${lipVideoRow('linear-gradient(135deg,#1e293b,#0f172a)', 'Managing Respiratory Diseases', 'Prevention and control of common respiratory issues.', '16:30')}
          </div>
        </div>
      </div>

      <!-- Footer note -->
      <div class="lip-footer-note">
        ${lipIcons.info}
        <span>Browse the available learning resources and support guidance.</span>
      </div>

      <!-- Right Rail -->
      <div class="lip-right-rail">

        <!-- Quick Links -->
        <div class="lip-card">
          <div class="lip-card-header"><span class="lip-card-title">Quick Links</span></div>
          <div class="lip-ql-list">
            ${lipQuickLink(lipIcons.lock, '#d1fae5', 'Download SOPs &amp; Checklists')}
            ${lipQuickLink(lipIcons.book2, '#cffafe', 'Disease Library')}
            ${lipQuickLink(lipIcons.shield, '#ede9fe', 'Regulatory &amp; Compliance')}
            ${lipQuickLink(lipIcons.calculator, '#ffedd5', 'Tools &amp; Calculators')}
            ${lipQuickLink(lipIcons.fileText, '#fee2e2', 'Templates &amp; Forms')}
          </div>
        </div>

        <!-- Popular Articles -->
        <div class="lip-card">
          <div class="lip-card-header">
            <span class="lip-card-title">Popular Articles</span>
            <a href="#" class="lip-card-link">View All <i class="fa-solid fa-arrow-right"></i></a>
          </div>
          <div class="lip-pop-list">
            ${lipPopularArticle(1, 'Newcastle Disease: Symptoms, Prevention &amp; Treatment', '7 min read')}
            ${lipPopularArticle(2, 'Ideal Brooding Management for Day-Old Chicks', '6 min read')}
            ${lipPopularArticle(3, 'Heat Stress in Poultry and How to Manage It', '9 min read')}
            ${lipPopularArticle(4, 'Understanding FCR and How to Improve It', '5 min read')}
            ${lipPopularArticle(5, 'Vaccination Schedule for Commercial Broilers', '4 min read')}
          </div>
        </div>

        <!-- Still Need Help -->
        <div class="lip-help-card">
          <div class="lip-help-title">Still Need Help?</div>
          <div class="lip-help-desc">Our support team is here to help you.</div>
          <div class="lip-help-response">Average response time: 5 min</div>
        </div>

      </div>

    </div>
  </div>`;
}
