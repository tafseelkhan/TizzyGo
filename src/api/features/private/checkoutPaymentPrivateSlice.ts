// src/api/features/private/checkoutPaymentPrivateSlice.ts - COMPLETE FIXED VERSION
import Config from 'react-native-config';
import { getToken } from '../../connections/token/tokenSlice';
import { fetchHandler } from '../../../core/utils/handler/fetchHandler';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { API_BASE_URL } from '../../connections/snippet/apiBaseUrl';

// ================================
// TYPES
// ================================

export interface CreatePaymentIntentParams {
  address: any;
  paymentMethod: 'online' | 'cod';
  idempotencyKey?: string;
  // ✅ BUY NOW PARAMS (optional - only sent for Buy Now)
  isBuyNow?: boolean;
  productId?: string;
  sellerId?: string;
  productDataId?: string;
  quantity?: number;
  variantId?: string;
}

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
// 1. CREATE PAYMENT INTENT - ✅ FIXED
// ================================

export const createPaymentIntentAPI = async (
  params: CreatePaymentIntentParams,
) => {
  console.log('🚀 [paymentPrivateSlice] createPaymentIntentAPI CALLED');
  console.log('📋 Payment Method:', params.paymentMethod);
  console.log('🔑 Idempotency Key:', params.idempotencyKey);
  console.log('🛒 isBuyNow:', params.isBuyNow);
  console.log('📦 productId:', params.productId);
  console.log('🏷️ sellerId:', params.sellerId);
  console.log('📋 productDataId:', params.productDataId);
  console.log('💰 quantity:', params.quantity);

  // ✅ BUILD REQUEST BODY WITH ALL PARAMS
  const requestBody: any = {
    address: params.address,
    paymentMethod: params.paymentMethod,
    idempotencyKey: params.idempotencyKey,
  };

  // ✅ ADD BUY NOW PARAMS IF PROVIDED
  if (params.isBuyNow) {
    requestBody.isBuyNow = true;
    if (params.productId) requestBody.productId = params.productId;
    if (params.sellerId) requestBody.sellerId = params.sellerId;
    if (params.productDataId) requestBody.productDataId = params.productDataId;
    if (params.quantity) requestBody.quantity = params.quantity;
    if (params.variantId) requestBody.variantId = params.variantId;
  }

  console.log('📤 Request Body:', JSON.stringify(requestBody, null, 2));

  const data = await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.CREATE_PAYMENT_INTENT}`,
    {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(requestBody),
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
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
) => {
  console.log('💳 [paymentPrivateSlice] processPaymentAPI CALLED');
  console.log('📋 Checkout Session ID:', checkoutSessionId);
  console.log('📋 Razorpay Order ID:', razorpay_order_id);
  console.log('📋 Razorpay Payment ID:', razorpay_payment_id);
  console.log(
    '📋 Razorpay Signature:',
    razorpay_signature ? 'PROVIDED' : 'NOT PROVIDED',
  );

  const requestBody = {
    checkoutSessionId,
    paymentType: 'normal',
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  };

  console.log('📤 Sending to backend:', JSON.stringify(requestBody, null, 2));

  const data = await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.PROCESS_PAYMENT}`,
    {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(requestBody),
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
// 4. GET SESSION STATUS
// ================================

export const getSessionStatusAPI = async (
  checkoutSessionId: string,
): Promise<any> => {
  console.log('🔍 [paymentPrivateSlice] getSessionStatusAPI CALLED');
  console.log('📋 Checkout Session ID:', checkoutSessionId);

  try {
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
// 5. GET ORDER DETAILS (Alias)
// ================================

export const getOrderDetailsAPI = async (
  checkoutSessionId: string,
): Promise<any> => {
  console.log('📋 [paymentPrivateSlice] getOrderDetailsAPI CALLED');
  console.log('📋 Checkout Session ID:', checkoutSessionId);

  return await getSessionStatusAPI(checkoutSessionId);
};
