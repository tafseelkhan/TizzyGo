import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { TIZZYGO_API_BASE_URL } from '../../connections/snippet/apiBaseUrl';
import { apiRequest } from '../../../core/utils/handler/apiClient';

// ============================================================
// SAFE URL JOINER
// ============================================================

const apiUrl = (path: string): string => {
  if (!TIZZYGO_API_BASE_URL) {
    throw new Error('TIZZYGO_API_BASE_URL is not configured.');
  }
  return `${TIZZYGO_API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
};

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
    apiUrl(`${API_ENDPOINTS.FETCH_LIKE_STATUS}/${productId}`),
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
    apiUrl(API_ENDPOINTS.TOGGLE_LIKE),
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