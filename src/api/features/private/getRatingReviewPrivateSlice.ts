import Config from 'react-native-config';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { fetchHandler } from '../../../core/utils/handler/fetchHandler';

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
// BASE URL
// ================================

const API_BASE_URL = Config.API_AXIOS_BASE_URL;

// ================================
// GET RATING STATS
// ================================

export const fetchRatingStats = async (
  productId: string,
): Promise<RatingStats | null> => {
  try {
    console.log(
      '📡 Fetching rating stats:',
      `${API_BASE_URL}${API_ENDPOINTS.RATING_STATS}/${productId}`,
    );

    const data = await fetchHandler(
      `${API_BASE_URL}${API_ENDPOINTS.RATING_STATS}/${productId}`,
      {
        method: 'GET',
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
// GET REVIEWS
// ================================

export const fetchReviews = async (
  productId: string,
  limit: number = 10,
): Promise<Review[]> => {
  try {
    console.log(
      '📡 Fetching reviews:',
      `${API_BASE_URL}${API_ENDPOINTS.PRODUCT_REVIEWS}/${productId}?limit=${limit}`,
    );

    const data = await fetchHandler(
      `${API_BASE_URL}${API_ENDPOINTS.PRODUCT_REVIEWS}/${productId}?limit=${limit}`,
      {
        method: 'GET',
      },
    );

    const reviewsData = data?.data || data?.reviews || data;

    return Array.isArray(reviewsData) ? reviewsData : [];
  } catch (error) {
    console.error('⚠️ Error fetching reviews:', error);
    return [];
  }
};
