/**
 * Blog Model
 * Reuses existing Mongoose connection.
 */

const mongoose = require('mongoose');

const ContentBlockSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['paragraph', 'heading', 'image', 'quote', 'list'],
    required: true
  },
  value: { type: String, default: '' },
  listItems: { type: [String], default: [] },
  headingLevel: { type: Number, default: 2 },
  imageCaption: { type: String, default: '' },
  imageAlt: { type: String, default: '' }
}, { _id: false });

const ReviewHistorySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['submitted', 'approved', 'rejected', 'changes_requested'],
    required: true
  },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminRole: { type: String },
  comments: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorRole: { type: String, enum: ['farmer', 'business', 'admin'], required: true },
  coverImage: { type: String, required: true },
  contentBlocks: {
    type: [ContentBlockSchema],
    validate: {
      validator: function (blocks) {
        // Drafts can be empty while the user is still typing; anything
        // moving to pending_review/published must have content.
        if (this.status === 'draft') return true;
        return Array.isArray(blocks) && blocks.length > 0;
      },
      message: 'A blog must contain at least one content block before submission.'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'published', 'changes_requested', 'rejected', 'deleted'],
    default: 'draft'
  },
  adminComments: { type: String, default: '' },
  reviewHistory: [ReviewHistorySchema],
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  publishedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  revisionNumber: { type: Number, default: 1 },

  // When an author edits an already-published blog, we create a new
  // document (a "shadow" revision) so the live version stays untouched
  // until the revision is approved. This field links the revision back
  // to the original, live document.
  parentBlogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', default: null }
}, {
  timestamps: true
});

/* ── Indexes ── */
BlogSchema.index({ author: 1 });
BlogSchema.index({ status: 1 });
BlogSchema.index({ isDeleted: 1 });
BlogSchema.index({ parentBlogId: 1 });
// Compound index — this is the one the public Blogs page and My Blogs
// tabs will actually query against most often.
BlogSchema.index({ status: 1, isDeleted: 1, publishedAt: -1 });

/* ── Slug generation ──
   Plain async function, no `next` param — matches the project convention
   (pre('validate') with a next-callback fails silently during insertMany;
   returning a promise from an async function avoids that). */
BlogSchema.pre('validate', async function () {
  if (!this.title) return;

  // Generate once and then keep URLs stable, including title-changing
  // published revision approvals.
  if (this.slug) return;

  const base = this.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  let candidate = base;
  let suffix = 1;

  // Exclude this doc's own id (relevant on updates) when checking uniqueness.
  const Blog = mongoose.model('Blog');
  while (await Blog.exists({ slug: candidate, _id: { $ne: this._id } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  this.slug = candidate;
});

/* ── Publish timestamp ──
   Keep publishedAt accurate whenever status flips to 'published',
   without clobbering it on later unrelated saves. */
BlogSchema.pre('save', function () {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

/* ── Instance method: create a pending-review revision ──
   Used when an author edits a blog that is currently 'published'.
   The original stays live; a linked copy is created for review. */
BlogSchema.methods.createRevision = async function (updates) {
  const Blog = mongoose.model('Blog');

  const revision = new Blog({
    title: updates.title ?? this.title,
    author: this.author,
    authorRole: this.authorRole,
    coverImage: updates.coverImage ?? this.coverImage,
    contentBlocks: updates.contentBlocks ?? this.contentBlocks,
    status: 'pending_review',
    revisionNumber: this.revisionNumber + 1,
    parentBlogId: this._id
  });

  return revision.save();
};

/* ── Instance method: log a review action ──
   Called by blog.service.js whenever an admin approves, rejects,
   requests changes, or a user submits/resubmits. */
BlogSchema.methods.logReview = function ({ action, admin, adminRole, comments }) {
  this.reviewHistory.push({ action, admin, adminRole, comments, timestamp: new Date() });
  if (comments !== undefined) this.adminComments = comments;
};

/* ── Static: public-facing query helper ── */
BlogSchema.statics.findPublished = function (filter = {}) {
  return this.find({ ...filter, status: 'published', isDeleted: false })
    .sort({ publishedAt: -1 });
};

module.exports = mongoose.model('Blog', BlogSchema);
