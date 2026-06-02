import Config from 'react-native-config';
import { getToken } from '../../connections/token/tokenSlice';
import { fetchHandler } from '../../../core/utils/handler/fetchHandler';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { API_BASE_URL } from '../../connections/snippet/apiBaseUrl';

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
  // TOKEN HEADERS
  // ================================

  private getHeaders = async (): Promise<Record<string, string>> => {
    try {
      const token = await getToken();

      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
    } catch (error) {
      console.error('Error getting headers:', error);
      return {
        'Content-Type': 'application/json',
      };
    }
  };

  // ================================
  // GET RATING STATS
  // ================================

  getRatingStats = async (productId: string): Promise<RatingStats | null> => {
    if (!productId) {
      console.error('Product ID is required for getting rating stats');
      return null;
    }

    try {
      const data = await fetchHandler(
        `${API_BASE_URL}${API_ENDPOINTS.GET_RATING_STATS}/${productId}`,
        {
          method: 'GET',
        },
      );

      if (data?.success) {
        return data.data;
      }

      return null;
    } catch (error) {
      console.error('Get rating stats error:', error);
      return null;
    }
  };

  // ================================
  // GET REVIEWS
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
      const data = await fetchHandler(
        `${API_BASE_URL}${API_ENDPOINTS.GET_REVIEWS}/${productId}?limit=${limit}`,
        {
          method: 'GET',
        },
      );

      if (data?.success) {
        return data.data || [];
      }

      return [];
    } catch (error) {
      console.error('Get reviews error:', error);
      return [];
    }
  };

  // ================================
  // GET USER REVIEW
  // ================================

  getUserReview = async (productId: string): Promise<Review | null> => {
    if (!productId) {
      console.error('Product ID is required for getting user review');
      return null;
    }

    try {
      const data = await fetchHandler(
        `${API_BASE_URL}${API_ENDPOINTS.GET_USER_REVIEW}/${productId}`,
        {
          method: 'GET',
          headers: await this.getHeaders(),
        },
      );

      if (data?.success && data?.data) {
        return data.data;
      }

      return null;
    } catch (error) {
      console.error('Get user review error:', error);
      return null;
    }
  };

  // ================================
  // SUBMIT REVIEW
  // ================================

  submitReview = async (
    reviewData: SubmitReviewData,
    reviewId?: string,
  ): Promise<boolean> => {
    // Validate required fields
    if (!reviewData.productId) {
      console.error('Product ID is required for submitting review');
      return false;
    }

    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      console.error('Valid rating (1-5) is required for submitting review');
      return false;
    }

    try {
      const endpoint = reviewId
        ? `${API_BASE_URL}${API_ENDPOINTS.UPDATE_REVIEW}/${reviewId}`
        : `${API_BASE_URL}${API_ENDPOINTS.CREATE_REVIEW}`;

      const data = await fetchHandler(endpoint, {
        method: reviewId ? 'PUT' : 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify({
          productId: reviewData.productId,
          rating: reviewData.rating,
          review: reviewData.review || '',
          images: reviewData.images || [],
        }),
      });

      return !!data?.success;
    } catch (error) {
      console.error('Submit review error:', error);
      return false;
    }
  };

  // ================================
  // DELETE REVIEW
  // ================================

  deleteReview = async (reviewId: string): Promise<boolean> => {
    if (!reviewId) {
      console.error('Review ID is required for deleting review');
      return false;
    }

    try {
      await fetchHandler(
        `${API_BASE_URL}${API_ENDPOINTS.DELETE_REVIEW}/${reviewId}`,
        {
          method: 'DELETE',
          headers: await this.getHeaders(),
        },
      );

      return true;
    } catch (error) {
      console.error('Delete review error:', error);
      return false;
    }
  };
}

// Export singleton instance
export const ratingAPI = new RatingAPI();
