/* views/CostIntelligence.js */

window.metaCostIntelligence = {
  title: 'Cost Intelligence™',
  subtitle: 'Real-time Cost, Profit & Break-even Calculator'
};

/* ── Helper functions ── */

function ciTopStat(iconSvg, iconBg, label, value, sub) {
  return `
    <div class="ci-top-stat">
      <div class="ci-top-icon" style="background:${iconBg}">${iconSvg}</div>
      <div class="ci-top-body">
        <div class="ci-top-label">${label}</div>
        <div class="ci-top-value">${value}</div>
        ${sub ? `<div class="ci-top-sub">${sub}</div>` : ''}
      </div>
    </div>`;
}

function ciBreakdownRow(color, label, value, pct) {
  return `
    <div class="ci-bd-row">
      <span class="ci-bd-dot" style="background:${color}"></span>
      <span class="ci-bd-label">${label}</span>
      <span class="ci-bd-value">${value}</span>
      <span class="ci-bd-pct">${pct}</span>
    </div>`;
}

function ciExpenseRow(iconSvg, iconBg, label, value) {
  return `
    <div class="ci-exp-row">
      <span class="ci-exp-icon" style="background:${iconBg}">${iconSvg}</span>
      <span class="ci-exp-label">${label}</span>
      <span class="ci-exp-value">${value}</span>
    </div>`;
}

function ciLbvRow(iconSvg, label, value, highlight, danger) {
  const cls = highlight ? 'ci-lbv-row highlight' : danger ? 'ci-lbv-row danger' : 'ci-lbv-row';
  return `
    <div class="${cls}">
      <span class="ci-lbv-label">${iconSvg ? `<span class="ci-lbv-icon">${iconSvg}</span>` : ''}${label}</span>
      <span class="ci-lbv-value">${value}</span>
    </div>`;
}

function ciBreakEvenRow(iconSvg, label, value, negative) {
  return `
    <div class="ci-be-row">
      <span class="ci-be-label"><span class="ci-be-icon">${iconSvg}</span>${label}</span>
      <span class="ci-be-value${negative ? ' negative' : ''}">${value}</span>
    </div>`;
}

function ciInsightCard(iconSvg, iconBg, title, desc) {
  return `
    <div class="ci-insight-card">
      <div class="ci-insight-icon" style="background:${iconBg}">${iconSvg}</div>
      <div class="ci-insight-body">
        <div class="ci-insight-title">${title}</div>
        <div class="ci-insight-desc">${desc}</div>
      </div>
    </div>`;
}

function ciCompLegendRow(color, label, pct) {
  return `
    <div class="ci-comp-row">
      <span class="ci-comp-dot" style="background:${color}"></span>
      <span class="ci-comp-label">${label}</span>
      <span class="ci-comp-pct">${pct}</span>
    </div>`;
}

