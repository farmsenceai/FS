function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function renderIcon(name) {
  const icons = {
    share: '<path d="M18 8a3 3 0 1 0-2.83-4A3 3 0 0 0 15 5c0 .2.02.39.06.57L8.9 9.15a3 3 0 1 0 0 5.7l6.16 3.58A3 3 0 0 0 15 19a3 3 0 1 0 1.1-2.32L9.94 13.1a3 3 0 0 0 0-2.2l6.16-3.58A3 3 0 0 0 18 8Z"/>',
    print: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/>',
    bookmark: '<path d="M6 3h12v19l-6-4-6 4z"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
}

module.exports = function renderCaseStudyDetail(caseStudy) {
  const tabs = caseStudy.sections.map((section, index) =>
    `<a class="case-nav__tab${index === 0 ? ' is-active' : ''}" href="#${escapeHtml(section.id)}" data-section-id="${escapeHtml(section.id)}">${escapeHtml(section.navLabel)}</a>`
  ).join('');
  const stats = caseStudy.statSection.stats.map(stat =>
    `<div class="case-stat"><strong>${escapeHtml(stat.value)}</strong><span>${escapeHtml(stat.label)}</span></div>`
  ).join('');
  const sections = caseStudy.sections.map(section => `
    <section class="case-section" id="${escapeHtml(section.id)}" data-case-section>
      <div class="case-section__banner" style="--banner-image:url('${encodeURI(section.bannerImage)}')">
        <div class="case-section__heading"><span>${escapeHtml(section.sectionLabel)}</span><h2>${escapeHtml(section.heading)}</h2></div>
      </div>
      <div class="case-section__body">${section.body}</div>
    </section>`).join('');

  return `<!doctype html><html lang="en"><head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(caseStudy.title)} — FarmSence.ai</title>
    <meta name="description" content="${escapeHtml(caseStudy.statSection.intro)}">
    <link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/assets/css/style.css">
    <link rel="stylesheet" href="/assets/css/case-study-detail.css">
    <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Libre+Caslon+Display&display=swap" rel="stylesheet">
    <script src="/assets/js/main.js" defer></script><script src="/assets/js/layout-loader.js" defer></script><script src="/assets/js/case-study-detail.js" defer></script>
  </head><body class="page-case-study-detail">
    <header class="site-header scroll-header"><div id="header-placeholder"></div></header>
    <main id="case-study-article" data-case-slug="${escapeHtml(caseStudy.slug)}">
      <section class="case-hero" style="--cover-image:url('${encodeURI(caseStudy.coverImage)}')">
        <div class="case-hero__content"><span>Case Study</span><h1>${escapeHtml(caseStudy.title)}</h1></div>
        <a class="case-hero__arrow" href="#case-stats" aria-label="Explore the case study"><span></span></a>
      </section>
      <section class="case-stats" id="case-stats" style="--cover-image:url('${encodeURI(caseStudy.coverImage)}')">
        <div class="case-stats__inner"><p>${escapeHtml(caseStudy.statSection.intro)}</p><div class="case-stats__grid">${stats}</div></div>
      </section>
      <nav class="case-nav" aria-label="On this page"><div class="case-nav__progress" aria-hidden="true"><span></span></div>
        <div class="case-nav__inner"><span class="case-nav__label">On this page:</span><div class="case-nav__tabs">${tabs}</div>
          <div class="case-nav__actions">
            <button type="button" data-case-action="share" aria-label="Share this case study">${renderIcon('share')}</button>
            <button type="button" data-case-action="print" aria-label="Print this case study">${renderIcon('print')}</button>
            <button type="button" data-case-action="bookmark" aria-label="Bookmark this case study" aria-pressed="false">${renderIcon('bookmark')}</button>
          </div></div>
      </nav>
      <article class="case-content">${sections}</article>
    </main><div id="footer-placeholder"></div>
  </body></html>`;
};
