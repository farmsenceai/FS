# FarmSence AI Internship Progress Report

## Executive Summary

Between the internship baseline and the current project, FarmSence AI changed from a small, mostly static marketing website into a multi-role farm-management platform. The current version adds an Express/MongoDB backend, email and OAuth authentication, business/admin/farmer dashboards, operational modules for poultry batches and daily farm records, financial intelligence, blogging and moderation, seed/migration tooling, and automated backend/frontend tests.

The comparison used `C:\Users\Megha Prasad\Documents\Projects\farmsenceOR\farmsence.ai` as the baseline root. The requested current path (`C:\Users\Megha Prasad\farmsence.ai`) did not exist, so the active repository at `C:\Users\Megha Prasad\Documents\farmsence.ai` was used as the current version. After ignoring dependencies, Git metadata, lockfiles, build output, database dumps, backups, logs, and user-uploaded/generated files, the baseline contained 65 files and the current project contained approximately 500 source/configuration/documentation/static-asset files.

## Comparison Scope and Method

- Recursively inventoried both directory trees.
- Compared file contents with SHA-256 hashes to distinguish unchanged moves/copies from edits.
- Read the actual backend route mounts, models, services, validators, migrations, frontend views, shared dashboard code, tests, package manifests, and relevant commit history.
- Treated the baseline's nested `farmsence.ai` directory as its project root.
- Excluded `.git`, `node_modules`, `dist`, `build`, `.next`, `coverage`, caches, lockfiles, `backend/backups`, `backend/logs`, `backend/uploads`, and `dump` because they are repository metadata, dependencies, build output, operational data, or generated artifacts.
- Did not expose values from real `.env` files. Only the existence and purpose of environment configuration are documented.
- Classified zero-byte baseline placeholders as removed/replaced rather than meaningful content-preserving moves.

## New Features Added

### 1. Full Backend and API Server

**Category: New feature / architecture**

The baseline had no application backend other than a small PHP contact-form handler. The current project adds an Express application connected to MongoDB through Mongoose. `backend/app.js` configures JSON/form parsing, CORS, sessions, Passport, static-file serving, public routes, authenticated feature routes, and the canonical `/api/v2` API. `backend/server.js` separates process startup and database connection from application construction, which also makes the app testable.

The server now exposes:

- Public case-study, contact, demo-request, blog, and authentication endpoints.
- Business dashboard APIs for projects, batches, finance, bird health, feed/water, environment, and performance.
- Admin dashboard endpoints for overview metrics, farmers, businesses, project managers, and approvals.
- Canonical tenant-aware `/api/v2` resources for organizations, farms, facilities, assignments, bird batches, flock records, managers, projects, reviews, farmer fees, sales, expenses, financial aggregation, and compensation claims.

### 2. Authentication, Roles, Profiles, and OAuth

**Category: New feature with security hardening**

Authentication now supports:

- Email/password registration and login with bcrypt password hashing.
- JWT-backed authenticated API access.
- Google OAuth 2.0 and Microsoft OAuth through Passport.
- Phone send/verify endpoints.
- Explicit `admin`, `farmer`, and `business` roles.
- Account lifecycle states: `pending`, `active`, `suspended`, and `rejected`.
- Terms acceptance with version and timestamp tracking.
- User profile completion, avatar/name data, requested farm assignment, and safe user serialization.
- Role-aware routing to the correct dashboard.

Representative schema:

```js
authMethod: {
  type: String,
  enum: ['email', 'google', 'microsoft', 'phone'],
  required: true
},
role: {
  type: String,
  enum: ['admin', 'farmer', 'business'],
  required: true
},
accountStatus: {
  type: String,
  enum: ['pending', 'active', 'suspended', 'rejected'],
  default: 'active'
}
```

### 3. Business Dashboard and Farm Operations

**Category: New feature**

A React/Vite dashboard was added with 22 business-facing views organized into four areas:

- **Main:** dashboard, live farm view, ongoing/completed projects, project manager, reports, and payments.
- **Farm Operations:** batch management, bird health, feed and water, environment, performance, and AI insights.
- **Financial Intelligence:** financial overview, profit forecast, batch-wise revenue, historical reports, and cost intelligence.
- **Knowledge Center:** courses, learning progress, SOPs/checklists, and certificates.

The operational APIs provide real CRUD and reporting behavior:

- **Batch Management:** batch creation/listing, farm overview, inventory, operations, alerts, performance, and farmer-owned batch CRUD.
- **Bird Health:** health cases/events, vaccination schedules, alerts, downloadable records, and farmer summaries.
- **Feed & Water:** consumption logs, inventory, water-system state, alerts, reports, and farmer inventory reporting.
- **Environment:** parameter thresholds, readings, alerts, historical records, downloadable reports, and farmer reading CRUD.
- **Performance:** batch KPI tracking, trends, drivers, recommendations, and report generation.
- **Projects:** manager overview, assignments, site visits, activity history, ongoing work, completion, and work updates.

### 4. Canonical Multi-Tenant Farm Architecture

**Category: New feature / major refactor**

The newer `backend/src` architecture normalizes the platform around organizations, farms, facilities, batches, and dated flock records. Reusable controller/service/repository/policy/validator layers replace direct route-to-database coupling.

The shared tenant envelope consistently adds ownership and audit metadata:

```js
{
  businessId,
  farmId,
  batchId,
  createdBy,
  createdByDeviceId,
  source,        // manual, sensor, camera, import, integration, system, ai
  schemaVersion,
  deletedAt,
  deletedBy
}
```

Key canonical modules:

- **Organizations and memberships:** business identity, legal/contact data, owners/admins/managers/members, suspension, and soft deletion.
- **Farms and facilities:** geospatial farm locations, poultry type, sheds/warehouses/water systems and other facility types, status, capacity, and hierarchy.
- **Farm assignments and managers:** time-bounded staff/farmer assignment, active-assignment uniqueness, and manager-to-farm allocation.
- **Bird batches:** normalized codes, breed and broiler/layer/breeder type, placement dates, head counts, lifecycle states, harvesting, and uniqueness within a farm.
- **Flock records:** one daily record per batch/day with mortality, culls, feed, water, weight, health, environment, source, submission state, and offline/import support.
- **Projects and reviews:** farm work projects, status/priority, work updates, completion, and one farmer review per completed project.

### 5. Farmer Dashboard and Daily Record Workflow

**Category: New feature**

The current version adds a dedicated farmer shell and pages for:

- Farmer dashboard and work due today.
- My Batches.
- Daily Record Entry.
- Bird Health, Feed & Water, and Environment.
- My Earnings and compensation claims.
- My Fees.
- My Reviews.
- SOPs/checklists and certificates.

Shared modules (`farmer-profile.js`, `farmer-record-hub.js`, and `canonical-farm-operations.js`) centralize profile state, daily-entry behavior, and canonical API reads. This reduces duplicated page logic and keeps the farmer and business views aligned to the same farm/batch records.

### 6. Admin Dashboard and Approval Workflow

**Category: New feature**

An admin-specific dashboard was added for:

- Platform overview metrics.
- Farmer and business account management.
- Project-manager creation, editing, activation, and farm allocation.
- Approval queue decisions.
- Farm operations.
- Blog moderation.
- Financial intelligence and platform revenue.
- Audit trail and platform settings UI.

Admin policies require a platform-admin role. Services and repositories aggregate account/farm/project data rather than exposing raw collections directly.

### 7. Financial Intelligence

**Category: New feature**

The project now records financial events and calculates operational performance from canonical data:

