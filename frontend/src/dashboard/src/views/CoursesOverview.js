/* views/CoursesOverview.js */

window.metaCoursesOverview = {
  title: 'Couses Overview',
  subtitle: 'Learn, grow and excel in modern poultry farming.'
};

/* ── Helper functions ── */

function coHeroStat(iconSvg, iconBg, value, label) {
  return `
    <div class="co-hero-stat">
      <div class="co-hero-stat-icon" style="background:${iconBg}">${iconSvg}</div>
      <div class="co-hero-stat-value">${value}</div>
      <div class="co-hero-stat-label">${label}</div>
    </div>`;
}

function coCategoryChip(label, active) {
  return `<button class="co-chip${active ? ' active' : ''}">${label}</button>`;
}

function coCourseCard(badge, badgeColor, img, title, desc, duration, level, rating, ratingCount, enrolled, instructor, instructorInitials, ctaLabel, ctaStyle, progress) {
  return `
    <div class="co-course-card">
      <div class="co-course-thumb" style="background:${img}">
        <span class="co-course-badge" style="background:${badgeColor}">${badge}</span>
      </div>
      <div class="co-course-body">
        <div class="co-course-title">${title}</div>
        <div class="co-course-desc">${desc}</div>
        <div class="co-course-meta">
          <span class="co-meta-item">${coIcons.clock} ${duration}</span>
          <span class="co-meta-item">${coIcons.bars} ${level}</span>
          <span class="co-meta-item">${coIcons.star} ${rating} (${ratingCount})</span>
        </div>
        <div class="co-course-instructor">
          <span class="co-meta-item">${coIcons.users} ${enrolled} Enrolled</span>
          <span class="co-instructor-avatar">${instructorInitials}</span>
          <span class="co-instructor-name">${instructor}</span>
        </div>
        ${progress !== undefined ? `
          <div class="co-progress-row">
            <span class="co-progress-label">${progress}% Completed</span>
          </div>
          <div class="co-progress-track"><div class="co-progress-fill" style="width:${progress}%"></div></div>
        ` : ''}
        ${ctaStyle === 'outline-cert' ? `<div class="co-cert-available">${coIcons.checkCircle} Certificate Available</div>` : ''}
      </div>
    </div>`;
}

function coPathStep(num, title, desc, courses) {
  return `
    <div class="co-path-step">
      <div class="co-path-num">${num}</div>
      <div class="co-path-body">
        <div class="co-path-title">${title}</div>
        <div class="co-path-desc">${desc}</div>
        <div class="co-path-courses">${courses}</div>
      </div>
    </div>`;
}

function coEnrolledRow(thumbColor, title, level, duration, progress, completion, quizzes, assignments, cert, lastAccessed, action) {
  return `
    <tr>
      <td>
        <div class="co-enr-course">
          <div class="co-enr-thumb" style="background:${thumbColor}">${coIcons.playSmall}</div>
          <div>
            <div class="co-enr-title">${title}</div>
            <div class="co-enr-sub">${level} &nbsp;•&nbsp; ${duration}</div>
          </div>
        </div>
      </td>
      <td>
        <div class="co-enr-progress-track"><div class="co-enr-progress-fill" style="width:${progress}%"></div></div>
      </td>
      <td class="co-enr-pct">${completion}%</td>
      <td>${coIcons.barsSmall} ${quizzes}</td>
      <td>${assignments}</td>
      <td>${cert === 'Issued' ? `<span class="co-cert-issued">${coIcons.checkSmall} Issued</span>` : '—'}</td>
      <td class="co-enr-date">${lastAccessed}</td>
    </tr>`;
}

function coLeaderboardRow(rank, name, xp, isUser) {
  const medalColors = { 1: '#f59e0b', 2: '#9ca3af', 3: '#ea580c' };
  return `
    <div class="co-lb-row${isUser ? ' user' : ''}">
      <span class="co-lb-rank" style="color:${medalColors[rank] || '#6b7280'}">${rank}</span>
      <span class="co-lb-avatar">${name.charAt(0)}</span>
      <span class="co-lb-name">${name}</span>
      <span class="co-lb-xp">${xp} XP</span>
    </div>`;
}

