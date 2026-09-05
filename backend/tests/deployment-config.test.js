const assert = require('node:assert/strict');
const { test } = require('node:test');
const { corsOptions, oauthConfigured, oauthCallback, frontendOrigin } = require('../config/runtime');

test('development preserves existing cross-origin behavior', () => {
  assert.deepEqual(corsOptions({ NODE_ENV: 'development' }), {});
});

test('production allows only configured origins', () => {
  const config = corsOptions({ NODE_ENV: 'production', APP_URL: 'https://app.example.test', CORS_ALLOWED_ORIGINS: 'https://admin.example.test' });
  for (const [origin, expected] of [['https://app.example.test', true], ['https://admin.example.test', true], ['https://untrusted.test', false], [undefined, false]]) {
    config.origin(origin, (error, allowed) => {
      assert.equal(error, null);
      assert.equal(allowed, expected);
    });
  }
});

test('one environment URL controls callbacks on local and deployed hosts', () => {
  for (const APP_URL of ['http://localhost:5017', 'https://preview.example.test']) {
    const env = { APP_URL, GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret' };
    assert.equal(frontendOrigin(env), APP_URL);
    assert.equal(oauthCallback('GOOGLE', env), `${APP_URL}/api/auth/google/callback`);
    assert.equal(oauthCallback('MICROSOFT', env), `${APP_URL}/api/auth/microsoft/callback`);
    assert.equal(oauthConfigured('GOOGLE', env), true);
  }
});

test('existing environment overrides retain precedence', () => {
  const env = { APP_URL: 'https://app.example.test', FRONTEND_URL: 'http://localhost:5000', GOOGLE_CALLBACK_URL: 'http://localhost:5000/api/auth/google/callback' };
  assert.equal(frontendOrigin(env), env.FRONTEND_URL);
  assert.equal(oauthCallback('GOOGLE', env), env.GOOGLE_CALLBACK_URL);
});

test('OAuth requires complete credentials and ignores example placeholders', () => {
  assert.equal(Boolean(oauthConfigured('GOOGLE', {})), false);
  const env = { GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret', GOOGLE_CALLBACK_URL: 'http://localhost:5000/api/auth/google/callback' };
  assert.equal(oauthConfigured('GOOGLE', env), true);
  assert.equal(oauthConfigured('GOOGLE', { ...env, GOOGLE_CLIENT_ID: 'replace-with-google-client-id' }), false);
});
