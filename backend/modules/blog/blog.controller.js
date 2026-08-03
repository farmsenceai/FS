const Blog = require('../../models/Blog');
const blogService = require('./blog.service');

exports.getPublishedBlogs = async (req, res) => {
  try {
    const { author, sort } = req.query;

    const filter = {};
    if (author) filter.author = author;

    const sortMap = {
      newest: { publishedAt: -1 },
      oldest: { publishedAt: 1 }
    };

    const blogs = await Blog.findPublished(filter)
      .sort(sortMap[sort] || sortMap.newest)
      .select('-adminComments -reviewHistory')
      .populate('author', 'name');

    return res.status(200).json({ success: true, blogs });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({
      slug: req.params.slug,
      status: 'published',
      isDeleted: false
    })
      .select('-adminComments -reviewHistory')
      .populate('author', 'name');

    if (!blog) {
      return res.status(404).json({ success: false, msg: 'Blog not found' });
    }

    return res.status(200).json({ success: true, blog });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
};

exports.createBlog = async (req, res) => {
  try {
    const createdBlog = await blogService.createBlog(req.body, req.user);
    return res.status(201).json({ success: true, blog: createdBlog });

    // regardless of what the client sent — per spec.
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, msg: error.message });
  }
};

exports.editBlog = async (req, res) => {
  try {
    const { title, coverImage, contentBlocks, status } = req.body;
    const submitForReview = status === 'pending_review';

    const updated = await blogService.handleBlogEdit(
      req.params.id,
      { title, coverImage, contentBlocks, submitForReview },
      req.user
    );

    res.status(200).json({ success: true, blog: updated });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, msg: error.message });
  }
};

exports.getMyBlogs = async (req, res) => {
  try {
    const { status } = req.query;

    const allBlogs = await Blog.find({ author: blogService.getUserId(req.user), isDeleted: false })
      .sort({ updatedAt: -1 });

    // Split into standalone blogs and shadow revisions (revisions always
    // share the same author as their parent, since only the author or
    // an admin acting on the author's behalf can create one).
    const revisionsByParent = new Map();
    const standalone = [];

    allBlogs.forEach(blog => {
      if (blog.parentBlogId) {
        revisionsByParent.set(blog.parentBlogId.toString(), blog);
      } else {
        standalone.push(blog);
      }
    });

    // Merge: a published blog with a pending revision shows as ONE card,
    // carrying both its live status and the revision's review status.
    let merged = standalone.map(blog => {
      const revision = revisionsByParent.get(blog._id.toString());
      const obj = blog.toObject();
      if (revision) {
        obj.pendingRevision = {
          _id: revision._id,
          status: revision.status,
          adminComments: revision.adminComments,
          updatedAt: revision.updatedAt,
          revisionNumber: revision.revisionNumber
        };
      }
      return obj;
    });

    // Filter by the EFFECTIVE status — if a revision exists, its status
    // is what the user cares about seeing under that tab (e.g. a
    // published post with a "changes_requested" revision should show
    // under the Changes Requested tab, not just Published).
    if (status) {
      merged = merged.filter(b => (b.pendingRevision ? b.pendingRevision.status : b.status) === status);
    }

    res.status(200).json({ success: true, blogs: merged });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    let blog = req.blog;

    // If this is a published blog with an in-progress revision, serve
    // the revision's content instead — that's what the user should see
    // and continue editing, not the live published version.
    if (blog.status === 'published') {
      const revision = await Blog.findOne({
        parentBlogId: blog._id,
        status: { $in: ['draft', 'pending_review', 'changes_requested'] }
      });
      if (revision) blog = revision;
    }

    res.status(200).json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    await blogService.softDeleteBlog(req.blog);
    return res.status(200).json({ success: true, msg: 'Blog deleted successfully' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, msg: error.message });
  }
};

exports.getModerationBlogs = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;

    const blogs = await Blog.find(filter)
      .sort({ createdAt: -1 })
      .populate('author', 'name email role');

    return res.status(200).json({ success: true, blogs });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
};

exports.reviewBlog = async (req, res) => {
  try {
    const { action, comments } = req.body;
    const adminId = blogService.getUserId(req.user);
    let blog;

    if (action === 'approved') {
      blog = await blogService.approveBlogRevision(req.blog, adminId);
    } else if (action === 'rejected') {
      blog = await blogService.rejectBlog(req.blog, adminId, comments);
    } else if (action === 'changes_requested') {
      blog = await blogService.requestChanges(req.blog, adminId, comments);
    } else {
      return res.status(400).json({ success: false, msg: 'Invalid action' });
    }

    return res.status(200).json({ success: true, msg: 'Review recorded', blog });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, msg: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await blogService.getNotificationsForUser(blogService.getUserId(req.user));
    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    await blogService.markNotificationRead(req.params.id, blogService.getUserId(req.user));
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, msg: error.message });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await blogService.markAllNotificationsRead(blogService.getUserId(req.user));
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, msg: error.message });
  }
};

exports.getBlogComments = async (req, res) => {
  try {
    const comments = await blogService.getCommentsForBlogSlug(req.params.slug);
    return res.status(200).json({ success: true, comments });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, msg: error.message });
  }
};

exports.addBlogComment = async (req, res) => {
  try {
    const comment = await blogService.addCommentToBlogSlug(req.params.slug, req.body.comment, req.user);
    return res.status(201).json({ success: true, comment });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, msg: error.message });
  }
};

exports.uploadBlogImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, msg: 'Image file is required' });
  }

  return res.status(201).json({
    success: true,
    imageUrl: `/uploads/blogs/${req.file.filename}`
  });
};
