(function () {
  const API_BASE = `${window.FARMSENCE_API_BASE_URL || window.location.origin}/api/admin`;

  function escapeHTML(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function request(path, options = {}) {
    const token = localStorage.getItem('fs_token');
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });

    let data = {};
    try { data = await response.json(); } catch { data = {}; }

    if (!response.ok) {
      const message = data.error?.message || data.error || data.message || data.msg || `Request failed (${response.status})`;
      const error = new Error(message);
      error.status = response.status;
      error.details = data.error?.details;
      throw error;
    }
    return data;
  }

  function formatDate(value, withTime = false) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
    }).format(date);
  }

  function label(value) {
    return String(value || 'unknown')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, character => character.toUpperCase());
  }

  function initials(value) {
    return String(value || '?').split(/\s+/).filter(Boolean).slice(0, 2)
      .map(part => part[0].toUpperCase()).join('') || '?';
  }

  function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  function message(text, type = 'loading') {
    const color = type === 'error' ? '#b91c1c' : '#6b7280';
    return `<div style="padding:28px;text-align:center;color:${color};font-size:12px">${escapeHTML(text)}</div>`;
  }

  function navigate(page) {
    document.querySelector(`.db-sidebar-link[data-page="${page}"]`)?.click();
  }

  function feedback(target, text, type = 'success') {
    const element = typeof target === 'string' ? document.getElementById(target) : target;
    if (!element) return;
    const palette = type === 'error'
      ? { background: '#fef2f2', border: '#fecaca', color: '#991b1b', icon: '!' }
      : type === 'info'
        ? { background: '#eff6ff', border: '#bfdbfe', color: '#1e40af', icon: 'i' }
        : { background: '#ecfdf3', border: '#a7f3d0', color: '#065f46', icon: '✓' };
    element.innerHTML = `<div style="display:flex;align-items:center;gap:9px;padding:10px 13px;margin-bottom:14px;border:1px solid ${palette.border};border-radius:9px;background:${palette.background};color:${palette.color}"><strong style="font-size:15px">${palette.icon}</strong><span>${escapeHTML(text)}</span></div>`;
  }

  function clearFeedback(target) {
    const element = typeof target === 'string' ? document.getElementById(target) : target;
    if (element) element.innerHTML = '';
  }

  window.FarmSenseAdminApi = {
    debounce,
    clearFeedback,
    escapeHTML,
    formatDate,
    feedback,
    initials,
    label,
    message,
    navigate,
    request
  };
})();
