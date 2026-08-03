const SOFT_DELETE_QUERY_METHODS = ['find', 'findOne', 'findOneAndUpdate', 'countDocuments'];

/**
 * Excludes soft-deleted documents from supported query methods by default.
 * Call a query with `.setOptions({ withDeleted: true })` to opt out explicitly.
 */
function excludeSoftDeletedPlugin(schema) {
  schema.pre(SOFT_DELETE_QUERY_METHODS, function excludeSoftDeleted() {
    const withDeleted = this.getOptions().withDeleted === true;

    // withDeleted is an application-level option and must not reach the MongoDB driver.
    delete this.options.withDeleted;

    if (!withDeleted) {
      this.where({ deletedAt: null });
    }
  });
}

module.exports = excludeSoftDeletedPlugin;
