// Real location service using OpenStreetMap APIs (free, no API key required)

/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

/**
 * Format distance for display
 */
const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};

/**
 * Get nearby hospitals using Overpass API (OpenStreetMap)
 */
export const getNearbyHospitals = async (userLat = 28.6139, userLng = 77.2090, limit = 10) => {
  try {
    // Overpass API query to find hospitals within 5km radius
    const radius = 5000; // 5km in meters
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](around:${radius},${userLat},${userLng});
        way["amenity"="hospital"](around:${radius},${userLat},${userLng});
        relation["amenity"="hospital"](around:${radius},${userLat},${userLng});
        node["amenity"="clinic"](around:${radius},${userLat},${userLng});
        way["amenity"="clinic"](around:${radius},${userLat},${userLng});
        relation["amenity"="clinic"](around:${radius},${userLat},${userLng});
      );
      out center meta;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    const hospitals = [];

    // Process results
    for (const element of data.elements || []) {
      const lat = element.lat || element.center?.lat;
      const lon = element.lon || element.center?.lon;
      
      if (!lat || !lon) continue;

      const distance = calculateDistance(userLat, userLng, lat, lon);
      
      // Get name and other details from tags
      const tags = element.tags || {};
      const name = tags.name || tags['name:en'] || 'Hospital';
      
      // Extract specialties from tags
      const specialties = [];
      if (tags.healthcare) specialties.push(tags.healthcare);
      if (tags['healthcare:speciality']) {
        specialties.push(...tags['healthcare:speciality'].split(';'));
      }
      if (specialties.length === 0) {
        specialties.push('General Medicine');
      }

      // Get address
      let address = '';
      if (tags['addr:full']) {
        address = tags['addr:full'];
      } else {
        const addrParts = [];
        if (tags['addr:street']) addrParts.push(tags['addr:street']);
        if (tags['addr:city']) addrParts.push(tags['addr:city']);
        if (tags['addr:state']) addrParts.push(tags['addr:state']);
        if (tags['addr:postcode']) addrParts.push(tags['addr:postcode']);
        address = addrParts.join(', ') || 'Address not available';
      }

      hospitals.push({
        id: element.id,
        name: name,
        address: address,
        phone: tags.phone || tags['contact:phone'] || 'Not available',
        distance: formatDistance(distance),
        coordinates: { lat, lng: lon },
        specialties: specialties.slice(0, 3) // Limit to 3 specialties
      });
    }

    // Sort by distance and limit results
    hospitals.sort((a, b) => {
      const distA = parseFloat(a.distance.replace(' km', '').replace('m', '') / 1000);
      const distB = parseFloat(b.distance.replace(' km', '').replace('m', '') / 1000);
      return distA - distB;
    });

    return hospitals.slice(0, limit);
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    // Fallback to empty array or return error
    throw new Error(`Failed to fetch nearby hospitals: ${error.message}`);
  }
};

/**
 * Get nearby pharmacies using Overpass API (OpenStreetMap)
 */
export const getNearbyPharmacies = async (userLat = 28.6139, userLng = 77.2090, limit = 10) => {
  try {
    // Overpass API query to find pharmacies within 5km radius
    const radius = 5000; // 5km in meters
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="pharmacy"](around:${radius},${userLat},${userLng});
        way["amenity"="pharmacy"](around:${radius},${userLat},${userLng});
        relation["amenity"="pharmacy"](around:${radius},${userLat},${userLng});
        node["shop"="pharmacy"](around:${radius},${userLat},${userLng});
        way["shop"="pharmacy"](around:${radius},${userLat},${userLng});
        relation["shop"="pharmacy"](around:${radius},${userLat},${userLng});
      );
      out center meta;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    const pharmacies = [];

    // Process results
    for (const element of data.elements || []) {
      const lat = element.lat || element.center?.lat;
      const lon = element.lon || element.center?.lon;
      
      if (!lat || !lon) continue;

      const distance = calculateDistance(userLat, userLng, lat, lon);
      
      // Get name and other details from tags
      const tags = element.tags || {};
      const name = tags.name || tags['name:en'] || 'Pharmacy';
      
      // Get address
      let address = '';
      if (tags['addr:full']) {
        address = tags['addr:full'];
      } else {
        const addrParts = [];
        if (tags['addr:street']) addrParts.push(tags['addr:street']);
        if (tags['addr:city']) addrParts.push(tags['addr:city']);
        if (tags['addr:state']) addrParts.push(tags['addr:state']);
        if (tags['addr:postcode']) addrParts.push(tags['addr:postcode']);
        address = addrParts.join(', ') || 'Address not available';
      }

      // Check if 24 hours (from opening_hours tag)
      const openingHours = tags.opening_hours || '';
      const open24Hours = openingHours.toLowerCase().includes('24/7') || 
                         openingHours.toLowerCase().includes('24 hours');

      pharmacies.push({
        id: element.id,
        name: name,
        address: address,
        phone: tags.phone || tags['contact:phone'] || 'Not available',
        distance: formatDistance(distance),
        coordinates: { lat, lng: lon },
        open24Hours: open24Hours
      });
    }

    // Sort by distance and limit results
    pharmacies.sort((a, b) => {
      const distA = parseFloat(a.distance.replace(' km', '').replace('m', '') / 1000);
      const distB = parseFloat(b.distance.replace(' km', '').replace('m', '') / 1000);
      return distA - distB;
    });

    return pharmacies.slice(0, limit);
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    throw new Error(`Failed to fetch nearby pharmacies: ${error.message}`);
  }
};

export default {
  getNearbyHospitals,
  getNearbyPharmacies
};
