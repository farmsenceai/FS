/**
 * Blog Service
 *
 * Central business logic for slug generation, revision handling,
 * moderation decisions, and notification dispatch. Controllers should
 * stay thin and call into this file rather than talking to the models
 * directly.
 */

const mongoose = require('mongoose');
const Blog = require('../../models/Blog');
const BlogReview = require('../../models/BlogReview');
const BlogComment = require('../../models/BlogComment');
const Notification = require('../../models/Notification');

function getUserId(user) {
  return user && (user.userId || user._id || user.id);
}

function isAdmin(user) {
  return user && user.role === 'admin';
}

function isAdminSelfAuthored(blog, user) {
  const userId = getUserId(user);
  return isAdmin(user) && userId && blog.author.toString() === userId.toString();
}

function shouldSubmitForReview(data = {}) {
  return data.submitForReview === true || data.status === 'pending_review';
}

function assertReviewable(blog) {
  if (blog.status !== 'pending_review') {
    const err = new Error('Only blogs pending review can be moderated');
    err.statusCode = 400;
    throw err;
  }
}

/**
 * Generate a unique URL slug from a title.
 * Note: Blog.js already does this in a pre('validate') hook, so this
 * standalone version exists for cases where the controller needs the
 * slug *before* constructing/saving a document (e.g. to preview a URL,
 * or check availability). Kept logic identical to the schema hook so
 * the two never disagree.
 *
 * excludeId: pass the current blog's _id when regenerating a slug for
 * an existing document, so it doesn't collide with itself.
 */
async function generateUniqueSlug(title, excludeId = null) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  let candidate = base;
  let suffix = 1;

  const filter = excludeId ? { _id: { $ne: excludeId } } : {};

  while (await Blog.exists({ slug: candidate, ...filter })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}

async function createBlog(blogData, user) {
  const userId = getUserId(user);
  if (!userId) {
    const err = new Error('Authenticated user id is required');
    err.statusCode = 401;
    throw err;
  }

  const directPublish = isAdmin(user);
  const status = directPublish
    ? 'pending_review'
    : (shouldSubmitForReview(blogData) ? 'pending_review' : 'draft');

  const blog = new Blog({
    title: blogData.title,
    author: userId,
    authorRole: user.role,
    coverImage: blogData.coverImage,
    contentBlocks: blogData.contentBlocks || [],
    status
  });

  if (directPublish) {
    await blog.save();
    return approveBlogRevision(blog, userId);
  }

  if (status === 'pending_review') {
    blog.logReview({ action: 'submitted', admin: null, adminRole: user.role });
    await blog.save();
    await notifyAdminsOfSubmission(blog);
    return blog;
  }

  await blog.save();
  return blog;
}

/**
 * Handle blog edits — the core "revision" rule from the spec:
 * editing a DRAFT updates it in place; editing a PUBLISHED blog
 * creates/updates a shadow revision so the live version stays
 * untouched until the revision is approved.
 *
 * editData: { title, coverImage, contentBlocks, submitForReview }
 *   submitForReview (bool) — if true, the resulting doc's status
 *   moves to 'pending_review'; if false, stays/returns to 'draft'.
 *
 * Returns the document that was actually updated (draft, or shadow revision).
 */
