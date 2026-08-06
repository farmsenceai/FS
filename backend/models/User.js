const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    lowercase: true,
    trim: true,
    unique: true,
    required: true
  },
  password: {
    type: String,
    select: false
  },
  authMethod: {
    type: String,
    enum: ['email', 'google', 'microsoft', 'phone'],
    required: true
  },
  googleId: {
    type: String
  },
  microsoftId: {
    type: String
  },
  role: {
    type: String,
    enum: ['admin', 'farmer', 'business'],
    required: true
  },
  accountStatus: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'rejected'],
    default: function defaultAccountStatus() {
      return this.role === 'farmer' ? 'pending' : 'active';
    },
    index: true
  },
  approvedAt: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  suspendedAt: Date,
  suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  statusReason: { type: String, trim: true },
  phone: {
    type: String,
    trim: true
  },
  requestedFarmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm'
  },
  profileCompletedAt: {
    type: Date,
    default: null
  },
  oauthId: {
    type: String
  },
  name: {
   type: String 
  },
  avatar: { 
    type: String 
  },
  agreedToTerms: {
    type: Boolean,
    default: false
  },
  termsAgreedAt: {
    type: Date
  },
  termsVersion: {
    type: String,
    default: '1.0'
  },
  pdfPath: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

UserSchema.index({ googleId: 1 }, { sparse: true });
UserSchema.index({ microsoftId: 1 }, { sparse: true });
UserSchema.index({ phone: 1 }, { sparse: true });
UserSchema.index({ role: 1 });
UserSchema.index({ role: 1, accountStatus: 1, createdAt: -1 });

UserSchema.methods.toSafeObject = function () {
  return {
    id: this.id,
    email: this.email,
    phone: this.phone,
    requestedFarmId: this.requestedFarmId,
    profileCompletedAt: this.profileCompletedAt,
    authMethod: this.authMethod,
    googleId: this.googleId,
    microsoftId: this.microsoftId,
    role: this.role,
    accountStatus: this.accountStatus || 'active',
    name: this.name,
    avatar: this.avatar,
    pdfPath: this.pdfPath,
    agreedToTerms: this.agreedToTerms,
    termsAgreedAt: this.termsAgreedAt,
    termsVersion: this.termsVersion,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    lastLogin: this.lastLogin
  };
};

module.exports = mongoose.model('User', UserSchema);
