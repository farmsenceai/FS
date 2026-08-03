const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { describe, it } = require('node:test');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function classList(initial = []) {
  const values = new Set(initial);
  return {
    add: (...names) => names.forEach(name => values.add(name)),
    remove: (...names) => names.forEach(name => values.delete(name)),
    contains: name => values.has(name),
    toggle: name => {
      if (values.has(name)) {
        values.delete(name);
        return false;
      }
      values.add(name);
      return true;
    }
  };
}

function createElement(id, classes = []) {
  const listeners = {};
  return {
    id,
    dataset: {},
    href: '',
    style: {},
    textContent: '',
    innerHTML: '',
    checked: false,
    disabled: false,
    classList: classList(classes),
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
    click() {
      const event = { preventDefault() {}, stopPropagation() {} };
      if (this.onclick) this.onclick(event);
      if (listeners.click) listeners.click(event);
    },
    querySelector() {
      return null;
    },
    onclick: null,
    onchange: null
  };
}

function createBrowserContext({ role = 'business', token = 'test-token' } = {}) {
  const storage = new Map(token ? [['fs_token', token]] : []);
  const calls = [];
  const opened = [];
  const elements = {};

  [
    'navAccount',
    'accountLink',
    'accountDropdown',
    'userName',
    'navAccountLabel',
    'navLogout',
    'dashboardOption',
    'navLoginBtn',
    'navDemoBtn',
    'dashboard-content',
    'terms-modal',
    'terms-checkbox',
    'modal-confirm',
    'panel-title',
    'panel-subtitle',
    'panel-body',
    'avatar-email',
    'db-sidebar',
    'sidebar-toggle',
    'user-avatar-btn',
    'avatar-dropdown',
    'sign-out'
  ].forEach(id => {
    elements[id] = createElement(id, id === 'terms-modal' || id === 'avatar-dropdown' ? ['db-hidden'] : []);
  });

  elements['dashboard-content'].classList = classList(['db-content-hidden']);

  const sidebarLink = createElement('sidebar-link', ['db-sidebar-link']);
  sidebarLink.dataset.page = role === 'admin' ? 'Overview' : 'Dashboard';

  const context = {
    console,
    URLSearchParams,
    alert: message => {
      context.alertMessage = message;
    },
    localStorage: {
      getItem: key => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key)
    },
    fetch: async (url, options = {}) => {
      calls.push({ url, authorization: options.headers?.Authorization || null, method: options.method || 'GET' });
      return {
        ok: true,
        json: async () => ({
          success: true,
          user: {
            email: `${role}@example.test`,
            role,
            name: `${role} user`,
            agreedToTerms: true
          }
        })
      };
    },
    document: {
      title: 'Test',
      getElementById: id => elements[id] || null,
      querySelector: selector => selector === '.db-user-name' ? createElement('name') : null,
      querySelectorAll: selector => selector === '.db-sidebar-link' ? [sidebarLink] : [],
      addEventListener() {},
      body: { classList: classList(), style: {} }
    },
    window: {
      location: {
        href: '/index.html',
        origin: 'http://localhost:5000',
        search: '',
        pathname: '/src/dashboard/index.html'
      },
      history: { replaceState() {} },
      open: (url, target) => opened.push({ url, target }),
      addEventListener() {}
    }
  };

  context.window.window = context.window;
  context.window.document = context.document;
  context.window.localStorage = context.localStorage;
  context.window.fetch = context.fetch;
  context.window.alert = context.alert;
  context.window.URLSearchParams = URLSearchParams;
  Object.assign(context, context.window);

  return { calls, context, elements, opened, sidebarLink, storage };
}

function runScript(context, relativePath) {
  vm.runInContext(read(relativePath), context, { filename: relativePath });
}

describe('frontend authentication behavior', () => {
  it('sign-in page loads the shared dashboard route helper', () => {
    const html = read('src/pages/sign-in.html');
    const script = read('src/pages/assets/js/sign-in.js');
    assert.match(html, /\/assets\/js\/dashboard-route\.js/);
    assert.match(html, /assets\/js\/sign-in\.js/);
    assert.match(script, /FarmSenseDashboardRoute\.openDashboardForAuthenticatedUser/);
  });

  it('dashboard routing uses /api/auth/me and maps every role', async () => {
    for (const [role, expected] of [
      ['business', '/src/dashboard/index.html'],
      ['farmer', '/src/dashboard/index-farmer.html'],
      ['admin', '/src/dashboard/index-admin.html']
    ]) {
      const harness = createBrowserContext({ role });
      vm.createContext(harness.context);
      runScript(harness.context, 'public/assets/js/dashboard-route.js');

      await harness.context.window.FarmSenseDashboardRoute.openDashboardForAuthenticatedUser({
        openInNewTab: true,
        token: 'token'
      });

      assert.deepEqual(harness.opened, [{ url: expected, target: '_blank' }]);
      assert.equal(harness.calls[0].url, '/api/auth/me');
      assert.equal(harness.calls[0].authorization, 'Bearer token');
    }
  });

  it('navbar displays authenticated user state and logs out', async () => {
    const harness = createBrowserContext({ role: 'business' });
    vm.createContext(harness.context);
    runScript(harness.context, 'public/assets/js/dashboard-route.js');
    runScript(harness.context, 'public/assets/js/auth-navbar.js');

    harness.context.window.initAuthNavbar();
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(harness.elements.navAccount.style.display, 'flex');
    assert.equal(harness.elements.userName.textContent, 'business user');

    harness.elements.navLogout.click();
    assert.equal(harness.storage.get('fs_token'), undefined);
    assert.equal(harness.context.window.location.href, '/index.html');
  });

  it('dashboard shell redirects protected dashboards without a token', async () => {
    const harness = createBrowserContext({ role: 'business', token: null });
    vm.createContext(harness.context);
    runScript(harness.context, 'src/dashboard/shared/dashboard-auth.js');
    runScript(harness.context, 'src/dashboard/shared/sidebar.js');
    runScript(harness.context, 'src/dashboard/shared/terms.js');
    runScript(harness.context, 'src/dashboard/shared/dashboard-shell.js');

    harness.context.viewDashboard = () => '<section>dashboard</section>';
    harness.context.window.FarmSenseDashboardShell.init({
      defaultPage: 'Dashboard',
      panels: { Dashboard: harness.context.viewDashboard }
    });

    assert.equal(harness.context.window.location.href, '../pages/sign-in.html');
  });

  it('dashboard shell boots and logout clears protected dashboard auth', async () => {
    const harness = createBrowserContext({ role: 'admin' });
    vm.createContext(harness.context);
    harness.context.viewOverview = user => `<section>${user.role}</section>`;

    runScript(harness.context, 'src/dashboard/shared/dashboard-auth.js');
    runScript(harness.context, 'src/dashboard/shared/sidebar.js');
    runScript(harness.context, 'src/dashboard/shared/terms.js');
    runScript(harness.context, 'src/dashboard/shared/dashboard-shell.js');

    harness.context.window.FarmSenseDashboardShell.init({
      defaultPage: 'Overview',
      panels: { Overview: harness.context.viewOverview }
    });
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(harness.elements['panel-body'].innerHTML, '<section>admin</section>');
    assert.equal(harness.calls[0].url, 'http://localhost:5000/api/auth/me');

    harness.elements['sign-out'].click();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(harness.storage.get('fs_token'), undefined);
    assert.equal(harness.context.window.location.href, '../pages/sign-in.html');
  });
});
