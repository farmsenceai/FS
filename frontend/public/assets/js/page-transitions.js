(function () {
    function initHeaderScroll() {
        let lastScrollY = window.pageYOffset;
        const header = document.querySelector('.site-header');

        if (!header) return;

        header.style.transform = 'translateY(0)';

        window.addEventListener('scroll', () => {
            const currentScrollY = window.pageYOffset;

            if (currentScrollY > lastScrollY && currentScrollY > 50) {
                header.style.transform = 'translateY(-100%)';
            } else if (currentScrollY < lastScrollY) {
                header.style.transform = 'translateY(0)';
            }

            if (currentScrollY <= 0) {
                header.style.transform = 'translateY(0)';
            }

            lastScrollY = currentScrollY;
        }, { passive: true });
    }

    function initPageTransitions() {
        if (!document.body.classList.contains('page-transition')) {
            document.body.classList.add('page-transition');
            requestAnimationFrame(() => {
                document.body.classList.add('fade-in');
            });
        }

        const links = document.querySelectorAll('a:not(.transition-bound)');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('http') || link.target === '_blank' || href.startsWith('#') || link.hasAttribute('download')) {
                return;
            }

            link.classList.add('transition-bound');
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetUrl = link.href;

                document.body.classList.remove('fade-in');

                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 300);
            });
        });
    }

    window.FarmSensePageTransitions = {
        initHeaderScroll,
        initPageTransitions
    };

    window.initHeaderScroll = initHeaderScroll;
    window.initPageTransitions = initPageTransitions;
})();
