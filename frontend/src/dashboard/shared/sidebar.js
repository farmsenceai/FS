(function () {
  function normalizeSearchValue(value) {
    return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  }

  function initSidebarSearch({ setActivePage }) {
    const input = document.getElementById('panel-search-input');
    const nav = document.querySelector('.db-sidebar-nav');
    if (!input || !nav || input.dataset.searchWired) return null;

    const groups = Array.from(nav.querySelectorAll('.db-sidebar-group'));
    const help = nav.querySelector('.db-sidebar-help');
    const empty = document.createElement('p');
    empty.className = 'db-sidebar-search-empty';
    empty.hidden = true;
    empty.setAttribute('role', 'status');
    empty.setAttribute('aria-live', 'polite');
    empty.style.cssText = 'margin:14px 12px;padding:12px 10px;border:1px dashed #d1d5db;border-radius:8px;color:#6b7280;font-size:11px;line-height:1.4;text-align:center';
    nav.insertBefore(empty, help || null);

    function applyFilter() {
      const query = normalizeSearchValue(input.value);
      let visibleCount = 0;
      groups.forEach(group => {
        const label = normalizeSearchValue(group.querySelector('.db-sidebar-label')?.textContent);
        const groupMatches = Boolean(query && label.includes(query));
        let groupVisibleCount = 0;
        group.querySelectorAll('.db-sidebar-link').forEach(link => {
          const searchableText = normalizeSearchValue(`${link.textContent} ${link.dataset.page || ''}`);
          const matches = !query || groupMatches || searchableText.includes(query);
          link.hidden = !matches;
          link.style.display = matches ? '' : 'none';
          if (matches) groupVisibleCount += 1;
        });
        group.hidden = groupVisibleCount === 0;
        group.style.display = groupVisibleCount === 0 ? 'none' : '';
        visibleCount += groupVisibleCount;
      });
      if (help) {
        help.hidden = Boolean(query);
        help.style.display = query ? 'none' : '';
      }
      empty.hidden = !query || visibleCount > 0;
      empty.textContent = visibleCount ? '' : `No dashboard pages match “${input.value.trim()}”.`;
    }

    function clearSearch() {
      if (!input.value) return;
      input.value = '';
      applyFilter();
    }

    if (!nav.id) nav.id = 'dashboard-sidebar-navigation';
    input.dataset.searchWired = 'true';
    input.setAttribute('aria-controls', nav.id);
    input.addEventListener('input', applyFilter);
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape') return clearSearch();
      if (event.key !== 'Enter') return;
      const matches = nav.querySelectorAll('.db-sidebar-link:not([hidden])');
      if (matches.length === 1) {
        event.preventDefault();
        setActivePage(matches[0].dataset.page);
        clearSearch();
      }
    });
    applyFilter();
    return clearSearch;
  }

  function initSidebar({ setActivePage }) {
    const clearSidebarSearch = initSidebarSearch({ setActivePage });
    document.querySelectorAll('.db-sidebar-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        setActivePage(link.dataset.page);
        if (clearSidebarSearch) clearSidebarSearch();
      });
    });

    const sidebar = document.getElementById('db-sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    if (sidebar && toggle) {
      toggle.onclick = () => {
        sidebar.classList.toggle('collapsed');
        sidebar.classList.toggle('db-sidebar--collapsed');
      };
    }
  }

  function initAvatarMenu({ onSignOut, onEditProfile }) {
    const avatarBtn = document.getElementById('user-avatar-btn');
    const avatarDropdown = document.getElementById('avatar-dropdown');
    const signOutBtn = document.getElementById('sign-out');
    const editProfileBtn = document.getElementById('edit-profile');

    if (avatarBtn && avatarDropdown) {
      avatarBtn.addEventListener('click', e => {
        e.stopPropagation();
        avatarDropdown.classList.toggle('db-hidden');
      });

      document.addEventListener('click', () => {
        avatarDropdown.classList.add('db-hidden');
      });

      avatarDropdown.addEventListener('click', e => e.stopPropagation());
    }

    if (signOutBtn) {
      signOutBtn.onclick = onSignOut;
    }
    if (editProfileBtn) {
      editProfileBtn.onclick = () => {
        avatarDropdown?.classList.add('db-hidden');
        onEditProfile();
      };
    }
  }

  window.FarmSenseDashboardSidebar = {
    initAvatarMenu,
    initSidebar
  };
})();
