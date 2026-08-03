const service = require('./environment.service');

function handleError(res, error) { return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Environment request failed' }); }
async function send(res, operation, status = 200) { try { const data = await operation(); return res.status(status).json({ success: true, ...data }); } catch (error) { return handleError(res, error); } }

exports.getDashboard = (req, res) => send(res, () => service.getDashboard());
exports.getParameters = (req, res) => send(res, () => service.getParameters());
exports.updateParameter = (req, res) => send(res, async () => ({ parameter: await service.updateParameter(req.params.id, req.body) }));
exports.getReadings = (req, res) => send(res, () => service.getReadings(req.query));
exports.createReading = (req, res) => send(res, async () => ({ reading: await service.createReading(req.body) }), 201);
exports.updateReading = (req, res) => send(res, async () => ({ reading: await service.updateReading(req.params.id, req.body) }));
exports.deleteReading = (req, res) => send(res, async () => ({ deleted: await service.deleteReading(req.params.id) }));
exports.getAlerts = (req, res) => send(res, () => service.getAlerts(req.query));
exports.markAlertRead = (req, res) => send(res, async () => ({ alert: await service.markAlertRead(req.params.id) }));
exports.getRecords = (req, res) => send(res, () => service.getRecords(req.query));
exports.getFarmerSummary = (req, res) => send(res, () => service.getFarmerSummary(req.user.userId));
exports.getFarmerReadings = (req, res) => send(res, () => service.getFarmerReadings(req.user.userId, req.query));
exports.createFarmerReading = (req, res) => send(res, async () => ({ reading: await service.createFarmerReading(req.user, req.body) }), 201);
exports.updateFarmerReading = (req, res) => send(res, async () => ({ reading: await service.updateFarmerReading(req.user, req.params.id, req.body) }));
exports.deleteFarmerReading = (req, res) => send(res, async () => ({ deleted: await service.deleteFarmerReading(req.user.userId, req.params.id) }));

exports.downloadRecord = async (req, res) => {
  try {
    const record = await service.getRecord(req.params.id);
    const filename = `${record.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'environment-record'}.txt`;
    const content = ['FarmSence AI - Environmental Record', '=====================================', `Record: ${record.title}`, `Batch: ${record.batchId || 'All batches'}`, `Farm: ${record.farm || 'All farms'}`, `Recorded: ${new Date(record.recordedAt).toLocaleString('en-IN')}`, `Created by: ${record.createdBy}`, '', record.summary, ''].join('\n');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="${filename}"`); return res.send(content);
  } catch (error) { return handleError(res, error); }
};

exports.downloadReport = async (req, res) => {
  try {
    const { snapshot, readingCount, unreadAlerts } = await service.getDashboard();
    const content = ['FarmSence AI - Environment Summary', '===================================', `Report date: ${new Date(snapshot.updatedFor).toLocaleString('en-IN')}`, `Average temperature: ${snapshot.averageTemperatureC} °C`, `Average humidity: ${snapshot.averageHumidityPct}%`, `Air quality index: ${snapshot.airQualityIndex}`, `Average ammonia: ${snapshot.averageAmmoniaPpm} ppm`, `Average CO2: ${snapshot.averageCo2Ppm} ppm`, `Environment score: ${snapshot.environmentScore}/100`, `House readings: ${readingCount}`, `Unread alerts: ${unreadAlerts}`, ''].join('\n');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.setHeader('Content-Disposition', 'attachment; filename="environment-summary.txt"'); return res.send(content);
  } catch (error) { return handleError(res, error); }
};
