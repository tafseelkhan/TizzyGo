// ============================================================
// api/features/private/RatingGlobalPrivateSlice.ts
// ============================================================

import { jwtDecode } from 'jwt-decode';

import { getToken } from '../../connections/token/tokenSlice';
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

interface JwtPayload {
  userId?: string;
  _id?: string;
  id?: string;
}

export interface ReviewImage {
  url: string;
  publicId: string;
}

export interface User {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
}

export interface Review {
  _id: string;
  userId: User;
  rating: number;
  review: string;
  images: ReviewImage[];
  createdAt: string;
  updatedAt: string;
}

export interface RatingStats {
  totalRatings: number;
  averageRating: string;
  percentage: string;
  distribution: number[];
  totalReviews: number;
}

// ================================
// CURRENT USER ID
// ================================

export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const token = await getToken();

    if (!token) {
      return null;
    }

    const decoded = jwtDecode<JwtPayload>(token);

    return decoded.userId || decoded._id || decoded.id || null;
  } catch (error) {
    console.error('JWT Decode Error:', error);
    return null;
  }
};

// ================================
// ✅ FETCH RATING STATS — public
// GET /api/v0/rating-review/rating/stats/:productId
// ================================

export const fetchRatingStatsAPI = async (
  productId: string,
): Promise<RatingStats> => {
  try {
    const data = await apiRequest<any>(
      apiUrl(`${API_ENDPOINTS.RATING_GLOBAL_STATS}/${productId}`),
      {
        auth: false,
        retryOnUnauthorized: false,
      },
    );

    const statsData = data?.data || data;

    return {
      totalRatings: statsData?.totalRatings || 0,
      averageRating: statsData?.averageRating?.toString() || '0.0',
      percentage: statsData?.percentage?.toString() || '0%',
      distribution: statsData?.distribution || [0, 0, 0, 0, 0],
      totalReviews: statsData?.totalReviews || 0,
    };
  } catch (error) {
    console.error('❌ fetchRatingStatsAPI error:', error);
    return {
      totalRatings: 0,
      averageRating: '0.0',
      percentage: '0%',
      distribution: [0, 0, 0, 0, 0],
      totalReviews: 0,
    };
  }
};

// ================================
// ✅ FETCH REVIEWS WITH USER DATA — public
// GET /api/v0/rating-review/rating/reviews/:productId?page=1&limit=10
// ================================

export const fetchReviewsWithUserDataAPI = async (
  productId: string,
  page: number = 1,
  limit: number = 10,
): Promise<Review[]> => {
  try {
    const data = await apiRequest<any>(
      apiUrl(`${API_ENDPOINTS.REVIEWS}/${productId}?page=${page}&limit=${limit}`),
      {
        auth: false,
        retryOnUnauthorized: false,
      },
    );

    return data?.data || data || [];
  } catch (error) {
    console.error('❌ fetchReviewsWithUserDataAPI error:', error);
    return [];
  }
};

// ================================
// ✅ SUBMIT REVIEW — authenticated
// POST /api/v0/rating-review/rating
// PUT /api/v0/rating-review/rating/:reviewId
// ================================

export const submitReviewAPI = async (
  submitData: any,
  reviewId?: string,
) => {
  try {
    const path = reviewId
      ? `${API_ENDPOINTS.REVIEW}/${reviewId}`
      : API_ENDPOINTS.REVIEW;

    const data = await apiRequest<any>(apiUrl(path), {
      method: reviewId ? 'PUT' : 'POST',
      body: JSON.stringify({
        productId: submitData.productId,
        rating: submitData.rating,
        review: submitData.review || '',
        images: submitData.images || [],
      }),
    });

    return data?.data || data;
  } catch (error) {
    if (isAuthError(error)) {
      throw new Error('Please login to submit a review.');
    }
    console.error('❌ submitReviewAPI error:', error);
    throw error;
  }
};

// ================================
// ✅ DELETE REVIEW — authenticated
// DELETE /api/v0/rating-review/:ratingReviewId
// ================================

export const deleteReviewAPI = async (reviewId: string): Promise<void> => {
  try {
    await apiRequest(apiUrl(`${API_ENDPOINTS.REVIEW_DELETE}/${reviewId}`), {
      method: 'DELETE',
    });
  } catch (error) {
    if (isAuthError(error)) {
      throw new Error('Please login to delete a review.');
    }
    console.error('❌ deleteReviewAPI error:', error);
    throw error;
  }
};

// ================================
// ✅ FETCH USER RATING — authenticated
// GET /api/v0/rating-review/rating/user/:productId
// ================================

export const fetchUserRatingAPI = async (productId: string) => {
  try {
    const data = await apiRequest<any>(
      apiUrl(`${API_ENDPOINTS.USER_RATING}/${productId}`),
    );

    return data?.data || data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    if (isAuthError(error)) {
      return null;
    }
    console.error('❌ fetchUserRatingAPI error:', error);
    throw error;
  }
};