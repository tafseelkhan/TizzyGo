// services/buyNow.service.ts

import {
  ProductVariant,
  SelectedVariant,
  ProductData,
} from '../../types/BuyNowTypes';
import {
  fetchProductVariantsAPI,
  processBuyNowAPI,
  clearBuyNowCartAPI,
} from '../../../api/features/private/buynowPrivateSlice';

export interface BuyNowResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Fetch product variants
export const fetchProductVariants = async (
  productId: string,
): Promise<ProductVariant[]> => {
  try {
    return await fetchProductVariantsAPI(productId);
  } catch (error) {
    console.error('Service: Error fetching variants', error);
    return [];
  }
};

// Clear saved BuyNow cart
export const clearBuyNowCart = async (productId: string): Promise<boolean> => {
  try {
    return await clearBuyNowCartAPI(productId);
  } catch (error) {
    console.error('Service: Error clearing cart', error);
    return false;
  }
};

// Process BuyNow checkout
export const processBuyNowCheckout = async (
  productData: ProductData,
  selectedVariant: SelectedVariant | null,
): Promise<BuyNowResult> => {
  try {
    const result = await processBuyNowAPI(productData, selectedVariant);
    return result;
  } catch (error: any) {
    console.error('Service: Error processing checkout', error);
    return {
      success: false,
      error: error.message || 'Failed to process buy now!',
    };
  }
};
