(function () {
    const dashboardLinks = {
        business: '/src/dashboard/index.html',
        farmer: '/src/dashboard/index-farmer.html',
        admin: '/src/dashboard/index-admin.html'
    };

    function normalizeDashboardRole(role) {
        const normalizedRole = String(role || '').trim().toLowerCase();
        return normalizedRole === 'administrator' ? 'admin' : normalizedRole;
    }

    function getDashboardUrlForRole(role) {
        return dashboardLinks[normalizeDashboardRole(role)] || null;
    }

    async function fetchAuthenticatedDashboardUser(token) {
        const res = await fetch('/api/auth/me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        let data = {};
        try {
            data = await res.json();
        } catch (err) {
            data = {};
        }

        if (!res.ok) {
            throw new Error(data.msg || 'Please sign in again.');
        }

        if (!data.success || !data.user) {
            throw new Error(data.msg || 'Could not load your account.');
        }

        return data.user;
    }

    async function getDashboardRouteForAuthenticatedUser(token) {
        const user = await fetchAuthenticatedDashboardUser(token);
        const dashboardUrl = getDashboardUrlForRole(user.role);

        if (!dashboardUrl) {
            throw new Error('Your account does not have a valid dashboard role. Please contact support.');
        }

        return { dashboardUrl, user };
    }

    async function openDashboardForAuthenticatedUser(options = {}) {
        const token = options.token || localStorage.getItem('fs_token');
        const openInNewTab = Boolean(options.openInNewTab);

        if (!token) {
            if (options.redirectOnMissingAuth !== false) {
                window.location.href = '/src/pages/sign-in.html';
            }
            return null;
        }

        const route = await getDashboardRouteForAuthenticatedUser(token);
        localStorage.setItem('fs_user', JSON.stringify(route.user));

        if (openInNewTab) {
            window.open(route.dashboardUrl, '_blank', 'noopener');
        } else {
            window.location.href = route.dashboardUrl;
        }

        if (options.afterOpenUrl) {
            window.location.href = options.afterOpenUrl;
        }

        return route;
    }

    window.FarmSenseDashboardRoute = {
        fetchAuthenticatedDashboardUser,
        getDashboardRouteForAuthenticatedUser,
        getDashboardUrlForRole,
        normalizeDashboardRole,
        openDashboardForAuthenticatedUser
    };

    window.getDashboardUrlForRole = getDashboardUrlForRole;
})();
