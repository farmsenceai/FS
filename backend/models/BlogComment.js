const mongoose = require('mongoose');

const BlogCommentSchema = new mongoose.Schema({
  blogSlug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  blog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    default: null
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

BlogCommentSchema.index({ blogSlug: 1, isDeleted: 1, createdAt: -1 });

module.exports = mongoose.model('BlogComment', BlogCommentSchema);
