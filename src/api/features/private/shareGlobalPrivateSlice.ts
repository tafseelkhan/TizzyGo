import { getToken } from '../../connections/token/tokenSlice';
import { Alert } from 'react-native';
import Config from 'react-native-config';

import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { fetchHandler } from '../../../core/utils/handler/fetchHandler';

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
// BASE URL
// ================================

const API_BASE_URL = Config.API_AXIOS_BASE_URL;

// ================================
// SHARE SERVICE
// ================================

export const shareService = {
  /**
   * Create Share
   */
  createShare: async (
    productId: string,
    productType: string = 'product',
    platform: string = 'all',
  ): Promise<ShareResponse | null> => {
    try {
      const token = await getToken();

      if (!token) {
        Alert.alert('Error', 'Please login to share products');
        return null;
      }

      console.log(
        'Creating Share:',
        `${API_BASE_URL}${API_ENDPOINTS.CREATE_SHARE}`,
      );

      const data = await fetchHandler(
        `${API_BASE_URL}${API_ENDPOINTS.CREATE_SHARE}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId,
            productType,
            platform,
          }),
        },
      );

      return data;
    } catch (error: any) {
      console.error('❌ Share API Error:', error);

      Alert.alert(
        'Error',
        error?.message || 'Network error. Please try again.',
      );

      return null;
    }
  },

  /**
   * Build Share URL
   */
  buildShareUrl: (productTitle: string, shareId: string): string => {
    const base = 'https://www.tizzygo.com/flixora/s';

    const params = new URLSearchParams({
      title: productTitle,
      id: shareId,
      show: '1',
    });

    return `${base}?${params.toString()}`;
  },
};
