// api/ordersApi.ts

import axios from 'axios';
import Config from 'react-native-config';

import { API_ENDPOINTS } from '../../connection/snippet/apiEndpoints';
import { getToken } from '../../connection/token/tokenSlice';

const API_BASE_URL = Config.API_AXIOS_BASE_URL;

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

export type DeliveryStatus =
  | 'waiting_for_seller'
  | 'pending_rider_accept'
  | 'assigned'
  | 'waiting_for_rider'
  | 'picked_up'
  | 'delivered';

export const ordersApi = {
  // ==========================================
  // ORDER DETAILS
  // ==========================================

  fetchOrderDetails: async (orderId: string) => {
    const token = await getToken();

    if (!token) {
      throw new Error('Authentication required - No token found');
    }

    const response = await axios.get(
      `${API_BASE_URL}${API_ENDPOINTS.ORDER_DETAILS}/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      },
    );

    return response.data;
  },

  // ==========================================
  // LIVE DELIVERY TRACKING
  // ==========================================

  fetchLiveDeliveryData: async (orderId: string): Promise<LiveDeliveryData> => {
    const token = await getToken();

    if (!token) {
      throw new Error('Authentication required - No token found');
    }

    const response = await axios.get(
      `${API_BASE_URL}${API_ENDPOINTS.LIVE_TRACKING}/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      },
    );

    return response.data;
  },
};
