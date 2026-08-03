const OrganizationMembership = require('../organization-memberships/organization-memberships.model');
const Organization = require('../organizations/organizations.model');
const Farm = require('../farms/farms.model');
const BirdBatch = require('../bird-batches/bird-batches.model');
const FlockRecord = require('../flock-records/flock-records.model');
const BatchSale = require('../batch-sales/batch-sales.model');
const BatchExpense = require('../batch-expenses/batch-expenses.model');
const FarmProject = require('../farm-projects/farm-projects.model');
const FarmerFee = require('../farmer-fees/farmer-fees.model');
const ManagerFarmAssignment = require('../managers/manager-farm-assignments.model');

async function resolveBusinessId(userId) {
  const membership = await OrganizationMembership.findOne({ userId, status: 'active', deletedAt: null })
    .select('businessId').lean().exec();
  return membership?.businessId || null;
}

async function loadDashboard(businessId, requestedFarmId) {
  const businessFilter = businessId ? { businessId } : {};
  const farmFilter = { ...businessFilter, deletedAt: null };
  const farms = await Farm.find(farmFilter).sort({ status: 1, name: 1 }).lean().exec();
  const selectedFarm = requestedFarmId
    ? farms.find(item => String(item._id) === String(requestedFarmId))
    : farms.find(item => item.status === 'active') || farms[0];
  if (requestedFarmId && !selectedFarm) return { forbiddenFarm: true, farms };

  const farmId = selectedFarm?._id;
  const [organization, batches, sales, expenses, projects, fees, managerAssignment] = await Promise.all([
    businessId ? Organization.findById(businessId).lean().exec() : null,
    BirdBatch.find({ ...businessFilter, ...(farmId ? { farmId } : {}), deletedAt: null }).sort({ placedAt: -1 }).lean().exec(),
    BatchSale.find({ ...businessFilter, deletedAt: null }).lean().exec(),
    BatchExpense.find({ ...businessFilter, deletedAt: null }).lean().exec(),
    farmId ? FarmProject.find({ farmId, deletedAt: null }).sort({ updatedAt: -1 }).lean().exec() : [],
    farmId ? FarmerFee.find({ farmId, status: 'pending', deletedAt: null }).sort({ dueDate: 1 }).lean().exec() : [],
    farmId ? ManagerFarmAssignment.findOne({ farmId, status: 'active', deletedAt: null }).populate('managerId', 'name title').lean().exec() : null,
  ]);

  const activeBatch = batches.find(item => item.status === 'active') || null;
  const latestRecord = activeBatch
    ? await FlockRecord.findOne({ ...businessFilter, farmId, batchId: activeBatch._id, deletedAt: null })
      .sort({ recordDate: -1, createdAt: -1 }).lean().exec()
    : null;

  return { organization, farms, selectedFarm, batches, activeBatch, latestRecord, sales, expenses, projects, fees, managerAssignment };
}

module.exports = { resolveBusinessId, loadDashboard };
