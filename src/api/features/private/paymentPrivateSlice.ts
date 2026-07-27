// src/api/features/private/paymentPrivateSlice.ts - FINAL COMPLETE VERSION
import Config from 'react-native-config';
import { getToken } from '../../connections/token/tokenSlice';
import { fetchHandler } from '../../../core/utils/handler/fetchHandler';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { API_BASE_URL } from '../../connections/snippet/apiBaseUrl';

// ================================
// TOKEN HEADERS
// ================================

const getHeaders = async () => {
  const token = await getToken();

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// ================================
// 1. CREATE PAYMENT INTENT
// ================================

export const createPaymentIntentAPI = async (
  address: any,
  paymentMethod: 'online' | 'cod',
  idempotencyKey?: string,
) => {
  console.log('🚀 [paymentPrivateSlice] createPaymentIntentAPI CALLED');
  console.log('📋 Payment Method:', paymentMethod);
  console.log('🔑 Idempotency Key:', idempotencyKey);

  const data = await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.CREATE_PAYMENT_INTENT}`,
    {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({
        address,
        paymentMethod,
        idempotencyKey,
      }),
    },
  );

  console.log(
    '📥 createPaymentIntentAPI Response:',
    JSON.stringify(data, null, 2),
  );
  return data;
};

// ================================
// 2. PROCESS PAYMENT (Razorpay / Online)
// ================================

export const processPaymentAPI = async (
  checkoutSessionId: string,
  transactionId: string | null,
  paymentMethod: string,
  paymentType: string,
) => {
  console.log('💳 [paymentPrivateSlice] processPaymentAPI CALLED');
  console.log('📋 Checkout Session ID:', checkoutSessionId);
  console.log('📋 Transaction ID:', transactionId);
  console.log('📋 Payment Method:', paymentMethod);
  console.log('📋 Payment Type:', paymentType);

  const data = await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.PROCESS_PAYMENT}`,
    {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({
        checkoutSessionId,
        transactionId: transactionId || null,
        paymentMethod,
        paymentType,
      }),
    },
  );

  console.log('📥 processPaymentAPI Response:', JSON.stringify(data, null, 2));
  return data;
};

// ================================
// 3. CONFIRM COD ORDER
// ================================

export const confirmCODAPI = async (checkoutSessionId: string) => {
  console.log('📦 [paymentPrivateSlice] confirmCODAPI CALLED');
  console.log('📋 Checkout Session ID:', checkoutSessionId);

  const data = await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.CONFIRM_COD}`,
    {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({
        checkoutSessionId,
      }),
    },
  );

  console.log('📥 confirmCODAPI Response:', JSON.stringify(data, null, 2));
  return data;
};

// ================================
// 4. GET SESSION STATUS (NEW)
// ================================

export const getSessionStatusAPI = async (
  checkoutSessionId: string,
): Promise<any> => {
  console.log('🔍 [paymentPrivateSlice] getSessionStatusAPI CALLED');
  console.log('📋 Checkout Session ID:', checkoutSessionId);

  try {
    // ✅ FIX: API_ENDPOINTS.GET_SESSION_STATUS should be like '/checkout/session'
    // We'll append the checkoutSessionId to it
    const endpoint = `${API_ENDPOINTS.GET_SESSION_STATUS}/${checkoutSessionId}`;
    console.log('📍 Endpoint:', endpoint);

    const data = await fetchHandler(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: await getHeaders(),
    });

    console.log(
      '📥 getSessionStatusAPI Response:',
      JSON.stringify(data, null, 2),
    );
    return data;
  } catch (error: any) {
    console.error('❌ getSessionStatusAPI Error:', error.message);
    return {
      success: false,
      error: error?.message || 'Failed to get session status',
    };
  }
};

// ================================
// 5. GET ORDER DETAILS (NEW - Alias)
// ================================

export const getOrderDetailsAPI = async (
  checkoutSessionId: string,
): Promise<any> => {
  console.log('📋 [paymentPrivateSlice] getOrderDetailsAPI CALLED');
  console.log('📋 Checkout Session ID:', checkoutSessionId);

  // Reuse getSessionStatusAPI
  return await getSessionStatusAPI(checkoutSessionId);
};
