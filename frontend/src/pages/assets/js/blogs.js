document.addEventListener('DOMContentLoaded', function () {
  const filterBtn = document.getElementById('filterBtn');
  const filterPanel = document.getElementById('filterPanel');
  const filterIcon = document.getElementById('filterIcon');
  const sortBtn = document.getElementById('sortBtn');
  const sortIcon = document.getElementById('sortIcon');
  const sortMenu = document.getElementById('sortMenu');
  const topicFilters = document.querySelectorAll('.topic-filter');
  const sortOptions = document.querySelectorAll('.sort-option');
  const blogSideCards = document.getElementById('blogSideCards');
  const blogList = document.getElementById('blog-list');
  const loadMoreBtn = document.getElementById('loadMoreBtn');

  let activeFilters = new Set();
  let currentSort = 'newest';
  let visibleCount = 4;
  let blogItems = collectStaticBlogs();

  function escapeHTML(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function slugify(title) {
    return String(title || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function formatDate(dateValue) {
    if (!dateValue) return '';
    return new Date(dateValue).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }

  function inferTopics(blog) {
    const text = `${blog.title || ''} ${(blog.contentBlocks || []).map(block => block.value || '').join(' ')}`.toLowerCase();
    const topicMap = {
      'disease-detection': ['disease', 'health', 'detect'],
      productivity: ['productivity', 'efficiency', 'yield'],
      monitoring: ['monitor', 'sensor', 'tracking', 'climate'],
      sustainability: ['sustainability', 'sustainable', 'energy', 'water'],
      feeding: ['feed', 'feeding'],
      intelligence: ['intelligence', 'ai', 'machine learning'],
      infrastructure: ['infrastructure', 'smart livestock']
    };

    return Object.entries(topicMap)
      .filter(([, words]) => words.some(word => text.includes(word)))
      .map(([topic]) => topic);
  }

  function collectStaticBlogs() {
    return Array.from(blogList.querySelectorAll('.blog-card')).map(card => {
      const title = card.querySelector('h3')?.textContent.trim() || '';
      return {
        title,
        slug: slugify(title),
        coverImage: card.querySelector('img')?.getAttribute('src') || '',
        dateLabel: card.querySelector('.blog-meta')?.textContent || '',
        publishedAt: '',
        topics: [],
        source: 'static'
      };
    });
  }

  function normalizeMongoBlog(blog) {
    return {
      title: blog.title,
      slug: blog.slug,
      coverImage: blog.coverImage,
      dateLabel: `${blog.author?.name || 'FarmSence'} - ${formatDate(blog.publishedAt || blog.updatedAt || blog.createdAt)}`,
      publishedAt: blog.publishedAt || blog.updatedAt || blog.createdAt,
      topics: inferTopics(blog),
      source: 'mongo'
    };
  }

  async function loadPublishedBlogs() {
    try {
      const res = await fetch('/api/blogs?sort=newest');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.blogs)) {
        blogItems = data.blogs.map(normalizeMongoBlog);
        visibleCount = 4;
        render();
      }
    } catch (err) {
      console.warn('Using bundled blog cards:', err.message);
    }
  }

  function navigateToArticle(slug) {
    if (slug) window.location.href = `blog-detail.html?slug=${encodeURIComponent(slug)}`;
  }

  function filteredAndSortedBlogs() {
    const filtered = blogItems.filter(blog => {
      if (activeFilters.size === 0) return true;
      return [...activeFilters].some(filter => blog.topics.includes(filter));
    });

    return filtered.sort((a, b) => {
      if (currentSort === 'oldest') return String(a.publishedAt).localeCompare(String(b.publishedAt));
      if (currentSort === 'alpha-az') return a.title.localeCompare(b.title);
      if (currentSort === 'alpha-za') return b.title.localeCompare(a.title);
      return String(b.publishedAt).localeCompare(String(a.publishedAt));
    });
  }

  function blogCardHTML(blog, hidden) {
    return `
      <div class="blog-card${hidden ? ' hidden-blog' : ''}" data-slug="${escapeHTML(blog.slug)}" style="${hidden ? 'display:none;' : ''}">
        <img src="${escapeHTML(blog.coverImage)}" alt="${escapeHTML(blog.title)}">
        <h3>${escapeHTML(blog.title)}</h3>
        <div class="blog-meta">${escapeHTML(blog.dateLabel)}</div>
      </div>
    `;
  }

  function sideCardHTML(blog) {
    return `
      <div class="blog-small" data-slug="${escapeHTML(blog.slug)}">
        <img src="${escapeHTML(blog.coverImage)}" alt="${escapeHTML(blog.title)}">
        <p>${escapeHTML(blog.title)}</p>
        <div class="blog-meta">${escapeHTML(blog.dateLabel)}</div>
      </div>
    `;
  }

  function render() {
    const blogs = filteredAndSortedBlogs();
    const visibleBlogs = blogs.slice(0, visibleCount);

    blogSideCards.innerHTML = blogs.slice(0, 4).map(sideCardHTML).join('');
    blogList.innerHTML = blogs.length
      ? blogs.map((blog, index) => blogCardHTML(blog, index >= visibleCount)).join('')
      : '<div class="blog-card" style="grid-column:1/-1; cursor:default;"><h3>No published blogs yet</h3><div class="blog-meta">Check back soon for new articles.</div></div>';

    loadMoreBtn.style.display = blogs.length > visibleBlogs.length ? 'block' : 'none';
    attachArticleClicks();
  }

  function attachArticleClicks() {
    document.querySelectorAll('.blog-card, .blog-small').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => navigateToArticle(card.dataset.slug));
    });
  }

  function closeFilter() {
    filterPanel.classList.remove('open');
    filterBtn.classList.remove('open');
    filterIcon.classList.remove('fa-xmark');
    filterIcon.classList.add('fa-sliders');
  }

  function closeSort() {
    sortMenu.classList.remove('open');
    sortBtn.classList.remove('open');
    sortIcon.classList.remove('fa-chevron-up');
    sortIcon.classList.add('fa-chevron-down');
  }

  filterBtn.addEventListener('click', e => {
    e.stopPropagation();
    const willOpen = !filterPanel.classList.contains('open');
    closeSort();
    filterPanel.classList.toggle('open', willOpen);
    filterBtn.classList.toggle('open', willOpen);
    filterIcon.classList.toggle('fa-sliders', !willOpen);
    filterIcon.classList.toggle('fa-xmark', willOpen);
  });

  sortBtn.addEventListener('click', e => {
    e.stopPropagation();
    const willOpen = !sortMenu.classList.contains('open');
    closeFilter();
    sortMenu.classList.toggle('open', willOpen);
    sortBtn.classList.toggle('open', willOpen);
    sortIcon.classList.toggle('fa-chevron-down', !willOpen);
    sortIcon.classList.toggle('fa-chevron-up', willOpen);
  });

  document.addEventListener('click', () => {
    closeFilter();
    closeSort();
  });

  filterPanel.addEventListener('click', e => e.stopPropagation());
  sortMenu.addEventListener('click', e => e.stopPropagation());

  topicFilters.forEach(cb => {
    cb.addEventListener('change', () => {
      cb.checked ? activeFilters.add(cb.value) : activeFilters.delete(cb.value);
      filterBtn.classList.toggle('has-filters', activeFilters.size > 0);
      visibleCount = 4;
      render();
    });
  });

  sortOptions.forEach(option => {
    option.addEventListener('click', () => {
      sortOptions.forEach(item => item.classList.remove('active'));
      option.classList.add('active');
      currentSort = option.dataset.sort;
      visibleCount = 4;
      render();
      closeSort();
    });
  });

  document.getElementById('clearFiltersBtn').addEventListener('click', () => {
    topicFilters.forEach(cb => { cb.checked = false; });
    activeFilters.clear();
    filterBtn.classList.remove('has-filters');
    currentSort = 'newest';
    visibleCount = 4;
    sortOptions.forEach(option => option.classList.toggle('active', option.dataset.sort === 'newest'));
    render();
  });

  loadMoreBtn.addEventListener('click', () => {
    visibleCount += 4;
    render();
  });

  render();
  loadPublishedBlogs();
});
