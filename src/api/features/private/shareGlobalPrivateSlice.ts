// api/features/private/shareGlobalPrivateSlice.ts

import { Alert } from 'react-native';
import { TIZZYGO_API_BASE_URL } from '../../connections/snippet/apiBaseUrl';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import {
  apiRequest,
  ApiError,
} from '../../../core/utils/handler/apiClient';

// ============================================================
// HELPERS
// ============================================================

const isAuthError = (error: unknown): boolean =>
  error instanceof ApiError && (error.status === 401 || error.status === 403);

// ================================
// TYPES
// ================================

export interface ShareResponse {
  share: {
    _id: string;
    productId: string;
    productType: string;
    platform: string;
    createdAt?: string;
  };
  message?: string;
}

// ================================
// SHARE SERVICE
// ================================

export const shareService = {
  /**
   * Create Share — authenticated
   */
  createShare: async (
    productId: string,
    productType: string = 'product',
    platform: string = 'all',
  ): Promise<ShareResponse | null> => {
    try {
      const data = await apiRequest<ShareResponse>(
        `${TIZZYGO_API_BASE_URL}${API_ENDPOINTS.CREATE_SHARE}`,
        {
          method: 'POST',
          body: JSON.stringify({
            productId,
            productType,
            platform,
          }),
        },
      );

      return data;
    } catch (error) {
      if (isAuthError(error)) {
        Alert.alert('Error', 'Please login to share products');
        return null;
      }

      console.error('❌ Share API Error:', error);
      return null;
    }
  },

  /**
   * Build Share URL
   */
  buildShareUrl: (productTitle: string, shareId: string): string => {
    const base = 'https://www.tizzygo.com/quton/s';
    const params = new URLSearchParams({
      title: productTitle,
      id: shareId,
      show: '1',
    });
    return `${base}?${params.toString()}`;
  },
};