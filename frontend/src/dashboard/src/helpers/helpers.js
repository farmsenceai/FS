/* helpers.js — FarmSence.ai Helper Functions */

/**
 * Generic placeholder panel for simple views
 */
function genericPanel(icon, emoji, title, description) {
  return `
    <div class="db-placeholder-panel">
      <div class="db-placeholder-icon">${emoji}</div>
      <p class="db-placeholder-title">${title}</p>
      <p class="db-placeholder-desc">${description}</p>
    </div>`;
}

/**
 * Stat card component for displaying metrics
 */
function statCard(emoji, bg, label, value, sub, dir, meta) {
  const arrow = dir === 'up' ? '▲' : '▼';
  const cls   = dir === 'up' ? 'db-stat-up' : 'db-stat-down';
  return `
    <div class="db-stat-card">
      <div class="db-stat-icon-wrap" style="background:${bg};">${emoji}</div>
      <div class="db-stat-body">
        <div class="db-stat-label">${label}</div>
        <div class="db-stat-value">${value}</div>
        <div class="db-stat-meta">${sub} &nbsp;<span class="${cls}">${arrow} ${meta}</span></div>
      </div>
    </div>`;
}

/**
 * Insight item component for AI insights view
 */
function insightItem(emoji, bg, title, desc, tags, impactLabel, impactValue) {
  const tagHtml = tags.map(t => `<span class="db-insight-tag db-tag-${t}">${t.charAt(0).toUpperCase()+t.slice(1)}</span>`).join('');
  return `
    <div class="db-insight-item">
      <div class="db-insight-icon" style="background:${bg};">${emoji}</div>
      <div class="db-insight-body">
        <div class="db-insight-title">${title}</div>
        <div class="db-insight-desc">${desc}</div>
        <div class="db-insight-tags">${tagHtml}</div>
      </div>
      <div class="db-insight-impact">
        <span class="db-impact-label">${impactLabel}</span>
        <span class="db-impact-value">${impactValue}</span>
        <i class="fa-solid fa-chevron-right db-impact-chevron"></i>
      </div>
    </div>`;
}

/**
 * Recommendation item component
 */
function recoItem(num, emoji, text, impact) {
  const cls = impact === 'high' ? 'db-badge-high-impact' : impact === 'medium' ? 'db-badge-med-impact' : 'db-badge-low-impact';
  const label = impact.charAt(0).toUpperCase() + impact.slice(1) + ' Impact';
  return `
    <div class="db-reco-item">
      <span class="db-reco-num">${num}</span>
      <span class="db-reco-icon">${emoji}</span>
      <span class="db-reco-text">${text}</span>
      <span class="db-reco-badge ${cls}">${label}</span>
    </div>`;
}

/**
 * Anomaly table row component
 */
function anomalyRow(param, batch, dev, status) {
  const cls = status === 'high' ? 'db-status-high' : status === 'medium' ? 'db-status-medium' : 'db-status-low';
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return `<tr><td>${param}</td><td>${batch}</td><td>${dev}</td><td><span class="db-status-badge ${cls}">${label}</span></td></tr>`;
}

/**
 * Model performance table row component
 */
function modelRow(emoji, name, acc, status, date) {
  const cls = status === 'excellent' ? 'db-status-high' : 'db-status-low';
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const badgeCls = status === 'excellent' ? 'db-tag-positive' : 'db-tag-low';
  return `<tr><td><span class="db-model-icon">${emoji}</span>${name}</td><td>${acc}</td><td><span class="db-status-badge ${badgeCls}">${label}</span></td><td class="db-model-date">${date}</td></tr>`;
}