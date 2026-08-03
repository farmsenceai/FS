(function () {
  function updateUserUI(user) {
    const emailEl = document.getElementById('avatar-email');
    if (emailEl) emailEl.textContent = user?.email || user?.phone || '';

    const nameEl = document.querySelector('.db-user-name');
    if (nameEl) nameEl.textContent = user?.name || user?.email || user?.phone || 'Signed-in user';

    const planEl = document.querySelector('.db-user-plan');
    if (planEl) planEl.hidden = true;

    const avatarEl = document.querySelector('.db-avatar-circle');
    if (avatarEl) {
      if (user?.avatar) {
        avatarEl.innerHTML = `<img src="${String(user.avatar).replace(/"/g, '&quot;')}" alt="Profile picture">`;
      } else {
        const initials = String(user?.name || user?.email || 'U').split(/\s+/).map(value => value[0]).join('').slice(0, 2).toUpperCase();
        avatarEl.textContent = initials;
      }
    }
  }

  function injectNotificationStyles() {
    if (document.getElementById('dashboard-notification-styles')) return;
    const style = document.createElement('style');
    style.id = 'dashboard-notification-styles';
    style.textContent = `
      .db-notification-menu {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        width: 320px;
        max-height: 360px;
        overflow-y: auto;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 16px 40px rgba(15, 23, 42, 0.16);
        z-index: 1200;
        display: none;
      }
      .db-bell-btn.open .db-notification-menu { display: block; }
      .db-notification-item {
        width: 100%;
        text-align: left;
        padding: 12px 14px;
        border-bottom: 1px solid #f3f4f6;
        cursor: pointer;
        color: #111827;
        font: inherit;
      }
      .db-notification-item:hover { background: #f9fafb; }
      .db-notification-item.unread { background: #f0fdf4; }
      .db-notification-message { font-size: 12px; line-height: 1.4; }
      .db-notification-date { margin-top: 4px; font-size: 10px; color: #6b7280; }
      .db-notification-empty { padding: 16px; color: #6b7280; font-size: 12px; }
      .db-notification-actions { display:flex;justify-content:flex-end;padding:8px 10px;border-bottom:1px solid #f3f4f6; }
      .db-notification-actions button { border:0;background:none;color:#166534;font:inherit;font-size:11px;font-weight:700;cursor:pointer; }
    `;
    document.head.appendChild(style);
  }

  async function initNotifications(token, { readOnly = false, onOpenNotification } = {}) {
    const bell = document.querySelector('.db-bell-btn');
    const badge = bell?.querySelector('.db-bell-badge');
    if (!bell || !badge) return;

    injectNotificationStyles();
    let menu = bell.querySelector('.db-notification-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.className = 'db-notification-menu';
      bell.appendChild(menu);
    }

    function escapeHTML(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    async function loadNotifications() {
      try {
        const res = await fetch(`${window.location.origin}/api/blogs/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.msg || 'Failed to load notifications');

        const notifications = data.notifications || [];
        const unread = notifications.filter(item => !item.read).length;
        badge.textContent = unread;
        badge.style.display = unread > 0 ? '' : 'none';

        menu.innerHTML = notifications.length
          ? `${unread && !readOnly ? '<div class="db-notification-actions"><button type="button" data-read-all>Mark all as read</button></div>' : ''}${notifications.map(item => `
              <div class="db-notification-item ${item.read ? '' : 'unread'}" data-id="${item._id}" data-slug="${escapeHTML(item.relatedBlog?.slug || '')}" role="button" tabindex="0">
                <div class="db-notification-message">${escapeHTML(item.message)}</div>
                <div class="db-notification-date">${new Date(item.createdAt).toLocaleString()}</div>
              </div>
            `).join('')}`
          : '<div class="db-notification-empty">No notifications yet.</div>';
      } catch (err) {
        menu.innerHTML = `<div class="db-notification-empty">${err.message}</div>`;
        badge.style.display = 'none';
      }
    }

    if (!bell.dataset.notificationsWired) {
      bell.dataset.notificationsWired = 'true';
      bell.addEventListener('click', async (event) => {
        event.stopPropagation();
        bell.classList.toggle('open');
        if (bell.classList.contains('open')) await loadNotifications();
      });
      menu.addEventListener('click', async (event) => {
          const readAll = event.target.closest('[data-read-all]');
          if (readAll) {
            event.stopPropagation();
            await fetch(`${window.location.origin}/api/blogs/notifications/read-all`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
            await loadNotifications();
            return;
          }
          const item = event.target.closest('[data-id]');
          if (!item) return;
          event.stopPropagation();
          if (!readOnly && item.classList.contains('unread')) {
            await fetch(`${window.location.origin}/api/blogs/notifications/${item.dataset.id}/read`, {
              method: 'PUT', headers: { Authorization: `Bearer ${token}` }
            });
          }
          onOpenNotification?.({ slug: item.dataset.slug });
        });
      document.addEventListener('click', () => bell.classList.remove('open'));
    }

    await loadNotifications();
  }

  function initDashboardShell({ panels, defaultPage, expectedRole, beforeShowContent }) {
    const auth = window.FarmSenseDashboardAuth;
    const sidebar = window.FarmSenseDashboardSidebar;
    const terms = window.FarmSenseDashboardTerms;
    const token = auth.captureTokenFromUrl();
    const contentDiv = document.getElementById('dashboard-content');
    let currentUser = null;

    function pageFromHash() {
      const value = decodeURIComponent(String(window.location.hash || '').replace(/^#\/?/, ''));
      return panels[value] ? value : null;
    }

    function setActivePage(page, { fromHash = false } = {}) {
      const panel = panels[page];
      if (!panel) return;

      const metadata = window[`meta${page}`] || {
        title: page,
        subtitle: 'Page content'
      };

      const titleEl = document.getElementById('panel-title');
      const subtitleEl = document.getElementById('panel-subtitle');
      const bodyEl = document.getElementById('panel-body');

      if (titleEl) titleEl.textContent = metadata.title;
      if (subtitleEl) subtitleEl.textContent = metadata.subtitle;
      if (bodyEl) bodyEl.innerHTML = panel(currentUser);

      document.querySelectorAll('.db-sidebar-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
      });
      if (!fromHash && pageFromHash() !== page) window.location.hash = `/${encodeURIComponent(page)}`;
    }

    const termsController = terms.createTermsController({
      contentDiv,
      modalOverlay: document.getElementById('terms-modal'),
      termsCheckbox: document.getElementById('terms-checkbox'),
      confirmBtn: document.getElementById('modal-confirm'),
      onConfirm: async () => {
        const data = await auth.agreeToTerms(token);
        if (!data.success) {
          throw new Error(data.msg || 'Update failed. You must agree to terms to proceed.');
        }

        currentUser = data.user;
        localStorage.setItem('fs_user', JSON.stringify(currentUser));
        await showContent();
      }
    });

    async function showContent() {
      if (beforeShowContent) {
        currentUser = await beforeShowContent(currentUser, token);
        localStorage.setItem('fs_user', JSON.stringify(currentUser));
      }
      updateUserUI(currentUser);
      initNotifications(token, {
        readOnly: expectedRole === 'business',
        onOpenNotification: ({ slug }) => {
          if (panels.MyBlogs) return setActivePage('MyBlogs');
          if (panels.BlogModeration) return setActivePage('BlogModeration');
          if (slug) window.location.href = `/blog/blog-detail.html?slug=${encodeURIComponent(slug)}`;
        }
      });
      termsController.showContent();
      setActivePage(pageFromHash() || defaultPage);
    }

    async function verifySession() {
      if (!token) {
        auth.redirectToSignIn();
        return;
      }

      try {
        currentUser = await auth.getCurrentUser(token);
        const route = window.FarmSenseDashboardRoute;
        const actualRole = route?.normalizeDashboardRole(currentUser.role) || currentUser.role;
        const requiredRole = route?.normalizeDashboardRole(expectedRole) || expectedRole;
        if (requiredRole && actualRole !== requiredRole) {
          const correctUrl = route?.getDashboardUrlForRole(actualRole);
          if (correctUrl) {
            window.location.replace(correctUrl);
            return;
          }
          throw new Error('This account does not have a valid dashboard role.');
        }
        if (auth.hasAcceptedLatestTerms(currentUser)) {
          await showContent();
        } else {
          termsController.showModal();
        }
      } catch {
        auth.redirectToSignIn();
      }
    }

    sidebar.initSidebar({ setActivePage });
    sidebar.initAvatarMenu({ onSignOut: auth.logout, onEditProfile: () => setActivePage('EditProfile') });
    window.addEventListener('farmsense:profile-updated', event => {
      if (!event.detail) return;
      currentUser = event.detail;
      updateUserUI(currentUser);
    });
    window.addEventListener('hashchange', () => {
      const page = pageFromHash();
      if (page) setActivePage(page, { fromHash: true });
    });
    verifySession();

    return {
      getUser: () => currentUser,
      setActivePage,
      verifySession
    };
  }

  window.FarmSenseDashboardShell = {
    init: initDashboardShell
  };
})();
