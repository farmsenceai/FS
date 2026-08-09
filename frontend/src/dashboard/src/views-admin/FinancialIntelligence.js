/* Shared context foundation for the admin Financial Intelligence pages. */

window.metaAdminFinancialOverview = {
  title: 'Financial Overview',
  subtitle: 'Review canonical revenue, expense, and operational-profit data for one organization.'
};
window.metaAdminProfitForecast = {
  title: 'Profit Forecast Readiness',
  subtitle: 'Review forecast eligibility, history coverage, and factual forecast outputs.'
};
window.metaAdminBatchwiseRevenue = {
  title: 'Batchwise Revenue',
  subtitle: 'Reconcile sale events and batch revenue within an explicit tenant scope.'
};
window.metaAdminHistoricalReports = {
  title: 'Historical Reports',
  subtitle: 'Compare canonical financial and operational cohorts over time.'
};

(function () {
  const API_BASE = `${window.FARMSENCE_API_BASE_URL || window.location.origin}/api/v2`;
  const STORAGE_KEY = 'fs_admin_financial_context_v1';
  const DEMO_SLUG = 'financial-dashboard-demo';
  const PAGE_LABELS = {
    overview: 'Financial Overview',
    forecast: 'Profit Forecast Readiness',
    revenue: 'Batchwise Revenue',
    history: 'Historical Reports'
  };
  let state = readStoredState();
  let organizations = [];
  let farms = [];
  let activeRoot = null;
  let loadSequence = 0;

  function readStoredState() {
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { stored = {}; }
    return {
      organizationId: String(stored.organizationId || ''),
      farmId: String(stored.farmId || ''),
      days: [30, 90, 365, 730].includes(Number(stored.days)) ? Number(stored.days) : 365,
      granularity: ['day', 'week', 'month'].includes(stored.granularity) ? stored.granularity : 'month',
      organization: null,
      farm: null,
      generatedAt: null
    };
  }

  function request(path) {
    return fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('fs_token') || ''}` }
    }).then(async response => {
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(body.error?.message || body.error || body.message || `Request failed (${response.status})`);
        error.status = response.status;
        throw error;
      }
      return body;
    });
  }

  function escape(value) { return FarmSenseAdminApi.escapeHTML(value); }
  function idOf(value) { return String(value?.id || value?._id || ''); }
  function organizationName(value) { return value?.displayName || value?.legalName || 'Unnamed organization'; }
  function dateOnly(value) { return value.toISOString().slice(0, 10); }

  function range() {
    const to = new Date();
    to.setUTCHours(0, 0, 0, 0);
    to.setUTCDate(to.getUTCDate() + 1);
    const from = new Date(to);
    from.setUTCDate(from.getUTCDate() - state.days);
    return { from: dateOnly(from), to: dateOnly(to) };
  }

  function publicContext() {
    const dates = range();
    return {
      organizationId: state.organizationId,
      farmId: state.farmId || null,
      organization: state.organization,
      farm: state.farm,
      farms: farms.slice(),
      from: dates.from,
      to: dates.to,
      days: state.days,
      granularity: state.granularity,
      currency: 'INR',
      timezone: state.farm?.location?.timezone || state.organization?.timezone || 'Asia/Kolkata',
      generatedAt: state.generatedAt,
      isDemo: state.organization?.slug === DEMO_SLUG
    };
  }

  function query() {
    const context = publicContext();
    const inclusiveTo = new Date(`${context.to}T00:00:00.000Z`);
    inclusiveTo.setUTCDate(inclusiveTo.getUTCDate() - 1);
    const params = new URLSearchParams({
      businessId: context.organizationId,
      from: context.from,
      to: dateOnly(inclusiveTo),
      granularity: context.granularity
    });
    if (context.farmId) params.set('farmId', context.farmId);
    return params;
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      organizationId: state.organizationId,
      farmId: state.farmId,
      days: state.days,
      granularity: state.granularity
    }));
  }

  function publish(reason) {
    state.generatedAt = new Date().toISOString();
    persist();
    const detail = { reason, context: publicContext() };
    renderStatus();
    window.dispatchEvent(new CustomEvent('farmSense:admin-financial-context-change', { detail }));
  }

  function injectStyles() {
    if (document.getElementById('afi-styles')) return;
    const style = document.createElement('style');
    style.id = 'afi-styles';
    style.textContent = `
      .afi-page{padding:20px;background:#f5f6fa;min-height:100%;color:#1f2937;font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
      .afi-card{background:#fff;border:1px solid #e5e7eb;border-radius:11px;padding:16px;margin-bottom:16px}
      .afi-hidden{display:none!important}.afi-org-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.afi-org-head h3{margin:0;font-size:15px}.afi-org-head p{margin:4px 0 0;color:#6b7280;font-size:11px}.afi-org-search{box-sizing:border-box;width:min(420px,100%);border:1px solid #d1d5db;border-radius:7px;padding:9px 11px;background:#fff;color:#374151}.afi-org-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}.afi-org-card{appearance:none;min-height:138px;padding:14px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;text-align:left;color:#1f2937;cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s}.afi-org-card:hover{border-color:#86efac;box-shadow:0 6px 18px rgba(22,101,52,.09);transform:translateY(-1px)}.afi-org-card-head{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.afi-org-card h4{margin:0;font-size:14px}.afi-org-legal{color:#6b7280;font-size:10px;margin-top:4px}.afi-org-meta{display:grid;gap:7px;margin-top:15px;font-size:11px}.afi-org-meta div{display:flex;justify-content:space-between;gap:10px}.afi-org-meta span:first-child{color:#6b7280}.afi-org-meta span:last-child{text-align:right}.afi-org-badge{padding:3px 8px;border-radius:12px;background:#f3f4f6;color:#475569;font-size:9px;font-weight:800;text-transform:uppercase}.afi-org-badge.active{background:#dcfce7;color:#166534}.afi-org-badge.pending{background:#fef3c7;color:#92400e}.afi-detail-head{display:flex;align-items:center;gap:10px;margin-bottom:14px}.afi-back{border:1px solid #16a34a;border-radius:7px;padding:8px 11px;background:#fff;color:#166534;font-size:11px;font-weight:700;cursor:pointer}.afi-detail-title strong{display:block}.afi-detail-title span{color:#6b7280;font-size:10px}
      .afi-context{display:grid;grid-template-columns:minmax(210px,1.4fr) minmax(190px,1.2fr) minmax(130px,.7fr) minmax(130px,.7fr) auto;gap:12px;align-items:end}
      .afi-field label{display:block;color:#6b7280;font-size:11px;font-weight:700;margin-bottom:5px}.afi-select{box-sizing:border-box;width:100%;border:1px solid #d1d5db;border-radius:7px;padding:8px 10px;background:#fff;color:#374151;font-size:12px}
      .afi-btn{border:0;border-radius:7px;padding:9px 14px;background:#166534;color:#fff;font-size:11px;font-weight:700;cursor:pointer}.afi-btn:disabled{opacity:.5;cursor:not-allowed}
      .afi-status{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px;color:#6b7280;font-size:11px}.afi-chip{padding:4px 8px;border-radius:12px;background:#f3f4f6;color:#374151}.afi-demo{background:#fef3c7;color:#92400e;font-weight:700}
      .afi-message{padding:28px;text-align:center;color:#6b7280}.afi-message strong{display:block;color:#374151;font-size:14px;margin-bottom:6px}.afi-error{border-color:#fecaca;background:#fef2f2;color:#991b1b}
      .afi-br-toolbar{display:flex;justify-content:flex-end;gap:10px;margin-bottom:14px}.afi-br-toolbar input{max-width:280px}.afi-br-toolbar select{max-width:230px}
      .afi-br-completeness{padding:11px 13px;border:1px solid #bfdbfe;background:#eff6ff;border-radius:9px;display:flex;gap:14px;flex-wrap:wrap;color:#475569;font-size:11px;margin-bottom:14px}.afi-br-completeness strong{color:#1e3a8a}
      .afi-br-stats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-bottom:14px}.afi-br-stat,.afi-br-section{border:1px solid #e5e7eb;border-radius:9px;background:#fff}.afi-br-stat{padding:13px;display:flex;flex-direction:column;gap:4px}.afi-br-stat span,.afi-br-stat small,.afi-br-note,.afi-br-bar small{color:#6b7280;font-size:10px}.afi-br-stat strong{font-size:17px}
      .afi-br-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.afi-br-section{padding:15px;margin-bottom:14px}.afi-br-section h3{font-size:14px;margin:0 0 10px}.afi-br-bar{display:grid;grid-template-columns:150px 1fr 110px;align-items:center;gap:10px;margin:11px 0}.afi-br-bar div{display:flex;flex-direction:column}.afi-br-bar i{height:10px;background:#eef2f7;border-radius:7px;overflow:hidden}.afi-br-bar b{display:block;height:100%;background:#16a34a}.afi-br-bar span{text-align:right}
      .afi-br-table{overflow:auto}.afi-br-table table{width:100%;border-collapse:collapse}.afi-br-table th,.afi-br-table td{text-align:left;padding:9px;border-bottom:1px solid #edf0f3;white-space:nowrap;font-size:10px}.afi-br-table th{background:#f8fafc;color:#64748b;text-transform:uppercase;font-size:9px}.afi-br-table td small{display:block;color:#8490a3;margin-top:3px}.afi-br-link{border:1px solid #16a34a;background:#fff;color:#166534;border-radius:6px;padding:6px 8px;font-weight:700;cursor:pointer}.afi-br-flag{display:block;color:#6b7280}.afi-br-flag.danger,.afi-br-danger{color:#b91c1c;font-weight:700}
      .afi-flow-row{display:grid;grid-template-columns:1fr auto;gap:4px;padding:10px 0;border-bottom:1px solid #eef2f7}.afi-flow-row small{grid-column:1/-1;color:#6b7280}.afi-category-row{width:100%;display:flex;justify-content:space-between;align-items:center;text-align:left;border:0;border-bottom:1px solid #eef2f7;background:#fff;padding:10px 4px;cursor:pointer;color:#334155}.afi-category-row:hover,.afi-click-row:hover{background:#f0fdf4}.afi-category-row span,.afi-category-row strong{display:flex;flex-direction:column}.afi-category-row strong{text-align:right}.afi-category-row small{color:#6b7280;font-weight:400;margin-top:2px}.afi-click-row{cursor:pointer}.afi-negative-row td:nth-child(4){color:#b91c1c;font-weight:700}.afi-positive-row td:nth-child(4){color:#166534;font-weight:700}.afi-scope-note{border:1px solid #d1d5db;background:#f8fafc;border-radius:9px;padding:12px;color:#64748b;font-size:11px;line-height:1.5}.afi-scope-note strong{color:#334155}
      .afi-cohort-banner{border:1px solid #bfdbfe;background:#eff6ff;color:#1e3a8a;border-radius:9px;padding:12px;margin-bottom:14px;line-height:1.5}.afi-cohort-banner strong{display:block}.afi-cohort-banner code{background:#dbeafe;padding:1px 4px;border-radius:3px}.afi-metric-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}.afi-metric-tabs button{border:1px solid #d1d5db;background:#fff;color:#475569;border-radius:6px;padding:6px 8px;cursor:pointer}.afi-metric-tabs button.active{background:#166534;border-color:#166534;color:#fff}.afi-pager{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:12px;color:#64748b;font-size:11px}.afi-pager label,.afi-pager div{display:flex;align-items:center;gap:8px}.afi-pager select{width:auto}.afi-pager button{border:1px solid #d1d5db;background:#fff;border-radius:6px;padding:6px 9px;color:#475569}.afi-pager button:disabled{opacity:.45}
      .afi-forecast-toolbar{display:flex;justify-content:flex-end;margin-bottom:14px}.afi-forecast-toolbar label{display:flex;align-items:center;gap:8px;font-weight:700}.afi-forecast-toolbar select{width:auto}.afi-forecast-unavailable{text-align:center;border:1px solid #d1d5db;border-radius:10px;background:#fff;padding:28px;margin-bottom:14px}.afi-forecast-unavailable h2{margin:0 0 8px}.afi-forecast-unavailable>p{color:#64748b}.afi-reason-code{display:inline-block;background:#fee2e2;color:#991b1b;border-radius:12px;padding:4px 9px;font-size:10px;font-weight:800}.afi-forecast-checks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:14px 0;text-align:left}.afi-forecast-checks>div{display:flex;flex-direction:column;gap:4px;background:#f8fafc;border-radius:7px;padding:10px}.afi-forecast-checks span{color:#64748b;font-size:10px}.afi-sensitivity-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.afi-sensitivity-card{padding:14px;border:1px solid #d1d5db;border-radius:9px;background:#f8fafc;display:flex;flex-direction:column;gap:4px}.afi-sensitivity-card:nth-child(2){background:#f0fdf4;border-color:#86efac}.afi-sensitivity-card>strong{font-size:20px}.afi-sensitivity-card small,.afi-sensitivity-card p{color:#64748b;font-size:10px}.afi-sensitivity-card dl{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin:7px 0;font-size:11px}.afi-sensitivity-card dd{text-align:right;font-weight:700}.afi-fact-row{padding:10px 0;border-bottom:1px solid #eef2f7;line-height:1.45}
      @media(max-width:900px){.afi-forecast-checks,.afi-sensitivity-grid{grid-template-columns:1fr}}
      @media(max-width:1200px){.afi-br-stats{grid-template-columns:repeat(3,1fr)}}@media(max-width:800px){.afi-br-grid{grid-template-columns:1fr}.afi-br-stats{grid-template-columns:1fr 1fr}}
      @media(max-width:980px){.afi-context{grid-template-columns:1fr 1fr}}@media(max-width:600px){.afi-context{grid-template-columns:1fr}.afi-org-head{align-items:stretch;flex-direction:column}.afi-org-search{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function pageView(kind) {
    injectStyles();
    setTimeout(() => init(document.getElementById(`afi-${kind}`)), 0);
    const organizationList = `<section class="afi-card" id="afi-organization-list"><div class="afi-org-head"><div><h3>All Organisations</h3><p>Select an organisation to open its ${escape(PAGE_LABELS[kind].toLowerCase())} workspace.</p></div><input class="afi-org-search" id="afi-organization-search" type="search" placeholder="Search organisations…"></div><div class="afi-org-grid" id="afi-organization-grid"><div class="afi-message">Loading organisations…</div></div></section>`;
    return `<div class="afi-page" id="afi-${kind}" data-afi-page="${kind}">
      ${organizationList}<div id="afi-detail-screen" class="afi-hidden">
      <div class="afi-detail-head"><button class="afi-back" id="afi-back-organizations" type="button">← All Organisations</button><div class="afi-detail-title"><strong id="afi-detail-organization-name">${escape(PAGE_LABELS[kind])}</strong><span>${escape(PAGE_LABELS[kind])} workspace</span></div></div>
      <section class="afi-card">
        <div class="afi-context">
          <div class="afi-field afi-hidden"><label for="afi-organization">Organization (required)</label><select class="afi-select" id="afi-organization"><option value="">Loading organizations…</option></select></div>
          <div class="afi-field"><label for="afi-farm">Farm</label><select class="afi-select" id="afi-farm" disabled><option value="">Select an organization first</option></select></div>
          <div class="afi-field"><label for="afi-range">Date range</label><select class="afi-select" id="afi-range"><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 365 days</option><option value="730">Last 730 days</option></select></div>
          <div class="afi-field"><label for="afi-granularity">Granularity</label><select class="afi-select" id="afi-granularity"><option value="day">Day</option><option value="week">Week</option><option value="month">Month</option></select></div>
          <button class="afi-btn" id="afi-refresh" disabled>Refresh</button>
        </div>
        <div class="afi-status" id="afi-status">Choose an organization to establish an explicit tenant scope.</div>
      </section>
      <section class="afi-card afi-message" id="afi-content"><strong>${escape(PAGE_LABELS[kind])}</strong>Select an organization to begin. No financial values are shown without a tenant scope.</section>
      </div>
    </div>`;
  }

  async function init(root) {
    if (!root) return;
    activeRoot = root;
    root.querySelector('#afi-range').value = String(state.days);
    root.querySelector('#afi-granularity').value = state.granularity;
    bind(root);
    bindOrganizationList(root);
    if (root.dataset.afiPage === 'revenue') bindRevenuePage(root);
    if (root.dataset.afiPage === 'overview') bindOverviewPage(root);
    if (root.dataset.afiPage === 'history') bindHistoryPage(root);
    if (root.dataset.afiPage === 'forecast') bindForecastPage(root);
    await loadOrganizations(root);
  }

  function bind(root) {
    root.querySelector('#afi-organization').addEventListener('change', async event => {
      state.organizationId = event.target.value;
      state.organization = organizations.find(item => idOf(item) === state.organizationId) || null;
      state.farmId = '';
      state.farm = null;
      farms = [];
      renderStatus();
      if (state.organizationId) await loadFarms(root, true);
      else renderFarmOptions(root);
    });
    root.querySelector('#afi-farm').addEventListener('change', event => {
      state.farmId = event.target.value;
      state.farm = farms.find(item => idOf(item) === state.farmId) || null;
      publish('farm-change');
    });
    root.querySelector('#afi-range').addEventListener('change', event => {
      state.days = Number(event.target.value);
      publish('date-range-change');
    });
    root.querySelector('#afi-granularity').addEventListener('change', event => {
      state.granularity = event.target.value;
      publish('granularity-change');
    });
    root.querySelector('#afi-refresh').addEventListener('click', () => publish('refresh'));
  }

  function bindOrganizationList(root) {
    root.querySelector('#afi-organization-search').addEventListener('input', event => renderOrganizationCards(root, event.target.value));
    root.querySelector('#afi-back-organizations').addEventListener('click', () => {
      root.querySelector('#afi-detail-screen').classList.add('afi-hidden');
      root.querySelector('#afi-organization-list').classList.remove('afi-hidden');
    });
  }

  function renderOrganizationCards(root, search = '') {
    const grid = root.querySelector('#afi-organization-grid');
    if (!grid) return;
    const queryText = String(search).trim().toLowerCase();
    const visible = organizations.filter(item => [organizationName(item), item.legalName, item.status, item.contacts?.billingEmail, item.contacts?.phone]
      .some(value => String(value || '').toLowerCase().includes(queryText)));
    if (!visible.length) {
      grid.innerHTML = `<div class="afi-message">${organizations.length ? 'No organisations match your search.' : 'No organisations are available.'}</div>`;
      return;
    }
    grid.innerHTML = visible.map(item => {
      const status = item.status || 'unknown';
      const contact = item.contacts?.billingEmail || item.contacts?.email || 'Not provided';
      return `<button type="button" class="afi-org-card" data-afi-organization-id="${escape(idOf(item))}"><div class="afi-org-card-head"><div><h4>${escape(organizationName(item))}</h4><div class="afi-org-legal">${escape(item.legalName || 'Legal name not provided')}</div></div><span class="afi-org-badge ${escape(status)}">${escape(status)}</span></div><div class="afi-org-meta"><div><span>Billing contact</span><span>${escape(contact)}</span></div><div><span>Timezone</span><span>${escape(item.timezone || 'Asia/Kolkata')}</span></div></div></button>`;
    }).join('');
    grid.querySelectorAll('[data-afi-organization-id]').forEach(card => card.addEventListener('click', async () => {
      state.organizationId = card.dataset.afiOrganizationId;
      state.organization = organizations.find(item => idOf(item) === state.organizationId) || null;
      state.farmId = '';
      state.farm = null;
      farms = [];
      root.querySelector('#afi-organization').value = state.organizationId;
      root.querySelector('#afi-detail-organization-name').textContent = organizationName(state.organization);
      root.querySelector('#afi-organization-list').classList.add('afi-hidden');
      root.querySelector('#afi-detail-screen').classList.remove('afi-hidden');
      await loadFarms(root, true);
    }));
  }

  async function loadOrganizations(root) {
    const sequence = ++loadSequence;
    const select = root.querySelector('#afi-organization');
    try {
      const result = await request('/organizations?limit=100');
      if (sequence !== loadSequence || activeRoot !== root) return;
      organizations = result.data || [];
      if (!organizations.some(item => idOf(item) === state.organizationId)) {
        state.organizationId = '';
        state.farmId = '';
      }
      state.organization = organizations.find(item => idOf(item) === state.organizationId) || null;
      select.innerHTML = '<option value="">Select an organization…</option>' + organizations.map(item =>
        `<option value="${escape(idOf(item))}">${escape(organizationName(item))}</option>`
      ).join('');
      select.value = state.organizationId;
      renderOrganizationCards(root);
      renderFarmOptions(root);
    } catch (error) {
      select.innerHTML = '<option value="">Unable to load organizations</option>';
      const grid = root.querySelector('#afi-organization-grid');
      if (grid) grid.innerHTML = `<div class="afi-message afi-error">${escape(error.message)}</div>`;
      renderError(root, error);
    }
  }

  async function loadFarms(root, publishChange) {
    const sequence = ++loadSequence;
    const farmSelect = root.querySelector('#afi-farm');
    farmSelect.disabled = true;
    farmSelect.innerHTML = '<option value="">Loading farms…</option>';
    try {
      const result = await request(`/organizations/${encodeURIComponent(state.organizationId)}/dashboard`);
      if (sequence !== loadSequence || activeRoot !== root) return;
      farms = result.farms || [];
      state.organization = result.organization || state.organization;
      if (!farms.some(item => idOf(item) === state.farmId)) state.farmId = '';
      state.farm = farms.find(item => idOf(item) === state.farmId) || null;
      renderFarmOptions(root);
      publish(publishChange ? 'organization-change' : 'context-restored');
    } catch (error) {
      farmSelect.innerHTML = '<option value="">Unable to load farms</option>';
      renderError(root, error);
    }
  }

  function renderFarmOptions(root) {
    const select = root.querySelector('#afi-farm');
    const hasOrganization = Boolean(state.organizationId);
    select.disabled = !hasOrganization;
    select.innerHTML = hasOrganization
      ? '<option value="">All farms in this organization</option>' + farms.map(item => `<option value="${escape(idOf(item))}">${escape(item.code)} · ${escape(item.name)}</option>`).join('')
      : '<option value="">Select an organization first</option>';
    select.value = state.farmId;
    root.querySelector('#afi-refresh').disabled = !hasOrganization;
  }

  function renderStatus() {
    if (!activeRoot) return;
    const status = activeRoot.querySelector('#afi-status');
    const content = activeRoot.querySelector('#afi-content');
    const refresh = activeRoot.querySelector('#afi-refresh');
    refresh.disabled = !state.organizationId;
    if (!state.organizationId || !state.organization) {
      status.textContent = 'Choose an organization to establish an explicit tenant scope.';
      content.innerHTML = `<strong>${escape(PAGE_LABELS[activeRoot.dataset.afiPage])}</strong>Select an organization to begin. No financial values are shown without a tenant scope.`;
      return;
    }
    const context = publicContext();
    status.innerHTML = [
      `<span class="afi-chip">${escape(organizationName(state.organization))}</span>`,
      `<span class="afi-chip">${escape(state.farm ? `${state.farm.code} · ${state.farm.name}` : 'All farms')}</span>`,
      `<span class="afi-chip">${escape(context.currency)} · ${escape(context.timezone)}</span>`,
      `<span class="afi-chip">${escape(context.from)} ≤ date &lt; ${escape(context.to)}</span>`,
      context.isDemo ? '<span class="afi-chip afi-demo">Demo fixture</span>' : '',
      context.generatedAt ? `<span>Generated ${escape(FarmSenseAdminApi.formatDate(context.generatedAt, true))}</span>` : ''
    ].join('');
    content.innerHTML = `<strong>${escape(PAGE_LABELS[activeRoot.dataset.afiPage])}</strong>Tenant context is ready. Page-specific canonical aggregations are the next implementation step; no placeholder financial values are displayed.`;
  }

  function renderError(root, error) {
    const status = root.querySelector('#afi-status');
    const content = root.querySelector('#afi-content');
    const forbidden = error.status === 403;
    status.textContent = forbidden ? 'Access to this tenant scope is forbidden.' : 'The tenant context could not be loaded.';
    content.classList.add('afi-error');
    content.innerHTML = `<strong>${forbidden ? 'Forbidden' : 'Unable to load context'}</strong>${escape(error.message)} No cached or mock financial values were substituted.`;
  }

  let revenueRequest = 0;
  function bindRevenuePage(root) {
    const listener = event => {
      if (activeRoot !== root || root.dataset.afiPage !== 'revenue') return;
      if (!event.detail.context.organizationId) return;
      loadRevenue(root, event.detail.context);
    };
    window.addEventListener('farmSense:admin-financial-context-change', listener, { signal: pageAbortSignal(root) });
  }

  function pageAbortSignal(root) {
    const controller = new AbortController();
    const observer = new MutationObserver(() => {
      if (!document.body.contains(root)) {
        controller.abort();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return controller.signal;
  }

  async function loadRevenue(root, context) {
    const requestId = ++revenueRequest;
    const content = root.querySelector('#afi-content');
    content.classList.remove('afi-error');
    content.innerHTML = '<div class="afi-message">Loading canonical revenue and sale-event records…</div>';
    try {
      const aggregationParams = query();
      const inclusiveTo = aggregationParams.get('to');
      const salesParams = new URLSearchParams({ from: context.from, to: inclusiveTo, limit: 1000 });
      const farmsInScope = context.farm ? [context.farm] : context.farms;
      const [aggregation, salePages] = await Promise.all([
        request(`/financial/batchwise-revenue?${aggregationParams}`),
        Promise.all(farmsInScope.map(farm => request(`/farms/${encodeURIComponent(idOf(farm))}/batch-sales?${salesParams}`)))
      ]);
      if (requestId !== revenueRequest || activeRoot !== root) return;
      const sales = salePages.flatMap(result => result.data || []);
      content.classList.remove('afi-message');
      content.innerHTML = revenueHtml(aggregation, sales, farmsInScope);
      bindRevenueControls(root, aggregation, sales, farmsInScope);
    } catch (error) {
      if (requestId !== revenueRequest || activeRoot !== root) return;
      renderError(root, error);
    }
  }

  function number(value, digits = 0) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return 'Not available';
    return Number(value).toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }
  function money(value) { return value === null || value === undefined ? 'Not available' : `₹ ${number(value, 2)}`; }
  function percent(value) { return value === null || value === undefined ? 'Not available' : `${number(value, 2)}%`; }
  function date(value, withTime = false) { return FarmSenseAdminApi.formatDate(value, withTime); }
  function decimal(value) {
    if (value && typeof value === 'object' && Object.hasOwn(value, '$numberDecimal')) return Number(value.$numberDecimal);
    return Number(value);
  }
  function saleState(value) {
    return ({ partially_sold: 'Partially sold', sold_profitable: 'Fully sold · positive direct profit', sold_loss: 'Fully sold · direct loss', no_sales: 'No sales' })[value] || FarmSenseAdminApi.label(value);
  }
  function stat(label, value, note = '') {
    return `<div class="afi-br-stat"><span>${escape(label)}</span><strong>${value}</strong>${note ? `<small>${note}</small>` : ''}</div>`;
  }

  function revenueHtml(data, sales, farmsInScope) {
    const stats = data.stats || {};
    const completeness = data.completeness || {};
    const batchMap = new Map((data.batches || []).map(row => [String(row.batchId), row]));
    const farmMap = new Map(farmsInScope.map(farm => [idOf(farm), farm]));
    const buyers = buyerGroups(sales);
    return `
      <div class="afi-br-toolbar">
        <input class="afi-select" id="afi-br-buyer" type="search" placeholder="Filter buyer, batch, or notes">
        <select class="afi-select" id="afi-br-state"><option value="">All sale states</option><option value="partially_sold">Partially sold</option><option value="sold_profitable">Fully sold · positive direct profit</option><option value="sold_loss">Fully sold · direct loss</option></select>
      </div>
      <div class="afi-br-completeness"><strong>Completeness</strong>
        <span>${number(completeness.saleEventCount)} sale events across ${number(completeness.batchesWithSales)} of ${number(completeness.batchCountInScope)} batches.</span>
        <span>${number(completeness.batchesWithFlockRecords)} batches have operational records; ${number(completeness.batchesWithoutDirectExpenses)} lack direct expenses.</span>
        <span>Shared farm expenses are excluded from batch direct profit.</span>
      </div>
      <div class="afi-br-stats">
        ${stat('Recorded Revenue', money(stats.totalRevenue), `${number(completeness.saleEventCount)} events`)}
        ${stat('Average / Selling Batch', money(stats.averageRevenuePerBatch))}
        ${stat('Batches With Sales', number(stats.batchesWithSales), `${number(completeness.batchCountInScope)} in scope`)}
        ${stat('Highest Revenue Batch', escape(stats.highestRevenueBatch?.batchCode || 'Not available'), stats.highestRevenueBatch ? money(stats.highestRevenueBatch.revenue) : '')}
        ${stat('Lowest Revenue Batch', escape(stats.lowestRevenueBatch?.batchCode || 'Not available'), stats.lowestRevenueBatch ? money(stats.lowestRevenueBatch.revenue) : '')}
        ${stat('Vs Equal Prior Period', percent(stats.revenueChangePercent))}
      </div>
      <div class="afi-br-grid">
        <section class="afi-br-section"><h3>Revenue by Farm</h3>${groupBars(data.revenueByFarm || [], 'farmName')}</section>
        <section class="afi-br-section"><h3>Revenue by Buyer</h3>${groupBars(buyers, 'buyerName')}</section>
      </div>
      <section class="afi-br-section"><h3>Sale-event Ledger</h3>
        <p class="afi-br-note">Each row is a canonical partial-sale event. Event numbers are chronological within the selected period, not permanent identifiers.</p>
        <div class="afi-br-table"><table><thead><tr><th>Date</th><th>Farm / Batch</th><th>Event</th><th>Birds</th><th>Avg Weight</th><th>Price/kg</th><th>Revenue</th><th>Buyer / Notes</th><th>Created by</th><th>Audit</th><th>Source</th></tr></thead><tbody id="afi-br-sales">${saleRows(sales, batchMap, farmMap)}</tbody></table></div>
      </section>
      <section class="afi-br-section"><h3>Batch Sale Reconciliation</h3>
        <p class="afi-br-note">Sellable ceiling = initial birds − recorded mortality − recorded culls. A negative remainder is surfaced as an inconsistency.</p>
        <div class="afi-br-table"><table><thead><tr><th>Farm / Batch</th><th>Status</th><th>Initial</th><th>Mortality</th><th>Culls</th><th>Sellable Ceiling</th><th>Sold</th><th>Remaining</th><th>Events / Dates</th><th>Avg Weight</th><th>Avg Price/kg</th><th>Revenue/Bird</th><th>Revenue</th><th>Direct Expenses</th><th>Direct Profit</th><th>Flags</th></tr></thead><tbody id="afi-br-batches">${batchRows(data.batches || [])}</tbody></table></div>
      </section>`;
  }

  function buyerGroups(sales) {
    const groups = new Map();
    for (const sale of sales) {
      const buyerName = String(sale.buyerName || '').trim() || 'Unspecified';
      const current = groups.get(buyerName) || { buyerName, revenue: 0, eventCount: 0 };
      current.revenue += decimal(sale.revenue) || 0;
      current.eventCount += 1;
      groups.set(buyerName, current);
    }
    return [...groups.values()].sort((a, b) => b.revenue - a.revenue);
  }

  function groupBars(rows, nameField) {
    if (!rows.length) return '<div class="afi-message">No recorded revenue in this scope.</div>';
    const max = Math.max(...rows.map(row => Number(row.revenue) || 0), 1);
    return rows.map(row => `<div class="afi-br-bar"><div><strong>${escape(row[nameField] || 'Unspecified')}</strong><small>${number(row.eventCount ?? row.batchCount)} ${row.eventCount === undefined ? 'batches' : 'events'}</small></div><i><b style="width:${(Number(row.revenue) || 0) / max * 100}%"></b></i><span>${money(row.revenue)}</span></div>`).join('');
  }

  function saleRows(sales, batchMap, farmMap) {
    if (!sales.length) return '<tr><td colspan="11" class="afi-message">No sale events were recorded in this period.</td></tr>';
    const counters = new Map();
    const ordered = [...sales].sort((a, b) => new Date(a.saleDate) - new Date(b.saleDate) || new Date(a.createdAt) - new Date(b.createdAt));
    const numbered = new Map();
    for (const sale of ordered) {
      const key = String(sale.batchId);
      counters.set(key, (counters.get(key) || 0) + 1);
      numbered.set(String(sale._id), counters.get(key));
    }
    return [...sales].sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate)).map(sale => {
      const batch = batchMap.get(String(sale.batchId)) || {};
      const farm = farmMap.get(String(sale.farmId)) || {};
      const search = `${sale.buyerName || ''} ${sale.notes || ''} ${batch.batchCode || sale.batchId}`.toLowerCase();
      return `<tr data-afi-sale data-search="${escape(search)}" data-state="${escape(batch.saleState || '')}">
        <td>${date(sale.saleDate)}</td><td><strong>${escape(farm.name || batch.farmName || 'Farm unavailable')}</strong><small>${escape(batch.batchCode || String(sale.batchId))}</small></td>
        <td>#${number(numbered.get(String(sale._id)))}</td><td>${number(sale.quantitySold)}</td><td>${number(decimal(sale.avgWeightKg), 3)} kg</td><td>${money(decimal(sale.pricePerKg))}</td><td><strong>${money(decimal(sale.revenue))}</strong></td>
        <td>${escape(sale.buyerName || 'Unspecified')}<small>${escape(sale.notes || 'No notes')}</small></td><td>${escape(String(sale.createdBy || 'Unavailable'))}</td>
        <td>${date(sale.createdAt, true)}<small>Updated ${date(sale.updatedAt, true)}</small></td>
        <td><button class="afi-br-link" data-afi-manage-farm="${escape(idOf(farm) || String(sale.farmId))}" data-sale-id="${escape(String(sale._id))}" data-batch-id="${escape(String(sale.batchId))}">Manage sale</button></td>
      </tr>`;
    }).join('');
  }

  function batchRows(rows) {
    if (!rows.length) return '<tr><td colspan="16" class="afi-message">No batches have recorded sales in this period.</td></tr>';
    return rows.map(row => {
      const mortality = Number(row.operations?.mortalityCount) || 0;
      const culls = Number(row.operations?.cullCount) || 0;
      const ceiling = Math.max(0, Number(row.initialBirdCount) - mortality - culls);
      const remaining = ceiling - Number(row.quantitySold || 0);
      const flags = [];
      if (remaining < 0) flags.push('Quantity inconsistency');
      if (!row.operations?.recordCount) flags.push('Missing operational records');
      if (!Number(row.directExpenseTotal)) flags.push('Missing direct expenses');
      if (!flags.length) flags.push(saleState(row.saleState));
      return `<tr data-afi-batch data-state="${escape(row.saleState || '')}">
        <td><strong>${escape(row.farmName || 'Farm unavailable')}</strong><small>${escape(row.batchCode || String(row.batchId))}</small></td><td>${escape(FarmSenseAdminApi.label(row.batchStatus))}</td>
        <td>${number(row.initialBirdCount)}</td><td>${number(mortality)}</td><td>${number(culls)}</td><td>${number(ceiling)}</td><td>${number(row.quantitySold)}</td><td class="${remaining < 0 ? 'afi-br-danger' : ''}">${number(remaining)}</td>
        <td>${number(row.saleEventCount)}<small>${date(row.firstSaleDate)} – ${date(row.lastSaleDate)}</small></td><td>${number(row.weightedAvgSaleWeightKg, 3)} kg</td><td>${money(row.weightedAvgPricePerKg)}</td><td>${money(row.revenuePerBird)}</td>
        <td>${money(row.revenue)}</td><td>${money(row.directExpenseTotal)}</td><td>${money(row.directProfit)}</td><td>${flags.map(flag => `<span class="afi-br-flag ${flag === 'Quantity inconsistency' ? 'danger' : ''}">${escape(flag)}</span>`).join('')}</td>
      </tr>`;
    }).join('');
  }

  function bindRevenueControls(root) {
    const apply = () => {
      const term = root.querySelector('#afi-br-buyer').value.trim().toLowerCase();
      const stateFilter = root.querySelector('#afi-br-state').value;
      root.querySelectorAll('[data-afi-sale]').forEach(row => { row.hidden = Boolean((term && !row.dataset.search.includes(term)) || (stateFilter && row.dataset.state !== stateFilter)); });
      root.querySelectorAll('[data-afi-batch]').forEach(row => { row.hidden = Boolean(stateFilter && row.dataset.state !== stateFilter); });
    };
    root.querySelector('#afi-br-buyer')?.addEventListener('input', apply);
    root.querySelector('#afi-br-state')?.addEventListener('change', apply);
    root.querySelectorAll('[data-afi-manage-farm]').forEach(button => button.addEventListener('click', () => {
      const params = new URLSearchParams(location.search);
      params.set('farmId', button.dataset.afiManageFarm);
      params.set('tab', 'sales');
      params.set('saleId', button.dataset.saleId);
      params.set('batchId', button.dataset.batchId);
      params.delete('expenseId');
      history.replaceState({}, document.title, `${location.pathname}?${params}`);
      FarmSenseAdminApi.navigate('FarmOperations');
    }));
  }

  let overviewRequest = 0;
  function bindOverviewPage(root) {
    const listener = event => {
      if (activeRoot !== root || root.dataset.afiPage !== 'overview') return;
      if (!event.detail.context.organizationId) return;
      loadOverview(root, event.detail.context);
    };
    window.addEventListener('farmSense:admin-financial-context-change', listener, { signal: pageAbortSignal(root) });
  }

  async function loadOverview(root, context) {
    const requestId = ++overviewRequest;
    const content = root.querySelector('#afi-content');
    content.classList.remove('afi-error');
    content.innerHTML = '<div class="afi-message">Loading canonical financial totals and source records…</div>';
    try {
      const params = query();
      const ledgerParams = new URLSearchParams({ from: context.from, to: params.get('to'), limit: 1000 });
      const farmsInScope = context.farm ? [context.farm] : context.farms;
      const [overview, batches, salePages, expensePages] = await Promise.all([
        request(`/financial/overview?${params}`),
        request(`/financial/batches?${new URLSearchParams([...params, ['limit', '1000']])}`),
        Promise.all(farmsInScope.map(farm => request(`/farms/${encodeURIComponent(idOf(farm))}/batch-sales?${ledgerParams}`))),
        Promise.all(farmsInScope.map(farm => request(`/farms/${encodeURIComponent(idOf(farm))}/batch-expenses?${ledgerParams}`)))
      ]);
      if (requestId !== overviewRequest || activeRoot !== root) return;
      const sales = salePages.flatMap(result => result.data || []);
      const expenses = expensePages.flatMap(result => result.data || []);
      content.classList.remove('afi-message');
      content.innerHTML = overviewHtml(overview, batches.data || [], sales, expenses, farmsInScope);
      bindOverviewControls(root, sales, expenses, farmsInScope, context.granularity);
    } catch (error) {
      if (requestId !== overviewRequest || activeRoot !== root) return;
      renderError(root, error);
    }
  }

  function change(value) {
    if (value === null || value === undefined) return 'Prior-period comparison unavailable';
    return `${number(Math.abs(value), 2)}% ${Number(value) >= 0 ? 'up' : 'down'} vs equal prior period`;
  }

  function overviewHtml(data, batches, sales, expenses, farmsInScope) {
    const totals = data.totals || {};
    const changes = data.changes || {};
    const completeness = data.completeness || {};
    const directExpenses = expenses.filter(item => item.batchId);
    const sharedExpenses = expenses.filter(item => !item.batchId);
    const directAmount = directExpenses.reduce((sum, item) => sum + (decimal(item.amount) || 0), 0);
    const sharedAmount = sharedExpenses.reduce((sum, item) => sum + (decimal(item.amount) || 0), 0);
    const farmsWithShared = new Set(sharedExpenses.map(item => String(item.farmId))).size;
    const sharedPercent = Number(totals.totalExpenses) ? sharedAmount / Number(totals.totalExpenses) * 100 : null;
    return `
      <div class="afi-br-completeness"><strong>Data completeness</strong>
        <span>${number(completeness.batchCountInScope)} batches · ${number(completeness.saleEventCount)} sales · ${number(completeness.expenseEntryCount)} expenses.</span>
        <span>${number(completeness.batchesWithSalesAndDirectExpenses)} have both sales and direct expenses.</span>
        <span>${number(completeness.batchesWithoutSales)} lack sales; ${number(completeness.batchesWithoutDirectExpenses)} lack direct expenses.</span>
        <span>${number(completeness.sharedExpenseEntryCount)} shared entries are not allocated to batches.</span>
      </div>
      <div class="afi-br-stats">
        ${stat('Recorded Revenue', money(totals.revenue), change(changes.revenue))}
        ${stat('Recorded Expenses', money(totals.totalExpenses), change(changes.totalExpenses))}
        ${stat('Gross Profit', money(totals.grossProfit), 'Revenue − feed, chicks, and medicine/vaccines')}
        ${stat('Operational Profit', money(totals.operationalProfit), change(changes.operationalProfit))}
        ${stat('Operational Margin', percent(totals.profitMarginPercent), 'Operational profit ÷ recorded revenue')}
        ${stat('Cost / Bird Sold', money(data.costPerBirdSold), 'All recorded expenses ÷ birds sold')}
      </div>
      <div class="afi-br-grid">
        <section class="afi-br-section"><h3>Financial Trend</h3><p class="afi-br-note">Transaction-date buckets. Select a row to inspect contributing source entries; negative profit remains negative.</p>${overviewTrend(data.trend || [], sales, expenses)}</section>
        <section class="afi-br-section"><h3>Expenses by Category</h3><p class="afi-br-note">Select a category to inspect its source entries.</p>${overviewCategories(data.expenseBreakdown || [])}</section>
      </div>
      <div class="afi-br-grid">
        <section class="afi-br-section"><h3>Direct versus Shared Costs</h3>
          <div class="afi-flow-row"><span>Batch-linked direct expenses</span><strong>${money(directAmount)}</strong><small>${number(directExpenses.length)} entries</small></div>
          <div class="afi-flow-row"><span>Unallocated shared farm expenses</span><strong>${money(sharedAmount)}</strong><small>${number(sharedExpenses.length)} entries across ${number(farmsWithShared)} farms</small></div>
          <div class="afi-flow-row"><span>Shared percentage of recorded expenses</span><strong>${percent(sharedPercent)}</strong><small>No allocation to batches is performed</small></div>
        </section>
        <section class="afi-br-section"><h3>Recorded Flow and Revenue Source</h3>
          <div class="afi-flow-row"><span>Recorded sale inflows</span><strong>${money(data.recordedInflowsOutflows?.inflows)}</strong></div>
          <div class="afi-flow-row"><span>Recorded expense outflows</span><strong>${money(data.recordedInflowsOutflows?.outflows)}</strong></div>
          <div class="afi-flow-row"><span>Net recorded flow</span><strong>${money(data.recordedInflowsOutflows?.netRecordedFlow)}</strong></div>
          <p class="afi-br-note">This is not a cash-flow statement. Live bird sales are the only canonical revenue source (${number(data.revenueBreakdown?.[0]?.eventCount)} events); no artificial source split is shown.</p>
        </section>
      </div>
      <section class="afi-br-section" id="afi-overview-drilldown"><h3>Bucket / Category Source Entries</h3><div class="afi-message">Select a trend bucket or expense category above.</div></section>
      <section class="afi-br-section"><h3>Batch Reconciliation</h3>
        <p class="afi-br-note">Direct profit excludes shared expenses. Aggregated values are read-only; corrections open the canonical Farm Operations ledgers.</p>
        <div class="afi-br-table"><table><thead><tr><th>Farm / Batch</th><th>Status</th><th>Birds Sold</th><th>Sale Events</th><th>Revenue</th><th>Direct Expenses</th><th>Gross Profit</th><th>Direct Profit</th><th>Direct Margin</th><th>Sale State</th><th>Completeness</th><th>Actions</th></tr></thead><tbody>${overviewBatchRows(batches)}</tbody></table></div>
      </section>
      <section class="afi-scope-note"><strong>Outside this module’s data scope:</strong> current ratio, debt-to-equity, working capital, break-even point, opening/closing balances, savings opportunities, and statutory net profit. No balance-sheet or cash-balance data is inferred from sales and expenses.</section>`;
  }

  function overviewTrend(rows, sales, expenses) {
    if (!rows.length) return '<div class="afi-message">No sales or expenses were recorded in this period.</div>';
    return `<div class="afi-br-table"><table><thead><tr><th>Period</th><th>Revenue</th><th>Expenses</th><th>Operational Profit</th><th>Events</th></tr></thead><tbody>${rows.map(row => {
      const saleCount = sales.filter(item => bucketKey(item.saleDate, state.granularity) === row.period).length;
      const expenseCount = expenses.filter(item => bucketKey(item.expenseDate, state.granularity) === row.period).length;
      return `<tr class="afi-click-row ${Number(row.operationalProfit) < 0 ? 'afi-negative-row' : 'afi-positive-row'}" data-afi-period="${escape(row.period)}"><td>${escape(row.period)}</td><td>${money(row.revenue)}</td><td>${money(row.expenses)}</td><td>${money(row.operationalProfit)}</td><td>${number(saleCount)} sales · ${number(expenseCount)} expenses</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }

  function overviewCategories(rows) {
    if (!rows.length) return '<div class="afi-message">No expenses were recorded in this period.</div>';
    const required = ['feed', 'chicks', 'labor', 'medicine_vaccines', 'utilities', 'transport', 'other'];
    const byCategory = new Map(rows.map(row => [row.category, row]));
    return required.map(category => {
      const row = byCategory.get(category) || { amount: 0, entryCount: 0, percent: null };
      return `<button class="afi-category-row" data-afi-category="${category}"><span>${escape(FarmSenseAdminApi.label(category))}<small>${number(row.entryCount)} entries</small></span><strong>${money(row.amount)}<small>${percent(row.percent)}</small></strong></button>`;
    }).join('');
  }

  function overviewBatchRows(rows) {
    if (!rows.length) return '<tr><td colspan="12" class="afi-message">No batches have period sales or direct expenses.</td></tr>';
    return rows.map(row => {
      const flags = [];
      if (!row.saleEventCount) flags.push('No sales');
      if (!Number(row.directExpenseTotal)) flags.push('Missing direct expenses');
      if (!row.operations?.recordCount) flags.push('Missing operational records');
      if (!flags.length) flags.push('Source records present');
      return `<tr><td><strong>${escape(row.farmName || 'Farm unavailable')}</strong><small>${escape(row.batchCode || String(row.batchId))}</small></td>
        <td>${escape(FarmSenseAdminApi.label(row.batchStatus))}</td><td>${number(row.quantitySold)}</td><td>${number(row.saleEventCount)}</td><td>${money(row.revenue)}</td><td>${money(row.directExpenseTotal)}</td><td>${money(row.grossProfit)}</td><td>${money(row.directProfit)}</td><td>${percent(row.directProfitMarginPercent)}</td><td>${escape(saleState(row.saleState))}</td>
        <td>${flags.map(flag => `<span class="afi-br-flag">${escape(flag)}</span>`).join('')}</td>
        <td><button class="afi-br-link" data-afi-source="${escape(String(row.farmId))}" data-tab="sales">Sales</button> <button class="afi-br-link" data-afi-source="${escape(String(row.farmId))}" data-tab="expenses">Expenses</button></td></tr>`;
    }).join('');
  }

  function bucketKey(value, granularity) {
    const item = new Date(value);
    if (granularity === 'month') return `${item.getUTCFullYear()}-${String(item.getUTCMonth() + 1).padStart(2, '0')}`;
    if (granularity === 'week') {
      const monday = new Date(Date.UTC(item.getUTCFullYear(), item.getUTCMonth(), item.getUTCDate()));
      const day = monday.getUTCDay() || 7;
      monday.setUTCDate(monday.getUTCDate() - day + 1);
      return dateOnly(monday);
    }
    return dateOnly(item);
  }

  function bindOverviewControls(root, sales, expenses, farmsInScope, granularity) {
    const farmMap = new Map(farmsInScope.map(farm => [idOf(farm), farm]));
    root.querySelectorAll('[data-afi-period]').forEach(row => row.addEventListener('click', () => {
      const period = row.dataset.afiPeriod;
      renderSourceEntries(root, sales.filter(item => bucketKey(item.saleDate, granularity) === period), expenses.filter(item => bucketKey(item.expenseDate, granularity) === period), farmMap, `Period ${period}`);
    }));
    root.querySelectorAll('[data-afi-category]').forEach(button => button.addEventListener('click', () => {
      renderSourceEntries(root, [], expenses.filter(item => item.category === button.dataset.afiCategory), farmMap, FarmSenseAdminApi.label(button.dataset.afiCategory));
    }));
    root.querySelectorAll('[data-afi-source]').forEach(button => button.addEventListener('click', () => navigateSource(button.dataset.afiSource, button.dataset.tab)));
  }

  function renderSourceEntries(root, sales, expenses, farmMap, title) {
    const target = root.querySelector('#afi-overview-drilldown');
    const rows = [
      ...sales.map(item => ({ type: 'Sale', id: String(item._id), batchId: String(item.batchId), date: item.saleDate, farmId: String(item.farmId), category: item.buyerName || 'Unspecified buyer', amount: decimal(item.revenue), description: `${number(item.quantitySold)} birds · batch ${String(item.batchId)}`, tab: 'sales' })),
      ...expenses.map(item => ({ type: item.batchId ? 'Direct expense' : 'Shared expense', id: String(item._id), batchId: item.batchId ? String(item.batchId) : '', date: item.expenseDate, farmId: String(item.farmId), category: FarmSenseAdminApi.label(item.category), amount: decimal(item.amount), description: item.description, tab: 'expenses' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    target.innerHTML = `<h3>${escape(title)} Source Entries</h3>${rows.length ? `<div class="afi-br-table"><table><thead><tr><th>Date</th><th>Type</th><th>Farm</th><th>Category / Buyer</th><th>Description</th><th>Amount</th><th>Source</th></tr></thead><tbody>${rows.map(item => `<tr><td>${date(item.date)}</td><td>${escape(item.type)}</td><td>${escape(farmMap.get(item.farmId)?.name || 'Farm unavailable')}</td><td>${escape(item.category)}</td><td>${escape(item.description)}</td><td>${money(item.amount)}</td><td><button class="afi-br-link" data-afi-drill-farm="${escape(item.farmId)}" data-tab="${item.tab}" data-source-id="${escape(item.id)}" data-batch-id="${escape(item.batchId)}">Open record</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="afi-message">No source entries contribute to this selection.</div>'}`;
    target.querySelectorAll('[data-afi-drill-farm]').forEach(button => button.addEventListener('click', () => navigateSource(button.dataset.afiDrillFarm, button.dataset.tab, { sourceId: button.dataset.sourceId, batchId: button.dataset.batchId })));
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function navigateSource(farmId, tab, { sourceId = '', batchId = '' } = {}) {
    const params = new URLSearchParams(location.search);
    params.set('farmId', farmId);
    params.set('tab', tab);
    if (batchId) params.set('batchId', batchId); else params.delete('batchId');
    params.delete('saleId');
    params.delete('expenseId');
    if (sourceId) params.set(tab === 'sales' ? 'saleId' : 'expenseId', sourceId);
    history.replaceState({}, document.title, `${location.pathname}?${params}`);
    FarmSenseAdminApi.navigate('FarmOperations');
  }

  let historyRequest = 0;
  let historyState = { page: 1, pageSize: 25, metric: 'estimatedFcr', current: null, previous: null };
  function bindHistoryPage(root) {
    const listener = event => {
      if (activeRoot !== root || root.dataset.afiPage !== 'history') return;
      if (!event.detail.context.organizationId) return;
      loadHistory(root);
    };
    window.addEventListener('farmSense:admin-financial-context-change', listener, { signal: pageAbortSignal(root) });
  }

  function previousHistoryQuery(current) {
    const from = new Date(`${current.get('from')}T00:00:00.000Z`);
    const inclusiveTo = new Date(from);
    inclusiveTo.setUTCDate(inclusiveTo.getUTCDate() - 1);
    const days = state.days;
    const previousFrom = new Date(from);
    previousFrom.setUTCDate(previousFrom.getUTCDate() - days);
    const params = new URLSearchParams(current);
    params.set('from', dateOnly(previousFrom));
    params.set('to', dateOnly(inclusiveTo));
    return params;
  }

  async function loadHistory(root) {
    const requestId = ++historyRequest;
    const content = root.querySelector('#afi-content');
    content.classList.remove('afi-error');
    content.innerHTML = '<div class="afi-message">Loading completed cohorts and historical transactions…</div>';
    try {
      const currentQuery = query();
      const [current, previous] = await Promise.all([
        request(`/financial/historical-reports?${currentQuery}`),
        request(`/financial/historical-reports?${previousHistoryQuery(currentQuery)}`)
      ]);
      if (requestId !== historyRequest || activeRoot !== root) return;
      historyState = { ...historyState, page: 1, current, previous };
      content.classList.remove('afi-message');
      renderHistory(root);
    } catch (error) {
      if (requestId !== historyRequest || activeRoot !== root) return;
      renderError(root, error);
    }
  }

  const HISTORY_METRICS = {
    estimatedFcr: { label: 'Estimated FCR', digits: 3 },
    mortalityPercent: { label: 'Weighted Mortality', digits: 2, suffix: '%' },
    livabilityPercent: { label: 'Weighted Livability', digits: 2, suffix: '%' },
    weightedAverageBodyWeightKg: { label: 'Weighted Body Weight', digits: 3, suffix: ' kg' },
    totalFeedConsumedKg: { label: 'Recorded Feed', digits: 0, suffix: ' kg' },
    completedBatchCount: { label: 'Completed Batches', digits: 0 }
  };

  function comparison(current, previous, formatter, lowerIsBetter = false) {
    if (current === null || current === undefined || previous === null || previous === undefined) return 'Equal previous period unavailable';
    const delta = Number(current) - Number(previous);
    const direction = delta === 0 ? 'unchanged' : delta > 0 ? 'higher' : 'lower';
    const favorable = delta === 0 ? 'flat' : (lowerIsBetter ? delta < 0 : delta > 0) ? 'favorable' : 'unfavorable';
    return `${formatter(Math.abs(delta))} ${direction} · ${favorable}`;
  }

  function renderHistory(root) {
    const data = historyState.current;
    const previous = historyState.previous;
    const cohort = data.cohort || {};
    const prior = previous.cohort || {};
    const completeness = data.completeness || {};
    const content = root.querySelector('#afi-content');
    content.innerHTML = `
      <section class="afi-cohort-banner"><strong>Completed cohort definition</strong>Includes completed batches whose <code>actualHarvestAt</code> falls inside the selected period. Completed batches without an actual harvest date are excluded.</section>
      <div class="afi-br-completeness"><strong>Completeness</strong>
        <span>${number(completeness.completedCohortCount)} completed batches included.</span>
        <span>${number(completeness.completedBatchesMissingActualHarvestAt)} completed batches excluded because harvest date is missing.</span>
        <span>${number(completeness.cohortBatchesEligibleForEstimatedFcr)} batches are eligible for estimated FCR.</span>
        <span>${number(completeness.saleEventCount)} period sales · ${number(completeness.expenseEntryCount)} period expenses inform the separate transaction trend.</span>
      </div>
      <div class="afi-br-stats">
        ${stat('Completed Batches', number(cohort.completedBatchCount), comparison(cohort.completedBatchCount, prior.completedBatchCount, value => number(value)))}
        ${stat('Birds Placed', number(cohort.birdsPlaced), comparison(cohort.birdsPlaced, prior.birdsPlaced, value => number(value)))}
        ${stat('Mortality', `${number(cohort.mortalityCount)} · ${percent(cohort.mortalityPercent)}`, comparison(cohort.mortalityPercent, prior.mortalityPercent, percent, true))}
        ${stat('Weighted Livability', percent(cohort.livabilityPercent), comparison(cohort.livabilityPercent, prior.livabilityPercent, percent))}
        ${stat('Weighted Body Weight', cohort.weightedAverageBodyWeightKg == null ? 'Not available' : `${number(cohort.weightedAverageBodyWeightKg, 3)} kg`, comparison(cohort.weightedAverageBodyWeightKg, prior.weightedAverageBodyWeightKg, value => `${number(value, 3)} kg`))}
        ${stat('Estimated FCR', number(cohort.estimatedFcr, 3), `${comparison(cohort.estimatedFcr, prior.estimatedFcr, value => number(value, 3), true)} · ${number(cohort.estimatedFcrEligibleBatchCount)} eligible`)}
      </div>
      <div class="afi-br-grid">
        <section class="afi-br-section"><h3>Operational Completion-Cohort Trend</h3><div class="afi-metric-tabs">${Object.entries(HISTORY_METRICS).map(([key, item]) => `<button data-afi-history-metric="${key}" class="${historyState.metric === key ? 'active' : ''}">${escape(item.label)}</button>`).join('')}</div><div id="afi-history-operational">${historyOperationalTable(data)}</div><p class="afi-br-note">Buckets use completion date. Mortality and livability are bird-weighted; body weight is weighted by surviving birds; FCR includes eligible batches only.</p></section>
        <section class="afi-br-section"><h3>Independent Financial Transaction Trend</h3>${historyFinancialTable(data)}<p class="afi-br-note">Revenue uses sale date and expenses use expense date. These transactions are not attributed to completion cohorts.</p></section>
      </div>
      <section class="afi-br-section"><h3>Completed-Batch Audit</h3>
        <p class="afi-br-note">Financial values are lifetime batch sales and direct expenses. Shared farm costs remain excluded.</p>
        <div class="afi-br-table"><table><thead><tr><th>Farm / Batch</th><th>Placed</th><th>Harvested</th><th>Cycle</th><th>Birds</th><th>Mortality / Culls</th><th>Latest Weight / Date</th><th>Feed</th><th>Estimated FCR</th><th>Lifetime Revenue</th><th>Lifetime Direct Expenses</th><th>Direct Profit</th><th>Margin</th><th>Shared Cost</th><th>Quality</th><th>Source</th></tr></thead><tbody>${historyBatchRows(data.batches || [])}</tbody></table></div>
        ${historyPager(data.batches || [])}
      </section>
      <section class="afi-br-section"><h3>Data-Quality Work Queue</h3>${historyQualityQueue(data.qualityWorkQueue || [])}</section>
      <section class="afi-scope-note"><strong>File exports are outside this pass.</strong> Excel/PDF generation, formatting, permission checks, download auditing, and delivery remain a separate implementation scope. No non-functional download controls are shown.</section>`;
    bindHistoryControls(root);
  }

  function historyOperationalTable(data) {
    const metric = HISTORY_METRICS[historyState.metric];
    const rows = data.operationalTrend || [];
    if (!rows.length) return '<div class="afi-message">No completed batches fall in this cohort period.</div>';
    return `<div class="afi-br-table"><table><thead><tr><th>Completion Bucket</th><th>${escape(metric.label)}</th><th>FCR-eligible Batches</th></tr></thead><tbody>${rows.map(row => {
      const value = row[historyState.metric];
      return `<tr><td>${escape(row.period)}</td><td>${value == null ? 'Not available' : `${number(value, metric.digits)}${metric.suffix || ''}`}</td><td>${number(row.estimatedFcrEligibleBatchCount)}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }

  function historyFinancialTable(data) {
    const rows = data.financialTrend || [];
    if (!rows.length) return '<div class="afi-message">No financial transactions were recorded in this period.</div>';
    return `<div class="afi-br-table"><table><thead><tr><th>Transaction Bucket</th><th>Revenue</th><th>Expenses</th><th>Operational Profit</th></tr></thead><tbody>${rows.map(row => `<tr class="${Number(row.operationalProfit) < 0 ? 'afi-negative-row' : 'afi-positive-row'}"><td>${escape(row.period)}</td><td>${money(row.revenue)}</td><td>${money(row.expenses)}</td><td>${money(row.operationalProfit)}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function historyBatchRows(rows) {
    const start = (historyState.page - 1) * historyState.pageSize;
    const pageRows = rows.slice(start, start + historyState.pageSize);
    if (!pageRows.length) return '<tr><td colspan="16" class="afi-message">No completed cohort batches to display.</td></tr>';
    return pageRows.map(row => {
      const operations = row.operations || {};
      const financials = row.financials || {};
      const flags = [];
      if (!operations.recordCount) flags.push('No flock records');
      if (operations.estimatedFcr === null) flags.push('FCR ineligible');
      if (!Number(financials.revenue)) flags.push('No sales');
      if (!Number(financials.directExpenses)) flags.push('No direct expenses');
      if (!flags.length) flags.push('Complete for reported metrics');
      return `<tr><td><strong>${escape(row.farmName || 'Farm unavailable')}</strong><small>${escape(row.batchCode || String(row.batchId))}</small></td>
        <td>${date(row.placedAt)}</td><td>${date(row.actualHarvestAt)}</td><td>${number(row.cycleDays)} days</td><td>${number(row.initialBirdCount)}</td><td>${number(operations.mortalityCount)} / ${number(operations.cullCount)}</td>
        <td>${operations.latestAvgWeightKg == null ? 'Not available' : `${number(operations.latestAvgWeightKg, 3)} kg`}<small>${date(operations.latestWeightRecordDate)}</small></td><td>${number(operations.totalFeedKg, 3)} kg</td><td>${operations.estimatedFcr == null ? 'Ineligible' : number(operations.estimatedFcr, 3)}</td>
        <td>${money(financials.revenue)}</td><td>${money(financials.directExpenses)}</td><td>${money(financials.directProfit)}</td><td>${percent(financials.directProfitMarginPercent)}</td><td>Excluded</td>
        <td>${flags.map(flag => `<span class="afi-br-flag">${escape(flag)}</span>`).join('')}</td><td><button class="afi-br-link" data-afi-history-source="${escape(String(row.farmId))}" data-tab="overview">Open farm</button></td></tr>`;
    }).join('');
  }

  function historyPager(rows) {
    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / historyState.pageSize));
    const start = total ? (historyState.page - 1) * historyState.pageSize + 1 : 0;
    const end = Math.min(historyState.page * historyState.pageSize, total);
    return `<div class="afi-pager"><span>Showing ${number(start)}–${number(end)} of ${number(total)}</span><label>Rows <select class="afi-select" id="afi-history-size">${[10, 25, 50, 100].map(size => `<option value="${size}" ${historyState.pageSize === size ? 'selected' : ''}>${size}</option>`).join('')}</select></label><div><button data-afi-history-page="${historyState.page - 1}" ${historyState.page <= 1 ? 'disabled' : ''}>Previous</button><span>Page ${historyState.page} of ${pages}</span><button data-afi-history-page="${historyState.page + 1}" ${historyState.page >= pages ? 'disabled' : ''}>Next</button></div></div>`;
  }

  function historyQualityQueue(rows) {
    if (!rows.length) return '<div class="afi-message">No known cohort data-quality issues require correction.</div>';
    const labels = {
      missing_actual_harvest_at: 'Completed batch missing actual harvest date',
      no_flock_records: 'No flock records',
      insufficient_weight_records_for_fcr: 'Insufficient weight records for estimated FCR',
      no_sales: 'No sales',
      no_direct_expenses: 'No direct expenses',
      sale_quantity_inconsistency: 'Recorded sales exceed the authoritative sellable ceiling'
    };
    return `<div class="afi-br-table"><table><thead><tr><th>Issue</th><th>Farm / Batch</th><th>Responsible Source</th></tr></thead><tbody>${rows.map(row => `<tr><td class="${row.issue === 'sale_quantity_inconsistency' ? 'afi-br-danger' : ''}">${escape(labels[row.issue] || FarmSenseAdminApi.label(row.issue))}</td><td><strong>${escape(row.farmName || 'Farm unavailable')}</strong><small>${escape(row.batchCode || String(row.batchId))}</small></td><td><button class="afi-br-link" data-afi-history-source="${escape(String(row.farmId))}" data-tab="${escape(row.sourceTab || 'overview')}">Correct source</button></td></tr>`).join('')}</tbody></table></div>`;
  }

  function bindHistoryControls(root) {
    root.querySelectorAll('[data-afi-history-metric]').forEach(button => button.addEventListener('click', () => {
      historyState.metric = button.dataset.afiHistoryMetric;
      renderHistory(root);
    }));
    root.querySelector('#afi-history-size')?.addEventListener('change', event => {
      historyState.pageSize = Number(event.target.value);
      historyState.page = 1;
      renderHistory(root);
    });
    root.querySelectorAll('[data-afi-history-page]').forEach(button => button.addEventListener('click', () => {
      const page = Number(button.dataset.afiHistoryPage);
      const pages = Math.max(1, Math.ceil((historyState.current?.batches || []).length / historyState.pageSize));
      if (page >= 1 && page <= pages) {
        historyState.page = page;
        renderHistory(root);
      }
    }));
    root.querySelectorAll('[data-afi-history-source]').forEach(button => button.addEventListener('click', () => navigateSource(button.dataset.afiHistorySource, button.dataset.tab)));
  }

  let forecastRequest = 0;
  let forecastState = { horizonDays: 60, data: null };
  function bindForecastPage(root) {
    const listener = event => {
      if (activeRoot !== root || root.dataset.afiPage !== 'forecast') return;
      if (!event.detail.context.organizationId) return;
      loadForecast(root);
    };
    window.addEventListener('farmSense:admin-financial-context-change', listener, { signal: pageAbortSignal(root) });
  }

  async function loadForecast(root) {
    const requestId = ++forecastRequest;
    const content = root.querySelector('#afi-content');
    content.classList.remove('afi-error');
    content.innerHTML = '<div class="afi-message">Evaluating historical eligibility and held-out accuracy…</div>';
    try {
      const params = query();
      params.set('horizonDays', String(forecastState.horizonDays));
      const data = await request(`/financial/forecast?${params}`);
      if (requestId !== forecastRequest || activeRoot !== root) return;
      forecastState.data = data;
      content.classList.remove('afi-message');
      renderForecast(root);
    } catch (error) {
      if (requestId !== forecastRequest || activeRoot !== root) return;
      renderError(root, error);
    }
  }

  function renderForecast(root) {
    const data = forecastState.data || {};
    const content = root.querySelector('#afi-content');
    content.innerHTML = `<div class="afi-forecast-toolbar"><label>Forecast horizon <select class="afi-select" id="afi-forecast-horizon">${[30, 60, 90, 180].map(days => `<option value="${days}" ${forecastState.horizonDays === days ? 'selected' : ''}>Next ${days} days</option>`).join('')}</select></label></div>${data.available ? forecastAvailable(data) : forecastUnavailable(data)}${forecastMethod(data)}${forecastReadinessQueue(data)}`;
    bindForecastControls(root);
  }

  function forecastUnavailable(data) {
    const sample = data.historicalSample || {};
    const backtest = data.backtest;
    const readiness = data.readiness || {};
    const reasonLabels = {
      INSUFFICIENT_HISTORY: 'Not enough eligible completed-batch history',
      BACKTEST_FAILED: 'Held-out error exceeded the permitted threshold',
      NO_ELIGIBLE_ACTIVE_BATCHES: 'No active or planned batches fall within the horizon'
    };
    return `<section class="afi-forecast-unavailable">
      <h2>Forecast unavailable</h2>
      <span class="afi-reason-code">${escape(data.reasonCode || 'UNAVAILABLE')}</span>
      <strong>${escape(reasonLabels[data.reasonCode] || 'Canonical readiness gate not satisfied')}</strong>
      <p>${escape(data.reason || 'Verified forecast requirements are not met.')}</p>
      <div class="afi-forecast-checks">
        <div><span>Eligible completed batches</span><strong>${number(sample.eligibleBatchCount)} / ${number(sample.minimumRequired)} minimum</strong></div>
        <div><span>Excluded completed batches</span><strong>${number(sample.excludedCompletedBatchCount)}</strong></div>
        <div><span>Held-out batches</span><strong>${backtest ? number(backtest.holdoutCount) : 'Not evaluated'}</strong></div>
        <div><span>Revenue WAPE</span><strong>${backtest ? percent(backtest.revenueWapePercent) : 'Not evaluated'}</strong></div>
        <div><span>Expense WAPE</span><strong>${backtest ? percent(backtest.expenseWapePercent) : 'Not evaluated'}</strong></div>
        <div><span>Required WAPE threshold</span><strong>${percent(backtest?.thresholdPercent ?? data.method?.backtestMaxWapePercent)}</strong></div>
        <div><span>Active batches missing expected harvest</span><strong>${number(readiness.activeBatchesMissingExpectedHarvestCount)}</strong></div>
      </div>
      <p class="afi-br-note">No estimate, sensitivity range, or factual comparison is displayed until every canonical gate passes. There is no manual enable or override.</p>
    </section>`;
  }

  function forecastAvailable(data) {
    const sensitivity = data.sensitivity || {};
    const assumptions = sensitivity.assumptions || {};
    return `
      <div class="afi-br-stats">
        ${stat('Baseline Revenue', money(sensitivity.baseline?.revenue), `${number(data.horizonDays)}-day horizon`)}
        ${stat('Baseline Expenses', money(sensitivity.baseline?.expenses), 'Recorded plus historical baseline')}
        ${stat('Baseline Profit', money(sensitivity.baseline?.profit), 'Estimated revenue − expenses')}
        ${stat('Baseline Margin', percent(sensitivity.baseline?.marginPercent), 'Estimated profit ÷ revenue')}
        ${stat('Eligible History', number(data.historicalSample?.eligibleBatchCount), 'Completed training batches')}
        ${stat('Held-out Validation', data.backtest?.passed ? 'Passed' : 'Failed', `${number(data.backtest?.holdoutCount)} batches`)}
      </div>
      <section class="afi-br-section"><h3>Deterministic Sensitivity Inputs</h3>
        <p class="afi-br-note">These are fixed input sensitivities, not probabilities, confidence intervals, or best/worst predictions.</p>
        <div class="afi-sensitivity-grid">
          ${sensitivityCard('Lower sensitivity', sensitivity.lower, assumptions.lower)}
          ${sensitivityCard('Baseline', sensitivity.baseline, 'Recency-weighted historical medians')}
          ${sensitivityCard('Upper sensitivity', sensitivity.upper, assumptions.upper)}
        </div>
      </section>
      <section class="afi-br-section"><h3>Active-Batch Readiness</h3>
        <p class="afi-br-note">Estimated birds remaining subtract recorded mortality, culls, and prior partial sales.</p>
        <div class="afi-br-table"><table><thead><tr><th>Farm / Batch</th><th>Status</th><th>Expected Harvest</th><th>Initial</th><th>Mortality</th><th>Culls</th><th>Already Sold</th><th>Est. Remaining</th><th>Recorded Revenue</th><th>Recorded Expenses</th><th>Current / Historical FCR</th><th>Current / Historical Mortality</th><th>Est. Final Revenue</th><th>Est. Final Expenses</th><th>Est. Profit</th><th>Est. Margin</th><th>Readiness</th><th>Source</th></tr></thead><tbody>${forecastBatchRows(data.batches || [])}</tbody></table></div>
      </section>
      <div class="afi-br-grid">
        ${forecastBacktest(data)}
        <section class="afi-br-section"><h3>Computed Factual Comparisons</h3>${(data.factualComparisons || []).map(text => `<div class="afi-fact-row">${escape(text)}</div>`).join('') || '<div class="afi-message">No factual comparisons available.</div>'}</section>
      </div>`;
  }

  function sensitivityCard(label, row, assumption) {
    return `<div class="afi-sensitivity-card"><span>${escape(label)}</span><strong>${money(row?.profit)}</strong><small>Estimated profit</small><dl><dt>Revenue</dt><dd>${money(row?.revenue)}</dd><dt>Expenses</dt><dd>${money(row?.expenses)}</dd><dt>Margin</dt><dd>${percent(row?.marginPercent)}</dd></dl><p>${escape(assumption || '')}</p></div>`;
  }

  function forecastBatchRows(rows) {
    if (!rows.length) return '<tr><td colspan="18" class="afi-message">No eligible active batches fall within this horizon.</td></tr>';
    return rows.map(batch => {
      const flags = [];
      if (batch.comparisons?.currentEstimatedFcr == null) flags.push('Current FCR unavailable');
      if (batch.comparisons?.currentMortalityPercent == null) flags.push('Current mortality unavailable');
      if (!Number(batch.recordedExpenses)) flags.push('No recorded expenses yet');
      if (!flags.length) flags.push('Eligible');
      return `<tr><td><strong>${escape(batch.farmName || 'Farm unavailable')}</strong><small>${escape(batch.batchCode || String(batch.batchId))}</small></td><td>${escape(FarmSenseAdminApi.label(batch.status))}</td><td>${date(batch.expectedHarvestAt)}</td>
        <td>${number(batch.initialBirdCount)}</td><td>${number(batch.mortalityCount)}</td><td>${number(batch.cullCount)}</td><td>${number(batch.alreadySold)}</td><td>${number(batch.estimatedBirdsToSell)}</td><td>${money(batch.recordedRevenue)}</td><td>${money(batch.recordedExpenses)}</td>
        <td>${number(batch.comparisons?.currentEstimatedFcr, 3)} / ${number(batch.comparisons?.historicalEstimatedFcr, 3)}</td><td>${percent(batch.comparisons?.currentMortalityPercent)} / ${percent(batch.comparisons?.historicalMortalityPercent)}</td>
        <td>${money(batch.estimate?.baseline?.revenue)}</td><td>${money(batch.estimate?.baseline?.expenses)}</td><td>${money(batch.estimate?.baseline?.profit)}</td><td>${percent(batch.estimate?.baseline?.marginPercent)}</td>
        <td>${flags.map(flag => `<span class="afi-br-flag">${escape(flag)}</span>`).join('')}</td><td><button class="afi-br-link" data-afi-forecast-source="${escape(String(batch.farmId))}" data-tab="overview">Open farm</button></td></tr>`;
    }).join('');
  }

  function forecastBacktest(data) {
    const backtest = data.backtest || {};
    return `<section class="afi-br-section"><h3>Held-out Back-test</h3>
      <div class="afi-forecast-checks">
        <div><span>Held-out batches</span><strong>${number(backtest.holdoutCount)}</strong></div>
        <div><span>Revenue WAPE</span><strong>${percent(backtest.revenueWapePercent)}</strong></div>
        <div><span>Expense WAPE</span><strong>${percent(backtest.expenseWapePercent)}</strong></div>
        <div><span>Profit MAE</span><strong>${money(backtest.profitMae)}</strong></div>
        <div><span>Threshold</span><strong>${percent(backtest.thresholdPercent)}</strong></div>
        <div><span>Status</span><strong>${backtest.passed ? 'Passed' : 'Failed'}</strong></div>
      </div><p class="afi-br-note">Held-out batches are evaluated chronologically. Both revenue and expense WAPE must pass.</p>
    </section>`;
  }

  function forecastMethod(data) {
    const method = data.method || {};
    const sample = data.historicalSample || {};
    return `<section class="afi-br-section"><h3>Method and Training Window</h3>
      <div class="afi-forecast-checks">
        <div><span>Method version</span><strong>${escape(method.version || 'Not available')}</strong></div>
        <div><span>Training window</span><strong>${date(data.range?.from)} – ${date(data.range?.toExclusive)}</strong></div>
        <div><span>Eligible sample</span><strong>${number(sample.eligibleBatchCount)}</strong></div>
        <div><span>Minimum required</span><strong>${number(sample.minimumRequired)}</strong></div>
        <div><span>Sensitivity</span><strong>±${number(method.sensitivityPercent)}%</strong></div>
        <div><span>Probability claimed</span><strong>No</strong></div>
      </div><p class="afi-br-note">${escape(method.description || '')}</p>
    </section>`;
  }

  function forecastReadinessQueue(data) {
    const sample = data.historicalSample || {};
    const readiness = data.readiness || {};
    const rows = [
      ...(sample.excludedBatches || []).map(batch => ({ ...batch, type: 'history' })),
      ...(readiness.activeBatchesMissingExpectedHarvest || []).map(batch => ({ ...batch, type: 'harvest', reasons: ['missing_expected_harvest_at'] }))
    ];
    const labels = {
      missing_initial_bird_count: 'Missing initial bird count',
      missing_recorded_sales: 'Missing recorded sales',
      missing_direct_expenses: 'Missing direct expenses',
      missing_expected_harvest_at: 'Active/planned batch missing expected harvest date'
    };
    return `<section class="afi-br-section"><h3>Forecast Readiness Work Queue</h3>${rows.length ? `<div class="afi-br-table"><table><thead><tr><th>Farm / Batch</th><th>Blocking Inputs</th><th>Correction</th></tr></thead><tbody>${rows.map(row => {
      const tab = row.reasons?.includes('missing_recorded_sales') ? 'sales' : row.reasons?.includes('missing_direct_expenses') ? 'expenses' : 'overview';
      const farm = (publicContext().farms || []).find(item => idOf(item) === String(row.farmId));
      return `<tr><td><strong>${escape(farm?.name || 'Farm unavailable')}</strong><small>${escape(row.batchCode || String(row.batchId))}</small></td><td>${(row.reasons || []).map(reason => `<span class="afi-br-flag">${escape(labels[reason] || FarmSenseAdminApi.label(reason))}</span>`).join('')}</td><td><button class="afi-br-link" data-afi-forecast-source="${escape(String(row.farmId))}" data-tab="${tab}">Correct source</button></td></tr>`;
    }).join('')}</tbody></table></div>` : '<div class="afi-message">No identified source-input issues are blocking forecast readiness.</div>'}</section>`;
  }

  function bindForecastControls(root) {
    root.querySelector('#afi-forecast-horizon')?.addEventListener('change', event => {
      forecastState.horizonDays = Number(event.target.value);
      loadForecast(root);
    });
    root.querySelectorAll('[data-afi-forecast-source]').forEach(button => button.addEventListener('click', () => navigateSource(button.dataset.afiForecastSource, button.dataset.tab)));
  }

  window.FarmSenseAdminFinancialContext = {
    get: publicContext,
    query,
    refresh: () => state.organizationId && publish('refresh')
  };
  window.viewAdminFinancialOverview = () => pageView('overview');
  window.viewAdminProfitForecast = () => pageView('forecast');
  window.viewAdminBatchwiseRevenue = () => pageView('revenue');
  window.viewAdminHistoricalReports = () => pageView('history');
}());
