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
// FETCH COMMENTERS
// ================================

export const fetchCommentersAPI = async (productId: string) => {
  return await apiRequest(
    apiUrl(`${API_ENDPOINTS.FETCH_COMMENTERS}/${productId}`),
  );
};

// ================================
// FETCH COMMENTS
// ================================

export const fetchCommentsAPI = async (productId: string) => {
  return await apiRequest(
    apiUrl(`${API_ENDPOINTS.FETCH_COMMENTS}/${productId}`),
  );
};

// ================================
// FETCH USERS BATCH
// ================================

export const fetchUsersBatchAPI = async (userIds: string[]) => {
  return await apiRequest(apiUrl(API_ENDPOINTS.USERS_BATCH), {
    method: 'POST',
    body: JSON.stringify({ userIds }),
  });
};

// ================================
// ADD COMMENT
// ================================

export const addCommentAPI = async (
  productId: string,
  userId: string,
  content: string,
  media?: string,
  mediaType?: 'image' | 'gif',
) => {
  return await apiRequest(apiUrl(API_ENDPOINTS.ADD_COMMENT), {
    method: 'POST',
    body: JSON.stringify({
      postId: productId,
      userId,
      content: content.trim(),
      media,
      mediaType,
    }),
  });
};

// ================================
// ADD REPLY
// ================================

export const addReplyAPI = async (
  commentId: string,
  userId: string,
  content: string,
  media?: string,
  mediaType?: 'image' | 'gif',
) => {
  return await apiRequest(apiUrl(`${API_ENDPOINTS.ADD_REPLY}/${commentId}`), {
    method: 'POST',
    body: JSON.stringify({
      userId,
      content: content.trim(),
      media,
      mediaType,
    }),
  });
};

// ================================
// TOGGLE COMMENT LIKE
// ================================

export const toggleCommentLikeAPI = async (
  commentId: string,
  userId: string,
) => {
  return await apiRequest(
    apiUrl(`${API_ENDPOINTS.TOGGLE_COMMENT_LIKE}/${commentId}`),
    {
      method: 'POST',
      body: JSON.stringify({ userId }),
    },
  );
};

// ================================
// TOGGLE REPLY LIKE
// ================================

export const toggleReplyLikeAPI = async (
  commentId: string,
  replyId: string,
  userId: string,
) => {
  return await apiRequest(
    apiUrl(`${API_ENDPOINTS.TOGGLE_REPLY_LIKE}/${commentId}/${replyId}`),
    {
      method: 'POST',
      body: JSON.stringify({ userId }),
    },
  );
};

// ================================
// DELETE COMMENT
// ================================

export const deleteCommentAPI = async (commentId: string) => {
  return await apiRequest(
    apiUrl(`${API_ENDPOINTS.DELETE_COMMENT}/${commentId}`),
    { method: 'DELETE' },
  );
};

// ================================
// DELETE REPLY
// ================================

export const deleteReplyAPI = async (
  commentId: string,
  replyId: string,
) => {
  return await apiRequest(
    apiUrl(`${API_ENDPOINTS.DELETE_REPLY}/${commentId}/${replyId}`),
    { method: 'DELETE' },
  );
};