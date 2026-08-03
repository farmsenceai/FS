/**
 * BlogReview Model (Audit log of moderations)
 *
 * Complements Blog.reviewHistory (embedded, per-blog) with a separate
 * top-level collection so we can query moderation activity *across*
 * blogs — e.g. "everything Admin X has reviewed" or "all rejections
 * this month" — without scanning every Blog document.
 */

const mongoose = require('mongoose');

const BlogReviewSchema = new mongoose.Schema({
  blog: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['approved', 'rejected', 'changes_requested'], required: true },
  comments: { type: String },
  revisionNumber: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

/* ── Indexes ──
   blog: pull full moderation history for one post (e.g. on the blog
     detail view in BlogModeration.js).
   admin: pull one admin's activity (useful for an "admin activity log"
     view later, or accountability if a decision is disputed).
   createdAt: recent-first ordering is the default sort almost everywhere
     this collection gets queried. */
BlogReviewSchema.index({ blog: 1, createdAt: -1 });
BlogReviewSchema.index({ admin: 1 });
BlogReviewSchema.index({ createdAt: -1 });

/* ── Static: log a moderation action ──
   Called from blog.service.js alongside Blog.logReview() so both the
   embedded history (fast, per-blog) and this standalone audit log
   (queryable, cross-blog) stay in sync in one call site. */
BlogReviewSchema.statics.logAction = function ({ blog, admin, action, comments, revisionNumber }) {
  return this.create({ blog, admin, action, comments, revisionNumber });
};

/* ── Static: full moderation history for one blog, newest first ── */
BlogReviewSchema.statics.getHistoryForBlog = function (blogId) {
  return this.find({ blog: blogId })
    .sort({ createdAt: -1 })
    .populate('admin', 'name email');
};

/* ── Static: recent activity for one admin (accountability / activity feed) ── */
BlogReviewSchema.statics.getActivityForAdmin = function (adminId, limit = 50) {
  return this.find({ admin: adminId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('blog', 'title slug');
};

module.exports = mongoose.model('BlogReview', BlogReviewSchema);