// services/ratingService.ts
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  RawReview,
  Review,
  User,
  RatingStats,
} from "../types/HomeTypes";

// ✅ BASE URL aur TOKEN KEYS
const BASE_URL = 'http://192.168.42.121:5000';
const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// ✅ AUTH TOKEN UTILITY FUNCTIONS
export const getTokenFromStorage = async (): Promise<string> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    console.log('🔐 Token retrieved from storage:', token ? 'Yes' : 'No');
    return token || '';
  } catch (error) {
    console.error('❌ Error getting token from storage:', error);
    return '';
  }
};

export const setTokenInStorage = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    console.log('✅ Token saved to storage');
  } catch (error) {
    console.error('❌ Error saving token to storage:', error);
  }
};

export const clearTokensFromStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
    console.log('🗑️ Tokens cleared from storage');
  } catch (error) {
    console.error('❌ Error clearing tokens:', error);
  }
};

// ✅ AXIOS INTERCEPTORS SETUP
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axios.interceptors.request.use(
  async (config) => {
    // Don't add token for public endpoints
    const publicEndpoints = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh-token',
      '/api/rating-review/rating/stats'
    ];
    
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );
    
    if (!isPublicEndpoint) {
      const token = await getTokenFromStorage();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post(`${BASE_URL}/api/auth/refresh-token`, {
          refreshToken
        });
        
        const { token, refreshToken: newRefreshToken } = response.data;
        
        await setTokenInStorage(token);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        processQueue(null, token);
        return axios(originalRequest);
      } catch (refreshError) {
        await clearTokensFromStorage();
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// ✅ UTILITY FUNCTIONS FOR HEADERS
const getAuthHeaders = async () => {
  const token = await getTokenFromStorage();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

const getMultipartHeaders = async () => {
  const token = await getTokenFromStorage();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  };
};

// ✅ FETCH OVERALL RATING STATS FOR A PRODUCT
export const fetchStats = async (productId: string): Promise<RatingStats> => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/rating-review/rating/stats/${productId}`
    );
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error fetching stats:', error.message);
    throw error;
  }
};

// ✅ FETCH REVIEWS WITH USER DATA
export const fetchReviewsWithUserData = async (
  productId: string,
  page: number
): Promise<Review[]> => {
  try {
    // 1. Fetch reviews
    const reviewsResponse = await axios.get(
      `${BASE_URL}/api/rating-review/rating/reviews/${productId}`,
      { params: { page, limit: 10 } }
    );
    const reviewsData: RawReview[] = reviewsResponse.data.data;

    if (reviewsData.length === 0) {
      return [];
    }

    // 2. Extract user IDs
    const userIds = [...new Set(reviewsData.map((r) => r.userId))];

    let users: User[] = [];
    if (userIds.length > 0) {
      const token = await getTokenFromStorage();
      const userResponse = await axios.post(
        `${BASE_URL}/api/profile/users/batch`,
        { userIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      users = userResponse.data;
    }

    // 3. Map reviews with user data
    const mappedReviews: Review[] = reviewsData.map((review) => {
      let reviewUserId: string;
      
      if (review.userId && typeof review.userId === "object" && "_id" in review.userId) {
        reviewUserId = (review.userId as { _id: string })._id;
      } else if (typeof review.userId === "string") {
        reviewUserId = review.userId;
      } else {
        reviewUserId = "";
      }

      const user = users.find((u) => u._id.toString() === reviewUserId.toString());

      let imageSrc: string | undefined = undefined;
      if (user?.image) {
        if (user.image.startsWith("http") || user.image.startsWith("https")) {
          imageSrc = user.image;
        } else if (user.image.startsWith("/")) {
          imageSrc = `${BASE_URL}${user.image}`;
        } else {
          imageSrc = `${BASE_URL}/${user.image}`;
        }
      }

      const { userId: originalUserId, ...reviewWithoutUserId } = review;
      
      return {
        ...reviewWithoutUserId,
        _id: review._id,
        userId: {
          _id: reviewUserId,
          name: user?.name || "Unknown",
          image: imageSrc,
        },
        rating: review.rating,
        review: review.review || "",
        images: review.images || [],
        createdAt: review.createdAt,
        updatedAt: (review as any).updatedAt || review.createdAt || new Date().toISOString(),
      } as Review;
    });

    return mappedReviews;
  } catch (error: any) {
    console.error('❌ Error fetching reviews:', error.message);
    throw error;
  }
};

// ✅ SUBMIT OR UPDATE REVIEW
export const submitReview = async (
  reviewData: {
    productId: string;
    rating: number;
    review?: string;
    images?: string[];
  },
  reviewId?: string
) => {
  try {
    console.log(`📤 ${reviewId ? 'Updating' : 'Submitting'} review for product: ${reviewData.productId}`);
    console.log('📦 Review data:', {
      productId: reviewData.productId,
      rating: reviewData.rating,
      review: reviewData.review,
      imagesCount: reviewData.images?.length || 0
    });
    
    // ✅ Validate required fields
    if (!reviewData.productId) {
      throw new Error('Product ID is required');
    }
    
    if (reviewData.rating === undefined || reviewData.rating === null) {
      throw new Error('Rating is required');
    }
    
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    const token = await getTokenFromStorage();
    if (!token) {
      throw new Error('Authentication required. Please login.');
    }

    const endpoint = reviewId
      ? `${BASE_URL}/api/rating-review/rating/${reviewId}`
      : `${BASE_URL}/api/rating-review/rating`;
    const method = reviewId ? "put" : "post";
    
    console.log('📤 Making API request to:', endpoint);
    
    const response = await axios({
      method,
      url: endpoint,
      data: {
        productId: reviewData.productId,
        rating: reviewData.rating,
        review: reviewData.review || "",
        images: reviewData.images || [],
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      timeout: 30000, // 30 second timeout
    });

    console.log('✅ Review submitted successfully', response.data);
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error submitting review:', error);
    
    if (error.response) {
      console.error('🔍 Response data:', error.response.data);
      console.error('🔍 Response status:', error.response.status);
      
      const serverError = error.response.data?.error || error.response.data?.message;
      throw new Error(serverError || `Server error: ${error.response.status}`);
    } else if (error.request) {
      console.error('🔍 No response received');
      throw new Error('No response from server. Please check your network connection.');
    } else {
      console.error('🔍 Request setup error:', error.message);
      throw error;
    }
  }
};

// ✅ DELETE A REVIEW
export const deleteReview = async (reviewId: string) => {
  try {
    console.log(`🗑️ Deleting review: ${reviewId}`);
    
    if (!reviewId) {
      throw new Error('Review ID is required');
    }
    
    const token = await getTokenFromStorage();
    if (!token) {
      throw new Error('Authentication required. Please login.');
    }
    
    await axios.delete(
      `${BASE_URL}/api/rating-review/${reviewId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    console.log('✅ Review deleted successfully');
  } catch (error: any) {
    console.error('❌ Error deleting review:', error);
    
    if (error.response) {
      const serverError = error.response.data?.error || error.response.data?.message;
      throw new Error(serverError || `Server error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('No response from server. Please check your network connection.');
    } else {
      throw error;
    }
  }
};

// ✅ CHECK IF USER HAS ALREADY REVIEWED A PRODUCT
export const checkUserReview = async (
  productId: string
): Promise<Review | null> => {
  try {
    console.log(`🔍 Checking user review for product: ${productId}`);
    
    if (!productId) {
      console.log('⚠️ No product ID provided');
      return null;
    }
    
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${BASE_URL}/api/rating-review/user-review/${productId}`,
      headers
    );
    
    const reviewData = response.data.data;
    if (!reviewData) {
      console.log('✅ No existing review found');
      return null;
    }
    
    // Ensure updatedAt property exists
    const review: Review = {
      ...reviewData,
      updatedAt: reviewData.updatedAt || reviewData.createdAt || new Date().toISOString()
    };
    
    console.log('✅ Existing review found');
    return review;
  } catch (error: any) {
    console.error('❌ Error checking user review:', error);
    
    // Don't throw error if no review exists (404 is expected)
    if (error.response?.status === 404) {
      console.log('✅ No review found (404)');
      return null;
    }
    
    return null;
  }
};

// ✅ LOGOUT FUNCTION
export const logoutUser = async (): Promise<void> => {
  try {
    await clearTokensFromStorage();
    console.log('✅ User logged out successfully');
  } catch (error) {
    console.error('❌ Error logging out:', error);
    await clearTokensFromStorage();
  }
};

// ✅ EXPORT AXIOS INSTANCE
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Setup interceptors for apiClient
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getTokenFromStorage();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ ADD INTERCEPTOR FOR API CLIENT
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post(`${BASE_URL}/api/auth/refresh-token`, {
          refreshToken
        });
        
        const { token, refreshToken: newRefreshToken } = response.data;
        
        await setTokenInStorage(token);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        processQueue(null, token);
        return apiClient(originalRequest);
      } catch (refreshError) {
        await clearTokensFromStorage();
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);