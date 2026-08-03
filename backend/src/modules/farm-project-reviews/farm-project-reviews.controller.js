const service = require('./farm-project-reviews.service');

function sendError(res, error) {
  const status = error.status || (error.name === 'CastError' ? 400 : 500);
  if (status === 500) console.error('Farm project review request failed', error);
  return res.status(status).json({
    error: status === 500 ? 'Internal server error' : error.message,
    ...(error.details ? { details: error.details } : {})
  });
}
const action = handler => async (req, res) => {
  try { return await handler(req, res); } catch (error) { return sendError(res, error); }
};

const createReview = action(async (req, res) => res.status(201).json({
  review: await service.createReview(req.user, req.params.farmId, req.params.projectId, req.body)
}));
const listReviews = action(async (req, res) => res.json(
  await service.listReviews(req.user, req.params.farmId, req.params.projectId, req.query)
));
const updateReview = action(async (req, res) => res.json({
  review: await service.updateReview(req.user, req.params.farmId, req.params.projectId, req.params.reviewId, req.body)
}));
const deleteReview = action(async (req, res) => {
  await service.deleteReview(req.user, req.params.farmId, req.params.projectId, req.params.reviewId);
  return res.status(204).end();
});

module.exports = { createReview, listReviews, updateReview, deleteReview };
