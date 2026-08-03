const mongoose = require('mongoose');
const excludeSoftDeletedPlugin = require('../../shared/db/softDelete.plugin');

const { Schema } = mongoose;
const schema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'FarmProject', required: true },
  farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: true },
  farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
  reviewText: { type: String, trim: true },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true, collection: 'farm_project_reviews' });

schema.plugin(excludeSoftDeletedPlugin);
schema.index(
  { projectId: 1, farmerId: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
schema.index({ projectId: 1 });

module.exports = mongoose.models.FarmProjectReview || mongoose.model('FarmProjectReview', schema);
