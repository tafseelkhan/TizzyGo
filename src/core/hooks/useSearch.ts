// hooks/useSearch.ts - COMPLETE FINAL VERSION

import { useState, useEffect, useCallback } from 'react';
import { searchApi } from '../../api/features/private/searchPrivateSlice';
import {
  SearchResult,
  PopularSearch,
  RecentSearch,
} from '../../api/features/private/searchPrivateSlice';

interface UseSearchReturn {
  searchResults: SearchResult[];
  searchLoading: boolean;
  popularSearches: PopularSearch[];
  recentSearches: RecentSearch[];
  showAllRecent: boolean;
  showAllPopular: boolean;
  setShowAllRecent: (show: boolean) => void;
  setShowAllPopular: (show: boolean) => void;
  handleSearch: (query: string) => Promise<void>;
  handleRemoveRecentSearch: (searchId: string) => Promise<void>;
  handleClearAllRecentSearches: () => Promise<void>;
  fetchRecentSearches: () => Promise<void>;
  fetchPopularSearches: () => Promise<void>;
  getTotalProductsCount: () => number;
  clearSearch: () => void; // ✅ ADDED - clears search results WITHOUT API call
}

export const useSearch = (): UseSearchReturn => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [showAllPopular, setShowAllPopular] = useState(false);

  // ✅ ADDED: Clear search results WITHOUT making API call
  const clearSearch = useCallback(() => {
    console.log(
      '🧹 [useSearch] clearSearch called - clearing results locally (NO API call)',
    );
    setSearchResults([]);
    setSearchLoading(false);
  }, []);

  const fetchRecentSearches = useCallback(async () => {
    console.log('📝 [useSearch] Fetching recent searches...');
    try {
      const searches = await searchApi.getRecentSearchesAPI();
      console.log(`📝 [useSearch] Found ${searches.length} recent searches`);
      setRecentSearches(searches);
    } catch (error) {
      console.error('❌ [useSearch] Error fetching recent searches:', error);
    }
  }, []);

  const fetchPopularSearches = useCallback(async () => {
    console.log('📊 [useSearch] Fetching popular searches...');
    try {
      const searches = await searchApi.getPopularSearchesAPI();
      console.log(`📊 [useSearch] Found ${searches.length} popular searches`);
      setPopularSearches(searches);
    } catch (error) {
      console.error('❌ [useSearch] Error fetching popular searches:', error);
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    console.log('========================================');
    console.log('🔍 [useSearch] handleSearch STARTED');
    console.log('========================================');
    console.log('🔍 Query:', query);
    console.log('🔍 Query length:', query?.length);

    if (!query || query.length < 2) {
      console.log('🔍 [useSearch] Query too short, clearing results');
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);

    try {
      console.log('🔍 [useSearch] Calling searchApi.searchProductsAPI...');
      const response = await searchApi.searchProductsAPI(query);

      console.log('🔍 [useSearch] Response received:');
      console.log('  - success:', response.success);
      console.log('  - data length:', response.data?.length || 0);
      console.log('  - results length:', response.results?.length || 0);

      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        console.log(
          `✅ [useSearch] Setting ${response.data.length} categories from data`,
        );
        setSearchResults(response.data);
      } else if (
        response.results &&
        Array.isArray(response.results) &&
        response.results.length > 0
      ) {
        console.log(
          `✅ [useSearch] Setting ${response.results.length} categories from results`,
        );
        setSearchResults(response.results);
      } else {
        console.log('⚠️ [useSearch] No results found');
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error('❌ [useSearch] Search error:', error.message);
      console.error('❌ [useSearch] Error stack:', error.stack);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
      console.log('========================================');
    }
  }, []);

  const handleRemoveRecentSearch = useCallback(
    async (searchId: string) => {
      console.log('🗑️ [useSearch] Removing search:', searchId);
      await searchApi.removeRecentSearchAPI(searchId);
      await fetchRecentSearches();
    },
    [fetchRecentSearches],
  );

  const handleClearAllRecentSearches = useCallback(async () => {
    console.log('🗑️ [useSearch] Clearing all recent searches');
    await searchApi.clearAllRecentSearchesAPI();
    setRecentSearches([]);
    setShowAllRecent(false);
  }, []);

  const getTotalProductsCount = useCallback((): number => {
    const count = searchResults.reduce((total, category) => {
      return total + (category.products?.length || 0);
    }, 0);
    console.log(`📊 [useSearch] Total products count: ${count}`);
    return count;
  }, [searchResults]);

  useEffect(() => {
    console.log('🔄 [useSearch] Initial load - fetching searches');
    fetchRecentSearches();
    fetchPopularSearches();

    const interval = setInterval(fetchPopularSearches, 300000);
    return () => clearInterval(interval);
  }, [fetchRecentSearches, fetchPopularSearches]);

  return {
    searchResults,
    searchLoading,
    popularSearches,
    recentSearches,
    showAllRecent,
    showAllPopular,
    setShowAllRecent,
    setShowAllPopular,
    handleSearch,
    handleRemoveRecentSearch,
    handleClearAllRecentSearches,
    fetchRecentSearches,
    fetchPopularSearches,
    getTotalProductsCount,
    clearSearch, // ✅ ADDED - returns clearSearch function
  };
};
