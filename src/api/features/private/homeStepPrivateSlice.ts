// api/features/private/homeStepPrivateSlice.ts

import { TIZZYGO_API_BASE_URL } from '../../connections/snippet/apiBaseUrl';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { apiRequest } from '../../../core/utils/handler/apiClient';

// ================================
// TYPES
// ================================

export interface FullProduct {
  _id: string;
  title: string;
  brand: string;
  description: string;
  category: string;
  subcategory: string;
  mrp: number;
  price: number;
  discount: number;
  finalPrice: number;
  variants?: Array<{ images?: string[]; [key: string]: any }>;
  averageRating?: number;
  reviewCount?: number;
  images?: string[];
  seller?: any;
  likes?: number;
  comments?: any[];
  createdAt?: string;
  updatedAt?: string;
  offerText?: string;
}

export interface ApiProductResponse {
  productId: string;
  fullProduct: FullProduct;
}

export interface ProductsResponse {
  success?: boolean;
  message?: string;
  products?: ApiProductResponse[];
}

export interface FavoriteColorResponse {
  success?: boolean;
  message?: string;
  data?: {
    color?: string | null;
  };
}

// ================================
// GET PRODUCTS (Home grid)
// ================================

export const fetchHomeProducts = async (): Promise<ApiProductResponse[]> => {
  const data = await apiRequest<ProductsResponse>(
    `${TIZZYGO_API_BASE_URL}${API_ENDPOINTS.SELLER_FORMS_CATEGORIES}`,
    {
      auth: false,
      retryOnUnauthorized: false,
    },
  );

  if (data?.products && Array.isArray(data.products)) {
    return data.products;
  }
  return [];
};

// ================================
// GET FAVORITE / USER COLOR
// ================================

export const fetchUserFavoriteColor = async (): Promise<string | null> => {
  try {
    const data = await apiRequest<FavoriteColorResponse>(
      `${TIZZYGO_API_BASE_URL}${API_ENDPOINTS.FAV_COLOR}`,
    );

    if (data?.success && data.data?.color) {
      return data.data.color;
    }
    return null;
  } catch {
    // color non-critical hai — silent fail
    return null;
  }
};