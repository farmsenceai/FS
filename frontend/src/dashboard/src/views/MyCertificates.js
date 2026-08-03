/* views/MyCertificates.js */

window.metaMyCertificates = {
  title: 'My Certificates',
  subtitle: 'Your learning achievements and certifications'
};

/* ── Helper functions ── */

function mcHeroStat(label, value) {
  return `
    <div class="mc-hero-stat">
      <div class="mc-hero-stat-label">${label}</div>
      <div class="mc-hero-stat-value">${value}</div>
    </div>`;
}

function mcCertSvg(borderColor, accentColor, courseName, certType, dateLabel, badgeColor) {
  return `
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
      <rect x="0" y="0" width="320" height="200" fill="#fdfdfb"/>
      <rect x="0" y="0" width="320" height="200" fill="none" stroke="${borderColor}" stroke-width="3"/>
      <rect x="8" y="8" width="304" height="184" fill="none" stroke="${borderColor}" stroke-width="1" opacity=".5"/>
      <!-- corner flourishes -->
      <polygon points="0,0 36,0 0,36" fill="${accentColor}" opacity=".85"/>
      <polygon points="320,0 284,0 320,36" fill="${borderColor}" opacity=".85"/>
      <polygon points="0,200 36,200 0,164" fill="${borderColor}" opacity=".85"/>
      <polygon points="320,200 284,200 320,164" fill="${accentColor}" opacity=".85"/>
      <!-- header -->
      <image href="/assets/logos/Farmsence_Black.svg" x="117" y="16" width="86" height="19" preserveAspectRatio="xMidYMid meet"/>
      <text x="160" y="58" font-size="17" font-weight="800" fill="#1a1a2e" text-anchor="middle" font-family="Georgia, serif" letter-spacing="2">CERTIFICATE</text>
      <text x="160" y="72" font-size="8" fill="#6b7280" text-anchor="middle" font-family="Arial" letter-spacing="2">${certType}</text>
      <text x="160" y="90" font-size="7.5" fill="#9ca3af" text-anchor="middle" font-family="Arial">This is to certify that</text>
      <text x="160" y="110" font-size="15" fill="${accentColor}" text-anchor="middle" font-family="Georgia, serif" font-style="italic">John Doe</text>
      <text x="160" y="126" font-size="7" fill="#9ca3af" text-anchor="middle" font-family="Arial">has successfully completed the course</text>
      <text x="160" y="140" font-size="9.5" font-weight="700" fill="${accentColor}" text-anchor="middle" font-family="Arial">${courseName}</text>
      <!-- signature row -->
      <line x1="40" y1="172" x2="100" y2="172" stroke="#9ca3af" stroke-width="0.5"/>
      <text x="70" y="182" font-size="6" fill="#9ca3af" text-anchor="middle" font-family="Arial">Sarah Patel, CEO</text>
      <circle cx="160" cy="172" r="11" fill="${badgeColor}"/>
      <path d="M160 166.5l2.2 4.5 5 .7-3.6 3.5.8 5-4.4-2.4-4.4 2.4.8-5-3.6-3.5 5-.7z" fill="#fff"/>
      <line x1="220" y1="172" x2="280" y2="172" stroke="#9ca3af" stroke-width="0.5"/>
      <text x="250" y="182" font-size="6" fill="#9ca3af" text-anchor="middle" font-family="Arial">${dateLabel}</text>
    </svg>`;
}

function mcCertCard(borderColor, accentColor, courseName, certType, dateLabel, badgeColor, title, tagLabel, tagBg, tagColor, date) {
  return `
    <div class="mc-cert-card">
      <div class="mc-cert-thumb">${mcCertSvg(borderColor, accentColor, courseName, certType, dateLabel, badgeColor)}</div>
      <div class="mc-cert-info">
        <div class="mc-cert-title">${title}</div>
        <div class="mc-cert-meta-row">
          <span class="mc-cert-tag" style="background:${tagBg};color:${tagColor}">${tagLabel}</span>
          <span class="mc-cert-date">${mcIcons.calendar} ${date}</span>
        </div>
        <div class="mc-cert-actions">
          <button class="mc-cert-view-btn">View Certificate</button>
          <button class="mc-cert-dl-btn">${mcIcons.download}</button>
        </div>
      </div>
    </div>`;
}

function mcSummaryRow(color, label, value) {
  return `
    <div class="mc-summary-row">
      <span class="mc-summary-dot" style="background:${color}"></span>
      <span class="mc-summary-label">${label}</span>
      <span class="mc-summary-value">${value}</span>
    </div>`;
}

