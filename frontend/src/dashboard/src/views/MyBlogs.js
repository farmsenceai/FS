/* views/MyBlogs.js */

window.metaMyBlogs = {
  title: 'My Blogs',
  subtitle: 'Manage your drafts, pending submissions, published articles, and revision requests.'
};

/* ── State (scoped to this module) ── */
let mbAllBlogs = [];
let mbCurrentTab = 'all';
let mbEditorMode = null;

/* ── CSS injected once ── */
function injectMyBlogsStyles() {
  if (document.getElementById('myblogs-styles')) return;
  const style = document.createElement('style');
  style.id = 'myblogs-styles';
  style.textContent = `
    .mb-scrollable { padding: 20px; background: #f5f6fa; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; }
    .mb-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .mb-btn { background: #16a34a; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; border: none; cursor: pointer; font-size: 13px; }
    .mb-btn:hover { background: #15803d; }
    .mb-tabs { display: flex; gap: 10px; border-bottom: 1px solid #e5e7eb; margin-bottom: 20px; }
    .mb-tab { padding: 10px 16px; cursor: pointer; border-bottom: 2px solid transparent; color: #6b7280; font-weight: 500; }
    .mb-tab.active { border-bottom-color: #16a34a; color: #16a34a; font-weight: 700; }
    .mb-tab-count { background: #f3f4f6; color: #6b7280; border-radius: 10px; padding: 1px 7px; font-size: 10px; margin-left: 6px; font-weight: 700; }
    .mb-tab.active .mb-tab-count { background: #d1fae5; color: #16a34a; }
    .mb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .mb-card { background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; display: flex; flex-direction: column; }
    .mb-card-img { width: 100%; height: 160px; object-fit: cover; background: #e5e7eb; display: block; }
    .mb-card-body { padding: 14px; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between; }
    .mb-card-title { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 6px; line-height: 1.3; }
    .mb-card-meta { font-size: 11px; color: #9ca3af; margin-bottom: 12px; }
    .mb-card-comment { font-size: 11px; color: #dc2626; background: #fef2f2; border-radius: 6px; padding: 8px 10px; margin-bottom: 10px; line-height: 1.4; }
    .mb-card-comment strong { display: block; margin-bottom: 2px; color: #b91c1c; }
    .mb-card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f3f4f6; padding-top: 10px; margin-top: 10px; gap: 8px; }
    .mb-badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; white-space: nowrap; }
    .mb-badge-draft { background: #f3f4f6; color: #4b5563; }
    .mb-badge-pending { background: #fef3c7; color: #d97706; }
    .mb-badge-published { background: #d1fae5; color: #16a34a; }
    .mb-badge-changes { background: #fee2e2; color: #dc2626; }
    .mb-badge-rejected { background: #fee2e2; color: #991b1b; }
    .mb-card-actions { display: flex; align-items: center; gap: 12px; }
    .mb-action-link { color: #16a34a; text-decoration: none; font-weight: 600; font-size: 12px; background: none; border: none; cursor: pointer; padding: 0; font-family: inherit; }
    .mb-action-link:hover { text-decoration: underline; }
    .mb-action-delete { color: #dc2626; }
    .mb-empty { text-align: center; padding: 40px; color: #6b7280; background: white; border-radius: 8px; border: 1px solid #e5e7eb; grid-column: 1 / -1; }
    .mb-empty i { font-size: 24px; color: #16a34a; margin-bottom: 10px; display: block; }
    .mb-error { color: #dc2626; }
    .mb-badge + .mb-badge { margin-left: 0; }
    .mb-editor-shell { height: calc(100vh - 190px); min-height: 720px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .mb-editor-frame { width: 100%; height: 100%; border: 0; display: block; background: #fff; }
    .mb-back-btn { background: #fff; color: #374151; border: 1px solid #d1d5db; }
    .mb-back-btn:hover { background: #f9fafb; color: #111827; }
  `;
  document.head.appendChild(style);
}

/* ── Helpers ── */

function mbBadgeClass(status) {
  const map = {
    draft: 'mb-badge-draft',
    pending_review: 'mb-badge-pending',
    published: 'mb-badge-published',
    changes_requested: 'mb-badge-changes',
    rejected: 'mb-badge-rejected'
  };
  return map[status] || 'mb-badge-draft';
}

