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
    email?: string;
    image?: string;
  };
  rating: number;
  review: string;
  images: any[];
  createdAt: string;
  updatedAt: string;
}

export interface SubmitReviewData {
  productId: string;
  rating: number;
  review?: string;
  images?: string[];
}

// ================================
// RATING API CLASS
// ================================

class RatingAPI {
  // ================================
  // GET RATING STATS — public
  // ================================

  getRatingStats = async (productId: string): Promise<RatingStats | null> => {
    if (!productId) {
      console.error('Product ID is required for getting rating stats');
      return null;
    }

    try {
      const data = await apiRequest<any>(
        apiUrl(`${API_ENDPOINTS.GET_RATING_STATS}/${productId}`),
        {
          auth: false,
          retryOnUnauthorized: false,
        },
      );

      return data?.success ? data.data : null;
    } catch (error) {
      console.error('Get rating stats error:', error);
      return null;
    }
  };

  // ================================
  // GET REVIEWS — public
  // ================================

  getReviews = async (
    productId: string,
    limit: number = 10,
  ): Promise<Review[]> => {
    if (!productId) {
      console.error('Product ID is required for getting reviews');
      return [];
    }

    try {
      const data = await apiRequest<any>(
        apiUrl(`${API_ENDPOINTS.GET_REVIEWS}/${productId}?limit=${limit}`),
        {
          auth: false,
          retryOnUnauthorized: false,
        },
      );

      return data?.success ? data.data || [] : [];
    } catch (error) {
      console.error('Get reviews error:', error);
      return [];
    }
  };

  // ================================
  // GET USER REVIEW — authenticated
  // ================================

  getUserReview = async (productId: string): Promise<Review | null> => {
    if (!productId) {
      console.error('Product ID is required for getting user review');
      return null;
    }

    try {
      const data = await apiRequest<any>(
        apiUrl(`${API_ENDPOINTS.GET_USER_REVIEW}/${productId}`),
      );

      return data?.success && data?.data ? data.data : null;
    } catch (error) {
      if (isAuthError(error)) {
        return null;
      }

      console.error('Get user review error:', error);
      return null;
    }
  };

  // ================================
  // SUBMIT REVIEW — authenticated
  // ================================

  submitReview = async (
    reviewData: SubmitReviewData,
    reviewId?: string,
  ): Promise<boolean> => {
    if (!reviewData.productId) {
      console.error('Product ID is required for submitting review');
      return false;
    }

    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      console.error('Valid rating (1-5) is required for submitting review');
      return false;
    }

    try {
      const path = reviewId
        ? `${API_ENDPOINTS.UPDATE_REVIEW}/${reviewId}`
        : API_ENDPOINTS.CREATE_REVIEW;

      const data = await apiRequest<any>(apiUrl(path), {
        method: reviewId ? 'PUT' : 'POST',
        body: JSON.stringify({
          productId: reviewData.productId,
          rating: reviewData.rating,
          review: reviewData.review || '',
          images: reviewData.images || [],
        }),
      });

      return !!data?.success;
    } catch (error) {
      if (isAuthError(error)) {
        console.error('Submit review: auth failed');
        return false;
      }

      console.error('Submit review error:', error);
      return false;
    }
  };

  // ================================
  // DELETE REVIEW — authenticated
  // ================================

  deleteReview = async (reviewId: string): Promise<boolean> => {
    if (!reviewId) {
      console.error('Review ID is required for deleting review');
      return false;
    }

    try {
      await apiRequest(
        apiUrl(`${API_ENDPOINTS.DELETE_REVIEW}/${reviewId}`),
        { method: 'DELETE' },
      );

      return true;
    } catch (error) {
      if (isAuthError(error)) {
        console.error('Delete review: auth failed');
        return false;
      }

      console.error('Delete review error:', error);
      return false;
    }
  };
}

// Export singleton instance
export const ratingAPI = new RatingAPI();