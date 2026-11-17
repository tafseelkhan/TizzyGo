import { Alert } from 'react-native';

import {
  CartItemParams,
  CartStatusResponse,
} from '../../../core/types/CartTypes';
import { TIZZYGO_API_BASE_URL } from '../../connections/snippet/apiBaseUrl';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import {
  apiRequest,
  ApiError,
} from '../../../core/utils/handler/apiClient';

// ============================================================
// HELPERS
// ============================================================

/** True if the error looks like a missing/expired session. */
const isAuthError = (error: unknown): boolean =>
  error instanceof ApiError && (error.status === 401 || error.status === 403);

// ============================================================
// CART API
// ============================================================

export const CartAPI = {
  // ==========================================
  // PRODUCT VARIANTS — public endpoint
  // ==========================================

  async fetchProductVariants(productId: string): Promise<any[]> {
    try {
      const data = await apiRequest<any[]>(
        `${TIZZYGO_API_BASE_URL}${API_ENDPOINTS.PRODUCT_VARIANTS}/${productId}/variants`,
        {
          auth: false,
          retryOnUnauthorized: false,
        },
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching variants:', error);
      return [];
    }
  },

  // ==========================================
  // ADD TO CART — authenticated
  // ==========================================

  async addToCart(params: CartItemParams): Promise<boolean> {
    const {
      productId,
      productData,
      quantity = 1,
      selectedVariant = null,
    } = params;

    try {
      const requestBody: Record<string, unknown> = {
        productId,
        productData,
        quantity,
      };

      if (selectedVariant && Object.keys(selectedVariant).length > 0) {
        requestBody.selectedVariant = selectedVariant;
      }

      await apiRequest(
        `${TIZZYGO_API_BASE_URL}${API_ENDPOINTS.ADD_TO_CART}`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        },
      );

      return true;
    } catch (error) {
      if (isAuthError(error)) {
        Alert.alert('Error', 'Please login to add items to cart');
        return false;
      }

      Alert.alert(
        'Error',
        error instanceof ApiError
          ? error.message
          : 'Failed to add item to cart',
      );

      return false;
    }
  },

  // ==========================================
  // UPDATE CART — authenticated
  // ==========================================

  async updateCartItem(
    params: Omit<CartItemParams, 'productData'>,
  ): Promise<boolean> {
    const { productId, quantity = 1, selectedVariant = null } = params;

    try {
      const requestBody: Record<string, unknown> = {
        productId,
        quantity,
      };

      if (selectedVariant && Object.keys(selectedVariant).length > 0) {
        requestBody.selectedVariant = selectedVariant;
      }

      await apiRequest(
        `${TIZZYGO_API_BASE_URL}${API_ENDPOINTS.UPDATE_CART}`,
        {
          method: 'PUT',
          body: JSON.stringify(requestBody),
        },
      );

      return true;
    } catch (error) {
      if (isAuthError(error)) {
        Alert.alert('Error', 'Please login to update cart');
        return false;
      }

      Alert.alert(
        'Error',
        error instanceof ApiError
          ? error.message
          : 'Failed to update cart',
      );

      return false;
    }
  },

  // ==========================================
  // REMOVE FROM CART — authenticated
  // ==========================================

  async removeFromCart(productId: string): Promise<boolean> {
    try {
      await apiRequest(
        `${TIZZYGO_API_BASE_URL}${API_ENDPOINTS.REMOVE_FROM_CART}`,
        {
          method: 'DELETE',
          body: JSON.stringify({ productId }),
        },
      );

      return true;
    } catch (error) {
      if (isAuthError(error)) {
        Alert.alert('Error', 'Please login to remove from cart');
        return false;
      }

      Alert.alert(
        'Error',
        error instanceof ApiError
          ? error.message
          : 'Failed to remove from cart',
      );

      return false;
    }
  },

  // ==========================================
  // CHECK CART STATUS — authenticated
  // ==========================================

  async fetchCart(productId: string): Promise<CartStatusResponse | null> {
    try {
      const data = await apiRequest<{
        inCart?: boolean;
        quantity?: number;
        selectedVariant?: any;
      }>(
        `${TIZZYGO_API_BASE_URL}${API_ENDPOINTS.CHECK_CART}?productId=${encodeURIComponent(productId)}`,
      );

      return {
        inCart: data.inCart ?? false,
        quantity: data.quantity ?? 1,
        selectedVariant: data.selectedVariant ?? null,
      };
    } catch (error) {
      // No token / expired session → treat as "not in cart" silently.
      if (isAuthError(error)) {
        return null;
      }

      console.error('Error fetching cart:', error);
      return null;
    }
  },
};