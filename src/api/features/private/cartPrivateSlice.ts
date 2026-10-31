// services/cart/CartAPI.ts

import { Alert } from 'react-native';

import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import {
  apiRequest,
  ApiError,
} from '../../../core/utils/handler/apiClient';

// ============================================================
// HELPERS
// ============================================================

// Sirf 401 = auth issue. 403 = permission issue (refresh se
// fayda nahi hoga), isliye use auth error treat nahi karte.
const isAuthError = (error: unknown): boolean =>
  error instanceof ApiError && error.status === 401;

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof ApiError ? error.message : fallback;

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

export interface CartCountResponse {
  success?: boolean;
  message?: string;
  count?: number;
  data?: {
    count?: number;
    totalItems?: number;
  };
  totalItems?: number;
}

export const CartAPI = {
  // ✅ GET CART CHECKOUT
  async getCartCheckout(couponCode?: string): Promise<CartResponse | null> {
    try {
      const path = couponCode
        ? `${API_ENDPOINTS.CART_CHECKOUT}?couponCode=${encodeURIComponent(couponCode)}`
        : API_ENDPOINTS.CART_CHECKOUT;

      const data = await apiRequest<CartResponse>(path);
      return data;
    } catch (error) {
      if (isAuthError(error)) {
        Alert.alert('Error', 'Please login to view cart');
        return null;
      }

      Alert.alert('Error', getErrorMessage(error, 'Failed to load cart'));
      return null;
    }
  },

  // ✅ UPDATE CART LOCATION
  async updateCartLocation(locationData: any): Promise<CartResponse | null> {
    try {
      const data = await apiRequest<CartResponse>(
        API_ENDPOINTS.CART_CHECKOUT_LOCATION,
        {
          method: 'POST',
          body: JSON.stringify(locationData),
        },
      );
      return data;
    } catch (error) {
      if (isAuthError(error)) {
        Alert.alert('Error', 'Please login to update location');
        return null;
      }

      Alert.alert('Error', getErrorMessage(error, 'Failed to update location'));
      return null;
    }
  },

  // ✅ GET CART COUNT
  // Count non-critical hai — silent fail, UI block nahi karte.
  async getCartCount(): Promise<CartCountResponse | null> {
    try {
      const data = await apiRequest<CartCountResponse>(
        API_ENDPOINTS.CART_COUNT,
      );
      return data;
    } catch (error) {
      console.error(
        'Failed to fetch cart count:',
        error instanceof ApiError ? error.message : error,
      );
      return null;
    }
  },
};

export default CartAPI;