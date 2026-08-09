/* Farmer dashboard controller */

const PANELS = {
  EditProfile: viewEditProfile,
  Dashboard: viewDashboard,
  MyWorkToday: viewMyWorkToday,
  MyBatches: viewMyBatches,
  FeedAndWater: viewFeedAndWater,
  BirdsHealth: viewBirdsHealth,
  Environment: viewEnvironment,
  MyEarnings: viewMyEarnings,
  MyFees: viewMyFees,
  MyReviews: viewMyReviews,
  SOPsChecklists: viewSOPsChecklists,
  MyCertificates: viewMyCertificates,
  MyBlogs: viewMyBlogs
};

window.FarmSenseDashboardShell.init({
  defaultPage: 'Dashboard',
  expectedRole: 'farmer',
  beforeShowContent: (user, token) => window.FarmSenseFarmerProfile.ensureProfile(user, token),
  panels: PANELS
});

document.getElementById('export-current-view')?.addEventListener('click', () => window.FarmSenseDashboardExport.exportCurrentView());
