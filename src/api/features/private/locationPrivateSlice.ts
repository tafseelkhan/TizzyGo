// src/api/locationApi.ts - FINAL COMPLETE VERSION
import { API_BASE_URL } from '../../connections/snippet/apiBaseUrl';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { getToken } from '../../connections/token/tokenSlice';

export interface SaveLocationData {
  label: string;
  location: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
    address: string;
    city: string;
    state: string;
    country: string;
    pinCode: string;
  };
  isDefault: boolean;
  placeId?: string;
}

export interface GpsTrackingData {
  gpsTrackingEnabled: boolean;
}

export interface LocationResponse {
  success: boolean;
  data?: any;
  message?: string;
}

export const locationApi = {
  // Get location and GPS tracking status
  getLocation: async (): Promise<LocationResponse> => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.GET_FULL_LOCATION}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const result = await response.json();
      return {
        success: response.ok,
        data: result.data,
        message: result.message,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return { success: false, message: String(error) };
    }
  },

  // ✅ Save location with complete address
  saveLocation: async (
    lat: number,
    lng: number,
    address: string,
    city: string = '',
    state: string = '',
    country: string = 'India',
    pinCode: string = '',
    placeId: string = '',
  ): Promise<LocationResponse> => {
    try {
      const token = await getToken();
      const requestBody = {
        label: address.substring(0, 50),
        location: {
          type: 'Point',
          coordinates: [lng, lat], // GeoJSON: [longitude, latitude]
          address: address,
          city: city,
          state: state,
          country: country,
          pinCode: pinCode,
        },
        isDefault: true,
        placeId: placeId,
      };

      console.log('📤 Saving location:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.POST_LOCATION_ADDRESS}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        },
      );
      const result = await response.json();

      if (!response.ok) {
        console.error('Save location error:', result);
      }

      return {
        success: response.ok,
        data: result.data,
        message: result.message,
      };
    } catch (error) {
      console.error('Error saving location:', error);
      return { success: false, message: String(error) };
    }
  },

  // Update GPS tracking status only
  updateGpsTracking: async (enabled: boolean): Promise<LocationResponse> => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.POST_GPS_TRACKING_ENABLED}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            gpsTrackingEnabled: enabled,
          }),
        },
      );
      const result = await response.json();
      return {
        success: response.ok,
        data: result.data,
        message: result.message,
      };
    } catch (error) {
      console.error('Error updating GPS tracking:', error);
      return { success: false, message: String(error) };
    }
  },
};
