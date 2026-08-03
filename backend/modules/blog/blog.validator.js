/**
 * Blog request validators
 *
 * Manual validation (no external dependency added — keeping in line
 * with the existing project's lean-dependency approach). Mirrors the
 * constraints already enforced at the schema level in Blog.js, so bad
 * requests get rejected early with a clear message instead of a raw
 * Mongoose ValidationError.
 */

const VALID_BLOCK_TYPES = ['paragraph', 'heading', 'image', 'quote', 'list'];

function validateContentBlock(block, index, { strict = true } = {}) {
  if (!block || typeof block !== 'object') {
    return `Block at index ${index} must be an object`;
  }
  if (!VALID_BLOCK_TYPES.includes(block.type)) {
    return `Block at index ${index} has invalid type "${block.type}"`;
  }

  if (!strict) {
    // Draft mode: just check shape, not that content is filled in yet.
    if (block.type === 'list' && block.listItems !== undefined && !Array.isArray(block.listItems)) {
      return `Block at index ${index} (list) listItems must be an array`;
    }
    if (block.type === 'heading' && block.headingLevel !== undefined) {
      if (typeof block.headingLevel !== 'number' || block.headingLevel < 1 || block.headingLevel > 6) {
        return `Block at index ${index} (heading) headingLevel must be a number between 1 and 6`;
      }
    }
    return null;
  }

  // Strict (submission) mode — as before.
  if (block.type === 'list') {
    if (!Array.isArray(block.listItems) || block.listItems.length === 0) {
      return `Block at index ${index} (list) requires a non-empty listItems array`;
    }
  } else if (block.type === 'image') {
    if (!block.value || typeof block.value !== 'string') {
      return `Block at index ${index} (image) requires a value (image URL)`;
    }
  } else {
    if (!block.value || typeof block.value !== 'string' || !block.value.trim()) {
      return `Block at index ${index} (${block.type}) requires non-empty text in value`;
    }
  }
  if (block.type === 'heading' && block.headingLevel !== undefined) {
    if (typeof block.headingLevel !== 'number' || block.headingLevel < 1 || block.headingLevel > 6) {
      return `Block at index ${index} (heading) headingLevel must be a number between 1 and 6`;
    }
  }
  return null;
}

/**
 * Validates the body for both "create" and "save as draft" requests.
 * Drafts are allowed an empty contentBlocks array (the user may still
 * be mid-edit); anything else (pending_review / published, i.e. admin
 * creating directly) requires at least one valid block and a cover image.
 */
function validateCreateBlog(req, res, next) {
  const { title, coverImage, contentBlocks, status, submitForReview } = req.body;
  const errors = [];

  const adminDirectPublish = req.user && req.user.role === 'admin';
  const isDraft = !adminDirectPublish && !(status === 'pending_review' || status === 'published' || submitForReview === true);

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('title is required and must be a non-empty string');
  }

  if (!coverImage || typeof coverImage !== 'string' || !coverImage.trim()) {
    errors.push('coverImage is required');
  }

  if (!isDraft) {
    if (!Array.isArray(contentBlocks) || contentBlocks.length === 0) {
      errors.push('contentBlocks must be a non-empty array');
    } else {
      contentBlocks.forEach((block, i) => {
        const err = validateContentBlock(block, i);
        if (err) errors.push(err);
      });
    }
  } else {
    if (contentBlocks !== undefined) {
      if (!Array.isArray(contentBlocks)) {
        errors.push('contentBlocks must be an array');
      } else {
        contentBlocks.forEach((block, i) => {
          const err = validateContentBlock(block, i, { strict: false });
          if (err) errors.push(err);
        });
      }
    }
  }

  if (errors.length) {
    return res.status(400).json({ msg: 'Validation failed', errors });
  }

  return next();
}

/**
 * Validates admin review-decision requests
 * (approve / reject / request changes).
 */
function validateReviewBlog(req, res, next) {
  const { action, comments } = req.body;
  const validActions = ['approved', 'rejected', 'changes_requested'];
  const errors = [];

  if (!validActions.includes(action)) {
    errors.push(`action must be one of: ${validActions.join(', ')}`);
  }

  if (action === 'changes_requested' && (!comments || !comments.trim())) {
    errors.push('comments are required when requesting changes');
  }

  if (errors.length) {
    return res.status(400).json({ msg: 'Validation failed', errors });
  }

  return next();
}

module.exports = {
  validateCreateBlog,
  validateReviewBlog
};
