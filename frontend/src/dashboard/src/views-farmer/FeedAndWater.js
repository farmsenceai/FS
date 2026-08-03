window.metaFeedAndWater = { title: 'Feed & Water', subtitle: 'Canonical feed and water daily records' };
function viewFeedAndWater(user) {
  return window.FarmerCanonicalRecordHub.render({ focus: 'feed', actionTitle: 'Log today’s feed & water', actionLabel: 'Open Feed & Water Entry' }, user);
}
