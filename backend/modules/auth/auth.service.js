const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Farm = require('../../src/modules/farms/farms.model');
const { generateTermsPDF } = require('../../services/pdfGenerator');
const { getPhoneAuthEmail, normalizePhone } = require('./auth.validator');

const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12;
const CURRENT_TERMS_VERSION = process.env.TERMS_VERSION || '1.0';

function getRoleLabel(role) {
  return {
    admin: 'Admin',
    farmer: 'Farmer',
    business: 'Business'
  }[role] || 'assigned';
}

function getRoleMismatchMessage(role) {
  return `This account is registered as a ${getRoleLabel(role)} account. Please sign in using the ${getRoleLabel(role)} role.`;
}

function validateSelectedRole(user, selectedRole) {
  if (!selectedRole) {
    return 'Please select a role before signing in.';
  }

  if (!user.role) {
    return 'This account does not have a role assigned. Please contact support.';
  }

  if (user.role !== selectedRole) {
    return getRoleMismatchMessage(user.role);
  }

  return null;
}

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return process.env.JWT_SECRET;
}

function createToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    authMethod: user.authMethod,
    role: user.role
  };

  return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_EXPIRES_IN });
}

function safeUser(user) {
  const data = user.toSafeObject();
  data.latestTermsVersion = CURRENT_TERMS_VERSION;
  data.agreedToTerms = Boolean(user.agreedToTerms && user.termsVersion === CURRENT_TERMS_VERSION);
  return data;
}

function authResponse(user, token = createToken(user)) {
  return {
    success: true,
    token,
    user: safeUser(user)
  };
}

async function registerUser({ email, password, role }) {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const err = new Error('An account with this email already exists');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = new User({
    email,
    password: passwordHash,
    authMethod: 'email',
    role,
    agreedToTerms: false
  });

  await user.save();
  return authResponse(user);
}

async function loginWithPassword({ email, password, role }) {
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    const err = new Error('No account was found for this email');
    err.status = 404;
    throw err;
  }

  if (!user.password) {
    const err = new Error('This account needs a password reset before signing in');
    err.status = 400;
    throw err;
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    const err = new Error('Incorrect password');
    err.status = 401;
    throw err;
  }

  const roleError = validateSelectedRole(user, role);
  if (roleError) {
    const err = new Error(roleError);
    err.status = 403;
    throw err;
  }

  user.lastLogin = new Date();
  await user.save();

  return authResponse(user);
}

async function getCurrentUser(userId) {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  return { success: true, user: safeUser(user) };
}

async function updateMyProfile(userId, payload = {}) {
  const allowedFields = new Set(['name', 'email', 'phone', 'requestedFarmId']);
  const unknownFields = Object.keys(payload).filter(field => !allowedFields.has(field));
  if (unknownFields.length) {
    const err = new Error(`Profile field is not allowed: ${unknownFields.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const phone = normalizePhone(payload.phone);
  const requestedFarmId = String(payload.requestedFarmId || '').trim();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone) {
    const err = new Error('Name, valid email, and valid phone are required');
    err.status = 400;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  if (user.role === 'farmer') {
    const effectiveFarmId = requestedFarmId || String(user.requestedFarmId || '');
    if (!mongoose.isObjectIdOrHexString(effectiveFarmId)) {
      const err = new Error('Please select a valid farm');
      err.status = 400;
      throw err;
    }
    const requestedFarm = await Farm.findOne({ _id: effectiveFarmId, deletedAt: null }).select('_id').lean().exec();
    if (!requestedFarm) {
      const err = new Error('Please select a valid farm');
      err.status = 400;
      throw err;
    }
    user.requestedFarmId = effectiveFarmId;
    user.profileCompletedAt = user.profileCompletedAt || new Date();
  }

  user.name = name;
  user.email = email;
  user.phone = phone;
  try {
    await user.save();
  } catch (error) {
    if (error?.code === 11000) {
      const conflict = new Error('That email address is already in use');
      conflict.status = 409;
      throw conflict;
    }
    throw error;
  }
  return { success: true, user: safeUser(user) };
}

async function updateMyAvatar(userId, avatar) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  user.avatar = avatar;
  await user.save();
  return { success: true, user: safeUser(user) };
}

async function agreeToTerms(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  user.agreedToTerms = true;
  user.termsAgreedAt = new Date();
  user.termsVersion = CURRENT_TERMS_VERSION;
  user.pdfPath = await generateTermsPDF(user);

  await user.save();

  return { success: true, user: safeUser(user) };
}

async function setRole(userId, role) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  if (user.role && user.role !== role) {
    const err = new Error(getRoleMismatchMessage(user.role));
    err.status = 403;
    throw err;
  }

  if (user.role !== role) {
    user.role = role;
    await user.save();
  }

  return authResponse(user);
}

function sendPhoneOtp(phone) {
  return { message: 'OTP sent — integrate Twilio or Firebase here', phone };
}

async function verifyPhone({ phone, role }) {
  let user = await User.findOne({ phone });

  if (user) {
    const roleError = validateSelectedRole(user, role);
    if (roleError) {
      const err = new Error(roleError);
      err.status = 403;
      throw err;
    }

    if (user.authMethod !== 'phone') {
      user.authMethod = 'phone';
    }
  } else {
    user = new User({
      email: getPhoneAuthEmail(phone),
      phone,
      authMethod: 'phone',
      role,
      agreedToTerms: false
    });
  }

  user.lastLogin = new Date();
  await user.save();

  return authResponse(user);
}

async function completeOAuthSignIn(user, selectedRole) {
  if (user.role) {
    const roleError = validateSelectedRole(user, selectedRole);
    if (roleError) {
      const err = new Error(roleError);
      err.status = 403;
      throw err;
    }
  } else if (selectedRole) {
    user.role = selectedRole;
  } else {
    const err = new Error('Please select a role before signing in.');
    err.status = 400;
    throw err;
  }

  user.lastLogin = new Date();
  await user.save();

  return createToken(user);
}

module.exports = {
  agreeToTerms,
  authResponse,
  completeOAuthSignIn,
  createToken,
  getCurrentUser,
  registerUser,
  safeUser,
  sendPhoneOtp,
  setRole,
  updateMyProfile,
  updateMyAvatar,
  validateSelectedRole,
  verifyPhone,
  loginWithPassword
};
