const service = require('./birds-health.service');

function handleError(res, error) {
  return res.status(error.status || 500).json({
    success: false,
    message: error.status ? error.message : 'Birds Health request failed'
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

exports.getDashboard = (req, res) => send(res, async () => service.getDashboard());
exports.getCases = (req, res) => send(res, async () => service.getCases(req.query));
exports.createCase = (req, res) => send(res, async () => ({ healthCase: await service.createCase(req.body) }), 201);
exports.updateCase = (req, res) => send(res, async () => ({ healthCase: await service.updateCase(req.params.id, req.body) }));
exports.deleteCase = (req, res) => send(res, async () => ({ deleted: await service.deleteCase(req.params.id) }));
exports.getVaccinations = (req, res) => send(res, async () => service.getVaccinations(req.query));
exports.createVaccination = (req, res) => send(res, async () => ({ vaccination: await service.createVaccination(req.body) }), 201);
exports.updateVaccination = (req, res) => send(res, async () => ({ vaccination: await service.updateVaccination(req.params.id, req.body) }));
exports.getAlerts = (req, res) => send(res, async () => service.getAlerts(req.query));
exports.markAlertRead = (req, res) => send(res, async () => ({ alert: await service.markAlertRead(req.params.id) }));
exports.getRecords = (req, res) => send(res, async () => service.getRecords(req.query));
exports.getFarmerSummary = (req, res) => send(res, async () => service.getFarmerSummary(req.user.userId));
exports.getFarmerEvents = (req, res) => send(res, async () => service.getFarmerEvents(req.user.userId, req.query));
exports.createFarmerEvent = (req, res) => send(res, async () => ({ event: await service.createFarmerEvent(req.user, req.body) }), 201);
exports.updateFarmerEvent = (req, res) => send(res, async () => ({ event: await service.updateFarmerEvent(req.user, req.params.id, req.body) }));
exports.deleteFarmerEvent = (req, res) => send(res, async () => ({ deleted: await service.deleteFarmerEvent(req.user.userId, req.params.id) }));

exports.downloadRecord = async (req, res) => {
  try {
    const record = await service.getRecord(req.params.id);
    const filename = `${record.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'health-record'}.txt`;
    const content = [
      'FarmSence AI - Birds Health Record',
      '====================================',
      `Record: ${record.name}`,
      `Type: ${record.type}`,
      `Batch: ${record.batchId}`,
      `Farm: ${record.farm}`,
      `Recorded: ${new Date(record.recordedAt).toLocaleString('en-IN')}`,
      `Created by: ${record.createdBy}`,
      '',
      record.summary,
      ''
    ].join('\n');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(content);
  } catch (error) {
    return handleError(res, error);
  }
};
