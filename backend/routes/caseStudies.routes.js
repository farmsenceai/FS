const express = require('express');
const { getCaseStudyBySlug } = require('../controllers/caseStudies.controller');

const router = express.Router();
router.get('/:slug', getCaseStudyBySlug);

module.exports = router;
