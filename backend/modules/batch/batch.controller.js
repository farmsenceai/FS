const batchService = require('./batch.service');

function handleError(res, err, fallbackMessage) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  return res.status(500).json({ error: fallbackMessage, details: err.message });
}

async function getOverview(req, res) {
  try {
    res.json(await batchService.getOverview());
  } catch (err) {
    handleError(res, err, 'Failed to load overview');
  }
}

async function getBatches(req, res) {
  try {
    res.json(await batchService.getBatches(req.query));
  } catch (err) {
    handleError(res, err, 'Failed to load batches');
  }
}

async function createBatch(req, res) {
  try {
    res.status(201).json(await batchService.createBatch(req.body));
  } catch (err) {
    handleError(res, err, 'Failed to create batch');
  }
}

async function getOperations(req, res) {
  try {
    res.json(await batchService.getOperations(req.query.limit));
  } catch (err) {
    handleError(res, err, 'Failed to load operations');
  }
}

async function getAlerts(req, res) {
  try {
    res.json(await batchService.getAlerts(req.query.limit));
  } catch (err) {
    handleError(res, err, 'Failed to load alerts');
  }
}

async function getInventory(req, res) {
  try {
    res.json(await batchService.getInventory(req.query.limit));
  } catch (err) {
    handleError(res, err, 'Failed to load inventory');
  }
}

async function getFarms(req, res) {
  try {
    res.json(await batchService.getFarms(req.query.limit));
  } catch (err) {
    handleError(res, err, 'Failed to load farm summary');
  }
}

async function getPerformance(req, res) {
  try {
    res.json(await batchService.getPerformance());
  } catch (err) {
    handleError(res, err, 'Failed to load performance snapshot');
  }
}

async function getFarmerSummary(req, res) {
  try {
    res.json(await batchService.getFarmerSummary(req.user.userId));
  } catch (err) {
    handleError(res, err, 'Failed to load farmer batch summary');
  }
}

async function getFarmerBatches(req, res) {
  try {
    res.json(await batchService.getFarmerBatches(req.user.userId, req.query));
  } catch (err) {
    handleError(res, err, 'Failed to load farmer batches');
  }
}

async function createFarmerBatch(req, res) {
  try {
    res.status(201).json({ batch: await batchService.createFarmerBatch(req.user, req.body) });
  } catch (err) {
    handleError(res, err, 'Failed to create farmer batch');
  }
}

async function updateFarmerBatch(req, res) {
  try {
    res.json({ batch: await batchService.updateFarmerBatch(req.user, req.params.id, req.body) });
  } catch (err) {
    handleError(res, err, 'Failed to update farmer batch');
  }
}

async function deleteFarmerBatch(req, res) {
  try {
    res.json({ deleted: await batchService.deleteFarmerBatch(req.user.userId, req.params.id) });
  } catch (err) {
    handleError(res, err, 'Failed to delete farmer batch');
  }
}

module.exports = {
  createBatch,
  getAlerts,
  getBatches,
  getFarms,
  getInventory,
  getOperations,
  getOverview,
  getPerformance,
  getFarmerSummary,
  getFarmerBatches,
  createFarmerBatch,
  updateFarmerBatch,
  deleteFarmerBatch
};
