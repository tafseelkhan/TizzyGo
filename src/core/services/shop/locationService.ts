// src/services/locationService.ts
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import * as googleMapsApi from '../../../api/constants/googleMapsApi';
import { LOCATION_TIMEOUT, LOCATION_MAX_AGE } from '../../../api/constants/mapConfig';

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  placeId?: string;
}

export interface LocationError {
  code: string;
  message: string;
}

class LocationService {
  /**
   * Request location permission for Android
   */
  async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message:
            'This app needs access to your location to show delivery options.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Location permission error:', err);
      return false;
    }
  }

  /**
   * Get current device location
   */
  async getCurrentLocation(): Promise<LocationData> {
    return new Promise(async (resolve, reject) => {
      try {
        const hasPermission = await this.requestLocationPermission();
        if (!hasPermission) {
          reject({
            code: 'PERMISSION_DENIED',
            message: 'Location permission denied',
          });
          return;
        }

        Geolocation.getCurrentPosition(
          async position => {
            const { latitude, longitude } = position.coords;

            try {
              const address = await this.reverseGeocode(latitude, longitude);
              resolve({
                latitude,
                longitude,
                address: address.formatted_address,
                placeId: address.place_id,
              });
            } catch (error) {
              reject({
                code: 'GEOCODE_ERROR',
                message: 'Failed to get address',
              });
            }
          },
          error => {
            console.error('Geolocation error:', error);
            reject({ code: error.code, message: error.message });
          },
          {
            enableHighAccuracy: true,
            timeout: LOCATION_TIMEOUT,
            maximumAge: LOCATION_MAX_AGE,
          },
        );
      } catch (error) {
        reject({ code: 'UNKNOWN_ERROR', message: 'Failed to get location' });
      }
    });
  }

  /**
   * Reverse geocode - Convert coordinates to address
   */
  async reverseGeocode(
    latitude: number,
    longitude: number,
    language: string = 'en',
  ): Promise<{
    formatted_address: string;
    place_id: string;
    latitude: number;
    longitude: number;
  }> {
    try {
      const response = await googleMapsApi.reverseGeocodeAPI(
        latitude,
        longitude,
        language,
      );

      if (response.status === 'OK' && response.results.length > 0) {
        const result = response.results[0];
        return {
          formatted_address: result.formatted_address,
          place_id: result.place_id,
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
        };
      }

      throw new Error(`Geocoding failed: ${response.status}`);
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return {
        formatted_address: `Location at ${latitude.toFixed(
          6,
        )}, ${longitude.toFixed(6)}`,
        place_id: '',
        latitude,
        longitude,
      };
    }
  }

  /**
   * Forward geocode - Convert address to coordinates
   */
  async forwardGeocode(
    address: string,
    language: string = 'en',
  ): Promise<{
    formatted_address: string;
    place_id: string;
    latitude: number;
    longitude: number;
  } | null> {
    try {
      const response = await googleMapsApi.forwardGeocodeAPI(address, language);

      if (response.status === 'OK' && response.results.length > 0) {
        const result = response.results[0];
        return {
          formatted_address: result.formatted_address,
          place_id: result.place_id,
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
        };
      }

      return null;
    } catch (error) {
      console.error('Forward geocode error:', error);
      return null;
    }
  }

  /**
   * Get place details by place ID
   */
  async getPlaceDetails(placeId: string): Promise<any> {
    try {
      const response = await googleMapsApi.getPlaceDetailsAPI(placeId);
      if (response.status === 'OK') {
        return response.result;
      }
      return null;
    } catch (error) {
      console.error('Get place details error:', error);
      return null;
    }
  }

  /**
   * Validate coordinates
   */
  isValidCoordinate(latitude: number, longitude: number): boolean {
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
  }

  /**
   * Get distance between two coordinates (Haversine formula)
   */
  getDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
    unit: 'km' | 'miles' = 'km',
  ): number {
    const R = unit === 'km' ? 6371 : 3959;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.asin(Math.sqrt(a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export default new LocationService();
