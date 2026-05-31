// src/api/googleMapsApi.ts
import { GOOGLE_API_KEY, MAPS_BASE_URL } from '../constants/mapConfig';

export interface GeocodeResponse {
  status: string;
  results: Array<{
    formatted_address: string;
    place_id: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
}

export interface ReverseGeocodeParams {
  latitude: number;
  longitude: number;
  language?: string;
}

/**
 * Reverse geocode - Convert coordinates to address
 */
export const reverseGeocodeAPI = async (
  latitude: number,
  longitude: number,
  language: string = 'en'
): Promise<GeocodeResponse> => {
  const url = `${MAPS_BASE_URL}/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}&language=${language}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Geocoding failed: ${data.status}`);
  }
  
  return data;
};

/**
 * Forward geocode - Convert address to coordinates
 */
export const forwardGeocodeAPI = async (
  address: string,
  language: string = 'en'
): Promise<GeocodeResponse> => {
  const encodedAddress = encodeURIComponent(address);
  const url = `${MAPS_BASE_URL}/geocode/json?address=${encodedAddress}&key=${GOOGLE_API_KEY}&language=${language}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Forward geocoding failed: ${data.status}`);
  }
  
  return data;
};

/**
 * Get place details by place ID
 */
export const getPlaceDetailsAPI = async (
  placeId: string,
  fields: string[] = ['formatted_address', 'geometry', 'place_id']
): Promise<any> => {
  const url = `${MAPS_BASE_URL}/place/details/json?place_id=${placeId}&fields=${fields.join(',')}&key=${GOOGLE_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Place details failed: ${data.status}`);
  }
  
  return data;
};

/**
 * Get map theme for dark/light mode
 */
export const getMapThemeAPI = (isDark: boolean): Array<any> => {
  if (!isDark) return [];
  
  return [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
    { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
    { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
  ];
};