- Batch sales with quantity, average live weight, price/kg, revenue, and sale date.
- Batch or shared-farm expenses using feed, chicks, labor, medicine/vaccines, utilities, transport, and other categories.
- Farmer fees and payment state.
- Farmer compensation/earning claims with review states.
- Overview totals, batch-wise revenue, profitability, forecasts, historical ranges, and downloadable reports.
- Date-range and daily/weekly/monthly aggregation.
- Deep links from financial summaries back to source ledgers.

The formulas deliberately separate direct production costs from shared expenses:

```js
grossProfit = revenue - directProductionExpenses;
operationalProfit = revenue - totalExpenses;
profitMarginPercent = operationalProfit / revenue * 100;
```

Operational metrics also derive mortality, livability, feed use, recorded weight gain, and estimated FCR from dated flock records instead of unrelated mock totals.

### 8. Blog Authoring, Moderation, and Public Content

**Category: New feature / major enhancement**

The static blog examples became a data-backed publishing workflow:

- Public blog list and slug-based detail pages.
- Authenticated "My Blogs" area.
- Create/edit/delete posts.
- Image upload.
- Draft/review/published lifecycle validation.
- Admin moderation and review.
- Comments and author notifications.
- Dynamic research article data and detail pages.
- Dynamic case-study pages rendered from structured backend data.

Business dashboards intentionally remain read-only and do not load the authoring feature; farmer users retain the blog workflow.

### 9. Contact and Demo Request Workflows

**Category: New feature / migration**

The original PHP mail form was replaced by backend APIs and MongoDB persistence:

- Contact submissions store name, email, message, and `new/read/replied` status.
- Admin-only contact listing.
- Demo requests validate form fields, accept agreement/selfie/shop uploads, persist request data, and support email/PDF-related services.
- Frontend scripts submit to the new API and provide form feedback.

### 10. Reports, Seeding, Migrations, and Verification

**Category: Infrastructure / reliability**

The current backend adds:

- PDF generation through PDFKit.
- Seeders for batch management, bird health, feed/water, environment, performance, project management, and farmer earnings.
- Verification scripts for each seeded module plus canonical financial and farmer flows.
- Safety-aware migrations with dry-run/commit behavior and configurable environment files.
- Migrations to seed farms, backfill legacy batches, simplify assignments, normalize batch codes, merge staging collections, seed completed projects/financial demos, and enforce one daily flock record per batch/day.

## Backend Changes

### Application Structure

**New:** The backend is organized in two complementary layers:

1. `backend/modules` contains the first feature-oriented extraction from legacy routes.
2. `backend/src/modules` contains the newer canonical, tenant-aware domain architecture with controller, service, repository, policy, model, route, and validator separation.

Compatibility route files such as `batchManagementRoutes.js`, `financialOverviewRoutes.js`, and `projectManagerRoutes.js` now re-export the feature routers. This preserves existing imports while consolidating implementation.

### Models and Data Entities

The backend adds models for users, contacts, demo requests, projects, managers, batches, operations, inventory, activities, tasks, notifications, blogs/comments/reviews, environment readings and alerts, feed/water state and logs, bird-health cases/records/vaccinations, performance drivers/recommendations, earnings claims, and dashboard snapshots.

The canonical model layer adds organizations, memberships, farms, facilities, assignments, managers, bird batches, flock records, farm projects/work updates/reviews, farmer fees, batch sales/expenses, and compensation claims.

Important integrity rules include:

- Unique organization slug and optional legal tax identifiers.
- Unique active facility code within a farm.
- Unique active batch code within a farm.
- Unique active user/farm assignment.
- Unique daily flock record for each batch and calendar day.
- Unique farmer review for a non-deleted project.
- Indexed tenant, farm, batch, status, and date fields for scoped queries.
- Soft deletion rather than destructive deletion for canonical entities.
- Decimal128 for money and weight-sensitive financial values.

### Controllers, Services, Repositories, Policies, and Validators

- **Controllers** translate HTTP input/output and normalize service errors into status codes.
- **Services** implement business rules, permissions, calculations, and cross-entity checks.
- **Repositories** centralize scoped Mongoose queries, pagination, population, and soft deletion.
- **Policies** define role and ownership permissions for each domain.
- **Validators** reject unsupported fields, invalid enums, malformed dates/numbers, and inconsistent state transitions before persistence.

This is a substantial refactor from the baseline, where page scripts and a PHP form handler contained most behavior.

### API Security

- JWT middleware accepts bearer tokens and attaches authenticated user context.
- Feature middleware enforces admin/farmer/business access.
- Tenant middleware resolves business, farm, and batch scope.
- Canonical policies restrict mutations by role, assignment, ownership, entity state, and project completion.
- Financial routes were explicitly protected after initially being exposed.
- Environment templates separate local and staging configuration.

## Frontend Changes

### Static Site Reorganization

The original root website was reorganized:

- Public entry points and shared static assets moved under `frontend/public`.
- content pages moved under `frontend/src/pages`.
- shared header/footer/layout behavior moved into `frontend/src/components`.
- dashboard code was isolated under `frontend/src/dashboard`.
- page-specific CSS, JS, images, and data were grouped below each page area.

This makes deployment and asset URLs predictable while separating the marketing site from the authenticated dashboard.

### Marketing and Content Pages

Compared with the baseline:

- The home page grew from 566 to 661 lines and now uses reusable layout loading, mobile navigation, auth-aware navigation, dashboard routing, transitions, and refined responsive sections.
- The shared stylesheet grew from 1,841 to 2,080 lines with mobile/responsive rules, fixed header/footer behavior, button states, and section cleanup.
- Contact Sales was substantially rewritten into a cleaner split layout and connected form workflow.
- Mission, Products, Research, Blog, Blog Detail, and video pages were shortened structurally by moving shared markup and behavior into reusable assets/scripts.
- Research and blogs gained data-driven cards, sorting/filtering, stable scroll behavior, sidebar sizing, and detail-page initialization.
- New pages include Book Demo, Case Studies, Create Blog, Edit Blog, Privacy Policy, Terms/Cookies content, and Sign In.
- Case studies now use backend slug data and a dedicated detail stylesheet/script.

### Dashboard UI

The dashboard gained:

- React Router navigation and a reusable `Layout`, `Sidebar`, and `TopNav`.
- Central navigation configuration and Lucide icon resolution.
- Responsive dashboard styling.
- Recharts-based graphs and financial/operational visualizations.
- Separate business, admin, and farmer entry points.
- Shared authentication, role guard, terms, profile, sidebar, shell, and record-hub modules.
- Data-backed views with loading, empty, error, filtering, modal/form, pagination, create/edit/delete, and download behaviors where appropriate.

### Static Assets

The existing farm images, logos, videos, and primary CSS/JS assets were mostly preserved under `frontend/public/assets`. New assets include case-study images, FarmSence logos, livestock/morbidity SVGs, a Fugaz One font, dashboard icons, and dashboard hero/React/Vite assets.

## Bug Fixes

The following fixes are evidenced by content changes, tests, or focused commits:

