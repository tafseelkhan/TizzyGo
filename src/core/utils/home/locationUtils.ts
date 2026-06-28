// src/utils/locationUtils.ts

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Format coordinates to string
export const formatCoordinates = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

// Parse coordinates from GeoJSON format
export const parseGeoJsonCoordinates = (
  coordinates: number[],
): { lat: number; lng: number } | null => {
  if (
    coordinates.length === 2 &&
    coordinates[0] !== 0 &&
    coordinates[1] !== 0
  ) {
    return { lat: coordinates[1], lng: coordinates[0] };
  }
  return null;
};

// Check if location changed significantly
export const hasLocationChangedSignificantly = (
  oldLat: number,
  oldLng: number,
  newLat: number,
  newLng: number,
  thresholdMeters: number = 50,
): boolean => {
  const distance = calculateDistance(oldLat, oldLng, newLat, newLng);
  return distance > thresholdMeters;
};
