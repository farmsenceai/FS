# FarmSenceAI package inventory and macOS installation

This inventory covers the four `package.json` files and a scan of 442 source files. Versions below are declared version ranges; lockfiles determine the exact versions installed by `npm ci`.

## 1. Backend — required for the main application

Manifest: `backend/package.json`

| Package | Declared version | Purpose |
|---|---|---|
| `bcryptjs` | `^3.0.3` | Password hashing |
| `cors` | `^2.8.6` | Cross-origin requests |
| `dotenv` | `^16.6.1` | Load `.env` settings |
| `express` | `^4.22.2` | API and website server |
| `express-session` | `^1.19.0` | Sessions |
| `jsonwebtoken` | `^9.0.3` | Authentication tokens |
| `mongoose` | `^9.7.0` | MongoDB models and queries |
| `morgan` | `^1.10.0` | HTTP logging; declared dependency |
| `multer` | `^1.4.5-lts.1` | File uploads |
| `nodemailer` | `^6.10.1` | Send emails |
| `passport` | `^0.7.0` | Authentication |
| `passport-google-oauth20` | `^2.0.0` | Google login |
| `passport-microsoft` | `^2.1.0` | Microsoft login |
| `pdfkit` | `^0.19.1` | PDF generation |
| `nodemon` | `^3.1.0` | Development server auto-restart |

From the project root:

```bash
cd backend
npm ci
cd ..
```

`nodemon` is a development dependency. It is required for `npm run dev`, but not for `npm start`.

## 2. Frontend static server — optional

Manifest: `frontend/package.json`

| Package | Declared version | Purpose |
|---|---|---|
| `serve` | `^14.2.1` | Standalone static frontend server |

```bash
cd frontend
npm install
cd ..
```

The backend already serves the frontend. This package is not needed for normal full application startup. The `frontend` folder does not define an `npm run dev` command.

## 3. React dashboard — optional development/build tooling

Manifest: `frontend/src/dashboard/package.json`

| Package | Declared version | Purpose |
|---|---|---|
| `lucide-react` | `^1.21.0` | React icons |
| `react` | `^19.2.7` | React UI |
| `react-dom` | `^19.2.7` | Browser rendering |
| `react-router-dom` | `^7.18.0` | React navigation |
| `recharts` | `^3.9.0` | Charts |
| `@types/react` | `^19.2.17` | React type definitions |
| `@types/react-dom` | `^19.2.3` | React DOM type definitions |
| `@vitejs/plugin-react` | `^6.0.2` | React support in Vite |
| `oxlint` | `^1.69.0` | Code linting |
| `vite` | `^8.1.0` | Development server and build tool |

The last five packages are development dependencies.

```bash
cd frontend/src/dashboard
npm ci
cd ../../..
```

These packages belong to the nested React project. The Express server's current startup does not run a Vite build.

## 4. Reference farm modal — optional example

Manifest: `refer/FarmSence_React_Create_Farm_Modal/farmsence-react-farm-modal/package.json`

| Package | Declared version |
|---|---|
| `@vitejs/plugin-react` | `^4.3.4` |
| `vite` | `^6.0.5` |
| `react` | `^18.3.1` |
| `react-dom` | `^18.3.1` |
| `lucide-react` | `^0.468.0` |

Install only to run or edit this reference example:

```bash
cd refer/FarmSence_React_Create_Farm_Modal/farmsence-react-farm-modal
npm install
cd ../../..
```

Keep these dependencies in their own folder because their versions differ from the dashboard.

## 5. Browser libraries — loaded from the internet

| Library/resource | Version |
|---|---|
| React | `18` |
| React DOM | `18` |
| Babel Standalone | Unpinned |
| Font Awesome | `6.5.1` |
| particles.js | `2.0.0` |
| Google Fonts: Inter and Libre Caslon Display | Hosted fonts |

The HTML loads these through CDN URLs. No npm installation is required for these HTML references, but an internet connection is needed even on localhost.

## 6. Software needed outside npm

- Node.js 22.12 or newer within the Node 22 series meets the checked backend and dashboard engine requirements.
- npm comes with Node.js.
- MongoDB Community Server is needed for a local database; MongoDB Atlas is an alternative.
- MongoDB Database Tools are needed to restore the included dump with `mongorestore`.
- Git is needed only for cloning or updating through GitHub.

Node built-ins such as `fs`, `path`, `crypto`, and `node:test` come with Node.js. Do not install them separately.

Do not copy Windows `node_modules` folders to a Mac. Install the dependencies on the destination computer.

## 7. Install packages in all four projects

On macOS, use `npm`, not `npm.cmd`. Run these commands from the folder containing `backend`, `frontend`, and `refer`:

```bash
(cd backend && npm ci)
(cd frontend && npm install)
(cd frontend/src/dashboard && npm ci)
(cd refer/FarmSence_React_Create_Farm_Modal/farmsence-react-farm-modal && npm install)
```

At the time of inspection, the lockfiles contained 189 package entries for the backend and 118 for the dashboard. These include indirect dependencies; platform-specific entries may not all be installed on every operating system. `npm ci` handles the applicable dependencies automatically. Individual install commands are unnecessary.

## 8. Run the main application

After configuring `backend/.env` and MongoDB, run from the project root:

```bash
cd backend
npm ci
npm run dev
```

For later launches, skip `npm ci` unless dependencies need reinstalling:

```bash
cd backend
npm run dev
```

Alternatively, run without automatic restarts:

```bash
npm start
```

Wait for the server startup message and **MongoDB Connected**. Keep the terminal open and visit [http://localhost:5003](http://localhost:5003), assuming `PORT=5003` in `.env`.

The backend serves both the website and API. A separate frontend server is not required.

## 9. Configuration required in addition to packages

Package installation alone does not configure database access or OAuth. Check these local settings:

```env
PORT=5003
NODE_ENV=development
FRONTEND_URL=http://localhost:5003
ENABLE_CANONICAL_V2=true
GOOGLE_CALLBACK_URL=http://localhost:5003/api/auth/google/callback
MICROSOFT_CALLBACK_URL=http://localhost:5003/api/auth/microsoft/callback
```

- Set `MONGO_URI` to the intended MongoDB connection string. If `MONGODB_URI` is also used for scripts, keep it consistent.
- Configure a strong `JWT_SECRET`.
- Supply valid OAuth credentials for Google/Microsoft login. The current code initializes both providers at startup; do not remove their client ID fields. Placeholder credentials do not provide working OAuth.
- Register the localhost callback URLs with the corresponding OAuth providers. Keep Render's callback URLs registered if the deployed app still uses the same clients.
- Configure SMTP credentials for email features.
- Share credentials privately, not in this Markdown file or Git.

For fuller database installation and restore instructions, see `README.md` and adapt shell commands to macOS.

This is a source-based dependency inventory, not a macOS end-to-end execution test.