- **Authenticated user routing:** stabilized role-aware navigation after sign-in and centralized dashboard redirects.
- **Financial route protection:** added authentication/role middleware to prevent unauthorized access.
- **Header layout:** corrected green/white bar positioning and mobile behavior.
- **Footer layout:** corrected rendering and later replaced repeated footer markup with a shared layout component.
- **Responsive/mobile UI:** added breakpoints and a mobile menu while preserving the desktop layout.
- **Contact page:** corrected broken HTML nesting and implemented the intended 50/50 desktop layout.
- **Research/blog scrolling:** resolved repeated card/scroll/sidebar-height glitches and improved mobile scrolling.
- **Filter/sort/button hover states:** corrected contrast and interactive feedback.
- **Home-page React section:** repaired the embedded/interactive section.
- **Page breaks:** corrected dashboard/print-style pagination and content breaks.
- **Shared dashboard routing:** removed duplicated route logic and consolidated shell/sidebar behavior.
- **Financial mock retirement:** tests ensure current financial pages use API/canonical data rather than stale mock datasets.
- **Business read-only enforcement:** tests ensure business dashboard views do not issue mutation requests or load farmer blog authoring.
- **Canonical data consistency:** business bird-health, feed/water, and environment views read the same flock records.
- **Farm and batch constraints:** validators and migrations normalize batch codes, prevent duplicate active assignments/codes, and enforce one daily record per batch/day.
- **Migration safety:** migration helpers support dry runs, explicit commit flags, environment checks, and pre-merge backups.
- **Unsaved financial forms:** tests verify protection against losing ledger edits during navigation.
- **Tenant-context deep links:** financial drill-down retains business/farm/batch scope and highlights the source record.
- **Project-review permissions:** only eligible farmers with the required active assignment can review their own completed project.

## Configuration and Infrastructure Changes

### Dependencies

The baseline did not contain a usable application dependency manifest. The current backend adds:

- Express, CORS, Morgan, sessions, and dotenv.
- Mongoose for MongoDB.
- bcryptjs and jsonwebtoken.
- Passport with Google and Microsoft strategies.
- Multer for uploads.
- Nodemailer for email.
- PDFKit for generated PDFs.
- Nodemon for development.

The dashboard adds React 19, React DOM, React Router, Recharts, Lucide React, Vite, the React Vite plugin, and Oxlint. The static frontend package uses `serve` and Node's built-in test runner.

### Environment and Deployment Configuration

- Added `.env.example` and staging equivalents for database/auth/OAuth/mail/session settings.
- Added a staging environment split.
- Added `.gitignore` coverage for credentials, dependencies, generated output, uploads, logs, and backups.
- Added `.htaccess` deployment configuration under `admin`.
- Added Vite dashboard configuration.
- Added backend start/dev/seed/verify/migrate/test scripts.
- Added frontend and dashboard test/build/lint scripts.

> Note: `backend/.env` and `backend/.env.staging` exist in the current tree. Their values are intentionally not reproduced in this report; secrets should not be committed.

### Database and Data Operations

- MongoDB became the primary persistence layer.
- Seed scripts create coherent demo data per dashboard module.
- Canonical migrations transition legacy collections toward organization/farm/batch ownership.
- Database BSON/JSON dump files and pre-merge backups exist but are excluded from the change log as generated operational artifacts.

### Automated Tests

The project adds backend and frontend Node test suites covering:

- Authentication, profile updates, roles, route protection, and canonical authorization.
- Admin dashboard queries and management routes.
- Farm directory/facility validation.
- Bird batch creation and flock-record extensions.
- Sales, expenses, compensation claims, farmer fees, reviews, and financial aggregation.
- Migration safety and demo seeding.
- Case-study rendering.
- Business read-only behavior.
- Farmer operational dashboards.
- Admin financial CRUD, pagination, filters, actor identity, deep links, and unsaved-form handling.

## Renamed and Moved Files

### Exact-content moves/copies

The following non-empty files were confirmed by identical content hashes:

- `assets/css/blogsliderOptimized.css` → `frontend/public/assets/css/blogsliderOptimized.css`
- `assets/js/signal-split.js` → `frontend/public/assets/js/signal-split.js`
- `assets/images/anil-sharma-yfKDx1Xp6lI-unsplash(1).jpg` → `frontend/public/assets/images/anil-sharma-yfKDx1Xp6lI-unsplash(1).jpg`
- `assets/images/Real Tim visiblity.png` → `frontend/public/assets/images/Real Tim visiblity.png`
- Every file under `assets/images/Test Images/` → the same relative name under `frontend/public/assets/images/Test Images/`
- `pages/farmer-standing-rice-field-with-tablet(1).jpg` → `frontend/src/pages/assets/images/farmer-standing-rice-field-with-tablet(1).jpg` (also retained as a public Test Image)
- Every logo under `assets/svg logos/` → `frontend/public/assets/logos/`
- Every video under `assets/video/` → `frontend/public/assets/video/`

### Moved and modified

- `index.html` → `frontend/public/index.html`: expanded home page, new asset paths, reusable layout/auth/mobile scripts, and responsive/content updates.
- `coming-soon.html` → `frontend/public/coming-soon.html`: simplified markup and moved behavior/styles to dedicated assets.
- `assets/css/{coming-soon,signal-split,style}.css` → `frontend/public/assets/css/`: reorganized paths plus responsive/layout changes.
- `assets/js/main.js` → `frontend/public/assets/js/main.js`: updated page initialization, navigation, and interaction behavior.
- `forms/contact-form.html` → `frontend/src/pages/forms/contact-form.html`: reduced to reusable form markup and connected to the new JS/API workflow.
- `forms/contact-form-style.css` → `frontend/public/assets/css/contact-form-style.css`: path move with minor formatting/content adjustment.
- `pages/contact-sales.html` → `frontend/src/pages/contact-sales.html`: repaired nesting, responsive split layout, shared layout integration, and API form behavior.
- `pages/{mission,products,research}.html` → `frontend/src/pages/`: shared layout/asset migration and page-specific improvements.
- `blog/index.html` → `frontend/src/pages/blogs.html`: data-driven blog listing with filters/sidebar behavior.
- `blog/post.html` → `frontend/src/pages/blog-detail.html`: reusable dynamic detail shell instead of one hard-coded article.
- `blog/styleblog.css` → `frontend/src/pages/assets/css/styleblog.css`: expanded listing/detail responsive styles.
- `blog/vieosection.html` → `frontend/src/pages/vieosection.html`: shared layout and simplified video-section page.
- `Reference Code/dehaatFooter.html` remained at the same path with a minor one-line adjustment.
- `sitemap.xml` → `frontend/public/sitemap.xml`: deployment path and URL content updates.

## Deleted or Removed Files

These baseline paths no longer have a direct current counterpart:

- `.htaccess` (root rules were not retained; `admin/.htaccess` is an empty placeholder).
- `assets/react/BlogSlider.jsx` (the isolated prototype was removed; blog/dashboard UI now lives in the proper frontend application).
- `assets/react/package.json` (empty placeholder removed).
- `blog/vieosection.html` was renamed to the corrected `frontend/src/pages/vieosection.html` spelling.
- `forms/contact-form.php` (replaced by Express contact/demo APIs, persistence, mail services, and frontend fetch code).
- `pages/Assets` (empty placeholder removed).
- Baseline zero-byte placeholders `components/header.html`, `components/footer.html`, `docs/privacy-policy.html`, `docs/terms.html`, `favicon.ico`, `pages/cookies-policy.html`, `pages/farm-intelligence.html`, and `robots.txt` were replaced by populated files in the reorganized frontend/docs locations rather than retained as meaningful content.

## Appendix A — File-by-File Change Log

The appendix lists every relevant non-generated current path. Files grouped on one line share the stated purpose; every filename is given as a full project-relative path.

### Root, Admin, and Configuration

- `.gitignore` — **Added / infrastructure:** excludes secrets, dependencies, generated files, uploads, logs, backups, and build output.
- `.vscode/settings.json` — **Added / tooling:** workspace editor settings.
- `README.md` — **Added / documentation:** project title placeholder.
- `admin/.htaccess` — **Moved/replaced placeholder:** admin deployment override placeholder; it does not contain the baseline root rewrite rules.
- `backend/.env`, `backend/.env.staging` — **Added / local configuration:** runtime and staging values; contents intentionally omitted because they may contain secrets.
- `backend/.env.example`, `backend/.env.staging.example` — **Added / configuration:** documented local and staging environment variable templates.
- `backend/package.json` — **Added / dependencies and scripts:** backend runtime packages plus start, dev, seed, verification, migration, JWT, and test commands.
- `frontend/package.json` — **Added / dependencies and scripts:** static frontend serving and tests.
- `frontend/src/dashboard/package.json` — **Added / dependencies and scripts:** React/Vite dashboard, routing, charting, icons, lint/build/dev commands.
- `frontend/src/dashboard/.gitignore`, `frontend/src/dashboard/.oxlintrc.json`, `frontend/src/dashboard/vite.config.js` — **Added / dashboard tooling:** generated-file exclusions, lint configuration, and Vite build configuration.

