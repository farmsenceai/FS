// research-detail.js
// Logic for research article detail page

document.addEventListener('DOMContentLoaded', function() {
  
  // Initialize page with article data
  initializeResearchDetail();

});

const fallbackResearchArticles = {
  "building-smart-livestock": createFallbackResearchArticle("building-smart-livestock", "Building smart livestock infrastructure", "/assets/images/Test Images/pexels-pixabay-373543.jpg", "Nov 2025", ["Infrastructure", "Smart Livestock"]),
  "ai-powered-monitoring": createFallbackResearchArticle("ai-powered-monitoring", "AI powered poultry monitoring", "/assets/images/Test Images/cc1.png", "Oct 2025", ["Monitoring", "AI"]),
  "future-intelligent-farms": createFallbackResearchArticle("future-intelligent-farms", "Future of intelligent farms", "/assets/images/Test Images/cc2.png", "Sep 2025", ["Intelligence", "Future"]),
  "smart-monitoring-systems": createFallbackResearchArticle("smart-monitoring-systems", "Smart monitoring systems for modern poultry farms", "/assets/images/Test Images/pexels-stitch-20280066.jpg", "Jan 2026", ["Monitoring", "Sensors"]),
  "using-ai-detect-diseases": createFallbackResearchArticle("using-ai-detect-diseases", "Using AI to detect poultry diseases early", "/assets/images/Test Images/pexels-cottonbro-4911739.jpg", "Jan 2026", ["Disease Detection", "AI"]),
  "how-smart-feeding-reduces-costs": createFallbackResearchArticle("how-smart-feeding-reduces-costs", "How smart feeding reduces poultry costs", "/assets/images/Test Images/pexels-ekaterina-bolovtsova-6192337.jpg", "Dec 2025", ["Feeding", "Efficiency"]),
  "real-time-flock-monitoring": createFallbackResearchArticle("real-time-flock-monitoring", "Real-time flock monitoring with AI sensors", "/assets/images/Test Images/pexels-pixabay-373543.jpg", "Dec 2025", ["Monitoring", "Sensors"]),
  "ai-powered-health-tracking": createFallbackResearchArticle("ai-powered-health-tracking", "AI-powered health tracking for flocks", "/assets/images/Test Images/cc1.png", "Nov 2025", ["Health", "AI"]),
  "how-ai-transforming-poultry-farming": createFallbackResearchArticle("how-ai-transforming-poultry-farming", "How AI is transforming poultry farming worldwide", "/assets/images/Test Images/pexels-arjun-mj-74910500-14944259.jpg", "Feb 2026", ["AI", "Poultry Farming"])
};

function createFallbackResearchArticle(slug, title, heroImage, dateFormatted, tags) {
  return {
    slug,
    title,
    author: "FarmSence Research Team",
    dateFormatted,
    heroImage,
    tags,
    content: {
      intro: `${title} explores how intelligent farm systems can help poultry operators improve visibility, decision speed, and operational resilience.`,
      sections: [
        {
          heading: "Research Overview",
          body: "This research note summarizes practical applications of AI-enabled poultry management, including sensor-led monitoring, early warning workflows, and data-informed farm decisions.\n\nThe focus is on translating farm signals into clear operating actions for farmers, managers, and technical teams."
        },
        {
          heading: "Operational Impact",
          body: "The expected impact includes faster issue detection, more consistent farm routines, better resource planning, and improved confidence in day-to-day decisions.\n\nThese benefits become especially important for farms managing larger flock sizes, tighter margins, and variable environmental conditions."
        }
      ],
      conclusion: "AI-supported poultry systems can make farm operations more measurable, responsive, and scalable while supporting better welfare and productivity outcomes."
    },
    relatedArticles: [],
    readingTime: "4 min read"
  };
}

/**
 * Main initialization function for research detail page
 */
