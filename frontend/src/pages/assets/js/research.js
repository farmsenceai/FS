document.addEventListener("DOMContentLoaded", function () {
  const filterBtn = document.getElementById("filterBtn");
  const filterPanel = document.getElementById("filterPanel");
  const filterIcon = document.getElementById("filterIcon");
  const sortBtn = document.getElementById("sortBtn");
  const sortIcon = document.getElementById("sortIcon");
  const sortMenu = document.getElementById("sortMenu");
  const topicFilters = document.querySelectorAll(".topic-filter");
  const sortOptions = document.querySelectorAll(".sort-option");
  const blogSideCards = document.getElementById("blogSideCards");
  const blogList = document.getElementById("blog-list");
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  let activeFilters = new Set();
  let currentSort = "newest";
  let visibleCount = 4;

  const staticMetadata = {
    "Early disease detection using AI sensors": { date: "2026-02-01", topics: ["disease-detection"], slug: "early-disease-detection-ai-sensors" },
    "How AI improves poultry productivity": { date: "2026-01-15", topics: ["productivity"], slug: "ai-improves-poultry-productivity" },
    "Data driven flock management": { date: "2026-01-10", topics: ["monitoring"], slug: "data-driven-flock-management" },
    "AI for climate controlled poultry farms": { date: "2025-12-20", topics: ["monitoring"], slug: "ai-climate-controlled-farms" },
    "Future of poultry intelligence systems": { date: "2025-12-15", topics: ["intelligence"], slug: "future-poultry-intelligence" },
    "Building smart livestock infrastructure": { date: "2025-11-20", topics: ["infrastructure"], slug: "building-smart-livestock" },
    "AI powered poultry monitoring": { date: "2025-10-25", topics: ["monitoring"], slug: "ai-powered-monitoring" },
    "Future of intelligent farms": { date: "2025-09-30", topics: ["intelligence"], slug: "future-intelligent-farms" },
    "Smart monitoring systems for modern poultry farms": { date: "2026-01-20", topics: ["monitoring"], slug: "smart-monitoring-systems" },
    "Using AI to detect poultry diseases early": { date: "2026-01-15", topics: ["disease-detection"], slug: "using-ai-detect-diseases" },
    "How smart feeding reduces poultry costs": { date: "2025-12-10", topics: ["feeding"], slug: "how-smart-feeding-reduces-costs" },
    "Real-time flock monitoring with AI sensors": { date: "2025-12-05", topics: ["monitoring"], slug: "real-time-flock-monitoring" },
    "AI-powered health tracking for flocks": { date: "2025-11-20", topics: ["disease-detection"], slug: "ai-powered-health-tracking" }
  };

  let researchItems = collectStaticItems();

  function escapeHTML(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(dateValue) {
    if (!dateValue) return "";
    return new Date(dateValue).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  }

  function inferTopics(blog) {
    const text = `${blog.title || ""} ${(blog.contentBlocks || []).map(block => block.value || "").join(" ")}`.toLowerCase();
    const topicMap = {
      "disease-detection": ["disease", "health", "detect"],
      productivity: ["productivity", "efficiency", "yield"],
      monitoring: ["monitor", "sensor", "tracking", "climate"],
      sustainability: ["sustainability", "sustainable", "energy", "water"],
      feeding: ["feed", "feeding"],
      intelligence: ["intelligence", "ai", "machine learning"],
      infrastructure: ["infrastructure", "smart livestock"]
    };

    return Object.entries(topicMap)
      .filter(([, words]) => words.some(word => text.includes(word)))
      .map(([topic]) => topic);
  }

  function collectStaticItems() {
    const items = [];

    Array.from(blogList.querySelectorAll(".blog-card")).forEach((card, index) => {
      const title = card.querySelector("h3")?.textContent.trim() || "";
      const meta = staticMetadata[title] || {};
      items.push({
        title,
        slug: meta.slug,
        coverImage: card.querySelector("img")?.getAttribute("src") || "",
        date: meta.date || "2000-01-01",
        dateLabel: card.querySelector(".blog-meta")?.textContent.trim() || "",
        topics: meta.topics || [],
        source: "static",
        initialHidden: card.classList.contains("hidden-blog") || index >= 4
      });
    });

    Array.from(blogSideCards.querySelectorAll(".blog-small")).forEach(card => {
      const title = card.querySelector("p")?.textContent.trim() || "";
      const meta = staticMetadata[title] || {};
      if (items.some(item => item.slug === meta.slug)) return;
      items.push({
        title,
        slug: meta.slug,
        coverImage: card.querySelector("img")?.getAttribute("src") || "",
        date: meta.date || "2000-01-01",
        dateLabel: card.querySelector(".blog-meta")?.textContent.trim() || "",
        topics: meta.topics || [],
        source: "static",
        initialHidden: true
      });
    });

    return items.filter(item => item.title && item.slug);
  }

  function normalizePublishedBlog(blog) {
    return {
      title: blog.title,
      slug: blog.slug,
      coverImage: blog.coverImage,
      date: blog.publishedAt || blog.updatedAt || blog.createdAt,
      dateLabel: `${blog.author?.name || "FarmSence"} - ${formatDate(blog.publishedAt || blog.updatedAt || blog.createdAt)}`,
      topics: inferTopics(blog),
      source: "published-blog",
      initialHidden: true
    };
  }

  async function loadPublishedBlogs() {
    try {
      const res = await fetch("/api/blogs?sort=newest");
      const data = await res.json();
      if (!res.ok || !data.success || !Array.isArray(data.blogs)) return;

      const existingSlugs = new Set(researchItems.map(item => item.slug));
      const publishedItems = data.blogs
        .map(normalizePublishedBlog)
        .filter(item => item.slug && !existingSlugs.has(item.slug));

      researchItems = [...researchItems, ...publishedItems];
      visibleCount = 4;
      render();
    } catch (err) {
      console.warn("Research page could not load published blog posts:", err.message);
    }
  }

  function openFilter() {
    filterPanel.classList.add("open");
    filterBtn.classList.add("open");
    filterIcon.classList.remove("fa-sliders");
    filterIcon.classList.add("fa-xmark");
    closeSort();
  }

  function closeFilter() {
    filterPanel.classList.remove("open");
    filterBtn.classList.remove("open");
    filterIcon.classList.remove("fa-xmark");
    filterIcon.classList.add("fa-sliders");
  }

  function openSort() {
    sortMenu.classList.add("open");
    sortBtn.classList.add("open");
    sortIcon.classList.remove("fa-chevron-down");
    sortIcon.classList.add("fa-chevron-up");
    closeFilter();
  }

  function closeSort() {
    sortMenu.classList.remove("open");
    sortBtn.classList.remove("open");
    sortIcon.classList.remove("fa-chevron-up");
    sortIcon.classList.add("fa-chevron-down");
  }

  function filteredAndSortedItems() {
    return researchItems
      .filter(item => activeFilters.size === 0 || [...activeFilters].some(filter => item.topics.includes(filter)))
      .sort((a, b) => {
        if (currentSort === "oldest") return String(a.date).localeCompare(String(b.date));
        if (currentSort === "alpha-az") return a.title.localeCompare(b.title);
        if (currentSort === "alpha-za") return b.title.localeCompare(a.title);
        return String(b.date).localeCompare(String(a.date));
      });
  }

  function navigateToArticle(slug) {
    if (slug) window.location.href = `research-detail.html?slug=${encodeURIComponent(slug)}`;
  }

  function sideCardHTML(item) {
    return `
      <div class="blog-small" data-slug="${escapeHTML(item.slug)}">
        <img src="${escapeHTML(item.coverImage)}" alt="${escapeHTML(item.title)}">
        <p>${escapeHTML(item.title)}</p>
        <div class="blog-meta">${escapeHTML(item.dateLabel)}</div>
      </div>`;
  }

  function gridCardHTML(item, hidden) {
    return `
      <div class="blog-card${hidden ? " hidden-blog" : ""}" data-slug="${escapeHTML(item.slug)}" style="${hidden ? "display:none;" : ""}">
        <img src="${escapeHTML(item.coverImage)}" alt="${escapeHTML(item.title)}">
        <h3>${escapeHTML(item.title)}</h3>
        <div class="blog-meta">${escapeHTML(item.dateLabel)}</div>
      </div>`;
  }

  function render() {
    const items = filteredAndSortedItems();
    const visibleItems = items.slice(0, visibleCount);

    blogSideCards.innerHTML = items.slice(0, 5).map(sideCardHTML).join("");
    blogList.innerHTML = items.length
      ? items.map((item, index) => gridCardHTML(item, index >= visibleCount)).join("")
      : '<div class="blog-card" style="grid-column:1/-1; cursor:default;"><h3>No research posts found</h3><div class="blog-meta">Try clearing your filters.</div></div>';

    if (loadMoreBtn) loadMoreBtn.style.display = items.length > visibleItems.length ? "block" : "none";
    attachCardListeners();
  }

  function attachCardListeners() {
    document.querySelectorAll(".blog-card[data-slug], .blog-small[data-slug]").forEach(card => {
      card.style.cursor = "pointer";
      card.addEventListener("click", () => navigateToArticle(card.dataset.slug));
    });
  }

  filterBtn.addEventListener("click", event => {
    event.stopPropagation();
    filterPanel.classList.contains("open") ? closeFilter() : openFilter();
  });

  sortBtn.addEventListener("click", event => {
    event.stopPropagation();
    sortMenu.classList.contains("open") ? closeSort() : openSort();
  });

  document.addEventListener("click", () => {
    closeFilter();
    closeSort();
  });

  filterPanel.addEventListener("click", event => event.stopPropagation());
  sortMenu.addEventListener("click", event => event.stopPropagation());

  topicFilters.forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      checkbox.checked ? activeFilters.add(checkbox.value) : activeFilters.delete(checkbox.value);
      filterBtn.classList.toggle("has-filters", activeFilters.size > 0);
      visibleCount = 4;
      render();
    });
  });

  sortOptions.forEach(option => {
    option.addEventListener("click", () => {
      sortOptions.forEach(item => item.classList.remove("active"));
      option.classList.add("active");
      currentSort = option.dataset.sort;
      visibleCount = 4;
      render();
      closeSort();
    });
  });

  document.getElementById("clearFiltersBtn").addEventListener("click", () => {
    topicFilters.forEach(checkbox => { checkbox.checked = false; });
    activeFilters.clear();
    filterBtn.classList.remove("has-filters");
    currentSort = "newest";
    visibleCount = 4;
    sortOptions.forEach(option => option.classList.toggle("active", option.dataset.sort === "newest"));
    render();
  });

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      visibleCount += 4;
      render();
    });
  }

  render();
  loadPublishedBlogs();
});
