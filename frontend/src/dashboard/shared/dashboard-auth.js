(function () {
  const API = `${window.location.origin}/api/auth`;

  function captureTokenFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');

    if (tokenFromUrl) {
      localStorage.setItem('fs_token', tokenFromUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return localStorage.getItem('fs_token');
  }

  async function parseJson(res) {
    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) throw new Error(data.msg || 'Authentication failed');
    return data;
  }

  function clearAuth() {
    localStorage.removeItem('fs_token');
    localStorage.removeItem('fs_user');
  }

  function redirectToSignIn() {
    clearAuth();
    window.location.href = '../pages/sign-in.html';
  }

  async function getCurrentUser(token) {
    const res = await fetch(`${API}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await parseJson(res);

    if (!data.success || !data.user) {
      throw new Error(data.msg || 'Could not load your account.');
    }

    localStorage.setItem('fs_user', JSON.stringify(data.user));
    return data.user;
  }

  async function agreeToTerms(token) {
    const res = await fetch(`${API}/agree-terms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    return parseJson(res);
  }

  async function logout() {
    try {
      await fetch(`${API}/logout`, { method: 'POST' });
    } catch {
      // Local auth cleanup still happens even if the server logout request fails.
    }
    redirectToSignIn();
  }

  function hasAcceptedLatestTerms(user) {
    return Boolean(user?.agreedToTerms);
  }

  window.FarmSenseDashboardAuth = {
    agreeToTerms,
    captureTokenFromUrl,
    clearAuth,
    getCurrentUser,
    hasAcceptedLatestTerms,
    logout,
    parseJson,
    redirectToSignIn
  };
})();
