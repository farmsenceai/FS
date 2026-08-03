(function () {
    async function fetchAuthenticatedUser(token) {
        return window.FarmSenseDashboardRoute.fetchAuthenticatedDashboardUser(token);
    }

    function clearStoredAuth() {
        localStorage.removeItem('fs_token');
        localStorage.removeItem('fs_user');
        localStorage.removeItem('fs_role');
    }

    function redirectToSignIn() {
        window.location.href = '/src/pages/sign-in.html';
    }

    async function openDashboardFromAuthenticatedUser(options = {}) {
        const token = localStorage.getItem('fs_token');
        const openInNewTab = Boolean(options.openInNewTab);

        if (!token) {
            redirectToSignIn();
            return;
        }

        try {
            await window.FarmSenseDashboardRoute.openDashboardForAuthenticatedUser({
                openInNewTab,
                token
            });
        } catch (err) {
            if (err.message && err.message !== 'Please sign in again.') {
                alert(err.message);
                return;
            }

            clearStoredAuth();
            redirectToSignIn();
        }
    }

    function showLoggedOutState({ navAccount, navLoginBtn, navDemoBtn, accountLink }) {
        if (navAccount) navAccount.style.display = 'none';
        if (navLoginBtn) {
            navLoginBtn.style.display = 'inline-flex';
            navLoginBtn.href = '/src/pages/sign-in.html';
        }
        if (navDemoBtn) navDemoBtn.style.display = 'inline-flex';
        if (accountLink) accountLink.href = '/src/pages/sign-in.html';
    }

    function initAuthNavbar() {
        const token = localStorage.getItem('fs_token');
        const navAccount = document.getElementById('navAccount');
        const accountLink = document.getElementById('accountLink');
        const accountDropdown = document.getElementById('accountDropdown');
        const userNameEl = document.getElementById('userName');
        const navAccountLabel = document.getElementById('navAccountLabel');
        const logoutBtn = document.getElementById('navLogout');
        const dashboardOption = document.getElementById('dashboardOption');
        const navLoginBtn = document.getElementById('navLoginBtn');
        const navDemoBtn = document.getElementById('navDemoBtn');

        if (!navAccount) return;

        const loggedOutElements = { navAccount, navLoginBtn, navDemoBtn, accountLink };

        if (!token) {
            showLoggedOutState(loggedOutElements);
            return;
        }

        fetchAuthenticatedUser(token)
            .then(user => {
                localStorage.setItem('fs_user', JSON.stringify(user));

                navAccount.style.display = 'flex';
                if (navLoginBtn) navLoginBtn.style.display = 'none';
                if (navDemoBtn) navDemoBtn.style.display = 'none';

                if (userNameEl) userNameEl.textContent = user.name || user.phone || user.email || 'User';
                if (navAccountLabel) {
                    navAccountLabel.textContent = user.name || user.phone || (user.email ? user.email.split('@')[0] : 'Account');
                    navAccountLabel.style.display = 'inline';
                }

                if (accountLink && accountDropdown) {
                    accountLink.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const isVisible = accountDropdown.style.display === 'block';
                        accountDropdown.style.display = isVisible ? 'none' : 'block';
                    };

                    document.onclick = () => {
                        accountDropdown.style.display = 'none';
                    };

                    accountDropdown.onclick = (e) => e.stopPropagation();
                }

                if (dashboardOption) {
                    dashboardOption.onclick = (e) => {
                        e.preventDefault();
                        openDashboardFromAuthenticatedUser({ openInNewTab: true });
                    };
                }

                if (logoutBtn) {
                    logoutBtn.onclick = (e) => {
                        e.preventDefault();
                        clearStoredAuth();
                        window.location.href = '/index.html';
                    };
                }
            })
            .catch(err => {
                console.error(err);
                clearStoredAuth();
                showLoggedOutState(loggedOutElements);
            });
    }

    window.FarmSenseAuthNavbar = {
        clearStoredAuth,
        fetchAuthenticatedUser,
        getDashboardUrlForRole: window.FarmSenseDashboardRoute.getDashboardUrlForRole,
        initAuthNavbar,
        openDashboardFromAuthenticatedUser
    };

    window.clearStoredAuth = clearStoredAuth;
    window.fetchAuthenticatedUser = fetchAuthenticatedUser;
    window.initAuthNavbar = initAuthNavbar;
    window.openDashboardFromAuthenticatedUser = openDashboardFromAuthenticatedUser;
})();