### Backend Entry Points and Shared Configuration

- `backend/app.js` — **Added / architecture:** constructs Express middleware, static mounts, legacy feature APIs, admin APIs, and all `/api/v2` routers.
- `backend/server.js` — **Added / architecture:** loads environment, connects MongoDB, and starts the HTTP listener separately from app construction.
- `backend/config/db.js` — **Added / infrastructure:** shared MongoDB connection helper.
- `backend/config/passport.js` — **Added / authentication:** Google and Microsoft strategy configuration and user serialization.
- `backend/middleware/auth.js` — **Added / security:** bearer-token authentication middleware.
- `backend/middleware/authValidation.js` — **Added / validation:** legacy authentication request validation.
- `backend/services/pdfGenerator.js` — **Added / reporting:** reusable PDF generation.

### Authentication and Contact Modules

- `backend/modules/auth/auth.controller.js` — **Added / auth:** HTTP handlers for registration, sign-in/out, terms, profile, role, phone, and OAuth callbacks.
- `backend/modules/auth/auth.middleware.js` — **Added / security:** feature-level JWT middleware.
- `backend/modules/auth/auth.routes.js` — **Added / auth:** email, phone, profile, terms, Google, and Microsoft endpoints.
- `backend/modules/auth/auth.service.js` — **Added / auth:** hashing, token issuance, OAuth account linking, profile/role rules, and safe user responses.
- `backend/modules/auth/auth.validator.js` — **Added / validation:** request schemas and OAuth role validation.
- `backend/modules/contact/contact.controller.js` — **Added / contact:** submit/list HTTP handlers.
- `backend/modules/contact/contact.routes.js` — **Added / contact:** public submit and admin-only listing endpoints.
- `backend/modules/contact/contact.service.js` — **Added / contact:** persistence and contact workflow logic.
- `backend/controllers/contact.controller.js`, `backend/routes/contact.routes.js`, `backend/routes/auth.js` — **Refactored / compatibility:** legacy import paths or earlier controllers retained while canonical module routers are used.
- `backend/models/Contact.model.js` — **Added / data:** contact identity, message, and new/read/replied status.
- `backend/models/DemoRequest.js` — **Added / data:** demo booking/contact/upload request persistence.
- `backend/routes/demo.routes.js` — **Added / demo workflow:** validates and accepts demo request form data and uploads.

### Blog and Case Studies

- `backend/models/Blog.js` — **Added / publishing:** blog content, author, slug, media, and publication/moderation state.
- `backend/models/BlogComment.js` — **Added / publishing:** authenticated comments linked to posts/users.
- `backend/models/BlogReview.js` — **Added / moderation:** admin review history/decision data.
- `backend/models/Notification.js` — **Added / publishing:** author notifications and read state.
- `backend/modules/blog/blog.controller.js` — **Added / publishing:** public, author, comment, upload, notification, and moderation HTTP handlers.
- `backend/modules/blog/blog.middleware.js` — **Added / security/upload:** author/admin rules and blog image handling.
- `backend/modules/blog/blog.routes.js` — **Added / publishing:** public reading, authenticated CRUD/comments, and admin moderation routes.
- `backend/modules/blog/blog.service.js` — **Added / publishing:** slug queries, ownership checks, CRUD, comments, moderation, and notification behavior.
- `backend/modules/blog/blog.validator.js` — **Added / validation:** create/edit/review field and state validation.
- `backend/controllers/caseStudies.controller.js` — **Added / content:** resolves structured case studies by slug and renders detail output.
- `backend/data/caseStudies.js` — **Added / content:** structured content for multiple case studies.
- `backend/routes/caseStudies.routes.js` — **Added / content:** public slug endpoint.
- `backend/views/caseStudyDetail.js` — **Added / rendering:** server-generated case-study HTML.

### Legacy Business Dashboard Domain Models

- `backend/models/User.js` — **Added / auth:** multi-method identity, role, account status, terms, profile, approvals, and safe serialization.
- `backend/models/Project.js`, `backend/models/ProjectAssignment.js`, `backend/models/Manager.js`, `backend/models/SiteVisit.js`, `backend/models/Activity.js`, `backend/models/TaskOverview.js` — **Added / project management:** projects, manager assignment, site work, activity feeds, and task summaries.
- `backend/models/Batch.js`, `backend/models/Operation.js`, `backend/models/InventoryItem.js`, `backend/models/Alert.js` — **Added / batch operations:** dashboard batches, daily operations, stock, and alerts.
- `backend/models/BirdHealthCase.js`, `backend/models/BirdHealthAlert.js`, `backend/models/BirdHealthRecord.js`, `backend/models/BirdHealthSnapshot.js`, `backend/models/VaccinationSchedule.js` — **Added / bird health:** cases, alerts, historical/report records, snapshots, and vaccination planning.
- `backend/models/FeedInventoryItem.js`, `backend/models/FeedWaterAlert.js`, `backend/models/FeedWaterBatch.js`, `backend/models/FeedWaterLog.js`, `backend/models/FeedWaterSnapshot.js`, `backend/models/WaterSystemStatus.js` — **Added / feed-water:** batch consumption, inventory, logs, alerts, water-system state, and summary snapshots.
- `backend/models/EnvironmentAlert.js`, `backend/models/EnvironmentParameter.js`, `backend/models/EnvironmentReading.js`, `backend/models/EnvironmentRecord.js`, `backend/models/EnvironmentSnapshot.js` — **Added / environment:** thresholds, sensor/manual readings, alerts, historical records, and dashboard snapshots.
- `backend/models/PerformanceBatch.js`, `backend/models/PerformanceDriver.js`, `backend/models/PerformanceRecommendation.js`, `backend/models/PerformanceSnapshot.js` — **Added / performance:** KPIs, trend drivers, recommendations, and snapshots.
- `backend/models/FarmerEarningClaim.js`, `backend/models/FarmSummary.js`, `backend/models/MonthlySnapshot.js` — **Added / finance:** farmer claims and summarized dashboard financial/operational data.

### Legacy Feature Modules and Compatibility Routes

- `backend/modules/batch/batch.controller.js`, `batch.routes.js`, `batch.service.js` — **Added / batch operations:** role-protected overview, batches, operations, inventory, farms, alerts, performance, and farmer CRUD.
- `backend/modules/birds-health/birds-health.controller.js`, `birds-health.routes.js`, `birds-health.service.js` — **Added / bird health:** cases/events, vaccination, alerts, records, downloads, dashboards, and farmer views.
- `backend/modules/feed-water/feed-water.controller.js`, `feed-water.routes.js`, `feed-water.service.js` — **Added / feed-water:** consumption logs, batch/inventory CRUD, water-system state, alerts, reports, and farmer endpoints.
- `backend/modules/environment/environment.controller.js`, `environment.routes.js`, `environment.service.js` — **Added / environment:** parameter/readings CRUD, alerts, reports, records, and farmer endpoints.
- `backend/modules/performance/performance.controller.js`, `performance.routes.js`, `performance.service.js` — **Added / performance:** dashboard, trends, batches, drivers, recommendations, and downloads.
- `backend/modules/finance/finance.controller.js`, `finance.routes.js`, `finance.service.js` — **Added / finance:** overview, forecast, batch revenue, history, savings, and farmer claim behavior.
- `backend/modules/projects/projects.controller.js`, `projects.routes.js`, `projects.service.js` — **Added / projects:** overview, managers, assignments, visits, and activities.
- `backend/routes/batchManagementRoutes.js`, `financialOverviewRoutes.js`, `projectManagerRoutes.js` — **Refactored / compatibility:** re-export the extracted feature routers.
- `backend/routes/project.routes.js` — **Added / projects:** authenticated project creation, listing, and completion.
- `backend/routes/index.js` — **Added / routing:** route aggregation compatibility.

