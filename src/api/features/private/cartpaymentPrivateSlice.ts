// src/api/features/private/paymentPrivateSlice.ts
import { TIZZYGO_API_BASE_URL } from '../../connections/snippet/apiBaseUrl';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import {
  apiRequest,
  ApiError,
} from '../../../core/utils/handler/apiClient';

// ============================================================
// SAFE URL JOINER — guards against undefined base URL
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
// 1. CREATE PAYMENT INTENT
// ================================

export const createPaymentIntentAPI = async (
  address: any,
  paymentMethod: 'online' | 'cod',
  idempotencyKey?: string,
) => {
  const data = await apiRequest(
    apiUrl(API_ENDPOINTS.CREATE_PAYMENT_INTENT),
    {
      method: 'POST',
      body: JSON.stringify({
        address,
        paymentMethod,
        idempotencyKey,
      }),
    },
  );

  return data;
};

// ================================
// 2. PROCESS PAYMENT (Razorpay / Online)
// ================================

export const processPaymentAPI = async (
  checkoutSessionId: string,
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
) => {
  const requestBody = {
    checkoutSessionId,
    paymentType: 'normal',
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  };

  const data = await apiRequest(apiUrl(API_ENDPOINTS.PROCESS_PAYMENT), {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });

  return data;
};

// ================================
// 3. CONFIRM COD ORDER
// ================================

export const confirmCODAPI = async (checkoutSessionId: string) => {
  const data = await apiRequest(apiUrl(API_ENDPOINTS.CONFIRM_COD), {
    method: 'POST',
    body: JSON.stringify({ checkoutSessionId }),
  });

  return data;
};

// ================================
// 4. GET SESSION STATUS
// ================================

export const getSessionStatusAPI = async (
  checkoutSessionId: string,
): Promise<any> => {
  try {
    const data = await apiRequest(
      apiUrl(`${API_ENDPOINTS.GET_SESSION_STATUS}/${checkoutSessionId}`),
    );

    return data;
  } catch (error) {
    if (isAuthError(error)) {
      return {
        success: false,
        error: 'Please login again.',
      };
    }

    return {
      success: false,
      error:
        error instanceof ApiError
          ? error.message
          : 'Failed to get session status',
    };
  }
};

// ================================
// 5. GET ORDER DETAILS (Alias)
// ================================

export const getOrderDetailsAPI = async (
  checkoutSessionId: string,
): Promise<any> => {
  return getSessionStatusAPI(checkoutSessionId);
};