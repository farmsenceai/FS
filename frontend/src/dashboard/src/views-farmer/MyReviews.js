window.metaMyReviews = {
  title: 'My Reviews',
  subtitle: 'Rate completed projects at your assigned farms'
};

let fmrState = { user: null, projects: [], reviewsByProject: new Map() };

function fmrEscape(value) {
  const div = document.createElement('div');
  div.textContent = value == null ? '' : String(value);
  return div.innerHTML;
}
function fmrId(value) { return String(value?._id || value || ''); }
function fmrActorId() { return fmrId(fmrState.user?.id || fmrState.user?._id || fmrState.user?.userId); }
async function fmrApi(path, options = {}) {
  const response = await fetch(`/api/v2${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('fs_token') || ''}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || body.message || 'Request failed');
  return body;
}

function viewMyReviews(user) {
  fmrState = { user, projects: [], reviewsByProject: new Map() };
  setTimeout(fmrLoad, 0);
  return `<style>
    .fmr-grid{display:grid;gap:16px}.fmr-card{background:#fff;border:1px solid #e4e9e5;border-radius:14px;padding:20px}.fmr-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.fmr-title{font-size:17px;font-weight:800}.fmr-muted{color:#667085;font-size:12px;margin-top:5px}.fmr-badge{padding:5px 9px;border-radius:999px;background:#dcfce7;color:#166534;font-size:11px;font-weight:700}.fmr-stars{display:flex;gap:5px;margin:16px 0 12px}.fmr-star{border:0;background:none;padding:0;color:#d1d5db;font-size:30px;cursor:pointer;line-height:1}.fmr-star.active{color:#f59e0b}.fmr-text{width:100%;min-height:90px;resize:vertical;border:1px solid #d1d5db;border-radius:9px;padding:11px;font:inherit}.fmr-actions{display:flex;gap:9px;margin-top:12px}.fmr-btn{border:0;border-radius:8px;background:#166534;color:#fff;padding:10px 14px;font-weight:700;cursor:pointer}.fmr-btn.secondary{background:#e5e7eb;color:#344054}.fmr-review-stars{color:#f59e0b;font-size:22px;letter-spacing:2px;margin-top:13px}.fmr-review-text{margin-top:10px;line-height:1.55;color:#344054}.fmr-empty,.fmr-error{text-align:center;padding:42px;background:#fff;border:1px solid #e4e9e5;border-radius:14px;color:#667085}.fmr-error{color:#991b1b;background:#fef2f2}
  </style><section id="fmr-root"><div class="fmr-empty">Loading completed projects…</div></section>`;
}

async function fmrLoad() {
  const root = document.getElementById('fmr-root');
  if (!root) return;
  try {
    const actorId = fmrActorId();
    if (!actorId) throw new Error('Your signed-in user ID is unavailable. Please sign in again.');
    const assignmentBody = await fmrApi(`/users/${encodeURIComponent(actorId)}/assignments`);
    const assignments = assignmentBody.assignments || [];
    const farmIds = [...new Set(assignments.map(item => fmrId(item.farmId)).filter(Boolean))];
    const projectGroups = await Promise.all(farmIds.map(async farmId => {
      const body = await fmrApi(`/farms/${encodeURIComponent(farmId)}/projects?status=completed&limit=100`);
      return (body.data || []).map(project => ({ ...project, farmId: fmrId(project.farmId) || farmId }));
    }));
    fmrState.projects = projectGroups.flat();
    await Promise.all(fmrState.projects.map(async project => {
      const body = await fmrApi(`/farms/${encodeURIComponent(project.farmId)}/projects/${encodeURIComponent(project._id)}/reviews?limit=100`);
      const ownReview = (body.data || []).find(review => fmrId(review.farmerId) === actorId);
      fmrState.reviewsByProject.set(String(project._id), ownReview || null);
    }));
    fmrRender();
  } catch (error) {
    root.innerHTML = `<div class="fmr-error"><h3>Could not load project reviews</h3><p>${fmrEscape(error.message)}</p></div>`;
  }
}

function fmrStars(rating, interactive = false, projectId = '') {
  return Array.from({ length: 5 }, (_, index) => {
    const value = index + 1;
    return interactive
      ? `<button type="button" class="fmr-star ${value <= rating ? 'active' : ''}" data-fmr-star="${value}" data-project-id="${projectId}" aria-label="${value} star${value === 1 ? '' : 's'}">★</button>`
      : (value <= rating ? '★' : '☆');
  }).join('');
}

function fmrRender() {
  const root = document.getElementById('fmr-root');
  if (!fmrState.projects.length) {
    root.innerHTML = '<div class="fmr-empty"><h3>No completed projects to review</h3><p>Completed projects from your actively assigned farms will appear here.</p></div>';
    return;
  }
  root.innerHTML = `<div id="fmr-feedback"></div><div class="fmr-grid">${fmrState.projects.map(project => {
    const review = fmrState.reviewsByProject.get(String(project._id));
    return `<article class="fmr-card"><div class="fmr-head"><div><div class="fmr-title">${fmrEscape(project.title)}</div><div class="fmr-muted">Completed ${project.completedAt ? new Date(project.completedAt).toLocaleDateString() : 'recently'}</div></div><span class="fmr-badge">Completed</span></div>${review ? `<div id="fmr-review-${project._id}"><div class="fmr-review-stars" aria-label="${review.rating} out of 5 stars">${fmrStars(review.rating)}</div><div class="fmr-review-text">${fmrEscape(review.reviewText || 'No written review.')}</div><div class="fmr-actions"><button class="fmr-btn secondary" data-fmr-edit="${project._id}">Edit review</button><button class="fmr-btn secondary" data-fmr-delete="${project._id}">Delete review</button></div></div>` : fmrReviewForm(project, null)}</article>`;
  }).join('')}</div>`;
  fmrBind();
}

function fmrReviewForm(project, review) {
  const rating = Number(review?.rating || 0);
  return `<form data-fmr-form="${project._id}" data-review-id="${review?._id || ''}" data-rating="${rating}"><div class="fmr-muted" style="margin-top:15px">${review ? 'Update your rating' : 'Rate this project'}</div><div class="fmr-stars">${fmrStars(rating, true, project._id)}</div><textarea class="fmr-text" name="reviewText" placeholder="Share optional feedback about this project…">${fmrEscape(review?.reviewText || '')}</textarea><div class="fmr-actions"><button class="fmr-btn" type="submit">${review ? 'Save changes' : 'Submit review'}</button>${review ? `<button class="fmr-btn secondary" type="button" data-fmr-cancel="${project._id}">Cancel</button>` : ''}</div></form>`;
}

function fmrBind() {
  document.querySelectorAll('[data-fmr-form]').forEach(fmrBindForm);
  document.querySelectorAll('[data-fmr-edit]').forEach(button => button.addEventListener('click', () => {
    const project = fmrState.projects.find(item => String(item._id) === button.dataset.fmrEdit);
    const review = fmrState.reviewsByProject.get(button.dataset.fmrEdit);
    document.getElementById(`fmr-review-${button.dataset.fmrEdit}`).outerHTML = fmrReviewForm(project, review);
    fmrBindForm(document.querySelector(`[data-fmr-form="${button.dataset.fmrEdit}"]`));
  }));
  document.querySelectorAll('[data-fmr-delete]').forEach(button => button.addEventListener('click', () => fmrDelete(button.dataset.fmrDelete)));
}

async function fmrDelete(projectId) {
  const project = fmrState.projects.find(item => String(item._id) === projectId);
  const review = fmrState.reviewsByProject.get(projectId);
  if (!project || !review || !confirm('Delete your review?')) return;
  try {
    await fmrApi(`/farms/${encodeURIComponent(project.farmId)}/projects/${encodeURIComponent(project._id)}/reviews/${encodeURIComponent(review._id)}`, { method: 'DELETE' });
    fmrState.reviewsByProject.set(projectId, null);
    fmrRender();
  } catch (error) { alert(error.message); }
}

function fmrBindForm(form) {
  form.querySelectorAll('[data-fmr-star]').forEach(button => button.addEventListener('click', () => {
    const form = button.closest('form');
    form.dataset.rating = button.dataset.fmrStar;
    form.querySelectorAll('[data-fmr-star]').forEach(star => star.classList.toggle('active', Number(star.dataset.fmrStar) <= Number(form.dataset.rating)));
  }));
  form.addEventListener('submit', fmrSubmit);
  form.querySelector('[data-fmr-cancel]')?.addEventListener('click', fmrRender);
}

async function fmrSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const project = fmrState.projects.find(item => String(item._id) === form.dataset.fmrForm);
  const rating = Number(form.dataset.rating);
  if (!rating) { alert('Choose a star rating from 1 to 5.'); return; }
  const reviewId = form.dataset.reviewId;
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    const path = `/farms/${encodeURIComponent(project.farmId)}/projects/${encodeURIComponent(project._id)}/reviews${reviewId ? `/${encodeURIComponent(reviewId)}` : ''}`;
    const body = await fmrApi(path, {
      method: reviewId ? 'PATCH' : 'POST',
      body: JSON.stringify({ rating, reviewText: new FormData(form).get('reviewText') })
    });
    fmrState.reviewsByProject.set(String(project._id), body.review);
    fmrRender();
    document.getElementById('fmr-feedback').innerHTML = '<div class="fmr-card" style="margin-bottom:14px;color:#166534;background:#f0fdf4">Your review was saved.</div>';
  } catch (error) {
    button.disabled = false;
    alert(error.message);
  }
}