async function handleBlogEdit(blogId, editData, user) {
  const userId = getUserId(user);
  const original = await Blog.findOne({ _id: blogId, isDeleted: false });
  if (!original) {
    const err = new Error('Blog not found');
    err.statusCode = 404;
    throw err;
  }

  const isOwner = userId && original.author.toString() === userId.toString();
  if (!isOwner && !isAdmin(user)) {
    const err = new Error('Not authorized to edit this blog');
    err.statusCode = 403;
    throw err;
  }

  const directPublish = isAdminSelfAuthored(original, user);
  const targetStatus = (shouldSubmitForReview(editData) || directPublish)
    ? 'pending_review'
    : 'draft';

  // ── Case 1: blog is currently PUBLISHED → work against a shadow revision ──
  if (original.status === 'published') {
    let revision = await Blog.findOne({
      parentBlogId: original._id,
      status: { $in: ['draft', 'pending_review', 'changes_requested'] }
    });

    if (revision) {
      // Update the existing shadow revision in place
      if (editData.title !== undefined) revision.title = editData.title;
      if (editData.coverImage !== undefined) revision.coverImage = editData.coverImage;
      if (editData.contentBlocks !== undefined) revision.contentBlocks = editData.contentBlocks;
      revision.status = targetStatus;
      await revision.save();
    } else {
      // No shadow revision yet — create one via the model helper
      revision = await original.createRevision({
        title: editData.title,
        coverImage: editData.coverImage,
        contentBlocks: editData.contentBlocks
      });
      revision.status = targetStatus;
      await revision.save();
    }

    if (targetStatus === 'pending_review' && !directPublish) {
      revision.logReview({ action: 'submitted', admin: null, adminRole: user.role, comments: undefined });
      await revision.save();
      await notifyAdminsOfSubmission(revision);
    }

    if (directPublish) {
      // Admin editing directly — publish immediately, no review cycle.
      return approveBlogRevision(revision, userId);
    }

    return revision;
  }

  // ── Case 2: blog is a draft / changes_requested / rejected → edit in place ──
  if (editData.title !== undefined) original.title = editData.title;
  if (editData.coverImage !== undefined) original.coverImage = editData.coverImage;
  if (editData.contentBlocks !== undefined) original.contentBlocks = editData.contentBlocks;
  original.status = targetStatus;

  if (targetStatus === 'pending_review' && !directPublish) {
    original.logReview({ action: 'submitted', admin: null, adminRole: user.role, comments: undefined });
    await original.save();
    await notifyAdminsOfSubmission(original);
    return original;
  }

  if (directPublish) {
    // Admin creating/editing directly with no parent — publish immediately.
    return approveBlogRevision(original, userId);
  }

  await original.save();
  return original;
}

/**
 * Approve a pending blog (or revision), merging edits back to the
 * parent if this is a revision of an already-published post.
 */
async function approveBlogRevision(revisionBlog, adminId) {
  assertReviewable(revisionBlog);
  const adminUser = await mongoose.model('User').findById(adminId).select('role');
  const adminRole = adminUser ? adminUser.role : 'admin';

  // ── Case A: this is a revision of an existing published blog ──
  if (revisionBlog.parentBlogId) {
    const parent = await Blog.findById(revisionBlog.parentBlogId);
    if (!parent) {
      const err = new Error('Parent blog not found for this revision');
      err.statusCode = 404;
      throw err;
    }

    parent.title = revisionBlog.title;
    parent.coverImage = revisionBlog.coverImage;
    parent.contentBlocks = revisionBlog.contentBlocks;
    parent.status = 'published';
    parent.revisionNumber = revisionBlog.revisionNumber;
    parent.approvedBy = adminId;
    parent.publishedAt = new Date();
    parent.logReview({ action: 'approved', admin: adminId, adminRole, comments: undefined });
    await parent.save();

    await BlogReview.logAction({
      blog: parent._id,
      admin: adminId,
      action: 'approved',
      revisionNumber: parent.revisionNumber
    });

    await Notification.notifyBlogAction({
      recipient: parent.author,
      action: 'approved',
      blogTitle: parent.title,
      blogId: parent._id
    });

    // The shadow revision document has served its purpose — remove it.
    await Blog.deleteOne({ _id: revisionBlog._id });

    return parent;
  }

  // ── Case B: brand-new blog (no parent) — publish it directly ──
  revisionBlog.status = 'published';
  revisionBlog.approvedBy = adminId;
  revisionBlog.publishedAt = revisionBlog.publishedAt || new Date();
  revisionBlog.logReview({ action: 'approved', admin: adminId, adminRole, comments: undefined });
  await revisionBlog.save();

  await BlogReview.logAction({
    blog: revisionBlog._id,
    admin: adminId,
    action: 'approved',
    revisionNumber: revisionBlog.revisionNumber
  });

  // Admin's own direct posts don't need a "your blog was approved"
  // notification to themselves.
  if (revisionBlog.authorRole !== 'admin') {
    await Notification.notifyBlogAction({
      recipient: revisionBlog.author,
      action: 'approved',
      blogTitle: revisionBlog.title,
      blogId: revisionBlog._id
    });
  }

  return revisionBlog;
}

/**
 * Reject a pending blog (or revision). Rejected revisions of a
 * published parent are simply discarded — the parent stays live
 * and untouched, exactly as it was.
 */
async function rejectBlog(blog, adminId, comments) {
  assertReviewable(blog);
  const adminUser = await mongoose.model('User').findById(adminId).select('role');
  const adminRole = adminUser ? adminUser.role : 'admin';

  blog.status = 'rejected';
  blog.logReview({ action: 'rejected', admin: adminId, adminRole, comments });
  await blog.save();

  await BlogReview.logAction({
    blog: blog._id,
    admin: adminId,
    action: 'rejected',
    comments,
    revisionNumber: blog.revisionNumber
  });

  await Notification.notifyBlogAction({
    recipient: blog.author,
    action: 'rejected',
    blogTitle: blog.title,
    blogId: blog._id,
    comments
  });

  return blog;
}