function mbBadgeLabel(status) {
  const map = {
    draft: 'Draft',
    pending_review: 'Pending Review',
    published: 'Published',
    changes_requested: 'Changes Requested',
    rejected: 'Rejected'
  };
  return map[status] || status;
}

function mbFormatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function mbEffectiveStatus(blog) {
  return blog.pendingRevision ? blog.pendingRevision.status : blog.status;
}

function mbCardActions(blog) {
  const status = mbEffectiveStatus(blog);
  const editable = ['draft', 'changes_requested'].includes(status);
  const links = [];

  if (blog.status === 'published') {
    links.push(`<a class="mb-action-link" href="/blog/blog-detail.html?slug=${blog.slug}" target="_blank">View Live</a>`);
    links.push(`<button class="mb-action-link" data-action="edit" data-id="${blog._id}">Edit</button>`);
  } else if (editable) {
    links.push(`<button class="mb-action-link" data-action="edit" data-id="${blog._id}">${status === 'draft' ? 'Continue Editing' : 'Edit &amp; Resubmit'}</button>`);
  } else {
    // pending_review, rejected
    links.push(`<button class="mb-action-link" data-action="edit" data-id="${blog._id}">View</button>`);
  }

  if (blog.status !== 'published') {
    links.push(`<button class="mb-action-link mb-action-delete" data-action="delete" data-id="${blog._id}">Delete</button>`);
  }

  return links.join('');
}

function mbCard(blog) {
  const rev = blog.pendingRevision;
  const showComment = (blog.status === 'changes_requested' && blog.adminComments) ||
                       (rev && rev.status === 'changes_requested' && rev.adminComments);
  const commentText = rev ? rev.adminComments : blog.adminComments;

  return `
    <div class="mb-card" data-id="${blog._id}">
      <img class="mb-card-img" src="${blog.coverImage || ''}" alt="${blog.title}" onerror="this.style.background='#e5e7eb'; this.src='';">
      <div class="mb-card-body">
        <div>
          <div class="mb-card-title">${blog.title || 'Untitled'}</div>
          <div class="mb-card-meta">Last updated ${mbFormatDate(rev ? rev.updatedAt : blog.updatedAt)}</div>
          ${showComment ? `<div class="mb-card-comment"><strong>Admin feedback:</strong>${commentText}</div>` : ''}
        </div>
        <div class="mb-card-footer">
          <div style="display:flex; gap:6px; align-items:center;">
            <span class="mb-badge ${mbBadgeClass(blog.status)}">${mbBadgeLabel(blog.status)}</span>
            ${rev ? `<span class="mb-badge ${mbBadgeClass(rev.status)}" title="A newer revision is under review">Revision: ${mbBadgeLabel(rev.status)}</span>` : ''}
          </div>
          <div class="mb-card-actions">${mbCardActions(blog)}</div>
        </div>
      </div>
    </div>`;
}

function mbTabCount(status) {
  if (status === 'all') return mbAllBlogs.length;
  return mbAllBlogs.filter(b => mbEffectiveStatus(b) === status).length;
}

/* ── Rendering ── */

function renderMyBlogsGrid() {
  const grid = document.getElementById('my-blogs-grid');
  if (!grid) return;

  const filtered = mbCurrentTab === 'all'
    ? mbAllBlogs
    : mbAllBlogs.filter(b => mbEffectiveStatus(b) === mbCurrentTab);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="mb-empty">
        <i class="fa-regular fa-file-lines"></i>
        <p>No blogs found in this category.</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(mbCard).join('');
}

function renderMyBlogsListShell() {
  mbEditorMode = null;
  const root = document.getElementById('my-blogs-root');
  if (!root) return;

  root.innerHTML = `
    <div class="mb-header-row">
      <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #111827;">Manage My Articles</h2>
      <button type="button" class="mb-btn" data-action="create">
        <i class="fa-solid fa-plus"></i> Create New Blog
      </button>
    </div>

    <div class="mb-tabs">
      <div class="mb-tab ${mbCurrentTab === 'all' ? 'active' : ''}" data-status="all">All Blogs</div>
      <div class="mb-tab ${mbCurrentTab === 'draft' ? 'active' : ''}" data-status="draft">Drafts</div>
      <div class="mb-tab ${mbCurrentTab === 'pending_review' ? 'active' : ''}" data-status="pending_review">Pending Review</div>
      <div class="mb-tab ${mbCurrentTab === 'published' ? 'active' : ''}" data-status="published">Published</div>
      <div class="mb-tab ${mbCurrentTab === 'changes_requested' ? 'active' : ''}" data-status="changes_requested">Changes Requested</div>
    </div>

    <div id="my-blogs-grid" class="mb-grid">
      <div class="mb-empty">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <p>Loading your blogs...</p>
      </div>
    </div>
  `;

  wireMyBlogsEvents();
  renderMyBlogsTabCounts();
  renderMyBlogsGrid();
}

