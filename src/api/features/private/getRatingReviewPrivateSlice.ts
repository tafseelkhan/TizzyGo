import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { TIZZYGO_API_BASE_URL } from '../../connections/snippet/apiBaseUrl';
import { apiRequest } from '../../../core/utils/handler/apiClient';

// ================================
// TYPES
// ================================

export interface RatingStats {
  totalRatings: number;
  averageRating: number;
  percentage: number;
  distribution: number[];
  totalReviews: number;
}

export interface Review {
  _id: string;
  userId: {
    _id: string;
    name: string;
    image?: string;
  };
  rating: number;
  review: string;
  createdAt: string;
  helpful?: number;
  images?: {
    url: string;
  }[];
}

// ================================
// GET RATING STATS — public (no auth needed)
// ================================

export const fetchRatingStats = async (
  productId: string,
): Promise<RatingStats | null> => {
  try {
    const data = await apiRequest<any>(
      `${TIZZYGO_API_BASE_URL}${API_ENDPOINTS.RATING_STATS}/${productId}`,
      {
        auth: false,
        retryOnUnauthorized: false,
      },
    );

    const statsData = data?.data || data;

    return {
      totalRatings: statsData?.totalRatings || 0,
      averageRating: statsData?.averageRating || 0,
      percentage: statsData?.percentage || 0,
      distribution: statsData?.distribution || [0, 0, 0, 0, 0],
      totalReviews: statsData?.totalReviews || 0,
    };
  } catch (error) {
    console.error('⚠️ Error fetching rating stats:', error);
    return null;
  }
};

// ================================
// GET REVIEWS — public (no auth needed)
// ================================

export const fetchReviews = async (
  productId: string,
  limit: number = 10,
): Promise<Review[]> => {
  try {
    const data = await apiRequest<any>(
      `${TIZZYGO_API_BASE_URL}${API_ENDPOINTS.PRODUCT_REVIEWS}/${productId}?limit=${limit}`,
      {
        auth: false,
        retryOnUnauthorized: false,
      },
    );

    const reviewsData = data?.data || data?.reviews || data;

    return Array.isArray(reviewsData) ? reviewsData : [];
  } catch (error) {
    console.error('⚠️ Error fetching reviews:', error);
    return [];
  }
};