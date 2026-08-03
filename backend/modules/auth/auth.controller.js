const authService = require('./auth.service');
const { normalizeRole } = require('./auth.validator');

function sendOAuthMessage(res, type, payload) {
  res.send(`
    <html>
    <body>
    <script>
    window.opener.postMessage(${JSON.stringify({ type, ...payload })}, '${process.env.FRONTEND_URL || '*'}');
    window.close();
    </script>
    </body>
    </html>
  `);
}

function handleAuthError(res, err) {
  if (err.code === 11000) {
    return res.status(409).json({ msg: 'An account with these credentials already exists' });
  }

  if (err.status) {
    return res.status(err.status).json({ msg: err.message });
  }

  console.error(err.message);
  return res.status(500).json({ msg: 'Server error' });
}

async function register(req, res) {
  try {
    const result = await authService.registerUser(req.validatedAuth);
    return res.status(201).json(result);
  } catch (err) {
    return handleAuthError(res, err);
  }
}

async function login(req, res) {
  try {
    const result = await authService.loginWithPassword(req.validatedAuth);
    return res.json(result);
  } catch (err) {
    return handleAuthError(res, err);
  }
}

function logout(req, res) {
  res.json({ success: true, msg: 'Logged out' });
}

async function agreeTerms(req, res) {
  try {
    const result = await authService.agreeToTerms(req.user.userId);
    return res.json(result);
  } catch (err) {
    return handleAuthError(res, err);
  }
}

async function me(req, res) {
  try {
    const result = await authService.getCurrentUser(req.user.userId);
    return res.json(result);
  } catch (err) {
    return handleAuthError(res, err);
  }
}

async function updateMyProfile(req, res) {
  try {
    const result = await authService.updateMyProfile(req.user.userId, req.body);
    return res.json(result);
  } catch (err) {
    return handleAuthError(res, err);
  }
}

async function updateMyAvatar(req, res) {
  try {
    if (!req.file) return res.status(400).json({ success: false, msg: 'Please choose an image' });
    const result = await authService.updateMyAvatar(req.user.userId, `/uploads/avatars/${req.file.filename}`);
    return res.json(result);
  } catch (err) {
    return handleAuthError(res, err);
  }
}

async function setRole(req, res) {
  const role = normalizeRole(req.body.role);
  if (!role) {
    return res.status(400).json({ msg: 'Role must be admin, farmer, or business' });
  }

  try {
    const result = await authService.setRole(req.user.userId, role);
    return res.json(result);
  } catch (err) {
    return handleAuthError(res, err);
  }
}

function sendPhone(req, res) {
  const result = authService.sendPhoneOtp(req.validatedAuth.phone);
  return res.json(result);
}

async function verifyPhone(req, res) {
  try {
    const result = await authService.verifyPhone(req.validatedAuth);
    return res.json(result);
  } catch (err) {
    return handleAuthError(res, err);
  }
}

async function googleCallback(req, res) {
  try {
    const role = normalizeRole(req.query.state);
    const token = await authService.completeOAuthSignIn(req.user, role);
    return sendOAuthMessage(res, 'GOOGLE_AUTH_SUCCESS', { token });
  } catch (err) {
    return sendOAuthMessage(res, 'GOOGLE_AUTH_ERROR', { msg: err.message });
  }
}

async function microsoftCallback(req, res) {
  try {
    const role = normalizeRole(req.query.state);
    const token = await authService.completeOAuthSignIn(req.user, role);
    return sendOAuthMessage(res, 'MICROSOFT_AUTH_SUCCESS', { token });
  } catch (err) {
    return sendOAuthMessage(res, 'MICROSOFT_AUTH_ERROR', { msg: err.message });
  }
}

module.exports = {
  agreeTerms,
  googleCallback,
  login,
  logout,
  me,
  microsoftCallback,
  register,
  sendPhone,
  setRole,
  updateMyProfile,
  updateMyAvatar,
  verifyPhone
};
