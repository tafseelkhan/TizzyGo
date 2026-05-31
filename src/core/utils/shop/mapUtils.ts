// src/utils/mapUtils.ts
import { Platform } from 'react-native';
import { Region } from 'react-native-maps';
import { VIEW_MAP_DEFAULTS, DEFAULT_LOCATION } from '../../../api/constants/mapConfig';

export interface MapRegion extends Region {}

/**
 * Format coordinate for display
 */
export const formatCoordinate = (
  value: number | null,
  precision: number = 6,
): string => {
  if (value === null || isNaN(value)) return 'N/A';
  return value.toFixed(precision);
};

/**
 * Check if coordinates are valid
 */
export const hasValidCoordinates = (
  latitude: number | null,
  longitude: number | null,
): boolean => {
  return (
    latitude !== null &&
    longitude !== null &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

/**
 * Get map region from coordinates
 */
export const getMapRegion = (
  latitude: number | null,
  longitude: number | null,
  latitudeDelta: number = VIEW_MAP_DEFAULTS.latitudeDelta,
  longitudeDelta: number = VIEW_MAP_DEFAULTS.longitudeDelta,
): MapRegion => {
  if (hasValidCoordinates(latitude, longitude)) {
    return {
      latitude: latitude!,
      longitude: longitude!,
      latitudeDelta,
      longitudeDelta,
    };
  }
  return {
    latitude: DEFAULT_LOCATION.latitude,
    longitude: DEFAULT_LOCATION.longitude,
    latitudeDelta: DEFAULT_LOCATION.latitudeDelta,
    longitudeDelta: DEFAULT_LOCATION.longitudeDelta,
  };
};

/**
 * Generate Google Maps URL for opening in external app
 */
export const getGoogleMapsUrl = (
  latitude: number,
  longitude: number,
  address: string,
): string => {
  const label = encodeURIComponent(address);
  const lat = latitude;
  const lng = longitude;

  return Platform.select({
    ios: `maps://?q=${label}&ll=${lat},${lng}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  }) as string;
};

/**
 * Get map theme for dark/light mode
 */
export const getMapTheme = (isDark: boolean): Array<any> => {
  if (!isDark) return [];

  return [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#263c3f' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#6b9a76' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#38414e' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#212a37' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9ca5b3' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#746855' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#1f2835' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#f3d19c' }],
    },
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [{ color: '#2f3948' }],
    },
    {
      featureType: 'transit.station',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#17263c' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#515c6d' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#17263c' }],
    },
  ];
};

/**
 * Get map loading text
 */
export const getMapLoadingText = (isDark: boolean): string => {
  return 'Loading map...';
};

/**
 * Get no coordinates text
 */
export const getNoCoordinatesTitle = (isDark: boolean): string => {
  return 'No location coordinates available';
};

/**
 * Get no coordinates subtext
 */
export const getNoCoordinatesSubtext = (isDark: boolean): string => {
  return 'Please select an address with valid coordinates';
};

/**
 * Get modal title
 */
export const getModalTitle = (isDark: boolean): string => {
  return 'Location on Map';
};

/**
 * Get marker title
 */
export const getMarkerTitle = (): string => {
  return 'Delivery Location';
};