function renderMyBlogsEditor(src, title) {
  mbEditorMode = src;
  const root = document.getElementById('my-blogs-root');
  if (!root) return;

  root.innerHTML = `
    <div class="mb-header-row">
      <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #111827;">${title}</h2>
      <button type="button" class="mb-btn mb-back-btn" data-action="back-to-list">
        <i class="fa-solid fa-arrow-left"></i> My Blogs
      </button>
    </div>
    <div class="mb-editor-shell">
      <iframe class="mb-editor-frame" src="${src}" title="${title}"></iframe>
    </div>
  `;

  wireMyBlogsEvents();
}

function renderMyBlogsTabCounts() {
  document.querySelectorAll('.mb-tab').forEach(tab => {
    const status = tab.dataset.status;
    const countEl = tab.querySelector('.mb-tab-count');
    const count = mbTabCount(status);
    if (countEl) {
      countEl.textContent = count;
    } else {
      tab.insertAdjacentHTML('beforeend', ` <span class="mb-tab-count">${count}</span>`);
    }
  });
}

/* ── Data loading ── */

async function loadUserBlogs() {
  const grid = document.getElementById('my-blogs-grid');
  const token = localStorage.getItem('fs_token');

  try {
    const res = await fetch(`${window.location.origin}/api/blogs/my-blogs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.msg || 'Failed to load blogs');

    mbAllBlogs = data.blogs || [];
    renderMyBlogsTabCounts();
    renderMyBlogsGrid();
  } catch (err) {
    if (grid) {
      grid.innerHTML = `
        <div class="mb-empty">
          <i class="fa-solid fa-triangle-exclamation mb-error"></i>
          <p class="mb-error">Couldn't load your blogs. ${err.message}</p>
        </div>`;
    }
  }
}

async function mbDeleteBlog(id) {
  if (!confirm('Delete this blog? This cannot be undone.')) return;

  const token = localStorage.getItem('fs_token');
  try {
    const res = await fetch(`${window.location.origin}/api/blogs/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.msg || 'Delete failed');

    mbAllBlogs = mbAllBlogs.filter(b => b._id !== id);
    renderMyBlogsTabCounts();
    renderMyBlogsGrid();
  } catch (err) {
    alert(err.message || 'Error deleting blog');
  }
}

/* ── Event wiring ── */

function wireMyBlogsEvents() {
  const root = document.getElementById('my-blogs-root');
  if (root && !root.dataset.messageWired) {
    root.dataset.messageWired = 'true';
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== 'FarmSenseBlogSaved') return;
      renderMyBlogsListShell();
      loadUserBlogs();
    });
  }

  document.querySelectorAll('[data-action="create"]').forEach(btn => {
    btn.addEventListener('click', () => {
      renderMyBlogsEditor('/blog/create-blog.html?dashboard=1', 'Create Blog Post');
    });
  });

  document.querySelectorAll('[data-action="back-to-list"]').forEach(btn => {
    btn.addEventListener('click', () => {
      renderMyBlogsListShell();
      loadUserBlogs();
    });
  });

  document.querySelectorAll('.mb-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      mbCurrentTab = tab.dataset.status;
      document.querySelectorAll('.mb-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderMyBlogsGrid();
    });
  });

  const grid = document.getElementById('my-blogs-grid');
  if (grid) {
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;

      if (btn.dataset.action === 'edit') {
        renderMyBlogsEditor(`/blog/edit-blog.html?id=${id}&dashboard=1`, 'Edit Blog Post');
      } else if (btn.dataset.action === 'delete') {
        mbDeleteBlog(id);
      }
    });
  }
}

/* ── Main view function ── */
function viewMyBlogs(user) {
  injectMyBlogsStyles();

  setTimeout(() => {
    renderMyBlogsListShell();
    loadUserBlogs();
  }, 0);

  return `
    <div class="mb-scrollable">
      <div id="my-blogs-root"></div>
    </div>
  `;
}
