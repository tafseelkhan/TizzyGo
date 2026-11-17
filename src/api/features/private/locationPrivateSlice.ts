// src/api/locationApi.ts
import { TIZZYGO_API_BASE_URL } from '../../connections/snippet/apiBaseUrl';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import {
  apiRequest,
  ApiError,
} from '../../../core/utils/handler/apiClient';

// ================================
// TYPES
// ================================

export interface SaveLocationData {
  label: string;
  location: {
    type: string;
    coordinates: number[];
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

// ================================
// LOCATION API
// ================================

export const locationApi = {
  // Get location and GPS tracking status
  getLocation: async (): Promise<LocationResponse> => {
    try {
      const data = await apiRequest<any>(
        `${TIZZYGO_API_BASE_URL}${API_ENDPOINTS.GET_FULL_LOCATION}`,
      );

      return {
        success: true,
        data: data?.data,
        message: data?.message,
      };
    } catch (error) {
      console.error('Error getting location:', error);

      if (error instanceof ApiError) {
        return {
          success: false,
          data: error.data,
          message: error.message,
        };
      }

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
      const requestBody = {
        label: address.substring(0, 50),
        location: {
          type: 'Point',
          coordinates: [lng, lat],
          address,
          city,
          state,
          country,
          pinCode,
        },
        isDefault: true,
        placeId,
      };

      const data = await apiRequest<any>(
        `${TIZZYGO_API_BASE_URL}${API_ENDPOINTS.POST_LOCATION_ADDRESS}`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        },
      );

      return {
        success: true,
        data: data?.data,
        message: data?.message,
      };
    } catch (error) {
      console.error('Error saving location:', error);

      if (error instanceof ApiError) {
        return {
          success: false,
          data: error.data,
          message: error.message,
        };
      }

      return { success: false, message: String(error) };
    }
  },

  // Update GPS tracking status only
  updateGpsTracking: async (enabled: boolean): Promise<LocationResponse> => {
    try {
      const data = await apiRequest<any>(
        `${TIZZYGO_API_BASE_URL}${API_ENDPOINTS.POST_GPS_TRACKING_ENABLED}`,
        {
          method: 'POST',
          body: JSON.stringify({ gpsTrackingEnabled: enabled }),
        },
      );

      return {
        success: true,
        data: data?.data,
        message: data?.message,
      };
    } catch (error) {
      console.error('Error updating GPS tracking:', error);

      if (error instanceof ApiError) {
        return {
          success: false,
          data: error.data,
          message: error.message,
        };
      }

      return { success: false, message: String(error) };
    }
  },
};