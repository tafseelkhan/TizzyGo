import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { TIZZYGO_API_BASE_URL } from '../../connections/snippet/apiBaseUrl';
import { apiRequest } from '../../../core/utils/handler/apiClient';

// ================================
// TYPES
// ================================

export interface LikeStatusResponse {
  liked: boolean;
  count: number;
}

// ================================
// FETCH LIKE STATUS — authenticated
// ================================

export const fetchLikeStatusAPI = async (
  productId: string,
): Promise<LikeStatusResponse> => {
  const data = await apiRequest<any>(
    `${TIZZYGO_API_BASE_URL}${API_ENDPOINTS.FETCH_LIKE_STATUS}/${productId}`,
  );

  return {
    liked: !!data?.liked,
    count: data?.count || 0,
  };
};

// ================================
// TOGGLE LIKE — authenticated
// ================================

export const toggleLikeAPI = async (
  productId: string,
): Promise<LikeStatusResponse> => {
  const data = await apiRequest<any>(
    `${TIZZYGO_API_BASE_URL}${API_ENDPOINTS.TOGGLE_LIKE}`,
    {
      method: 'POST',
      body: JSON.stringify({ productId }),
    },
  );

  return {
    liked: !!data?.liked,
    count: data?.count || 0,
  };
};