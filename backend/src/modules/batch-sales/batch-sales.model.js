const mongoose = require('mongoose');
const tenantEnvelopePlugin = require('../../shared/db/tenantEnvelope.plugin');
const excludeSoftDeletedPlugin = require('../../shared/db/softDelete.plugin');

const { Schema } = mongoose;

const batchSaleSchema = new Schema({
  saleDate: { type: Date, required: true },
  quantitySold: { type: Number, required: true, min: 1 },
  avgWeightKg: { type: Schema.Types.Decimal128, required: true },
  pricePerKg: { type: Schema.Types.Decimal128, required: true },
  revenue: { type: Schema.Types.Decimal128, required: true },
  buyerName: { type: String, trim: true },
  notes: { type: String, trim: true }
});

batchSaleSchema.plugin(tenantEnvelopePlugin, { requireBusinessId: true, requireFarmId: true });
batchSaleSchema.plugin(excludeSoftDeletedPlugin);

batchSaleSchema.index({ businessId: 1, saleDate: -1 });
batchSaleSchema.index({ farmId: 1, saleDate: -1 });
batchSaleSchema.index({ batchId: 1, saleDate: -1 });

module.exports = mongoose.models.BatchSale || mongoose.model('BatchSale', batchSaleSchema, 'batch_sales');
