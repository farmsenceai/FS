const service = require('./flock-records.service');

function errorStatus(error) {
  if (
    error?.code === 'VALIDATION_ERROR' ||
    error?.name === 'CastError' ||
    error?.name === 'ValidationError'
  ) return 400;
  if (error?.code === 'POLICY_DENIED') return 403;
  if (error?.code === 'NOT_FOUND') return 404;
  if (error?.code === 'CONFLICT' || error?.code === 11000) return 409;
  return 500;
}

function sendError(res, error) {
  const status = errorStatus(error);
  if (status === 500) console.error('Flock record request failed', error);
  const body = { error: status === 500 ? 'Internal server error' : error.message };
  if (error.details) body.details = error.details;
  return res.status(status).json(body);
}

async function submitDailyRecord(req, res) {
  try {
    const record = await service.submitDailyRecord(
      req.user,
      req.tenant.businessId,
      req.params.farmId,
      req.params.batchId,
      req.body
    );
    return res.status(201).json({ record });
  } catch (error) {
    return sendError(res, error);
  }
}

async function listBatchRecords(req, res) {
  try {
    const result = await service.listBatchRecords(
      req.user,
      req.tenant.businessId,
      req.params.farmId,
      req.params.batchId,
      req.query
    );
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
}

async function correctRecord(req, res) {
  try {
    const record = await service.correctRecord(
      req.user,
      req.tenant.businessId,
      req.params.farmId,
      req.params.batchId,
      req.params.recordId,
      req.body
    );
    return res.status(201).json({ record });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = { submitDailyRecord, listBatchRecords, correctRecord };
