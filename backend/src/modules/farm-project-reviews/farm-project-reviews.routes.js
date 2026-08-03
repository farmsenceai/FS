const express = require('express');
const auth = require('../../../modules/auth/auth.middleware');
const controller = require('./farm-project-reviews.controller');

const router = express.Router();
router.post('/farms/:farmId/projects/:projectId/reviews', auth, controller.createReview);
router.get('/farms/:farmId/projects/:projectId/reviews', auth, controller.listReviews);
router.patch('/farms/:farmId/projects/:projectId/reviews/:reviewId', auth, controller.updateReview);
router.delete('/farms/:farmId/projects/:projectId/reviews/:reviewId', auth, controller.deleteReview);

module.exports = router;
