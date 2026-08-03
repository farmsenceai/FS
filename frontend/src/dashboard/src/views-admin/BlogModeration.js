/* views-admin/BlogModeration.js */

window.metaBlogModeration = {
  title: 'Blog Moderation',
  subtitle: 'Approve, reject, edit, or delete blog submissions from Farmers & Businesses.'
};

let bmQueue = [];
let bmPendingAction = null;
let bmPendingBlogId = null;
let bmEditorMode = false;

function injectBlogModerationStyles() {
  if (document.getElementById('bmod-styles')) return;
  const style = document.createElement('style');
  style.id = 'bmod-styles';
  style.textContent = `
    .bm-scrollable { padding: 20px; background: #f5f6fa; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; }
    .bm-card { background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; }
    .bm-table { width: 100%; border-collapse: collapse; }
    .bm-table th { padding: 12px 16px; background: #f9fafb; text-align: left; font-weight: 600; color: #4b5563; border-bottom: 1px solid #e5e7eb; }
    .bm-table td { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; color: #111827; }
    .bm-badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .bm-badge-draft { background: #f3f4f6; color: #4b5563; }
    .bm-badge-pending { background: #fef3c7; color: #d97706; }
    .bm-badge-published { background: #d1fae5; color: #16a34a; }
    .bm-badge-changes { background: #fee2e2; color: #dc2626; }
    .bm-badge-rejected { background: #fee2e2; color: #dc2626; }
    .bm-actions { display: flex; gap: 8px; }
    .bm-btn-approve { background: #16a34a; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: 600; }
    .bm-btn-edit { background: #eab308; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: 600; }
    .bm-btn-reject { background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: 600; }
    .bm-btn-delete { background: white; color: #ef4444; border: 1px solid #ef4444; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: 600; }
    .bm-btn-back { background: #fff; color: #374151; border: 1px solid #d1d5db; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .bm-btn-back:hover { background: #f9fafb; color: #111827; }
    .bm-actions button:disabled { opacity: .45; cursor: not-allowed; }
    .bm-editor-shell { height: calc(100vh - 190px); min-height: 720px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .bm-editor-frame { width: 100%; height: 100%; border: 0; display: block; background: #fff; }
    .bm-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .bm-modal-content { background: white; border-radius: 8px; padding: 20px; width: 400px; max-width: 90%; }
    .bm-modal-title { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
    .bm-textarea { width: 100%; height: 100px; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; font-size: 13px; outline: none; margin-bottom: 12px; resize: none; }
    .bm-textarea:focus { border-color: #16a34a; }
    .bm-modal-btn { padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer; border: none; }
    .bm-modal-btn-cancel { background: #f3f4f6; color: #374151; }
    .bm-modal-btn-cancel:hover { background: #e5e7eb; }
    .bm-modal-btn-submit { background: #16a34a; color: white; }
    .bm-modal-btn-submit:hover { background: #15803d; }
  `;
  document.head.appendChild(style);
}

function bmToken() {
  return localStorage.getItem('fs_token');
}

function bmBadgeClass(status) {
  const map = {
    draft: 'bm-badge-draft',
    pending_review: 'bm-badge-pending',
    published: 'bm-badge-published',
    changes_requested: 'bm-badge-changes',
    rejected: 'bm-badge-rejected'
  };
  return map[status] || 'bm-badge-draft';
}

function bmBadgeLabel(status) {
  return String(status || 'draft').replace(/_/g, ' ');
}

function bmAuthorName(author) {
  if (!author) return 'Unknown';
  return author.name || author.email || 'Unknown';
}

function bmRoot() {
  return document.getElementById('blog-moderation-root');
}

function bmRenderEditor(blogId) {
  bmEditorMode = true;
  const root = bmRoot();
  if (!root) return;

  root.innerHTML = `
    <div class="mb-header-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
      <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #111827;">Edit Blog Post</h2>
      <button type="button" class="bm-btn-back" data-action="back-to-moderation">
        <i class="fa-solid fa-arrow-left"></i> Blog Moderation
      </button>
    </div>
    <div class="bm-editor-shell">
      <iframe class="bm-editor-frame" src="/blog/edit-blog.html?id=${encodeURIComponent(blogId)}&dashboard=1" title="Edit Blog Post"></iframe>
    </div>
  `;

  bmWireModerationEvents();
}

function bmRenderListShell() {
  bmEditorMode = false;
  const root = bmRoot();
  if (!root) return;

  root.innerHTML = `
    <div class="mb-header-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
      <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #111827;">Blog Moderation Queue</h2>
    </div>

    <div class="bm-card">
      <table class="bm-table">
        <thead>
          <tr>
            <th>Cover</th>
            <th>Blog Title</th>
            <th>Author</th>
            <th>Role</th>
            <th>Status</th>
            <th>Revision</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="moderation-queue-body">
          <tr>
            <td colspan="7" style="text-align: center; padding: 30px; color: #6b7280;">
              <i class="fa-solid fa-spinner fa-spin" style="font-size: 24px; color: #16a34a; margin-bottom: 10px;"></i>
              <p>Fetching queue items...</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div id="review-feedback-modal" class="bm-modal" style="display: none;">
      <div class="bm-modal-content">
        <div class="bm-modal-title" id="feedback-modal-title">Reject Blog</div>
        <textarea id="feedback-comments" class="bm-textarea" placeholder="Add comments here (only visible to the author)..."></textarea>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button class="bm-modal-btn bm-modal-btn-cancel" id="close-feedback-modal">Cancel</button>
          <button class="bm-modal-btn bm-modal-btn-submit" id="submit-feedback-action">Submit</button>
        </div>
      </div>
    </div>
  `;

  bmWireModerationEvents();
  bmRenderQueue();
}

