const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();

const blogController = require('./blog.controller');
const authMiddleware = require('../auth/auth.middleware');
const { isAdmin, isAuthorOrAdmin, isAdminWithBlog, isFarmerBusinessOrAdmin } = require('./blog.middleware');
const { validateCreateBlog, validateReviewBlog } = require('./blog.validator');

const blogUploadsDir = path.join(__dirname, '../../uploads/blogs');
fs.mkdirSync(blogUploadsDir, { recursive: true });

const blogImageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, blogUploadsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    return cb(null, true);
  }
});

const handleBlogImageUpload = (req, res, next) => {
  blogImageUpload.single('image')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'Image must be 5MB or smaller'
        : error.message;
      return res.status(400).json({ success: false, msg: message });
    }

    if (error) {
      return res.status(400).json({ success: false, msg: error.message });
    }

    return next();
  });
};

// --- Public Routes ---
router.get('/', blogController.getPublishedBlogs);
router.get('/post/:slug/comments', blogController.getBlogComments);
router.get('/post/:slug', blogController.getBlogBySlug);

// --- Authenticated Routes (Farmer, Business, Admin) ---
router.get('/my-blogs', authMiddleware, blogController.getMyBlogs);
router.get('/detail/:id', authMiddleware, isAuthorOrAdmin, blogController.getBlogById);
router.post('/upload-image', authMiddleware, isFarmerBusinessOrAdmin, handleBlogImageUpload, blogController.uploadBlogImage);
router.post('/post/:slug/comments', authMiddleware, blogController.addBlogComment);
router.post('/', authMiddleware, isFarmerBusinessOrAdmin, validateCreateBlog, blogController.createBlog);
router.put('/:id', authMiddleware, isFarmerBusinessOrAdmin, isAuthorOrAdmin, validateCreateBlog, blogController.editBlog);
router.delete('/:id', authMiddleware, isAuthorOrAdmin, blogController.deleteBlog);

// --- Notification Routes ---
router.get('/notifications', authMiddleware, blogController.getNotifications);
router.put('/notifications/read-all', authMiddleware, blogController.markAllNotificationsRead);
router.put('/notifications/:id/read', authMiddleware, blogController.markNotificationRead);

// --- Admin-Only Moderation Routes ---
router.get('/moderation', authMiddleware, isAdmin, blogController.getModerationBlogs);
router.post('/:id/review', authMiddleware, isAdminWithBlog, validateReviewBlog, blogController.reviewBlog);

module.exports = router;
