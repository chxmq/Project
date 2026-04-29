// Real location service using OpenStreetMap APIs (free, no API key required).
//
// Overpass is a free public service maintained by volunteers; it's strict about
// rate limits. To stay within their fair-use policy and keep this app responsive
// we do all of the following:
//
//   1. In-memory LRU cache keyed by (lat:lng, type) with a 5-minute TTL —
//      most repeat hits never reach Overpass at all.
//   2. Try multiple Overpass endpoints in order; fall back to the next one
//      on 429 / 502 / 503 / 504 / network failure.
//   3. Exponential backoff with jitter between retries.
//   4. A descriptive User-Agent (Overpass blocks Node's default).

const OVERPASS_USER_AGENT =
  'Cura-backend/1.0 (+https://github.com/chxmq/cura; OpenStreetMap Overpass)';

// Public mirrors. Order matters — overpass-api.de gets the most traffic
// so the kumi/private mirrors usually have spare capacity.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
];

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map(); // key -> { expires, data }

const cacheGet = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
};

const cacheSet = (key, data) => {
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, data });
  // Cap cache size — drop oldest entry if we balloon past 200.
  if (cache.size > 200) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientStatus = (status) => status === 429 || status === 502 || status === 503 || status === 504;

/**
 * POST a query to Overpass with endpoint fallback + exponential backoff.
 * Throws only after all endpoints + retries have been exhausted.
 */
const overpassQuery = async (query, { maxAttemptsPerEndpoint = 2 } = {}) => {
  let lastError;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 1; attempt <= maxAttemptsPerEndpoint; attempt += 1) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': OVERPASS_USER_AGENT
          },
          body: `data=${encodeURIComponent(query)}`
        });

        if (response.ok) {
          return await response.json();
        }

        if (!isTransientStatus(response.status)) {
          // Non-retryable — bail this endpoint, try the next one.
          lastError = new Error(`Overpass ${endpoint} returned ${response.status}`);
          break;
        }

        // Transient — back off and retry on the same endpoint.
        const backoffMs = Math.min(8_000, 600 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 400);
        await sleep(backoffMs);
        lastError = new Error(`Overpass ${endpoint} returned ${response.status}`);
      } catch (err) {
        lastError = err;
        // Small backoff before either retrying same endpoint or moving on.
        await sleep(300 + Math.floor(Math.random() * 300));
      }
    }
  }

  throw new Error(`All Overpass endpoints failed: ${lastError?.message || 'unknown error'}`);
};

/**
 * Haversine distance in km.
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatDistance = (distanceKm) => {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m`;
  return `${distanceKm.toFixed(1)} km`;
};

const buildAddress = (tags) => {
  if (tags['addr:full']) return tags['addr:full'];
  const parts = [];
  if (tags['addr:street']) parts.push(tags['addr:street']);
  if (tags['addr:city']) parts.push(tags['addr:city']);
  if (tags['addr:state']) parts.push(tags['addr:state']);
  if (tags['addr:postcode']) parts.push(tags['addr:postcode']);
  return parts.join(', ') || 'Address not available';
};

const cacheKey = (kind, lat, lng) =>
  `${kind}:${lat.toFixed(3)}:${lng.toFixed(3)}`; // ~110m resolution — close enough

/**
 * Get nearby hospitals (and clinics) within `radius` meters of the user.
 */
export const getNearbyHospitals = async (userLat = 28.6139, userLng = 77.2090, limit = 10) => {
  const key = cacheKey('hospitals', userLat, userLng);
  const cached = cacheGet(key);
  if (cached) return cached.slice(0, limit);

  const radius = 5000;
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"~"hospital|clinic"](around:${radius},${userLat},${userLng});
      way["amenity"~"hospital|clinic"](around:${radius},${userLat},${userLng});
      relation["amenity"~"hospital|clinic"](around:${radius},${userLat},${userLng});
    );
    out center tags;
  `;

  let data;
  try {
    data = await overpassQuery(query);
  } catch (err) {
    console.error('Hospitals lookup failed:', err.message);
    throw new Error(
      'Map service is busy right now. Please try again in a minute (OpenStreetMap rate limit).'
    );
  }

  const results = [];
  for (const element of data.elements || []) {
    const lat = element.lat || element.center?.lat;
    const lon = element.lon || element.center?.lon;
    if (!lat || !lon) continue;

    const tags = element.tags || {};
    const distance = calculateDistance(userLat, userLng, lat, lon);

    const specialties = [];
    if (tags.healthcare) specialties.push(tags.healthcare);
    if (tags['healthcare:speciality']) specialties.push(...tags['healthcare:speciality'].split(';'));
    if (specialties.length === 0) specialties.push('General Medicine');

    results.push({
      id: element.id,
      name: tags.name || tags['name:en'] || 'Hospital',
      address: buildAddress(tags),
      phone: tags.phone || tags['contact:phone'] || 'Not available',
      distance: formatDistance(distance),
      distanceKm: distance,
      coordinates: { lat, lng: lon },
      specialties: specialties.slice(0, 3)
    });
  }

  results.sort((a, b) => a.distanceKm - b.distanceKm);
  const cleaned = results.map(({ distanceKm, ...rest }) => rest);
  cacheSet(key, cleaned);

  return cleaned.slice(0, limit);
};

/**
 * Get nearby pharmacies within `radius` meters of the user.
 */
export const getNearbyPharmacies = async (userLat = 28.6139, userLng = 77.2090, limit = 10) => {
  const key = cacheKey('pharmacies', userLat, userLng);
  const cached = cacheGet(key);
  if (cached) return cached.slice(0, limit);

  const radius = 5000;
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="pharmacy"](around:${radius},${userLat},${userLng});
      way["amenity"="pharmacy"](around:${radius},${userLat},${userLng});
      relation["amenity"="pharmacy"](around:${radius},${userLat},${userLng});
      node["shop"="pharmacy"](around:${radius},${userLat},${userLng});
      way["shop"="pharmacy"](around:${radius},${userLat},${userLng});
    );
    out center tags;
  `;

  let data;
  try {
    data = await overpassQuery(query);
  } catch (err) {
    console.error('Pharmacies lookup failed:', err.message);
    throw new Error(
      'Map service is busy right now. Please try again in a minute (OpenStreetMap rate limit).'
    );
  }

  const results = [];
  for (const element of data.elements || []) {
    const lat = element.lat || element.center?.lat;
    const lon = element.lon || element.center?.lon;
    if (!lat || !lon) continue;

    const tags = element.tags || {};
    const distance = calculateDistance(userLat, userLng, lat, lon);

    const openingHours = tags.opening_hours || '';
    const open24Hours =
      openingHours.toLowerCase().includes('24/7') ||
      openingHours.toLowerCase().includes('24 hours');

    results.push({
      id: element.id,
      name: tags.name || tags['name:en'] || 'Pharmacy',
      address: buildAddress(tags),
      phone: tags.phone || tags['contact:phone'] || 'Not available',
      distance: formatDistance(distance),
      distanceKm: distance,
      coordinates: { lat, lng: lon },
      open24Hours
    });
  }

  results.sort((a, b) => a.distanceKm - b.distanceKm);
  const cleaned = results.map(({ distanceKm, ...rest }) => rest);
  cacheSet(key, cleaned);

  return cleaned.slice(0, limit);
};

export default {
  getNearbyHospitals,
  getNearbyPharmacies
};
