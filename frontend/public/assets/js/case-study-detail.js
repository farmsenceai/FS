(function () {
  function initializeCaseStudy() {
    const article = document.getElementById('case-study-article');
    const nav = document.querySelector('.case-nav');
    const sections = [...document.querySelectorAll('[data-case-section]')];
    const tabs = [...document.querySelectorAll('.case-nav__tab')];
    const progress = document.querySelector('.case-nav__progress span');
    const stats = document.getElementById('case-stats');
    if (!article || !nav || !sections.length) return;

    const setActive = id => tabs.forEach(tab => {
      const active = tab.dataset.sectionId === id;
      tab.classList.toggle('is-active', active);
    });

    // Keep the bar fixed once the stats have passed. A placeholder preserves
    // its space in the document and prevents a layout jump at the hand-off.
    const navPlaceholder = document.createElement('div');
    navPlaceholder.className = 'case-nav-placeholder';
    nav.insertAdjacentElement('afterend', navPlaceholder);
    const updateNavPosition = () => {
      if (!stats) return;
      const shouldFix = stats.getBoundingClientRect().bottom <= 0;
      nav.classList.toggle('is-fixed', shouldFix);
      navPlaceholder.classList.toggle('is-visible', shouldFix);
    };

    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: `-${nav.offsetHeight + 12}px 0px -58% 0px`, threshold: [0, .1, .3, .6] });
    sections.forEach(section => observer.observe(section));

    tabs.forEach(tab => tab.addEventListener('click', event => {
      event.preventDefault();
      const target = document.getElementById(tab.dataset.sectionId);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    const updateProgress = () => {
      const contentStart = sections[0].offsetTop;
      const contentEnd = article.offsetTop + article.offsetHeight;
      const distance = Math.max(1, contentEnd - contentStart - window.innerHeight);
      const ratio = Math.min(1, Math.max(0, (window.scrollY - contentStart) / distance));
      progress.style.width = `${ratio * 100}%`;
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('scroll', updateNavPosition, { passive: true });
    window.addEventListener('resize', updateProgress);
    window.addEventListener('resize', updateNavPosition);
    updateProgress();
    updateNavPosition();

    const share = document.querySelector('[data-case-action="share"]');
    const print = document.querySelector('[data-case-action="print"]');
    const bookmark = document.querySelector('[data-case-action="bookmark"]');
    share?.addEventListener('click', async () => {
      const data = { title: document.title, url: window.location.href };
      try { if (navigator.share) await navigator.share(data); else await navigator.clipboard.writeText(data.url); } catch (error) { if (error.name !== 'AbortError') console.error(error); }
    });
    print?.addEventListener('click', () => window.print());
    const storageKey = `farmsence:case-study:${article.dataset.caseSlug}`;
    if (bookmark && localStorage.getItem(storageKey)) { bookmark.classList.add('is-saved'); bookmark.setAttribute('aria-pressed', 'true'); }
    bookmark?.addEventListener('click', () => {
      const saved = bookmark.getAttribute('aria-pressed') !== 'true';
      bookmark.setAttribute('aria-pressed', String(saved)); bookmark.classList.toggle('is-saved', saved);
      if (saved) localStorage.setItem(storageKey, 'saved'); else localStorage.removeItem(storageKey);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeCaseStudy, { once: true }); else initializeCaseStudy();
})();
