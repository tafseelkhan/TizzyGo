import Config from 'react-native-config';

import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';

import { getToken } from '../../connections/token/tokenSlice';
import { API_BASE_URL } from '../../connections/snippet/apiBaseUrl';

export const ordersApi = {
  // ================================
  // GET USER ORDERS
  // ================================

  fetchUserOrders: async () => {
    try {
      const token = await getToken();

      if (!token) {
        throw new Error('Please login first. Token not found.');
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.MY_ORDERS}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Server error: ${response.status}`,
        );
      }

      return data;
    } catch (error) {
      console.error('[ORDERS API ERROR]:', error);
      throw error;
    }
  },
};