/* ── CSS injected once ── */
function injectMyCertificatesStyles() {
  if (document.getElementById('mc-styles')) return;
  const style = document.createElement('style');
  style.id = 'mc-styles';
  style.textContent = `
    .mc-scrollable { padding: 16px 20px; background: #f5f6fa; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #1a1a2e; }
    .mc-layout { display: grid; grid-template-columns: 1fr 300px; gap: 16px; align-items: start; }

    /* ── Hero banner ── */
    .mc-hero { background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border-radius: 12px; padding: 22px 28px; display: flex; align-items: center; gap: 22px; margin-bottom: 16px; grid-column: 1/-1; position: relative; overflow: hidden; }
    .mc-hero-icon { width: 56px; height: 56px; background: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
    .mc-hero-text { flex: 1; }
    .mc-hero-title { font-size: 18px; font-weight: 800; color: #14532d; margin-bottom: 4px; }
    .mc-hero-desc { font-size: 11.5px; color: #4b5563; line-height: 1.4; }
    .mc-hero-stats { display: flex; gap: 18px; }
    .mc-hero-stat { background: #fff; border-radius: 8px; padding: 10px 16px; text-align: center; min-width: 90px; }
    .mc-hero-stat-label { font-size: 9.5px; color: #6b7280; margin-bottom: 4px; }
    .mc-hero-stat-value { font-size: 19px; font-weight: 800; color: #111827; }

    /* ── Tab bar ── */
    .mc-tab-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; grid-column: 1/-1; }
    .mc-tab-group { display: flex; gap: 6px; background: #fff; border: 1px solid #e8eaf0; border-radius: 8px; padding: 4px; }
    .mc-tab { background: none; border: none; padding: 7px 14px; font-size: 11.5px; font-weight: 600; color: #6b7280; border-radius: 6px; cursor: pointer; white-space: nowrap; }
    .mc-tab.active { background: #f0fdf4; color: #16a34a; }
    .mc-sort-select { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 11.5px; background: #fff; cursor: pointer; color: #374151; }

    /* ── Certificate grid ── */
    .mc-cert-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
    .mc-cert-card { background: #fff; border: 1px solid #e8eaf0; border-radius: 10px; overflow: hidden; }
    .mc-cert-thumb { padding: 10px; background: #f9fafb; }
    .mc-cert-info { padding: 12px 14px 14px; }
    .mc-cert-title { font-size: 13px; font-weight: 800; margin-bottom: 8px; line-height: 1.3; }
    .mc-cert-meta-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .mc-cert-tag { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 5px; }
    .mc-cert-date { font-size: 10.5px; color: #6b7280; display: flex; align-items: center; gap: 4px; }
    .mc-cert-actions { display: flex; gap: 8px; }
    .mc-cert-view-btn { flex: 1; background: #16a34a; color: #fff; border: none; border-radius: 7px; padding: 9px; font-size: 11.5px; font-weight: 700; cursor: pointer; }
    .mc-cert-dl-btn { width: 38px; background: #fff; border: 1px solid #e5e7eb; border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

    /* ── Pagination ── */
    .mc-pagination-row { display: flex; justify-content: center; align-items: center; gap: 6px; margin-bottom: 4px; grid-column: 1/-1; }
    .mc-page-btn { width: 30px; height: 30px; border: 1px solid #e5e7eb; background: #fff; border-radius: 7px; font-size: 12px; cursor: pointer; color: #6b7280; display: flex; align-items: center; justify-content: center; }
    .mc-page-btn.active { background: #16a34a; color: #fff; border-color: #16a34a; font-weight: 700; }

    /* ── Right rail ── */
    .mc-right-rail { display: flex; flex-direction: column; gap: 14px; }
    .mc-card { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; overflow: hidden; }
    .mc-card-pad { padding: 16px; }
    .mc-card-title { font-size: 13px; font-weight: 800; margin-bottom: 4px; }

    /* Certificate summary */
    .mc-cs-donut { position: relative; width: 130px; height: 130px; margin: 14px auto; }
    .mc-cs-donut svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .mc-cs-donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .mc-cs-donut-val { font-size: 24px; font-weight: 800; }
    .mc-cs-donut-lbl { font-size: 10px; color: #6b7280; }
    .mc-summary-list { display: flex; flex-direction: column; gap: 9px; margin-bottom: 14px; }
    .mc-summary-row { display: flex; align-items: center; gap: 8px; font-size: 11.5px; }
    .mc-summary-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
    .mc-summary-label { flex: 1; color: #374151; }
    .mc-summary-value { font-weight: 700; color: #111827; }
    .mc-cs-btn { width: 100%; background: #fff; border: 1px solid #16a34a; color: #16a34a; border-radius: 8px; padding: 9px; font-size: 12px; font-weight: 700; cursor: pointer; }

    /* Recent achievement */
    .mc-ra-body { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
    .mc-ra-thumb { width: 56px; height: 40px; border-radius: 6px; overflow: hidden; flex-shrink: 0; border: 1px solid #e8eaf0; }
    .mc-ra-title { font-size: 12px; font-weight: 700; line-height: 1.3; margin-bottom: 3px; }
    .mc-ra-date { font-size: 10px; color: #9ca3af; }
    .mc-ra-btn { width: 100%; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 9px; font-size: 11.5px; font-weight: 600; color: #374151; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }

    /* Share */
    .mc-share-desc { font-size: 11px; color: #6b7280; line-height: 1.4; margin-bottom: 14px; }
    .mc-share-icons { display: flex; gap: 10px; margin-bottom: 14px; }
    .mc-share-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #fff; }
    .mc-share-dl-btn { width: 100%; background: #16a34a; color: #fff; border: none; border-radius: 8px; padding: 9px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }

    /* Need help */
    .mc-help-title { font-size: 13px; font-weight: 800; margin-bottom: 6px; }
    .mc-help-desc { font-size: 11px; color: #6b7280; line-height: 1.4; margin-bottom: 12px; }
    .mc-help-btn { width: 100%; background: #fff; border: 1px solid #16a34a; color: #16a34a; border-radius: 8px; padding: 9px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
  `;
  document.head.appendChild(style);
}

