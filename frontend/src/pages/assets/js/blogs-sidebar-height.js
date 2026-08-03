  function syncSidebarHeight() {
    const feature = document.querySelector('.blog-feature');
    const sidebar = document.querySelector('.blog-side');

    if (!feature || !sidebar) return;

    sidebar.style.height =
        `${feature.getBoundingClientRect().height}px`;
  }
  window.addEventListener('load', syncSidebarHeight);
  window.addEventListener('resize', syncSidebarHeight);

  new ResizeObserver(syncSidebarHeight)
      .observe(document.querySelector('.blog-feature'));
