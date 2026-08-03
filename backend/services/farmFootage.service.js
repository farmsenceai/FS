const PIXABAY_ENDPOINT = 'https://pixabay.com/api/videos/';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let cache = null;

const localFallback = [
  ['demo-3', 'Brooder Area', '/assets/video/ChickCoop_Zero_Waste.mp4.mp4'],
  ['demo-1', 'Shed A', '/assets/video/chickcoop_farmtech_v1%20(1080p).mp4'],
  ['demo-2', 'Shed B', '/assets/video/chickcoop_farmtech_video_2_v1%20(1080p).mp4'],
].map(([id, name, playbackUrl]) => ({
  id, name, playbackUrl, posterUrl: '', duration: null,
  sourceName: 'FarmSence demo footage', sourceUrl: '',
}));

function normalizeHit(hit, index) {
  const rendition = hit?.videos?.medium || hit?.videos?.small || hit?.videos?.large;
  if (!rendition?.url) return null;
  return {
    id: String(hit.id),
    name: `Demo camera ${index + 1}`,
    playbackUrl: rendition.url,
    posterUrl: rendition.thumbnail || '',
    duration: Number.isFinite(hit.duration) ? hit.duration : null,
    sourceName: hit.user ? `${hit.user} on Pixabay` : 'Pixabay',
    sourceUrl: hit.pageURL || 'https://pixabay.com/videos/',
  };
}

function fallbackResponse(reason) {
  return {
    mode: 'demo', provider: 'local', cached: false, reason,
    attribution: 'FarmSence demo footage', cameras: localFallback,
  };
}

async function getFarmFootage({ apiKey = process.env.PIXABAY_API_KEY, fetchImpl = global.fetch, now = Date.now() } = {}) {
  if (cache && cache.expiresAt > now) return { ...cache.value, cached: true };
  if (!apiKey) return fallbackResponse('PIXABAY_API_KEY is not configured');

  const params = new URLSearchParams({
    key: apiKey,
    q: 'poultry farm chicken',
    video_type: 'film',
    category: 'animals',
    safesearch: 'true',
    order: 'popular',
    per_page: '12',
  });

  try {
    const response = await fetchImpl(`${PIXABAY_ENDPOINT}?${params}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Pixabay returned HTTP ${response.status}`);
    const payload = await response.json();
    const pixabayCameras = (payload.hits || []).map(normalizeHit).filter(Boolean);
    if (!pixabayCameras.length) throw new Error('Pixabay returned no playable poultry footage');

    // Keep the farm-location demo recordings stable and use Pixabay to fill
    // the remaining camera slots. Brooder Area is the default camera.
    const cameras = [...localFallback, ...pixabayCameras].slice(0, 5);

    const value = {
      mode: 'demo', provider: 'mixed', cached: false,
      attribution: 'FarmSence demo footage and videos provided by Pixabay', cameras,
    };
    cache = { expiresAt: now + CACHE_TTL_MS, value };
    return value;
  } catch (error) {
    return fallbackResponse(error.message);
  }
}

function clearFarmFootageCache() { cache = null; }

module.exports = { getFarmFootage, clearFarmFootageCache };
