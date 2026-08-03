const service = require('./feed-water.service');

function handleError(res, error) {
  return res.status(error.status || 500).json({
    success: false,
    message: error.status ? error.message : 'Feed & Water request failed'
  });
}

async function send(res, operation, status = 200) {
  try {
    const data = await operation();
    return res.status(status).json({ success: true, ...data });
  } catch (error) {
    return handleError(res, error);
  }
}

exports.getDashboard = (req, res) => send(res, () => service.getDashboard());
exports.getBatches = (req, res) => send(res, () => service.getBatches(req.query));
exports.createBatch = (req, res) => send(res, async () => ({ batch: await service.createBatch(req.body) }), 201);
exports.updateBatch = (req, res) => send(res, async () => ({ batch: await service.updateBatch(req.params.id, req.body) }));
exports.deleteBatch = (req, res) => send(res, async () => ({ deleted: await service.deleteBatch(req.params.id) }));
exports.getInventory = (req, res) => send(res, () => service.getInventory());
exports.createInventory = (req, res) => send(res, async () => ({ item: await service.createInventory(req.body) }), 201);
exports.updateInventory = (req, res) => send(res, async () => ({ item: await service.updateInventory(req.params.id, req.body) }));
exports.deleteInventory = (req, res) => send(res, async () => ({ deleted: await service.deleteInventory(req.params.id) }));
exports.getWaterSystems = (req, res) => send(res, () => service.getWaterSystems());
exports.updateWaterSystem = (req, res) => send(res, async () => ({ system: await service.updateWaterSystem(req.params.id, req.body) }));
exports.getAlerts = (req, res) => send(res, () => service.getAlerts(req.query));
exports.markAlertRead = (req, res) => send(res, async () => ({ alert: await service.markAlertRead(req.params.id) }));
exports.getFarmerSummary = (req, res) => send(res, () => service.getFarmerSummary(req.user.userId));
exports.getFarmerLogs = (req, res) => send(res, () => service.getFarmerLogs(req.user.userId, req.query));
exports.createFarmerLog = (req, res) => send(res, async () => ({ log: await service.createFarmerLog(req.user, req.body) }), 201);
exports.updateFarmerLog = (req, res) => send(res, async () => ({ log: await service.updateFarmerLog(req.user, req.params.id, req.body) }));
exports.deleteFarmerLog = (req, res) => send(res, async () => ({ deleted: await service.deleteFarmerLog(req.user.userId, req.params.id) }));
exports.reportFarmerInventory = (req, res) => send(res, async () => ({ item: await service.reportFarmerInventory(req.user, req.body) }));

exports.downloadReport = async (req, res) => {
  try {
    const { snapshot, batchCount, unreadAlerts, inventorySummary } = await service.getDashboard();
    const content = [
      'FarmSence AI - Feed & Water Consumption Report',
      '================================================',
      `Report date: ${new Date(snapshot.updatedFor).toLocaleString('en-IN')}`,
      `Feed consumed today: ${snapshot.feedConsumedTodayKg.toLocaleString('en-IN')} kg`,
      `Water consumed today: ${snapshot.waterConsumedTodayLitres.toLocaleString('en-IN')} L`,
      `Average FCR: ${snapshot.averageFcr}`,
      `Feed efficiency: ${snapshot.averageFeedEfficiencyPct}%`,
      `Batch readings: ${batchCount}`,
      `Inventory stock: ${inventorySummary.totalStockKg.toLocaleString('en-IN')} kg`,
      `Unread alerts: ${unreadAlerts}`,
      ''
    ].join('\n');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="feed-water-report.txt"');
    return res.send(content);
  } catch (error) {
    return handleError(res, error);
  }
};
