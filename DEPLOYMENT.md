# Deployment configuration

Local development still uses the backend server and existing backend/.env.
Booking requests use the current website origin, including localhost on any port.
Both booking script locations use the local country-states-data.js helper, which
must be loaded before book-demo.js (as on the existing booking page).

Production environment variables:

```env
NODE_ENV=production
APP_URL=https://your-deployment-domain
MONGO_URI=<Atlas connection string including database name>
JWT_SECRET=<strong random secret>
ENABLE_CANONICAL_V2=true
```

For localhost set APP_URL to your local origin, including its port. Set PORT
separately to the server listening port (or use the hosting provider's PORT).
Browser API requests use relative paths/current origin, so they automatically
follow whichever server serves the page; browsers never read the private .env.
Set CORS_ALLOWED_ORIGINS only for additional frontend origins, comma-separated.
CORS is a browser policy, not API authorization. Development retains its previous
CORS behavior. Authentication uses bearer JWTs; unused server sessions have been
removed, so no session cookie or session database is required.

Google and Microsoft sign-in are enabled independently when their CLIENT_ID,
CLIENT_SECRET and APP_URL (or an explicit CALLBACK_URL) are configured. Missing/example values
disable that provider with HTTP 503 while password login remains available.
Use HTTPS production callback URLs ending in /api/auth/google/callback and
/api/auth/microsoft/callback, and register them with each provider.
Callback URLs are derived from APP_URL automatically. Existing FRONTEND_URL,
GOOGLE_CALLBACK_URL and MICROSOFT_CALLBACK_URL values retain precedence for
backward compatibility. To use only APP_URL for deployment URL changes, remove
or leave those three overrides blank in your environment. Existing local .env
has not been edited. Restart the backend after changing environment values.
Test files intentionally use synthetic URLs, not actual deployment settings;
tests must not depend on private .env values. External service URLs and route
paths are separate from the application's configurable public origin.

## Source archive

After reviewing and committing the intended changes, run from the project root:

```sh
git archive --worktree-attributes --format=zip --output=FarmSence-production.zip HEAD backend frontend admin
```

This archives COMMITTED application files only. Uncommitted code changes are not
included. The explicit directory list excludes database dumps, references and
documentation even if tracked. .gitattributes additionally excludes environment
files, tests and existing uploads. .gitignore alone does not filter manual ZIPs.
Do not upload an ordinary ZIP of the full working folder.

Preserve the three sibling folders. Install dependencies in backend with npm ci;
start backend/server.js using the host's Node.js application settings. Provision
persistent writable backend/uploads/selfies and backend/uploads/shops directories
separately; preserve existing user uploads across releases.

These configuration changes do not fix the separately identified administrator
signup, OTP verification, or upload-validation vulnerabilities. Address those
before public launch.
