(function exposeCanonicalFarmOperations(global) {
  const API = '/api/v2';
  let cachedPromise;

  async function request(path) {
    const response = await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('fs_token') || ''}` }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || body.message || `Request failed (${response.status})`);
    return body;
  }

  const id = value => String(value?._id || value?.id || value || '');
  const list = body => body.data || body.records || body.batches || body.facilities || [];

  async function load({ refresh = false } = {}) {
    if (refresh || !cachedPromise) {
      cachedPromise = (async () => {
        const farms = list(await request('/farms?limit=1000'));
        const farmRows = await Promise.all(farms.map(async farm => {
          const farmId = id(farm);
          const [batchBody, facilityBody] = await Promise.all([
            request(`/farms/${farmId}/batches?limit=1000`),
            request(`/farms/${farmId}/facilities?limit=1000`)
          ]);
          const batches = list(batchBody).map(batch => ({ ...batch, farm, farmId }));
          const facilities = list(facilityBody).map(facility => ({ ...facility, farm, farmId }));
          const recordGroups = await Promise.all(batches.map(async batch => {
            const records = list(await request(`/farms/${farmId}/batches/${id(batch)}/records?limit=1000`));
            return records.map(record => ({ ...record, farm, farmId, batch, batchId: id(batch) }));
          }));
          return { farm, batches, facilities, records: recordGroups.flat() };
        }));
        return {
          farms,
          batches: farmRows.flatMap(row => row.batches),
          facilities: farmRows.flatMap(row => row.facilities),
          records: farmRows.flatMap(row => row.records)
        };
      })().catch(error => { cachedPromise = null; throw error; });
    }
    return cachedPromise;
  }

  global.FarmSenseCanonicalOperations = { load, request, id };
})(window);
