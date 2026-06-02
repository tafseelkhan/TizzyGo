import Config from 'react-native-config';
import { getToken } from '../../connections/token/tokenSlice';
import { fetchHandler } from '../../../core/utils/handler/fetchHandler';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';

const API_BASE_URL = Config.API_AXIOS_BASE_URL;

// ================================
// TYPES
// ================================

export interface SearchResult {
  category: string;
  products: Array<{
    _id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    images: any[];
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
  results?: SearchResult[];
  searches?: PopularSearch[] | RecentSearch[];
}

interface ApiResponse<T = any> {
  success?: boolean;
  searches?: T;
  results?: SearchResult[];
}

class SearchApi {
  // ================================
  // TOKEN HEADERS
  // ================================

  private getHeaders = async (): Promise<Record<string, string>> => {
    try {
      const token = await getToken();

      return {
        'Content-Type': 'application/json',
        ...(token && {
          Authorization: `Bearer ${token}`,
        }),
      };
    } catch (error) {
      console.error('Error getting headers:', error);
      return {
        'Content-Type': 'application/json',
      };
    }
  };

  // ================================
  // SEARCH PRODUCTS
  // ================================

  searchProductsAPI = async (query: string): Promise<SearchResponse> => {
    if (!query.trim()) {
      return {
        success: false,
        results: [],
      };
    }

    try {
      const data = await fetchHandler(
        `${API_BASE_URL}${API_ENDPOINTS.SEARCH_PRODUCTS}?q=${encodeURIComponent(
          query,
        )}`,
        {
          method: 'GET',
          headers: await this.getHeaders(),
        },
      );

      return data || { success: false, results: [] };
    } catch (error) {
      console.error('Search products API error:', error);
      return {
        success: false,
        results: [],
      };
    }
  };

  // ================================
  // GET RECENT SEARCHES
  // ================================

  getRecentSearchesAPI = async (): Promise<RecentSearch[]> => {
    try {
      const data: ApiResponse<RecentSearch[]> = await fetchHandler(
        `${API_BASE_URL}${API_ENDPOINTS.RECENT_SEARCHES}`,
        {
          method: 'GET',
          headers: await this.getHeaders(),
        },
      );

      if (Array.isArray(data)) {
        return data;
      }

      if (data?.searches && Array.isArray(data.searches)) {
        return data.searches;
      }

      return [];
    } catch (error) {
      console.error('Get recent searches API error:', error);
      return [];
    }
  };

  // ================================
  // GET POPULAR SEARCHES
  // ================================

  getPopularSearchesAPI = async (): Promise<PopularSearch[]> => {
    try {
      const data: ApiResponse<PopularSearch[]> = await fetchHandler(
        `${API_BASE_URL}${API_ENDPOINTS.POPULAR_SEARCHES}`,
        {
          method: 'GET',
          headers: await this.getHeaders(),
        },
      );

      const searches = data?.searches || data;
      return Array.isArray(searches) ? searches.slice(0, 10) : [];
    } catch (error) {
      console.error('Get popular searches API error:', error);
      return [];
    }
  };

  // ================================
  // REMOVE RECENT SEARCH
  // ================================

  removeRecentSearchAPI = async (
    searchId: string,
  ): Promise<{ success: boolean }> => {
    if (!searchId) {
      return { success: false };
    }

    try {
      await fetchHandler(
        `${API_BASE_URL}${API_ENDPOINTS.REMOVE_RECENT_SEARCH}/${searchId}`,
        {
          method: 'DELETE',
          headers: await this.getHeaders(),
        },
      );

      return { success: true };
    } catch (error) {
      console.error('Remove recent search API error:', error);
      return { success: false };
    }
  };

  // ================================
  // CLEAR ALL RECENT SEARCHES
  // ================================

  clearAllRecentSearchesAPI = async (): Promise<{ success: boolean }> => {
    try {
      await fetchHandler(
        `${API_BASE_URL}${API_ENDPOINTS.CLEAR_RECENT_SEARCHES}`,
        {
          method: 'DELETE',
          headers: await this.getHeaders(),
        },
      );

      return { success: true };
    } catch (error) {
      console.error('Clear all recent searches API error:', error);
      return { success: false };
    }
  };
}

// Export singleton instance
export const searchApi = new SearchApi();
