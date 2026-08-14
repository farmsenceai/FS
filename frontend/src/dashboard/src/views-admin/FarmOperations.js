/* views-admin/FarmOperations.js */

window.metaFarmOperations = {
  title: 'Farm Operations',
  subtitle: 'Manage farms, facilities, managers, projects, financial records, and farmer fees.'
};

const FO_API = `${window.FARMSENCE_API_BASE_URL || window.location.origin}/api/v2`;
let foState = null;

async function foRequest(path, options = {}) {
  const response = await fetch(`${FO_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('fs_token')}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  let data = {};
  try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) {
    const message = data.error?.message || data.error || data.message || data.msg || `Request failed (${response.status})`;
    const error = new Error(response.status === 403 ? `Access denied: ${message}` : message);
    error.status = response.status;
    throw error;
  }
  return data;
}

function foEscape(value) { return FarmSenseAdminApi.escapeHTML(value); }
function foMoney(value, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Number(value) || 0);
}
function foOptions(values, selected) {
  return values.map(value => `<option value="${value}" ${value === selected ? 'selected' : ''}>${FarmSenseAdminApi.label(value)}</option>`).join('');
}

function foCountryOptions() {
  const countries = typeof country_and_states === 'undefined' ? {} : country_and_states.country;
  return Object.entries(countries)
    .sort((left, right) => left[1].localeCompare(right[1]))
    .map(([code, name]) => `<option value="${foEscape(code)}" ${code === 'IN' ? 'selected' : ''}>${foEscape(name)}</option>`)
    .join('');
}

function foPopulateStates(countryCode, stateSelect) {
  const states = typeof country_and_states === 'undefined' ? [] : (country_and_states.states[countryCode] || []);
  stateSelect.innerHTML = `<option value="">${states.length ? 'Select state / province…' : 'No states or provinces listed'}</option>${states
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(state => `<option value="${foEscape(state.name)}">${foEscape(state.name)}</option>`)
    .join('')}`;
  stateSelect.disabled = states.length === 0;
  stateSelect.required = states.length > 0;
}

const FO_COUNTRY_TIMEZONES = {
  IN:'Asia/Kolkata', AF:'Asia/Kabul', AE:'Asia/Dubai', AR:'America/Argentina/Buenos_Aires', AT:'Europe/Vienna', BD:'Asia/Dhaka', BE:'Europe/Brussels', BG:'Europe/Sofia', BH:'Asia/Bahrain', BO:'America/La_Paz', BR:'America/Sao_Paulo', CH:'Europe/Zurich', CL:'America/Santiago', CN:'Asia/Shanghai', CO:'America/Bogota', CR:'America/Costa_Rica', CY:'Asia/Nicosia', CZ:'Europe/Prague', DE:'Europe/Berlin', DK:'Europe/Copenhagen', EG:'Africa/Cairo', ES:'Europe/Madrid', FI:'Europe/Helsinki', FR:'Europe/Paris', GB:'Europe/London', GH:'Africa/Accra', GR:'Europe/Athens', HK:'Asia/Hong_Kong', HU:'Europe/Budapest', ID:'Asia/Jakarta', IE:'Europe/Dublin', IL:'Asia/Jerusalem', IQ:'Asia/Baghdad', IR:'Asia/Tehran', IS:'Atlantic/Reykjavik', IT:'Europe/Rome', JP:'Asia/Tokyo', KE:'Africa/Nairobi', KR:'Asia/Seoul', KW:'Asia/Kuwait', LK:'Asia/Colombo', MA:'Africa/Casablanca', MX:'America/Mexico_City', MY:'Asia/Kuala_Lumpur', NG:'Africa/Lagos', NL:'Europe/Amsterdam', NO:'Europe/Oslo', NP:'Asia/Kathmandu', NZ:'Pacific/Auckland', OM:'Asia/Muscat', PE:'America/Lima', PH:'Asia/Manila', PK:'Asia/Karachi', PL:'Europe/Warsaw', PT:'Europe/Lisbon', QA:'Asia/Qatar', RO:'Europe/Bucharest', RU:'Europe/Moscow', SA:'Asia/Riyadh', SE:'Europe/Stockholm', SG:'Asia/Singapore', TH:'Asia/Bangkok', TR:'Europe/Istanbul', TW:'Asia/Taipei', TZ:'Africa/Dar_es_Salaam', UA:'Europe/Kyiv', US:'America/New_York', VE:'America/Caracas', VN:'Asia/Ho_Chi_Minh', ZA:'Africa/Johannesburg', ZW:'Africa/Harare', AU:'Australia/Sydney', CA:'America/Toronto'
};

const FO_STATE_TIMEZONES = {
  US: { AK:'America/Anchorage', AL:'America/Chicago', AR:'America/Chicago', AZ:'America/Phoenix', CA:'America/Los_Angeles', CO:'America/Denver', CT:'America/New_York', DC:'America/New_York', DE:'America/New_York', FL:'America/New_York', GA:'America/New_York', HI:'Pacific/Honolulu', IA:'America/Chicago', ID:'America/Boise', IL:'America/Chicago', IN:'America/Indiana/Indianapolis', KS:'America/Chicago', KY:'America/New_York', LA:'America/Chicago', MA:'America/New_York', MD:'America/New_York', ME:'America/New_York', MI:'America/Detroit', MN:'America/Chicago', MO:'America/Chicago', MS:'America/Chicago', MT:'America/Denver', NC:'America/New_York', ND:'America/Chicago', NE:'America/Chicago', NH:'America/New_York', NJ:'America/New_York', NM:'America/Denver', NV:'America/Los_Angeles', NY:'America/New_York', OH:'America/New_York', OK:'America/Chicago', OR:'America/Los_Angeles', PA:'America/New_York', RI:'America/New_York', SC:'America/New_York', SD:'America/Chicago', TN:'America/Chicago', TX:'America/Chicago', UT:'America/Denver', VA:'America/New_York', VT:'America/New_York', WA:'America/Los_Angeles', WI:'America/Chicago', WV:'America/New_York', WY:'America/Denver' },
  AU: { ACT:'Australia/Sydney', NSW:'Australia/Sydney', NT:'Australia/Darwin', QLD:'Australia/Brisbane', SA:'Australia/Adelaide', TAS:'Australia/Hobart', VIC:'Australia/Melbourne', WA:'Australia/Perth' },
  CA: { AB:'America/Edmonton', BC:'America/Vancouver', MB:'America/Winnipeg', NB:'America/Moncton', NL:'America/St_Johns', NS:'America/Halifax', NT:'America/Yellowknife', NU:'America/Iqaluit', ON:'America/Toronto', PE:'America/Halifax', QC:'America/Toronto', SK:'America/Regina', YT:'America/Whitehorse' }
};

function foTimezoneForLocation(countryCode, stateName) {
  const states = typeof country_and_states === 'undefined' ? [] : (country_and_states.states[countryCode] || []);
  const stateCode = states.find(state => state.name === stateName)?.code;
  return FO_STATE_TIMEZONES[countryCode]?.[stateCode] || FO_COUNTRY_TIMEZONES[countryCode] || 'Etc/UTC';
}

function injectFarmOperationsStyles() {
  if (document.getElementById('fo-styles')) return;
  const style = document.createElement('style');
  style.id = 'fo-styles';
  style.textContent = `
    .fo-page{padding:20px;background:#f5f6fa;min-height:100%;font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937}
    .fo-card{background:#fff;border:1px solid #e5e7eb;border-radius:11px;padding:16px;margin-bottom:16px}.fo-card h3{margin:0;font-size:14px}.fo-card-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}
    .fo-farm-toolbar{display:flex;align-items:center;gap:12px}.fo-farm-toolbar .fo-input{max-width:520px}.fo-farm-count{margin-left:auto;color:#6b7280;font-size:11px;white-space:nowrap}.fo-farm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin-top:14px}.fo-farm-card{appearance:none;width:100%;min-height:154px;padding:14px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;color:#1f2937;text-align:left;cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s}.fo-farm-card:hover{border-color:#86efac;box-shadow:0 6px 18px rgba(22,101,52,.09);transform:translateY(-1px)}.fo-farm-card.active{border-color:#16a34a;box-shadow:0 0 0 2px rgba(22,163,74,.12);background:#f7fef9}.fo-farm-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}.fo-farm-card h4{margin:0;font-size:14px;line-height:1.35}.fo-farm-code{margin-top:4px;color:#166534;font-size:10px;font-weight:800;letter-spacing:.04em}.fo-farm-details{display:grid;gap:7px;margin-top:14px;color:#6b7280;font-size:11px}.fo-farm-detail{display:flex;justify-content:space-between;gap:10px}.fo-farm-detail span:last-child{text-align:right;color:#374151}.fo-input,.fo-select,.fo-textarea{box-sizing:border-box;width:100%;border:1px solid #d1d5db;border-radius:7px;padding:8px 10px;background:#fff;color:#374151;font-size:12px}.fo-textarea{min-height:76px;resize:vertical}
    .fo-tabs{display:flex;gap:7px;flex-wrap:wrap;margin:14px 0}.fo-tab{border:1px solid #d1d5db;background:#fff;padding:8px 13px;border-radius:8px;cursor:pointer;font-weight:600;color:#4b5563}.fo-tab.active{background:#166534;border-color:#166534;color:#fff}
    .fo-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.fo-grid-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.fo-field label{display:block;color:#6b7280;font-size:11px;font-weight:700;margin-bottom:5px}.fo-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.fo-btn{border:0;border-radius:7px;padding:8px 12px;background:#166534;color:#fff;font-size:11px;font-weight:700;cursor:pointer}.fo-btn.secondary{background:#fff;color:#166534;border:1px solid #16a34a}.fo-btn.danger{background:#fff;color:#b91c1c;border:1px solid #fecaca}.fo-btn:disabled{opacity:.5;cursor:not-allowed}
    .fo-table{width:100%;border-collapse:collapse}.fo-table th{background:#f9fafb;color:#6b7280;font-size:10px;text-align:left;padding:9px;border-bottom:1px solid #e5e7eb}.fo-table td{padding:10px 9px;border-bottom:1px solid #f3f4f6;vertical-align:top}.fo-table-wrap{overflow-x:auto}.fo-badge{display:inline-block;padding:3px 8px;border-radius:12px;background:#eef2ff;color:#3730a3;font-size:10px;font-weight:700}.fo-badge.active,.fo-badge.paid,.fo-badge.completed{background:#dcfce7;color:#166534}.fo-badge.pending,.fo-badge.planned{background:#fef3c7;color:#92400e}.fo-badge.blocked,.fo-badge.cancelled{background:#fee2e2;color:#991b1b}
    .fo-empty{padding:24px;text-align:center;color:#6b7280}.fo-feed{display:grid;gap:9px}.fo-feed-item{border-left:3px solid #86efac;background:#f9fafb;padding:10px 12px;border-radius:0 8px 8px 0}.fo-feed-meta{font-size:10px;color:#6b7280;margin-top:5px}.fo-stat{padding:12px;border-radius:9px;background:#f9fafb;border:1px solid #eef0f3}.fo-stat strong{display:block;font-size:18px;color:#111827;margin-top:4px}.fo-hidden{display:none!important}.fo-loading{padding:35px;text-align:center;color:#6b7280}
    .fo-help{color:#6b7280;font-size:11px;line-height:1.45;margin-top:5px}.fo-preview{padding:12px;border:1px solid #bbf7d0;background:#f0fdf4;border-radius:9px;color:#166534}.fo-preview strong{display:block;font-size:18px;margin-top:3px}.fo-warning{padding:10px 12px;border:1px solid #fde68a;background:#fffbeb;border-radius:8px;color:#92400e;font-size:11px;margin-bottom:12px}.fo-ledger-note{max-width:280px;white-space:normal;color:#6b7280;font-size:10px;margin-top:3px}.fo-action-stack{display:flex;gap:6px;flex-wrap:wrap}
    .fo-context-heading{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:11px 14px;background:#ecfdf3;border:1px solid #bbf7d0;border-radius:9px;margin-top:14px;color:#166534}.fo-context-heading small{display:block;color:#4b5563;margin-top:3px}.fo-source-highlight{background:#fefce8!important;outline:2px solid #facc15;outline-offset:-2px}.fo-source-highlight td:first-child:before{content:'Source record';display:block;color:#92400e;font-size:9px;font-weight:800;text-transform:uppercase;margin-bottom:3px}
    .fo-workspace-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}.fo-workspace-back{border:1px solid #16a34a;border-radius:7px;padding:8px 11px;background:#fff;color:#166534;font-size:11px;font-weight:700;cursor:pointer}.fo-workspace-title strong{display:block;font-size:14px}.fo-workspace-title span{display:block;color:#6b7280;font-size:10px;margin-top:2px}
    .fo-modal{display:none;position:fixed;inset:0;z-index:2600;background:rgba(241,245,249,.96);align-items:center;justify-content:center;padding:10px}.fo-modal.open{display:flex}.fo-modal-card{box-sizing:border-box;width:min(720px,100%);max-height:calc(100vh - 20px);overflow:auto;background:#fff;border-radius:10px;padding:20px;box-shadow:0 8px 30px rgba(15,23,42,.10)}.fo-modal-card h3{margin:0}.fo-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
    .fo-create-card{width:min(1180px,100%);padding:0;display:grid;grid-template-columns:minmax(360px,1fr) 430px;background:#f4f7f6}.fo-create-head{position:relative;padding:25px 28px 22px 88px;background:#fff;border-bottom:1px solid #edf0f2}.fo-create-head:before{content:'⌂';position:absolute;left:28px;top:22px;width:46px;height:46px;display:grid;place-items:center;border-radius:50%;background:#087c39;color:#fff;font-size:25px}.fo-create-head h3{font-size:22px;color:#0f1b33}.fo-create-head p{margin:5px 0 0;color:#64748b;font-size:13px}.fo-stepper{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:21px 28px;background:#fff;border-bottom:1px solid #edf0f2}.fo-step{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;color:#64748b;font-size:11px;font-weight:500}.fo-step:not(:last-child):after{content:'';position:absolute;left:70%;right:-55%;top:14px;height:1px;background:#d8dee7}.fo-step i{position:relative;z-index:1;display:grid;place-items:center;width:28px;height:28px;border:1px solid #d5dce6;border-radius:50%;background:#fff;color:#64748b;font-style:normal}.fo-step.active{color:#087c39;font-weight:700}.fo-step.active i,.fo-step.complete i{background:#087c39;border-color:#087c39;color:#fff}.fo-create-error,.fo-create-body,.fo-create-footer{grid-column:1/-1}.fo-create-body{padding:10px 0 0;background:#f4f7f6}.fo-create-section{display:none;margin:0 0 10px;padding:24px;background:#fff;border:1px solid #e7ebef;border-radius:8px}.fo-create-section.active{display:block}.fo-section-title{position:relative;padding-left:34px;color:#087c39;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:.15px;margin-bottom:3px}.fo-section-title:before{content:'⌖';position:absolute;left:2px;top:-4px;font-size:23px}.fo-section-copy{color:#7b8798;font-size:11px;margin:0 0 19px 34px}.fo-create-section .fo-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:18px 20px}.fo-create-section[data-fo-step="2"] .fo-field[style]{grid-column:span 2!important}.fo-create-section[data-fo-step="3"] .fo-grid,.fo-create-section[data-fo-step="4"] .fo-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.fo-create-section .fo-field label{color:#29364d;font-size:11px;margin-bottom:8px}.fo-create-section .fo-input,.fo-create-section .fo-select,.fo-create-section .fo-textarea{min-height:42px;border-color:#d8dfe8;border-radius:6px;background:#fff;padding:10px 12px;color:#344158}.fo-create-section .fo-input:focus,.fo-create-section .fo-select:focus,.fo-create-section .fo-textarea:focus{outline:0;border-color:#0b8b46;box-shadow:0 0 0 2px rgba(11,139,70,.08)}.fo-create-section [readonly]{background:#f4f6f9;color:#8792a5}.fo-field-error{color:#b91c1c;font-size:10px;margin-top:4px}.fo-create-footer{position:sticky;bottom:0;z-index:4;display:flex;align-items:center;justify-content:space-between;padding:14px 0 2px;background:#f4f7f6}.fo-create-footer .fo-btn{min-height:40px;padding:9px 18px;border-radius:7px}.fo-create-footer .fo-btn:not(.secondary){background:#087c39}.fo-create-error{display:none;margin:10px 0 0;padding:10px 24px;border-radius:7px;background:#fef2f2;color:#991b1b}.fo-location-actions{display:flex;align-items:center;gap:9px}.fo-location-status{font-size:10px;color:#6b7280}.fo-map-panel{grid-column:1/-1;height:190px;position:relative;overflow:hidden;border:1px solid #d9e1e6;border-radius:7px;background-color:#e8f0e4;background-image:linear-gradient(28deg,transparent 47%,rgba(255,255,255,.8) 48%,rgba(255,255,255,.8) 51%,transparent 52%),linear-gradient(112deg,transparent 46%,rgba(169,207,230,.55) 47%,rgba(169,207,230,.55) 49%,transparent 50%),repeating-linear-gradient(0deg,transparent 0 30px,rgba(157,190,144,.18) 31px 32px)}.fo-map-pin{position:absolute;left:50%;top:46%;width:28px;height:28px;transform:translate(-50%,-50%) rotate(45deg);border-radius:50% 50% 50% 0;background:#087c39;box-shadow:0 3px 8px rgba(0,0,0,.24)}.fo-map-pin:after{content:'';position:absolute;inset:8px;border-radius:50%;background:#fff}.fo-map-search{position:absolute;left:0;right:0;bottom:0;display:flex;gap:8px;padding:8px;background:#fff;border-top:1px solid #d9e1e6}.fo-map-search span{padding:9px 7px;font-size:11px;font-weight:700}.fo-map-search input{flex:1;border:1px solid #d8dfe8;border-radius:5px;padding:8px}.fo-map-zoom{position:absolute;left:12px;top:12px;background:#fff;border:1px solid #d8dfe8;border-radius:4px;box-shadow:0 2px 5px rgba(0,0,0,.08)}.fo-map-zoom b{display:block;padding:5px 9px;font-size:16px}.fo-map-zoom b+b{border-top:1px solid #e5e7eb}@media(max-width:900px){.fo-create-card{grid-template-columns:1fr}.fo-stepper{grid-row:2}.fo-create-section .fo-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.fo-step span{display:none}.fo-stepper{padding:12px}.fo-create-head{padding:20px 18px 18px 72px}.fo-create-head:before{left:18px}.fo-create-section{padding:16px}.fo-create-section .fo-grid,.fo-create-section[data-fo-step="3"] .fo-grid,.fo-create-section[data-fo-step="4"] .fo-grid{grid-template-columns:1fr}.fo-create-section[data-fo-step="2"] .fo-field[style]{grid-column:auto!important}.fo-create-footer{padding:12px 0}}
    @media(max-width:900px){.fo-grid,.fo-grid-3{grid-template-columns:1fr}}@media(max-width:600px){.fo-farm-toolbar{align-items:stretch;flex-direction:column}.fo-farm-toolbar .fo-input{max-width:none}.fo-farm-count{margin-left:0}}
  `;
  document.head.appendChild(style);
}

function viewFarmOperations() {
  injectFarmOperationsStyles();
  setTimeout(foInit, 0);
  return `
    <div class="fo-page">
      <div id="fo-feedback"></div>
      <div id="fo-farm-list-screen"><div class="fo-card">
        <div class="fo-card-head"><div><h3>All Farms</h3><div style="color:#6b7280;margin-top:3px">View every farm, then click one to open its operational workspace.</div></div><div class="fo-actions"><button class="fo-btn" id="fo-create-farm">Create New Farm</button><button class="fo-btn secondary" id="fo-refresh-farms">Refresh</button></div></div>
        <div class="fo-farm-toolbar"><input class="fo-input" id="fo-farm-search" type="search" placeholder="Search by code, name, location, type, or status"><span class="fo-farm-count" id="fo-farm-count"></span></div>
        <div class="fo-farm-grid" id="fo-farm-grid"><div class="fo-loading">Loading farms…</div></div>
      </div></div>
      <div id="fo-workspace" class="fo-hidden">
        <div class="fo-workspace-head"><button class="fo-workspace-back" id="fo-back-to-farms" type="button">← All Farms</button><div class="fo-workspace-title"><strong id="fo-workspace-farm-name">Farm Operations</strong><span>Farm operational workspace</span></div></div>
        <div class="fo-context-heading" id="fo-context-heading"></div>
        <div class="fo-tabs">
          <button class="fo-tab active" data-fo-tab="overview">Farm & Facilities</button>
          <button class="fo-tab" data-fo-tab="batches">Batches</button>
          <button class="fo-tab" data-fo-tab="managers">Managers</button>
          <button class="fo-tab" data-fo-tab="projects">Projects & Work Updates</button>
          <button class="fo-tab" data-fo-tab="sales">Sales</button>
          <button class="fo-tab" data-fo-tab="expenses">Expenses</button>
          <button class="fo-tab" data-fo-tab="claims">Compensation Claims</button>
          <button class="fo-tab" data-fo-tab="fees">Farmer Fees</button>
        </div>
        <div id="fo-panel"></div>
      </div>
      <div class="fo-modal" id="fo-create-farm-modal"></div>
    </div>`;
}

function foInitialState() {
  return { farms: [], filteredFarms: [], businesses: [], selectedFarmId: '', farm: null, facilities: [], batches: [], managers: [], allManagers: [], projects: [], workUpdates: [], farmers: [], fees: [], claims: [], feeSummary: null, selectedFarmerId: '', sales: [], expenses: [], salesLoaded: false, expensesLoaded: false, saleMeta: {}, expenseMeta: {}, saleFilters: { page: 1, limit: 25, batchId: '', search: '', sort: 'date_desc' }, expenseFilters: { page: 1, limit: 25, batchId: '', scope: '', category: '', search: '', sort: 'date_desc' }, editingSaleId: '', editingExpenseId: '', financialFormDirty: false, tab: 'overview', projectStatus: 'all', sourceBatchId: '', sourceSaleId: '', sourceExpenseId: '' };
}

function foInit() {
  if (!document.getElementById('fo-farm-grid')) return;
  foState = foInitialState();
  const requestedParams = new URLSearchParams(location.search);
  const requestedTab = requestedParams.get('tab');
  foState.sourceBatchId = requestedParams.get('batchId') || '';
  foState.sourceSaleId = requestedParams.get('saleId') || '';
  foState.sourceExpenseId = requestedParams.get('expenseId') || '';
  if (['overview', 'batches', 'managers', 'projects', 'sales', 'expenses', 'claims', 'fees'].includes(requestedTab)) {
    foState.tab = requestedTab;
    document.querySelectorAll('[data-fo-tab]').forEach(item => item.classList.toggle('active', item.dataset.foTab === requestedTab));
  }
  document.getElementById('fo-farm-search').addEventListener('input', FarmSenseAdminApi.debounce(foFilterFarms, 180));
  document.getElementById('fo-refresh-farms').addEventListener('click', foLoadFarms);
  document.getElementById('fo-create-farm').addEventListener('click', foOpenCreateFarm);
  document.getElementById('fo-back-to-farms').addEventListener('click', foShowFarmList);
  document.querySelectorAll('[data-fo-tab]').forEach(button => button.addEventListener('click', () => {
    if (!foConfirmDiscard()) return;
    foState.tab = button.dataset.foTab;
    document.querySelectorAll('[data-fo-tab]').forEach(item => item.classList.toggle('active', item === button));
    foRenderPanel();
  }));
  if (!window.foUnsavedWarningInstalled) {
    window.addEventListener('beforeunload', event => {
      if (!foState?.financialFormDirty) return;
      event.preventDefault();
      event.returnValue = '';
    });
    window.foUnsavedWarningInstalled = true;
  }
  Promise.all([foLoadBusinesses(), foLoadFarms()]).then(async () => {
    const requestedFarmId = new URLSearchParams(location.search).get('farmId');
    if (requestedFarmId && foState.farms.some(farm => String(farm._id) === String(requestedFarmId))) {
      await foSelectFarm(requestedFarmId);
    }
  }).catch(foError);
}

async function foLoadBusinesses() {
  const result = await FarmSenseAdminApi.request('/businesses?limit=100&status=all');
  foState.businesses = result.data || [];
}

function foOpenCreateFarm() {
  const modal = document.getElementById('fo-create-farm-modal');
  modal.innerHTML = `<form class="fo-modal-card fo-create-card" id="fo-create-farm-form" novalidate>
    <div class="fo-create-head"><h3>Create New Farm</h3><p>Add a new farm to FarmSence.ai and start managing smarter.</p></div>
    <div class="fo-stepper">${['Basic Info','Location','Capacity','AI Setup'].map((label,index)=>`<div class="fo-step ${index===0?'active':''}" data-fo-step-label="${index+1}"><i>${index+1}</i><span>${label}</span></div>`).join('')}</div>
    <div class="fo-create-error" id="fo-create-error"></div>
    <div class="fo-create-body">
      <section class="fo-create-section active" data-fo-step="1"><div class="fo-section-title">1. Basic Information</div><div class="fo-section-copy">Identity, ownership, production type and operating status.</div><div class="fo-grid">
        <div class="fo-field"><label>Owning Organisation *</label><select class="fo-select" name="businessId" required><option value="">Select organisation…</option>${foState.businesses.map(item=>`<option value="${item.id||item._id}">${foEscape(item.displayName||item.legalName||item.name||'Organisation')}</option>`).join('')}</select></div>
        <div class="fo-field"><label>Farm Name *</label><input class="fo-input" name="name" required maxlength="160"></div>
        <div class="fo-field"><label>Farm Code</label><input class="fo-input" name="code" required maxlength="40" placeholder="Auto-generated" readonly></div>
        <div class="fo-field"><label>Farm Type *</label><select class="fo-select" name="farmType" required>${foOptions(['broiler','layer','breeder','mixed'],'broiler')}</select></div>
        <div class="fo-field"><label>Status *</label><select class="fo-select" name="status" required>${foOptions(['planned','active','inactive'],'planned')}</select></div>
        <div class="fo-field"><label>Operational Since</label><input class="fo-input" name="openedAt" type="date"></div>
      </div></section>
      <section class="fo-create-section" data-fo-step="2"><div class="fo-section-title">2. Location Details</div><div class="fo-section-copy">Country, state, address, timezone and optional GPS coordinates.</div><div class="fo-grid">
        <div class="fo-field"><label>Country *</label><select class="fo-select" name="countryCode" required><option value="">Select country…</option>${foCountryOptions()}</select></div>
        <div class="fo-field"><label>State / Province *</label><select class="fo-select" name="stateProvince" required></select></div>
        <div class="fo-field" style="grid-column:1/-1"><label>Full Address *</label><textarea class="fo-textarea" name="address" required maxlength="500" placeholder="Road, landmark, village/city, district and postal code"></textarea></div>
        <div class="fo-field"><label>Timezone *</label><input class="fo-input" name="timezone" value="Asia/Kolkata" required readonly><div class="fo-help" id="fo-timezone-status">Set automatically from country and state.</div></div>
        <div class="fo-field"><label>Latitude</label><input class="fo-input" name="latitude" type="number" min="-90" max="90" step="any"></div>
        <div class="fo-field"><label>Longitude</label><input class="fo-input" name="longitude" type="number" min="-180" max="180" step="any"></div>
        <div class="fo-location-actions"><button class="fo-btn secondary" type="button" id="fo-use-location">Use Current Location</button><span class="fo-location-status" id="fo-location-status"></span></div>
        <div class="fo-map-panel"><div class="fo-map-zoom"><b>+</b><b>−</b></div><div class="fo-map-pin"></div><div class="fo-map-search"><span>Search Your Location</span><input id="fo-map-search" type="text" placeholder="Search and pin your farm location"></div></div>
      </div></section>
      <section class="fo-create-section" data-fo-step="3"><div class="fo-section-title">3. Capacity &amp; Scale</div><div class="fo-section-copy">Capacity can be refined later in the farm workspace.</div><div class="fo-grid">
        <div class="fo-field"><label>Bird Capacity</label><input class="fo-input" name="birdCapacity" type="number" min="0" step="1" placeholder="Total birds"></div>
        <div class="fo-field"><label>Total Area (m²)</label><input class="fo-input" name="areaSqM" type="number" min="0" step="0.01"></div>
      </div></section>
      <section class="fo-create-section" data-fo-step="4"><div class="fo-section-title">4. Farm Manager &amp; Contact</div><div class="fo-section-copy">Optional operational contact stored with the farm. This does not create a login or assignment.</div><div class="fo-grid">
        <div class="fo-field"><label>Manager Name</label><input class="fo-input" name="contactName" maxlength="120"></div>
        <div class="fo-field"><label>Role</label><input class="fo-input" name="contactRole" value="Farm Manager" maxlength="80"></div>
        <div class="fo-field"><label>Phone</label><input class="fo-input" name="contactPhone" type="tel" maxlength="30"></div>
        <div class="fo-field"><label>Email</label><input class="fo-input" name="contactEmail" type="email" maxlength="160"></div>
      </div></section>
    </div>
    <div class="fo-create-footer"><button type="button" class="fo-btn secondary" id="fo-create-back" hidden>Back</button><div class="fo-actions"><button type="button" class="fo-btn secondary" id="fo-cancel-create-farm">Cancel</button><button type="button" class="fo-btn" id="fo-create-next">Next</button><button class="fo-btn" id="fo-create-submit" type="submit" hidden>Create Farm</button></div></div>
  </form>`;
  const ownershipSelect = modal.querySelector('[name="businessId"]');
  ownershipSelect.previousElementSibling.textContent = 'Owning Organisation';
  ownershipSelect.options[0].textContent = 'Select organisation…';
  Array.from(ownershipSelect.options).forEach(option => {
    if (option.textContent === 'Business') option.textContent = 'Organisation';
  });
  const countrySelect = modal.querySelector('[name="countryCode"]');
  const stateSelect = modal.querySelector('[name="stateProvince"]');
  const timezoneInput = modal.querySelector('[name="timezone"]');
  const timezoneStatus = modal.querySelector('#fo-timezone-status');
  const updateTimezone = () => {
    timezoneInput.value = foTimezoneForLocation(countrySelect.value, stateSelect.value);
    timezoneStatus.textContent = timezoneInput.value === 'Etc/UTC'
      ? 'No regional timezone mapping was found; using UTC.'
      : `Automatically set to ${timezoneInput.value}.`;
  };
  foPopulateStates(countrySelect.value, stateSelect);
  updateTimezone();
  countrySelect.addEventListener('change', () => { foPopulateStates(countrySelect.value, stateSelect); updateTimezone(); });
  stateSelect.addEventListener('change', updateTimezone);
  const nameInput = modal.querySelector('[name="name"]');
  const codeInput = modal.querySelector('[name="code"]');
  nameInput.addEventListener('input', () => {
    const stem = nameInput.value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
    codeInput.value = stem ? `FS-${stem}` : '';
  });
  modal.querySelector('#fo-map-search').addEventListener('input', event => {
    if (!modal.querySelector('[name="address"]').value) modal.querySelector('[name="address"]').value = event.target.value;
  });
  let step = 1;
  const showStep = value => {
    step = value;
    modal.querySelectorAll('[data-fo-step]').forEach(section => section.classList.toggle('active', Number(section.dataset.foStep) === step));
    modal.querySelectorAll('[data-fo-step-label]').forEach(label => { const number=Number(label.dataset.foStepLabel); label.classList.toggle('active',number===step); label.classList.toggle('complete',number<step); });
    modal.querySelector('#fo-create-back').hidden = step === 1;
    modal.querySelector('#fo-create-next').hidden = step === 4;
    modal.querySelector('#fo-create-submit').hidden = step !== 4;
  };
  const validateStep = () => {
    const fields = [...modal.querySelector(`[data-fo-step="${step}"]`).querySelectorAll('input,select,textarea')];
    const invalid = fields.find(field => !field.checkValidity());
    if (invalid) { invalid.reportValidity(); invalid.focus(); return false; }
    return true;
  };
  modal.querySelector('#fo-create-next').addEventListener('click', () => { if (validateStep()) showStep(Math.min(4,step+1)); });
  modal.querySelector('#fo-create-back').addEventListener('click', () => showStep(Math.max(1,step-1)));
  modal.querySelector('#fo-use-location').addEventListener('click', () => {
    const status=modal.querySelector('#fo-location-status');
    if (!navigator.geolocation) { status.textContent='Geolocation is unavailable.'; return; }
    status.textContent='Requesting permission…';
    navigator.geolocation.getCurrentPosition(position=>{ modal.querySelector('[name="latitude"]').value=position.coords.latitude.toFixed(6); modal.querySelector('[name="longitude"]').value=position.coords.longitude.toFixed(6); status.textContent='Current coordinates added.'; },()=>{status.textContent='Unable to detect location.';});
  });
  modal.classList.add('open');
  document.getElementById('fo-cancel-create-farm').addEventListener('click', foCloseCreateFarm);
  document.getElementById('fo-create-farm-form').addEventListener('submit', foCreateFarm);
}

function foCloseCreateFarm() {
  const modal = document.getElementById('fo-create-farm-modal');
  modal.classList.remove('open'); modal.innerHTML = '';
}

async function foCreateFarm(event) {
  event.preventDefault();
  if (!event.target.checkValidity()) {
    event.target.reportValidity();
    return;
  }
  const form = new FormData(event.target);
  const payload = {
    businessId: form.get('businessId'), code: form.get('code'), name: form.get('name'), farmType: form.get('farmType'), status: form.get('status'),
    location: { address: form.get('address'), countryCode: form.get('countryCode'), stateProvince: form.get('stateProvince') || undefined, timezone: form.get('timezone') }
  };
  if (Boolean(form.get('latitude')) !== Boolean(form.get('longitude'))) {
    const errorBox = document.getElementById('fo-create-error');
    errorBox.textContent = 'Latitude and longitude must be provided together.';
    errorBox.style.display = 'block';
    return;
  }
  if (form.get('latitude') && form.get('longitude')) payload.location.geo = { type: 'Point', coordinates: [Number(form.get('longitude')), Number(form.get('latitude'))] };
  if (form.get('openedAt')) payload.openedAt = form.get('openedAt');
  if (form.get('contactName') || form.get('contactPhone') || form.get('contactEmail')) payload.contacts = [{ name: form.get('contactName'), role: form.get('contactRole'), phone: form.get('contactPhone'), email: form.get('contactEmail') }];
  if (form.get('birdCapacity') || form.get('areaSqM')) payload.capacity = {};
  if (form.get('birdCapacity')) payload.capacity.birdCapacity = Number(form.get('birdCapacity'));
  if (form.get('areaSqM')) payload.capacity.areaSqM = Number(form.get('areaSqM'));
  const button = event.target.querySelector('[type="submit"]'); button.disabled = true;
  let farmId;
  try {
    const result = await foRequest('/farms', { method: 'POST', body: JSON.stringify(payload) });
    farmId = result.farm._id;
  } catch (error) {
    const errorBox = document.getElementById('fo-create-error');
    if (errorBox) { errorBox.textContent = error.message; errorBox.style.display = 'block'; }
    else foError(error);
    button.disabled = false;
    return;
  }
  foCloseCreateFarm();
  try {
    await foLoadFarms();
    await foSelectFarm(farmId);
    FarmSenseAdminApi.feedback('fo-feedback', 'Farm created and selected successfully.');
  } catch (error) {
    FarmSenseAdminApi.feedback('fo-feedback', `Farm was created, but its workspace could not be loaded: ${error.message}`, 'error');
  }
}

async function foLoadFarms() {
  const grid = document.getElementById('fo-farm-grid');
  grid.innerHTML = '<div class="fo-loading">Loading farms…</div>';
  try {
    const result = await foRequest('/farms?limit=100');
    foState.farms = result.data || [];
    foState.filteredFarms = foState.farms;
    foRenderFarmCards();
  } catch (error) {
    grid.innerHTML = '<div class="fo-empty">Unable to load farms.</div>';
    foError(error);
  }
}

function foFilterFarms(event) {
  const query = event.target.value.trim().toLowerCase();
  foState.filteredFarms = foState.farms.filter(farm => [farm.code, farm.name, farm.status, farm.farmType, farm.location?.address, farm.location?.stateProvince].some(value => String(value || '').toLowerCase().includes(query)));
  foRenderFarmCards();
}

function foRenderFarmCards() {
  const grid = document.getElementById('fo-farm-grid');
  const count = document.getElementById('fo-farm-count');
  if (!grid) return;
  if (count) count.textContent = `${foState.filteredFarms.length} of ${foState.farms.length} farm${foState.farms.length === 1 ? '' : 's'}`;
  if (!foState.filteredFarms.length) {
    grid.innerHTML = `<div class="fo-empty">${foState.farms.length ? 'No farms match your search.' : 'No farms have been created yet.'}</div>`;
    return;
  }
  grid.innerHTML = foState.filteredFarms.map(farm => {
    const active = String(farm._id) === String(foState.selectedFarmId);
    const location = farm.location?.address || farm.location?.stateProvince || 'Not provided';
    const capacity = farm.capacity?.birdCapacity;
    return `<button type="button" class="fo-farm-card ${active ? 'active' : ''}" data-fo-farm-id="${foEscape(farm._id)}" aria-pressed="${active}">
      <div class="fo-farm-card-head"><div><h4>${foEscape(farm.name || 'Unnamed farm')}</h4><div class="fo-farm-code">${foEscape(farm.code || 'NO CODE')}</div></div><span class="fo-badge ${foEscape(farm.status)}">${foEscape(FarmSenseAdminApi.label(farm.status || 'unknown'))}</span></div>
      <div class="fo-farm-details"><div class="fo-farm-detail"><span>Type</span><span>${foEscape(FarmSenseAdminApi.label(farm.farmType || 'Not provided'))}</span></div><div class="fo-farm-detail"><span>Location</span><span>${foEscape(location)}</span></div><div class="fo-farm-detail"><span>Bird capacity</span><span>${capacity != null ? Number(capacity).toLocaleString('en-IN') : 'Not recorded'}</span></div></div>
    </button>`;
  }).join('');
  grid.querySelectorAll('[data-fo-farm-id]').forEach(card => card.addEventListener('click', () => {
    if (!foConfirmDiscard()) return;
    foState.sourceBatchId = ''; foState.sourceSaleId = ''; foState.sourceExpenseId = '';
    foSelectFarm(card.dataset.foFarmId);
  }));
}

function foShowFarmList() {
  if (!foConfirmDiscard()) return;
  document.getElementById('fo-workspace').classList.add('fo-hidden');
  document.getElementById('fo-farm-list-screen').classList.remove('fo-hidden');
}

async function foSelectFarm(farmId) {
  foState.selectedFarmId = farmId;
  foState.selectedFarmerId = '';
  foState.sales = []; foState.expenses = []; foState.salesLoaded = false; foState.expensesLoaded = false; foState.editingSaleId = ''; foState.editingExpenseId = '';
  foRenderFarmCards();
  document.getElementById('fo-farm-list-screen').classList.toggle('fo-hidden', Boolean(farmId));
  document.getElementById('fo-workspace').classList.toggle('fo-hidden', !farmId);
  if (!farmId) return;
  const selectedFarm = foState.farms.find(farm => String(farm._id) === String(farmId));
  document.getElementById('fo-workspace-farm-name').textContent = selectedFarm?.name || 'Farm Operations';
  document.getElementById('fo-panel').innerHTML = '<div class="fo-card fo-loading">Loading farm workspace…</div>';
  try {
    const [farm, facilities, batches, farmManagers, allManagers, projects, updates, farmers] = await Promise.all([
      foRequest(`/farms/${farmId}`), foRequest(`/farms/${farmId}/facilities?limit=100`),
      foRequest(`/farms/${farmId}/batches?limit=1000`),
      foRequest(`/farms/${farmId}/managers`), foRequest('/managers?limit=100'),
      foRequest(`/farms/${farmId}/projects?limit=100`), foRequest(`/farms/${farmId}/work-updates?limit=100`),
      foRequest(`/farms/${farmId}/farmers`)
    ]);
    foState.farm = farm.farm;
    foState.facilities = facilities.data || [];
    foState.batches = batches.data || [];
    foState.managers = farmManagers.assignments || [];
    foState.allManagers = allManagers.data || [];
    foState.projects = projects.data || [];
    foState.workUpdates = updates.data || [];
    foState.farmers = farmers.farmers || [];
    foRenderContextHeading();
    foRenderPanel();
  } catch (error) { foError(error); document.getElementById('fo-panel').innerHTML = FarmSenseAdminApi.message(error.message, 'error'); }
}

function foRenderContextHeading() {
  const heading = document.getElementById('fo-context-heading');
  if (!heading || !foState.farm) return;
  const businessId = String(foState.farm.businessId?._id || foState.farm.businessId || '');
  const business = foState.businesses.find(item => String(item.id || item._id) === businessId);
  heading.innerHTML = `<div><strong>${foEscape(business?.displayName || business?.legalName || 'Organization unavailable')}</strong><small>${foEscape(foState.farm.code)} · ${foEscape(foState.farm.name)}</small></div><span class="fo-badge ${foEscape(foState.farm.status)}">${foEscape(FarmSenseAdminApi.label(foState.farm.status))}</span>`;
}

function foConfirmDiscard() {
  if (!foState?.financialFormDirty) return true;
  if (!confirm('Discard unsaved financial changes?')) return false;
  foState.financialFormDirty = false;
  return true;
}

function foActor(value) {
  if (value && typeof value === 'object') {
    const id = String(value._id || value.id || '');
    return `${foEscape(value.name || value.email || 'Admin user')}<div class="fo-ledger-note">${foEscape(value.email || id)}</div>`;
  }
  return `${foEscape(String(value || 'Unavailable'))}<div class="fo-ledger-note">Actor identity unavailable</div>`;
}

function foLedgerPager(kind, meta) {
  const page = Number(meta?.page || 1), totalPages = Math.max(1, Number(meta?.totalPages || 1)), total = Number(meta?.total || 0);
  return `<div class="fo-card-head" style="margin-top:12px"><span class="fo-help">Page ${page} of ${totalPages} · ${total.toLocaleString('en-IN')} records</span><div class="fo-actions"><button class="fo-btn secondary" type="button" data-fo-${kind}-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>Previous</button><button class="fo-btn secondary" type="button" data-fo-${kind}-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>Next</button></div></div>`;
}

function foRenderPanel() {
  if (!foState?.selectedFarmId) return;
  const renderers = { overview: foRenderOverview, batches: foRenderBatches, managers: foRenderManagers, projects: foRenderProjects, sales: foRenderSales, expenses: foRenderExpenses, claims: foRenderClaims, fees: foRenderFees };
  renderers[foState.tab]();
}

function foRenderOverview() {
  const farm = foState.farm || {};
  const location = farm.location || {};
  const capacity = farm.capacity || {};
  document.getElementById('fo-panel').innerHTML = `
    <div class="fo-grid">
      <form class="fo-card" id="fo-farm-form">
        <div class="fo-card-head"><h3>Farm Overview</h3><span class="fo-badge ${foEscape(farm.status)}">${foEscape(FarmSenseAdminApi.label(farm.status))}</span></div>
        <div class="fo-grid"><div class="fo-field"><label>Name</label><input class="fo-input" name="name" required value="${foEscape(farm.name)}"></div><div class="fo-field"><label>Code</label><input class="fo-input" disabled value="${foEscape(farm.code)}"></div>
        <div class="fo-field"><label>Status</label><select class="fo-select" name="status" ${farm.status === 'closed' ? 'disabled' : ''}>${foOptions(farm.status === 'closed' ? ['closed'] : ['planned','active','inactive'], farm.status)}</select></div><div class="fo-field"><label>Farm Type</label><select class="fo-select" name="farmType">${foOptions(['broiler','layer','breeder','mixed'], farm.farmType)}</select></div>
        <div class="fo-field"><label>Address</label><input class="fo-input" name="address" value="${foEscape(location.address)}"></div><div class="fo-field"><label>Bird Capacity</label><input class="fo-input" name="birdCapacity" type="number" min="0" value="${foEscape(capacity.birdCapacity ?? '')}"></div>
        <div class="fo-field"><label>Expected Tenure End Date</label><input class="fo-input" name="expectedTenureEndDate" type="date" value="${farm.expectedTenureEndDate ? new Date(farm.expectedTenureEndDate).toISOString().slice(0, 10) : ''}"></div><div class="fo-field"><label>Tenure Completed</label><input class="fo-input" disabled value="${farm.closedAt ? FarmSenseAdminApi.formatDate(farm.closedAt, true) : 'Not completed'}"></div></div>
        <div class="fo-actions" style="margin-top:13px"><button class="fo-btn">Save Farm Changes</button>${farm.status !== 'closed' ? '<button class="fo-btn danger" type="button" id="fo-close-tenure">Mark Farm Tenure Complete</button>' : '<span class="fo-badge closed">Farm tenure complete</span>'}</div>
      </form>
      <form class="fo-card" id="fo-facility-form">
        <div class="fo-card-head"><h3>Add Facility</h3></div>
        <div class="fo-grid"><div class="fo-field"><label>Code</label><input class="fo-input" name="code" required></div><div class="fo-field"><label>Name</label><input class="fo-input" name="name" required></div><div class="fo-field"><label>Type</label><select class="fo-select" name="type">${foOptions(['shed','house','feed_store','medicine_store','water_system','utility','office','other'])}</select></div><div class="fo-field"><label>Capacity</label><input class="fo-input" name="capacity" type="number" min="0"></div></div>
        <div class="fo-actions" style="margin-top:13px"><button class="fo-btn">Add Facility</button></div>
      </form>
    </div>
    <div class="fo-card"><div class="fo-card-head"><h3>Facilities (${foState.facilities.length})</h3></div><div class="fo-table-wrap"><table class="fo-table"><thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Status</th><th>Capacity</th><th></th></tr></thead><tbody>${foState.facilities.length ? foState.facilities.map(item => `<tr><td>${foEscape(item.code)}</td><td><strong>${foEscape(item.name)}</strong></td><td>${foEscape(FarmSenseAdminApi.label(item.type))}</td><td><span class="fo-badge ${foEscape(item.status)}">${foEscape(FarmSenseAdminApi.label(item.status))}</span></td><td>${foEscape(item.capacity ?? '—')}</td><td><button class="fo-btn danger" data-fo-delete-facility="${item._id}">Delete</button></td></tr>`).join('') : '<tr><td colspan="6" class="fo-empty">No facilities for this farm.</td></tr>'}</tbody></table></div></div>`;
  document.getElementById('fo-farm-form').addEventListener('submit', foSaveFarm);
  document.getElementById('fo-close-tenure')?.addEventListener('click', foCloseFarmTenure);
  document.getElementById('fo-facility-form').addEventListener('submit', foAddFacility);
  document.querySelectorAll('[data-fo-delete-facility]').forEach(button => button.addEventListener('click', () => foDeleteFacility(button.dataset.foDeleteFacility)));
}

async function foSaveFarm(event) {
  event.preventDefault(); const form = new FormData(event.target);
  const payload = { name: form.get('name'), farmType: form.get('farmType'), location: { address: form.get('address') }, expectedTenureEndDate: form.get('expectedTenureEndDate') || null };
  if (foState.farm.status !== 'closed') payload.status = form.get('status');
  if (form.get('birdCapacity') !== '') payload.capacity = { birdCapacity: Number(form.get('birdCapacity')) };
  await foAction('Farm updated.', async () => { const result = await foRequest(`/farms/${foState.selectedFarmId}`, { method: 'PATCH', body: JSON.stringify(payload) }); foState.farm = result.farm; foRenderOverview(); });
}

async function foCloseFarmTenure() {
  const farm = foState.farm;
  if (!confirm(`Mark the tenure for "${farm.name}" complete? This closes the farm across every dashboard and records the current time as its completion date.`)) return;
  await foAction('Farm tenure marked complete.', async () => {
    const result = await foRequest(`/farms/${foState.selectedFarmId}/close`, { method: 'POST', body: JSON.stringify({}) });
    foState.farm = result.farm;
    const listItem = foState.farms.find(item => String(item._id) === String(foState.selectedFarmId));
    if (listItem) Object.assign(listItem, result.farm);
    foRenderFarmCards();
    foRenderOverview();
  });
}

async function foAddFacility(event) {
  event.preventDefault(); const form = new FormData(event.target);
  const payload = { code: form.get('code'), name: form.get('name'), type: form.get('type') };
  if (form.get('capacity') !== '') payload.capacity = Number(form.get('capacity'));
  await foAction('Facility added.', async () => { await foRequest(`/farms/${foState.selectedFarmId}/facilities`, { method: 'POST', body: JSON.stringify(payload) }); const result = await foRequest(`/farms/${foState.selectedFarmId}/facilities?limit=100`); foState.facilities = result.data || []; foRenderOverview(); });
}

async function foDeleteFacility(id) {
  if (!confirm('Delete this facility?')) return;
  await foAction('Facility deleted.', async () => { await foRequest(`/farms/${foState.selectedFarmId}/facilities/${id}`, { method: 'DELETE' }); foState.facilities = foState.facilities.filter(item => item._id !== id); foRenderOverview(); });
}

function foFacilityName(facilityId) {
  const facility = foState.facilities.find(item => String(item._id) === String(facilityId?._id || facilityId));
  return facility ? `${facility.code} · ${facility.name}` : 'Unknown facility';
}

function foRenderBatches() {
  const canCreate = foState.facilities.length > 0 && foState.farm?.status !== 'closed';
  document.getElementById('fo-panel').innerHTML = `
    ${foState.facilities.length ? '' : '<div class="fo-warning">Create a facility in Farm & Facilities before creating a batch. Every batch must be assigned to a facility in this farm.</div>'}
    ${foState.farm?.status === 'closed' ? '<div class="fo-warning">This farm tenure is complete, so new batches cannot be created.</div>' : ''}
    <form class="fo-card" id="fo-batch-form">
      <div class="fo-card-head"><div><h3>Create Batch</h3><div class="fo-help">The batch code is generated automatically from the farm code.</div></div></div>
      <div class="fo-grid-3">
        <div class="fo-field"><label>Facility *</label><select class="fo-select" name="facilityId" required ${canCreate ? '' : 'disabled'}><option value="">Select facility…</option>${foState.facilities.map(item => `<option value="${item._id}">${foEscape(item.code)} · ${foEscape(item.name)} · ${foEscape(FarmSenseAdminApi.label(item.type))}</option>`).join('')}</select></div>
        <div class="fo-field"><label>Breed *</label><input class="fo-input" name="breed" required maxlength="120" placeholder="e.g. Cobb 430" ${canCreate ? '' : 'disabled'}></div>
        <div class="fo-field"><label>Bird Type *</label><select class="fo-select" name="birdType" required ${canCreate ? '' : 'disabled'}>${foOptions(['broiler','layer','breeder'], foState.farm?.farmType === 'mixed' ? 'broiler' : foState.farm?.farmType)}</select></div>
        <div class="fo-field"><label>Initial Bird Count *</label><input class="fo-input" name="initialBirdCount" type="number" min="1" step="1" required ${canCreate ? '' : 'disabled'}></div>
        <div class="fo-field"><label>Placement Date *</label><input class="fo-input" name="placedAt" type="date" required ${canCreate ? '' : 'disabled'}></div>
        <div class="fo-field"><label>Expected Harvest Date</label><input class="fo-input" name="expectedHarvestAt" type="date" ${canCreate ? '' : 'disabled'}></div>
        <div class="fo-field"><label>Status</label><select class="fo-select" name="status" ${canCreate ? '' : 'disabled'}>${foOptions(['planned','active'], 'planned')}</select></div>
        <div class="fo-field"><label>Source Hatchery</label><input class="fo-input" name="sourceHatchery" maxlength="160" ${canCreate ? '' : 'disabled'}></div>
      </div>
      <div class="fo-field" style="margin-top:10px"><label>Notes</label><textarea class="fo-textarea" name="notes" maxlength="1000" ${canCreate ? '' : 'disabled'}></textarea></div>
      <div class="fo-actions" style="margin-top:12px"><button class="fo-btn" ${canCreate ? '' : 'disabled'}>Create Batch</button></div>
    </form>
    <div class="fo-card"><div class="fo-card-head"><h3>Batches (${foState.batches.length})</h3><button class="fo-btn secondary" type="button" id="fo-refresh-batches">Refresh</button></div><div class="fo-table-wrap"><table class="fo-table"><thead><tr><th>Code</th><th>Facility</th><th>Breed / Type</th><th>Birds</th><th>Placement</th><th>Expected Harvest</th><th>Status</th><th>Action</th></tr></thead><tbody>${foState.batches.length ? foState.batches.map(item => `<tr><td><strong>${foEscape(item.code)}</strong></td><td>${foEscape(foFacilityName(item.facilityId))}</td><td>${foEscape(item.breed)}<div class="fo-ledger-note">${foEscape(FarmSenseAdminApi.label(item.birdType))}</div></td><td>${Number(item.currentBirdCountCached ?? item.initialBirdCount ?? 0).toLocaleString('en-IN')}<div class="fo-ledger-note">Initial: ${Number(item.initialBirdCount || 0).toLocaleString('en-IN')}</div></td><td>${FarmSenseAdminApi.formatDate(item.placedAt)}</td><td>${FarmSenseAdminApi.formatDate(item.expectedHarvestAt)}</td><td><span class="fo-badge ${foEscape(item.status)}">${foEscape(FarmSenseAdminApi.label(item.status))}</span>${item.actualHarvestAt ? `<div class="fo-ledger-note">Completed ${FarmSenseAdminApi.formatDate(item.actualHarvestAt, true)}</div>` : ''}</td><td>${['planned','active'].includes(item.status) ? `<button class="fo-btn" type="button" data-fo-complete-batch="${item._id}">Mark Completed</button>` : '<span class="fo-help">No action available</span>'}</td></tr>`).join('') : '<tr><td colspan="8" class="fo-empty">No batches have been created for this farm.</td></tr>'}</tbody></table></div></div>`;
  document.getElementById('fo-batch-form').addEventListener('submit', foCreateBatch);
  document.getElementById('fo-refresh-batches').addEventListener('click', async () => {
    await foAction('Batches refreshed.', async () => { await foReloadBatches(); foRenderBatches(); });
  });
  document.querySelectorAll('[data-fo-complete-batch]').forEach(button => button.addEventListener('click', () => foCompleteBatch(button.dataset.foCompleteBatch)));
}

async function foReloadBatches() {
  const result = await foRequest(`/farms/${foState.selectedFarmId}/batches?limit=1000`);
  foState.batches = result.data || [];
}

async function foCreateBatch(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const placedAt = form.get('placedAt');
  const expectedHarvestAt = form.get('expectedHarvestAt');
  if (expectedHarvestAt && expectedHarvestAt < placedAt) {
    foError(new Error('Expected harvest date cannot be before the placement date.'));
    return;
  }
  const payload = {
    facilityId: form.get('facilityId'),
    breed: form.get('breed').trim(),
    birdType: form.get('birdType'),
    initialBirdCount: Number(form.get('initialBirdCount')),
    placedAt,
    status: form.get('status')
  };
  for (const field of ['expectedHarvestAt', 'sourceHatchery', 'notes']) {
    const value = form.get(field)?.trim();
    if (value) payload[field] = value;
  }
  await foAction('Batch created successfully.', async () => {
    await foRequest(`/farms/${foState.selectedFarmId}/batches`, { method: 'POST', body: JSON.stringify(payload) });
    await foReloadBatches();
    foRenderBatches();
  });
}

async function foCompleteBatch(id) {
  const batch = foState.batches.find(item => String(item._id) === String(id));
  if (!batch || !['planned', 'active'].includes(batch.status)) return;
  if (!confirm(`Mark batch "${batch.code}" as completed? This records the current time as its actual harvest date and contributes it to completed-batch forecasting history.`)) return;
  await foAction('Batch marked completed.', async () => {
    await foRequest(`/farms/${foState.selectedFarmId}/batches/${id}/harvest`, { method: 'POST', body: JSON.stringify({}) });
    await foReloadBatches();
    foRenderBatches();
  });
}

function foManagerDocument(assignment) { return assignment.managerId && typeof assignment.managerId === 'object' ? assignment.managerId : {}; }
function foRenderManagers() {
  const assignedIds = new Set(foState.managers.map(item => String(foManagerDocument(item)._id || item.managerId)));
  const available = foState.allManagers.filter(item => item.status !== 'inactive');
  document.getElementById('fo-panel').innerHTML = `
    <div class="fo-grid"><form class="fo-card" id="fo-assign-manager-form"><div class="fo-card-head"><h3>Assign Existing Manager</h3></div><div class="fo-field"><label>Manager</label><select class="fo-select" name="managerId" required><option value="">Select manager…</option>${available.map(item => { const assigned = assignedIds.has(String(item._id)); return `<option value="${item._id}" ${assigned ? 'disabled' : ''}>${foEscape(item.name)} · ${foEscape(item.title || 'Manager')}${assigned ? ' · Already assigned' : ''}</option>`; }).join('')}</select></div><div class="fo-actions" style="margin-top:12px"><button class="fo-btn">Assign Manager</button></div></form>
    <form class="fo-card" id="fo-create-manager-form"><div class="fo-card-head"><h3>Create & Assign Manager</h3></div><div class="fo-grid"><div class="fo-field"><label>Name</label><input class="fo-input" name="name" required></div><div class="fo-field"><label>Title</label><input class="fo-input" name="title"></div><div class="fo-field"><label>Email</label><input class="fo-input" name="email" type="email"></div><div class="fo-field"><label>Phone</label><input class="fo-input" name="phone"></div></div><div class="fo-actions" style="margin-top:12px"><button class="fo-btn">Create & Assign</button></div></form></div>
    <div class="fo-card"><div class="fo-card-head"><h3>Current Managers (${foState.managers.length})</h3></div><div class="fo-table-wrap"><table class="fo-table"><thead><tr><th>Name</th><th>Title</th><th>Contact</th><th>Assigned</th><th></th></tr></thead><tbody>${foState.managers.length ? foState.managers.map(item => { const manager = foManagerDocument(item); return `<tr><td><strong>${foEscape(manager.name || 'Unknown manager')}</strong></td><td>${foEscape(manager.title || '—')}</td><td>${foEscape(manager.email || manager.phone || '—')}</td><td>${FarmSenseAdminApi.formatDate(item.startsAt)}</td><td><button class="fo-btn danger" data-fo-end-manager="${item._id}">End Assignment</button></td></tr>`; }).join('') : '<tr><td colspan="5" class="fo-empty">No managers currently assigned.</td></tr>'}</tbody></table></div></div>`;
  document.getElementById('fo-assign-manager-form').addEventListener('submit', foAssignManager);
  document.getElementById('fo-create-manager-form').addEventListener('submit', foCreateAndAssignManager);
  document.querySelectorAll('[data-fo-end-manager]').forEach(button => button.addEventListener('click', () => foEndManager(button.dataset.foEndManager)));
}

async function foReloadManagers() {
  const [assigned, all] = await Promise.all([foRequest(`/farms/${foState.selectedFarmId}/managers`), foRequest('/managers?limit=100')]);
  foState.managers = assigned.assignments || []; foState.allManagers = all.data || [];
}
async function foAssignManager(event) { event.preventDefault(); const managerId = new FormData(event.target).get('managerId'); await foAction('Manager assigned.', async () => { await foRequest(`/farms/${foState.selectedFarmId}/managers`, { method: 'POST', body: JSON.stringify({ managerId }) }); await foReloadManagers(); foRenderManagers(); }); }
async function foCreateAndAssignManager(event) { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); Object.keys(data).forEach(key => { if (!data[key]) delete data[key]; }); await foAction('Manager created and assigned.', async () => { const created = await foRequest('/managers', { method: 'POST', body: JSON.stringify(data) }); await foRequest(`/farms/${foState.selectedFarmId}/managers`, { method: 'POST', body: JSON.stringify({ managerId: created.manager._id }) }); await foReloadManagers(); foRenderManagers(); }); }
async function foEndManager(id) { if (!confirm('End this manager assignment?')) return; await foAction('Manager assignment ended.', async () => { await foRequest(`/farms/${foState.selectedFarmId}/managers/${id}/end`, { method: 'POST', body: JSON.stringify({}) }); await foReloadManagers(); foRenderManagers(); }); }

function foAssignedManagers() { return foState.managers.map(foManagerDocument).filter(item => item._id); }
function foRenderProjects() {
  const projects = foState.projectStatus === 'all' ? foState.projects : foState.projects.filter(item => item.status === foState.projectStatus);
  const managers = foAssignedManagers();
  document.getElementById('fo-panel').innerHTML = `
    <div class="fo-grid"><form class="fo-card" id="fo-project-form"><div class="fo-card-head"><h3>New Project</h3></div><div class="fo-grid"><div class="fo-field"><label>Title</label><input class="fo-input" name="title" required></div><div class="fo-field"><label>Priority</label><select class="fo-select" name="priority">${foOptions(['low','medium','high'],'medium')}</select></div><div class="fo-field"><label>Status</label><select class="fo-select" name="status">${foOptions(['planned','in_progress','blocked','completed','cancelled'],'planned')}</select></div><div class="fo-field"><label>Percent complete</label><input class="fo-input" name="percentComplete" type="number" min="0" max="100" step="1" value="0" required></div><div class="fo-field"><label>Start Date</label><input class="fo-input" name="startDate" type="date"></div><div class="fo-field"><label>Target Date</label><input class="fo-input" name="targetDate" type="date"></div><div class="fo-field"><label>Managers</label><select class="fo-select" name="managerIds" multiple>${managers.map(item => `<option value="${item._id}">${foEscape(item.name)}</option>`).join('')}</select></div></div><div class="fo-field" style="margin-top:10px"><label>Description</label><textarea class="fo-textarea" name="description"></textarea></div><div class="fo-actions" style="margin-top:12px"><button class="fo-btn">Create Project</button></div></form>
    <form class="fo-card" id="fo-work-form"><div class="fo-card-head"><h3>Log Work Update</h3></div><div class="fo-field"><label>Project (optional)</label><select class="fo-select" name="projectId"><option value="">General farm update</option>${foState.projects.map(item => `<option value="${item._id}">${foEscape(item.title)}</option>`).join('')}</select></div><div class="fo-field" style="margin-top:10px"><label>Work note</label><textarea class="fo-textarea" name="note" required placeholder="Describe the work completed or current progress…"></textarea></div><div class="fo-actions" style="margin-top:12px"><button class="fo-btn">Log Update</button></div></form></div>
    <div class="fo-card"><div class="fo-card-head"><h3>Projects (${projects.length})</h3><select class="fo-select" id="fo-project-filter" style="width:190px"><option value="all">All statuses</option>${['planned','in_progress','blocked','completed','cancelled'].map(value => `<option value="${value}" ${foState.projectStatus === value ? 'selected' : ''}>${FarmSenseAdminApi.label(value)}</option>`).join('')}</select></div><div class="fo-table-wrap"><table class="fo-table"><thead><tr><th>Project</th><th>Priority</th><th>Dates</th><th>Managers</th><th>Progress</th><th>Status</th><th>Action</th></tr></thead><tbody>${projects.length ? projects.map(item => { const percent = Number(item.percentComplete || 0); return `<tr><td><strong>${foEscape(item.title)}</strong><div style="color:#6b7280;margin-top:3px">${foEscape(item.description || '')}</div></td><td>${foEscape(FarmSenseAdminApi.label(item.priority))}</td><td>${FarmSenseAdminApi.formatDate(item.startDate)} → ${FarmSenseAdminApi.formatDate(item.targetDate)}</td><td>${(item.managerIds || []).map(manager => foEscape(manager.name || manager)).join(', ') || '—'}</td><td><div style="font-size:11px;font-weight:700;margin-bottom:5px">${percent}% complete</div><div style="width:130px;height:7px;background:#e5e7eb;border-radius:99px;overflow:hidden"><div style="width:${percent}%;height:100%;background:#16a34a"></div></div><input class="fo-input" style="width:90px;margin-top:7px" data-fo-project-percent="${item._id}" type="number" min="0" max="100" step="1" value="${percent}" aria-label="Percent complete for ${foEscape(item.title)}"></td><td><select class="fo-select" data-fo-project-status="${item._id}">${foOptions(['planned','in_progress','blocked','completed','cancelled'], item.status)}</select>${item.completedAt ? `<div style="color:#6b7280;font-size:11px;margin-top:5px">Completed ${FarmSenseAdminApi.formatDate(item.completedAt, true)}</div>` : ''}</td><td>${item.status === 'completed' ? '<span class="fo-badge completed">Completed</span>' : `<button class="fo-btn" data-fo-complete-project="${item._id}">Mark as Completed</button>`}</td></tr>`; }).join('') : '<tr><td colspan="7" class="fo-empty">No projects match this status.</td></tr>'}</tbody></table></div></div>
    <div class="fo-card"><div class="fo-card-head"><h3>Work Updates</h3></div><div class="fo-feed">${foState.workUpdates.length ? foState.workUpdates.map(item => `<div class="fo-feed-item"><strong>${foEscape(item.note)}</strong><div class="fo-feed-meta">${item.projectId ? `Project: ${foEscape(item.projectId.title || item.projectId)}` : 'General farm update'} · Author: ${foEscape(item.createdBy || 'Admin')} · ${FarmSenseAdminApi.formatDate(item.createdAt, true)}</div></div>`).join('') : '<div class="fo-empty">No work updates logged.</div>'}</div></div>`;
  document.getElementById('fo-project-form').addEventListener('submit', foCreateProject);
  document.getElementById('fo-work-form').addEventListener('submit', foCreateWorkUpdate);
  document.getElementById('fo-project-filter').addEventListener('change', event => { foState.projectStatus = event.target.value; foRenderProjects(); });
  document.querySelectorAll('[data-fo-project-status]').forEach(select => select.addEventListener('change', () => foUpdateProjectStatus(select.dataset.foProjectStatus, select.value)));
  document.querySelectorAll('[data-fo-project-percent]').forEach(input => input.addEventListener('change', () => foUpdateProjectPercent(input.dataset.foProjectPercent, input.value)));
  document.querySelectorAll('[data-fo-complete-project]').forEach(button => button.addEventListener('click', () => foCompleteProject(button.dataset.foCompleteProject)));
}

async function foReloadProjects() { const [projects, updates] = await Promise.all([foRequest(`/farms/${foState.selectedFarmId}/projects?limit=100`), foRequest(`/farms/${foState.selectedFarmId}/work-updates?limit=100`)]); foState.projects = projects.data || []; foState.workUpdates = updates.data || []; }
async function foCreateProject(event) { event.preventDefault(); const form = new FormData(event.target); const payload = { title: form.get('title'), description: form.get('description'), status: form.get('status'), priority: form.get('priority'), percentComplete: Number(form.get('percentComplete')), managerIds: form.getAll('managerIds') }; if (form.get('startDate')) payload.startDate = form.get('startDate'); if (form.get('targetDate')) payload.targetDate = form.get('targetDate'); await foAction('Project created.', async () => { await foRequest(`/farms/${foState.selectedFarmId}/projects`, { method: 'POST', body: JSON.stringify(payload) }); await foReloadProjects(); foRenderProjects(); }); }
async function foUpdateProjectStatus(id, status) { await foAction('Project status updated.', async () => { await foRequest(`/farms/${foState.selectedFarmId}/projects/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); await foReloadProjects(); foRenderProjects(); }); }
async function foUpdateProjectPercent(id, value) { await foAction('Project progress updated.', async () => { await foRequest(`/farms/${foState.selectedFarmId}/projects/${id}`, { method: 'PATCH', body: JSON.stringify({ percentComplete: Number(value) }) }); await foReloadProjects(); foRenderProjects(); }); }
async function foCompleteProject(id) {
  const project = foState.projects.find(item => String(item._id) === String(id));
  if (!project || project.status === 'completed') return;
  const managerNames = (project.managerIds || []).map(manager => manager && typeof manager === 'object' ? manager.name : '').filter(Boolean);
  const reportedBy = managerNames.length ? `\n\nReported by: ${managerNames.join(', ')}` : '';
  if (!confirm(`Mark “${project.title}” as completed? This will set progress to 100%.${reportedBy}`)) return;
  await foAction('Project marked as completed.', async () => {
    await foRequest(`/farms/${foState.selectedFarmId}/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed', completedAt: new Date().toISOString(), percentComplete: 100 })
    });
    await foReloadProjects();
    foRenderProjects();
  });
}
async function foCreateWorkUpdate(event) { event.preventDefault(); const form = new FormData(event.target); const payload = { note: form.get('note') }; if (form.get('projectId')) payload.projectId = form.get('projectId'); await foAction('Work update logged.', async () => { await foRequest(`/farms/${foState.selectedFarmId}/work-updates`, { method: 'POST', body: JSON.stringify(payload) }); await foReloadProjects(); foRenderProjects(); }); }

function foDecimal(value) {
  if (value && typeof value === 'object' && Object.hasOwn(value, '$numberDecimal')) return Number(value.$numberDecimal);
  return Number(value) || 0;
}
function foDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}
function foBatchName(batchId) {
  const batch = foState.batches.find(item => String(item._id) === String(batchId));
  return batch ? `${batch.code} · ${batch.breed || FarmSenseAdminApi.label(batch.birdType)}` : 'Unknown batch';
}
function foBatchOptions(selected, { allowShared = false } = {}) {
  const first = allowShared
    ? `<option value="">Select a batch or shared farm expense…</option><option value="__shared__" ${selected === '__shared__' ? 'selected' : ''}>Shared farm expense (no batch)</option>`
    : '<option value="">Select a batch…</option>';
  return first + foState.batches.map(batch => `<option value="${batch._id}" ${String(batch._id) === String(selected) ? 'selected' : ''}>${foEscape(batch.code)} · ${foEscape(batch.breed || FarmSenseAdminApi.label(batch.birdType))} · ${foEscape(FarmSenseAdminApi.label(batch.status))}</option>`).join('');
}
function foSaleAvailable(batchId, excludeSaleId = '') {
  const batch = foState.batches.find(item => String(item._id) === String(batchId));
  if (!batch) return null;
  const alreadySold = foState.sales
    .filter(item => String(item.batchId) === String(batchId) && String(item._id) !== String(excludeSaleId))
    .reduce((total, item) => total + Number(item.quantitySold || 0), 0);
  return Math.max(0, Number(batch.currentBirdCountCached ?? batch.initialBirdCount ?? 0) - alreadySold);
}
function foSalePreview() {
  const form = document.getElementById('fo-sale-form');
  if (!form) return;
  const quantity = Number(form.elements.quantitySold.value) || 0;
  const weight = Number(form.elements.avgWeightKg.value) || 0;
  const price = Number(form.elements.pricePerKg.value) || 0;
  const batchId = form.elements.batchId.value;
  const editingId = form.dataset.editingId || '';
  const revenue = quantity * weight * price;
  const available = foSaleAvailable(batchId, editingId);
  const preview = document.getElementById('fo-sale-preview');
  const availability = document.getElementById('fo-sale-availability');
  if (preview) preview.innerHTML = `Calculated revenue preview<strong>${foMoney(revenue)}</strong><div class="fo-help">The server recomputes and rounds the authoritative amount to two decimal places.</div>`;
  if (availability) availability.textContent = available === null
    ? 'Select a batch to see its estimated available quantity.'
    : `Estimated available for this entry: ${available.toLocaleString('en-IN')} birds. This uses the current flock cache and recorded sales; the server validates authoritative mortality, culls, and concurrent sales.`;
}
async function foLoadSales() {
  const filters = foState.saleFilters;
  const params = new URLSearchParams({ page: filters.page, limit: filters.limit });
  if (filters.batchId) params.set('batchId', filters.batchId);
  const [result, source] = await Promise.all([
    foRequest(`/farms/${foState.selectedFarmId}/batch-sales?${params}`),
    foState.sourceSaleId ? foRequest(`/farms/${foState.selectedFarmId}/batch-sales/${foState.sourceSaleId}`).catch(error => error.status === 404 ? null : Promise.reject(error)) : null
  ]);
  foState.sales = result.data || [];
  if (source?.sale && !foState.sales.some(item => String(item._id) === String(source.sale._id))) foState.sales.unshift(source.sale);
  foState.saleMeta = result.meta || {};
  foState.salesLoaded = true;
  if (foState.tab === 'sales') foRenderSales();
}
function foRenderSales() {
  const panel = document.getElementById('fo-panel');
  if (!foState.salesLoaded) {
    panel.innerHTML = '<div class="fo-card fo-loading">Loading sales ledger…</div>';
    foLoadSales().catch(error => { foError(error); panel.innerHTML = FarmSenseAdminApi.message(`Sales could not be loaded: ${error.message}`, 'error'); });
    return;
  }
  const editing = foState.sales.find(item => String(item._id) === String(foState.editingSaleId));
  const selectedBatch = editing?.batchId || foState.sourceBatchId || '';
  const requestedSaleFound = !foState.sourceSaleId || foState.sales.some(item => String(item._id) === String(foState.sourceSaleId));
  const saleRows = [...foState.sales].filter(item => {
    const search = foState.saleFilters.search.trim().toLowerCase();
    return !search || `${item.buyerName || ''} ${item.notes || ''} ${foBatchName(item.batchId)}`.toLowerCase().includes(search);
  }).sort((a, b) => {
    if (foState.saleFilters.sort === 'revenue_desc') return foDecimal(b.revenue) - foDecimal(a.revenue);
    if (foState.saleFilters.sort === 'revenue_asc') return foDecimal(a.revenue) - foDecimal(b.revenue);
    return (new Date(a.saleDate) - new Date(b.saleDate)) * (foState.saleFilters.sort === 'date_asc' ? 1 : -1);
  });
  panel.innerHTML = `
    ${requestedSaleFound ? '' : '<div class="fo-warning">The requested sale record was not found in this farm. It may have been deleted or the link may be outside your authorized tenant scope.</div>'}
    ${foState.batches.length ? '' : '<div class="fo-warning">This farm has no canonical batches. Create a batch before recording a sale.</div>'}
    <form class="fo-card" id="fo-sale-form" data-editing-id="${editing?._id || ''}">
      <div class="fo-card-head"><div><h3>${editing ? 'Edit Sale Event' : 'Record Sale Event'}</h3><div class="fo-help">Each row is one complete or partial sale. A batch may have multiple sale events.</div></div>${editing ? '<button class="fo-btn secondary" type="button" id="fo-cancel-sale-edit">Cancel Edit</button>' : ''}</div>
      <div class="fo-grid-3">
        <div class="fo-field"><label>Batch</label><select class="fo-select" name="${editing ? 'batchIdDisplay' : 'batchId'}" required ${editing ? 'disabled' : ''}>${foBatchOptions(selectedBatch)}</select>${editing ? `<input type="hidden" name="batchId" value="${foEscape(String(selectedBatch))}">` : ''}<div class="fo-help" id="fo-sale-availability"></div></div>
        <div class="fo-field"><label>Sale Date</label><input class="fo-input" name="saleDate" type="date" required value="${foDateInput(editing?.saleDate)}"></div>
        <div class="fo-field"><label>Quantity Sold (birds)</label><input class="fo-input" name="quantitySold" type="number" min="1" step="1" required value="${editing?.quantitySold ?? ''}"></div>
        <div class="fo-field"><label>Average Weight (kg/bird)</label><input class="fo-input" name="avgWeightKg" type="number" min="0.001" step="0.001" required value="${editing ? foDecimal(editing.avgWeightKg).toFixed(3) : ''}"></div>
        <div class="fo-field"><label>Price per kg</label><input class="fo-input" name="pricePerKg" type="number" min="0" step="0.01" required value="${editing ? foDecimal(editing.pricePerKg).toFixed(2) : ''}"></div>
        <div class="fo-preview" id="fo-sale-preview"></div>
        <div class="fo-field"><label>Buyer Name (optional)</label><input class="fo-input" name="buyerName" maxlength="160" value="${foEscape(editing?.buyerName || '')}"></div>
        <div class="fo-field" style="grid-column:span 2"><label>Notes (optional)</label><input class="fo-input" name="notes" maxlength="500" value="${foEscape(editing?.notes || '')}" placeholder="Invoice or settlement reference"></div>
      </div>
      <div class="fo-actions" style="margin-top:12px"><button class="fo-btn" ${foState.batches.length ? '' : 'disabled'}>${editing ? 'Save Sale Changes' : 'Record Sale'}</button></div>
    </form>
    <div class="fo-card"><div class="fo-grid-3"><div class="fo-field"><label>Batch filter</label><select class="fo-select" id="fo-sale-filter-batch"><option value="">All batches</option>${foState.batches.map(batch => `<option value="${batch._id}" ${String(batch._id) === String(foState.saleFilters.batchId) ? 'selected' : ''}>${foEscape(batch.code)}</option>`).join('')}</select></div><div class="fo-field"><label>Buyer, batch, or notes</label><input class="fo-input" id="fo-sale-search" value="${foEscape(foState.saleFilters.search)}" placeholder="Search loaded page"></div><div class="fo-field"><label>Sort</label><select class="fo-select" id="fo-sale-sort">${[['date_desc','Newest sale first'],['date_asc','Oldest sale first'],['revenue_desc','Highest revenue'],['revenue_asc','Lowest revenue']].map(([value,label]) => `<option value="${value}" ${foState.saleFilters.sort === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div></div></div>
    <div class="fo-card"><div class="fo-card-head"><div><h3>Sales Ledger (${foState.sales.length})</h3><div class="fo-help">Revenue is authoritative server-calculated quantity × average weight × price/kg.</div></div><button class="fo-btn secondary" type="button" id="fo-refresh-sales">Refresh</button></div>
      <div class="fo-table-wrap"><table class="fo-table"><thead><tr><th>Date</th><th>Batch</th><th>Birds</th><th>Avg Weight</th><th>Price/kg</th><th>Revenue</th><th>Buyer / Notes</th><th>Actor / Audit</th><th>Actions</th></tr></thead><tbody>${saleRows.length ? saleRows.map(item => `<tr id="fo-sale-${item._id}" class="${String(item._id) === String(foState.sourceSaleId) ? 'fo-source-highlight' : ''}"><td>${FarmSenseAdminApi.formatDate(item.saleDate)}</td><td><strong>${foEscape(foBatchName(item.batchId))}</strong></td><td>${Number(item.quantitySold || 0).toLocaleString('en-IN')}</td><td>${foDecimal(item.avgWeightKg).toFixed(3)} kg</td><td>${foMoney(foDecimal(item.pricePerKg))}</td><td><strong>${foMoney(foDecimal(item.revenue))}</strong></td><td>${foEscape(item.buyerName || '—')}<div class="fo-ledger-note">${foEscape(item.notes || '')}</div></td><td>${foActor(item.createdBy)}<div class="fo-ledger-note">Created ${FarmSenseAdminApi.formatDate(item.createdAt, true)} · Updated ${FarmSenseAdminApi.formatDate(item.updatedAt, true)} · <span class="fo-badge">${foEscape(FarmSenseAdminApi.label(item.source || 'manual'))}</span></div></td><td><div class="fo-action-stack"><button class="fo-btn secondary" type="button" data-fo-edit-sale="${item._id}">Edit</button><button class="fo-btn danger" type="button" data-fo-delete-sale="${item._id}">Delete</button></div></td></tr>`).join('') : '<tr><td colspan="9" class="fo-empty">No sales match this page and filter. Revenue remains based only on recorded sale events.</td></tr>'}</tbody></table></div>
      ${foLedgerPager('sale', foState.saleMeta)}
    </div>`;
  const form = document.getElementById('fo-sale-form');
  form.addEventListener('submit', foSaveSale);
  ['batchId','quantitySold','avgWeightKg','pricePerKg'].forEach(name => form.elements[name]?.addEventListener('input', foSalePreview));
  form.addEventListener('input', () => { foState.financialFormDirty = true; });
  document.getElementById('fo-cancel-sale-edit')?.addEventListener('click', () => { if (!foConfirmDiscard()) return; foState.editingSaleId = ''; foRenderSales(); });
  document.getElementById('fo-refresh-sales').addEventListener('click', () => { if (!foConfirmDiscard()) return; foState.salesLoaded = false; foState.editingSaleId = ''; foRenderSales(); });
  document.getElementById('fo-sale-filter-batch').addEventListener('change', event => { if (!foConfirmDiscard()) return; foState.saleFilters.batchId = event.target.value; foState.saleFilters.page = 1; foState.salesLoaded = false; foRenderSales(); });
  document.getElementById('fo-sale-search').addEventListener('input', FarmSenseAdminApi.debounce(event => { foState.saleFilters.search = event.target.value; foRenderSales(); }, 180));
  document.getElementById('fo-sale-sort').addEventListener('change', event => { if (!foConfirmDiscard()) return; foState.saleFilters.sort = event.target.value; foRenderSales(); });
  document.querySelectorAll('[data-fo-sale-page]').forEach(button => button.addEventListener('click', () => { if (!foConfirmDiscard()) return; foState.saleFilters.page = Number(button.dataset.foSalePage); foState.salesLoaded = false; foRenderSales(); }));
  document.querySelectorAll('[data-fo-edit-sale]').forEach(button => button.addEventListener('click', () => { if (!foConfirmDiscard()) return; foState.editingSaleId = button.dataset.foEditSale; foRenderSales(); document.getElementById('fo-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  document.querySelectorAll('[data-fo-delete-sale]').forEach(button => button.addEventListener('click', () => foDeleteSale(button.dataset.foDeleteSale)));
  foSalePreview();
  document.getElementById(`fo-sale-${foState.sourceSaleId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
async function foSaveSale(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const payload = { batchId: data.get('batchId'), saleDate: data.get('saleDate'), quantitySold: Number(data.get('quantitySold')), avgWeightKg: data.get('avgWeightKg'), pricePerKg: data.get('pricePerKg'), buyerName: data.get('buyerName')?.trim(), notes: data.get('notes')?.trim() };
  Object.keys(payload).forEach(key => { if (payload[key] === '') delete payload[key]; });
  const id = form.dataset.editingId;
  await foAction(id ? 'Sale event updated.' : 'Sale event recorded.', async () => {
    await foRequest(`/farms/${foState.selectedFarmId}/batch-sales${id ? `/${id}` : ''}`, { method: id ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
    foState.editingSaleId = '';
    foState.financialFormDirty = false;
    await foLoadSales();
  });
}
async function foDeleteSale(id) {
  if (!foConfirmDiscard()) return;
  if (!confirm('Delete this sale event? This removes its revenue from future financial totals.')) return;
  await foAction('Sale event deleted.', async () => { await foRequest(`/farms/${foState.selectedFarmId}/batch-sales/${id}`, { method: 'DELETE' }); foState.editingSaleId = ''; await foLoadSales(); });
}

async function foLoadExpenses() {
  const filters = foState.expenseFilters;
  const params = new URLSearchParams({ page: filters.page, limit: filters.limit });
  if (filters.batchId) params.set('batchId', filters.batchId);
  if (filters.scope === 'shared') params.set('shared', 'true');
  if (filters.category) params.set('category', filters.category);
  const [result, source] = await Promise.all([
    foRequest(`/farms/${foState.selectedFarmId}/batch-expenses?${params}`),
    foState.sourceExpenseId ? foRequest(`/farms/${foState.selectedFarmId}/batch-expenses/${foState.sourceExpenseId}`).catch(error => error.status === 404 ? null : Promise.reject(error)) : null
  ]);
  foState.expenses = result.data || [];
  if (source?.expense && !foState.expenses.some(item => String(item._id) === String(source.expense._id))) foState.expenses.unshift(source.expense);
  foState.expenseMeta = result.meta || {};
  foState.expensesLoaded = true;
  if (foState.tab === 'expenses') foRenderExpenses();
}
function foRenderExpenses() {
  const panel = document.getElementById('fo-panel');
  if (!foState.expensesLoaded) {
    panel.innerHTML = '<div class="fo-card fo-loading">Loading expenses ledger…</div>';
    foLoadExpenses().catch(error => { foError(error); panel.innerHTML = FarmSenseAdminApi.message(`Expenses could not be loaded: ${error.message}`, 'error'); });
    return;
  }
  const editing = foState.expenses.find(item => String(item._id) === String(foState.editingExpenseId));
  const scope = editing ? (editing.batchId || '__shared__') : (foState.sourceBatchId || '');
  const requestedExpenseFound = !foState.sourceExpenseId || foState.expenses.some(item => String(item._id) === String(foState.sourceExpenseId));
  const expenseRows = [...foState.expenses].filter(item => {
    const search = foState.expenseFilters.search.trim().toLowerCase();
    if (foState.expenseFilters.scope === 'direct' && !item.batchId) return false;
    return !search || `${item.description || ''} ${item.category || ''} ${item.batchId ? foBatchName(item.batchId) : 'shared'}`.toLowerCase().includes(search);
  }).sort((a, b) => {
    if (foState.expenseFilters.sort === 'amount_desc') return foDecimal(b.amount) - foDecimal(a.amount);
    if (foState.expenseFilters.sort === 'amount_asc') return foDecimal(a.amount) - foDecimal(b.amount);
    return (new Date(a.expenseDate) - new Date(b.expenseDate)) * (foState.expenseFilters.sort === 'date_asc' ? 1 : -1);
  });
  panel.innerHTML = `
    ${requestedExpenseFound ? '' : '<div class="fo-warning">The requested expense record was not found in this farm. It may have been deleted or the link may be outside your authorized tenant scope.</div>'}
    <form class="fo-card" id="fo-expense-form" data-editing-id="${editing?._id || ''}">
      <div class="fo-card-head"><div><h3>${editing ? 'Edit Expense' : 'Record Expense'}</h3><div class="fo-help">Choose a batch for a directly attributable cost. Use shared farm expense only when no honest batch attribution exists.</div></div>${editing ? '<button class="fo-btn secondary" type="button" id="fo-cancel-expense-edit">Cancel Edit</button>' : ''}</div>
      <div class="fo-grid-3">
        <div class="fo-field"><label>Expense Scope</label><select class="fo-select" name="batchId" required>${foBatchOptions(scope, { allowShared: true })}</select><div class="fo-help" id="fo-expense-scope-help">Select a scope explicitly; a blank selection cannot be submitted.</div></div>
        <div class="fo-field"><label>Category</label><select class="fo-select" name="category" required>${['feed','chicks','labor','medicine_vaccines','utilities','transport','other'].map(value => `<option value="${value}" ${editing?.category === value ? 'selected' : ''}>${foEscape(FarmSenseAdminApi.label(value))}</option>`).join('')}</select></div>
        <div class="fo-field"><label>Amount</label><input class="fo-input" name="amount" type="number" min="0.01" step="0.01" required value="${editing ? foDecimal(editing.amount).toFixed(2) : ''}"></div>
        <div class="fo-field"><label>Expense Date</label><input class="fo-input" name="expenseDate" type="date" required value="${foDateInput(editing?.expenseDate)}"></div>
        <div class="fo-field" style="grid-column:span 2"><label>Description</label><input class="fo-input" name="description" required maxlength="500" value="${foEscape(editing?.description || '')}" placeholder="Vendor, invoice, or reason for expense"></div>
      </div>
      <div class="fo-actions" style="margin-top:12px"><button class="fo-btn">${editing ? 'Save Expense Changes' : 'Record Expense'}</button></div>
    </form>
    <div class="fo-warning">Shared farm expenses are included in farm totals but are not silently allocated to individual batch profitability.</div>
    <div class="fo-card"><div class="fo-grid-3"><div class="fo-field"><label>Scope</label><select class="fo-select" id="fo-expense-filter-scope"><option value="">Direct and shared</option><option value="direct" ${foState.expenseFilters.scope === 'direct' ? 'selected' : ''}>Direct batch only</option><option value="shared" ${foState.expenseFilters.scope === 'shared' ? 'selected' : ''}>Shared farm only</option></select></div><div class="fo-field"><label>Category</label><select class="fo-select" id="fo-expense-filter-category"><option value="">All categories</option>${['feed','chicks','labor','medicine_vaccines','utilities','transport','other'].map(value => `<option value="${value}" ${foState.expenseFilters.category === value ? 'selected' : ''}>${foEscape(FarmSenseAdminApi.label(value))}</option>`).join('')}</select></div><div class="fo-field"><label>Batch</label><select class="fo-select" id="fo-expense-filter-batch"><option value="">All batches</option>${foState.batches.map(batch => `<option value="${batch._id}" ${String(batch._id) === String(foState.expenseFilters.batchId) ? 'selected' : ''}>${foEscape(batch.code)}</option>`).join('')}</select></div><div class="fo-field"><label>Description, category, or batch</label><input class="fo-input" id="fo-expense-search" value="${foEscape(foState.expenseFilters.search)}" placeholder="Search loaded page"></div><div class="fo-field"><label>Sort</label><select class="fo-select" id="fo-expense-sort">${[['date_desc','Newest expense first'],['date_asc','Oldest expense first'],['amount_desc','Highest amount'],['amount_asc','Lowest amount']].map(([value,label]) => `<option value="${value}" ${foState.expenseFilters.sort === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div></div></div>
    <div class="fo-card"><div class="fo-card-head"><div><h3>Expenses Ledger (${foState.expenses.length})</h3><div class="fo-help">All amounts are admin-entered records; no cost is inferred from operational consumption.</div></div><button class="fo-btn secondary" type="button" id="fo-refresh-expenses">Refresh</button></div>
      <div class="fo-table-wrap"><table class="fo-table"><thead><tr><th>Date</th><th>Scope</th><th>Category</th><th>Description</th><th>Amount</th><th>Actor / Audit</th><th>Actions</th></tr></thead><tbody>${expenseRows.length ? expenseRows.map(item => `<tr id="fo-expense-${item._id}" class="${String(item._id) === String(foState.sourceExpenseId) ? 'fo-source-highlight' : ''}"><td>${FarmSenseAdminApi.formatDate(item.expenseDate)}</td><td>${item.batchId ? `<strong>${foEscape(foBatchName(item.batchId))}</strong>` : '<span class="fo-badge pending">Shared farm expense</span>'}</td><td>${foEscape(FarmSenseAdminApi.label(item.category))}</td><td>${foEscape(item.description)}</td><td><strong>${foMoney(foDecimal(item.amount))}</strong></td><td>${foActor(item.createdBy)}<div class="fo-ledger-note">Created ${FarmSenseAdminApi.formatDate(item.createdAt, true)} · Updated ${FarmSenseAdminApi.formatDate(item.updatedAt, true)} · <span class="fo-badge">${foEscape(FarmSenseAdminApi.label(item.source || 'manual'))}</span></div></td><td><div class="fo-action-stack"><button class="fo-btn secondary" type="button" data-fo-edit-expense="${item._id}">Edit</button><button class="fo-btn danger" type="button" data-fo-delete-expense="${item._id}">Delete</button></div></td></tr>`).join('') : '<tr><td colspan="7" class="fo-empty">No expenses match this page and filter. Cost and profit remain based only on recorded expenses.</td></tr>'}</tbody></table></div>
      ${foLedgerPager('expense', foState.expenseMeta)}
    </div>`;
  const expenseForm = document.getElementById('fo-expense-form');
  expenseForm.addEventListener('submit', foSaveExpense);
  expenseForm.elements.batchId.addEventListener('change', foExpenseScopeHelp);
  expenseForm.addEventListener('input', () => { foState.financialFormDirty = true; });
  document.getElementById('fo-cancel-expense-edit')?.addEventListener('click', () => { if (!foConfirmDiscard()) return; foState.editingExpenseId = ''; foRenderExpenses(); });
  document.getElementById('fo-refresh-expenses').addEventListener('click', () => { if (!foConfirmDiscard()) return; foState.expensesLoaded = false; foState.editingExpenseId = ''; foRenderExpenses(); });
  document.getElementById('fo-expense-filter-scope').addEventListener('change', event => { if (!foConfirmDiscard()) return; foState.expenseFilters.scope = event.target.value; foState.expenseFilters.page = 1; foState.expensesLoaded = false; foRenderExpenses(); });
  document.getElementById('fo-expense-filter-category').addEventListener('change', event => { if (!foConfirmDiscard()) return; foState.expenseFilters.category = event.target.value; foState.expenseFilters.page = 1; foState.expensesLoaded = false; foRenderExpenses(); });
  document.getElementById('fo-expense-filter-batch').addEventListener('change', event => { if (!foConfirmDiscard()) return; foState.expenseFilters.batchId = event.target.value; foState.expenseFilters.page = 1; foState.expensesLoaded = false; foRenderExpenses(); });
  document.getElementById('fo-expense-search').addEventListener('input', FarmSenseAdminApi.debounce(event => { foState.expenseFilters.search = event.target.value; foRenderExpenses(); }, 180));
  document.getElementById('fo-expense-sort').addEventListener('change', event => { if (!foConfirmDiscard()) return; foState.expenseFilters.sort = event.target.value; foRenderExpenses(); });
  document.querySelectorAll('[data-fo-expense-page]').forEach(button => button.addEventListener('click', () => { if (!foConfirmDiscard()) return; foState.expenseFilters.page = Number(button.dataset.foExpensePage); foState.expensesLoaded = false; foRenderExpenses(); }));
  document.querySelectorAll('[data-fo-edit-expense]').forEach(button => button.addEventListener('click', () => { if (!foConfirmDiscard()) return; foState.editingExpenseId = button.dataset.foEditExpense; foRenderExpenses(); document.getElementById('fo-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  document.querySelectorAll('[data-fo-delete-expense]').forEach(button => button.addEventListener('click', () => foDeleteExpense(button.dataset.foDeleteExpense)));
  foExpenseScopeHelp();
  document.getElementById(`fo-expense-${foState.sourceExpenseId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function foExpenseScopeHelp() {
  const value = document.getElementById('fo-expense-form')?.elements.batchId.value;
  const help = document.getElementById('fo-expense-scope-help');
  if (!help) return;
  help.textContent = value === '__shared__'
    ? 'Shared scope selected: this cost affects farm totals and will not be assigned to a batch.'
    : value ? 'Batch scope selected: this cost contributes to that batch’s direct expenses.' : 'Select a scope explicitly; a blank selection cannot be submitted.';
}
async function foSaveExpense(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const scope = data.get('batchId');
  const payload = { batchId: scope === '__shared__' ? null : scope, category: data.get('category'), amount: data.get('amount'), expenseDate: data.get('expenseDate'), description: data.get('description').trim() };
  const id = form.dataset.editingId;
  await foAction(id ? 'Expense updated.' : 'Expense recorded.', async () => {
    await foRequest(`/farms/${foState.selectedFarmId}/batch-expenses${id ? `/${id}` : ''}`, { method: id ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
    foState.editingExpenseId = '';
    foState.financialFormDirty = false;
    await foLoadExpenses();
  });
}
async function foDeleteExpense(id) {
  if (!foConfirmDiscard()) return;
  if (!confirm('Delete this expense? This removes it from future cost and profit totals.')) return;
  await foAction('Expense deleted.', async () => { await foRequest(`/farms/${foState.selectedFarmId}/batch-expenses/${id}`, { method: 'DELETE' }); foState.editingExpenseId = ''; await foLoadExpenses(); });
}

async function foRenderClaims() {
  const panel = document.getElementById('fo-panel');
  panel.innerHTML = '<div class="fo-card fo-empty">Loading compensation claims…</div>';
  try {
    const result = await foRequest(`/compensation-claims?farmId=${encodeURIComponent(foState.selectedFarmId)}&limit=100`);
    foState.claims = result.data || [];
    panel.innerHTML = `<div id="fo-claim-feedback"></div><div class="fo-card"><div class="fo-card-head"><div><h3>Compensation Claim Review</h3><div style="color:#6b7280;margin-top:3px">Claims are submitted by actively assigned farmers against canonical batches. Only valid status transitions are offered.</div></div></div><div class="fo-table-wrap"><table class="fo-table"><thead><tr><th>Claim</th><th>Farmer</th><th>Batch</th><th>Service Date</th><th>Description</th><th>Amount</th><th>Status</th><th>Review</th></tr></thead><tbody>${foState.claims.length ? foState.claims.map(item => `<tr><td><strong>${foEscape(item.claimNumber)}</strong></td><td>${foEscape(item.farmerId?.name || 'Unknown farmer')}</td><td>${foEscape(item.batchId?.code || 'Unknown batch')}</td><td>${FarmSenseAdminApi.formatDate(item.serviceDate)}</td><td>${foEscape(item.description)}</td><td>${foMoney(item.amount?.$numberDecimal || item.amount, item.currency || 'INR')}</td><td><span class="fo-badge ${foEscape(item.status)}">${foEscape(FarmSenseAdminApi.label(item.status))}</span><div style="color:#6b7280;margin-top:3px">${foEscape(item.reviewerNote || '')}</div></td><td>${item.status === 'pending' ? `<div class="fo-actions"><button class="fo-btn" data-fo-claim="${item._id}" data-fo-claim-status="approved">Approve</button><button class="fo-btn danger" data-fo-claim="${item._id}" data-fo-claim-status="rejected">Reject</button></div>` : item.status === 'approved' ? `<button class="fo-btn" data-fo-claim="${item._id}" data-fo-claim-status="paid">Mark Paid</button>` : 'Complete'}</td></tr>`).join('') : '<tr><td colspan="8" class="fo-empty">No compensation claims for this farm.</td></tr>'}</tbody></table></div></div>`;
    panel.querySelectorAll('[data-fo-claim]').forEach(button => button.addEventListener('click', () => foReviewClaim(button.dataset.foClaim, button.dataset.foClaimStatus)));
  } catch (error) {
    panel.innerHTML = `<div class="fo-card fo-empty"><h3>${error.status === 403 ? 'Access denied' : 'Could not load compensation claims'}</h3><p>${foEscape(error.message)}</p></div>`;
  }
}

async function foReviewClaim(id, status) {
  const reviewerNote = status === 'rejected' ? prompt('Reason for rejection (required):') : (prompt('Reviewer note (optional):', '') || '');
  if (status === 'rejected' && !reviewerNote) return;
  const paymentReference = status === 'paid' ? prompt('Payment reference (required):') : '';
  if (status === 'paid' && !paymentReference) return;
  await foAction(`Claim marked ${status}.`, async () => {
    await foRequest(`/compensation-claims/${id}/review`, { method: 'PATCH', body: JSON.stringify({ status, reviewerNote, paymentReference }) });
    await foRenderClaims();
  });
}

function foRenderFees() {
  document.getElementById('fo-panel').innerHTML = `
    <div class="fo-card"><div class="fo-card-head"><div><h3>Farmer Fees</h3><div style="color:#6b7280;margin-top:3px">Choose an actively assigned farmer for this farm.</div></div></div><div class="fo-field"><label>Farmer</label><select class="fo-select" id="fo-farmer-select"><option value="">Select farmer…</option>${foState.farmers.map(item => `<option value="${item.farmerId}" ${item.farmerId === foState.selectedFarmerId ? 'selected' : ''}>${foEscape(item.name || item.email)} · ${foEscape(item.email || item.phone || 'No contact')}</option>`).join('')}</select></div></div>
    <div id="fo-fee-content">${foState.farmers.length ? '<div class="fo-card fo-empty">Select a farmer to view their ledger.</div>' : '<div class="fo-card fo-empty">No active farmers are assigned to this farm.</div>'}</div>`;
  document.getElementById('fo-farmer-select').addEventListener('change', event => foSelectFarmer(event.target.value));
  if (foState.selectedFarmerId && foState.feeSummary) foRenderFeeContent();
}

async function foSelectFarmer(farmerId) {
  foState.selectedFarmerId = farmerId;
  if (!farmerId) { foState.feeSummary = null; foState.fees = []; foRenderFees(); return; }
  document.getElementById('fo-fee-content').innerHTML = '<div class="fo-card fo-loading">Loading farmer ledger…</div>';
  try { const [summary, fees] = await Promise.all([foRequest(`/farmer-fees/summary?farmerId=${encodeURIComponent(farmerId)}`), foRequest(`/farmer-fees?farmerId=${encodeURIComponent(farmerId)}&limit=100`)]); foState.feeSummary = summary; foState.fees = fees.data || []; foRenderFeeContent(); } catch (error) { foError(error); }
}

function foRenderFeeContent() {
  const summary = foState.feeSummary || {};
  const target = document.getElementById('fo-fee-content'); if (!target) return;
  target.innerHTML = `
    <div class="fo-grid-3"><div class="fo-stat">Pending<strong>${foMoney(summary.totalPending)}</strong></div><div class="fo-stat">Paid<strong>${foMoney(summary.totalPaid)}</strong></div><div class="fo-stat">Ledger entries<strong>${Number(summary.count) || 0}</strong></div></div>
    <form class="fo-card" id="fo-fee-form" style="margin-top:14px"><div class="fo-card-head"><h3>Add Fee</h3></div><div class="fo-grid-3"><div class="fo-field"><label>Amount</label><input class="fo-input" name="amount" type="number" min="0.01" step="0.01" required></div><div class="fo-field"><label>Currency</label><input class="fo-input" name="currency" value="INR" required></div><div class="fo-field"><label>Due Date</label><input class="fo-input" name="dueDate" type="date"></div></div><div class="fo-field" style="margin-top:10px"><label>Description</label><input class="fo-input" name="description" required placeholder="June batch settlement"></div><div class="fo-actions" style="margin-top:12px"><button class="fo-btn">Add Pending Fee</button></div></form>
    <div class="fo-card"><div class="fo-card-head"><h3>Fee Ledger</h3></div><div class="fo-table-wrap"><table class="fo-table"><thead><tr><th>Description</th><th>Amount</th><th>Due</th><th>Status</th><th>Payment</th></tr></thead><tbody>${foState.fees.length ? foState.fees.map(item => `<tr><td><strong>${foEscape(item.description)}</strong><div style="color:#6b7280;margin-top:3px">${foEscape(item.paymentReference || '')}</div></td><td>${foMoney(item.amount, item.currency)}</td><td>${FarmSenseAdminApi.formatDate(item.dueDate)}</td><td><span class="fo-badge ${foEscape(item.status)}">${foEscape(FarmSenseAdminApi.label(item.status))}</span></td><td>${item.status === 'pending' ? `<div class="fo-actions"><input class="fo-input" style="width:150px" data-fo-payment-ref="${item._id}" placeholder="Payment reference"><button class="fo-btn" data-fo-mark-paid="${item._id}">Mark Paid</button></div>` : FarmSenseAdminApi.formatDate(item.paidAt)}</td></tr>`).join('') : '<tr><td colspan="5" class="fo-empty">No fees recorded for this farmer.</td></tr>'}</tbody></table></div></div>`;
  document.getElementById('fo-fee-form').addEventListener('submit', foAddFee);
  document.querySelectorAll('[data-fo-mark-paid]').forEach(button => button.addEventListener('click', () => foMarkPaid(button.dataset.foMarkPaid)));
}

async function foReloadFees() { const [summary, fees] = await Promise.all([foRequest(`/farmer-fees/summary?farmerId=${encodeURIComponent(foState.selectedFarmerId)}`), foRequest(`/farmer-fees?farmerId=${encodeURIComponent(foState.selectedFarmerId)}&limit=100`)]); foState.feeSummary = summary; foState.fees = fees.data || []; }
async function foAddFee(event) { event.preventDefault(); const form = new FormData(event.target); const payload = { farmerId: foState.selectedFarmerId, farmId: foState.selectedFarmId, amount: Number(form.get('amount')), currency: form.get('currency'), description: form.get('description') }; if (form.get('dueDate')) payload.dueDate = form.get('dueDate'); await foAction('Fee added.', async () => { await foRequest('/farmer-fees', { method: 'POST', body: JSON.stringify(payload) }); await foReloadFees(); foRenderFeeContent(); }); }
async function foMarkPaid(id) { const input = document.querySelector(`[data-fo-payment-ref="${id}"]`); await foAction('Fee marked paid.', async () => { await foRequest(`/farmer-fees/${id}/mark-paid`, { method: 'POST', body: JSON.stringify({ paymentReference: input?.value.trim() || '' }) }); await foReloadFees(); foRenderFeeContent(); }); }

async function foAction(successMessage, operation) {
  FarmSenseAdminApi.clearFeedback('fo-feedback');
  try { await operation(); FarmSenseAdminApi.feedback('fo-feedback', successMessage); }
  catch (error) { foError(error); }
}
function foError(error) { FarmSenseAdminApi.feedback('fo-feedback', error.message || 'Unexpected request error.', 'error'); }
