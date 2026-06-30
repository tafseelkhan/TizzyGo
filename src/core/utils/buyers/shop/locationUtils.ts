// src/utils/locationUtils.ts
import { Region } from 'react-native-maps';
import { DEFAULT_LOCATION } from '../../../../api/constants/mapConfig';

export interface MapRegion extends Region {}

/**
 * Get default map region
 */
export const getDefaultRegion = (): MapRegion => {
  return { ...DEFAULT_LOCATION };
};

/**
 * Format coordinate for display
 */
export const formatCoordinate = (
  latitude: number,
  longitude: number,
  precision: number = 6,
): string => {
  return `📍 Lat: ${latitude.toFixed(precision)}  Lng: ${longitude.toFixed(
    precision,
  )}`;
};

/**
 * Check if coordinates are valid
 */
export const isValidCoordinates = (latitude: any, longitude: any): boolean => {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

/**
 * Create map region from coordinates
 */
export const createMapRegion = (
  latitude: number,
  longitude: number,
  latitudeDelta: number = 0.01,
  longitudeDelta: number = 0.01,
): MapRegion => {
  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

/**
 * Get address display text
 */
export const getAddressDisplayText = (
  address: string,
  maxLength: number = 100,
): string => {
  if (!address) return 'No address selected';
  if (address.length <= maxLength) return address;
  return address.substring(0, maxLength) + '...';
};

/**
 * Create location object from coordinates and address
 */
export const createLocationObject = (
  latitude: number,
  longitude: number,
  address: string,
  placeId?: string,
) => {
  return {
    latitude,
    longitude,
    address,
    placeId: placeId || '',
  };
};

/**
 * Get instruction text based on platform
 */
export const getInstructionText = (isDark: boolean): string => {
  return '📍 Tap on map to select location • Drag to navigate';
};

/**
 * Get map loading text
 */
export const getMapLoadingText = (isDark: boolean): string => {
  return 'Loading map...';
};

/**
 * Get no location selected text
 */
export const getNoLocationText = (isDark: boolean): string => {
  return 'Tap on the map to select location';
};
