document.addEventListener('DOMContentLoaded', initializeBlogDetail);

async function initializeBlogDetail() {
  const slug = getArticleSlug();

  if (!slug) {
    displayErrorMessage('No article specified', 'Please go back to the blogs page and select an article.');
    return;
  }

  try {
    const response = await fetch(`/api/blogs/post/${encodeURIComponent(slug)}`);
    const data = await response.json();

    if (response.ok && data.success && data.blog) {
      renderMongoBlogArticle(data.blog);
      initializeComments(slug);
      document.title = `${data.blog.title} | FarmSence Blogs`;
      return;
    }
  } catch (err) {
    console.warn('Falling back to bundled article data:', err.message);
  }

  if (typeof blogArticles === 'undefined') {
    displayErrorMessage('Article data error', 'Article data failed to load. Please refresh the page.');
    return;
  }

  const article = findArticleBySlug(blogArticles, slug);
  if (!article) {
    displayErrorMessage('Article not found', `The article you're looking for doesn't exist. Slug: ${slug}`);
    return;
  }

  article.readingTime = calculateReadingTime(extractArticleText(article));
  renderBlogArticle(article);
  initializeComments(slug);
  document.title = `${article.title} | FarmSence Blogs`;
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

function renderMongoBlocks(blocks = []) {
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

function renderMongoBlogArticle(blog) {
  const mainContent = document.getElementById('article-content');
  if (!mainContent) return;

  const text = (blog.contentBlocks || []).map(getBlockText).join(' ');
  const readingTime = calculateReadingTime(text || blog.title || '');
  const publishedDate = formatBlogDate(blog.publishedAt || blog.updatedAt || blog.createdAt);
  const authorName = blog.author && blog.author.name ? blog.author.name : 'FarmSence';

  mainContent.innerHTML = `
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
      <a href="blogs.html" class="blog-back-arrow" aria-label="Back to Blogs"><i class="fa-solid fa-arrow-left"></i></a>
      <div class="article-section">
        <div class="section-content">
          ${renderMongoBlocks(blog.contentBlocks)}
        </div>
      </div>
      ${renderCommentsShell()}
    </div>
  `;

  attachArticleListeners();
  window.scrollTo(0, 0);
}

function renderBlogArticle(article) {
  const mainContent = document.getElementById('article-content');
  if (!mainContent) return;

  const fullHTML = renderHeroSection(article) + `
    <div class="article-container">
      <a href="blogs.html" class="blog-back-arrow" aria-label="Back to Blogs"><i class="fa-solid fa-arrow-left"></i></a>
      ${renderTags(article.tags)}
      <div class="article-intro">${article.content.intro}</div>
      ${renderContentSections(article.content.sections)}
      <div class="article-conclusion">${article.content.conclusion}</div>
      ${renderRelatedArticles(getRelatedArticles(blogArticles, article.relatedArticles), 'blog')}
      ${renderCommentsShell()}
    </div>
  `;

  mainContent.innerHTML = fullHTML;
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
          <p>Log in to join the discussion on this blog.</p>
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

function displayErrorMessage(title, message) {
  const mainContent = document.getElementById('article-content');
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="error-message">
      <h2>${escapeHTML(title)}</h2>
      <p>${escapeHTML(message)}</p>
      <a href="blogs.html" class="back-link">Return to Blogs</a>
    </div>
  `;
}

function attachArticleListeners() {
  const backButton = document.querySelector('.blog-back-arrow');
  if (backButton) {
    backButton.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'blogs.html';
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetElement = document.getElementById(this.getAttribute('href').substring(1));
      if (targetElement) targetElement.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function handlePrint() {
  window.print();
}

function copyArticleLink() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    alert('Article link copied to clipboard!');
  }).catch(() => {
    const temp = document.createElement('input');
    temp.value = url;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
    alert('Article link copied to clipboard!');
  });
}

function shareArticle(platform) {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.querySelector('h1')?.textContent || 'FarmSence Article');
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
  };

  if (shareUrls[platform]) {
    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  }
}

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