/* ── SVG icons (no emojis) ── */
const mcIcons = {
  ribbon:     `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M9 13.5L7 22l5-3 5 3-2-8.5"/></svg>`,
  calendar:   `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  download:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  downloadWhite: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  share:      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
  headset:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>`,
  linkedin:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.27c-.97 0-1.75-.78-1.75-1.75s.78-1.75 1.75-1.75 1.75.78 1.75 1.75-.78 1.75-1.75 1.75zm13.5 12.27h-3v-5.6c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.7h-3v-11h2.88v1.5h.04c.4-.76 1.38-1.56 2.84-1.56 3.03 0 3.6 2 3.6 4.59v6.47z"/></svg>`,
  facebook:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"/></svg>`,
  twitter:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M23.95 4.57a10 10 0 01-2.82.77 4.96 4.96 0 002.16-2.72c-.95.56-2 .96-3.12 1.18a4.92 4.92 0 00-8.38 4.48A13.94 13.94 0 011.64 3.16a4.92 4.92 0 001.52 6.57A4.9 4.9 0 01.96 9v.06a4.92 4.92 0 003.95 4.83 4.9 4.9 0 01-2.22.08 4.93 4.93 0 004.6 3.42A9.87 9.87 0 010 19.54a13.94 13.94 0 007.55 2.21c9.05 0 14-7.5 14-14v-.64A9.94 9.94 0 0024 4.59z"/></svg>`,
  link:       `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>`,
};

