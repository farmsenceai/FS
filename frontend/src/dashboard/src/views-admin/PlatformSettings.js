window.metaPlatformSettings = { title: 'Platform Settings', subtitle: 'Configure platform-wide behavior and defaults.' };

const APS_FIELDS = [
  ['requireBusinessApproval', 'Account Approvals', 'Require manual approval for new businesses', 'New business signups stay pending until an admin approves them.'],
  ['requireFarmerApproval', 'Account Approvals', 'Require manual approval for new farmers', 'New farmer signups stay pending until an admin approves them.'],
  ['autoSuspendPaymentFailures', 'Account Approvals', 'Auto-suspend on repeated payment failure', 'Suspend an account automatically after repeated payment failures.'],
  ['monthlyPayoutCycle', 'Payouts', 'Monthly payout cycle', 'Run farmer payouts on a monthly schedule.'],
  ['holdPayoutsForBatchReview', 'Payouts', 'Hold payouts pending batch closure review', 'Delay payout release until batch completion data is confirmed.'],
  ['emailAdminsOnSignup', 'Notifications', 'Email admins on new signup', 'Notify administrators when a new account is created.'],
  ['emailAdminsOnHealthEvents', 'Notifications', 'Email admins on flagged health events', 'Notify administrators about flagged health or mortality events.']
];

function injectPlatformSettingsStyles() {
  if (document.getElementById('aps-styles')) return;
  const style = document.createElement('style'); style.id = 'aps-styles';
  style.textContent = `.aps-scrollable{padding:20px;background:#f5f6fa;min-height:100%;font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a2e}.aps-card{background:#fff;border-radius:10px;border:1px solid #e8eaf0;overflow:hidden;margin-bottom:16px}.aps-card-header{padding:13px 16px 10px;border-bottom:1px solid #f3f4f6}.aps-card-title{font-weight:700}.aps-toggle-row{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:1px solid #f9fafb}.aps-toggle-title{font-size:12.5px;font-weight:700;color:#111827}.aps-toggle-desc{font-size:11px;color:#9ca3af;margin-top:2px}.aps-switch{position:relative;width:38px;height:22px}.aps-switch input{opacity:0;width:0;height:0}.aps-slider{position:absolute;inset:0;background:#e5e7eb;border-radius:22px;cursor:pointer}.aps-slider:before{position:absolute;content:'';height:16px;width:16px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s}.aps-switch input:checked+.aps-slider{background:#16a34a}.aps-switch input:checked+.aps-slider:before{transform:translateX(16px)}.aps-save-row{display:flex;justify-content:flex-end;align-items:center;gap:12px}.aps-save-btn{background:#16a34a;color:#fff;border:0;border-radius:7px;padding:9px 18px;font-weight:600;cursor:pointer}.aps-save-btn:disabled{opacity:.6}`;
  document.head.appendChild(style);
}
function apsRender(settings) {
  const groups = [...new Set(APS_FIELDS.map(item => item[1]))];
  return groups.map(group => `<div class="aps-card"><div class="aps-card-header"><span class="aps-card-title">${group}</span></div>${APS_FIELDS.filter(item => item[1] === group).map(([key,,title,desc]) => `<div class="aps-toggle-row"><div><div class="aps-toggle-title">${title}</div><div class="aps-toggle-desc">${desc}</div></div><label class="aps-switch"><input data-setting="${key}" type="checkbox" ${settings[key] ? 'checked' : ''}><span class="aps-slider"></span></label></div>`).join('')}</div>`).join('');
}
async function apsLoad() {
  const root = document.getElementById('aps-root'); if (!root) return;
  try { const data = await FarmSenseAdminApi.request('/platform-settings'); root.innerHTML = `${apsRender(data.settings || {})}<div id="aps-feedback"></div><div class="aps-save-row"><button id="aps-save" class="aps-save-btn">Save Changes</button></div>`; document.getElementById('aps-save').onclick = apsSave; }
  catch (error) { root.innerHTML = FarmSenseAdminApi.message(error.message, 'error'); }
}
async function apsSave() {
  const button = document.getElementById('aps-save'); button.disabled = true; button.textContent = 'Saving...';
  const body = {}; document.querySelectorAll('[data-setting]').forEach(input => { body[input.dataset.setting] = input.checked; });
  try { await FarmSenseAdminApi.request('/platform-settings', { method: 'PATCH', body: JSON.stringify(body) }); FarmSenseAdminApi.feedback('aps-feedback', 'Platform settings saved.'); }
  catch (error) { FarmSenseAdminApi.feedback('aps-feedback', error.message, 'error'); }
  finally { button.disabled = false; button.textContent = 'Save Changes'; }
}
function viewPlatformSettings() { injectPlatformSettingsStyles(); setTimeout(apsLoad, 0); return '<div class="aps-scrollable"><div id="aps-root">Loading settings...</div></div>'; }
