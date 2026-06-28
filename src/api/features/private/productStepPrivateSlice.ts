// api/features/private/productStepPrivateSlice.ts

import { fetchHandler } from '../../../core/utils/handler/fetchHandler';
import { API_BASE_URL } from '../../connections/snippet/apiBaseUrl';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';

// ================================
// TYPES
// ================================

export interface SelectedVariantData {
  variantId: string;
  fields: Record<string, string>;
  mrp: number;
  price: number;
  finalPrice: number;
  discount: number;
  savedAmount: number;
  offerText?: string;
  images: string[];
  video?: string;
  sku: string;
  inStock: boolean;
  quantityAvailable: number;
  weight?: string;
  height?: string;
  width?: string;
  length?: string;
  isDefault: boolean;
  combinationKey?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id: string;
  productId: string;
  title: string;
  brand: string;
  category: string;
  subcategory?: string;
  selectedVariant?: SelectedVariantData;
  deliveryTime?: string;
  warranty?: string;
  returnPolicy?: string;
  shortDescription?: string;
  fullDescription?: string;
  description?: string;
  highlights?: string[];
  sellerLocation?: {
    address: string;
    latitude: number;
    longitude: number;
    googlePlaceId: string;
  };
  specs?: Record<string, any>;
  verified?: boolean;
  gstRate?: number;
  gstSource?: string;
  fulfillmentType?: 'SELLER' | 'FFC';
  protectPromiseFees?: boolean;
  freeDelivery?: boolean;
  fastDelivery?: boolean;
  safety?: boolean;
  productQuality?: boolean;
  paymentOptions?: boolean;
  manufacturer?: boolean;
  cashOnDelivery?: boolean;
  deliveryVehicleType?: boolean;
}

// ================================
// GET PRODUCT + SELECTED VARIANT
// ================================

export const fetchProduct = async (
  productId: string,
  variantId: string,
): Promise<Product> => {
  const url = `${API_BASE_URL}${API_ENDPOINTS.GET_PRODUCT}/${productId}/selected/${variantId}`;

  console.log('Fetching Product:', url);

  const response = await fetchHandler(url, {
    method: 'GET',
  });

  if (!response?.success) {
    throw new Error(response?.message || 'Product not found');
  }

  // ✅ Merge product and selectedVariant into one object
  const mergedProduct: Product = {
    ...response.product,
    selectedVariant: response.selectedVariant,
  };

  console.log('Merged Product:', {
    productId: mergedProduct.productId,
    title: mergedProduct.title,
    hasSelectedVariant: !!mergedProduct.selectedVariant,
    selectedVariantId: mergedProduct.selectedVariant?.variantId,
  });

  return mergedProduct;
};

// ================================
// DEBUG - GET RAW RESPONSE
// ================================

export const fetchProductRaw = async (productId: string, variantId: string) => {
  const url = `${API_BASE_URL}${API_ENDPOINTS.GET_PRODUCT}/${productId}/selected/${variantId}`;

  const response = await fetchHandler(url, {
    method: 'GET',
  });

  return response;
};
