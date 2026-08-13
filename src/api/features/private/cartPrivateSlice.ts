// services/cart/CartAPI.ts

import Config from 'react-native-config';
import { Alert } from 'react-native';

import { API_BASE_URL } from '../../connections/snippet/apiBaseUrl';
import { getToken } from '../../connections/token/tokenSlice';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';

export interface CartResponse {
  success?: boolean;
  message?: string;
  data?: {
    hasLocation?: boolean;
    products?: any[];
    summary?: {
      subtotal: number;
      platformFee: number;
      packagingFee: number;
      deliveryCharge: number;
      discount: number;
      grandTotal: number;
    };
  };
  cart?: any[];
  summary?: {
    totalItems: number;
    subTotal: number;
    deliveryFee: number;
    tax: number;
    discount: number;
    grandTotal: number;
  };
  items?: any[];
  totalItems?: number;
  totalPrice?: number;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  discount?: number;
  grandTotal?: number;
  currency?: string;
}

export const CartAPI = {
  // ✅ GET CART CHECKOUT
  async getCartCheckout(couponCode?: string): Promise<CartResponse | null> {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Please login to view cart');
        return null;
      }

      const url = couponCode
        ? `${API_BASE_URL}${API_ENDPOINTS.CART_CHECKOUT}?couponCode=${couponCode}`
        : `${API_BASE_URL}${API_ENDPOINTS.CART_CHECKOUT}`;

      console.log('🛒 [CartAPI] Fetching cart checkout...');
      console.log('  - URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch cart');
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ [CartAPI] Error:', error.message);
      Alert.alert('Error', error.message || 'Failed to load cart');
      return null;
    }
  },

  // ✅ UPDATE CART LOCATION
  async updateCartLocation(locationData: any): Promise<CartResponse | null> {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Please login to update location');
        return null;
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.CART_CHECKOUT_LOCATION}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(locationData),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update location');
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ [CartAPI] Error:', error.message);
      Alert.alert('Error', error.message || 'Failed to update location');
      return null;
    }
  },
};

export default CartAPI;