/* ── CSS injected once ── */
function injectCostIntelligenceStyles() {
  if (document.getElementById('ci-styles')) return;
  const style = document.createElement('style');
  style.id = 'ci-styles';
  style.textContent = `
    .ci-scrollable { padding: 16px 20px; background: #f5f6fa; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #1a1a2e; }

    /* ── Top stat strip ── */
    .ci-top-strip { display: grid; grid-template-columns: repeat(6, 1fr) 1.1fr; gap: 10px; margin-bottom: 14px; }
    .ci-top-stat { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; padding: 10px 12px; display: flex; align-items: center; gap: 9px; }
    .ci-top-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ci-top-label { font-size: 10px; color: #6b7280; }
    .ci-top-value { font-size: 15px; font-weight: 800; line-height: 1.2; }
    .ci-top-sub { font-size: 9px; color: #9ca3af; }

    /* ── Generic card ── */
    .ci-card { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; overflow: hidden; }
    .ci-card-header { padding: 13px 16px 10px; border-bottom: 1px solid #f3f4f6; }
    .ci-card-title { font-size: 12px; font-weight: 800; letter-spacing: .3px; text-transform: uppercase; color: #111827; }
    .ci-card-title span { font-size: 10px; font-weight: 500; text-transform: none; color: #9ca3af; }

    /* ── Three column main grid ── */
    .ci-main-grid { display: grid; grid-template-columns: 1fr 1fr 0.85fr; gap: 14px; margin-bottom: 14px; }

    /* Live Cost Breakdown */
    .ci-donut-wrap { display: flex; align-items: center; gap: 16px; padding: 16px; }
    .ci-donut { position: relative; width: 130px; height: 130px; flex-shrink: 0; }
    .ci-donut svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .ci-donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .ci-donut-label { font-size: 10px; color: #6b7280; }
    .ci-donut-value { font-size: 16px; font-weight: 800; margin: 2px 0; }
    .ci-donut-pct { font-size: 10px; color: #9ca3af; }
    .ci-bd-list { flex: 1; display: flex; flex-direction: column; gap: 7px; }
    .ci-bd-row { display: flex; align-items: center; gap: 6px; font-size: 11px; }
    .ci-bd-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .ci-bd-label { flex: 1; color: #374151; font-weight: 600; }
    .ci-bd-value { font-weight: 700; color: #111827; margin-right: 6px; }
    .ci-bd-pct { color: #9ca3af; font-size: 10px; min-width: 36px; text-align: right; }
    .ci-summary-box { background: #f0fdf4; border-radius: 8px; margin: 0 16px 16px; padding: 12px 14px; display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 8px; }
    .ci-summary-label { font-size: 10px; color: #6b7280; margin-bottom: 3px; }
    .ci-summary-value { font-size: 16px; font-weight: 800; color: #16a34a; }
    .ci-summary-value.small { font-size: 14px; }

    /* Cost Growth Timeline */
    .ci-timeline-body { padding: 14px 16px; }
    .ci-timeline-note { background: #f0fdf4; border-radius: 8px; padding: 10px 12px; font-size: 11px; color: #166534; line-height: 1.4; margin-top: 10px; }

    /* Today's Expenses */
    .ci-exp-list { padding: 6px 16px; display: flex; flex-direction: column; }
    .ci-exp-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f9fafb; }
    .ci-exp-row:last-child { border-bottom: none; }
    .ci-exp-icon { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ci-exp-label { flex: 1; font-size: 11.5px; color: #374151; }
    .ci-exp-value { font-size: 12px; font-weight: 700; }
    .ci-exp-total-box { background: #f0fdf4; border-radius: 8px; margin: 8px 16px 16px; padding: 12px 14px; text-align: center; }
    .ci-exp-total-label { font-size: 10px; color: #6b7280; letter-spacing: .3px; text-transform: uppercase; font-weight: 700; }
    .ci-exp-total-value { font-size: 19px; font-weight: 800; color: #16a34a; margin-top: 3px; }

    /* ── Right rail: Live Bird Value ── */
    .ci-right-rail { display: flex; flex-direction: column; gap: 14px; }
    .ci-lbv-header { display: flex; align-items: center; gap: 8px; padding: 14px 16px 10px; }
    .ci-lbv-icon-wrap { width: 32px; height: 32px; background: #d1fae5; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .ci-lbv-title { font-size: 12px; font-weight: 800; letter-spacing: .3px; }
    .ci-lbv-rows { padding: 0 16px 8px; }
    .ci-lbv-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; font-size: 11.5px; border-bottom: 1px solid #f9fafb; }
    .ci-lbv-row .ci-lbv-icon { display: inline-flex; margin-right: 6px; vertical-align: middle; color: #9ca3af; }
    .ci-lbv-label { color: #6b7280; display: flex; align-items: center; }
    .ci-lbv-value { font-weight: 700; color: #111827; }
    .ci-lbv-row.highlight { background: #f0fdf4; border-radius: 8px; padding: 10px 10px; margin: 4px 0; border-bottom: none; }
    .ci-lbv-row.highlight .ci-lbv-label { color: #166534; font-weight: 700; }
    .ci-lbv-row.highlight .ci-lbv-value { color: #16a34a; font-size: 14px; }
    .ci-lbv-row.danger { background: #fef2f2; border-radius: 8px; padding: 10px 10px; margin: 4px 0 16px; border-bottom: none; }
    .ci-lbv-row.danger .ci-lbv-label { color: #991b1b; font-weight: 700; }
    .ci-lbv-row.danger .ci-lbv-value { color: #dc2626; font-size: 14px; }

    /* ── AI Cost Prediction row ── */
    .ci-pred-grid { display: grid; grid-template-columns: 1.1fr 1fr 1fr 1fr 0.8fr; gap: 12px; margin-bottom: 14px; }
    .ci-pred-intro { background: #fff; border: 1px solid #e8eaf0; border-radius: 10px; padding: 16px; display: flex; gap: 12px; align-items: flex-start; }
    .ci-pred-bot { width: 36px; height: 36px; background: #f0fdf4; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ci-pred-intro-title { font-size: 13px; font-weight: 800; margin-bottom: 3px; }
    .ci-pred-intro-desc { font-size: 11px; color: #6b7280; line-height: 1.4; }
    .ci-pred-stat { background: #fff; border: 1px solid #e8eaf0; border-radius: 10px; padding: 16px; display: flex; flex-direction: column; justify-content: center; }
    .ci-pred-stat-label { font-size: 10.5px; color: #6b7280; line-height: 1.4; margin-bottom: 6px; }
    .ci-pred-stat-value { font-size: 20px; font-weight: 800; }
    .ci-pred-confidence { background: #fff; border: 1px solid #e8eaf0; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; }
    .ci-pred-conf-label { font-size: 10px; color: #6b7280; text-align: center; }
    .ci-conf-ring { position: relative; width: 70px; height: 70px; }
    .ci-conf-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .ci-conf-ring-val { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800; color: #16a34a; }

    /* ── Bottom grid: Composition over time | Composition today | Break-even + Insights ── */
    .ci-bottom-grid { display: grid; grid-template-columns: 1.3fr 1fr 0.85fr; gap: 14px; }

    /* Cost composition over time (stacked area) */
    .ci-area-body { padding: 12px 16px 16px; }
    .ci-area-legend { display: flex; gap: 14px; margin-bottom: 10px; flex-wrap: wrap; }
    .ci-area-legend-item { display: flex; align-items: center; gap: 5px; font-size: 10.5px; color: #6b7280; }
    .ci-area-legend-dot { width: 8px; height: 8px; border-radius: 50%; }

    /* Cost composition today donut */
    .ci-comp-body { padding: 14px 16px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
    .ci-comp-donut { position: relative; width: 130px; height: 130px; }
    .ci-comp-donut svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .ci-comp-donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .ci-comp-list { width: 100%; display: flex; flex-direction: column; gap: 6px; }
    .ci-comp-row { display: flex; align-items: center; gap: 7px; font-size: 11px; }
    .ci-comp-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .ci-comp-label { flex: 1; color: #374151; }
    .ci-comp-pct { font-weight: 700; color: #111827; }

    /* Break-even status */
    .ci-be-body { padding: 6px 16px 14px; }
    .ci-be-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; font-size: 11.5px; border-bottom: 1px solid #f9fafb; }
    .ci-be-icon { display: inline-flex; margin-right: 6px; vertical-align: middle; color: #9ca3af; }
    .ci-be-label { color: #6b7280; display: flex; align-items: center; }
    .ci-be-value { font-weight: 700; color: #111827; }
    .ci-be-value.negative { color: #16a34a; }
    .ci-status-box { display: flex; align-items: center; justify-content: space-between; background: #f0fdf4; border-radius: 8px; padding: 10px 12px; margin-top: 6px; }
    .ci-status-label { font-size: 11px; color: #166534; font-weight: 700; }
    .ci-status-badge { display: flex; align-items: center; gap: 5px; background: #16a34a; color: #fff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 5px; }

    /* Cost saving insights */
    .ci-insight-list { padding: 6px 16px 12px; display: flex; flex-direction: column; gap: 10px; }
    .ci-insight-card { display: flex; gap: 10px; align-items: flex-start; }
    .ci-insight-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ci-insight-title { font-size: 11.5px; font-weight: 700; color: #111827; margin-bottom: 2px; }
    .ci-insight-desc { font-size: 10.5px; color: #6b7280; line-height: 1.4; }
    .ci-insight-footer { padding: 4px 16px 14px; }
    .ci-insight-view-all { font-size: 11px; color: #16a34a; font-weight: 700; text-decoration: none; }
  `;
  document.head.appendChild(style);
}