### Canonical Shared Infrastructure

- `backend/src/middleware/tenantContext.js` — **Added / security:** resolves and validates tenant/farm/batch scope for canonical routes.
- `backend/src/shared/auth/roleAccess.js` — **Added / security:** reusable role normalization and access checks.
- `backend/src/shared/db/pagination.js` — **Added / data access:** common page/limit parsing and response metadata.
- `backend/src/shared/db/softDelete.plugin.js` — **Added / data integrity:** reusable deletion timestamp/actor behavior.
- `backend/src/shared/db/tenantEnvelope.plugin.js` — **Added / multi-tenancy:** standard ownership, provenance, schema version, timestamps, indexes, and soft deletion.
- `backend/src/shared/db/transactionHelper.js` — **Added / reliability:** transaction/session wrapper and fallback behavior.
- `backend/src/shared/finance/decimal.js` — **Added / finance:** safe Decimal128 conversion and serialization.

### Canonical Organizations, Farms, Facilities, and Assignments

- `backend/src/modules/organizations/{organizations.controller,organizations.model,organizations.policy,organizations.repository,organizations.routes,organizations.service,organizations.validator}.js` — **Added / organizations:** full lifecycle, legal/contact validation, dashboard summaries, authorization, tenancy, suspension, and soft deletion.
- `backend/src/modules/organization-memberships/{organization-memberships.controller,organization-memberships.model,organization-memberships.policy,organization-memberships.repository,organization-memberships.routes,organization-memberships.service,organization-memberships.validator}.js` — **Added / membership:** owner/admin/manager/member roles, invitations, active/suspended states, and uniqueness.
- `backend/src/modules/farms/{farms.controller,farms.model,farms.policy,farms.repository,farms.routes,farms.service,farms.validator}.js` — **Added / farms:** geospatial farm profile, poultry type, capacity/status, CRUD, tenant policies, pagination, and validation.
- `backend/src/modules/facilities/{facilities.controller,facilities.model,facilities.policy,facilities.repository,facilities.routes,facilities.service,facilities.validator}.js` — **Added / facilities:** typed farm structures/equipment, hierarchy, capacity, location, status, scoped CRUD, and unique codes.
- `backend/src/modules/farm-assignments/{farm-assignments.controller,farm-assignments.model,farm-assignments.policy,farm-assignments.repository,farm-assignments.routes,farm-assignments.service,farm-assignments.validator}.js` — **Added / staffing:** user-to-farm assignment, effective dates, status transitions, ownership rules, and duplicate-active-assignment prevention.

### Canonical Managers and Farm Projects

- `backend/src/modules/managers/manager-farm-assignments.model.js` — **Added / staffing:** canonical manager/farm assignment with one active mapping constraint.
- `backend/src/modules/managers/{managers.controller,managers.model,managers.policy,managers.repository,managers.routes,managers.service,managers.validator}.js` — **Added / staffing:** manager CRUD, status, farm allocation, access policies, and validation.
- `backend/src/modules/farm-projects/farm-work-updates.model.js` — **Added / projects:** dated notes and authors linked to farm/project work.
- `backend/src/modules/farm-projects/{farm-projects.controller,farm-projects.model,farm-projects.policy,farm-projects.repository,farm-projects.routes,farm-projects.service,farm-projects.validator}.js` — **Added / projects:** planned/in-progress/blocked/completed/cancelled work, priority, progress updates, tenant scoping, and validation.
- `backend/src/modules/farm-project-reviews/{farm-project-reviews.controller,farm-project-reviews.model,farm-project-reviews.repository,farm-project-reviews.routes,farm-project-reviews.service,farm-project-reviews.validator}.js` — **Added / reviews:** eligible farmer ratings/comments for completed projects, uniqueness, ownership, and update rules.

### Canonical Batches and Daily Records

- `backend/src/modules/bird-batches/batch-code.js` — **Added / batch integrity:** normalized/generated batch code handling.
- `backend/src/modules/bird-batches/{bird-batches.controller,bird-batches.model,bird-batches.policy,bird-batches.repository,bird-batches.routes,bird-batches.service,bird-batches.validator}.js` — **Added / batches:** facility-linked placement, breed/type/head count, lifecycle and harvest, uniqueness, tenant permissions, and validation.
- `backend/src/modules/flock-records/{flock-records.controller,flock-records.model,flock-records.policy,flock-records.repository,flock-records.routes,flock-records.service,flock-records.validator}.js` — **Added / daily operations:** mortality, culls, feed, water, weight, health, environment, source/status, submission, one-record-per-day integrity, and role rules.

### Canonical Finance and Farmer Business Flows

- `backend/src/modules/batch-sales/{batch-sales.controller,batch-sales.model,batch-sales.policy,batch-sales.repository,batch-sales.routes,batch-sales.service,batch-sales.validator}.js` — **Added / finance:** sale CRUD, revenue calculation, partial sales, batch locking/checks, and tenant/role scoping.
- `backend/src/modules/batch-expenses/{batch-expenses.controller,batch-expenses.model,batch-expenses.policy,batch-expenses.repository,batch-expenses.routes,batch-expenses.service,batch-expenses.validator}.js` — **Added / finance:** batch/shared-farm expense CRUD, categories, Decimal128 amounts, and access rules.
- `backend/src/modules/farmer-fees/{farmer-fees.controller,farmer-fees.model,farmer-fees.policy,farmer-fees.repository,farmer-fees.routes,farmer-fees.service,farmer-fees.validator}.js` — **Added / farmer finance:** fee creation/listing/detail/update/payment/cancellation, farmer summaries, and permissions.
- `backend/src/modules/compensation-claims/{compensation-claims.controller,compensation-claims.model,compensation-claims.policy,compensation-claims.repository,compensation-claims.routes,compensation-claims.service,compensation-claims.validator}.js` — **Added / farmer finance:** farmer-owned claims, summaries, pending mutation rules, admin/business review, and pending/approved/rejected/paid states.
- `backend/src/modules/financial-aggregations/financial-aggregations.repository.js` — **Added / analytics:** reads canonical sales, expenses, batches, and flock data.
- `backend/src/modules/financial-aggregations/financial-aggregations.routes.js` — **Added / analytics:** scoped overview/range/breakdown endpoints.
- `backend/src/modules/financial-aggregations/financial-aggregations.service.js` — **Added / analytics:** combines canonical records into dashboard financial/operational results.
- `backend/src/modules/financial-aggregations/financial-formulas.js` — **Added / analytics:** revenue, expense, profit, margin, mortality, livability, feed, weight, FCR, and bucket calculations.
- `backend/src/modules/financial-aggregations/financial-range.js` — **Added / analytics:** validated date windows and day/week/month granularity.
- `backend/data/financial-dashboard-demo.fixture.js` — **Added / demo data:** deterministic financial dashboard seed fixture.

### Admin Dashboard Backend

