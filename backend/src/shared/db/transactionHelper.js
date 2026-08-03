async function withTransaction(mongooseConnection, fn) {
  const session = await mongooseConnection.startSession();

  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

module.exports = withTransaction;
