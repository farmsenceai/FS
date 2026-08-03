/**
 * Applies conventional page pagination to a Mongoose query.
 *
 * This intentionally uses skip/limit during the initial infrastructure phase.
 * Large/high-volume collections should move to stable cursor-based pagination
 * (for example, createdAt + _id) before production-scale rollout.
 */
async function paginate(query, { page = 1, limit = 20, sort = '-createdAt' } = {}) {
  const normalizedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const normalizedLimit = Math.max(1, Number.parseInt(limit, 10) || 20);
  const filter = query.getFilter();

  const [data, total] = await Promise.all([
    query
      .sort(sort)
      .skip((normalizedPage - 1) * normalizedLimit)
      .limit(normalizedLimit)
      .exec(),
    query.model.countDocuments(filter).exec()
  ]);

  return {
    data,
    meta: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages: Math.ceil(total / normalizedLimit)
    }
  };
}

module.exports = paginate;