- `backend/src/modules/admin-dashboard/admin-dashboard.controller.js` — **Added / admin:** response handlers for overview, accounts, managers, and approvals.
- `backend/src/modules/admin-dashboard/admin-dashboard.policy.js` — **Added / security:** platform-admin authorization.
- `backend/src/modules/admin-dashboard/admin-dashboard.repository.js` — **Added / admin data:** cross-collection aggregation and paginated account/manager lookups.
- `backend/src/modules/admin-dashboard/admin-dashboard.routes.js` — **Added / admin:** overview, farmer, business, manager, and approval endpoints.
- `backend/src/modules/admin-dashboard/admin-dashboard.service.js` — **Added / admin rules:** lifecycle decisions, manager creation/update, approval processing, and overview composition.
- `backend/src/modules/admin-dashboard/admin-dashboard.validator.js` — **Added / validation:** admin filter, status, manager, and decision validation.

### Seed, Verification, and Migration Files

- `backend/seed/seedBatchManagement.js`, `seedBirdsHealth.js`, `seedEnvironment.js`, `seedFarmerEarnings.js`, `seedFeedWater.js`, `seedPerformance.js`, `seedProjectManager.js` — **Added / seed data:** coherent demo records for each operational dashboard.
- `backend/scripts/generate-test-jwt.js` — **Added / developer tooling:** creates a local token for authenticated API testing.
- `backend/scripts/initUsersCollection.js` — **Added / setup:** initializes user collection/index behavior.
- `backend/scripts/test-canonical-flow.js` — **Added / verification:** exercises the canonical API workflow.
- `backend/scripts/verifyBatchFinancialData.js`, `verifyBirdsHealth.js`, `verifyEnvironment.js`, `verifyFarmerBusinessFlows.js`, `verifyFeedWater.js`, `verifyPerformance.js` — **Added / verification:** checks seeded and calculated module data.
- `backend/src/migrations/000-seed-real-farms.js` — **Added / migration:** creates canonical farms from known data.
- `backend/src/migrations/001-backfill-batches.js` — **Added / migration:** maps legacy batches into canonical batch records.
- `backend/src/migrations/002-simplify-farm-assignments.js` — **Added / migration:** normalizes assignment structure.
- `backend/src/migrations/003-normalize-batch-codes.js` — **Added / migration:** cleans and deduplicates canonical batch codes.
- `backend/src/migrations/004-seed-completed-projects-demo.js` — **Added / demo migration:** creates completed projects for review/history scenarios.
- `backend/src/migrations/005-seed-farm-tenure-completion-demo.js` — **Added / demo migration:** creates assignment-tenure and completion scenarios.
- `backend/src/migrations/006-merge-staging-into-farmsenceai.js` — **Added / data migration:** safety-aware staging-to-primary collection merge.
- `backend/src/migrations/007-seed-financial-dashboard-demo.js`, `007-seed-upcoming-farmer-fees-demo.js` — **Added / demo migration:** financial dashboard and future-fee datasets.
- `backend/src/migrations/008-enforce-daily-record-day-index.js` — **Added / integrity migration:** deduplicates/normalizes dates and enforces one record per batch/day.
- `backend/src/migrations/lib/safety.js` — **Added / migration safety:** dry-run, commit, environment, connection, and backup safeguards.

### Backend Tests

- `backend/tests/admin-dashboard.test.js`, `canonical-management-routes.test.js` — **Added / tests:** admin overview, account/manager lifecycle, approvals, and canonical management endpoints.
- `backend/tests/auth-and-routes.test.js`, `auth-profile.test.js`, `canonical-authorization.test.js` — **Added / tests:** authentication, role guards, profile fields, and tenant/ownership authorization.
- `backend/tests/batch-financial-modules.test.js`, `financial-aggregations.test.js`, `financial-dashboard-demo-seed.test.js`, `farmer-fees.test.js`, `compensation-claims.test.js` — **Added / tests:** financial CRUD, formulas, aggregation, seed correctness, fees, and claims.
- `backend/tests/bird-batch-create.test.js`, `flock-records-extension.test.js` — **Added / tests:** batch invariants and extended daily-record behavior.
- `backend/tests/farm-directory.test.js`, `farms-validator.test.js`, `manager-performance.test.js` — **Added / tests:** farm/facility validation, directory data, assignments, and manager metrics.
- `backend/tests/farm-project-farmer-read.test.js`, `farm-project-percent.test.js`, `farm-project-reviews.test.js` — **Added / tests:** project visibility, progress calculations, and review eligibility/ownership.
- `backend/tests/migration-safety.test.js` — **Added / tests:** dry-run/commit and environment safety controls.
- `backend/tests/case-study-detail.test.js` — **Added / tests:** valid/invalid slugs and distinct rendered case-study content.
- `backend/tests/fixtures/batch-financial-verification.json` — **Added / fixture:** expected canonical financial verification values.

### Frontend Public Entry Points and Shared Assets

- `frontend/public/index.html` — **Moved and modified / home:** expanded marketing homepage with corrected structure, reusable layout, auth-aware navigation, mobile menu, and current asset paths.
- `frontend/public/coming-soon.html` — **Moved and modified:** simplified coming-soon shell using dedicated CSS/JS.
- `frontend/public/favicon.ico`, `robots.txt` — **Replaced placeholders:** populated deployment assets.
- `frontend/public/sitemap.xml` — **Moved and modified:** current public-page URLs.
- `frontend/public/assets/css/blogsliderOptimized.css` — **Moved unchanged:** optimized blog-slider styling.
- `frontend/public/assets/css/coming-soon.css`, `signal-split.css`, `style.css` — **Moved and modified:** public page styling, responsive rules, header/footer fixes, and homepage refinements.
- `frontend/public/assets/css/case-study-detail.css` — **Added:** server-rendered case-study article layout.
- `frontend/public/assets/css/contact-form-style.css` — **Moved and modified:** reusable contact/demo form styling.
- `frontend/public/assets/css/unique.css` — **Added:** isolated page-specific visual rules.
- `frontend/public/assets/js/auth-navbar.js` — **Added / auth UX:** renders sign-in/profile/dashboard navigation state.
- `frontend/public/assets/js/book-demo.js` — **Added / forms:** validates and submits demo booking data/uploads.
- `frontend/public/assets/js/case-study-detail.js` — **Added / case studies:** detail navigation/interaction behavior.
- `frontend/public/assets/js/coming-soon.js` — **Added:** coming-soon interactions separated from markup.
- `frontend/public/assets/js/contact-form.js` — **Added / forms:** API submission and user feedback.
- `frontend/public/assets/js/country-states-data.js` — **Added / forms:** country/state options.
- `frontend/public/assets/js/dashboard-route.js` — **Added / routing:** role-aware dashboard destination.
- `frontend/public/assets/js/layout_main.js`, `layout-loader.js` — **Added / refactor:** shared header/footer loading and initialization.
- `frontend/public/assets/js/main.js` — **Moved and modified:** homepage initialization and interactions.
- `frontend/public/assets/js/mobile-menu.js` — **Added / responsive:** shared mobile navigation behavior.
- `frontend/public/assets/js/page-transitions.js` — **Added / UX:** navigation transition behavior.
- `frontend/public/assets/js/signal-split.js` — **Moved unchanged:** signal animation/interaction.
- `frontend/public/assets/js/unique.js` — **Added:** isolated page-specific behavior.

### Frontend Images, Logos, Fonts, SVGs, and Videos

