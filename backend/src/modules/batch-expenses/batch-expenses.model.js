const mongoose = require('mongoose');
const tenantEnvelopePlugin = require('../../shared/db/tenantEnvelope.plugin');
const excludeSoftDeletedPlugin = require('../../shared/db/softDelete.plugin');

const { Schema } = mongoose;
const CATEGORIES = ['feed', 'chicks', 'labor', 'medicine_vaccines', 'utilities', 'transport', 'other'];

const batchExpenseSchema = new Schema({
  category: { type: String, enum: CATEGORIES, required: true },
  amount: { type: Schema.Types.Decimal128, required: true },
  expenseDate: { type: Date, required: true },
  description: { type: String, required: true, trim: true }
});

batchExpenseSchema.plugin(tenantEnvelopePlugin, { requireBusinessId: true, requireFarmId: true });
batchExpenseSchema.plugin(excludeSoftDeletedPlugin);

batchExpenseSchema.index({ businessId: 1, expenseDate: -1 });
batchExpenseSchema.index({ farmId: 1, expenseDate: -1 });
batchExpenseSchema.index({ batchId: 1, expenseDate: -1 });
batchExpenseSchema.index({ businessId: 1, category: 1, expenseDate: -1 });

module.exports = mongoose.models.BatchExpense || mongoose.model('BatchExpense', batchExpenseSchema, 'batch_expenses');
module.exports.CATEGORIES = CATEGORIES;
