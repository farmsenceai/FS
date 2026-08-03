const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');
const organizationsV2Router = require('./src/modules/organizations/organizations.routes');
const organizationMembershipsV2Router = require('./src/modules/organization-memberships/organization-memberships.routes');
const farmsV2Router = require('./src/modules/farms/farms.routes');
const farmAssignmentsV2Router = require('./src/modules/farm-assignments/farm-assignments.routes');
const facilitiesV2Router = require('./src/modules/facilities/facilities.routes');
const birdBatchesV2Router = require('./src/modules/bird-batches/bird-batches.routes');
const flockRecordsV2Router = require('./src/modules/flock-records/flock-records.routes');
const managersV2Router = require('./src/modules/managers/managers.routes');
const farmProjectsV2Router = require('./src/modules/farm-projects/farm-projects.routes');
const farmProjectReviewsV2Router = require('./src/modules/farm-project-reviews/farm-project-reviews.routes');
const farmerFeesV2Router = require('./src/modules/farmer-fees/farmer-fees.routes');
const batchSalesV2Router = require('./src/modules/batch-sales/batch-sales.routes');
const batchExpensesV2Router = require('./src/modules/batch-expenses/batch-expenses.routes');
const financialAggregationsV2Router = require('./src/modules/financial-aggregations/financial-aggregations.routes');
const compensationClaimsV2Router = require('./src/modules/compensation-claims/compensation-claims.routes');

const app = express();
// Canonical v2 is the primary runtime API. Explicitly set false only for a
// controlled legacy rollback; an absent flag must not silently hide real data.
const ENABLE_CANONICAL_V2 = process.env.ENABLE_CANONICAL_V2 !== 'false';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Static file serving
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/public/assets')));
app.use('/src', express.static(path.join(__dirname, '../frontend/src')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));
app.use('/blog', express.static(path.join(__dirname, '../frontend/src/pages')));
app.use('/docs', express.static(path.join(__dirname, '../docs')));

// Public editorial pages (must remain above the SPA fallback; no auth required).
app.use('/case-studies', require('./routes/caseStudies.routes'));

// API Routes
app.use('/api/contact', require('./modules/contact/contact.routes'));
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/projects', require('./routes/project.routes'));
app.use('/api/demo', require('./routes/demo.routes'));
app.use('/api/farm-footage', require('./routes/farmFootage.routes'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/pm', require('./modules/projects/projects.routes'));
app.use('/api/batch', require('./modules/batch/batch.routes'));
app.use('/api/financial', require('./modules/finance/finance.routes'));
app.use('/api/birds-health', require('./modules/birds-health/birds-health.routes'));
app.use('/api/feed-water', require('./modules/feed-water/feed-water.routes'));
app.use('/api/environment', require('./modules/environment/environment.routes'));
app.use('/api/performance', require('./modules/performance/performance.routes'));
app.use('/api/blogs', require('./modules/blog/blog.routes'));
app.use('/api/admin', require('./src/modules/admin-dashboard/admin-dashboard.routes'));

if (ENABLE_CANONICAL_V2) {
  app.use('/api/v2', organizationsV2Router);
  app.use('/api/v2', organizationMembershipsV2Router);
  app.use('/api/v2', farmsV2Router);
  app.use('/api/v2', farmAssignmentsV2Router);
  app.use('/api/v2', facilitiesV2Router);
  app.use('/api/v2', birdBatchesV2Router);
  app.use('/api/v2', flockRecordsV2Router);
  app.use('/api/v2', managersV2Router);
  app.use('/api/v2', farmProjectsV2Router);
  app.use('/api/v2', farmProjectReviewsV2Router);
  app.use('/api/v2', farmerFeesV2Router);
  app.use('/api/v2', batchSalesV2Router);
  app.use('/api/v2', batchExpensesV2Router);
  app.use('/api/v2', financialAggregationsV2Router);
  app.use('/api/v2', compensationClaimsV2Router);
  app.use('/api/v2', require('./src/modules/business-dashboard/business-dashboard.routes'));
  console.log('Canonical v2 API mounted at /api/v2');
}

app.get('/blogs.html', (req, res) => {
  res.redirect('/blog/blogs.html');
});

app.get('/blog-detail.html', (req, res) => {
  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  res.redirect(`/blog/blog-detail.html${query}`);
});

app.get('/create-blog.html', (req, res) => {
  res.redirect('/blog/create-blog.html');
});

app.get('/edit-blog.html', (req, res) => {
  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  res.redirect(`/blog/edit-blog.html${query}`);
});

// Fallback - serve index.html for all unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

module.exports = app;
