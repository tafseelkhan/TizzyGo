// utils/cabs/common/polylineUtils.ts

export const decodePolyline = (
  encoded: string,
): Array<{ latitude: number; longitude: number }> => {
  if (!encoded || typeof encoded !== 'string' || encoded.length === 0) {
    console.log('⚠️ [Polyline] Empty or invalid polyline');
    return [];
  }

  try {
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;
    const coordinates = [];

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;

      // Decode latitude
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      // Decode longitude
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      coordinates.push({
        latitude: lat * 1e-5,
        longitude: lng * 1e-5,
      });
    }

    console.log(`✅ [Polyline] Decoded ${coordinates.length} points`);
    return coordinates;
  } catch (error) {
    console.error('❌ [Polyline] Decode failed:', error);
    return [];
  }
};

export const getPolylineCenter = (
  coordinates: Array<{ latitude: number; longitude: number }>,
): { latitude: number; longitude: number } | null => {
  if (!coordinates || coordinates.length === 0) return null;
  let latSum = 0;
  let lngSum = 0;
  for (const coord of coordinates) {
    latSum += coord.latitude;
    lngSum += coord.longitude;
  }
  return {
    latitude: latSum / coordinates.length,
    longitude: lngSum / coordinates.length,
  };
};

export const getPolylineBounds = (
  coordinates: Array<{ latitude: number; longitude: number }>,
): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} | null => {
  if (!coordinates || coordinates.length === 0) return null;
  let minLat = coordinates[0].latitude;
  let maxLat = coordinates[0].latitude;
  let minLng = coordinates[0].longitude;
  let maxLng = coordinates[0].longitude;
  for (const coord of coordinates) {
    if (coord.latitude < minLat) minLat = coord.latitude;
    if (coord.latitude > maxLat) maxLat = coord.latitude;
    if (coord.longitude < minLng) minLng = coord.longitude;
    if (coord.longitude > maxLng) maxLng = coord.longitude;
  }
  return { minLat, maxLat, minLng, maxLng };
};

export const isValidPolyline = (encoded: string): boolean => {
  if (!encoded || typeof encoded !== 'string' || encoded.length === 0)
    return false;
  return encoded.length > 10;
};