/**
 * Request changes on a pending blog (or revision). Sends it back to
 * the author with comments visible only to them.
 */
async function requestChanges(blog, adminId, comments) {
  assertReviewable(blog);
  const adminUser = await mongoose.model('User').findById(adminId).select('role');
  const adminRole = adminUser ? adminUser.role : 'admin';

  blog.status = 'changes_requested';
  blog.logReview({ action: 'changes_requested', admin: adminId, adminRole, comments });
  await blog.save();

  await BlogReview.logAction({
    blog: blog._id,
    admin: adminId,
    action: 'changes_requested',
    comments,
    revisionNumber: blog.revisionNumber
  });

  await Notification.notifyBlogAction({
    recipient: blog.author,
    action: 'changes_requested',
    blogTitle: blog.title,
    blogId: blog._id,
    comments
  });

  return blog;
}

/**
 * Soft delete a blog. If it's a revision of a published parent, the
 * revision is removed outright (nothing was ever public); if it's a
 * live/standalone blog, it's flagged isDeleted rather than removed,
 * per the spec.
 */
async function softDeleteBlog(blog) {
  if (blog.parentBlogId && blog.status !== 'published') {
    await Blog.deleteOne({ _id: blog._id });
    return null;
  }

  blog.isDeleted = true;
  blog.status = 'deleted';
  await blog.save();
  return blog;
}

/**
 * Notify all admins that a new blog is waiting for review.
 */
async function notifyAdminsOfSubmission(blog) {
  const admins = await mongoose.model('User').find({ role: 'admin' }).select('_id');
  await Promise.all(
    admins.map(admin =>
      Notification.notifyBlogAction({
        recipient: admin._id,
        action: 'submitted',
        blogTitle: blog.title,
        blogId: blog._id
      })
    )
  );
}

/**
 * Send a custom (non-review) notification — kept for cases outside
 * the standard approve/reject/changes_requested flow.
 */
async function createNotification(recipientId, type, message, relatedBlogId) {
  const notification = new Notification({
    recipient: recipientId,
    type,
    message,
    relatedBlog: relatedBlogId
  });
  await notification.save();
  return notification;
}

async function getNotificationsForUser(userId) {
  return Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .populate('relatedBlog', 'title slug status');
}

async function markNotificationRead(notificationId, userId) {
  const notification = await Notification.findOne({
    _id: notificationId,
    recipient: userId
  });

  if (!notification) {
    const err = new Error('Notification not found');
    err.statusCode = 404;
    throw err;
  }

  await notification.markRead();
  return notification;
}

async function markAllNotificationsRead(userId) {
  return Notification.markAllRead(userId);
}

async function getCommentsForBlogSlug(slug) {
  return BlogComment.find({ blogSlug: String(slug || '').toLowerCase(), isDeleted: false })
    .sort({ createdAt: -1 })
    .populate('author', 'name email role');
}

async function addCommentToBlogSlug(slug, body, user) {
  const userId = getUserId(user);
  const cleanSlug = String(slug || '').trim().toLowerCase();
  const cleanBody = String(body || '').trim();

  if (!userId) {
    const err = new Error('Please sign in to comment');
    err.statusCode = 401;
    throw err;
  }

  if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
    const err = new Error('Invalid blog slug');
    err.statusCode = 400;
    throw err;
  }

  if (!cleanBody) {
    const err = new Error('Comment cannot be empty');
    err.statusCode = 400;
    throw err;
  }

  if (cleanBody.length > 1000) {
    const err = new Error('Comment must be 1000 characters or fewer');
    err.statusCode = 400;
    throw err;
  }

  const blog = await Blog.findOne({ slug: cleanSlug, status: 'published', isDeleted: false }).select('_id');
  const comment = await BlogComment.create({
    blogSlug: cleanSlug,
    blog: blog ? blog._id : null,
    author: userId,
    body: cleanBody
  });

  return comment.populate('author', 'name email role');
}

module.exports = {
  getUserId,
  generateUniqueSlug,
  createBlog,
  handleBlogEdit,
  approveBlogRevision,
  rejectBlog,
  requestChanges,
  softDeleteBlog,
  createNotification,
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
  getCommentsForBlogSlug,
  addCommentToBlogSlug
};
