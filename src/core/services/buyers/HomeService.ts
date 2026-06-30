// services/apiService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';

// Base URL - aapka local IP ya production URL
const BASE_URL = 'http://192.168.250.121:5000';
const CART_BASE_URL = 'http://192.168.250.121:5000';

// Internal API Key
const INTERNAL_API_KEY =
  '23ebd585-0ff0-4750-8fd7-76bd88b57dbf8bf28ac1-a29a-43ad-b481-2c20ae04b455';

// Navigation reference for handling redirects
let navigationRef: any = null;

export const setNavigationRef = (nav: any) => {
  navigationRef = nav;
};

// Common headers
const getHeaders = async (includeAuth: boolean = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-internal-key': INTERNAL_API_KEY,
  };

  if (includeAuth) {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Error handler
const handleError = (error: any, customMessage?: string) => {
  console.error(`❌ ${customMessage || 'API Error'}:`, error);

  // Show alert for major errors (optional)
  if (customMessage?.includes('failed') || error.message?.includes('failed')) {
    Alert.alert(
      'Error',
      customMessage || error.message || 'Something went wrong',
    );
  }

  throw error;
};

// Auth Utility Functions
export const AuthUtils = {
  checkToken: async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token;
    } catch (error) {
      console.error('Token check error:', error);
      return null;
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    const token = await AuthUtils.checkToken();
    return !!token;
  },

  checkAuthAndRedirect: async (): Promise<boolean> => {
    const token = await AuthUtils.checkToken();
    if (!token) {
      // Use navigation ref if available, otherwise just return false
      if (navigationRef) {
        navigationRef.navigate('LoginScreen');
      }
      return false;
    }
    return true;
  },

  logout: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      if (navigationRef) {
        navigationRef.navigate('LoginScreen');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  getStoredUserData: async (): Promise<any> => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get user data error:', error);
      return null;
    }
  },
};

