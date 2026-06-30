// hooks/useSearch.ts
import { useState, useEffect, useCallback } from 'react';
import { searchService } from '../services/buyers/home/searchService';
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
}

export const useSearch = (): UseSearchReturn => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [showAllPopular, setShowAllPopular] = useState(false);

  const fetchRecentSearches = useCallback(async () => {
    const searches = await searchService.getRecentSearches();
    setRecentSearches(searches);
  }, []);

  const fetchPopularSearches = useCallback(async () => {
    const searches = await searchService.getPopularSearches();
    setPopularSearches(searches);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    const results = await searchService.searchProducts(query);
    setSearchResults(results);
    setSearchLoading(false);
  }, []);

  const handleRemoveRecentSearch = useCallback(
    async (searchId: string) => {
      await searchService.removeRecentSearch(searchId);
      await fetchRecentSearches();
    },
    [fetchRecentSearches],
  );

  const handleClearAllRecentSearches = useCallback(async () => {
    await searchService.clearAllRecentSearches();
    setRecentSearches([]);
    setShowAllRecent(false);
  }, []);

  const getTotalProductsCount = useCallback((): number => {
    return searchService.getTotalProductsCount(searchResults);
  }, [searchResults]);

  // Initial load
  useEffect(() => {
    fetchRecentSearches();
    fetchPopularSearches();

    const interval = setInterval(fetchPopularSearches, 30000);
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
  };
};
