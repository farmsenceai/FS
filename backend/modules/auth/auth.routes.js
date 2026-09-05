const express = require('express');
const passport = require('passport');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const authController = require('./auth.controller');
const authMiddleware = require('./auth.middleware');
const {
  validateLogin,
  validateOAuthRole,
  validatePhoneSend,
  validatePhoneVerification,
  validateRegister
} = require('./auth.validator');

const router = express.Router();
const { oauthConfigured } = require('../../config/runtime');
for (const provider of ['google', 'microsoft']) {
  router.use([`/${provider}`, `/${provider}/callback`], (req, res, next) => {
    if (!oauthConfigured(provider.toUpperCase())) {
      return res.status(503).json({ msg: `${provider} sign-in is not configured` });
    }
    return next();
  });
}
const avatarUploadsDir = path.join(__dirname, '../../uploads/avatars');
fs.mkdirSync(avatarUploadsDir, { recursive: true });
const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarUploadsDir),
    filename: (req, file, cb) => {
      const extension = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }[file.mimetype];
      cb(null, `${req.user.userId}-${Date.now()}${extension}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
    cb(allowed ? null : new Error('Only PNG, JPEG, WebP, and GIF images are allowed'), allowed);
  }
});
function handleAvatarUpload(req, res, next) {
  avatarUpload.single('avatar')(req, res, error => {
    if (!error) return next();
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'Profile picture must be 5MB or smaller' : error.message;
    return res.status(400).json({ success: false, msg: message });
  });
}

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/signin', validateLogin, authController.login);
router.post('/logout', authController.logout);

router.post('/agree-terms', authMiddleware, authController.agreeTerms);
router.get('/me', authMiddleware, authController.me);
router.patch('/me/profile', authMiddleware, authController.updateMyProfile);
router.post('/me/avatar', authMiddleware, handleAvatarUpload, authController.updateMyAvatar);
router.post('/set-role', authMiddleware, authController.setRole);

router.post('/phone/send', validatePhoneSend, authController.sendPhone);
router.post('/phone/verify', validatePhoneVerification, authController.verifyPhone);

router.get('/google', validateOAuthRole, (req, res, next) => {
  const { role } = req.validatedAuth;
  return passport.authenticate('google', { scope: ['profile', 'email'], state: role })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/sign-in.html?error=google_failed', session: false }),
  authController.googleCallback
);

router.get('/microsoft', validateOAuthRole, (req, res, next) => {
  const { role } = req.validatedAuth;
  return passport.authenticate('microsoft', { prompt: 'select_account', state: role })(req, res, next);
});

router.get('/microsoft/callback',
  passport.authenticate('microsoft', { failureRedirect: '/sign-in.html?error=microsoft_failed', session: false }),
  authController.microsoftCallback
);

module.exports = router;
