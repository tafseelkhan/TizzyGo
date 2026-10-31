// api/features/private/relatedProductsSlice.ts

import { TIZZYGO_API_BASE_URL } from '../../connections/snippet/apiBaseUrl';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { apiRequest } from '../../../core/utils/handler/apiClient';

// ============================================================
// SAFE URL JOINER — TIZZYGO base
// ============================================================

const apiUrl = (path: string): string => {
  if (!TIZZYGO_API_BASE_URL) {
    throw new Error('TIZZYGO_API_BASE_URL is not configured.');
  }
  return `${TIZZYGO_API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
};

// ================================
// TYPES
// ================================

export type RelatedProduct = {
  _id: string;
  id?: string;
  title: string;
  description: string;
  category?: string;
  images?: any[];
  videos?: any[];
  originalPrice?: number;
  price?: number;
  FinalPrice?: number;
  Discount?: number;
  Offer?: number;
  brand?: string;
  rating?: number;
  model?: string;
  averageRating?: number;
  reviewCount?: number;
  stock?: number;
};

export type RelatedSlot = 1 | 2 | 3;

// ================================
// GET RELATED PRODUCTS
// ================================

/**
 * Fetch related products for a given product id + slot.
 * slot: 1 = RelatedProducts, 2 = RelatedSecond, 3 = RelatedThird
 *
 * Public endpoint — auth nahi chahiye, isliye auth: false.
 * Agar future mein auth lage toh sirf auth: true kar dena.
 */
export const fetchRelatedProducts = async (
  productId: string,
  slot: RelatedSlot,
): Promise<RelatedProduct[]> => {
  if (!productId) {
    throw new Error('Product ID is missing.');
  }

  const data = await apiRequest<any>(
    apiUrl(`${API_ENDPOINTS.RELATED_PRODUCTS}/${productId}?slot=${slot}`),
    {
      auth: false,
      retryOnUnauthorized: false,
    },
  );

  // Backend kabhi array, kabhi { products }, kabhi { data } bhejta hai
  const list: RelatedProduct[] = Array.isArray(data)
    ? data
    : data?.products
    ? data.products
    : data?.data
    ? data.data
    : [];

  if (!Array.isArray(list)) return [];

  // Current product exclude karo
  return list.filter(p => p?._id !== productId);
};