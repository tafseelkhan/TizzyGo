// api/features/private/shareGlobalPrivateSlice.ts - FIXED

import { getToken } from '../../connections/token/tokenSlice';
import { Alert } from 'react-native';
import { API_BASE_URL } from '../../connections/snippet/apiBaseUrl';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';

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

export const shareService = {
  /**
   * Create Share - FIXED
   */
  createShare: async (
    productId: string,
    productType: string = 'product',
    platform: string = 'all',
  ): Promise<ShareResponse | null> => {
    try {
      const token = await getToken();

      if (!token) {
        console.warn('⚠️ No token found, user not logged in');
        Alert.alert('Error', 'Please login to share products');
        return null;
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.CREATE_SHARE}`;
      const body = JSON.stringify({
        productId,
        productType,
        platform,
      });

      console.log('📤 Creating Share URL:', url);
      console.log('📤 Request Body:', body);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: body, // ✅ Body properly stringified
      });

      console.log('📥 Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Server Error:', errorData);
        throw new Error(
          errorData.message || `Server error: ${response.status}`,
        );
      }

      const data = await response.json();
      console.log('✅ Share created:', data);

      return data;
    } catch (error: any) {
      console.error('❌ Share API Error:', error);
      // ✅ Don't show Alert here - let component handle it
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