/* ── Main view function ── */
function viewMyCertificates(user) {
  injectMyCertificatesStyles();

  return `
  <div class="mc-scrollable">
    <div class="mc-layout">

      <!-- Hero banner -->
      <div class="mc-hero">
        <div class="mc-hero-icon">${mcIcons.ribbon}</div>
        <div class="mc-hero-text">
          <div class="mc-hero-title">Celebrate your achievements!</div>
          <div class="mc-hero-desc">Keep learning, keep growing. Your dedication drives better farming and stronger future.</div>
        </div>
        <div class="mc-hero-stats">
          ${mcHeroStat('Total Certificates', '12')}
          ${mcHeroStat('Completed Courses', '8')}
          ${mcHeroStat('Total Hours Learned', '18h 45m')}
          ${mcHeroStat('Active Streak', '24 Days')}
        </div>
      </div>

      <!-- Tab row -->
      <div class="mc-tab-row">
        <div class="mc-tab-group">
          <button class="mc-tab active">All Certificates (12)</button>
          <button class="mc-tab">Course Certificates (8)</button>
          <button class="mc-tab">Skill Certificates (3)</button>
          <button class="mc-tab">Webinar Certificates (1)</button>
        </div>
        <select class="mc-sort-select"><option>Sort by: Latest First</option></select>
      </div>

      <!-- Certificate Grid -->
      <div class="mc-cert-grid">
        ${mcCertCard('#16a34a', '#16a34a', 'Complete Broiler Farming Masterclass', 'OF COMPLETION', '10 May 2024', '#d97706', 'Complete Broiler Farming Masterclass', 'Course Certificate', '#d1fae5', '#16a34a', '10 May 2024')}
        ${mcCertCard('#2563eb', '#2563eb', 'Disease Prevention &amp; Biosecurity', 'OF ACHIEVEMENT', '28 Apr 2024', '#2563eb', 'Disease Prevention &amp; Biosecurity', 'Course Certificate', '#dbeafe', '#2563eb', '28 Apr 2024')}
        ${mcCertCard('#16a34a', '#16a34a', 'Nutrition &amp; Feed Management', 'OF COMPLETION', '15 Apr 2024', '#16a34a', 'Nutrition &amp; Feed Management', 'Course Certificate', '#d1fae5', '#16a34a', '15 Apr 2024')}
        ${mcCertCard('#7c3aed', '#7c3aed', 'AI Insights for Poultry Farms', 'OF ACHIEVEMENT', '05 Apr 2024', '#7c3aed', 'AI Insights for Poultry Farms', 'Skill Certificate', '#ede9fe', '#7c3aed', '05 Apr 2024')}
        ${mcCertCard('#ea580c', '#ea580c', 'Water Management Best Practices', 'OF COMPLETION', '23 Mar 2024', '#ea580c', 'Water Management Best Practices', 'Course Certificate', '#ffedd5', '#ea580c', '22 Mar 2024')}
        ${mcCertCard('#dc2626', '#dc2626', 'Latest Trends in Poultry Industry 2024', 'OF PARTICIPATION', '10 Mar 2024', '#dc2626', 'Latest Trends in Poultry Industry 2024', 'Webinar Certificate', '#fee2e2', '#dc2626', '10 Mar 2024')}
      </div>

      <!-- Pagination -->
      <div class="mc-pagination-row">
        <span class="mc-page-btn">&#8249;</span>
        <span class="mc-page-btn active">1</span>
        <span class="mc-page-btn">2</span>
        <span class="mc-page-btn">&#8250;</span>
      </div>

      <!-- Right Rail -->
      <div class="mc-right-rail">

        <!-- Certificate Summary -->
        <div class="mc-card mc-card-pad">
          <div class="mc-card-title">Certificate Summary</div>
          <div class="mc-cs-donut">
            <svg viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="52" fill="none" stroke="#e8eaf0" stroke-width="16"/>
              <circle cx="65" cy="65" r="52" fill="none" stroke="#16a34a" stroke-width="16" stroke-dasharray="${2*Math.PI*52*0.667} ${2*Math.PI*52*0.333}"/>
              <circle cx="65" cy="65" r="52" fill="none" stroke="#3b82f6" stroke-width="16" stroke-dasharray="${2*Math.PI*52*0.25} ${2*Math.PI*52*0.75}" stroke-dashoffset="${-2*Math.PI*52*0.667}"/>
              <circle cx="65" cy="65" r="52" fill="none" stroke="#f97316" stroke-width="16" stroke-dasharray="${2*Math.PI*52*0.083} ${2*Math.PI*52*0.917}" stroke-dashoffset="${-2*Math.PI*52*0.917}"/>
            </svg>
            <div class="mc-cs-donut-center">
              <div class="mc-cs-donut-val">12</div>
              <div class="mc-cs-donut-lbl">Total</div>
            </div>
          </div>
          <div class="mc-summary-list">
            ${mcSummaryRow('#16a34a', 'Course Certificates', '8')}
            ${mcSummaryRow('#3b82f6', 'Skill Certificates', '3')}
            ${mcSummaryRow('#f97316', 'Webinar Certificates', '1')}
          </div>
          <button class="mc-cs-btn">View All Certificates</button>
        </div>

        <!-- Recent Achievement -->
        <div class="mc-card mc-card-pad">
          <div class="mc-card-title">Recent Achievement</div>
          <div class="mc-ra-body" style="margin-top:10px;">
            <div class="mc-ra-thumb">${mcCertSvg('#16a34a', '#16a34a', 'Complete Broiler Farming Masterclass', 'OF COMPLETION', '10 May 2024', '#d97706')}</div>
            <div>
              <div class="mc-ra-title">Complete Broiler Farming Masterclass</div>
              <div class="mc-ra-date">Earned on 10 May 2024</div>
            </div>
          </div>
        </div>

        <!-- Need Help -->
        <div class="mc-card mc-card-pad">
          <div class="mc-help-title">Need Help?</div>
          <div class="mc-help-desc">If you have any questions about your certificates, our support team is here to help.</div>
        </div>

      </div>

    </div>
  </div>`;
}