function bmRenderQueue() {
  const tbody = document.getElementById('moderation-queue-body');
  if (!tbody) return;

  if (!bmQueue.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:30px; color:#6b7280;">No blog submissions found.</td>
      </tr>`;
    return;
  }

  tbody.innerHTML = bmQueue.map(blog => {
    const reviewable = blog.status === 'pending_review';
    return `
      <tr data-id="${blog._id}">
        <td><img src="${blog.coverImage || ''}" alt="" style="width:56px; height:40px; object-fit:cover; border-radius:4px; background:#e5e7eb;"></td>
        <td>${blog.title || 'Untitled'}</td>
        <td>${bmAuthorName(blog.author)}</td>
        <td>${blog.author?.role || blog.authorRole || '-'}</td>
        <td><span class="bm-badge ${bmBadgeClass(blog.status)}">${bmBadgeLabel(blog.status)}</span></td>
        <td>${blog.revisionNumber || 1}</td>
        <td>
          <div class="bm-actions">
            <button class="bm-btn-approve" data-action="approved" ${reviewable ? '' : 'disabled'}>Approve</button>
            <button class="bm-btn-edit" data-action="edit">Edit</button>
            <button class="bm-btn-reject" data-action="rejected" ${reviewable ? '' : 'disabled'}>Reject</button>
            <button class="bm-btn-delete" data-action="delete">Delete</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

async function bmLoadModerationQueue() {
  if (bmEditorMode) return;
  const tbody = document.getElementById('moderation-queue-body');
  try {
    const res = await fetch(`${window.location.origin}/api/blogs/moderation`, {
      headers: { Authorization: `Bearer ${bmToken()}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.msg || 'Failed to load queue');
    bmQueue = data.blogs || [];
    bmRenderQueue();
  } catch (err) {
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:30px; color:#dc2626;">${err.message}</td>
        </tr>`;
    }
  }
}

function bmOpenFeedbackModal(action, blogId) {
  bmPendingAction = action;
  bmPendingBlogId = blogId;
  const modal = document.getElementById('review-feedback-modal');
  const title = document.getElementById('feedback-modal-title');
  const textarea = document.getElementById('feedback-comments');
  if (!modal || !title || !textarea) return;

  title.textContent = 'Reject Blog';
  textarea.value = '';
  textarea.placeholder = 'Add rejection comments (optional)...';
  modal.style.display = 'flex';
}

function bmCloseFeedbackModal() {
  const modal = document.getElementById('review-feedback-modal');
  if (modal) modal.style.display = 'none';
  bmPendingAction = null;
  bmPendingBlogId = null;
}

async function bmReviewBlog(blogId, action, comments = '') {
  const res = await fetch(`${window.location.origin}/api/blogs/${blogId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bmToken()}`
    },
    body: JSON.stringify({ action, comments })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.msg || 'Review failed');
  await bmLoadModerationQueue();
}

async function bmDeleteBlog(blogId) {
  if (!confirm('Delete this blog or pending revision?')) return;

  const res = await fetch(`${window.location.origin}/api/blogs/${blogId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${bmToken()}` }
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.msg || 'Delete failed');
  await bmLoadModerationQueue();
}

function bmWireModerationEvents() {
  const tbody = document.getElementById('moderation-queue-body');
  const closeModal = document.getElementById('close-feedback-modal');
  const submitModal = document.getElementById('submit-feedback-action');

  if (tbody && !tbody.dataset.wired) {
    tbody.dataset.wired = 'true';
    tbody.addEventListener('click', async (e) => {
      const button = e.target.closest('[data-action]');
      if (!button || button.disabled) return;

      const blogId = button.closest('tr')?.dataset.id;
      const action = button.dataset.action;
      try {
        if (action === 'approved') {
          await bmReviewBlog(blogId, action);
        } else if (action === 'delete') {
          await bmDeleteBlog(blogId);
        } else if (action === 'edit') {
          bmRenderEditor(blogId);
        } else {
          bmOpenFeedbackModal(action, blogId);
        }
      } catch (err) {
        alert(err.message);
      }
    });
  }

  if (closeModal && !closeModal.dataset.wired) {
    closeModal.dataset.wired = 'true';
    closeModal.addEventListener('click', bmCloseFeedbackModal);
  }

  if (submitModal && !submitModal.dataset.wired) {
    submitModal.dataset.wired = 'true';
    submitModal.addEventListener('click', async () => {
      const comments = document.getElementById('feedback-comments')?.value.trim() || '';

      try {
        await bmReviewBlog(bmPendingBlogId, bmPendingAction, comments);
        bmCloseFeedbackModal();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  const root = bmRoot();
  if (root && !root.dataset.messageWired) {
    root.dataset.messageWired = 'true';
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== 'FarmSenseBlogSaved') return;
      bmRenderListShell();
      bmLoadModerationQueue();
    });
  }

  document.querySelectorAll('[data-action="back-to-moderation"]').forEach(button => {
    if (button.dataset.wired) return;
    button.dataset.wired = 'true';
    button.addEventListener('click', () => {
      bmRenderListShell();
      bmLoadModerationQueue();
    });
  });
}

function viewBlogModeration(user) {
  injectBlogModerationStyles();

  setTimeout(() => {
    bmRenderListShell();
    bmLoadModerationQueue();
  }, 0);

  return `
    <div class="bm-scrollable">
      <div id="blog-moderation-root"></div>
    </div>
  `;
}
