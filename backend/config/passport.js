const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { normalizeRole } = require('../modules/auth/auth.validator');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const selectedRole = normalizeRole(req.query.state);
    const email = profile.emails?.[0]?.value?.toLowerCase();
    if (!email) {
      return done(new Error('Google account did not provide an email address'), null);
    }

    let user = await User.findOne({
      $or: [
        { googleId: profile.id },
        { oauthId: profile.id, authMethod: 'google' }
      ]
    });

    if (!user) {
      // Check if email already exists from another method
      user = email ? await User.findOne({ email }) : null;
      if (user) {
        user.googleId = profile.id;
        user.oauthId = profile.id;
        user.authMethod = 'google';
      } else {
        if (!selectedRole) {
          return done(new Error('Please select a valid role before signing in with Google'), null);
        }

        user = await User.create({
          email,
          name: profile.displayName,
          avatar: profile.photos?.[0]?.value,
          googleId: profile.id,
          oauthId: profile.id,
          authMethod: 'google',
          role: selectedRole,
          accountStatus: selectedRole === 'farmer' ? 'pending' : 'active'
        });
      }
    } else if (!user.googleId) {
      user.googleId = profile.id;
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

const MicrosoftStrategy = require('passport-microsoft').Strategy;

passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: process.env.MICROSOFT_CALLBACK_URL,
    tenant: process.env.MICROSOFT_TENANT_ID || 'common',
    scope: ['user.read'],
    authorizationURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const selectedRole = normalizeRole(req.query.state);
      // 1. Look for existing Microsoft user
      let user = await User.findOne({
        $or: [
          { microsoftId: profile.id },
          { oauthId: profile.id, authMethod: 'microsoft' }
        ]
      });
      if (user) {
        if (!user.microsoftId) {
          user.microsoftId = profile.id;
        }
        return done(null, user);
      }

      // 2. Check if email already exists (e.g., registered via Google)
      const email = profile.emails?.[0]?.value?.toLowerCase();
      if (!email) {
        return done(new Error('Microsoft account did not provide an email address'), null);
      }

      if (email) {
        user = await User.findOne({ email });
        if (user) {
          // Link Microsoft ID to existing account
          user.microsoftId = profile.id;
          user.oauthId = profile.id;
          user.authMethod = 'microsoft';
          return done(null, user);
        }
      }

      // 3. Create new user
      if (!selectedRole) {
        return done(new Error('Please select a valid role before signing in with Microsoft'), null);
      }

      user = await User.create({
        microsoftId: profile.id,
        oauthId: profile.id,
        name: profile.displayName,
        email,
        avatar: profile.photos?.[0]?.value || '',
        authMethod: 'microsoft',
        role: selectedRole,
        accountStatus: selectedRole === 'farmer' ? 'pending' : 'active'
      });

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

module.exports = passport;
