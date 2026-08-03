const service = require('./performance.service');
function handleError(res, error) { return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Performance request failed' }); }
async function send(res, operation, status = 200) { try { const data = await operation(); return res.status(status).json({ success: true, ...data }); } catch (error) { return handleError(res, error); } }

exports.getDashboard = (req, res) => send(res, () => service.getDashboard());
exports.getBatches = (req, res) => send(res, () => service.getBatches(req.query));
exports.getTrend = (req, res) => send(res, () => service.getTrend(req.query));
exports.createBatch = (req, res) => send(res, async () => ({ batch: await service.createBatch(req.body) }), 201);
exports.updateBatch = (req, res) => send(res, async () => ({ batch: await service.updateBatch(req.params.id, req.body) }));
exports.deleteBatch = (req, res) => send(res, async () => ({ deleted: await service.deleteBatch(req.params.id) }));
exports.getDrivers = (req, res) => send(res, () => service.getDrivers());
exports.getRecommendations = (req, res) => send(res, () => service.getRecommendations());
exports.updateRecommendation = (req, res) => send(res, async () => ({ recommendation: await service.updateRecommendation(req.params.id, req.body) }));

function batchReport(batch) {
  return ['FarmSence AI - Batch Performance Report', '=======================================', `Batch: ${batch.batchId}`, `Farm: ${batch.farm}`, `Birds: ${batch.birds.toLocaleString('en-IN')}`, `Completed: ${new Date(batch.completedAt).toLocaleString('en-IN')}`, `FCR: ${batch.fcr}`, `Average daily gain: ${batch.averageDailyGainG} g`, `Average weight: ${batch.averageWeightKg} kg`, `Mortality: ${batch.mortalityRatePct}%`, `Livability: ${batch.livabilityPct}%`, `Performance score: ${batch.performanceScore}/100`, `Status: ${batch.status}`, '', batch.notes || '', ''].join('\n');
}

exports.downloadBatchReport = async (req, res) => { try { const batch = await service.getBatch(req.params.id); res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="${batch.batchId}-performance.txt"`); return res.send(batchReport(batch)); } catch (error) { return handleError(res, error); } };
exports.downloadReport = async (req, res) => { try { const { snapshot, batchCount } = await service.getDashboard(); const content = ['FarmSence AI - Performance Summary', '==================================', `Report date: ${new Date(snapshot.updatedFor).toLocaleString('en-IN')}`, `Average FCR: ${snapshot.averageFcr}`, `Average weight: ${snapshot.averageWeightKg} kg`, `Average daily gain: ${snapshot.averageDailyGainG} g`, `Mortality: ${snapshot.mortalityRatePct}%`, `Livability: ${snapshot.livabilityPct}%`, `Performance score: ${snapshot.performanceScore}/100`, `Batches tracked: ${batchCount}`, ''].join('\n'); res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.setHeader('Content-Disposition', 'attachment; filename="performance-summary.txt"'); return res.send(content); } catch (error) { return handleError(res, error); } };