- `frontend/public/assets/images/anil-sharma-yfKDx1Xp6lI-unsplash(1).jpg`, `Real Tim visiblity.png` — **Moved unchanged:** original public photography/illustration.
- `frontend/public/assets/images/Test Images/cc1.png`, `cc2.png`, `farmer-examines-field-agronomist-farmer-examines-growth-wheat.jpg`, `farmer-standing-rice-field-with-tablet(1).jpg`, `img3.png`, `img4.png`, `img5.png`, `img6.png`, `pexels-arjun-mj-74910500-14944259.jpg`, `pexels-cottonbro-4911739.jpg`, `pexels-cottonbro-5473951.jpg`, `pexels-ekaterina-bolovtsova-6192337.jpg`, `pexels-pixabay-373543.jpg`, `pexels-stitch-20280066.jpg`, `pexels-yankrukov-5789138.jpg` — **Moved unchanged:** original test/marketing image library.
- `frontend/public/assets/images/case-studies/Image (2).png`, `images (1).jpg`, `images (2).jpg`, `images.jpg`, `Poultry-4.0-A-New-Era-in-Poultry-Farming-Through-Smart-Technologies-in-India.jpg` — **Added / case studies:** article-specific images.
- `frontend/public/assets/logos/ChickCoop™-Website-Logo®.svg`, `ChickCoop™-Website-Logo®-White.svg`, `DPIIT-header.png`, `footer-logo.png`, `startupbihar.png`, `Startup-India.png`, `Vikrant-Academy®-Color.svg` — **Moved unchanged:** existing organization/partner logos.
- `frontend/public/assets/logos/Farmsence_Black.svg`, `Farmsence_White.svg` — **Added / branding:** current FarmSence light/dark logo variants.
- `frontend/public/assets/fonts/Fugaz_One/FugazOne-Regular.ttf`, `OFL.txt` — **Added / typography:** bundled font and license.
- `frontend/public/assets/svg/livestock.svg`, `morbidity.svg` — **Added / dashboard visuals:** operational iconography.
- `frontend/public/assets/video/chickcoop_farmtech_v1 (1080p).mp4`, `chickcoop_farmtech_video_2_v1 (1080p).mp4`, `chickcoop_farmtech_video_2_v1 (2160p).mp4`, `ChickCoop_Zero_Waste.mp4.mp4`, `Untitled.mp4` — **Moved unchanged:** original marketing videos.

### Shared Marketing Layout and Content Pages

- `frontend/src/components/header.html`, `footer.html` — **Added/replaced placeholders:** populated reusable site chrome.
- `frontend/src/components/layout.js` — **Added / refactor:** shared layout loading and page integration.
- `frontend/src/pages/blogs.html`, `blog-detail.html` — **Moved and rewritten:** data-driven blog list and dynamic detail shell.
- `frontend/src/pages/create-blog.html`, `edit-blog.html` — **Added / publishing:** author create/edit interfaces.
- `frontend/src/pages/book-demo.html` — **Added / lead generation:** demo request interface.
- `frontend/src/pages/case-studies.html` — **Added / content:** case-study index.
- `frontend/src/pages/contact-sales.html` — **Moved and modified:** corrected split layout and connected form.
- `frontend/src/pages/cookies-policy.html`, `privacy-policy.html` — **Added/replaced placeholders:** populated legal pages.
- `frontend/src/pages/farm-intelligence.html` — **Added/replaced placeholder:** FarmSence product/intelligence content.
- `frontend/src/pages/mission.html`, `products.html`, `research.html`, `vieosection.html` — **Moved and modified:** shared layout integration, corrected paths, responsive behavior, and content cleanup.
- `frontend/src/pages/research-detail.html` — **Added / research:** dynamic article detail shell.
- `frontend/src/pages/sign-in.html` — **Added / authentication:** multi-method, role-aware sign-in UI.
- `frontend/src/pages/forms/contact-form.html` — **Moved and rewritten:** reusable API-backed form fragment.
- `frontend/src/pages/assets/images/farmer-standing-rice-field-with-tablet(1).jpg` — **Moved unchanged:** page-local hero/article image.
- `frontend/src/pages/assets/data/articles.js`, `research-articles.js` — **Added / content data:** structured blog and research article records.
- `frontend/src/pages/assets/css/blog-detail.css`, `blog-editor.css`, `blogs.css`, `case-studies.css`, `research.css`, `research-detail.css`, `sign-in.css`, `sign-in-inline.css` — **Added / page styling:** isolated responsive styles for new content/auth flows.
- `frontend/src/pages/assets/css/styleblog.css` — **Moved and modified:** expanded legacy blog styling.
- `frontend/src/pages/assets/css/vieosection.css` — **Added/refactored:** video page styles extracted from markup.
- `frontend/src/pages/assets/js/article-utils.js` — **Added / content:** shared article lookup/render helpers.
- `frontend/src/pages/assets/js/blog-detail.js`, `blog-detail-init.js`, `blogs.js`, `blogs-sidebar-height.js` — **Added / blog UX:** dynamic detail/list rendering, initialization, filters, and stable sidebar sizing.
- `frontend/src/pages/assets/js/create-blog.js`, `edit-blog.js` — **Added / publishing:** authenticated editor behavior, upload, validation, save, and update.
- `frontend/src/pages/assets/js/book-demo.js`, `country-states-data.js` — **Added / forms:** demo submission and location data.
- `frontend/src/pages/assets/js/case-studies.js` — **Added / content:** case-study listing/navigation.
- `frontend/src/pages/assets/js/research.js`, `research-detail.js`, `research-detail-init.js`, `research-sidebar-height.js` — **Added / research UX:** filter/sort/list/detail behavior and layout correction.
- `frontend/src/pages/assets/js/sign-in.js` — **Added / auth UX:** email/OAuth/role sign-in interaction and redirect handling.

### React Dashboard Core and Shared Shell

- `frontend/src/dashboard/index.html`, `index.js` — **Added / business entry:** business dashboard HTML bootstrap and shell loader.
- `frontend/src/dashboard/index-admin.html`, `index-admin.js` — **Added / admin entry:** admin role guard, shell, routes, and views.
- `frontend/src/dashboard/index-farmer.html`, `index-farmer.js` — **Added / farmer entry:** farmer role guard, shell, routes, and views.
- `frontend/src/dashboard/README.md` — **Added / documentation:** dashboard development notes.
- `frontend/src/dashboard/public/favicon.svg`, `icons.svg` — **Added / dashboard assets:** browser icon and shared icon sprite.
- `frontend/src/dashboard/shared/canonical-farm-operations.js` — **Added / canonical data:** read-only business access to v2 farms, batches, records, facilities, and related operations.
- `frontend/src/dashboard/shared/dashboard-auth.js` — **Added / security:** token/session lookup, role guard, and redirect behavior.
- `frontend/src/dashboard/shared/dashboard-shell.js` — **Added / refactor:** shared dashboard page lifecycle and layout behavior.
- `frontend/src/dashboard/shared/farmer-profile.js` — **Added / farmer UX:** profile loading/completion state.
- `frontend/src/dashboard/shared/farmer-record-hub.js` — **Added / farmer operations:** common daily-record form/data behavior.
- `frontend/src/dashboard/shared/sidebar.js` — **Added / refactor:** centralized sidebar generation and state.
- `frontend/src/dashboard/shared/terms.js` — **Added / compliance:** terms acceptance gate.
- `frontend/src/dashboard/src/App.jsx` — **Added / React routing:** registers the 22 business routes.
- `frontend/src/dashboard/src/App.css`, `index.css`, `styles/dashboard.css` — **Added / dashboard styling:** application, reset/base, responsive shell, tables, cards, forms, and visualization styling.
- `frontend/src/dashboard/src/main.jsx` — **Added / React bootstrap:** mounts the dashboard app.
- `frontend/src/dashboard/src/components/layout/Layout.jsx`, `Sidebar.jsx`, `TopNav.jsx`, `navConfig.js` — **Added / refactor:** reusable React layout and centralized navigation.
- `frontend/src/dashboard/src/helpers/helpers.js` — **Added / utilities:** shared display/data helpers.
- `frontend/src/dashboard/src/utils/iconUtils.jsx` — **Added / UI:** maps configured icon names to Lucide components.
- `frontend/src/dashboard/src/assets/hero.png`, `react.svg`, `vite.svg` — **Added / dashboard assets:** hero and framework assets.

