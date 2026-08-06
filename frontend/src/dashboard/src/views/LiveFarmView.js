/* views/LiveFarmView.js */

window.metaLiveFarmView = {
  title: 'Farm Video View',
  subtitle: 'Recorded demo footage  •  Pixabay-powered video library'
};

/* ── Helper functions ── */

function lfvEnvCard(iconSvg, value, label, status, statusColor) {
  return `
    <div class="lfv-env-card">
      <div class="lfv-env-icon">${iconSvg}</div>
      <div class="lfv-env-value">${value}</div>
      <div class="lfv-env-label">${label}</div>
      <div class="lfv-env-status" style="color:${statusColor}">${status}</div>
    </div>`;
}

function lfvAlertItem(type, title, desc, time) {
  const cfg = {
    warning: { bg: '#fff7ed', color: '#f59e0b', icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>` },
    success: { bg: '#f0fdf4', color: '#16a34a', icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>` },
    info:    { bg: '#eff6ff', color: '#3b82f6', icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>` },
  };
  const c = cfg[type];
  return `
    <div class="lfv-alert-item">
      <div class="lfv-alert-icon" style="background:${c.bg};color:${c.color}">${c.icon}</div>
      <div class="lfv-alert-body">
        <div class="lfv-alert-title">${title}</div>
        <div class="lfv-alert-desc">${desc}</div>
      </div>
      <div class="lfv-alert-time">${time}</div>
    </div>`;
}

function lfvCameraThumb(num, label, active) {
  return `
    <div class="lfv-cam-thumb${active ? ' active' : ''}">
      <div class="lfv-cam-preview">
        <svg width="100%" height="100%" viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg">
          <rect width="120" height="70" fill="${active ? '#1a3a2a' : '#1c1c1e'}"/>
          <rect x="10" y="10" width="100" height="50" rx="2" fill="${active ? '#2a5a3a' : '#2c2c2e'}" opacity=".6"/>
          <line x1="60" y1="10" x2="60" y2="60" stroke="#ffffff10" stroke-width="1"/>
          <line x1="10" y1="35" x2="110" y2="35" stroke="#ffffff10" stroke-width="1"/>
          <rect x="0" y="58" width="120" height="12" fill="rgba(0,0,0,.5)"/>
        </svg>
        <div class="lfv-cam-play">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
        <span class="lfv-cam-live-badge">Live</span>
      </div>
      <div class="lfv-cam-info">
        <div class="lfv-cam-name">Camera ${num}</div>
        <div class="lfv-cam-loc">${label}</div>
      </div>
    </div>`;
}

function lfvHighlightCard(time, label, isLive) {
  return `
    <div class="lfv-hl-card${isLive ? ' live' : ''}">
      <div class="lfv-hl-thumb">
        <svg width="100%" height="100%" viewBox="0 0 80 52" xmlns="http://www.w3.org/2000/svg">
          <rect width="80" height="52" fill="${isLive ? '#1a3a2a' : '#1c1c1e'}"/>
          <rect x="5" y="5" width="70" height="42" rx="2" fill="${isLive ? '#2a5a3a' : '#2a2a2a'}" opacity=".7"/>
          <circle cx="40" cy="26" r="10" fill="rgba(255,255,255,.15)"/>
          <polygon points="36,21 36,31 46,26" fill="white" opacity=".8"/>
        </svg>
        ${isLive ? '<span class="lfv-hl-live-badge">Live</span>' : ''}
      </div>
      <div class="lfv-hl-time">${time}</div>
      <div class="lfv-hl-label">${label}</div>
    </div>`;
}

/* ── CSS injected once ── */
function injectLiveFarmViewStyles() {
  if (document.getElementById('lfv-styles')) return;
  const style = document.createElement('style');
  style.id = 'lfv-styles';
  style.textContent = `
    /* ── Base ── */
    .lfv-scrollable { padding: 0; background: #f5f6fa; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #1a1a2e; }

    /* ── Main layout: video+cams+charts left | env+alerts+activity right ── */
    .lfv-layout { display: grid; grid-template-columns: 1fr 370px; gap: 0; min-height: calc(100vh - 50px); }

    /* ── Left column ── */
    .lfv-left { display: flex; flex-direction: column; padding: 16px 0 16px 16px; gap: 14px; overflow-y: auto; }

    /* ── Right column ── */
    .lfv-right { display: flex; flex-direction: column; padding: 16px; gap: 14px; border-left: 1px solid #e8eaf0; background: #fff; overflow-y: auto; }

    /* ── Video player ── */
    .lfv-player { background: #000; border-radius: 10px; overflow: hidden; position: relative; }
    .lfv-player-screen { position: relative; width: 100%; aspect-ratio: 16/9; background: linear-gradient(160deg, #0f2318 0%, #1a3a2a 50%, #0a1f14 100%); overflow: hidden; }
    .lfv-player-screen svg.lfv-bg { position: absolute; inset: 0; width: 100%; height: 100%; }
    .lfv-video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; background:#07110b; z-index:1; }
    .lfv-player-screen > :not(.lfv-bg):not(.lfv-video) { z-index:2; }
    .lfv-player-topbar { position: absolute; top: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: linear-gradient(to bottom, rgba(0,0,0,.55), transparent); }
    .lfv-player-cam-label { color: #fff; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 7px; }
    .lfv-live-dot { display: inline-block; width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: lfv-pulse 1.4s infinite; }
    @keyframes lfv-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }
    .lfv-player-timestamp { color: #fff; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .lfv-signal-bars { display: flex; align-items: flex-end; gap: 2px; }
    .lfv-signal-bars span { display: inline-block; width: 3px; background: #fff; border-radius: 1px; }
    .lfv-player-controls-right { position: absolute; right: 0; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: center; gap: 4px; padding: 0 8px; }
    .lfv-ctrl-btn { background: rgba(0,0,0,.5); border: none; color: #fff; border-radius: 6px; width: 58px; padding: 7px 4px 5px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; font-size: 10px; font-weight: 600; }
    .lfv-ctrl-btn svg { flex-shrink: 0; }
    .lfv-player-bottombar { position: absolute; bottom: 0; left: 0; right: 70px; display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: linear-gradient(to top, rgba(0,0,0,.6), transparent); }
    .lfv-play-btn { background: none; border: none; color: #fff; cursor: pointer; padding: 0; display: flex; align-items: center; }
    .lfv-live-pill { background: #ef4444; color: #fff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px; letter-spacing: .5px; }
    .lfv-network { color: #fff; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 5px; }
    .lfv-net-dot { width: 7px; height: 7px; background: #22c55e; border-radius: 50%; }

    /* ── Camera strip ── */
    .lfv-cam-strip { display: flex; align-items: center; gap: 8px; }
    .lfv-cam-nav { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #374151; flex-shrink: 0; font-size: 13px; }
    .lfv-cam-list { display: flex; gap: 8px; flex: 1; overflow: hidden; }
    .lfv-cam-thumb { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; cursor: pointer; flex: 0 0 calc((100% - 16px) / 3); min-width: 0; padding:0; font:inherit; text-align:left; }
    .lfv-cam-thumb.active { border-color: #16a34a; box-shadow: 0 0 0 2px #bbf7d0; }
    .lfv-cam-preview { position: relative; width: 100%; aspect-ratio: 16/9; overflow: hidden; }
    .lfv-cam-preview img, .lfv-cam-preview video { width:100%; height:100%; object-fit:cover; display:block; background:#17251c; }
    .lfv-cam-play { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
    .lfv-cam-play svg { background: rgba(0,0,0,.4); border-radius: 50%; padding: 4px; width: 20px; height: 20px; }
    .lfv-cam-live-badge { position: absolute; bottom: 4px; right: 4px; background: #16a34a; color: #fff; font-size: 8px; font-weight: 700; padding: 1px 5px; border-radius: 3px; }
    .lfv-cam-info { padding: 4px 6px 5px; }
    .lfv-cam-name { font-size: 10px; font-weight: 700; color: #111827; }
    .lfv-cam-loc { font-size: 9px; color: #6b7280; }

    /* ── Bottom charts row ── */
    .lfv-charts-row { display: grid; grid-template-columns: 1.1fr 1fr 1fr; gap: 12px; }
    .lfv-card { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; overflow: hidden; }
    .lfv-card-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px 8px; border-bottom: 1px solid #f3f4f6; }
    .lfv-card-title { font-size: 12.5px; font-weight: 700; }
    .lfv-card-link { font-size: 11px; color: #16a34a; text-decoration: none; font-weight: 600; }
    .lfv-card-select { border: 1px solid #e5e7eb; border-radius: 6px; padding: 3px 7px; font-size: 11px; background: #fff; cursor: pointer; }

    /* Environmental Trend chart */
    .lfv-trend-body { padding: 8px 14px 12px; }
    .lfv-trend-legend { display: flex; gap: 12px; margin-bottom: 6px; }
    .lfv-trend-legend-item { display: flex; align-items: center; gap: 4px; font-size: 10px; color: #6b7280; }
    .lfv-trend-legend-line { width: 14px; height: 2px; border-radius: 2px; }

    /* Real-time Mortality */
    .lfv-mort-body { padding: 10px 14px; }
    .lfv-mort-pct { font-size: 28px; font-weight: 800; line-height: 1; }
    .lfv-mort-label { font-size: 10px; color: #6b7280; margin-bottom: 6px; }
    .lfv-mort-change { font-size: 10px; font-weight: 600; color: #ef4444; }
    .lfv-mort-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 4px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #f3f4f6; }
    .lfv-mort-stat-label { font-size: 9px; color: #9ca3af; margin-bottom: 2px; }
    .lfv-mort-stat-val { font-size: 13px; font-weight: 700; }
    .lfv-mort-stat-val.red { color: #ef4444; }

    /* Feed & Water */
    .lfv-fw-body { padding: 10px 14px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .lfv-fw-gauges { display: flex; gap: 16px; justify-content: center; }
    .lfv-gauge-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .lfv-gauge-ring { position: relative; width: 80px; height: 80px; }
    .lfv-gauge-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .lfv-gauge-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .lfv-gauge-pct { font-size: 16px; font-weight: 800; }
    .lfv-gauge-lbl { font-size: 10px; color: #6b7280; margin-top: 1px; }
    .lfv-gauge-status { font-size: 10px; font-weight: 600; }
    .lfv-fw-btn { width: 100%; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 7px; padding: 7px; font-size: 11px; font-weight: 600; color: #374151; cursor: pointer; text-align: center; }

    /* ── Right panel: Environmental Conditions ── */
    .lfv-env-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .lfv-env-title { font-size: 13px; font-weight: 700; }
    .lfv-realtime-badge { font-size: 11px; font-weight: 600; color: #16a34a; }
    .lfv-env-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 8px; padding-bottom: 14px; border-bottom: 1px solid #f3f4f6; margin-bottom: 14px; }
    .lfv-env-card { display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
    .lfv-env-icon { color: #6b7280; }
    .lfv-env-value { font-size: 14px; font-weight: 800; color: #111827; }
    .lfv-env-label { font-size: 10px; color: #6b7280; }
    .lfv-env-status { font-size: 10px; font-weight: 600; }

    /* ── Right panel: AI Smart Alerts ── */
    .lfv-alerts-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .lfv-alerts-title { font-size: 13px; font-weight: 700; }
    .lfv-alert-item { display: flex; align-items: flex-start; gap: 10px; padding: 9px 0; border-bottom: 1px solid #f9fafb; }
    .lfv-alert-item:last-child { border-bottom: none; }
    .lfv-alert-icon { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .lfv-alert-body { flex: 1; min-width: 0; }
    .lfv-alert-title { font-size: 12px; font-weight: 700; margin-bottom: 2px; }
    .lfv-alert-desc { font-size: 10px; color: #6b7280; line-height: 1.4; }
    .lfv-alert-time { font-size: 10px; color: #9ca3af; white-space: nowrap; flex-shrink: 0; }

    /* ── Right panel: Bird Activity ── */
    .lfv-activity-header { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; padding-top: 14px; border-top: 1px solid #f3f4f6; margin-bottom: 10px; }
    .lfv-activity-title { font-size: 13px; font-weight: 700; }
    .lfv-activity-body { display: flex; align-items: center; gap: 16px; }
    .lfv-donut { position: relative; width: 90px; height: 90px; flex-shrink: 0; }
    .lfv-donut svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .lfv-donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .lfv-donut-pct { font-size: 18px; font-weight: 800; }
    .lfv-donut-lbl { font-size: 9px; color: #6b7280; font-weight: 500; }
    .lfv-activity-legend { flex: 1; display: flex; flex-direction: column; gap: 7px; }
    .lfv-act-row { display: flex; align-items: center; justify-content: space-between; font-size: 11px; }
    .lfv-act-dot { width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; flex-shrink: 0; }
    .lfv-act-label { display: flex; align-items: center; color: #374151; }
    .lfv-act-val { font-weight: 700; color: #111827; }
    .lfv-analysis-btn { width: 100%; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 7px; padding: 8px; font-size: 12px; font-weight: 700; color: #16a34a; cursor: pointer; text-align: center; margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 6px; }

    /* ── Highlights strip ── */
    .lfv-highlights { background: #fff; border-top: 1px solid #e8eaf0; }
    .lfv-hl-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px 6px; }
    .lfv-hl-title { font-size: 12.5px; font-weight: 700; }
    .lfv-hl-strip { display: flex; gap: 10px; padding: 4px 16px 14px; overflow-x: auto; }
    .lfv-hl-strip::-webkit-scrollbar { display: none; }
    .lfv-hl-card { background: #f9fafb; border-radius: 8px; border: 1px solid #e8eaf0; overflow: hidden; min-width: 130px; cursor: pointer; flex-shrink: 0; }
    .lfv-hl-card.live { border-color: #16a34a; background: #f0fdf4; }
    .lfv-hl-thumb { position: relative; width: 100%; aspect-ratio: 16/10; overflow: hidden; }
    .lfv-hl-live-badge { position: absolute; top: 4px; right: 4px; background: #16a34a; color: #fff; font-size: 8px; font-weight: 700; padding: 2px 5px; border-radius: 3px; }
    .lfv-hl-time { font-size: 10px; font-weight: 700; color: #111827; padding: 5px 8px 1px; }
    .lfv-hl-label { font-size: 10px; color: #6b7280; padding: 0 8px 6px; }
    .lfv-hl-all { min-width: 110px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px; flex-shrink: 0; cursor: pointer; }
    .lfv-hl-all-icon { width: 36px; height: 36px; background: #16a34a; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .lfv-hl-all-title { font-size: 11px; font-weight: 700; color: #16a34a; }
    .lfv-hl-all-sub { font-size: 10px; color: #16a34a; font-weight: 600; }

    /* Utility */
    .lfv-green { color: #16a34a; }
    .lfv-red { color: #ef4444; }
    .lfv-orange { color: #f59e0b; }
    .lfv-source { color:#fff; font-size:10px; margin-left:auto; max-width:42%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .lfv-source a { color:#fff; text-decoration:underline; }
    .lfv-footage-message { position:absolute; inset:0; z-index:3; display:flex; align-items:center; justify-content:center; padding:24px; color:#fff; background:rgba(4,14,8,.62); font-size:clamp(18px,2.4vw,30px); font-weight:700; text-align:center; text-shadow:0 2px 8px rgba(0,0,0,.55); }
    .lfv-footage-message[hidden] { display:none; }
  `;
  document.head.appendChild(style);
}

/* ── SVG icons (no emojis) ── */
const lfvIcons = {
  thermometer: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>`,
  droplet:     `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>`,
  wind:        `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2"/></svg>`,
  cloud:       `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>`,
  sun:         `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  camera:      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  record:      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>`,
  volume:      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>`,
  expand:      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
  pause:       `<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
  play:        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  videoAll:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
};

function lfvEscape(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[char]);
}

function lfvSafeLink(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

function lfvDbValue(value, suffix = '') {
  return value === null || value === undefined ? 'Unavailable' : `${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}${suffix}`;
}

async function lfvLoadOperationalData() {
  ['lfv-db-env', 'lfv-db-alerts', 'lfv-db-charts', 'lfv-db-activity', 'lfv-db-highlights'].forEach(id => {
    const element = document.getElementById(id);
    if (element) element.innerHTML = '<div style="padding:14px;color:#6b7280">Loading database data…</div>';
  });
  try {
    const response = await fetch('/api/v2/business-dashboard', {
      headers: { Authorization: `Bearer ${localStorage.getItem('fs_token') || ''}` }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Operational data is unavailable');
    const record = data.latestRecord;
    const batch = data.batch;
    const farm = data.farm;
    const date = record?.recordDate ? new Date(record.recordDate) : null;

    const subtitle = document.getElementById('panel-subtitle');
    if (subtitle) subtitle.textContent = `${farm?.name || 'No farm'} • ${batch?.code || 'No active batch'} • ${lfvDbValue(batch?.currentBirds)} birds`;

    const env = document.getElementById('lfv-db-env');
    if (env) env.innerHTML = `
      ${lfvEnvCard(lfvIcons.thermometer, lfvDbValue(record?.temperatureC, '°C'), 'Temperature', date ? 'Latest record' : 'Unavailable', date ? '#16a34a' : '#9ca3af')}
      ${lfvEnvCard(lfvIcons.droplet, lfvDbValue(record?.humidityPct, '%'), 'Humidity', date ? 'Latest record' : 'Unavailable', date ? '#16a34a' : '#9ca3af')}
      ${lfvEnvCard(lfvIcons.wind, lfvDbValue(record?.ammoniaPpm, ' ppm'), 'Ammonia', date ? 'Latest record' : 'Unavailable', date ? '#16a34a' : '#9ca3af')}
      ${lfvEnvCard(lfvIcons.cloud, lfvDbValue(record?.co2Ppm, ' ppm'), 'CO₂ Level', date ? 'Latest record' : 'Unavailable', date ? '#16a34a' : '#9ca3af')}
      ${lfvEnvCard(lfvIcons.sun, lfvDbValue(record?.averageWeightGrams, ' g'), 'Avg. Weight', date ? 'Latest record' : 'Unavailable', date ? '#16a34a' : '#9ca3af')}`;

    const alerts = document.getElementById('lfv-db-alerts');
    if (alerts) alerts.innerHTML = '<div style="padding:14px 0;color:#6b7280">No database-backed AI alerts are available. Alerts will appear after an inference service stores them.</div>';

    const charts = document.getElementById('lfv-db-charts');
    if (charts) charts.innerHTML = `
      <div class="lfv-card"><div class="lfv-card-header"><span class="lfv-card-title">Latest Environmental Record</span></div><div class="lfv-mort-body">
        <div class="lfv-mort-stats"><div><div class="lfv-mort-stat-label">Recorded On</div><div class="lfv-mort-stat-val">${date ? date.toLocaleDateString('en-IN') : 'Unavailable'}</div></div><div><div class="lfv-mort-stat-label">Source</div><div class="lfv-mort-stat-val">${lfvEscape(record?.source || 'Unavailable')}</div></div><div><div class="lfv-mort-stat-label">Status</div><div class="lfv-mort-stat-val">${lfvEscape(record?.syncStatus || 'Unavailable')}</div></div></div>
      </div></div>
      <div class="lfv-card"><div class="lfv-card-header"><span class="lfv-card-title">Latest Mortality</span></div><div class="lfv-mort-body"><div class="lfv-mort-pct">${lfvDbValue(record?.mortalityPct, '%')}</div><div class="lfv-mort-label">Recorded mortality rate</div><div class="lfv-mort-stats"><div><div class="lfv-mort-stat-label">Deaths</div><div class="lfv-mort-stat-val red">${lfvDbValue(record?.mortalityCount)}</div></div><div><div class="lfv-mort-stat-label">Current Birds</div><div class="lfv-mort-stat-val">${lfvDbValue(batch?.currentBirds)}</div></div><div><div class="lfv-mort-stat-label">Batch</div><div class="lfv-mort-stat-val">${lfvEscape(batch?.code || 'Unavailable')}</div></div></div></div></div>
      <div class="lfv-card"><div class="lfv-card-header"><span class="lfv-card-title">Feed &amp; Water</span></div><div class="lfv-fw-body"><div class="lfv-fw-gauges"><div class="lfv-gauge-wrap"><div class="lfv-gauge-pct" style="color:#3b82f6">${lfvDbValue(record?.waterLiters, ' L')}</div><div class="lfv-gauge-lbl">Water consumed</div></div><div class="lfv-gauge-wrap"><div class="lfv-gauge-pct" style="color:#f59e0b">${lfvDbValue(record?.feedKg, ' kg')}</div><div class="lfv-gauge-lbl">Feed consumed</div></div></div></div></div>`;

    const activity = document.getElementById('lfv-db-activity');
    if (activity) activity.innerHTML = '<div style="padding:12px 0;color:#6b7280">Bird-activity inference is unavailable because no authoritative camera-analysis records exist.</div>';

    const highlights = document.getElementById('lfv-db-highlights');
    if (highlights) highlights.innerHTML = `<div class="lfv-hl-card live"><div class="lfv-hl-time">${date ? date.toLocaleString('en-IN') : 'No record'}</div><div class="lfv-hl-label">${date ? `Latest ${lfvEscape(record.syncStatus || 'submitted')} operational record` : 'No operational records available'}</div></div>`;
  } catch (error) {
    ['lfv-db-env', 'lfv-db-alerts', 'lfv-db-charts', 'lfv-db-activity', 'lfv-db-highlights'].forEach(id => {
      const element = document.getElementById(id);
      if (element) element.innerHTML = `<div style="padding:14px;color:#b91c1c">${lfvEscape(error.message)}</div>`;
    });
  }
}

async function initLiveFarmView() {
  lfvLoadOperationalData();
}

/* ── Main view function ── */
function viewLiveFarmView(user) {
  injectLiveFarmViewStyles();
  setTimeout(initLiveFarmView, 0);

  return `
  <div class="lfv-scrollable">
    <div class="lfv-layout">

      <!-- ════ LEFT COLUMN ════ -->
      <div class="lfv-left">

        <!-- Video Player -->
        <div class="lfv-player">
          <div class="lfv-player-screen">
            <!-- Background scene SVG -->
            <svg class="lfv-bg" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="lfv-shed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#0a1f14"/>
                  <stop offset="100%" stop-color="#1a3a2a"/>
                </linearGradient>
              </defs>
              <rect width="800" height="450" fill="url(#lfv-shed)"/>
              <!-- Ceiling beams perspective -->
              <line x1="400" y1="60" x2="0"   y2="180" stroke="#ffffff08" stroke-width="1"/>
              <line x1="400" y1="60" x2="800" y2="180" stroke="#ffffff08" stroke-width="1"/>
              <line x1="400" y1="60" x2="0"   y2="300" stroke="#ffffff06" stroke-width="1"/>
              <line x1="400" y1="60" x2="800" y2="300" stroke="#ffffff06" stroke-width="1"/>
              <!-- Floor perspective lines -->
              <line x1="400" y1="300" x2="0"   y2="450" stroke="#ffffff06" stroke-width="1"/>
              <line x1="400" y1="300" x2="800" y2="450" stroke="#ffffff06" stroke-width="1"/>
              <!-- Ceiling lights -->
              <ellipse cx="160" cy="80" rx="18" ry="6" fill="#fffde7" opacity=".25"/>
              <ellipse cx="320" cy="70" rx="18" ry="6" fill="#fffde7" opacity=".3"/>
              <ellipse cx="480" cy="70" rx="18" ry="6" fill="#fffde7" opacity=".3"/>
              <ellipse cx="640" cy="80" rx="18" ry="6" fill="#fffde7" opacity=".25"/>
              <!-- Light beams -->
              <polygon points="150,82 100,260 210,260" fill="#fffde7" opacity=".04"/>
              <polygon points="320,72 260,340 380,340" fill="#fffde7" opacity=".05"/>
              <polygon points="480,72 420,340 540,340" fill="#fffde7" opacity=".05"/>
              <polygon points="640,82 580,260 700,260" fill="#fffde7" opacity=".04"/>
              <!-- Floor area (birds suggestion) -->
              <rect x="0" y="300" width="800" height="150" fill="#0d1f0f" opacity=".8"/>
              <!-- Fans on wall -->
              <circle cx="60" cy="200" r="38" fill="#111" stroke="#333" stroke-width="2"/>
              <line x1="60" y1="162" x2="60" y2="200" stroke="#444" stroke-width="3"/>
              <line x1="60" y1="238" x2="60" y2="200" stroke="#444" stroke-width="3"/>
              <line x1="22" y1="200" x2="60" y2="200" stroke="#444" stroke-width="3"/>
              <line x1="98" y1="200" x2="60" y2="200" stroke="#444" stroke-width="3"/>
              <circle cx="60" cy="200" r="8" fill="#222"/>
              <circle cx="740" cy="200" r="38" fill="#111" stroke="#333" stroke-width="2"/>
              <line x1="740" y1="162" x2="740" y2="200" stroke="#444" stroke-width="3"/>
              <line x1="740" y1="238" x2="740" y2="200" stroke="#444" stroke-width="3"/>
              <line x1="702" y1="200" x2="740" y2="200" stroke="#444" stroke-width="3"/>
              <line x1="778" y1="200" x2="740" y2="200" stroke="#444" stroke-width="3"/>
              <circle cx="740" cy="200" r="8" fill="#222"/>
              <!-- Red feeders (circles) -->
              <ellipse cx="200" cy="360" rx="22" ry="8" fill="#dc2626" opacity=".8"/>
              <ellipse cx="320" cy="380" rx="26" ry="9" fill="#dc2626" opacity=".9"/>
              <ellipse cx="400" cy="370" rx="30" ry="10" fill="#dc2626"/>
              <ellipse cx="500" cy="380" rx="26" ry="9" fill="#dc2626" opacity=".9"/>
              <ellipse cx="610" cy="360" rx="22" ry="8" fill="#dc2626" opacity=".8"/>
              <!-- Feeder stems -->
              <rect x="396" y="290" width="8" height="80" fill="#dc2626" opacity=".6"/>
              <rect x="316" y="310" width="8" height="70" fill="#dc2626" opacity=".5"/>
              <rect x="496" y="310" width="8" height="70" fill="#dc2626" opacity=".5"/>
            </svg>
            <img class="lfv-video" src="/assets/images/Test%20Images/cc2.png" alt="Snapshot of a poultry farm">
            <div class="lfv-footage-message">Your live farm footage will appear here</div>

            <!-- Top bar overlay -->
            <div class="lfv-player-topbar">
              <div class="lfv-player-cam-label">
                <span class="lfv-live-dot"></span>
                <span id="lfv-camera-label">Brooder Area (Demo)</span>
              </div>
              <div class="lfv-player-timestamp">
                <span id="lfv-player-time">Recorded video</span>
                <div class="lfv-signal-bars">
                  <span style="height:4px"></span>
                  <span style="height:7px"></span>
                  <span style="height:10px"></span>
                  <span style="height:13px"></span>
                </div>
              </div>
            </div>

            <!-- Right controls -->
            <div class="lfv-player-controls-right">
              <button class="lfv-ctrl-btn" id="lfv-snapshot">${lfvIcons.camera}<span>Snapshot</span></button>
              <button class="lfv-ctrl-btn" id="lfv-sound">${lfvIcons.volume}<span>Sound</span></button>
              <button class="lfv-ctrl-btn" id="lfv-expand">${lfvIcons.expand}<span>Expand</span></button>
            </div>

            <!-- Bottom bar -->
            <div class="lfv-player-bottombar">
              <button class="lfv-play-btn" id="lfv-play">${lfvIcons.play}</button>
              <span class="lfv-live-pill">DEMO</span>
              <span class="lfv-network"><span class="lfv-net-dot"></span> Recorded footage</span>
              <span class="lfv-source" id="lfv-source">FarmSence demo footage</span>
            </div>
          </div>
        </div>

        <!-- Camera Strip -->
        <div class="lfv-cam-strip">
          <button class="lfv-cam-nav">&#8249;</button>
          <div class="lfv-cam-list">
            <button type="button" class="lfv-cam-thumb active">
              <div class="lfv-cam-preview"><video src="/assets/video/ChickCoop_Zero_Waste.mp4.mp4#t=2" muted playsinline preload="metadata"></video><div class="lfv-cam-play">${lfvIcons.play}</div><span class="lfv-cam-live-badge">Demo</span></div>
              <div class="lfv-cam-info"><div class="lfv-cam-name">Brooder Area</div><div class="lfv-cam-loc">Recorded footage</div></div>
            </button>
            <button type="button" class="lfv-cam-thumb">
              <div class="lfv-cam-preview"><video src="/assets/video/chickcoop_farmtech_v1%20(1080p).mp4#t=2" muted playsinline preload="metadata"></video><div class="lfv-cam-play">${lfvIcons.play}</div><span class="lfv-cam-live-badge">Demo</span></div>
              <div class="lfv-cam-info"><div class="lfv-cam-name">Shed A</div><div class="lfv-cam-loc">Recorded footage</div></div>
            </button>
            <button type="button" class="lfv-cam-thumb">
              <div class="lfv-cam-preview"><video src="/assets/video/chickcoop_farmtech_video_2_v1%20(1080p).mp4#t=2" muted playsinline preload="metadata"></video><div class="lfv-cam-play">${lfvIcons.play}</div><span class="lfv-cam-live-badge">Demo</span></div>
              <div class="lfv-cam-info"><div class="lfv-cam-name">Shed B</div><div class="lfv-cam-loc">Recorded footage</div></div>
            </button>
          </div>
          <button class="lfv-cam-nav">&#8250;</button>
        </div>

        <!-- Charts Row -->
        <div class="lfv-charts-row" id="lfv-db-charts">

          <!-- Environmental Trend -->
          <div class="lfv-card">
            <div class="lfv-card-header">
              <span class="lfv-card-title">Environmental Trend <span style="font-size:10px;font-weight:500;color:#9ca3af;">(24Hrs)</span></span>
            </div>
            <div class="lfv-trend-body">
              <div class="lfv-trend-legend">
                <span class="lfv-trend-legend-item"><span class="lfv-trend-legend-line" style="background:#22c55e;display:inline-block"></span>&nbsp;Temp (°C)</span>
                <span class="lfv-trend-legend-item"><span class="lfv-trend-legend-line" style="background:#3b82f6;display:inline-block"></span>&nbsp;Humidity (%)</span>
                <span class="lfv-trend-legend-item"><span class="lfv-trend-legend-line" style="background:#f59e0b;display:inline-block"></span>&nbsp;CO<sub>2</sub> (ppm)</span>
              </div>
              <svg viewBox="0 0 280 120" style="width:100%;height:120px;">
                <!-- Y-axis left (temp) -->
                <text x="0" y="14" font-size="7" fill="#9ca3af">40°C</text>
                <text x="0" y="42" font-size="7" fill="#9ca3af">30°C</text>
                <text x="0" y="70" font-size="7" fill="#9ca3af">20°C</text>
                <text x="0" y="98" font-size="7" fill="#9ca3af">10°C</text>
                <text x="0" y="116" font-size="7" fill="#9ca3af">0°C</text>
                <!-- Y-axis right (%) -->
                <text x="260" y="14" font-size="7" fill="#9ca3af">100%</text>
                <text x="260" y="42" font-size="7" fill="#9ca3af">75%</text>
                <text x="260" y="70" font-size="7" fill="#9ca3af">50%</text>
                <text x="260" y="98" font-size="7" fill="#9ca3af">25%</text>
                <text x="264" y="116" font-size="7" fill="#9ca3af">0%</text>
                <!-- Grid -->
                <line x1="20" y1="12" x2="256" y2="12" stroke="#f3f4f6" stroke-width="1"/>
                <line x1="20" y1="40" x2="256" y2="40" stroke="#f3f4f6" stroke-width="1"/>
                <line x1="20" y1="68" x2="256" y2="68" stroke="#f3f4f6" stroke-width="1"/>
                <line x1="20" y1="96" x2="256" y2="96" stroke="#f3f4f6" stroke-width="1"/>
                <!-- Temp line (green) -->
                <polyline points="22,68 56,60 90,58 124,55 158,50 192,52 226,48 256,45" fill="none" stroke="#22c55e" stroke-width="1.5"/>
                <circle cx="22" cy="68" r="2.5" fill="#22c55e"/>
                <circle cx="56" cy="60" r="2.5" fill="#22c55e"/>
                <circle cx="90" cy="58" r="2.5" fill="#22c55e"/>
                <circle cx="124" cy="55" r="2.5" fill="#22c55e"/>
                <circle cx="158" cy="50" r="2.5" fill="#22c55e"/>
                <circle cx="192" cy="52" r="2.5" fill="#22c55e"/>
                <circle cx="226" cy="48" r="2.5" fill="#22c55e"/>
                <circle cx="256" cy="45" r="2.5" fill="#22c55e"/>
                <!-- Humidity line (blue) -->
                <polyline points="22,45 56,48 90,50 124,52 158,48 192,50 226,54 256,56" fill="none" stroke="#3b82f6" stroke-width="1.5"/>
                <circle cx="22" cy="45" r="2.5" fill="#3b82f6"/>
                <circle cx="256" cy="56" r="2.5" fill="#3b82f6"/>
                <!-- CO2 line (orange) -->
                <polyline points="22,96 56,94 90,92 124,90 158,88 192,86 226,84 256,82" fill="none" stroke="#f59e0b" stroke-width="1.5"/>
                <circle cx="22" cy="96" r="2.5" fill="#f59e0b"/>
                <circle cx="256" cy="82" r="2.5" fill="#f59e0b"/>
                <!-- X labels -->
                <text x="15" y="114" font-size="7" fill="#9ca3af">12 AM</text>
                <text x="48" y="114" font-size="7" fill="#9ca3af">4 AM</text>
                <text x="82" y="114" font-size="7" fill="#9ca3af">8 AM</text>
                <text x="114" y="114" font-size="7" fill="#9ca3af">12 PM</text>
                <text x="148" y="114" font-size="7" fill="#9ca3af">4 PM</text>
                <text x="182" y="114" font-size="7" fill="#9ca3af">8 PM</text>
                <text x="215" y="114" font-size="7" fill="#9ca3af">12 AM</text>
              </svg>
            </div>
          </div>

          <!-- Real-time Mortality -->
          <div class="lfv-card">
            <div class="lfv-card-header">
              <span class="lfv-card-title">Real-time Mortality</span>
              <select class="lfv-card-select"><option>Today</option></select>
            </div>
            <div class="lfv-mort-body">
              <div class="lfv-mort-pct">1.1%</div>
              <div class="lfv-mort-label">Current Mortality</div>
              <svg viewBox="0 0 200 70" style="width:100%;height:70px;margin-top:4px;">
                <line x1="0" y1="10" x2="200" y2="10" stroke="#f3f4f6" stroke-width="1"/>
                <line x1="0" y1="35" x2="200" y2="35" stroke="#f3f4f6" stroke-width="1"/>
                <line x1="0" y1="60" x2="200" y2="60" stroke="#f3f4f6" stroke-width="1"/>
                <polyline points="0,55 40,52 80,48 120,42 160,30 200,22" fill="none" stroke="#16a34a" stroke-width="2"/>
                <circle cx="0"   cy="55" r="3" fill="#16a34a"/>
                <circle cx="40"  cy="52" r="3" fill="#16a34a"/>
                <circle cx="80"  cy="48" r="3" fill="#16a34a"/>
                <circle cx="120" cy="42" r="3" fill="#16a34a"/>
                <circle cx="160" cy="30" r="3" fill="#16a34a"/>
                <circle cx="200" cy="22" r="3" fill="#16a34a"/>
                <text x="0"   y="68" font-size="7" fill="#9ca3af">Day 1</text>
                <text x="34"  y="68" font-size="7" fill="#9ca3af">Day 10</text>
                <text x="72"  y="68" font-size="7" fill="#9ca3af">Day 20</text>
                <text x="112" y="68" font-size="7" fill="#9ca3af">Day 30</text>
                <text x="178" y="68" font-size="7" fill="#9ca3af">Day 42</text>
              </svg>
              <div class="lfv-mort-stats">
                <div>
                  <div class="lfv-mort-stat-label">Total Dead Today</div>
                  <div class="lfv-mort-stat-val red">165 <span style="font-size:10px;font-weight:500;color:#6b7280;">Birds</span></div>
                </div>
                <div>
                  <div class="lfv-mort-stat-label">Cumulative</div>
                  <div class="lfv-mort-stat-val">165 <span style="font-size:10px;font-weight:500;color:#6b7280;">Birds</span></div>
                </div>
                <div>
                  <div class="lfv-mort-stat-label">Expected Range</div>
                  <div class="lfv-mort-stat-val lfv-green">&lt; 2.5%</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Feed & Water Status -->
          <div class="lfv-card">
            <div class="lfv-card-header">
              <span class="lfv-card-title">Feed &amp; Water Status</span>
            </div>
            <div class="lfv-fw-body">
              <div class="lfv-fw-gauges">
                <!-- Water gauge -->
                <div class="lfv-gauge-wrap">
                  <div class="lfv-gauge-ring">
                    <svg viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="30" fill="none" stroke="#e8eaf0" stroke-width="8"/>
                      <circle cx="40" cy="40" r="30" fill="none" stroke="#3b82f6" stroke-width="8"
                        stroke-dasharray="${2 * Math.PI * 30 * 0.78} ${2 * Math.PI * 30 * 0.22}"
                        stroke-linecap="round"/>
                    </svg>
                    <div class="lfv-gauge-center">
                      <div class="lfv-gauge-pct" style="color:#3b82f6">78%</div>
                      <div class="lfv-gauge-lbl">Water</div>
                    </div>
                  </div>
                  <div class="lfv-gauge-status lfv-green">Good</div>
                </div>
                <!-- Feed gauge -->
                <div class="lfv-gauge-wrap">
                  <div class="lfv-gauge-ring">
                    <svg viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="30" fill="none" stroke="#e8eaf0" stroke-width="8"/>
                      <circle cx="40" cy="40" r="30" fill="none" stroke="#f59e0b" stroke-width="8"
                        stroke-dasharray="${2 * Math.PI * 30 * 0.62} ${2 * Math.PI * 30 * 0.38}"
                        stroke-linecap="round"/>
                    </svg>
                    <div class="lfv-gauge-center">
                      <div class="lfv-gauge-pct" style="color:#f59e0b">62%</div>
                      <div class="lfv-gauge-lbl">Feed</div>
                    </div>
                  </div>
                  <div class="lfv-gauge-status lfv-green">Good</div>
                </div>
              </div>
              <button class="lfv-fw-btn">View Consumption Details &rarr;</button>
            </div>
          </div>

        </div>

        <!-- Today's Highlights -->
        <div class="lfv-highlights">
          <div class="lfv-hl-header">
            <span class="lfv-hl-title">Recent Operational Records</span>
          </div>
          <div class="lfv-hl-strip" id="lfv-db-highlights">
            ${lfvHighlightCard('06:00 AM', 'Feed Time', false)}
            ${lfvHighlightCard('09:15 AM', 'Water Check', false)}
            ${lfvHighlightCard('10:30 AM', 'Health Check', true)}
            ${lfvHighlightCard('01:00 PM', 'Feed Time', false)}
            ${lfvHighlightCard('05:30 PM', 'Environment Check', false)}
            <div class="lfv-hl-all">
              <div class="lfv-hl-all-icon">${lfvIcons.videoAll}</div>
              <div class="lfv-hl-all-title">All Recordings</div>
              <div class="lfv-hl-all-sub">View All Videos &rarr;</div>
            </div>
          </div>
        </div>

      </div>
      <!-- ════ END LEFT ════ -->

      <!-- ════ RIGHT COLUMN ════ -->
      <div class="lfv-right">

        <!-- Environmental Conditions -->
        <div class="lfv-env-header">
          <span class="lfv-env-title">Environmental Conditions</span>
          <span class="lfv-realtime-badge">Latest database record</span>
        </div>
        <div class="lfv-env-grid" id="lfv-db-env">
          ${lfvEnvCard(lfvIcons.thermometer, '30.5°C', 'Temperature', 'Optimal', '#16a34a')}
          ${lfvEnvCard(lfvIcons.droplet,     '62%',    'Humidity',    'Optimal', '#16a34a')}
          ${lfvEnvCard(lfvIcons.wind,        '2.1 m/s','Air Speed',   'Good',    '#16a34a')}
          ${lfvEnvCard(lfvIcons.cloud,       '680 ppm','CO\u2082 Level', 'Good', '#16a34a')}
          ${lfvEnvCard(lfvIcons.sun,         '45 Lux', 'Light Intensity', 'Optimal', '#16a34a')}
        </div>

        <!-- AI Smart Alerts -->
        <div class="lfv-alerts-header">
          <span class="lfv-alerts-title">AI Smart Alerts</span>
          <a href="#" class="lfv-card-link">View All</a>
        </div>
        <div id="lfv-db-alerts">
          ${lfvAlertItem('warning', 'Heat stress increasing in Shed A', 'Temperature is 2.5°C above optimal range', '10:20 AM')}
          ${lfvAlertItem('success', 'Feed intake is normal', 'Birds are consuming feed as expected', '09:45 AM')}
          ${lfvAlertItem('success', 'Mortality is under control', 'Current mortality 1.1% within range', '09:30 AM')}
          ${lfvAlertItem('info',    'Next Vaccination Due', 'IBD Vaccination due tomorrow', 'Tomorrow')}
        </div>

        <!-- Bird Activity -->
        <div class="lfv-activity-header">
          <span class="lfv-activity-title">Bird Activity <span style="font-size:10px;color:#9ca3af;font-weight:500;">(Awaiting camera analysis)</span></span>
        </div>
        <div class="lfv-activity-body" id="lfv-db-activity">
          <!-- Donut chart -->
          <div class="lfv-donut">
            <svg viewBox="0 0 90 90">
              <!-- background ring -->
              <circle cx="45" cy="45" r="34" fill="none" stroke="#e8eaf0" stroke-width="10"/>
              <!-- Sick (red) 2% -->
              <circle cx="45" cy="45" r="34" fill="none" stroke="#ef4444" stroke-width="10"
                stroke-dasharray="${2*Math.PI*34*0.02} ${2*Math.PI*34*0.98}" stroke-dashoffset="0" stroke-linecap="butt"/>
              <!-- Inactive (orange) 4% - offset past sick -->
              <circle cx="45" cy="45" r="34" fill="none" stroke="#f59e0b" stroke-width="10"
                stroke-dasharray="${2*Math.PI*34*0.04} ${2*Math.PI*34*0.96}"
                stroke-dashoffset="${-2*Math.PI*34*0.02}" stroke-linecap="butt"/>
              <!-- Active (green) 94% - offset past sick+inactive -->
              <circle cx="45" cy="45" r="34" fill="none" stroke="#16a34a" stroke-width="10"
                stroke-dasharray="${2*Math.PI*34*0.94} ${2*Math.PI*34*0.06}"
                stroke-dashoffset="${-2*Math.PI*34*0.06}" stroke-linecap="butt"/>
            </svg>
            <div class="lfv-donut-center">
              <div class="lfv-donut-pct">94%</div>
              <div class="lfv-donut-lbl">Active Birds</div>
            </div>
          </div>
          <div class="lfv-activity-legend">
            <div class="lfv-act-row">
              <span class="lfv-act-label"><span class="lfv-act-dot" style="background:#16a34a"></span>Active</span>
              <span class="lfv-act-val">14,100 (94%)</span>
            </div>
            <div class="lfv-act-row">
              <span class="lfv-act-label"><span class="lfv-act-dot" style="background:#f59e0b"></span>Inactive</span>
              <span class="lfv-act-val">600 (4%)</span>
            </div>
            <div class="lfv-act-row">
              <span class="lfv-act-label"><span class="lfv-act-dot" style="background:#ef4444"></span>Sick</span>
              <span class="lfv-act-val">300 (2%)</span>
            </div>
          </div>
        </div>
        <button class="lfv-analysis-btn" disabled style="opacity:.55;cursor:not-allowed">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          AI Analysis Unavailable
        </button>

      </div>
      <!-- ════ END RIGHT ════ -->

    </div>
  </div>`;
}
