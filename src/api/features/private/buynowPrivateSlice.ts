import { getToken } from '../../connection/token/tokenSlice';
import Config from 'react-native-config';
import { fetchHandler } from '../../../core/utils/handler/fetchHandler';
import { API_ENDPOINTS } from '../../connection/snippet/apiEndpoints';
import {
  ProductVariant,
  SelectedVariant,
  ProductData,
} from '../../../core/types/BuyNowTypes';

const API_BASE_URL = Config.API_AXIOS_BASE_URL;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ================================
// GET PRODUCT VARIANTS
// ================================

export const fetchProductVariantsAPI = async (
  productId: string,
): Promise<ProductVariant[]> => {
  try {
    const token = await getToken();

    if (!token) {
      return [];
    }

    console.log(
      'Fetching variants:',
      `${API_BASE_URL}${API_ENDPOINTS.BUYNOW_PRODUCT_VARIANTS(productId)}`,
    );

    const data = await fetchHandler(
      `${API_BASE_URL}${API_ENDPOINTS.BUYNOW_PRODUCT_VARIANTS(productId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return data?.variants || data?.data || [];
  } catch (error) {
    console.error('❌ Error fetching variants:', error);
    return [];
  }
};

// ================================
// CLEAR BUY NOW CART
// ================================

export const clearBuyNowCartAPI = async (
  productId: string,
): Promise<boolean> => {
  try {
    const token = await getToken();

    if (!token) {
      return false;
    }

    await fetchHandler(`${API_BASE_URL}${API_ENDPOINTS.CLEAR_BUY_NOW}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productId,
      }),
    });

    return true;
  } catch (error) {
    console.error('❌ Error clearing buy now cart:', error);
    return false;
  }
};

// ================================
// BUY NOW CHECKOUT
// ================================

export const processBuyNowAPI = async (
  productData: ProductData,
  selectedVariant: SelectedVariant | null,
): Promise<ApiResponse> => {
  try {
    const token = await getToken();

    if (!token) {
      return {
        success: false,
        error: 'Please login first!',
      };
    }

    const requestBody: any = {
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

    const data = await fetchHandler(`${API_BASE_URL}${API_ENDPOINTS.BUY_NOW}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('✅ Checkout successful:', data);

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error('❌ BuyNow API error:', error);

    return {
      success: false,
      error: error?.message || 'Failed to process buy now!',
    };
  }
};
