import Config from 'react-native-config';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { fetchHandler } from '../../../core/utils/handler/fetchHandler';
import { getToken } from '../../connections/token/tokenSlice';

const API_BASE_URL = Config.API_AXIOS_BASE_URL;

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
// FETCH COMMENTERS
// ================================

export const fetchCommentersAPI = async (productId: string) => {
  return await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.FETCH_COMMENTERS}/${productId}`,
    {
      method: 'GET',
      headers: await getHeaders(),
    },
  );
};

// ================================
// FETCH COMMENTS
// ================================

export const fetchCommentsAPI = async (productId: string) => {
  return await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.FETCH_COMMENTS}/${productId}`,
    {
      method: 'GET',
      headers: await getHeaders(),
    },
  );
};

// ================================
// FETCH USERS BATCH
// ================================

export const fetchUsersBatchAPI = async (userIds: string[]) => {
  return await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.USERS_BATCH}`,
    {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ userIds }),
    },
  );
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
  return await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.ADD_COMMENT}`,
    {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({
        postId: productId,
        userId,
        content: content.trim(),
        media,
        mediaType,
      }),
    },
  );
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
  return await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.ADD_REPLY}/${commentId}`,
    {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({
        userId,
        content: content.trim(),
        media,
        mediaType,
      }),
    },
  );
};

// ================================
// TOGGLE COMMENT LIKE
// ================================

export const toggleCommentLikeAPI = async (
  commentId: string,
  userId: string,
) => {
  return await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.TOGGLE_COMMENT_LIKE}/${commentId}`,
    {
      method: 'POST',
      headers: await getHeaders(),
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
  return await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.TOGGLE_REPLY_LIKE}/${commentId}/${replyId}`,
    {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ userId }),
    },
  );
};

// ================================
// DELETE COMMENT
// ================================

export const deleteCommentAPI = async (commentId: string) => {
  return await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.DELETE_COMMENT}/${commentId}`,
    {
      method: 'DELETE',
      headers: await getHeaders(),
    },
  );
};

// ================================
// DELETE REPLY
// ================================

export const deleteReplyAPI = async (
  commentId: string,
  replyId: string,
) => {
  return await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.DELETE_REPLY}/${commentId}/${replyId}`,
    {
      method: 'DELETE',
      headers: await getHeaders(),
    },
  );
};