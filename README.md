# FarmSenceAI

FarmSenceAI is a Node.js and MongoDB application. The Express backend serves the API and frontend, so the complete application runs from one backend process.

## Prerequisites

Install:

- [Git](https://git-scm.com/downloads)
- [Node.js 22 LTS](https://nodejs.org/) (Node.js 20.19 or newer should also work)
- npm (included with Node.js)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) or [MongoDB Atlas](https://www.mongodb.com/atlas)
- [MongoDB Database Tools](https://www.mongodb.com/try/download/database-tools) to restore the included dump

Verify the tools:

```powershell
git --version
node --version
npm --version
mongod --version
```

`mongod` is only required when MongoDB runs locally.

## 1. Clone the repository

```powershell
git clone <repository-url>
cd FS-main
```

Run the remaining commands from the project root—the directory containing `backend` and `frontend`.

## 2. Install packages

Install the backend dependencies recorded in its lockfile:

```powershell
cd backend
npm ci
cd ..
```

Install the frontend dependency:

```powershell
cd frontend
npm install
cd ..
```

The frontend is primarily plain HTML, CSS, and JavaScript. Its npm dependency is the static `serve` package.

## 3. Configure the environment

```powershell
Copy-Item backend\.env.example backend\.env
```

Open `backend/.env` and configure at least these values for local MongoDB:

```env
PORT=5003
NODE_ENV=development
FRONTEND_URL=http://localhost:5003

ENABLE_CANONICAL_V2=true

MONGO_URI=mongodb://127.0.0.1:27017/FarmsenceAI
MONGODB_URI=mongodb://127.0.0.1:27017/FarmsenceAI

JWT_SECRET=replace-this-with-a-long-random-secret
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
TERMS_VERSION=1.0
```

Generate a secure JWT secret:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output into `JWT_SECRET`.

### MongoDB Atlas

For Atlas, replace both database values with your connection string:

```env
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER/FarmsenceAI
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER/FarmsenceAI
```

Add your current IP under Atlas **Network Access**. URL-encode special characters in the database password.

### Optional integrations

These can remain unconfigured for basic local development, but their related features will not work:

- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, and `MAIL_PASS` for contact-form email
- Google OAuth client ID, secret, and callback URL
- Microsoft OAuth client ID, secret, callback URL, and tenant ID
- `PIXABAY_API_KEY` for recorded farm footage

Never commit `backend/.env` or real credentials to Git.

## 4. Start MongoDB

For MongoDB Community Server on Windows:

```powershell
Get-Service MongoDB
Start-Service MongoDB
```

Starting the service may require an Administrator PowerShell terminal. Atlas users can skip this step.

## 5. Restore the included database dump (optional)

The repository contains a dump in `dump/FarmsenceAI`.

For local MongoDB, run from the project root:

```powershell
mongorestore --uri="mongodb://127.0.0.1:27017" --db="FarmsenceAI" ".\dump\FarmsenceAI"
```

For Atlas:

```powershell
mongorestore --uri="<your-atlas-connection-string>" --db="FarmsenceAI" ".\dump\FarmsenceAI"
```

Do not add `--drop` unless you intentionally want to remove and replace existing collections.

## 6. Run the complete application

The backend serves the API, public site, dashboards, admin files, and other frontend resources. Only one terminal is required:

```powershell
cd backend
npm run dev
```

Open:

```text
http://localhost:5003
```

`npm run dev` uses Nodemon and restarts the server after backend changes. To run without automatic restarts:

```powershell
cd backend
npm start
```

## Running the frontend separately

A separate frontend process is not needed for full-stack development. The frontend does provide:

```powershell
cd frontend
npm start
```

This serves only `frontend/public`, normally on port 3000. Several pages and API requests rely on routes and files exposed by Express, so it does not run the complete application. Use `http://localhost:5003` through the backend for the supported workflow.

## Optional initialization and demo data

After configuring `backend/.env`, these commands are available from `backend`:

```powershell
cd backend
npm run init:users
npm run seed:birds-health
npm run seed:feed-water
npm run seed:environment
npm run seed:performance
npm run seed:farmer-earnings
npm run seed:farmer-prakash-blogs
npm run seed:live-farm-view
```

Some seed scripts can overwrite or duplicate development data. Use them only with a local or disposable database unless you have reviewed the script first.

## Run tests

Backend tests:

```powershell
cd backend
npm test
```

Frontend tests:

```powershell
cd frontend
npm test
```

Some backend integration tests require a valid `MONGO_URI` in `backend/.env`.

## Troubleshooting

### MongoDB connection error

- Confirm that local MongoDB is running or Atlas is reachable.
- Check `MONGO_URI` in `backend/.env`.
- For Atlas, verify the username, password, IP allowlist, and connection string.

### Port 5003 is already in use

Change the relevant values in `backend/.env`, for example:

```env
PORT=5002
FRONTEND_URL=http://localhost:5002
GOOGLE_CALLBACK_URL=http://localhost:5002/api/auth/google/callback
MICROSOFT_CALLBACK_URL=http://localhost:5002/api/auth/microsoft/callback
```

Then open the application using the new port.

### OAuth login does not work

Supply valid OAuth credentials and ensure the callback URL registered with the provider exactly matches the callback URL in `backend/.env`.

### Contact-form email fails

Configure valid SMTP credentials using the `MAIL_*` variables. Gmail normally requires an app password instead of the account's regular password.

### Frontend loads but API calls fail

Open the application through the backend URL, such as `http://localhost:5003`. Do not open HTML files directly, and do not use the standalone frontend server for full-stack development.
