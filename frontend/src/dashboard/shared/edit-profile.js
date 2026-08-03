(function () {
  window.metaEditProfile = { title: 'Edit Profile', subtitle: 'Manage your personal and contact information' };

  function escapeHTML(value) {
    const element = document.createElement('div');
    element.textContent = value == null ? '' : String(value);
    return element.innerHTML;
  }

  function avatarMarkup(user) {
    if (user?.avatar) return `<img src="${escapeHTML(user.avatar)}" alt="Profile picture">`;
    const initials = String(user?.name || user?.email || 'U').split(/\s+/).map(value => value[0]).join('').slice(0, 2).toUpperCase();
    return `<span>${escapeHTML(initials)}</span>`;
  }

  function notifyUpdated(user) {
    localStorage.setItem('fs_user', JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('farmsense:profile-updated', { detail: user }));
  }

  function showMessage(message, type = 'success') {
    const element = document.getElementById('ep-message');
    if (!element) return;
    element.className = `ep-message ${type}`;
    element.textContent = message;
  }

  async function parseResponse(response) {
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.user) throw new Error(body.msg || body.error || `Request failed (${response.status})`);
    return body.user;
  }

  async function saveProfile(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    showMessage('Saving profile…', 'pending');
    try {
      const response = await fetch('/api/auth/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('fs_token') || ''}` },
        body: JSON.stringify({
          name: form.elements.name.value.trim(),
          email: form.elements.email.value.trim(),
          phone: form.elements.phone.value.trim()
        })
      });
      const user = await parseResponse(response);
      notifyUpdated(user);
      showMessage('Profile updated successfully.');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      button.disabled = false;
    }
  }

  async function uploadAvatar(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return showMessage('Please choose an image file.', 'error');
    if (file.size > 5 * 1024 * 1024) return showMessage('Profile picture must be 5MB or smaller.', 'error');
    const button = document.getElementById('ep-avatar-button');
    button.disabled = true;
    showMessage('Uploading profile picture…', 'pending');
    try {
      const data = new FormData();
      data.append('avatar', file);
      const response = await fetch('/api/auth/me/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('fs_token') || ''}` },
        body: data
      });
      const user = await parseResponse(response);
      notifyUpdated(user);
      document.getElementById('ep-avatar').innerHTML = avatarMarkup(user);
      showMessage('Profile picture updated successfully.');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      button.disabled = false;
    }
  }

  function bindProfilePage() {
    document.getElementById('ep-form')?.addEventListener('submit', saveProfile);
    const input = document.getElementById('ep-avatar-input');
    document.getElementById('ep-avatar-button')?.addEventListener('click', () => input.click());
    input?.addEventListener('change', () => uploadAvatar(input.files?.[0]));
  }

  function injectStyles() {
    if (document.getElementById('edit-profile-styles')) return;
    const style = document.createElement('style');
    style.id = 'edit-profile-styles';
    style.textContent = `.ep-page{padding:24px;background:#f5f6fa;min-height:100%;font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937}.ep-card{max-width:760px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden}.ep-head{padding:20px 22px;border-bottom:1px solid #eef0f2}.ep-head h2{margin:0 0 5px;font-size:18px}.ep-muted{color:#6b7280}.ep-body{padding:22px}.ep-avatar-row{display:flex;align-items:center;gap:16px;padding-bottom:22px;margin-bottom:22px;border-bottom:1px solid #eef0f2}.ep-avatar{width:78px;height:78px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:#dcfce7;color:#166534;font-size:23px;font-weight:800;flex:none}.ep-avatar img{width:100%;height:100%;object-fit:cover}.ep-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.ep-field{display:flex;flex-direction:column;gap:6px}.ep-field.full{grid-column:1/-1}.ep-field span{font-weight:700}.ep-field input{box-sizing:border-box;width:100%;padding:11px;border:1px solid #d1d5db;border-radius:8px;font:inherit}.ep-actions{display:flex;justify-content:flex-end;margin-top:20px}.ep-btn{border:1px solid #16a34a;border-radius:8px;padding:10px 15px;background:#fff;color:#166534;font:inherit;font-weight:700;cursor:pointer}.ep-btn.primary{background:#166534;color:#fff}.ep-btn:disabled{opacity:.55;cursor:wait}.ep-message{display:none;margin-bottom:16px;padding:11px;border-radius:8px}.ep-message.success,.ep-message.error,.ep-message.pending{display:block}.ep-message.success{background:#dcfce7;color:#166534}.ep-message.error{background:#fee2e2;color:#991b1b}.ep-message.pending{background:#eff6ff;color:#1e3a8a}@media(max-width:620px){.ep-page{padding:12px}.ep-grid{grid-template-columns:1fr}.ep-field.full{grid-column:auto}.ep-avatar-row{align-items:flex-start;flex-direction:column}}`;
    document.head.appendChild(style);
  }

  window.viewEditProfile = function viewEditProfile(user) {
    injectStyles();
    setTimeout(bindProfilePage, 0);
    return `<section class="ep-page"><article class="ep-card"><header class="ep-head"><h2>Edit profile</h2><div class="ep-muted">Keep your account details current across FarmSence.</div></header><div class="ep-body"><div id="ep-message" class="ep-message" role="status" aria-live="polite"></div><div class="ep-avatar-row"><div id="ep-avatar" class="ep-avatar">${avatarMarkup(user)}</div><div><input id="ep-avatar-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden><button id="ep-avatar-button" class="ep-btn" type="button">Upload profile picture</button><div class="ep-muted" style="margin-top:7px">PNG, JPEG, WebP or GIF; maximum 5MB.</div></div></div><form id="ep-form"><div class="ep-grid"><label class="ep-field full"><span>Full name</span><input name="name" value="${escapeHTML(user?.name)}" maxlength="120" autocomplete="name" required></label><label class="ep-field"><span>Email address</span><input name="email" type="email" value="${escapeHTML(user?.email)}" autocomplete="email" required></label><label class="ep-field"><span>Phone number</span><input name="phone" type="tel" value="${escapeHTML(user?.phone)}" minlength="7" maxlength="24" autocomplete="tel" required></label></div><div class="ep-actions"><button class="ep-btn primary" type="submit">Save changes</button></div></form></div></article></section>`;
  };
})();
