import Config from 'react-native-config';
import { jwtDecode } from 'jwt-decode';

import { getToken } from '../../connections/token/tokenSlice';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { fetchHandler } from '../../../core/utils/handler/fetchHandler';

const API_BASE_URL = Config.API_AXIOS_BASE_URL;

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
// FETCH RATING STATS
// ================================

export const fetchRatingStatsAPI = async (
  productId: string,
): Promise<RatingStats> => {
  const data = await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.RATING_GLOBAL_STATS}/${productId}`,
    {
      method: 'GET',
      headers: await getHeaders(),
    },
  );

  return {
    totalRatings: data?.totalRatings || 0,
    averageRating: data?.averageRating?.toString() || '0',
    percentage: data?.percentage?.toString() || '0',
    distribution: data?.distribution || [0, 0, 0, 0, 0],
    totalReviews: data?.totalReviews || 0,
  };
};

// ================================
// FETCH REVIEWS
// ================================

export const fetchReviewsWithUserDataAPI = async (
  productId: string,
  page: number = 1,
  limit: number = 10,
): Promise<Review[]> => {
  const data = await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.REVIEWS}/${productId}?page=${page}&limit=${limit}`,
    {
      method: 'GET',
      headers: await getHeaders(),
    },
  );

  return data?.reviews || data || [];
};

// ================================
// SUBMIT REVIEW
// ================================

export const submitReviewAPI = async (
  submitData: any,
  reviewId?: string,
) => {
  const endpoint = reviewId
    ? `${API_BASE_URL}${API_ENDPOINTS.REVIEW}/${reviewId}`
    : `${API_BASE_URL}${API_ENDPOINTS.REVIEW}`;

  return await fetchHandler(endpoint, {
    method: reviewId ? 'PUT' : 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(submitData),
  });
};

// ================================
// DELETE REVIEW
// ================================

export const deleteReviewAPI = async (
  reviewId: string,
): Promise<void> => {
  await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.REVIEW}/${reviewId}`,
    {
      method: 'DELETE',
      headers: await getHeaders(),
    },
  );
};

// ================================
// FETCH USER RATING
// ================================

export const fetchUserRatingAPI = async (
  productId: string,
) => {
  try {
    const data = await fetchHandler(
      `${API_BASE_URL}${API_ENDPOINTS.USER_RATING}/${productId}`,
      {
        method: 'GET',
        headers: await getHeaders(),
      },
    );

    return data;
  } catch (error: any) {
    if (
      error?.message?.includes('404') ||
      error?.status === 404
    ) {
      return null;
    }

    throw error;
  }
};