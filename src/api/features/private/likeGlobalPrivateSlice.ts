import { getToken } from '../../connections/token/tokenSlice';
import Config from 'react-native-config';

import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { fetchHandler } from '../../../core/utils/handler/fetchHandler';
import { API_BASE_URL } from '../../connections/snippet/apiBaseUrl';

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
// TYPES
// ================================

export interface LikeStatusResponse {
  liked: boolean;
  count: number;
}

// ================================
// FETCH LIKE STATUS
// ================================

export const fetchLikeStatusAPI = async (
  productId: string,
): Promise<LikeStatusResponse> => {
  const data = await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.FETCH_LIKE_STATUS}/${productId}`,
    {
      method: 'GET',
      headers: await getHeaders(),
    },
  );

  return {
    liked: !!data?.liked,
    count: data?.count || 0,
  };
};

// ================================
// TOGGLE LIKE
// ================================

export const toggleLikeAPI = async (
  productId: string,
): Promise<LikeStatusResponse> => {
  const data = await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.TOGGLE_LIKE}`,
    {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({
        productId,
      }),
    },
  );

  return {
    liked: !!data?.liked,
    count: data?.count || 0,
  };
};
