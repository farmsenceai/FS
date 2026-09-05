function frontendOrigin(env = process.env) {
  const value = env.FRONTEND_URL || env.APP_URL;
  return value ? new URL(value).origin : undefined;
}

function oauthCallback(provider, env = process.env) {
  const explicit = env[`${provider}_CALLBACK_URL`];
  if (explicit) return explicit;
  const base = env.APP_URL || env.FRONTEND_URL;
  return base ? new URL(`/api/auth/${provider.toLowerCase()}/callback`, base).href : undefined;
}

function corsOptions(env = process.env) {
  if (env.NODE_ENV !== 'production') return {};
  // Same-origin requests do not need CORS headers. Explicitly allow any
  // separate frontend origins; never infer trust from a request Host header.
  const origins = new Set([frontendOrigin(env), ...(env.CORS_ALLOWED_ORIGINS || '').split(',')]
    .filter(Boolean).map(value => new URL(value.trim()).origin));
  return { origin: (origin, callback) => callback(null, Boolean(origin && origins.has(origin))) };
}

function oauthConfigured(provider, env = process.env) {
  return Boolean(oauthCallback(provider, env)) && ['CLIENT_ID', 'CLIENT_SECRET'].every(suffix => {
    const value = env[`${provider}_${suffix}`];
    return value && value.trim() && !value.startsWith('replace-with-');
  });
}

module.exports = { corsOptions, oauthConfigured, oauthCallback, frontendOrigin };
