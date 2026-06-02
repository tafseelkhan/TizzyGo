import Config from 'react-native-config';
import { getToken } from '../../connections/token/tokenSlice';
import { fetchHandler } from '../../../core/utils/handler/fetchHandler';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';

const API_BASE_URL = Config.API_AXIOS_BASE_URL;

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
) => {
  const data = await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.CREATE_PAYMENT_INTENT}`,
    {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({
        address,
        paymentMethod,
      }),
    },
  );

  return data;
};

// ================================
// 2. PROCESS PAYMENT (ZeptPay / Online)
// ================================

export const processPaymentAPI = async (
  checkoutSessionId: string,
  transactionId: string | null,
  paymentMethod: string,
  paymentType: string,
) => {
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

  return data;
};

// ================================
// 3. CONFIRM COD ORDER
// ================================

export const confirmCODAPI = async (checkoutSessionId: string) => {
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

  return data;
};
