// api/ordersApi.ts

import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { TIZZYOS_API_BASE_URL } from '../../connections/snippet/apiBaseUrl';
import {
  apiRequest,
  ApiError,
} from '../../../core/utils/handler/apiClient';

// ============================================================
// TYPES
// ============================================================

export type DeliveryStatus =
  | 'waiting_for_seller'
  | 'pending_rider_accept'
  | 'assigned'
  | 'waiting_for_rider'
  | 'picked_up'
  | 'delivered';

export interface LiveDeliveryData {
  success: boolean;
  deliveryStatus?: DeliveryStatus;
  currentStatus?: string;
  status?: string;
  riderLocation?: {
    latitude: number;
    longitude: number;
  };
  estimate?: {
    minutes: number;
    text: string;
    distance: string;
  };
  route?: {
    polyline: string;
    legs: any[];
  };
  riderDetails?: {
    name?: string;
    phone?: string;
    vehicleType?: string;
  };
  sellerDetails?: {
    name?: string;
    address?: string;
  };
}

// ============================================================
// ORDERS API
// ============================================================

export const ordersApi = {
  // ==========================================
  // ORDER DETAILS
  // ==========================================

  fetchOrderDetails: async (orderId: string) => {
    try {
      return await apiRequest(
        `${TIZZYOS_API_BASE_URL}${API_ENDPOINTS.ORDER_DETAILS}/${orderId}`,
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new Error('Authentication required - Please login');
      }
      throw error;
    }
  },

  // ==========================================
  // LIVE DELIVERY TRACKING
  // ==========================================

  fetchLiveDeliveryData: async (
    orderId: string,
  ): Promise<LiveDeliveryData> => {
    try {
      return await apiRequest<LiveDeliveryData>(
        `${TIZZYOS_API_BASE_URL}${API_ENDPOINTS.LIVE_TRACKING}/${orderId}`,
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new Error('Authentication required - Please login');
      }
      throw error;
    }
  },
};