async function initializeResearchDetail() {
  // Get article slug from URL
  const slug = getArticleSlug();
  
  if (!slug) {
    displayErrorMessage('No article specified', 'Please go back to the research page and select an article.');
    return;
  }

  // Find article in data
  const article = typeof researchArticles !== 'undefined'
    ? findArticleBySlug(researchArticles, slug) || fallbackResearchArticles[slug]
    : fallbackResearchArticles[slug];
  
  if (article) {
    const textContent = extractArticleText(article);
    article.readingTime = calculateReadingTime(textContent);
    renderResearchArticle(article);
    initializeComments(slug);
    document.title = `${article.title} | FarmSence Research`;
    return;
  }

  try {
    const response = await fetch(`/api/blogs/post/${encodeURIComponent(slug)}`);
    const data = await response.json();
    if (response.ok && data.success && data.blog) {
      renderPublishedBlogResearchArticle(data.blog);
      initializeComments(slug);
      document.title = `${data.blog.title} | FarmSence Research`;
      return;
    }
  } catch (err) {
    console.warn('Published blog lookup failed for research detail:', err.message);
  }

  displayErrorMessage('Article not found', 'The research article you\'re looking for doesn\'t exist. Slug: ' + slug);
}

/**
 * Render complete research article page
 * @param {object} article - Article data object
 */
function renderResearchArticle(article) {
  const mainContent = document.getElementById('article-content');
  
  if (!mainContent) {
    console.error('Article content container not found');
    return;
  }

  // Clear any loading states
  mainContent.innerHTML = '';

  // Render breadcrumb
  const breadcrumbHTML = createBreadcrumb('research', article.title);
  
  // Render hero section
  const heroHTML = renderHeroSection(article);
  
  // Render article container with content
  const articleHTML = `
    <div class="article-container">
      ${renderTags(article.tags)}
      
      <div class="article-intro">
        ${article.content.intro}
      </div>

      ${renderContentSections(article.content.sections)}

      <div class="article-conclusion">
        ${article.content.conclusion}
      </div>

      ${renderRelatedArticles(getRelatedArticles(typeof researchArticles !== 'undefined' ? researchArticles : {}, article.relatedArticles), 'research')}

      ${renderCommentsShell()}

      <div class="article-footer-nav">
        <a href="research.html" class="nav-button nav-button-secondary">← Back to Research</a>
      </div>
    </div>
  `;

  // Combine all HTML
  const fullHTML = breadcrumbHTML + heroHTML + articleHTML;
  
  // Insert into page
  mainContent.innerHTML = fullHTML;

  // Attach event listeners
  attachArticleListeners();
  
  // Scroll to top
  window.scrollTo(0, 0);
}

