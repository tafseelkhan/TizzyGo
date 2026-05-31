// services/searchService.ts
import {
  searchApi,
  SearchResult,
  PopularSearch,
  RecentSearch,
} from '../../../api/features/private/searchPrivateSlice';

class SearchService {
  async searchProducts(query: string): Promise<SearchResult[]> {
    if (query.length < 3) return [];

    const response = await searchApi.searchProductsAPI(query);
    if (response.success && response.results) {
      return response.results;
    }
    return [];
  }

  async getRecentSearches(): Promise<RecentSearch[]> {
    return await searchApi.getRecentSearchesAPI();
  }

  async getPopularSearches(): Promise<PopularSearch[]> {
    return await searchApi.getPopularSearchesAPI();
  }

  async removeRecentSearch(searchId: string): Promise<boolean> {
    const result = await searchApi.removeRecentSearchAPI(searchId);
    return result.success;
  }

  async clearAllRecentSearches(): Promise<boolean> {
    const result = await searchApi.clearAllRecentSearchesAPI();
    return result.success;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  getProductImageUrl(images: any[]): string {
    if (!images || images.length === 0) return '';
    const firstImage = images[0];
    if (typeof firstImage === 'string') return firstImage;
    if (firstImage?.urls?.length > 0) return firstImage.urls[0];
    if (firstImage?.url) return firstImage.url;
    return '';
  }

  getTotalProductsCount(searchResults: SearchResult[]): number {
    return searchResults.reduce((total, categoryResult) => {
      return total + (categoryResult?.products?.length || 0);
    }, 0);
  }
}

export const searchService = new SearchService();
