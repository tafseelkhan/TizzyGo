// api/features/private/searchPrivateSlice.ts

import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { TIZZYGO_API_BASE_URL } from '../../connections/snippet/apiBaseUrl';
import {
  apiRequest,
  ApiError,
} from '../../../core/utils/handler/apiClient';

// ============================================================
// SAFE URL JOINER
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

// ================================
// TYPES
// ================================

export interface SearchResult {
  category: string;
  products: Array<{
    _id: string;
    productId?: string;
    title: string;
    brand?: string;
    description?: string;
    price: number;
    mrp?: number;
    discount?: number;
    finalPrice?: number;
    category: string;
    subcategory?: string;
    images: string[];
    image?: string;
    inStock?: boolean;
    quantityAvailable?: number;
    sellerId?: string;
    fulfillmentType?: string;
    freeDelivery?: boolean;
    fastDelivery?: boolean;
    cashOnDelivery?: boolean;
    verified?: boolean;
    variants?: any[];
    createdAt?: string;
  }>;
}

export interface PopularSearch {
  query: string;
  count: number;
}

export interface RecentSearch {
  id: string;
  query: string;
  createdAt: string;
}

export interface SearchResponse {
  success: boolean;
  query?: string;
  data?: SearchResult[];
  results?: SearchResult[];
  message?: string;
}

// ================================
// SEARCH API CLASS
// ================================

class SearchApi {
  // ================================
  // SEARCH PRODUCTS — public
  // ================================

  searchProductsAPI = async (query: string): Promise<SearchResponse> => {
    if (!query || !query.trim()) {
      return { success: false, data: [] };
    }

    try {
      const data = await apiRequest<any>(
        apiUrl(
          `${API_ENDPOINTS.SEARCH_PRODUCTS}?q=${encodeURIComponent(query.trim())}`,
        ),
        {
          auth: false,
          retryOnUnauthorized: false,
        },
      );

      if (data?.data && Array.isArray(data.data)) {
        return {
          success: true,
          query: data.query || query,
          data: data.data,
        };
      }

      if (Array.isArray(data)) {
        return { success: true, data };
      }

      if (data?.results && Array.isArray(data.results)) {
        return { success: true, data: data.results };
      }

      return { success: false, data: [] };
    } catch (error) {
      console.error('❌ [SearchApi] SEARCH ERROR:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Search failed',
      };
    }
  };

  // ================================
  // GET RECENT SEARCHES — authenticated
  // ================================

  getRecentSearchesAPI = async (): Promise<RecentSearch[]> => {
    try {
      const data = await apiRequest<any>(
        apiUrl(API_ENDPOINTS.RECENT_SEARCHES),
      );

      if (data?.searches && Array.isArray(data.searches)) {
        return data.searches;
      }

      if (Array.isArray(data)) {
        return data;
      }

      return [];
    } catch (error) {
      if (isAuthError(error)) {
        return [];
      }
      console.error('❌ [SearchApi] Recent searches error:', error);
      return [];
    }
  };

  // ================================
  // GET POPULAR SEARCHES — public
  // ================================

  getPopularSearchesAPI = async (): Promise<PopularSearch[]> => {
    try {
      const data = await apiRequest<any>(
        apiUrl(API_ENDPOINTS.POPULAR_SEARCHES),
        {
          auth: false,
          retryOnUnauthorized: false,
        },
      );

      if (data?.searches && Array.isArray(data.searches)) {
        return data.searches.slice(0, 10);
      }

      if (Array.isArray(data)) {
        return data.slice(0, 10);
      }

      return [];
    } catch (error) {
      console.error('❌ [SearchApi] Popular searches error:', error);
      return [];
    }
  };

  // ================================
  // REMOVE RECENT SEARCH — authenticated
  // ================================

  removeRecentSearchAPI = async (
    searchId: string,
  ): Promise<{ success: boolean }> => {
    if (!searchId) {
      return { success: false };
    }

    try {
      await apiRequest(
        apiUrl(`${API_ENDPOINTS.REMOVE_RECENT_SEARCH}/${searchId}`),
        { method: 'DELETE' },
      );

      return { success: true };
    } catch (error) {
      if (isAuthError(error)) {
        return { success: false };
      }
      console.error('❌ [SearchApi] Remove search error:', error);
      return { success: false };
    }
  };

  // ================================
  // CLEAR ALL RECENT SEARCHES — authenticated
  // ================================

  clearAllRecentSearchesAPI = async (): Promise<{ success: boolean }> => {
    try {
      await apiRequest(apiUrl(API_ENDPOINTS.CLEAR_RECENT_SEARCHES), {
        method: 'DELETE',
      });

      return { success: true };
    } catch (error) {
      if (isAuthError(error)) {
        return { success: false };
      }
      console.error('❌ [SearchApi] Clear searches error:', error);
      return { success: false };
    }
  };
}

export const searchApi = new SearchApi();