/* ── SVG icons ── */
const ciIcons = {
  bird:       `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M16 7h.01M3 11l18-5-3 8 3 8-18-5 5-3-5-3z"/></svg>`,
  calendar:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  scale:      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2"><path d="M12 3v18M5 7l7-4 7 4M5 7c0 4 3 4 3 4s3 0 3-4M19 7c0 4-3 4-3 4s-3 0-3-4M5 21h14"/></svg>`,
  feed:       `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2"><path d="M3 3l18 6-18 6V3zM3 15l18 6"/></svg>`,
  heart:      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
  wallet:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 000 4h4v-4z"/></svg>`,
  clock:      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  scaleSmall: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2"><path d="M12 3v18M5 7l7-4 7 4M5 7c0 4 3 4 3 4s3 0 3-4M19 7c0 4-3 4-3 4s-3 0-3-4M5 21h14"/></svg>`,
  trendUp:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  bot:        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>`,
  weight:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>`,
  market:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  price:      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 4M12 17h.01"/></svg>`,
  market2:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 14l3-3 3 3 4-5"/></svg>`,
  margin:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19V5"/></svg>`,
  check:      `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`,
  feedSaving: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M3 3l18 6-18 6V3zM3 15l18 6"/></svg>`,
  labourSaving: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 014-4h6a4 4 0 014 4v2"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
  swap:       `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>`,
};

