const assert = require('node:assert/strict');
const { beforeEach, describe, it } = require('node:test');
const { getFarmFootage, clearFarmFootageCache } = require('../services/farmFootage.service');

beforeEach(clearFarmFootageCache);

describe('farm footage service', () => {
  it('uses local recordings when the Pixabay key is absent', async () => {
    const result = await getFarmFootage({ apiKey: '' });
    assert.equal(result.provider, 'local');
    assert.equal(result.mode, 'demo');
    assert.ok(result.cameras.length >= 3);
  });

  it('normalizes and caches Pixabay video results', async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return {
        ok: true,
        json: async () => ({ hits: [{
          id: 42, duration: 12, pageURL: 'https://pixabay.com/videos/id-42/', user: 'Creator',
          videos: { medium: { url: 'https://cdn.example/video.mp4', thumbnail: 'https://cdn.example/poster.jpg' } },
        }] }),
      };
    };
    const first = await getFarmFootage({ apiKey: 'test-key', fetchImpl, now: 1000 });
    const second = await getFarmFootage({ apiKey: 'test-key', fetchImpl, now: 2000 });
    assert.equal(first.provider, 'mixed');
    assert.equal(first.cameras[0].name, 'Brooder Area');
    assert.equal(first.cameras[0].playbackUrl, '/assets/video/ChickCoop_Zero_Waste.mp4.mp4');
    assert.equal(first.cameras[3].sourceName, 'Creator on Pixabay');
    assert.equal(second.cached, true);
    assert.equal(calls, 1);
  });

  it('falls back safely when Pixabay is unavailable', async () => {
    const result = await getFarmFootage({
      apiKey: 'test-key',
      fetchImpl: async () => ({ ok: false, status: 429 }),
    });
    assert.equal(result.provider, 'local');
    assert.match(result.reason, /429/);
  });
});