function coRecommendedItem(thumbColor, title, level, duration, rating) {
  return `
    <div class="co-rec-item">
      <div class="co-rec-thumb" style="background:${thumbColor}">${coIcons.playSmall}</div>
      <div class="co-rec-body">
        <div class="co-rec-title">${title}</div>
        <div class="co-rec-meta">${level} &nbsp;•&nbsp; ${duration}</div>
      </div>
      <div class="co-rec-rating">${coIcons.star} ${rating}</div>
    </div>`;
}

/* ── CSS injected once ── */
function injectCoursesOverviewStyles() {
  if (document.getElementById('co-styles')) return;
  const style = document.createElement('style');
  style.id = 'co-styles';
  style.textContent = `
    .co-scrollable { padding: 16px 20px; background: #f5f6fa; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #1a1a2e; }
    .co-layout { display: grid; grid-template-columns: 1fr 340px; gap: 16px; align-items: start; }

    /* ── Hero banner ── */
    .co-hero { background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border-radius: 12px; padding: 24px 28px; display: flex; align-items: center; gap: 28px; margin-bottom: 16px; grid-column: 1 / -1; }
    .co-hero-left { flex: 1; }
    .co-hero-title { font-size: 24px; font-weight: 800; color: #15803d; line-height: 1.25; margin-bottom: 8px; }
    .co-hero-desc { font-size: 12.5px; color: #4b5563; margin-bottom: 16px; }
    .co-hero-btn { background: #16a34a; color: #fff; border: none; border-radius: 8px; padding: 10px 18px; font-size: 12.5px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
    .co-hero-stats { display: flex; gap: 22px; }
    .co-hero-stat { text-align: center; }
    .co-hero-stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; }
    .co-hero-stat-value { font-size: 19px; font-weight: 800; }
    .co-hero-stat-label { font-size: 9.5px; color: #6b7280; }
    .co-hero-illustration { width: 140px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }

    /* ── Search & categories ── */
    .co-search-row { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; flex-wrap: wrap; }
    .co-search-box { flex: 1; min-width: 240px; display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 9px 14px; }
    .co-search-box input { border: none; outline: none; flex: 1; font-size: 12px; }
    .co-cat-label { font-size: 12px; font-weight: 700; color: #374151; white-space: nowrap; }
    .co-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .co-chip { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 20px; padding: 6px 14px; font-size: 11.5px; cursor: pointer; color: #374151; white-space: nowrap; }
    .co-chip.active { background: #d1fae5; border-color: #16a34a; color: #15803d; font-weight: 700; }

    /* ── Section header ── */
    .co-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .co-section-title { font-size: 15px; font-weight: 800; }
    .co-section-link { font-size: 12px; color: #16a34a; font-weight: 700; text-decoration: none; }

    /* ── Featured Courses grid ── */
    .co-courses-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
    .co-course-card { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; overflow: hidden; }
    .co-course-thumb { position: relative; width: 100%; aspect-ratio: 16/10; background-size: cover; background-position: center; }
    .co-course-badge { position: absolute; top: 8px; left: 8px; color: #fff; font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 5px; }
    .co-course-body { padding: 12px 14px 14px; }
    .co-course-title { font-size: 13px; font-weight: 800; margin-bottom: 5px; line-height: 1.3; }
    .co-course-desc { font-size: 11px; color: #6b7280; line-height: 1.4; margin-bottom: 9px; min-height: 30px; }
    .co-course-meta { display: flex; gap: 10px; font-size: 10.5px; color: #6b7280; margin-bottom: 8px; flex-wrap: wrap; }
    .co-meta-item { display: inline-flex; align-items: center; gap: 3px; }
    .co-course-instructor { display: flex; align-items: center; gap: 6px; font-size: 10.5px; color: #6b7280; margin-bottom: 10px; }
    .co-instructor-avatar { width: 18px; height: 18px; border-radius: 50%; background: #d1fae5; color: #16a34a; font-size: 8px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin-left: 6px; }
    .co-instructor-name { font-weight: 600; color: #374151; }
    .co-course-cta { width: 100%; border-radius: 7px; padding: 8px; font-size: 12px; font-weight: 700; cursor: pointer; }
    .co-course-cta.primary { background: #16a34a; color: #fff; border: none; }
    .co-course-cta.outline { background: #fff; color: #16a34a; border: 1px solid #16a34a; }
    .co-course-cta.outline-cert { background: #fff; color: #16a34a; border: 1px solid #16a34a; }
    .co-progress-row { margin-top: 8px; font-size: 10.5px; color: #6b7280; }
    .co-progress-track { height: 5px; background: #e8eaf0; border-radius: 3px; overflow: hidden; margin-top: 4px; }
    .co-progress-fill { height: 100%; background: #16a34a; border-radius: 3px; }
    .co-cert-available { display: flex; align-items: center; gap: 5px; font-size: 10.5px; color: #16a34a; font-weight: 600; margin-top: 8px; }

    /* ── Learning Path ── */
    .co-path-row { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; padding: 18px; display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
    .co-path-step { display: flex; align-items: flex-start; gap: 10px; flex: 1; }
    .co-path-num { width: 38px; height: 38px; background: #ede9fe; color: #7c3aed; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; flex-shrink: 0; }
    .co-path-title { font-size: 12.5px; font-weight: 800; margin-bottom: 2px; }
    .co-path-desc { font-size: 10.5px; color: #6b7280; line-height: 1.4; margin-bottom: 3px; }
    .co-path-courses { font-size: 10.5px; color: #16a34a; font-weight: 600; }
    .co-path-arrow { color: #9ca3af; font-size: 16px; flex-shrink: 0; align-self: center; }
    .co-path-trophy { display: flex; flex-direction: column; align-items: center; text-align: center; flex: 0 0 110px; }
    .co-path-trophy-icon { width: 38px; height: 38px; background: #fef3c7; color: #d97706; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 6px; }
    .co-path-trophy-title { font-size: 11.5px; font-weight: 800; }
    .co-path-trophy-desc { font-size: 9.5px; color: #6b7280; margin-top: 2px; }

    /* ── My Enrolled Courses table ── */
    .co-enr-card { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; overflow: hidden; }
    .co-enr-table { width: 100%; border-collapse: collapse; }
    .co-enr-table th { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .4px; padding: 10px 14px; text-align: left; background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
    .co-enr-table td { padding: 10px 14px; font-size: 11.5px; border-bottom: 1px solid #f9fafb; vertical-align: middle; }
    .co-enr-table tr:last-child td { border-bottom: none; }
    .co-enr-course { display: flex; align-items: center; gap: 10px; }
    .co-enr-thumb { width: 40px; height: 40px; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .co-enr-title { font-weight: 700; color: #111827; }
    .co-enr-sub { font-size: 10px; color: #9ca3af; }
    .co-enr-progress-track { width: 90px; height: 6px; background: #e8eaf0; border-radius: 3px; overflow: hidden; }
    .co-enr-progress-fill { height: 100%; background: #16a34a; border-radius: 3px; }
    .co-enr-pct { font-weight: 700; }
    .co-cert-issued { color: #16a34a; font-weight: 600; display: inline-flex; align-items: center; gap: 3px; }
    .co-enr-date { color: #6b7280; }
    .co-enr-action { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; border-radius: 6px; padding: 5px 14px; font-size: 11px; font-weight: 700; cursor: pointer; }
    .co-enr-footer { padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #6b7280; }
    .co-enr-footer a { color: #16a34a; font-weight: 700; text-decoration: none; }

    /* ── Right Rail ── */
    .co-right-rail { display: flex; flex-direction: column; gap: 14px; }
    .co-card { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; overflow: hidden; }
    .co-card-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px 10px; border-bottom: 1px solid #f3f4f6; }
    .co-card-title { font-size: 13px; font-weight: 800; }
    .co-card-link { font-size: 11px; color: #16a34a; font-weight: 700; text-decoration: none; }

    /* Continue learning */
    .co-cl-body { padding: 12px 14px; display: flex; gap: 10px; align-items: center; }
    .co-cl-thumb { width: 64px; height: 48px; border-radius: 7px; background: linear-gradient(135deg,#1e3a8a,#1e40af); flex-shrink: 0; display: flex; align-items: center; justify-content: center; position: relative; }
    .co-cl-title { font-size: 12px; font-weight: 700; margin-bottom: 4px; }
    .co-cl-pct { font-size: 10px; color: #16a34a; font-weight: 600; margin-bottom: 4px; }
    .co-cl-track { height: 5px; background: #e8eaf0; border-radius: 3px; overflow: hidden; margin-bottom: 8px; }
    .co-cl-fill { height: 100%; background: #16a34a; border-radius: 3px; }
    .co-cl-foot { display: flex; align-items: center; justify-content: space-between; }
    .co-cl-time { font-size: 10px; color: #9ca3af; }
    .co-cl-btn { background: #16a34a; color: #fff; border: none; border-radius: 6px; padding: 5px 12px; font-size: 10.5px; font-weight: 700; cursor: pointer; }

    /* Upcoming Live Classes */
    .co-class-list { padding: 6px 14px 12px; }
    .co-class-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid #f9fafb; }
    .co-class-row:last-child { border-bottom: none; }
    .co-class-date { width: 42px; height: 42px; background: #f0fdf4; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
    .co-class-day { font-size: 13px; font-weight: 800; color: #16a34a; line-height: 1; }
    .co-class-month { font-size: 8px; color: #16a34a; font-weight: 700; text-transform: uppercase; }
    .co-class-info { flex: 1; min-width: 0; }
    .co-class-title { font-size: 11.5px; font-weight: 700; margin-bottom: 2px; }
    .co-class-meta { font-size: 10px; color: #6b7280; }
    .co-class-btn { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 5px 11px; font-size: 10.5px; font-weight: 600; color: #374151; cursor: pointer; white-space: nowrap; }

    /* Certificates earned */
    .co-cert-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 12px 14px; }
    .co-cert-card { background: #f9fafb; border-radius: 8px; padding: 12px 10px; text-align: center; }
    .co-cert-icon { width: 34px; height: 34px; background: #d1fae5; color: #16a34a; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; }
    .co-cert-name { font-size: 11px; font-weight: 700; line-height: 1.3; margin-bottom: 4px; }
    .co-cert-date { font-size: 9.5px; color: #9ca3af; }

    /* Leaderboard */
    .co-lb-list { padding: 4px 14px 12px; }
    .co-lb-row { display: flex; align-items: center; gap: 8px; padding: 7px 0; }
    .co-lb-row.user { background: #f0fdf4; border-radius: 7px; margin: 0 -8px; padding: 7px 8px; }
    .co-lb-rank { font-size: 12px; font-weight: 800; width: 16px; }
    .co-lb-avatar { width: 26px; height: 26px; border-radius: 50%; background: #dbeafe; color: #2563eb; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .co-lb-name { flex: 1; font-size: 11.5px; font-weight: 600; color: #374151; }
    .co-lb-xp { font-size: 11px; font-weight: 700; color: #111827; }

    /* Recommended */
    .co-rec-list { padding: 4px 14px 12px; }
    .co-rec-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f9fafb; }
    .co-rec-item:last-child { border-bottom: none; }
    .co-rec-thumb { width: 44px; height: 36px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .co-rec-title { font-size: 11.5px; font-weight: 700; line-height: 1.3; }
    .co-rec-meta { font-size: 10px; color: #6b7280; margin-top: 1px; }
    .co-rec-rating { font-size: 10.5px; font-weight: 700; color: #f59e0b; display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
  `;
  document.head.appendChild(style);
}

