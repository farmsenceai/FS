(function () {
    function initMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const mobileMenu = document.getElementById('mobileMenu');
        const closeBtn = document.getElementById('mobileMenuClose');

        if (!menuToggle || !mobileMenu) return;

        const newToggle = menuToggle.cloneNode(true);
        menuToggle.parentNode.replaceChild(newToggle, menuToggle);

        const closeMenu = () => {
            mobileMenu.classList.remove('active');
            const icon = newToggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
            document.body.style.overflow = '';
        };

        newToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            const icon = newToggle.querySelector('i');
            if (!icon) return;

            if (mobileMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
                document.body.style.overflow = 'hidden';
            } else {
                closeMenu();
            }
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', closeMenu);
        }

        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }

    window.FarmSenseMobileMenu = { initMobileMenu };
    window.initMobileMenu = initMobileMenu;
})();
