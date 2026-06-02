import Config from 'react-native-config';
import { Alert } from 'react-native';

import {
  CartItemParams,
  CartStatusResponse,
} from '../../../core/types/CartTypes';

import { getToken } from '../../connection/token/tokenSlice';
import { API_ENDPOINTS } from '../../connection/snippet/apiEndpoints';

const API_BASE_URL = Config.API_AXIOS_BASE_URL;

export const CartAPI = {
  // ==========================================
  // PRODUCT VARIANTS
  // ==========================================

  async fetchProductVariants(productId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.PRODUCT_VARIANTS}/${productId}/variants`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch variants');
      }

      const data = await response.json();

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching variants:', error);
      return [];
    }
  },

  // ==========================================
  // ADD TO CART
  // ==========================================

  async addToCart(params: CartItemParams): Promise<boolean> {
    const {
      productId,
      productData,
      quantity = 1,
      selectedVariant = null,
    } = params;

    try {
      const token = await getToken();

      if (!token) {
        Alert.alert('Error', 'Please login to add items to cart');
        return false;
      }

      const requestBody: any = {
        productId,
        productData,
        quantity,
      };

      if (selectedVariant && Object.keys(selectedVariant).length > 0) {
        requestBody.selectedVariant = selectedVariant;
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.ADD_TO_CART}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || 'Failed to add to cart');
      }

      return true;
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add item to cart');

      return false;
    }
  },

  // ==========================================
  // UPDATE CART
  // ==========================================

  async updateCartItem(
    params: Omit<CartItemParams, 'productData'>,
  ): Promise<boolean> {
    const { productId, quantity = 1, selectedVariant = null } = params;

    try {
      const token = await getToken();

      if (!token) {
        Alert.alert('Error', 'Please login to update cart');
        return false;
      }

      const requestBody: any = {
        productId,
        quantity,
      };

      if (selectedVariant && Object.keys(selectedVariant).length > 0) {
        requestBody.selectedVariant = selectedVariant;
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.UPDATE_CART}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || 'Failed to update cart');
      }

      return true;
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update cart');

      return false;
    }
  },

  // ==========================================
  // REMOVE FROM CART
  // ==========================================

  async removeFromCart(productId: string): Promise<boolean> {
    try {
      const token = await getToken();

      if (!token) {
        Alert.alert('Error', 'Please login to remove from cart');
        return false;
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.REMOVE_FROM_CART}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || 'Failed to remove from cart');
      }

      return true;
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to remove from cart');

      return false;
    }
  },

  // ==========================================
  // CHECK CART STATUS
  // ==========================================

  async fetchCart(productId: string): Promise<CartStatusResponse | null> {
    try {
      const token = await getToken();

      if (!token) {
        return null;
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.CHECK_CART}?productId=${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch cart status');
      }

      const data = await response.json();

      return {
        inCart: data.inCart || false,
        quantity: data.quantity || 1,
        selectedVariant: data.selectedVariant || null,
      };
    } catch (error) {
      console.error('Error fetching cart:', error);
      return null;
    }
  },
};
