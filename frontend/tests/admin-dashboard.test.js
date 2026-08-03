const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { describe, it } = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

describe('admin dashboard integration', () => {
  it('loads the shared API client before every admin view', () => {
    const html = read('src/dashboard/index-admin.html');
    const apiIndex = html.indexOf('src/views-admin/admin-api.js');
    const overviewIndex = html.indexOf('src/views-admin/Overview.js');
    assert.ok(apiIndex > -1);
    assert.ok(apiIndex < overviewIndex);
  });

  it('sends the stored JWT to the same-origin admin API', async () => {
    const calls = [];
    const context = {
      URLSearchParams,
      Intl,
      clearTimeout,
      setTimeout,
      localStorage: { getItem: key => key === 'fs_token' ? 'admin-token' : null },
      fetch: async (url, options) => {
        calls.push({ url, options });
        return { ok: true, json: async () => ({ overview: { stats: {} } }) };
      },
      document: { querySelector: () => null },
      window: { location: { origin: 'http://localhost:5002' } }
    };
    Object.assign(context.window, {
      localStorage: context.localStorage,
      fetch: context.fetch,
      document: context.document,
      URLSearchParams
    });
    vm.createContext(context);
    vm.runInContext(read('src/dashboard/src/views-admin/admin-api.js'), context);

    await context.window.FarmSenseAdminApi.request('/overview');
    assert.equal(calls[0].url, 'http://localhost:5002/api/admin/overview');
    assert.equal(calls[0].options.headers.Authorization, 'Bearer admin-token');
  });

  it('uses live endpoints instead of the original dashboard sample records', () => {
    const overview = read('src/dashboard/src/views-admin/Overview.js');
    const farmers = read('src/dashboard/src/views-admin/ManageFarmers.js');
    const businesses = read('src/dashboard/src/views-admin/ManageBusinesses.js');
    const approvals = read('src/dashboard/src/views-admin/ApprovalsQueue.js');
    const projectManagers = read('src/dashboard/src/views-admin/ManageProjectManagers.js');

    assert.match(overview, /request\('\/overview'\)/);
    assert.match(farmers, /request\(`\/farmers\?/);
    assert.match(businesses, /request\(`\/businesses\?/);
    assert.match(approvals, /request\('\/approvals\?limit=100'\)/);
    assert.match(projectManagers, /request\(`\/project-managers\?/);
    assert.match(projectManagers, /Add Project Manager/);
    assert.match(projectManagers, /apm-feedback/);
    assert.doesNotMatch(farmers, /Ramesh Babu/);
    assert.doesNotMatch(businesses, /Krishna AgroTech Pvt Ltd/);
  });
});
