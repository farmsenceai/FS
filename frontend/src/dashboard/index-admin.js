/* Admin dashboard controller */

const PANELS = {
  EditProfile: viewEditProfile,
  Overview: viewOverview,
  ApprovalsQueue: viewApprovalsQueue,
  FarmOperations: viewFarmOperations,
  ManageFarmers: viewManageFarmers,
  ManageBusinesses: viewManageBusinesses,
  ManageProjectManagers: viewManageProjectManagers,
  PlatformRevenue: viewPlatformRevenue,
  AdminFinancialOverview: viewAdminFinancialOverview,
  AdminProfitForecast: viewAdminProfitForecast,
  AdminBatchwiseRevenue: viewAdminBatchwiseRevenue,
  AdminHistoricalReports: viewAdminHistoricalReports,
  AuditTrail: viewAuditTrail,
  PlatformSettings: viewPlatformSettings,
  BlogModeration: viewBlogModeration
};

window.FarmSenseDashboardShell.init({
  defaultPage: 'Overview',
  expectedRole: 'admin',
  panels: PANELS
});
