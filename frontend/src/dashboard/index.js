/* Business dashboard controller */

const PANELS = {
  EditProfile: viewEditProfile,
  Dashboard: viewDashboard,
  LiveFarmView: viewLiveFarmView,
  OngoingProjects: viewOngoingProjects,
  CompletedProjects: viewCompletedProjects,
  ProjectManager: viewProjectManager,
  DownloadReports: viewDownloadReports,
  Payments: viewPayments,
  FarmsFacilities: viewFarmsFacilities,
  BatchManagement: viewBatchManagement,
  BirdsHealth: viewBirdsHealth,
  FeedAndWater: viewFeedAndWater,
  Environment: viewEnvironment,
  Performance: viewPerformance,
  AIInsights: viewAIInsights,
  FinancialOverview: viewFinancialOverview,
  ProfitForecast: viewProfitForecast,
  BatchwiseRevenue: viewBatchwiseRevenue,
  HistoricalReports: viewHistoricalReports,
  CostIntelligence: viewCostIntelligence,
  CoursesOverview: viewCoursesOverview,
  LearningInProgress: viewLearningInProgress,
  SOPsChecklists: viewSOPsChecklists,
  MyCertificates: viewMyCertificates
};

window.FarmSenseDashboardShell.init({
  defaultPage: 'Dashboard',
  expectedRole: 'business',
  panels: PANELS
});
