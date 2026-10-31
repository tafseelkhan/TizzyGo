// api/features/private/productStepPrivateSlice.ts

import { TIZZYOS_API_BASE_URL } from '../../connections/snippet/apiBaseUrl';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { apiRequest } from '../../../core/utils/handler/apiClient';

// ============================================================
// SAFE URL JOINER — TIZZYOS base
// ============================================================

const apiUrl = (path: string): string => {
  if (!TIZZYOS_API_BASE_URL) {
    throw new Error('TIZZYOS_API_BASE_URL is not configured.');
  }
  return `${TIZZYOS_API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
};

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
// GET PRODUCT + SELECTED VARIANT — public
// ================================

export const fetchProduct = async (
  productId: string,
  variantId: string,
): Promise<Product> => {
  const response = await apiRequest<any>(
    apiUrl(
      `${API_ENDPOINTS.GET_PRODUCT}/${productId}/selected/${variantId}`,
    ),
    {
      auth: false,
      retryOnUnauthorized: false,
    },
  );

  if (!response?.success) {
    throw new Error(response?.message || 'Product not found');
  }

  const mergedProduct: Product = {
    ...response.product,
    selectedVariant: response.selectedVariant,
  };

  return mergedProduct;
};

// ================================
// DEBUG - GET RAW RESPONSE — public
// ================================

export const fetchProductRaw = async (
  productId: string,
  variantId: string,
) => {
  return await apiRequest<any>(
    apiUrl(
      `${API_ENDPOINTS.GET_PRODUCT}/${productId}/selected/${variantId}`,
    ),
    {
      auth: false,
      retryOnUnauthorized: false,
    },
  );
};