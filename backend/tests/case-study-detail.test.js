const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../app');

function request(path) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      http.get({ hostname: '127.0.0.1', port: server.address().port, path }, response => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', chunk => { body += chunk; });
        response.on('end', () => { server.close(); resolve({ status: response.statusCode, body }); });
      }).on('error', error => { server.close(); reject(error); });
    });
  });
}

test('public case-study slug renders dynamic sections and navigation', async () => {
  const response = await request('/case-studies/smarter-poultry-operations');
  assert.equal(response.status, 200);
  assert.match(response.body, /id="opportunity"/);
  assert.match(response.body, /data-section-id="solution"/);
  assert.match(response.body, /case-nav__progress/);
});

test('unknown case-study slug returns 404', async () => {
  const response = await request('/case-studies/not-a-real-study');
  assert.equal(response.status, 404);
  assert.match(response.body, /Case study not found/);
});

test('second case-study slug renders its distinct section structure', async () => {
  const response = await request('/case-studies/future-ready-poultry-systems');
  assert.equal(response.status, 200);
  assert.match(response.body, /Building future-ready poultry systems/);
  assert.match(response.body, /id="challenge"/);
  assert.match(response.body, /data-section-id="partnership"/);
});

test('all published case-study slugs render distinct article content', async () => {
  const cases = [
    ['/case-studies/predictive-analytics-for-healthier-flocks', 'Predictive analytics helps', 'next-step'],
    ['/case-studies/precision-farming-across-multiple-sites', 'Precision farming brings', 'design'],
    ['/case-studies/responsible-ai-for-food-production', 'Responsible AI is reshaping', 'governance']
  ];

  for (const [path, title, sectionId] of cases) {
    const response = await request(path);
    assert.equal(response.status, 200);
    assert.match(response.body, new RegExp(title));
    assert.match(response.body, new RegExp(`id="${sectionId}"`));
  }
});
