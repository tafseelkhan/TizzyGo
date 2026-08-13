// api/features/private/searchPrivateSlice.ts - FINAL COMPLETE FIX

import Config from 'react-native-config';
import { getToken } from '../../connections/token/tokenSlice';
import { fetchHandler } from '../../../core/utils/handler/fetchHandler';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { API_BASE_URL } from '../../connections/snippet/apiBaseUrl';

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

class SearchApi {
  private getHeaders = async (): Promise<Record<string, string>> => {
    try {
      const token = await getToken();
      console.log('📋 [SearchApi] Token:', token ? '✅ Present' : '❌ Missing');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('📋 [SearchApi] Authorization header added');
      }

      console.log('📋 [SearchApi] Headers:', JSON.stringify(headers, null, 2));
      return headers;
    } catch (error) {
      console.error('❌ Error getting headers:', error);
      return { 'Content-Type': 'application/json' };
    }
  };

  // ================================
  // SEARCH PRODUCTS - COMPLETE FIX
  // ================================

  searchProductsAPI = async (query: string): Promise<SearchResponse> => {
    console.log('========================================');
    console.log('🔍 [SearchApi] searchProductsAPI CALLED');
    console.log('========================================');
    console.log('🔍 Query:', query);
    console.log('🔍 API_BASE_URL:', API_BASE_URL);
    console.log(
      '🔍 API_ENDPOINTS.SEARCH_PRODUCTS:',
      API_ENDPOINTS.SEARCH_PRODUCTS,
    );

    if (!query || !query.trim()) {
      console.log('❌ [SearchApi] Empty query');
      return { success: false, data: [] };
    }

    try {
      // ✅ Build URL - API_BASE_URL already has /api/v0
      const url = `${API_BASE_URL}${API_ENDPOINTS.SEARCH_PRODUCTS}?q=${encodeURIComponent(query.trim())}`;
      console.log('🔍 [SearchApi] FULL URL:', url);

      const headers = await this.getHeaders();

      console.log('🔍 [SearchApi] Making fetch request...');
      const startTime = Date.now();

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      const endTime = Date.now();
      console.log(
        `🔍 [SearchApi] Request completed in ${endTime - startTime}ms`,
      );
      console.log('🔍 [SearchApi] Response Status:', response.status);
      console.log('🔍 [SearchApi] Response OK:', response.ok);

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
          console.error('❌ [SearchApi] Error Response:', errorText);
        } catch (e) {
          console.error('❌ [SearchApi] Could not read error body');
        }
        console.log('========================================');
        return {
          success: false,
          data: [],
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      console.log(
        '🔍 [SearchApi] Raw response:',
        JSON.stringify(data, null, 2),
      );

      // ✅ Check if data exists - ignore success flag
      if (data?.data && Array.isArray(data.data)) {
        console.log(`✅ [SearchApi] Found ${data.data.length} categories`);
        if (data.data.length > 0) {
          console.log('✅ [SearchApi] First category:', data.data[0]?.category);
          console.log(
            '✅ [SearchApi] Products in first category:',
            data.data[0]?.products?.length || 0,
          );
        }
        console.log('========================================');
        return {
          success: true,
          query: data.query || query,
          data: data.data,
        };
      }

      // ✅ Fallback: if response is array directly
      if (Array.isArray(data)) {
        console.log(
          `✅ [SearchApi] Found ${data.length} categories (array format)`,
        );
        console.log('========================================');
        return { success: true, data };
      }

      // ✅ Fallback: if response has results
      if (data?.results && Array.isArray(data.results)) {
        console.log(
          `✅ [SearchApi] Found ${data.results.length} categories (results format)`,
        );
        console.log('========================================');
        return { success: true, data: data.results };
      }

      console.log('⚠️ [SearchApi] No results found');
      console.log('========================================');
      return { success: false, data: [] };
    } catch (error: any) {
      console.log('========================================');
      console.log('❌ [SearchApi] SEARCH ERROR');
      console.log('========================================');
      console.error('🔴 Error Name:', error.name);
      console.error('🔴 Error Message:', error.message);
      console.error('🔴 Error Stack:', error.stack);
      console.log('========================================');
      return { success: false, data: [], message: error.message };
    }
  };

  // ================================
  // GET RECENT SEARCHES
  // ================================

  getRecentSearchesAPI = async (): Promise<RecentSearch[]> => {
    console.log('📝 [SearchApi] getRecentSearchesAPI STARTED');

    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.RECENT_SEARCHES}`;
      console.log('📝 [SearchApi] URL:', url);

      const headers = await this.getHeaders();

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      console.log('📝 [SearchApi] Response Status:', response.status);

      if (!response.ok) {
        console.error('❌ [SearchApi] HTTP Error:', response.status);
        return [];
      }

      const data = await response.json();
      console.log(
        '📝 [SearchApi] Raw response:',
        JSON.stringify(data, null, 2),
      );

      if (data?.searches && Array.isArray(data.searches)) {
        console.log(
          `✅ [SearchApi] Found ${data.searches.length} recent searches`,
        );
        return data.searches;
      }

      if (Array.isArray(data)) {
        console.log(
          `✅ [SearchApi] Found ${data.length} recent searches (array)`,
        );
        return data;
      }

      console.log('⚠️ [SearchApi] No recent searches found');
      return [];
    } catch (error) {
      console.error('❌ [SearchApi] Recent searches error:', error);
      return [];
    }
  };

  // ================================
  // GET POPULAR SEARCHES
  // ================================

  getPopularSearchesAPI = async (): Promise<PopularSearch[]> => {
    console.log('📊 [SearchApi] getPopularSearchesAPI STARTED');

    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.POPULAR_SEARCHES}`;
      console.log('📊 [SearchApi] URL:', url);

      const headers = await this.getHeaders();

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      console.log('📊 [SearchApi] Response Status:', response.status);

      if (!response.ok) {
        console.error('❌ [SearchApi] HTTP Error:', response.status);
        return [];
      }

      const data = await response.json();
      console.log(
        '📊 [SearchApi] Raw response:',
        JSON.stringify(data, null, 2),
      );

      if (data?.searches && Array.isArray(data.searches)) {
        console.log(
          `✅ [SearchApi] Found ${data.searches.length} popular searches`,
        );
        return data.searches.slice(0, 10);
      }

      if (Array.isArray(data)) {
        console.log(
          `✅ [SearchApi] Found ${data.length} popular searches (array)`,
        );
        return data.slice(0, 10);
      }

      console.log('⚠️ [SearchApi] No popular searches found');
      return [];
    } catch (error) {
      console.error('❌ [SearchApi] Popular searches error:', error);
      return [];
    }
  };

  // ================================
  // REMOVE RECENT SEARCH
  // ================================

  removeRecentSearchAPI = async (
    searchId: string,
  ): Promise<{ success: boolean }> => {
    console.log('🗑️ [SearchApi] removeRecentSearchAPI called:', searchId);

    if (!searchId) {
      console.log('❌ [SearchApi] No search ID provided');
      return { success: false };
    }

    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.REMOVE_RECENT_SEARCH}/${searchId}`;
      console.log('🗑️ [SearchApi] URL:', url);

      const headers = await this.getHeaders();

      const response = await fetch(url, {
        method: 'DELETE',
        headers: headers,
      });

      console.log('🗑️ [SearchApi] Response Status:', response.status);

      if (!response.ok) {
        console.error('❌ [SearchApi] HTTP Error:', response.status);
        return { success: false };
      }

      console.log('✅ [SearchApi] Search removed successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ [SearchApi] Remove search error:', error);
      return { success: false };
    }
  };

  // ================================
  // CLEAR ALL RECENT SEARCHES
  // ================================

  clearAllRecentSearchesAPI = async (): Promise<{ success: boolean }> => {
    console.log('🗑️ [SearchApi] clearAllRecentSearchesAPI STARTED');

    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.CLEAR_RECENT_SEARCHES}`;
      console.log('🗑️ [SearchApi] URL:', url);

      const headers = await this.getHeaders();

      const response = await fetch(url, {
        method: 'DELETE',
        headers: headers,
      });

      console.log('🗑️ [SearchApi] Response Status:', response.status);

      if (!response.ok) {
        console.error('❌ [SearchApi] HTTP Error:', response.status);
        return { success: false };
      }

      console.log('✅ [SearchApi] All searches cleared');
      return { success: true };
    } catch (error) {
      console.error('❌ [SearchApi] Clear searches error:', error);
      return { success: false };
    }
  };
}

export const searchApi = new SearchApi();
