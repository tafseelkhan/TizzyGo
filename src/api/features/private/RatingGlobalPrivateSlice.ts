// ============================================================
// api/features/private/RatingGlobalPrivateSlice.ts
// ============================================================

import Config from 'react-native-config';
import { jwtDecode } from 'jwt-decode';

import { getToken } from '../../connections/token/tokenSlice';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { fetchHandler } from '../../../core/utils/handler/fetchHandler';
import { API_BASE_URL } from '../../connections/snippet/apiBaseUrl';

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
// TOKEN HELPER
// ================================

const getHeaders = async () => {
  const token = await getToken();

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

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
// ✅ FETCH RATING STATS
// GET /api/v0/rating-review/rating/stats/:productId
// ================================

export const fetchRatingStatsAPI = async (
  productId: string,
): Promise<RatingStats> => {
  try {
    console.log('📊 fetchRatingStatsAPI called with productId:', productId);

    // ✅ FIXED: Correct URL format
    const url = `${API_BASE_URL}${API_ENDPOINTS.RATING_GLOBAL_STATS}/${productId}`;
    console.log('📤 URL:', url);

    const data = await fetchHandler(url, {
      method: 'GET',
      headers: await getHeaders(),
    });

    console.log('📥 Response data:', data);

    // ✅ Backend returns: { success: true, data: { ... } }
    const statsData = data?.data || data;

    return {
      totalRatings: statsData?.totalRatings || 0,
      averageRating: statsData?.averageRating?.toString() || '0.0',
      percentage: statsData?.percentage?.toString() || '0%',
      distribution: statsData?.distribution || [0, 0, 0, 0, 0],
      totalReviews: statsData?.totalReviews || 0,
    };
  } catch (error: any) {
    console.error('❌ fetchRatingStatsAPI error:', error.message);
    // ✅ Return default stats on error
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
// ✅ FETCH REVIEWS WITH USER DATA
// GET /api/v0/rating-review/rating/reviews/:productId?page=1&limit=10
// ================================

export const fetchReviewsWithUserDataAPI = async (
  productId: string,
  page: number = 1,
  limit: number = 10,
): Promise<Review[]> => {
  try {
    console.log(
      '📚 fetchReviewsWithUserDataAPI called with productId:',
      productId,
    );

    // ✅ FIXED: Correct URL format
    const url = `${API_BASE_URL}${API_ENDPOINTS.REVIEWS}/${productId}?page=${page}&limit=${limit}`;
    console.log('📤 URL:', url);

    const data = await fetchHandler(url, {
      method: 'GET',
      headers: await getHeaders(),
    });

    console.log('📥 Response data:', data?.length || 0, 'reviews');

    // ✅ Backend returns: { success: true, data: [ ... ] }
    return data?.data || data || [];
  } catch (error: any) {
    console.error('❌ fetchReviewsWithUserDataAPI error:', error.message);
    return [];
  }
};

// ================================
// ✅ SUBMIT REVIEW
// POST /api/v0/rating-review/rating
// PUT /api/v0/rating-review/rating/:reviewId
// ================================

export const submitReviewAPI = async (submitData: any, reviewId?: string) => {
  try {
    console.log('📝 submitReviewAPI called with reviewId:', reviewId);

    // ✅ FIXED: Correct URL format
    const endpoint = reviewId
      ? `${API_BASE_URL}${API_ENDPOINTS.REVIEW}/${reviewId}` // PUT for update
      : `${API_BASE_URL}${API_ENDPOINTS.REVIEW}`; // POST for create

    console.log('📤 URL:', endpoint);

    const data = await fetchHandler(endpoint, {
      method: reviewId ? 'PUT' : 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({
        productId: submitData.productId,
        rating: submitData.rating,
        review: submitData.review || '',
        images: submitData.images || [],
      }),
    });

    console.log('✅ Review submitted successfully');

    // ✅ Backend returns: { success: true, data: { ... } }
    return data?.data || data;
  } catch (error: any) {
    console.error('❌ submitReviewAPI error:', error.message);
    throw error;
  }
};

// ================================
// ✅ DELETE REVIEW
// DELETE /api/v0/rating-review/:ratingReviewId
// ================================

export const deleteReviewAPI = async (reviewId: string): Promise<void> => {
  try {
    console.log('🗑️ deleteReviewAPI called with reviewId:', reviewId);

    // ✅ FIXED: Correct URL format
    const url = `${API_BASE_URL}${API_ENDPOINTS.REVIEW_DELETE}/${reviewId}`;
    console.log('📤 URL:', url);

    await fetchHandler(url, {
      method: 'DELETE',
      headers: await getHeaders(),
    });

    console.log('✅ Review deleted successfully');
  } catch (error: any) {
    console.error('❌ deleteReviewAPI error:', error.message);
    throw error;
  }
};

// ================================
// ✅ FETCH USER RATING
// GET /api/v0/rating-review/rating/user/:productId
// ================================

export const fetchUserRatingAPI = async (productId: string) => {
  try {
    console.log('👤 fetchUserRatingAPI called with productId:', productId);

    // ✅ FIXED: Correct URL format
    const url = `${API_BASE_URL}${API_ENDPOINTS.USER_RATING}/${productId}`;
    console.log('📤 URL:', url);

    const data = await fetchHandler(url, {
      method: 'GET',
      headers: await getHeaders(),
    });

    console.log('📥 Response data:', data);

    // ✅ Backend returns: { success: true, data: { ... } }
    return data?.data || data;
  } catch (error: any) {
    if (error?.message?.includes('404') || error?.status === 404) {
      return null;
    }

    console.error('❌ fetchUserRatingAPI error:', error.message);
    throw error;
  }
};