### Business Dashboard Views

- `frontend/src/dashboard/src/views/Dashboard.js` — **Added / overview:** business KPIs, farms/projects/alerts, and dashboard summaries.
- `LiveFarmView.js` — **Added / monitoring:** live/near-live farm visibility interface.
- `OngoingProjects.js`, `CompletedProjects.js`, `ProjectManager.js` — **Added / projects:** active/completed work, manager assignment, site activity, and project detail.
- `DownloadReports.js` — **Added / reporting:** report selection/download UI.
- `Payments.js` — **Added / finance:** payment/fee presentation.
- `BatchManagement.js` — **Added / operations:** batch overview, inventory, operations, alerts, and create/list behavior.
- `BirdsHealth.js` — **Added / operations:** health KPIs, cases, vaccinations, alerts, and records.
- `FeedAndWater.js` — **Added / operations:** consumption, inventory, water systems, alerts, and reports.
- `Environment.js` — **Added / operations:** readings, parameter thresholds, alerts, charts, records, and report download.
- `Performance.js` — **Added / operations:** performance KPIs/trends, drivers, recommendations, and reports.
- `AIInsights.js` — **Added / intelligence:** recommendation/insight presentation.
- `FinancialOverview.js` — **Added / finance:** canonical totals, profit, expenses, ranges, and drill-down context.
- `ProfitForecast.js` — **Added / finance:** forecast visualization and scenario data.
- `BatchwiseRevenue.js` — **Added / finance:** per-batch revenue/profit breakdown.
- `HistoricalReports.js` — **Added / finance:** historical range/report view.
- `CostIntelligence.js` — **Added / finance:** expense composition and cost insight UI.
- `CoursesOverview.js`, `LearningInProgress.js`, `SOPsChecklists.js`, `MyCertificates.js` — **Added / knowledge center:** training catalog/progress, procedures, and credentials.
- `MyBlogs.js` — **Added / publishing:** authenticated author list/management view; loaded for farmer rather than read-only business use.

### Admin Dashboard Views

- `frontend/src/dashboard/src/views-admin/admin-api.js` — **Added / admin data:** shared authenticated admin API client and response helpers.
- `Overview.js` — **Added / admin:** platform KPIs and account/project summaries.
- `ManageBusinesses.js`, `ManageFarmers.js`, `ManageProjectManagers.js` — **Added / admin:** paginated account/manager detail, status, creation, editing, and assignment UI.
- `ApprovalsQueue.js` — **Added / admin:** pending entity decisions.
- `FarmOperations.js` — **Added / admin operations:** tenant-context farm/batch/record/facility views plus canonical sales/expense CRUD.
- `FinancialIntelligence.js` — **Added / admin finance:** tenant-aware aggregation, ledgers, filtering, pagination, source drill-down, and actor information.
- `PlatformRevenue.js` — **Added / admin finance:** platform-level revenue presentation.
- `BlogModeration.js` — **Added / admin publishing:** blog review queue and decisions.
- `AuditTrail.js` — **Added / governance:** audit-event presentation.
- `PlatformSettings.js` — **Added / administration:** settings UI.

### Farmer Dashboard Views

- `frontend/src/dashboard/src/views-farmer/Dashboard.js` — **Added / farmer overview:** assignment, batch, work, fee/earning, and operational summaries.
- `MyWorkToday.js` — **Added / farmer work:** due work and quick daily actions.
- `MyBatches.js` — **Added / farmer batches:** assigned batch list/detail and permitted CRUD.
- `DailyRecordEntry.js` — **Added / daily operations:** canonical mortality/feed/water/weight/health/environment entry and edit workflow.
- `BirdsHealth.js`, `FeedAndWater.js`, `Environment.js` — **Added / farmer operations:** farmer-scoped summaries, events/logs/readings, and permitted mutations.
- `MyEarnings.js` — **Added / farmer finance:** compensation claim summary and pending-claim CRUD.
- `MyFees.js` — **Added / farmer finance:** assigned fee list/status.
- `MyReviews.js` — **Added / farmer feedback:** eligible completed-project reviews and updates.
- `SOPsChecklists.js`, `MyCertificates.js` — **Added / knowledge center:** farmer procedures and credentials.

### Frontend Tests

- `frontend/tests/frontend.test.js`, `dashboard-role-guard.test.js` — **Added / tests:** public/dashboard structure, shared routing, and role access.
- `frontend/tests/admin-dashboard.test.js` — **Added / tests:** admin shell and view registration.
- `frontend/tests/admin-farm-operations-financial-crud.test.js` — **Added / tests:** sales/expense CRUD, partial sales, filters, pagination, actor identity, source deep links, and unsaved edits.
- `frontend/tests/admin-financial-intelligence-context.test.js` — **Added / tests:** tenant context propagation in financial views.
- `frontend/tests/business-dashboard-read-only.test.js` — **Added / security tests:** business pages do not mutate or load author-only features.
- `frontend/tests/business-farm-operations-data.test.js` — **Added / data tests:** canonical v2 reads and shared flock values.
- `frontend/tests/farmer-operational-dashboard.test.js`, `farmer-compensation-claims.test.js` — **Added / farmer tests:** daily workflow, operations, and claim behavior.
- `frontend/tests/batchwise-revenue.test.js`, `financial-overview.test.js`, `historical-reports.test.js`, `profit-forecast.test.js`, `financial-mock-retirement.test.js` — **Added / finance tests:** canonical data, calculations/presentation, range history, forecasting, and removal of obsolete mocks.
- `frontend/tests/farms-facilities.test.js` — **Added / farm tests:** farm/facility presentation and canonical linkage.

### Documentation and Reference Files

- `docs/MONGODB_MASTER_ARCHITECTURE.md` — **Added / architecture:** target multi-tenant MongoDB domain design.
- `docs/admin-financial-intelligence-plan.md`, `financial-data-plan.md` — **Added / planning:** admin finance and canonical data implementation plans.
- `docs/batch-financial-verification.md`, `financial-dashboard-demo-seed.md` — **Added / verification:** financial fixture/seed execution and expected results.
- `docs/dashboard-data-flow-analysis.md`, `manager-summary-source.md` — **Added / analysis:** dashboard source-of-truth and manager aggregation notes.
- `docs/role-model-reconfiguration-plan.md` — **Added / architecture:** role/account/tenant transition plan.
- `docs/PRODUCT_COMPLETENESS_REVIEW_2026-07-13.md`, `PRODUCTION_READINESS_AUDIT_2026-07-13.md` — **Added / audit:** product gap and production-readiness assessments.
- `docs/reference/PROJECT_AUDIT_REPORT.md` — **Added / audit:** retained detailed project review.
- `docs/privacy-policy.html`, `docs/terms.html` — **Added/replaced placeholders:** populated legal documents served by the backend.
- `Reference Code/dehaatFooter.css` — **Unchanged:** retained footer styling reference.
- `Reference Code/dehaatFooter.html` — **Modified:** retained reference markup with a minor one-line change.

## Appendix B — Excluded Noise

The following were deliberately not treated as internship source changes:

- `.git/` history and metadata.
- Any `node_modules/`.
- Lockfiles (`package-lock.json`, Yarn, or pnpm locks); dependency changes are documented from `package.json`.
- Build/distribution/cache/coverage directories.
- `backend/backups/` pre-merge database backups.
- `dump/` BSON/JSON MongoDB exports.
- `backend/uploads/` user-uploaded agreements, blogs, selfies, and shop images.
- `backend/logs/` and migration log output.
- Other generated runtime artifacts.
