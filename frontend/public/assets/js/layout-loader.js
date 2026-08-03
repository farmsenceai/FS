(function () {
    const dependencyPaths = [
        '/assets/js/dashboard-route.js',
        '/assets/js/auth-navbar.js',
        '/assets/js/page-transitions.js',
        '/assets/js/mobile-menu.js'
    ];

    function loadScript(path) {
        const existing = document.querySelector(`script[src="${path}"]`);
        if (existing) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = path;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load ${path}`));
            document.head.appendChild(script);
        });
    }

    async function loadDependencies() {
        for (const path of dependencyPaths) {
            await loadScript(path);
        }
    }

    function applyHomeHeaderState() {
        const isHomePage = window.location.pathname === '/' || window.location.pathname.endsWith('index.html');
        const header = document.querySelector('.site-header');

        if (isHomePage && header) {
            header.classList.add('transparent');
        }
    }

    function initializeHeader() {
        if (window.initMobileMenu) window.initMobileMenu();
        if (window.initAuthNavbar) window.initAuthNavbar();
        if (window.initHeaderScroll) window.initHeaderScroll();
        if (window.initPageTransitions) window.initPageTransitions();
        applyHomeHeaderState();
    }

    async function loadComponent(id, path) {
        const target = document.getElementById(id);
        if (!target) return;

        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`Failed to load ${path}`);

            target.innerHTML = await response.text();

            if (id === 'header-placeholder') {
                initializeHeader();
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function initializeLayout() {
        await loadDependencies();

        if (window.initPageTransitions) window.initPageTransitions();

        await Promise.all([
            loadComponent('header-placeholder', '/src/components/header.html'),
            loadComponent('footer-placeholder', '/src/components/footer.html')
        ]);

        if (!document.getElementById('header-placeholder') && window.initAuthNavbar) {
            window.initAuthNavbar();
        }
    }

    function start() {
        initializeLayout().catch(error => console.error(error));
    }

    window.FarmSenseLayoutLoader = {
        initializeHeader,
        initializeLayout,
        loadComponent
    };

    window.loadComponent = loadComponent;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