function escapeHTML(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeRichHTML(html) {
  const template = document.createElement('template');
  template.innerHTML = html || '';
  const allowedTags = new Set(['P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'A', 'UL', 'OL', 'LI', 'H2', 'H3', 'H4', 'DIV']);
  template.content.querySelectorAll('*').forEach(node => {
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(document.createTextNode(node.textContent || ''));
      return;
    }

    [...node.attributes].forEach(attr => {
      if (node.tagName === 'A' && attr.name === 'href') {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      } else {
        node.removeAttribute(attr.name);
      }
    });
  });
  return template.innerHTML;
}

function formatBlogDate(dateValue) {
  if (!dateValue) return '';
  return new Date(dateValue).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function getBlockText(block) {
  if (block.type === 'list') return (block.listItems || []).join(' ');
  return block.value || '';
}

function renderPublishedBlogBlocks(blocks = []) {
  return blocks.map(block => {
    if (block.type === 'heading') {
      const level = Math.min(Math.max(Number(block.headingLevel) || 2, 2), 6);
      return `<h${level}>${escapeHTML(block.value)}</h${level}>`;
    }

    if (block.type === 'image') {
      return `
        <figure class="article-inline-image">
          <img src="${escapeHTML(block.value)}" alt="${escapeHTML(block.imageAlt || block.imageCaption || '')}">
          ${block.imageCaption ? `<figcaption>${escapeHTML(block.imageCaption)}</figcaption>` : ''}
        </figure>`;
    }

    if (block.type === 'quote') {
      return `<blockquote>${escapeHTML(block.value)}</blockquote>`;
    }

    if (block.type === 'list') {
      const items = (block.listItems || []).map(item => `<li>${escapeHTML(item)}</li>`).join('');
      return `<ul>${items}</ul>`;
    }

    return `<div class="article-rich-text">${sanitizeRichHTML(block.value)}</div>`;
  }).join('');
}

function renderPublishedBlogResearchArticle(blog) {
  const mainContent = document.getElementById('article-content');

  if (!mainContent) {
    console.error('Article content container not found');
    return;
  }

  const text = (blog.contentBlocks || []).map(getBlockText).join(' ');
  const readingTime = calculateReadingTime(text || blog.title || '');
  const publishedDate = formatBlogDate(blog.publishedAt || blog.updatedAt || blog.createdAt);
  const authorName = blog.author && blog.author.name ? blog.author.name : 'FarmSence';

  mainContent.innerHTML = `
    <nav class="breadcrumb">
      <a href="research.html" class="breadcrumb-link">Back to Research</a>
    </nav>
    <section class="article-hero">
      <img src="${escapeHTML(blog.coverImage)}" alt="${escapeHTML(blog.title)}" class="hero-image">
      <div class="hero-overlay">
        <div class="hero-content">
          <div class="hero-meta">
            <span class="author">${escapeHTML(authorName)}</span>
            <span class="separator">-</span>
            <span class="date">${escapeHTML(publishedDate)}</span>
            <span class="separator">-</span>
            <span class="reading-time">${escapeHTML(readingTime)}</span>
          </div>
          <h1>${escapeHTML(blog.title)}</h1>
        </div>
      </div>
    </section>
    <div class="article-container">
      <div class="article-section">
        <div class="section-content">
          ${renderPublishedBlogBlocks(blog.contentBlocks)}
        </div>
      </div>
      ${renderCommentsShell()}
      <div class="article-footer-nav">
        <a href="research.html" class="nav-button nav-button-secondary">Back to Research</a>
      </div>
    </div>
  `;

  attachArticleListeners();
  window.scrollTo(0, 0);
}

function getAuthToken() {
  return localStorage.getItem('fs_token');
}

function getCommentAuthorName(comment) {
  if (comment.author?.name) return comment.author.name;
  if (comment.author?.email) return comment.author.email.split('@')[0];
  return 'FarmSence reader';
}

function renderCommentsShell() {
  const token = getAuthToken();
  return `
    <section class="blog-comments" id="blog-comments">
      <div class="blog-comments-header">
        <div>
          <p class="blog-comments-kicker">Discussion</p>
          <h2>Comments</h2>
        </div>
        <span class="blog-comments-count" id="blog-comments-count">0</span>
      </div>

      ${token ? `
        <form class="blog-comment-form" id="blog-comment-form">
          <label for="blog-comment-input">Add a comment</label>
          <textarea id="blog-comment-input" maxlength="1000" rows="4" placeholder="Share your thoughts on this post"></textarea>
          <div class="blog-comment-form-footer">
            <span id="blog-comment-message" aria-live="polite"></span>
            <button type="submit">Post Comment</button>
          </div>
        </form>
      ` : `
        <div class="blog-comment-login">
          <p>Log in to join the discussion on this post.</p>
          <button type="button" id="blog-comment-login-btn">Log in to comment</button>
        </div>
      `}

      <div class="blog-comments-list" id="blog-comments-list">
        <div class="blog-comments-empty">Loading comments...</div>
      </div>
    </section>
  `;
}

function renderComment(comment) {
  const date = formatBlogDate(comment.createdAt);
  return `
    <article class="blog-comment">
      <div class="blog-comment-avatar">${escapeHTML(getCommentAuthorName(comment).charAt(0).toUpperCase())}</div>
      <div class="blog-comment-body">
        <div class="blog-comment-meta">
          <strong>${escapeHTML(getCommentAuthorName(comment))}</strong>
          <span>${escapeHTML(date)}</span>
        </div>
        <p>${escapeHTML(comment.body)}</p>
      </div>
    </article>
  `;
}

async function loadComments(slug) {
  const list = document.getElementById('blog-comments-list');
  const count = document.getElementById('blog-comments-count');
  if (!list || !count) return;

  try {
    const response = await fetch(`/api/blogs/post/${encodeURIComponent(slug)}/comments`);
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.msg || 'Could not load comments');

    count.textContent = String(data.comments.length);
    list.innerHTML = data.comments.length
      ? data.comments.map(renderComment).join('')
      : '<div class="blog-comments-empty">No comments yet. Be the first to start the conversation.</div>';
  } catch (err) {
    list.innerHTML = `<div class="blog-comments-empty">${escapeHTML(err.message || 'Could not load comments')}</div>`;
  }
}

function redirectToLoginForComment() {
  const returnTo = `${window.location.pathname}${window.location.search}#blog-comments`;
  window.location.href = `/src/pages/sign-in.html?redirect=${encodeURIComponent(returnTo)}`;
}

function initializeComments(slug) {
  loadComments(slug);

  if (window.location.hash === '#blog-comments') {
    setTimeout(() => {
      document.getElementById('blog-comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  const loginButton = document.getElementById('blog-comment-login-btn');
  if (loginButton) {
    loginButton.addEventListener('click', redirectToLoginForComment);
  }

  const form = document.getElementById('blog-comment-form');
  if (!form) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const input = document.getElementById('blog-comment-input');
    const message = document.getElementById('blog-comment-message');
    const comment = input.value.trim();
    const token = getAuthToken();

    if (!token) {
      redirectToLoginForComment();
      return;
    }

    if (!comment) {
      message.textContent = 'Write a comment before posting.';
      message.classList.remove('success');
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    message.textContent = 'Posting...';
    message.classList.remove('success');

    try {
      const response = await fetch(`/api/blogs/post/${encodeURIComponent(slug)}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment })
      });
      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem('fs_token');
        redirectToLoginForComment();
        return;
      }

      if (!response.ok || !data.success) throw new Error(data.msg || 'Could not post comment');

      input.value = '';
      message.textContent = 'Comment posted.';
      message.classList.add('success');
      await loadComments(slug);
    } catch (err) {
      message.textContent = err.message || 'Could not post comment';
      message.classList.remove('success');
    } finally {
      button.disabled = false;
    }
  });
}

/**
 * Display error message when article cannot be loaded
 * @param {string} title - Error title
 * @param {string} message - Error message
 */
function displayErrorMessage(title, message) {
  const mainContent = document.getElementById('article-content');
  
  if (!mainContent) {
    console.error('Cannot display error: article-content element not found');
    return;
  }

  const errorHTML = `
    <div class="error-message">
      <h2>${title}</h2>
      <p>${message}</p>
      <a href="research.html" class="back-link">← Return to Research</a>
    </div>
  `;

  mainContent.innerHTML = errorHTML;
}

/**
 * Attach event listeners to article elements
 */
function attachArticleListeners() {
  // Handle link clicks for related articles
  const relatedLinks = document.querySelectorAll('.related-card');
  relatedLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Links navigate naturally via href attribute
    });
  });

  // Handle "Back to Research" button
  const backButton = document.querySelector('.nav-button-secondary');
  if (backButton) {
    backButton.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'research.html';
    });
  }

  // Add smooth scroll behavior to any anchor links within article
  const internalLinks = document.querySelectorAll('a[href^="#"]');
  internalLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/**
 * Handle print functionality for research articles
 */
function handlePrint() {
  window.print();
}

/**
 * Copy article link to clipboard
 */
function copyArticleLink() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    alert('Article link copied to clipboard!');
  }).catch(() => {
    // Fallback for older browsers
    const temp = document.createElement('input');
    temp.value = url;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
    alert('Article link copied to clipboard!');
  });
}

/**
 * Share article to social media
 * @param {string} platform - Social media platform (twitter, facebook, linkedin)
 */
function shareArticle(platform) {
  const url = encodeURIComponent(window.location.href);
  const titleEl = document.querySelector('h1');
  const title = titleEl ? encodeURIComponent(titleEl.textContent) : 'FarmSence Research';
  
  let shareUrl = '';
  
  switch(platform) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
      break;
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      break;
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
      break;
  }
  
  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }
}

/**
 * Scroll to specific section smoothly
 * @param {string} sectionId - ID of section to scroll to
 */
function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Track article engagement and research paper views (analytics)
 */
function trackEngagement() {
  const slug = getArticleSlug();
  
  // Example: Send to analytics service
  if (typeof gtag !== 'undefined') {
    gtag('event', 'research_article_view', {
      article_slug: slug,
      article_title: document.querySelector('h1')?.textContent
    });
  }
}

// Call tracking on page load
trackEngagement();
