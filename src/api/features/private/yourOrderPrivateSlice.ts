import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { TIZZYGO_API_BASE_URL } from '../../connections/snippet/apiBaseUrl';
import {
  apiRequest,
  ApiError,
} from '../../../core/utils/handler/apiClient';

// ============================================================
// SAFE URL JOINER
// ============================================================

const apiUrl = (path: string): string => {
  if (!TIZZYGO_API_BASE_URL) {
    throw new Error('TIZZYGO_API_BASE_URL is not configured.');
  }
  return `${TIZZYGO_API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
};

// ============================================================
// ORDERS API
// ============================================================

export const ordersApi = {
  // ================================
  // GET USER ORDERS — authenticated
  // ================================

  fetchUserOrders: async () => {
    try {
      const data = await apiRequest<any>(
        apiUrl(API_ENDPOINTS.MY_ORDERS),
      );

      return data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new Error('Please login first. Token not found.');
      }

      console.error('[ORDERS API ERROR]:', error);
      throw error;
    }
  },
};