/* ── SVG icons (no emojis) ── */
const coIcons = {
  cap:        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5"/></svg>`,
  book:       `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`,
  checkCircleBlue: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>`,
  award:      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M9 13.5L7 22l5-3 5 3-2-8.5"/></svg>`,
  search:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  clock:      `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  bars:       `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="20" x2="6" y2="14"/><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/></svg>`,
  star:       `<svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  users:      `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
  checkCircle: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>`,
  playSmall:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  barsSmall:  `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" style="display:inline;vertical-align:-1px"><line x1="6" y1="20" x2="6" y2="14"/><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/></svg>`,
  checkSmall: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3" style="display:inline;vertical-align:-1px"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>`,
  trophy:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z"/><path d="M17 4h3a2 2 0 010 4h-3M7 4H4a2 2 0 000 4h3"/></svg>`,
};

/* ── Main view function ── */
function viewCoursesOverview(user) {
  injectCoursesOverviewStyles();

  return `
  <div class="co-scrollable">
    <div class="co-layout">

      <!-- Hero banner -->
      <div class="co-hero">
        <div class="co-hero-left">
          <div class="co-hero-title">Master Poultry Farming with<br>Farmsence Academy</div>
          <div class="co-hero-desc">Practical knowledge. Expert guidance. Better farming outcomes.</div>
          <button class="co-hero-btn">Explore Learning Paths <i class="fa-solid fa-arrow-right"></i></button>
        </div>
        <div class="co-hero-stats">
          ${coHeroStat(coIcons.cap, '#dbeafe', '42', 'Total Courses')}
          ${coHeroStat(coIcons.book, '#dbeafe', '8', 'Enrolled Courses')}
          ${coHeroStat(coIcons.checkCircleBlue, '#d1fae5', '3', 'Completed')}
          ${coHeroStat(coIcons.award, '#ffedd5', '2', 'Certificates Earned')}
        </div>
        <div class="co-hero-illustration">
          <svg width="140" height="110" viewBox="0 0 140 110" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="20" width="80" height="55" rx="4" fill="#1e3a8a"/>
            <rect x="26" y="26" width="68" height="38" rx="2" fill="#3b82f6"/>
            <circle cx="60" cy="45" r="10" fill="#fff" opacity=".9"/>
            <polygon points="57,40 57,50 65,45" fill="#1e3a8a"/>
            <rect x="40" y="75" width="40" height="6" rx="2" fill="#94a3b8"/>
            <rect x="95" y="50" width="14" height="20" fill="#16a34a"/>
            <rect x="95" y="35" width="14" height="20" fill="#22c55e"/>
            <circle cx="115" cy="30" r="9" fill="#fbbf24"/>
            <line x1="115" y1="14" x2="115" y2="20" stroke="#fbbf24" stroke-width="2"/>
            <line x1="124" y1="30" x2="130" y2="30" stroke="#fbbf24" stroke-width="2"/>
            <line x1="121" y1="22" x2="125" y2="18" stroke="#fbbf24" stroke-width="2"/>
          </svg>
        </div>
      </div>

      <!-- Search & categories -->
      <div class="co-search-row" style="grid-column:1/-1;">
        <div class="co-search-box">
          ${coIcons.search}
          <input type="text" placeholder="Search courses, topics or skills...">
        </div>
        <span class="co-cat-label">Categories:</span>
        <div class="co-chips">
          ${coCategoryChip('Poultry Basics', true)}
          ${coCategoryChip('Broiler Farming', false)}
          ${coCategoryChip('Layer Farming', false)}
          ${coCategoryChip('AI &amp; Technology', false)}
          ${coCategoryChip('Biosecurity', false)}
          ${coCategoryChip('Nutrition', false)}
          ${coCategoryChip('Farm Finance', false)}
          ${coCategoryChip('Business Management', false)}
          ${coCategoryChip('More <i class="fa-solid fa-chevron-down"></i>', false)}
        </div>
      </div>

      <!-- Left column main content -->
      <div>

        <!-- Featured Courses -->
        <div class="co-section-header">
          <span class="co-section-title">Featured Courses</span>
          <a href="#" class="co-section-link">View All Courses <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="co-courses-grid">
          ${coCourseCard('Bestseller', '#16a34a', 'linear-gradient(135deg,#92400e,#451a03)', 'Complete Broiler Farming Masterclass', 'End-to-end broiler production from chick to market with best practices.', '6h 30m', 'Beginner', '4.8', '1.2K', '12,450', 'Dr. Ramesh Verma', 'RV', 'Continue Learning', 'primary', 75)}
          ${coCourseCard('New', '#7c3aed', 'linear-gradient(135deg,#0c4a6e,#082f49)', 'AI in Poultry Farming', 'Leverage AI tools and insights to improve productivity and profitability.', '4h 15m', 'Intermediate', '4.7', '856', '8,932', 'Anjali Mehta', 'AM', 'Enroll Now', 'outline')}
          ${coCourseCard('Popular', '#ea580c', 'linear-gradient(135deg,#78350f,#451a03)', 'Feed Formulation Expert', 'Learn to formulate cost-effective and nutritious poultry feed.', '5h 20m', 'Intermediate', '4.7', '732', '6,215', 'Dr. S. Banerjee', 'SB', 'Enroll Now', 'outline')}
          ${coCourseCard('Certification', '#dc2626', 'linear-gradient(135deg,#1e293b,#0f172a)', 'Disease Prevention Certification', 'Comprehensive guide to prevent and control common poultry diseases.', '5h 45m', 'Beginner', '4.9', '1.1K', '9,876', 'Dr. Meera Nair', 'MN', 'Enroll Now', 'outline-cert')}
        </div>

        <!-- Learning Path -->
        <div class="co-section-header">
          <span class="co-section-title">Learning Path</span>
        </div>
        <div class="co-path-row">
          ${coPathStep('01', 'Beginner', 'Build strong foundations in poultry farming basics.', '12 Courses')}
          <span class="co-path-arrow">--&gt;</span>
          ${coPathStep('02', 'Intermediate', 'Advance your skills with practical knowledge.', '18 Courses')}
          <span class="co-path-arrow">--&gt;</span>
          ${coPathStep('03', 'Advanced', 'Master operations and optimize profitability.', '12 Courses')}
          <div class="co-path-trophy">
            <div class="co-path-trophy-icon">${coIcons.trophy}</div>
            <div class="co-path-trophy-title">Become an Expert Farmer</div>
            <div class="co-path-trophy-desc">Complete all levels to earn your expert certificate.</div>
          </div>
        </div>

        <!-- My Enrolled Courses -->
        <div class="co-section-header">
          <span class="co-section-title">My Enrolled Courses</span>
        </div>
        <div class="co-enr-card">
          <table class="co-enr-table">
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Progress</th>
                <th>Completion</th>
                <th>Quizzes</th>
                <th>Assignments</th>
                <th>Certificate</th>
                <th>Last Accessed</th>
              </tr>
            </thead>
            <tbody>
              ${coEnrolledRow('linear-gradient(135deg,#166534,#14532d)', 'Biosecurity Best Practices', 'Beginner', '3h 20m', 68, 68, '4 / 12', '2 / 5', 'Issued', '20 May 2024', 'Continue')}
              ${coEnrolledRow('linear-gradient(135deg,#92400e,#78350f)', 'Brooding Management Fundamentals', 'Beginner', '2h 45m', 40, 40, '6 / 10', '1 / 4', '—', '18 May 2024', 'Continue')}
              ${coEnrolledRow('linear-gradient(135deg,#1e3a8a,#1e293b)', 'Nutrition &amp; Feeding Essentials', 'Intermediate', '4h 10m', 80, 80, '6 / 12', '3 / 5', '—', '15 May 2024', 'Continue')}
              ${coEnrolledRow('linear-gradient(135deg,#7c2d12,#451a03)', 'Financial Management for Farms', 'Intermediate', '3h 30m', 25, 25, '0 / 10', '0 / 3', '—', '10 May 2024', 'Resume')}
              ${coEnrolledRow('linear-gradient(135deg,#166534,#0f172a)', 'Record Keeping &amp; Documentation', 'Beginner', '2h 15m', 100, 100, '10 / 10', '3 / 3', 'Issued', '05 May 2024', 'Review')}
            </tbody>
          </table>
          <div class="co-enr-footer">
            <span>Showing 1 to 5 of 8 enrolled courses</span>
            <a href="#">View All Enrolled Courses <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </div>

      </div>

      <!-- Right Rail -->
      <div class="co-right-rail">

        <!-- Continue Learning -->
        <div class="co-card">
          <div class="co-card-header">
            <span class="co-card-title">Continue Learning</span>
            <a href="#" class="co-card-link">View All <i class="fa-solid fa-arrow-right"></i></a>
          </div>
          <div class="co-cl-body">
            <div class="co-cl-thumb">${coIcons.playSmall}</div>
            <div style="flex:1;min-width:0;">
              <div class="co-cl-title">Water Quality Management</div>
              <div class="co-cl-pct">60% Completed</div>
              <div class="co-cl-track"><div class="co-cl-fill" style="width:60%"></div></div>
              <div class="co-cl-foot">
                <span class="co-cl-time">${coIcons.clock} 2h 30m left</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming Live Classes -->
        <div class="co-card">
          <div class="co-card-header">
            <span class="co-card-title">Upcoming Live Classes</span>
            <a href="#" class="co-card-link">View All <i class="fa-solid fa-arrow-right"></i></a>
          </div>
          <div class="co-class-list">
            <div class="co-class-row">
              <div class="co-class-date"><div class="co-class-day">23</div><div class="co-class-month">May</div></div>
              <div class="co-class-info">
                <div class="co-class-title">Managing Heat Stress in Poultry</div>
                <div class="co-class-meta">Dr. Meera Nair &nbsp;•&nbsp; 04:00 PM IST</div>
              </div>
            </div>
            <div class="co-class-row">
              <div class="co-class-date"><div class="co-class-day">27</div><div class="co-class-month">May</div></div>
              <div class="co-class-info">
                <div class="co-class-title">Vaccine Handling &amp; Storage</div>
                <div class="co-class-meta">Dr. Ramesh Verma &nbsp;•&nbsp; 11:00 AM IST</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Certificates Earned -->
        <div class="co-card">
          <div class="co-card-header">
            <span class="co-card-title">Certificates Earned</span>
            <a href="#" class="co-card-link">View All <i class="fa-solid fa-arrow-right"></i></a>
          </div>
          <div class="co-cert-grid">
            <div class="co-cert-card">
              <div class="co-cert-icon">${coIcons.award}</div>
              <div class="co-cert-name">Biosecurity Best Practices</div>
              <div class="co-cert-date">Earned on 18 May 2024</div>
            </div>
            <div class="co-cert-card">
              <div class="co-cert-icon">${coIcons.award}</div>
              <div class="co-cert-name">Record Keeping &amp; Documentation</div>
              <div class="co-cert-date">Earned on 05 May 2024</div>
            </div>
          </div>
        </div>

        <!-- Leaderboard -->
        <div class="co-card">
          <div class="co-card-header">
            <span class="co-card-title">Leaderboard</span>
            <select style="border:1px solid #e5e7eb;border-radius:6px;padding:3px 8px;font-size:11px;background:#fff;">
              <option>This Month</option>
            </select>
          </div>
          <div class="co-lb-list">
            ${coLeaderboardRow(1, 'Rohit Kumar', '1,250', false)}
            ${coLeaderboardRow(2, 'Anjali Mehta', '980', false)}
            ${coLeaderboardRow(3, 'Suresh Patel', '870', false)}
            ${coLeaderboardRow(4, 'John Doe (You)', '760', true)}
            ${coLeaderboardRow(5, 'Priya Singh', '650', false)}
          </div>
        </div>

        <!-- Recommended for You -->
        <div class="co-card">
          <div class="co-card-header">
            <span class="co-card-title">Recommended for You</span>
            <a href="#" class="co-card-link">View All <i class="fa-solid fa-arrow-right"></i></a>
          </div>
          <div class="co-rec-list">
            ${coRecommendedItem('linear-gradient(135deg,#365314,#1a2e05)', 'Litter Management Guide', 'Beginner', '2h 40m', '4.6')}
            ${coRecommendedItem('linear-gradient(135deg,#78350f,#451a03)', 'Layer Production Essentials', 'Intermediate', '5h 15m', '4.7')}
            ${coRecommendedItem('linear-gradient(135deg,#1e3a8a,#1e293b)', 'Poultry Farm Business Plan', 'Intermediate', '3h 10m', '4.5')}
          </div>
        </div>

      </div>

    </div>
  </div>`;
}
