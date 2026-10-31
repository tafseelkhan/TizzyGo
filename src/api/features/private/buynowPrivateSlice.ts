import {
  ProductVariant,
  SelectedVariant,
  ProductData,
} from '../../../core/types/BuyNowTypes';
import { TIZZYGO_API_BASE_URL } from '../../connections/snippet/apiBaseUrl';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import {
  apiRequest,
  ApiError,
} from '../../../core/utils/handler/apiClient';

// ============================================================
// SAFE URL JOINER — guards against undefined base URL
// ============================================================

const apiUrl = (path: string): string => {
  if (!TIZZYGO_API_BASE_URL) {
    throw new Error('TIZZYGO_API_BASE_URL is not configured.');
  }

  return `${TIZZYGO_API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
};

// ============================================================
// HELPERS
// ============================================================

const isAuthError = (error: unknown): boolean =>
  error instanceof ApiError && (error.status === 401 || error.status === 403);

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ================================
// GET PRODUCT VARIANTS — authenticated
// ================================

export const fetchProductVariantsAPI = async (
  productId: string,
): Promise<ProductVariant[]> => {
  try {
    const data = await apiRequest<any>(
      apiUrl(API_ENDPOINTS.BUYNOW_PRODUCT_VARIANTS(productId)),
    );

    return data?.variants || data?.data || [];
  } catch (error) {
    if (isAuthError(error)) {
      return [];
    }

    console.error('❌ Error fetching variants:', error);
    return [];
  }
};

// ================================
// CLEAR BUY NOW CART — authenticated
// ================================

export const clearBuyNowCartAPI = async (
  productId: string,
): Promise<boolean> => {
  try {
    await apiRequest(apiUrl(API_ENDPOINTS.CLEAR_BUY_NOW), {
      method: 'DELETE',
      body: JSON.stringify({ productId }),
    });

    return true;
  } catch (error) {
    if (isAuthError(error)) {
      return false;
    }

    console.error('❌ Error clearing buy now cart:', error);
    return false;
  }
};

// ================================
// BUY NOW CHECKOUT — authenticated
// ================================

export const processBuyNowAPI = async (
  productData: ProductData,
  selectedVariant: SelectedVariant | null,
): Promise<ApiResponse> => {
  try {
    const requestBody: Record<string, unknown> = {
      productData,
    };

    if (selectedVariant && Object.keys(selectedVariant).length > 0) {
      const variantToSend = {
        ...selectedVariant,
      };

      if (!variantToSend.variantId && variantToSend._id) {
        variantToSend.variantId = variantToSend._id.toString();
      }

      if (variantToSend.variantId) {
        variantToSend.variantId = variantToSend.variantId.toString();
      }

      requestBody.selectedVariant = variantToSend;
    }

    const data = await apiRequest(apiUrl(API_ENDPOINTS.BUY_NOW), {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    if (isAuthError(error)) {
      return {
        success: false,
        error: 'Please login first!',
      };
    }

    console.error('❌ BuyNow API error:', error);

    return {
      success: false,
      error:
        error instanceof ApiError
          ? error.message
          : 'Failed to process buy now!',
    };
  }
};