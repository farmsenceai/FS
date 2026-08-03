window.metaBirdsHealth = { title: 'Birds Health', subtitle: 'Canonical mortality and cull records' };
function viewBirdsHealth(user) {
  return window.FarmerCanonicalRecordHub.render({ focus: 'health', actionTitle: 'Log bird health & mortality', actionLabel: 'Open Health Entry' }, user);
}
