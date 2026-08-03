/* views/AIInsights.js */

window.metaAIInsights = {
  title: 'AI Insights',
  subtitle: 'Smart insights and predictions to help you make data-driven decisions.'
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

function insightItem(icon, bg, title, desc, tags, metaLabel, metaValue) {
  const tagHtml = tags.map(t => `<span class="db-tag db-tag-${t}">${t}</span>`).join('');
  return `
    <div class="db-insight-item">
      <div class="db-insight-icon" style="background:${bg}">${icon}</div>
      <div class="db-insight-body">
        <div class="db-insight-title">${title}</div>
        <div class="db-insight-desc">${desc}</div>
        <div class="db-insight-tags">${tagHtml}</div>
      </div>
      <div class="db-insight-meta">
        <div class="db-insight-meta-label">${metaLabel}</div>
        <div class="db-insight-meta-value">${metaValue}</div>
      </div>
      <div class="db-insight-arrow">›</div>
    </div>`;
}

function recoItem(num, icon, text, priority) {
  return `
    <div class="db-reco-item">
      <div class="db-reco-num">${num}</div>
      <div class="db-reco-icon">${icon}</div>
      <div class="db-reco-text">${text}</div>
      <span class="db-impact-badge db-impact-${priority}">${priority.charAt(0).toUpperCase() + priority.slice(1)} Impact</span>
    </div>`;
}

function anomalyRow(param, batch, deviation, status) {
  return `
    <tr>
      <td>${param}</td>
      <td>${batch}</td>
      <td>${deviation}</td>
      <td><span class="db-status-badge db-status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
    </tr>`;
}

function modelRow(icon, name, accuracy, status, trained) {
  return `
    <tr>
      <td><span class="db-model-icon">${icon}</span>${name}</td>
      <td><strong>${accuracy}</strong></td>
      <td><span class="db-status-badge db-status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
      <td>${trained}</td>
    </tr>`;
}

/* ── CSS injected once ── */
function injectAIInsightsStyles() {
  if (document.getElementById('ai-insights-styles')) return;
  const style = document.createElement('style');
  style.id = 'ai-insights-styles';
  style.textContent = `
    .db-scrollable { padding: 20px; background: #f5f6fa; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #1a1a2e; }

    /* Stat row */
    .db-stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
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

    /* Insights grid — list style */
    .db-insights-grid { padding: 0; }
    .db-insight-item { display: flex; align-items: flex-start; gap: 12px; padding: 10px 16px; border-bottom: 1px solid #f9fafb; }
    .db-insight-item:last-child { border-bottom: none; }
    .db-insight-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
    .db-insight-body { flex: 1; min-width: 0; }
    .db-insight-title { font-size: 12.5px; font-weight: 700; margin-bottom: 3px; }
    .db-insight-desc { font-size: 11px; color: #6b7280; line-height: 1.4; margin-bottom: 5px; }
    .db-insight-tags { display: flex; gap: 5px; flex-wrap: wrap; }
    .db-insight-meta { text-align: right; flex-shrink: 0; min-width: 70px; }
    .db-insight-meta-label { font-size: 10px; color: #9ca3af; }
    .db-insight-meta-value { font-size: 12px; font-weight: 700; color: #111827; }
    .db-insight-arrow { color: #9ca3af; font-size: 16px; flex-shrink: 0; align-self: center; }

    /* Tags */
    .db-tag { padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: capitalize; }
    .db-tag-alert, .db-tag-warning { background: #fef3c7; color: #d97706; }
    .db-tag-critical { background: #fee2e2; color: #dc2626; }
    .db-tag-opportunity, .db-tag-feed { background: #dbeafe; color: #2563eb; }
    .db-tag-cost { background: #c7d2fe; color: #4338ca; }
    .db-tag-positive, .db-tag-growth { background: #d1fae5; color: #059669; }
    .db-tag-maintenance { background: #e0e7ff; color: #4f46e5; }
    .db-tag-environment { background: #fed7aa; color: #ea580c; }

    /* Recommendations */
    .db-reco-list { padding: 0; }
    .db-reco-item { display: flex; align-items: center; gap: 10px; padding: 9px 16px; border-bottom: 1px solid #f9fafb; }
    .db-reco-item:last-child { border-bottom: none; }
    .db-reco-num { width: 22px; height: 22px; background: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
    .db-reco-icon { width: 30px; height: 30px; background: #f0fdf4; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
    .db-reco-text { flex: 1; font-size: 12px; color: #374151; }
    .db-impact-badge { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
    .db-impact-high { background: #fee2e2; color: #dc2626; }
    .db-impact-medium { background: #fef3c7; color: #d97706; }
    .db-impact-low { background: #f3f4f6; color: #6b7280; }

    /* Tables */
    .db-table { width: 100%; border-collapse: collapse; }
    .db-table th { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px; padding: 8px 16px; text-align: left; background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
    .db-table td { padding: 9px 16px; font-size: 12px; border-bottom: 1px solid #f9fafb; }
    .db-table tr:last-child td { border-bottom: none; }
    .db-status-badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 5px; font-size: 10px; font-weight: 700; }
    .db-status-high { background: #fee2e2; color: #dc2626; }
    .db-status-medium { background: #fef3c7; color: #d97706; }
    .db-status-low { background: #f3f4f6; color: #6b7280; }
    .db-status-excellent { background: #d1fae5; color: #059669; }
    .db-status-good { background: #dbeafe; color: #2563eb; }
    .db-model-icon { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: #f3f4f6; border-radius: 6px; font-size: 13px; margin-right: 8px; vertical-align: middle; }

    /* Ask AI bar */
    .db-ask-bar { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; padding: 16px; margin-bottom: 16px; }
    .db-ask-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .db-ask-icon { width: 36px; height: 36px; background: linear-gradient(135deg,#16a34a,#059669); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; flex-shrink: 0; }
    .db-ask-title { font-size: 14px; font-weight: 700; }
    .db-ask-badge { background: #dbeafe; color: #2563eb; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-left: 6px; vertical-align: middle; }
    .db-ask-desc { font-size: 11px; color: #6b7280; margin-left: auto; }
    .db-ask-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    .db-ask-chip { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 20px; padding: 6px 12px; font-size: 11px; cursor: pointer; color: #374151; }
    .db-ask-chip:hover { background: #e5e7eb; }
    .db-ask-input-row { display: flex; gap: 8px; }
    .db-ask-input { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 9px 14px; font-size: 12px; outline: none; }
    .db-ask-input:focus { border-color: #16a34a; }
    .db-ask-send { background: #16a34a; color: #fff; border: none; border-radius: 8px; width: 38px; height: 38px; cursor: pointer; font-size: 14px; }
  `;
  document.head.appendChild(style);
}

/* ── Main view function ── */
function viewAIInsights(user) {
  injectAIInsightsStyles();

  return `
  <div class="db-scrollable">

    <!-- Key Metrics -->
    <div class="db-stat-row">
      ${statCard('', '#f0fdf4', 'Overall AI Score', '87 / 100', 'Very Good', 'up', '8 pts vs last 7 days')}
      ${statCard('', '#fff7ed', 'Risk Alerts', '3', 'Active', 'down', '1 vs last 7 days')}
      ${statCard('', '#f0fdf4', 'Opportunities', '5', 'Identified', 'up', '2 vs last 7 days')}
      ${statCard('', '#eff6ff', 'Predicted Profit Impact', '+₹ 2.45L', 'This Month', 'up', '12.6% vs last month')}
    </div>

    <!-- Two-column: Insights + Prediction -->
    <div class="db-two-col">

      <!-- AI Key Insights -->
      <div class="db-card">
        <div class="db-card-header">
          <span class="db-card-title">AI Key Insights (Top 5)</span>
          <a href="#" class="db-card-link">View All Insights <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="db-insights-grid">
          ${insightItem('','#fff7ed','High Mortality Risk Detected','Batch SRF-B102 has 2.3x higher risk of mortality in the next 7 days due to high temperature and low water intake.',['alert','critical'],'Impact','₹ 85,000')}
          ${insightItem('','#eff6ff','Water Intake Below Optimal','5 batches are showing 12–18% lower water intake. This may impact growth performance.',['alert','medium'],'Impact','₹ 45,000')}
          ${insightItem('','#f0fdf4','Feed Efficiency Improvement Opportunity','Optimizing feed formulation for 3 batches can improve FCR by 0.08–0.12 points.',['opportunity','feed'],'Potential Gain','₹ 1.20L')}
          ${insightItem('','#fff7ed','Temperature Optimization Needed','Night temperature is 3–4°C above optimal in 4 houses. Adjust ventilation to reduce heat stress.',['alert','environment'],'Impact','₹ 35,000')}
          ${insightItem('','#f0fdf4','Excellent Performance Trend','Batch KRF-B098 is performing 12% better than average. Keep maintaining current management practices.',['positive','growth'],'Value','₹ 60,000')}
        </div>
      </div>

      <!-- AI Prediction Chart -->
      <div class="db-card">
        <div class="db-card-header">
          <span class="db-card-title">AI Prediction: Next 7 Days</span>
          <a href="#" class="db-card-link">View Details <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div style="padding:14px 16px;">
          <div style="display:flex;gap:16px;margin-bottom:10px;">
            <span style="display:flex;align-items:center;gap:5px;font-size:11px;color:#6b7280;"><span style="display:inline-block;width:16px;height:3px;background:#ef4444;border-radius:2px;"></span>Mortality (%)</span>
            <span style="display:flex;align-items:center;gap:5px;font-size:11px;color:#6b7280;"><span style="display:inline-block;width:16px;height:3px;background:#3b82f6;border-radius:2px;"></span>Avg. Weight (kg)</span>
            <span style="display:flex;align-items:center;gap:5px;font-size:11px;color:#6b7280;"><span style="display:inline-block;width:16px;height:3px;background:#22c55e;border-radius:2px;"></span>FCR</span>
          </div>
          <svg viewBox="0 0 460 130" style="width:100%;height:130px;">
            <line x1="0" y1="15" x2="460" y2="15" stroke="#f3f4f6" stroke-width="1"/>
            <line x1="0" y1="43" x2="460" y2="43" stroke="#f3f4f6" stroke-width="1"/>
            <line x1="0" y1="71" x2="460" y2="71" stroke="#f3f4f6" stroke-width="1"/>
            <line x1="0" y1="99" x2="460" y2="99" stroke="#f3f4f6" stroke-width="1"/>
            <text x="0" y="13" font-size="8" fill="#9ca3af">4%</text>
            <text x="0" y="41" font-size="8" fill="#9ca3af">3%</text>
            <text x="0" y="69" font-size="8" fill="#9ca3af">2%</text>
            <text x="0" y="97" font-size="8" fill="#9ca3af">1%</text>
            <polyline points="30,75 100,70 180,66 260,60 340,56 420,50" fill="none" stroke="#22c55e" stroke-width="2" stroke-dasharray="5,3"/>
            <polyline points="30,85 100,82 180,78 260,74 340,70 420,64" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="5,3"/>
            <polyline points="30,95 100,92 180,90 260,88 340,86 420,84" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="5,3"/>
            <text x="18" y="125" font-size="8" fill="#9ca3af">23 May</text>
            <text x="88" y="125" font-size="8" fill="#9ca3af">24 May</text>
            <text x="163" y="125" font-size="8" fill="#9ca3af">25 May</text>
            <text x="238" y="125" font-size="8" fill="#9ca3af">26 May</text>
            <text x="313" y="125" font-size="8" fill="#9ca3af">27 May</text>
            <text x="388" y="125" font-size="8" fill="#9ca3af">28 May</text>
          </svg>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid #f3f4f6;text-align:center;">
            <div><div style="font-size:10px;color:#6b7280;margin-bottom:4px;">Predicted Mortality (Avg.)</div><div style="font-size:18px;font-weight:800;">2.28%</div><div style="font-size:10px;font-weight:600;color:#ef4444;margin-top:2px;"><i class="fa-solid fa-arrow-trend-down"></i> 0.12% vs current</div></div>
            <div><div style="font-size:10px;color:#6b7280;margin-bottom:4px;">Predicted Avg. Weight</div><div style="font-size:18px;font-weight:800;">1.62 kg</div><div style="font-size:10px;font-weight:600;color:#16a34a;margin-top:2px;"><i class="fa-solid fa-arrow-trend-up"></i> 0.07 kg vs current</div></div>
            <div><div style="font-size:10px;color:#6b7280;margin-bottom:4px;">Predicted FCR</div><div style="font-size:18px;font-weight:800;">1.58</div><div style="font-size:10px;font-weight:600;color:#ef4444;margin-top:2px;"><i class="fa-solid fa-arrow-trend-down"></i> 0.05 vs current</div></div>
          </div>
        </div>
      </div>

    </div>

    <!-- Two-column: Recommendations + Anomalies -->
    <div class="db-two-col">

      <!-- Smart Recommendations -->
      <div class="db-card">
        <div class="db-card-header">
          <span class="db-card-title">Smart Recommendations</span>
          <a href="#" class="db-card-link">View All <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="db-reco-list">
          ${recoItem('1', '', 'Reduce temperature by 2–3°C in houses during afternoon', 'high')}
          ${recoItem('2', '', 'Increase water flow rate by 10–15% for optimal intake', 'high')}
          ${recoItem('3', '', 'Add Vitamin C in feed for 3 days to reduce heat stress', 'medium')}
          ${recoItem('4', '', 'Optimize lighting: Reduce by 1 hour in the evening', 'medium')}
          ${recoItem('5', '', 'Maintain current feed formulation for best FCR', 'low')}
        </div>
      </div>

      <!-- Anomalies -->
      <div class="db-card">
        <div class="db-card-header">
          <span class="db-card-title">Detected Anomalies</span>
          <a href="#" class="db-card-link">View All Anomalies <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <table class="db-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Batch</th>
              <th>Deviation</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${anomalyRow('Mortality Spike','SRF-B102','+2.1%','high')}
            ${anomalyRow('Low Water Intake','GVF-B104','-18%','medium')}
            ${anomalyRow('High Temperature','KRF-B098','+3.5°C','medium')}
            ${anomalyRow('Low Feed Intake','ANF-B097','-12%','low')}
            ${anomalyRow('Ammonia Level','SAF-B996','+8 ppm','low')}
          </tbody>
        </table>
      </div>

    </div>

    <!-- Model Performance -->
    <div class="db-card">
      <div class="db-card-header">
        <span class="db-card-title">AI Model Performance</span>
        <a href="#" class="db-card-link">View All Models <i class="fa-solid fa-arrow-right"></i></a>
      </div>
      <table class="db-table">
        <thead>
          <tr>
            <th>Model</th>
            <th>Accuracy</th>
            <th>Status</th>
            <th>Last Trained</th>
          </tr>
        </thead>
        <tbody>
          ${modelRow('','Mortality Prediction','92.4%','excellent','22 May 2024')}
          ${modelRow('','Growth Prediction','89.7%','excellent','22 May 2024')}
          ${modelRow('','Feed Efficiency Model','91.1%','excellent','22 May 2024')}
          ${modelRow('','Disease Risk Model','86.3%','good','21 May 2024')}
          ${modelRow('','Environment Impact Model','88.9%','good','21 May 2024')}
        </tbody>
      </table>
    </div>

    <!-- Ask AI Bar -->
    <div class="db-ask-bar">
      <div class="db-ask-header">
        <div class="db-ask-icon"><i class="fa-solid fa-robot"></i></div>
        <div>
          <span class="db-ask-title">Ask AI Assistant</span>
          <span class="db-ask-badge">BETA</span>
        </div>
        <span class="db-ask-desc">Get answers to your farm management questions</span>
      </div>
      <div class="db-ask-chips">
        <button class="db-ask-chip">Why is mortality high in batch SRF-B102?</button>
        <button class="db-ask-chip">How can I improve FCR in my farm?</button>
        <button class="db-ask-chip">What is the best feed for this stage?</button>
        <button class="db-ask-chip">Show me cost saving opportunities</button>
      </div>
      <div class="db-ask-input-row">
        <input class="db-ask-input" type="text" placeholder="Ask anything about your farm...">
        <button class="db-ask-send"><i class="fa-solid fa-paper-plane"></i></button>
      </div>
    </div>

  </div>`;
}
