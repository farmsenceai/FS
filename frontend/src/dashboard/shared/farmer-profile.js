(function () {
  function escapeHTML(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function ensureStyles() {
    if (document.getElementById('farmer-profile-styles')) return;
    const style = document.createElement('style');
    style.id = 'farmer-profile-styles';
    style.textContent = `.fpc-overlay{position:fixed;inset:0;z-index:3000;background:rgba(15,23,42,.7);display:flex;align-items:center;justify-content:center;padding:20px}.fpc-card{box-sizing:border-box;width:min(560px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#fff;border-radius:16px;padding:26px;box-shadow:0 24px 70px rgba(0,0,0,.25);font:14px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937}.fpc-card h2{margin:0 0 7px;font-size:22px}.fpc-intro,.fpc-help{color:#6b7280;line-height:1.5}.fpc-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:20px 0}.fpc-field{display:flex;flex-direction:column;gap:6px}.fpc-field.full{grid-column:1/-1}.fpc-field span{font-size:12px;font-weight:700}.fpc-field input,.fpc-field select{box-sizing:border-box;width:100%;border:1px solid #d1d5db;border-radius:8px;padding:10px 11px;font:inherit}.fpc-submit{width:100%;border:0;border-radius:9px;padding:12px;background:#166534;color:#fff;font-weight:700;cursor:pointer}.fpc-submit:disabled{opacity:.6}.fpc-error{margin:10px 0;padding:10px;border-radius:8px;background:#fef2f2;color:#991b1b}.fpc-hidden{display:none}@media(max-width:600px){.fpc-grid{grid-template-columns:1fr}.fpc-field.full{grid-column:auto}}`;
    document.head.appendChild(style);
  }

  async function directory(token) {
    const response = await fetch('/api/v2/farms/directory', { headers: { Authorization: `Bearer ${token}` } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || body.msg || `Could not load farm directory (HTTP ${response.status})`);
    return body.data || [];
  }

  function farmOptions(farms, selectedId = '') {
    return farms.map(farm => `<option value="${farm._id}" ${String(farm._id) === String(selectedId) ? 'selected' : ''}>${escapeHTML(farm.name)} · ${escapeHTML(farm.code)} · ${escapeHTML(farm.location?.address || 'Address unavailable')}</option>`).join('');
  }

  async function ensureProfile(user, token) {
    if (user?.role !== 'farmer' || (user.profileCompletedAt && user.requestedFarmId)) return user;
    ensureStyles();
    const farms = await directory(token);
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'fpc-overlay';
      overlay.innerHTML = `<form class="fpc-card"><h2>Complete your farmer profile</h2><p class="fpc-intro">Tell us how your administrator can identify and assign you.</p><div class="fpc-error fpc-hidden"></div><div class="fpc-grid"><label class="fpc-field"><span>Name</span><input name="name" value="${escapeHTML(user.name)}" maxlength="120" required></label><label class="fpc-field"><span>Email</span><input name="email" type="email" value="${escapeHTML(user.email)}" required></label><label class="fpc-field"><span>Phone</span><input name="phone" type="tel" value="${escapeHTML(user.phone)}" minlength="7" required></label><label class="fpc-field full"><span>Search farms</span><input id="fpc-farm-search" type="search" placeholder="Search by farm name, code, or address"></label><label class="fpc-field full"><span>Which farm do you work for?</span><select name="requestedFarmId" id="fpc-farm-select" required><option value="">Select a farm…</option>${farmOptions(farms, user.requestedFarmId)}</select><small class="fpc-help">Select the farm you know — your admin will confirm and assign you shortly.</small></label></div><button class="fpc-submit" type="submit">Complete profile</button></form>`;
      document.body.appendChild(overlay);
      const form = overlay.querySelector('form');
      const select = overlay.querySelector('#fpc-farm-select');
      overlay.querySelector('#fpc-farm-search').addEventListener('input', event => {
        const query = event.target.value.trim().toLowerCase();
        const filtered = farms.filter(farm => [farm.name, farm.code, farm.location?.address].some(value => String(value || '').toLowerCase().includes(query)));
        select.innerHTML = `<option value="">${filtered.length ? 'Select a farm…' : 'No matching farms'}</option>${farmOptions(filtered, select.value)}`;
      });
      form.addEventListener('submit', async event => {
        event.preventDefault();
        const button = form.querySelector('button');
        const errorElement = form.querySelector('.fpc-error');
        button.disabled = true; button.textContent = 'Saving…'; errorElement.classList.add('fpc-hidden');
        try {
          const response = await fetch('/api/auth/me/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
          const body = await response.json().catch(() => ({}));
          if (!response.ok || !body.user) throw new Error(body.msg || `Could not complete your profile (HTTP ${response.status})`);
          overlay.remove(); resolve(body.user);
        } catch (error) {
          errorElement.textContent = error.message; errorElement.classList.remove('fpc-hidden');
          button.disabled = false; button.textContent = 'Complete profile';
        }
      });
    });
  }

  window.FarmSenseFarmerProfile = { ensureProfile };
})();
