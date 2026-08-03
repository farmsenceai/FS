const ALLOWED_FIELDS = new Set(['rating', 'reviewText']);

class FarmProjectReviewValidationError extends Error {
  constructor(details) {
    super('Project review request validation failed');
    this.code = 'VALIDATION_ERROR';
    this.status = 400;
    this.details = details;
  }
}

function validate(payload, partial = false) {
  const value = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const fields = Object.keys(value);
  const errors = [];
  fields.filter(field => !ALLOWED_FIELDS.has(field)).forEach(field => errors.push(`${field} is not allowed`));
  if (partial && !fields.length) errors.push('At least one field must be provided');
  if ((!partial || Object.hasOwn(value, 'rating')) && (!Number.isInteger(value.rating) || value.rating < 1 || value.rating > 5)) {
    errors.push('rating must be an integer between 1 and 5');
  }
  if (value.reviewText !== undefined && typeof value.reviewText !== 'string') errors.push('reviewText must be a string');
  if (errors.length) throw new FarmProjectReviewValidationError(errors);

  const result = {};
  if (Object.hasOwn(value, 'rating')) result.rating = value.rating;
  if (Object.hasOwn(value, 'reviewText')) result.reviewText = value.reviewText.trim();
  return result;
}

module.exports = {
  FarmProjectReviewValidationError,
  validateCreate: payload => validate(payload),
  validateUpdate: payload => validate(payload, true)
};
