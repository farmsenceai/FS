// article-utils.js
// Shared utility functions for blog and research detail pages

/**
 * Get URL query parameter by name
 * @param {string} name - Parameter name
 * @returns {string|null} - Parameter value or null
 */
function getQueryParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

/**
 * Extract slug from URL
 * @returns {string} - Article slug from URL parameter
 */
function getArticleSlug() {
  return getQueryParameter('slug') || '';
}

/**
 * Find article by slug in data object
 * @param {object} articlesData - Articles data object (blogArticles or researchArticles)
 * @param {string} slug - Article slug to find
 * @returns {object|null} - Article object or null if not found
 */
function findArticleBySlug(articlesData, slug) {
  if (!slug) return null;
  return articlesData[slug] || null;
}

/**
 * Generate slug from title for URL safety
 * @param {string} title - Article title
 * @returns {string} - URL-safe slug
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Format date for display
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} - Formatted date
 */
function formatDate(dateString) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [year, month, day] = dateString.split('-');
  return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
}

/**
 * Create navigation URL for article
 * @param {string} baseUrl - Base URL (e.g., 'blog-detail.html')
 * @param {string} slug - Article slug
 * @returns {string} - Full URL with slug parameter
 */
function createArticleUrl(baseUrl, slug) {
  return `${baseUrl}?slug=${encodeURIComponent(slug)}`;
}

/**
 * Calculate reading time based on word count
 * @param {string} text - Article text
 * @returns {string} - Reading time formatted as "X min read"
 */
function calculateReadingTime(text) {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return `${readingTime} min read`;
}

/**
 * Get related articles
 * @param {object} articlesData - Articles data object
 * @param {array} relatedSlugs - Array of related article slugs
 * @returns {array} - Array of related article objects
 */
function getRelatedArticles(articlesData, relatedSlugs) {
  return relatedSlugs
    .map(slug => findArticleBySlug(articlesData, slug))
    .filter(article => article !== null);
}

/**
 * Render article content sections
 * @param {array} sections - Array of section objects with heading and body
 * @returns {string} - HTML string of rendered sections
 */
function renderContentSections(sections) {
  return sections
    .map(section => `
      <section class="article-section">
        <h2>${section.heading}</h2>
        <div class="section-content">
          ${section.body
            .split('\n\n')
            .map(paragraph => `<p>${paragraph}</p>`)
            .join('')}
        </div>
      </section>
    `)
    .join('');
}

/**
 * Create breadcrumb navigation
 * @param {string} pageType - Type of page ('blog' or 'research')
 * @param {string} articleTitle - Title of current article
 * @returns {string} - HTML string for breadcrumb
 */
function createBreadcrumb(pageType, articleTitle) {
  const pageLabel = pageType === 'blog' ? 'Blogs' : 'Research';
  const pageUrl = pageType === 'blog' ? 'blogs.html' : 'research.html';
  
  return `
    <nav class="breadcrumb">
      <a href="${pageUrl}" class="breadcrumb-link">← Back to ${pageLabel}</a>
    </nav>
  `;
}

/**
 * Render related articles cards
 * @param {array} relatedArticles - Array of related article objects
 * @param {string} pageType - Type of page ('blog' or 'research')
 * @returns {string} - HTML string of related articles cards
 */
function renderRelatedArticles(relatedArticles, pageType) {
  if (!relatedArticles || relatedArticles.length === 0) {
    return '';
  }

  const detailPageUrl = pageType === 'blog' ? 'blog-detail.html' : 'research-detail.html';
  
  const cardsHTML = relatedArticles
    .slice(0, 3)
    .map(article => `
      <a href="${createArticleUrl(detailPageUrl, article.slug)}" class="related-card">
        <div class="related-card-image">
          <img src="${article.heroImage}" alt="${article.title}">
        </div>
        <div class="related-card-content">
          <h3>${article.title}</h3>
          <div class="related-card-meta">
            <span class="date">${article.dateFormatted}</span>
          </div>
        </div>
      </a>
    `)
    .join('');

  return `
    <section class="related-articles">
      <h2>Related ${pageType === 'blog' ? 'Articles' : 'Research'}</h2>
      <div class="related-grid">
        ${cardsHTML}
      </div>
    </section>
  `;
}

/**
 * Render article hero section
 * @param {object} article - Article object
 * @returns {string} - HTML string for hero section
 */
function renderHeroSection(article) {
  return `
    <section class="article-hero">
      <img src="${article.heroImage}" alt="${article.title}" class="hero-image">
      <div class="hero-overlay">
        <div class="hero-content">
          <div class="hero-meta">
            <span class="author">${article.author}</span>
            <span class="separator">•</span>
            <span class="date">${article.dateFormatted}</span>
            <span class="separator">•</span>
            <span class="reading-time">${article.readingTime}</span>
          </div>
          <h1>${article.title}</h1>
        </div>
      </div>
    </section>
  `;
}

/**
 * Render article tags
 * @param {array} tags - Array of tag strings
 * @returns {string} - HTML string of tag elements
 */
function renderTags(tags) {
  if (!tags || tags.length === 0) return '';
  
  const tagsHTML = tags
    .map(tag => `<span class="tag">${tag}</span>`)
    .join('');
  
  return `<div class="article-tags">${tagsHTML}</div>`;
}

/**
 * Scroll to top smoothly
 */
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

/**
 * Handle navigation click
 * @param {string} url - URL to navigate to
 */
function navigateTo(url) {
  window.location.href = url;
}

/**
 * Extract all text from article for reading time calculation
 * @param {object} article - Article object
 * @returns {string} - All text content
 */
function extractArticleText(article) {
  const parts = [
    article.content.intro,
    ...article.content.sections.map(s => `${s.heading} ${s.body}`),
    article.content.conclusion
  ];
  return parts.join(' ');
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getQueryParameter,
    getArticleSlug,
    findArticleBySlug,
    generateSlug,
    formatDate,
    createArticleUrl,
    calculateReadingTime,
    getRelatedArticles,
    renderContentSections,
    createBreadcrumb,
    renderRelatedArticles,
    renderHeroSection,
    renderTags,
    scrollToTop,
    navigateTo,
    extractArticleText
  };
}