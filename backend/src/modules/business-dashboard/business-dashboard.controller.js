const service = require('./business-dashboard.service');
async function get(req, res) {
  try { return res.json(await service.getDashboard(req.user, req.query)); }
  catch (error) { if (!error.status) console.error('Business dashboard failed', error); return res.status(error.status || 500).json({ error: error.status ? error.message : 'Unable to load business dashboard' }); }
}
module.exports = { get };
