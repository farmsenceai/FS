/* Shared Header & Footer JavaScript */

document.addEventListener("DOMContentLoaded", () => {
    // Mobile Menu Logic
    const menuToggle = document.getElementById("menuToggle");
    const mobileMenu = document.getElementById("mobileMenu");

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener("click", () => {
            mobileMenu.classList.toggle("active");
            const icon = menuToggle.querySelector("i");
            if (mobileMenu.classList.contains("active")) {
                icon.classList.remove("fa-bars");
                icon.classList.add("fa-xmark");
                document.body.style.overflow = "hidden";
            } else {
                icon.classList.remove("fa-xmark");
                icon.classList.add("fa-bars");
                document.body.style.overflow = "";
            }
        });

        // Close menu when clicking links
        mobileMenu.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                mobileMenu.classList.remove("active");
                const icon = menuToggle.querySelector("i");
                if (icon) {
                    icon.classList.remove("fa-xmark");
                    icon.classList.add("fa-bars");
                }
                document.body.style.overflow = "";
            });
        });
    }
});

/* Hide on scroll down, show on scroll up */

let lastScrollY = window.scrollY;

window.addEventListener("scroll", () => {
    const header = document.querySelector(".site-header");
    if (!header) return;

    const currentScrollY = window.scrollY;

    // Hide when scrolling down
    if (currentScrollY > lastScrollY) {
        header.classList.add("header-hidden");
    }
    // Show immediately when scrolling up
    else if (currentScrollY < lastScrollY) {
        header.classList.remove("header-hidden");
    }

    lastScrollY = currentScrollY;
});