export const APIs = {
  // Search products (public)
  searchProducts: async (query: string, category?: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('No auth token found');

      const url = new URL(`${BASE_URL}/api/search`);
      url.searchParams.append('q', query);
      if (category) url.searchParams.append('category', category);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: await getHeaders(true),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Search failed:', errorText);
        throw new Error('Search failed');
      }

      return await response.json();
    } catch (error) {
      return handleError(error, 'Search failed');
    }
  },

  getPopularSearches: async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/search/popular`, {
        method: 'GET',
        headers: await getHeaders(false),
      });

      if (!response.ok) throw new Error('Failed to fetch popular searches');
      return await response.json();
    } catch (error) {
      return handleError(error, 'Failed to fetch popular searches');
    }
  },

  // ✅ Updated: Changed from /api/recent-search to /api/search/recent
  getRecentSearches: async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log('Token from AsyncStorage:', token);

      if (!token) throw new Error('No token found');

      const response = await fetch(`${BASE_URL}/api/search/recent`, {
        method: 'GET',
        headers: await getHeaders(true),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch recent searches:', errorText);
        throw new Error('Failed to fetch recent searches');
      }

      const data = await response.json();
      console.log('✅ Recent searches response data:', data);

      // Return searches array
      return data.searches || [];
    } catch (error) {
      return handleError(error, 'Failed to fetch recent searches');
    }
  },

  // ✅ Updated: Changed from /api/recent-search to /api/search/recent
  removeRecentSearch: async (id: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/search/recent/${id}`, {
        method: 'DELETE',
        headers: await getHeaders(true),
      });

      if (!response.ok) throw new Error('Failed to remove recent search');
      return await response.json();
    } catch (error) {
      return handleError(error, 'Failed to remove recent search');
    }
  },

  // ✅ Updated: Changed from /api/recent-search/clear to /api/search/recent/clear/all
  clearAllRecentSearches: async (): Promise<{
    success: boolean;
    message?: string;
    deletedCount?: number;
  }> => {
    try {
      const response = await fetch(`${BASE_URL}/api/search/recent/clear/all`, {
        method: 'DELETE',
        headers: await getHeaders(true),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Backend response:', text);
        throw new Error('Failed to clear recent searches');
      }

      return await response.json();
    } catch (error) {
      return handleError(error, 'Failed to clear recent searches');
    }
  },

  getCartCount: async () => {
    try {
      const response = await fetch(`${CART_BASE_URL}/api/cart/count`, {
        method: 'GET',
        headers: await getHeaders(true),
      });

      if (!response.ok) throw new Error('Failed to fetch cart count');
      return await response.json();
    } catch (error) {
      return handleError(error, 'Failed to fetch cart count');
    }
  },

  applyFilters: async (filters: any) => {
    try {
      const response = await fetch(`${BASE_URL}/api/products/filter`, {
        method: 'POST',
        headers: await getHeaders(true),
        body: JSON.stringify(filters),
      });

      if (!response.ok) throw new Error('Filter application failed');
      return await response.json();
    } catch (error) {
      return handleError(error, 'Filter application failed');
    }
  },

  getAppliedFiltersCount: async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/filters/count`, {
        method: 'GET',
        headers: await getHeaders(true),
      });

      if (!response.ok) throw new Error('Failed to fetch filters count');
      return await response.json();
    } catch (error) {
      return handleError(error, 'Failed to fetch filters count');
    }
  },

  clearFilters: async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/filters/clear`, {
        method: 'POST',
        headers: await getHeaders(true),
      });

      if (!response.ok) throw new Error('Failed to clear filters');
      return await response.json();
    } catch (error) {
      return handleError(error, 'Failed to clear filters');
    }
  },

  getLocations: async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/locations/popular`, {
        method: 'GET',
        headers: await getHeaders(false), // No auth needed for locations
      });

      if (!response.ok) throw new Error('Failed to fetch locations');
      return await response.json();
    } catch (error) {
      return handleError(error, 'Failed to fetch locations');
    }
  },
};

// Additional utility functions for React Native
export const APIUtils = {
  // Network status check
  isOnline: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      return response.ok;
    } catch {
      return false;
    }
  },

  // ✅ FIXED: Retry mechanism with correct setTimeout typing
  retryApiCall: async <T>(
    apiCall: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
  ): Promise<T> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        if (attempt === maxRetries) throw error;

        console.log(`Retry attempt ${attempt} after ${delay}ms`);
        // ✅ FIXED: Using void instead of resolve parameter
        await new Promise<void>(resolve => {
          setTimeout(() => {
            resolve();
          }, delay);
        });
      }
    }
    throw new Error('Max retries exceeded');
  },

  // Cache management
  setCache: async (key: string, data: any, ttl: number = 300000) => {
    // 5 minutes default
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  getCache: async (key: string): Promise<any> => {
    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const isExpired = Date.now() - cacheData.timestamp > cacheData.ttl;

      if (isExpired) {
        await AsyncStorage.removeItem(`cache_${key}`);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },
};

// Enhanced API service with caching
export const CachedAPIs = {
  getPopularSearches: async () => {
    const cacheKey = 'popular_searches';
    const cached = await APIUtils.getCache(cacheKey);

    if (cached) {
      console.log('✅ Returning cached popular searches');
      return cached;
    }

    const data = await APIs.getPopularSearches();
    await APIUtils.setCache(cacheKey, data, 300000); // Cache for 5 minutes
    return data;
  },

  getLocations: async () => {
    const cacheKey = 'popular_locations';
    const cached = await APIUtils.getCache(cacheKey);

    if (cached) {
      console.log('✅ Returning cached locations');
      return cached;
    }

    const data = await APIs.getLocations();
    await APIUtils.setCache(cacheKey, data, 600000); // Cache for 10 minutes
    return data;
  },
};

// Export everything
export default APIs;
