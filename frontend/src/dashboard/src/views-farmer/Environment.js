window.metaEnvironment = { title: 'Environment', subtitle: 'Canonical environment and sensor records' };
function viewEnvironment(user) {
  return window.FarmerCanonicalRecordHub.render({ focus: 'environment', actionTitle: 'Log environment readings', actionLabel: 'Open Environment Entry' }, user);
}
