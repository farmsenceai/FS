// FAQ Accordion Logic
document.addEventListener("DOMContentLoaded", function () {
  const questions = document.querySelectorAll(".faq-question");

  questions.forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.parentElement;
      const isOpen = item.classList.contains("active");

      // Close all
      document.querySelectorAll(".faq-item").forEach((i) => {
        i.classList.remove("active");
      });

      // Open clicked
      if (!isOpen) {
        item.classList.add("active");
      }
    });
  });
});


// Scroll-based text highlight

document.addEventListener("DOMContentLoaded", () => {
  const lines = document.querySelectorAll(".highlight-text span");

  function highlightOnScroll() {
    const triggerPoint = window.innerHeight * 0.75;

    lines.forEach((line) => {
      const rect = line.getBoundingClientRect();

      if (rect.top < triggerPoint) {
        line.classList.add("active");
      }
    });
  }

  // Run on scroll
  window.addEventListener("scroll", highlightOnScroll);

  // Run once on load
  highlightOnScroll();
});


document.addEventListener("DOMContentLoaded", () => {
  const lines = document.querySelectorAll(".highlight-text span");

  function updateHighlight() {
    const triggerPoint = window.innerHeight * 0.7;

    lines.forEach((line) => {
      const rect = line.getBoundingClientRect();

      // Highlight when line enters viewport
      if (rect.top < triggerPoint) {
        line.classList.add("active");
      } 
      // Fade again when scrolling up
      else {
        line.classList.remove("active");
      }
    });
  }

  window.addEventListener("scroll", updateHighlight);
  updateHighlight(); // run once on load
});




// Video slider...............................


// Below is the JS for Buger menu Slider
// ==========================================
// FARMSENCE MOBILE MENU CONTROL SYSTEM
// ==========================================

const toggle = document.getElementById("menu-toggle");
const mobileMenu = document.getElementById("nav-mobile");

if (toggle && mobileMenu) {
  const icon = toggle.querySelector("i");

  // OPEN / CLOSE toggle button
  toggle.addEventListener("click", () => {
      mobileMenu.classList.toggle("active");

      if (mobileMenu.classList.contains("active")) {
          icon.classList.remove("fa-bars");
          icon.classList.add("fa-xmark");
          document.body.style.overflow = "hidden"; // prevent scroll
      } else {
          closeMenu();
      }
  });

  // CLOSE MENU FUNCTION
  function closeMenu() {
      mobileMenu.classList.remove("active");
      icon.classList.remove("fa-xmark");
      icon.classList.add("fa-bars");
      document.body.style.overflow = "";
  }

  // CLOSE WHEN CLICKING A LINK
  document.querySelectorAll(".nav-mobile a").forEach(link => {
      link.addEventListener("click", () => {
          closeMenu();
      });
  });

  // CLOSE WHEN CLICKING OUTSIDE
  document.addEventListener("click", (event) => {
      const isClickInsideMenu = mobileMenu.contains(event.target);
      const isClickToggle = toggle.contains(event.target);

      if (!isClickInsideMenu && !isClickToggle && mobileMenu.classList.contains("active")) {
          closeMenu();
      }
  });

  // CLOSE ON ESC KEY
  document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
          closeMenu();
      }
  });
}

document.addEventListener("DOMContentLoaded", function () {

  const banner = document.getElementById("cookie-banner");
  if (!banner) return;

  const accept = document.getElementById("acceptCookies");
  const reject = document.getElementById("rejectCookies");
  const manage = document.getElementById("manageCookies");

  // Check if user already chose
  const consent = localStorage.getItem("cookieConsent");

  if (consent) {
    banner.style.display = "none";
  }

  if (accept) {
    accept.addEventListener("click", function () {
      localStorage.setItem("cookieConsent", "accepted");
      banner.style.display = "none";
    });
  }

  if (reject) {
    reject.addEventListener("click", function () {
      localStorage.setItem("cookieConsent", "rejected");
      banner.style.display = "none";
    });
  }

  if (manage) {
    manage.addEventListener("click", function () {
      localStorage.setItem("cookieConsent", "managed");
      banner.style.display = "none";
    });
  }

});


// Stories Slider
const slider = document.querySelector('.stories-slider');

let isDown = false;
let startX;
let scrollLeft;

slider.addEventListener('mousedown', (e) => {
  isDown = true;
  startX = e.pageX - slider.offsetLeft;
  scrollLeft = slider.scrollLeft;
});

slider.addEventListener('mouseleave', () => {
  isDown = false;
});

slider.addEventListener('mouseup', () => {
  isDown = false;
});

slider.addEventListener('mousemove', (e) => {
  if(!isDown) return;
  e.preventDefault();
  const x = e.pageX - slider.offsetLeft;
  const walk = (x - startX) * 2;
  slider.scrollLeft = scrollLeft - walk;
});



// Investor Moving Logo
const track = document.getElementById("logo-track");

function duplicateLogos() {

  const logos = [...track.children];

  logos.forEach((logo) => {
    const clone = logo.cloneNode(true);
    track.appendChild(clone);
  });

}

duplicateLogos();


// The code for Blog Page for Load more blogs
document.addEventListener("DOMContentLoaded", function(){

const loadMoreBtn = document.getElementById("loadMoreBtn");

let blogs = document.querySelectorAll(".blog-card.hidden-blog");
let currentIndex = 0;
let blogsPerClick = 2;

loadMoreBtn.addEventListener("click", function(){

for(let i = currentIndex; i < currentIndex + blogsPerClick; i++){

if(blogs[i]){
blogs[i].classList.remove("hidden-blog");
}

}

currentIndex += blogsPerClick;

if(currentIndex >= blogs.length){
loadMoreBtn.style.display = "none";
}

});

});

// 
