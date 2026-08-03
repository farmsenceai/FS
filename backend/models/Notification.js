/**
 * Notification Model
 */

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Kept as a controlled enum rather than a free string so the frontend
  // can reliably switch on type to pick an icon/label without guessing.
  type: {
    type: String,
    enum: [
      'blog_approved',
      'blog_rejected',
      'blog_changes_requested',
      'blog_submitted'   // optional: notify admins when something new lands in the queue
    ],
    required: true
  },

  message: { type: String, required: true },
  relatedBlog: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

/* ── Indexes ──
   recipient+read covers "show my unread notifications" (the most common query).
   recipient+createdAt covers "show my notifications, newest first". */
NotificationSchema.index({ recipient: 1, read: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });

/* ── Static: create a notification tied to a blog review action ──
   Called from blog.service.js so the controller doesn't need to know
   the message-formatting rules for each action type. */
NotificationSchema.statics.notifyBlogAction = function ({ recipient, action, blogTitle, blogId, comments }) {
  const messages = {
    approved: `Your blog "${blogTitle}" has been approved and published.`,
    rejected: `Your blog "${blogTitle}" was rejected.${comments ? ` Reason: ${comments}` : ''}`,
    changes_requested: `Changes were requested on your blog "${blogTitle}".${comments ? ` Comments: ${comments}` : ''}`,
    submitted: `"${blogTitle}" was submitted for review.`
  };

  const typeMap = {
    approved: 'blog_approved',
    rejected: 'blog_rejected',
    changes_requested: 'blog_changes_requested',
    submitted: 'blog_submitted'
  };

  const type = typeMap[action];
  if (!type) throw new Error(`Unknown notification action: ${action}`);

  return this.create({
    recipient,
    type,
    message: messages[action],
    relatedBlog: blogId
  });
};

/* ── Instance method: mark a single notification read ── */
NotificationSchema.methods.markRead = function () {
  this.read = true;
  return this.save();
};

/* ── Static: mark all of a user's notifications read (bulk, no fetch) ── */
NotificationSchema.statics.markAllRead = function (recipientId) {
  return this.updateMany(
    { recipient: recipientId, read: false },
    { $set: { read: true } }
  );
};

module.exports = mongoose.model('Notification', NotificationSchema);