/* ── Main view function ── */
function viewCostIntelligence(user) {
  injectCostIntelligenceStyles();

  return `
  <div class="ci-scrollable">

    <!-- Top Stat Strip -->
    <div class="ci-top-strip">
      ${ciTopStat(ciIcons.bird, '#d1fae5', 'Live Birds', '14,850', null)}
      ${ciTopStat(ciIcons.calendar, '#ede9fe', 'Age', 'Day 7', 'Since Placement')}
      ${ciTopStat(ciIcons.scale, '#cffafe', 'Avg. Weight', '180 g', null)}
      ${ciTopStat(ciIcons.feed, '#ffedd5', 'Feed Consumed', '4,260 kg', 'Total Till Date')}
      ${ciTopStat(ciIcons.heart, '#fee2e2', 'Mortality', '75', '0.50%')}
      ${ciTopStat(ciIcons.wallet, '#d1fae5', 'Total Cost (Till Date)', '₹ 2,84,500', null)}
      <div class="ci-top-stat">
        <div class="ci-top-icon" style="background:#f0fdf4">${ciIcons.clock}</div>
        <div class="ci-top-body">
          <div class="ci-top-label">Cost per Bird</div>
          <div class="ci-top-value">₹ 19.16</div>
        </div>
      </div>
      <div class="ci-top-stat">
        <div class="ci-top-icon" style="background:#cffafe">${ciIcons.scaleSmall}</div>
        <div class="ci-top-body">
          <div class="ci-top-label">Cost per Kg</div>
          <div class="ci-top-value">₹ 106.44</div>
        </div>
      </div>
    </div>

    <!-- Main 3-col grid -->
    <div class="ci-main-grid">

      <!-- Live Cost Breakdown -->
      <div class="ci-card">
        <div class="ci-card-header"><span class="ci-card-title">Live Cost Breakdown <span>(Till Date)</span></span></div>
        <div class="ci-donut-wrap">
          <div class="ci-donut">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="48" fill="none" stroke="#e8eaf0" stroke-width="18"/>
              <circle cx="60" cy="60" r="48" fill="none" stroke="#16a34a" stroke-width="18" stroke-dasharray="${2*Math.PI*48*0.5696} ${2*Math.PI*48*0.4304}" stroke-dashoffset="0"/>
              <circle cx="60" cy="60" r="48" fill="none" stroke="#a78bfa" stroke-width="18" stroke-dasharray="${2*Math.PI*48*0.2110} ${2*Math.PI*48*0.7890}" stroke-dashoffset="${-2*Math.PI*48*0.5696}"/>
              <circle cx="60" cy="60" r="48" fill="none" stroke="#f59e0b" stroke-width="18" stroke-dasharray="${2*Math.PI*48*0.0654} ${2*Math.PI*48*0.9346}" stroke-dashoffset="${-2*Math.PI*48*0.7806}"/>
              <circle cx="60" cy="60" r="48" fill="none" stroke="#6366f1" stroke-width="18" stroke-dasharray="${2*Math.PI*48*0.0791} ${2*Math.PI*48*0.9209}" stroke-dashoffset="${-2*Math.PI*48*0.8460}"/>
              <circle cx="60" cy="60" r="48" fill="none" stroke="#ec4899" stroke-width="18" stroke-dasharray="${2*Math.PI*48*0.0207} ${2*Math.PI*48*0.9793}" stroke-dashoffset="${-2*Math.PI*48*0.9251}"/>
              <circle cx="60" cy="60" r="48" fill="none" stroke="#f97316" stroke-width="18" stroke-dasharray="${2*Math.PI*48*0.0130} ${2*Math.PI*48*0.9870}" stroke-dashoffset="${-2*Math.PI*48*0.9458}"/>
            </svg>
            <div class="ci-donut-center">
              <div class="ci-donut-label">Total Cost</div>
              <div class="ci-donut-value">₹2,84,500</div>
              <div class="ci-donut-pct">100%</div>
            </div>
          </div>
          <div class="ci-bd-list">
            ${ciBreakdownRow('#16a34a', 'Feed Cost', '₹ 1,62,000', '56.96%')}
            ${ciBreakdownRow('#6366f1', 'Medicine Cost', '₹ 22,500', '7.91%')}
            ${ciBreakdownRow('#a78bfa', 'Labour Cost', '₹ 60,000', '21.10%')}
            ${ciBreakdownRow('#06b6d4', 'Electricity Cost', '₹ 11,800', '4.15%')}
            ${ciBreakdownRow('#f59e0b', 'Heating Cost', '₹ 18,600', '6.54%')}
            ${ciBreakdownRow('#ec4899', 'Litter Cost', '₹ 5,900', '2.07%')}
            ${ciBreakdownRow('#f97316', 'Miscellaneous', '₹ 3,700', '1.30%')}
          </div>
        </div>
        <div class="ci-summary-box">
          <div>
            <div class="ci-summary-label">Current Livestock Cost (Till Date)</div>
            <div class="ci-summary-value">₹ 2,84,500</div>
          </div>
          <div>
            <div class="ci-summary-label">Cost per Bird</div>
            <div class="ci-summary-value small">₹ 19.16</div>
          </div>
          <div>
            <div class="ci-summary-label">Cost per Kg</div>
            <div class="ci-summary-value small">₹ 106.44</div>
          </div>
        </div>
      </div>

      <!-- Cost Growth Timeline -->
      <div class="ci-card">
        <div class="ci-card-header"><span class="ci-card-title">Cost Growth Timeline <span>(Cost per Bird)</span></span></div>
        <div class="ci-timeline-body">
          <svg viewBox="0 0 320 200" style="width:100%;height:200px;">
            <line x1="20" y1="10" x2="300" y2="10" stroke="#f3f4f6" stroke-width="1"/>
            <line x1="20" y1="46" x2="300" y2="46" stroke="#f3f4f6" stroke-width="1"/>
            <line x1="20" y1="82" x2="300" y2="82" stroke="#f3f4f6" stroke-width="1"/>
            <line x1="20" y1="118" x2="300" y2="118" stroke="#f3f4f6" stroke-width="1"/>
            <line x1="20" y1="154" x2="300" y2="154" stroke="#f3f4f6" stroke-width="1"/>
            <line x1="20" y1="178" x2="300" y2="178" stroke="#f3f4f6" stroke-width="1"/>
            <text x="0" y="13" font-size="8" fill="#9ca3af">₹25</text>
            <text x="0" y="49" font-size="8" fill="#9ca3af">₹20</text>
            <text x="0" y="85" font-size="8" fill="#9ca3af">₹15</text>
            <text x="0" y="121" font-size="8" fill="#9ca3af">₹10</text>
            <text x="0" y="157" font-size="8" fill="#9ca3af">₹5</text>
            <text x="3" y="181" font-size="8" fill="#9ca3af">₹0</text>
            <polyline points="30,170 70,148 110,126 150,103 190,80 230,57 270,30"
              fill="none" stroke="#16a34a" stroke-width="2"/>
            <polygon points="30,170 70,148 110,126 150,103 190,80 230,57 270,30 270,178 30,178" fill="#16a34a" opacity="0.08"/>
            <circle cx="30" cy="170" r="3.5" fill="#16a34a"/>
            <circle cx="70" cy="148" r="3.5" fill="#16a34a"/>
            <circle cx="110" cy="126" r="3.5" fill="#16a34a"/>
            <circle cx="150" cy="103" r="3.5" fill="#16a34a"/>
            <circle cx="190" cy="80" r="3.5" fill="#16a34a"/>
            <circle cx="230" cy="57" r="3.5" fill="#16a34a"/>
            <circle cx="270" cy="30" r="4.5" fill="#16a34a"/>
            <text x="20" y="163" font-size="9" fill="#374151" font-weight="600">₹3.20</text>
            <text x="60" y="141" font-size="9" fill="#374151" font-weight="600">₹5.40</text>
            <text x="100" y="119" font-size="9" fill="#374151" font-weight="600">₹7.95</text>
            <text x="138" y="96" font-size="9" fill="#374151" font-weight="600">₹10.82</text>
            <text x="178" y="73" font-size="9" fill="#374151" font-weight="600">₹13.45</text>
            <text x="215" y="50" font-size="9" fill="#374151" font-weight="600">₹16.12</text>
            <rect x="244" y="12" width="50" height="18" rx="4" fill="#16a34a"/>
            <text x="269" y="25" font-size="10" fill="#fff" font-weight="700" text-anchor="middle">₹ 19.16</text>
            <text x="30" y="195" font-size="8" fill="#9ca3af">Day 1</text>
            <text x="65" y="195" font-size="8" fill="#9ca3af">Day 2</text>
            <text x="103" y="195" font-size="8" fill="#9ca3af">Day 3</text>
            <text x="141" y="195" font-size="8" fill="#9ca3af">Day 4</text>
            <text x="179" y="195" font-size="8" fill="#9ca3af">Day 5</text>
            <text x="217" y="195" font-size="8" fill="#9ca3af">Day 6</text>
            <text x="255" y="195" font-size="8" fill="#9ca3af">Day 7</text>
            <text x="25" y="205" font-size="7" fill="#c0c5d0">13 May</text>
            <text x="60" y="205" font-size="7" fill="#c0c5d0">14 May</text>
            <text x="98" y="205" font-size="7" fill="#c0c5d0">15 May</text>
            <text x="136" y="205" font-size="7" fill="#c0c5d0">16 May</text>
            <text x="174" y="205" font-size="7" fill="#c0c5d0">17 May</text>
            <text x="212" y="205" font-size="7" fill="#c0c5d0">18 May</text>
            <text x="250" y="205" font-size="7" fill="#c0c5d0">19 May</text>
          </svg>
          <div class="ci-timeline-note">Cost per bird increases daily as birds consume feed and other resources. Cost per kg will reduce as birds gain weight.</div>
        </div>
      </div>

      <!-- Today's Expenses -->
      <div class="ci-card">
        <div class="ci-card-header"><span class="ci-card-title">Today's Expenses <span>(19 May 2024)</span></span></div>
        <div class="ci-exp-list">
          ${ciExpenseRow(ciIcons.feed, '#dbeafe', 'Feed Purchased', '₹ 42,500')}
          ${ciExpenseRow('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><path d="M3 3l18 6-18 6V3zM3 15l18 6"/></svg>', '#ede9fe', 'Feed Consumed', '₹ 23,400')}
          ${ciExpenseRow('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 014-4h6a4 4 0 014 4v2"/></svg>', '#d1fae5', 'Labour', '₹ 9,500')}
          ${ciExpenseRow('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.29 1.51 4.04 3 5.5l7 7z"/></svg>', '#ffedd5', 'Medicine', '₹ 3,200')}
          ${ciExpenseRow('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>', '#fee2e2', 'Other Expenses', '₹ 1,100')}
        </div>
        <div class="ci-exp-total-box">
          <div class="ci-exp-total-label">Today's Cost Added</div>
          <div class="ci-exp-total-value">₹ 37,200</div>
        </div>
      </div>

    </div>

    <!-- AI Cost Prediction row -->
    <div class="ci-pred-grid">
      <div class="ci-pred-intro">
        <div class="ci-pred-bot">${ciIcons.bot}</div>
        <div>
          <div class="ci-pred-intro-title">AI Cost Prediction</div>
          <div class="ci-pred-intro-desc">If expenses continue at current rate</div>
        </div>
      </div>
      <div class="ci-pred-stat">
        <div class="ci-pred-stat-label">Expected Cost on Day 35 (Per Bird)</div>
        <div class="ci-pred-stat-value">₹ 176.40</div>
      </div>
      <div class="ci-pred-stat">
        <div class="ci-pred-stat-label">Expected Cost per Kg (on Day 35)</div>
        <div class="ci-pred-stat-value">₹ 73.20</div>
      </div>
      <div class="ci-pred-stat">
        <div class="ci-pred-stat-label">Expected Total Production Cost (At Day 35)</div>
        <div class="ci-pred-stat-value">₹ 26.18 Lakh</div>
      </div>
      <div class="ci-pred-confidence">
        <div class="ci-pred-conf-label">Prediction Confidence</div>
        <div class="ci-conf-ring">
          <svg viewBox="0 0 70 70">
            <circle cx="35" cy="35" r="28" fill="none" stroke="#e8eaf0" stroke-width="7"/>
            <circle cx="35" cy="35" r="28" fill="none" stroke="#16a34a" stroke-width="7" stroke-dasharray="${2*Math.PI*28*0.96} ${2*Math.PI*28*0.04}" stroke-linecap="round"/>
          </svg>
          <div class="ci-conf-ring-val">96%</div>
        </div>
      </div>
    </div>

    <!-- Bottom grid: Composition Over Time | Composition Today | Break-even + Insights -->
    <div class="ci-bottom-grid">

      <!-- Cost Composition Over Time -->
      <div class="ci-card">
        <div class="ci-card-header"><span class="ci-card-title">Cost Composition Over Time <span>(%)</span></span></div>
        <div class="ci-area-body">
          <div class="ci-area-legend">
            <span class="ci-area-legend-item"><span class="ci-area-legend-dot" style="background:#16a34a"></span>Feed</span>
            <span class="ci-area-legend-item"><span class="ci-area-legend-dot" style="background:#a78bfa"></span>Labour</span>
            <span class="ci-area-legend-item"><span class="ci-area-legend-dot" style="background:#f97316"></span>Medicine</span>
            <span class="ci-area-legend-item"><span class="ci-area-legend-dot" style="background:#9ca3af"></span>Electricity</span>
            <span class="ci-area-legend-item"><span class="ci-area-legend-dot" style="background:#fbbf24"></span>Others</span>
          </div>
          <svg viewBox="0 0 460 200" style="width:100%;height:200px;">
            <line x1="34" y1="10" x2="460" y2="10" stroke="#f3f4f6" stroke-width="1"/>
            <line x1="34" y1="55" x2="460" y2="55" stroke="#f3f4f6" stroke-width="1"/>
            <line x1="34" y1="100" x2="460" y2="100" stroke="#f3f4f6" stroke-width="1"/>
            <line x1="34" y1="145" x2="460" y2="145" stroke="#f3f4f6" stroke-width="1"/>
            <line x1="34" y1="190" x2="460" y2="190" stroke="#f3f4f6" stroke-width="1"/>
            <text x="0" y="13" font-size="8" fill="#9ca3af">100%</text>
            <text x="6" y="58" font-size="8" fill="#9ca3af">75%</text>
            <text x="6" y="103" font-size="8" fill="#9ca3af">50%</text>
            <text x="6" y="148" font-size="8" fill="#9ca3af">25%</text>
            <text x="10" y="193" font-size="8" fill="#9ca3af">0%</text>

            <!-- stacked area bands (approx) -->
            <polygon points="40,190 460,190 460,40 40,40" fill="#16a34a" opacity=".75"/>
            <polygon points="40,40 460,40 460,28 40,32" fill="#a78bfa" opacity=".75"/>
            <polygon points="40,32 460,28 460,20 40,24" fill="#f97316" opacity=".75"/>
            <polygon points="40,24 460,20 460,14 40,18" fill="#9ca3af" opacity=".75"/>
            <polygon points="40,18 460,14 460,10 40,10" fill="#fbbf24" opacity=".75"/>

            <text x="40" y="206" font-size="8" fill="#9ca3af">Day 1</text>
            <text x="105" y="206" font-size="8" fill="#9ca3af">Day 2</text>
            <text x="170" y="206" font-size="8" fill="#9ca3af">Day 3</text>
            <text x="235" y="206" font-size="8" fill="#9ca3af">Day 4</text>
            <text x="300" y="206" font-size="8" fill="#9ca3af">Day 5</text>
            <text x="365" y="206" font-size="8" fill="#9ca3af">Day 6</text>
            <text x="430" y="206" font-size="8" fill="#9ca3af">Day 7</text>
            <text x="32" y="216" font-size="7" fill="#c0c5d0">13 May</text>
            <text x="98" y="216" font-size="7" fill="#c0c5d0">14 May</text>
            <text x="163" y="216" font-size="7" fill="#c0c5d0">15 May</text>
            <text x="228" y="216" font-size="7" fill="#c0c5d0">16 May</text>
            <text x="293" y="216" font-size="7" fill="#c0c5d0">17 May</text>
            <text x="358" y="216" font-size="7" fill="#c0c5d0">18 May</text>
            <text x="423" y="216" font-size="7" fill="#c0c5d0">19 May</text>
          </svg>
        </div>
      </div>

      <!-- Cost Composition Today -->
      <div class="ci-card">
        <div class="ci-card-header"><span class="ci-card-title">Cost Composition <span>(Today)</span></span></div>
        <div class="ci-comp-body">
          <div class="ci-comp-donut">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="48" fill="none" stroke="#e8eaf0" stroke-width="18"/>
              <circle cx="60" cy="60" r="48" fill="none" stroke="#16a34a" stroke-width="18" stroke-dasharray="${2*Math.PI*48*0.5696} ${2*Math.PI*48*0.4304}"/>
              <circle cx="60" cy="60" r="48" fill="none" stroke="#3b82f6" stroke-width="18" stroke-dasharray="${2*Math.PI*48*0.2110} ${2*Math.PI*48*0.7890}" stroke-dashoffset="${-2*Math.PI*48*0.5696}"/>
              <circle cx="60" cy="60" r="48" fill="none" stroke="#f97316" stroke-width="18" stroke-dasharray="${2*Math.PI*48*0.0791} ${2*Math.PI*48*0.9209}" stroke-dashoffset="${-2*Math.PI*48*0.7806}"/>
              <circle cx="60" cy="60" r="48" fill="none" stroke="#ec4899" stroke-width="18" stroke-dasharray="${2*Math.PI*48*0.0654} ${2*Math.PI*48*0.9346}" stroke-dashoffset="${-2*Math.PI*48*0.8597}"/>
              <circle cx="60" cy="60" r="48" fill="none" stroke="#9ca3af" stroke-width="18" stroke-dasharray="${2*Math.PI*48*0.0334} ${2*Math.PI*48*0.9666}" stroke-dashoffset="${-2*Math.PI*48*0.9251}"/>
              <circle cx="60" cy="60" r="48" fill="none" stroke="#f59e0b" stroke-width="18" stroke-dasharray="${2*Math.PI*48*0.0415} ${2*Math.PI*48*0.9585}" stroke-dashoffset="${-2*Math.PI*48*0.9585}"/>
            </svg>
            <div class="ci-comp-donut-center">
              <div class="ci-donut-label">Total Cost</div>
              <div class="ci-donut-value" style="font-size:13px;">₹ 2,84,500</div>
            </div>
          </div>
          <div class="ci-comp-list">
            ${ciCompLegendRow('#16a34a', 'Feed', '56.96%')}
            ${ciCompLegendRow('#3b82f6', 'Labour', '21.10%')}
            ${ciCompLegendRow('#f97316', 'Medicine', '7.91%')}
            ${ciCompLegendRow('#ec4899', 'Electricity', '4.15%')}
            ${ciCompLegendRow('#9ca3af', 'Heating', '6.54%')}
            ${ciCompLegendRow('#f59e0b', 'Others', '3.34%')}
          </div>
        </div>
      </div>

      <!-- Right column: Break-even + Cost Saving Insights stacked -->
      <div style="display:flex;flex-direction:column;gap:14px;">

        <div class="ci-card">
          <div class="ci-card-header"><span class="ci-card-title">Break-Even Status</span></div>
          <div class="ci-be-body">
            ${ciBreakEvenRow(ciIcons.price, 'Break-even Sale Price', '₹ 70.45 / kg')}
            ${ciBreakEvenRow(ciIcons.market2, 'Current Market Price', '₹ 95.00 / kg')}
            ${ciBreakEvenRow(ciIcons.margin, 'Margin', '+₹ 24.55 / kg', true)}
            <div class="ci-status-box">
              <span class="ci-status-label">Status</span>
              <span class="ci-status-badge">Profitable <span style="display:inline-flex;background:#fff;border-radius:50%;width:14px;height:14px;align-items:center;justify-content:center;">${ciIcons.check}</span></span>
            </div>
          </div>
        </div>

        <div class="ci-card">
          <div class="ci-card-header"><span class="ci-card-title">Cost Saving Insights</span></div>
          <div class="ci-insight-list">
            ${ciInsightCard(ciIcons.feedSaving, '#d1fae5', 'Feed Cost', '3.8% lower than similar farms')}
            ${ciInsightCard(ciIcons.labourSaving, '#ffedd5', 'Labour Cost', '7% higher than benchmark')}
            ${ciInsightCard(ciIcons.swap, '#ede9fe', 'Switching Grower feed supplier', 'could save approx. ₹82,000 per cycle')}
          </div>
          <div class="ci-insight-footer">
            <a href="#" class="ci-insight-view-all">View All Insights <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </div>

      </div>

    </div>

  </div>`;
}