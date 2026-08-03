/**
 * Blog Middlewares
 *
 * Authorship and role-based access control.
 * Assumes existing JWT/Passport auth middleware has already run and
 * populated req.user (per project convention — not reimplemented here).
 */

const mongoose = require('mongoose');
const Blog = require('../../models/Blog');
const { getUserId } = require('./blog.service');

/**
 * Verifies the blog exists and the logged-in user is either the
 * author or an admin. Attaches the fetched blog to req.blog so
 * downstream controllers don't have to re-query it.
 *
 * Expects the blog id at req.params.id (adjust if your routes use
 * a different param name, e.g. req.params.blogId).
 */
async function isAuthorOrAdmin(req, res, next) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'Invalid blog id' });
  }

  try {
    const blog = await Blog.findOne({ _id: id, isDeleted: false });

    if (!blog) {
      return res.status(404).json({ msg: 'Blog not found' });
    }

    const userId = getUserId(req.user);
    const isOwner = userId && blog.author.toString() === userId.toString();
    const isAdminUser = req.user.role === 'admin';

    if (!isOwner && !isAdminUser) {
      return res.status(403).json({ msg: 'Access denied: not the author or an admin' });
    }

    req.blog = blog;
    return next();
  } catch (err) {
    return res.status(500).json({ msg: 'Error verifying blog ownership', error: err.message });
  }
}

/**
 * Admin-only gate — used for moderation routes (approve/reject/
 * request-changes/delete) and the admin "view all blogs" endpoints.
 */
function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ msg: 'Access denied: Admin only' });
}

/**
 * Gate for blog creation/editing — only Farmer, Business, and Admin
 * roles may reach the create/edit endpoints at all (guests are
 * blocked upstream by the existing auth middleware, but this adds
 * an explicit role check in case that changes later).
 */
function isFarmerBusinessOrAdmin(req, res, next) {
  const allowedRoles = ['farmer', 'business', 'admin'];
  if (req.user && allowedRoles.includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ msg: 'Access denied: insufficient role permissions' });
}

/**
 * Admin-only gate that ALSO fetches the target blog and attaches it
 * to req.blog. Distinct from isAuthorOrAdmin, which would let the
 * blog's own author pass through too — moderation must be admin-only,
 * regardless of who wrote the post.
 */
async function isAdminWithBlog(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied: Admin only' });
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'Invalid blog id' });
  }

  try {
    const blog = await Blog.findOne({ _id: id, isDeleted: false });
    if (!blog) {
      return res.status(404).json({ msg: 'Blog not found' });
    }
    req.blog = blog;
    return next();
  } catch (err) {
    return res.status(500).json({ msg: 'Error fetching blog', error: err.message });
  }
}

module.exports = {
  isAuthorOrAdmin,
  isAdmin,
  isFarmerBusinessOrAdmin,
  isAdminWithBlog
};
