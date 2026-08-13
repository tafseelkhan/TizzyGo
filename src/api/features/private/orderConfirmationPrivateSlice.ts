// ============================================================
// api/features/private/orderConfirmationService.ts
// ============================================================
// NO REDUX - Pure API Service with TypeScript

import { getToken } from '../../connections/token/tokenSlice';
import { fetchHandler } from '../../../core/utils/handler/fetchHandler';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { API_BASE_URL } from '../../connections/snippet/apiBaseUrl';

// ============================================================
// TYPES
// ============================================================

export enum ConfirmationStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED',
}

export enum PaymentMethod {
  ONLINE = 'ONLINE',
  COD = 'COD',
}

export interface TimerInfo {
  serverTime: string;
  createdAt: string;
  completedAt?: string;
  expiresAt: string;
  remainingMilliseconds: number;
  remainingSeconds: number;
  remainingMinutes: number;
  isExpired: boolean;
}

export interface OrderSummary {
  subtotal: number;
  gst: number;
  platformFee: number;
  deliveryCharge: number;
  discount: number;
  grandTotal: number;
}

export interface OrderConfirmationOrder {
  _id: string;
  orderId: string;
  status: string;
  paymentStatus: string;
  sellerId: string;
  sellerName: string;
  productTitle: string;
  productImage: string;
  quantity: number;
  variant?: string;
  price: number;
  trackingAvailable: boolean;
}

export interface NavigationConfig {
  autoRedirect: boolean;
  redirectAfterSeconds: number;
}

export interface ButtonsConfig {
  canGoHome: boolean;
  canRetryPayment: boolean;
  canTrackOrder: boolean;
}

export interface OrderConfirmationResponse {
  success: boolean;
  confirmationStatus: ConfirmationStatus;
  paymentMethod: PaymentMethod;
  checkoutSession: {
    checkoutSessionId: string;
    status: string;
    paymentGateway: string;
    paymentIntentId?: string;
  };
  timer: TimerInfo;
  summary: OrderSummary;
  orders: OrderConfirmationOrder[];
  trackingAvailable: boolean;
  buttons: ButtonsConfig;
  navigation: NavigationConfig;
}

// ============================================================
// HELPER: Get Headers
// ============================================================

const getHeaders = async (): Promise<Record<string, string>> => {
  const token = await getToken();

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ============================================================
// API METHODS
// ============================================================

/**
 * ✅ GET ORDER CONFIRMATION
 *
 * Fetches complete order confirmation data including:
 * - Checkout session details
 * - Timer information (server-side calculated)
 * - Order summary
 * - List of orders (supports Buy Now & Cart Checkout)
 * - Navigation configuration
 * - Button visibility
 *
 * @param checkoutSessionId - The checkout session ID
 * @returns Promise<OrderConfirmationResponse>
 * @throws Error if request fails
 */
export const getOrderConfirmation = async (
  checkoutSessionId: string,
): Promise<OrderConfirmationResponse> => {
  console.log('========================================');
  console.log('📋 ORDER CONFIRMATION API CALLED');
  console.log('========================================');
  console.log(`📋 CheckoutSession ID: ${checkoutSessionId}`);

  if (!checkoutSessionId) {
    throw new Error('checkoutSessionId is required');
  }

  try {
    const headers = await getHeaders();
    const url = `${API_BASE_URL}${API_ENDPOINTS.ORDER_CONFIRMATION}/${checkoutSessionId}`;

    console.log(`📤 URL: ${url}`);
    console.log(`📤 Headers:`, JSON.stringify(headers, null, 2));

    const data = await fetchHandler(url, {
      method: 'GET',
      headers,
    });

    console.log('📥 Response received:');
    console.log(`  - Status: ${data?.confirmationStatus}`);
    console.log(`  - Orders: ${data?.orders?.length || 0}`);
    console.log(`  - Timer: ${data?.timer?.remainingSeconds}s remaining`);

    if (!data || !data.success) {
      throw new Error(data?.error || 'Failed to fetch confirmation');
    }

    return data;
  } catch (error: any) {
    console.error('❌ Order Confirmation API Error:', error.message);

    if (error.response) {
      console.error(`  - Status: ${error.response.status}`);
      console.error(`  - Data:`, error.response.data);
    }

    throw error;
  }
};

/**
 * ✅ REFRESH ORDER CONFIRMATION (Alias)
 *
 * Use this for polling or manual refresh
 */
export const refreshOrderConfirmation = async (
  checkoutSessionId: string,
): Promise<OrderConfirmationResponse> => {
  console.log('🔄 Refreshing order confirmation...');
  return getOrderConfirmation(checkoutSessionId);
};

/**
 * ✅ GET ORDER CONFIRMATION WITH RETRY
 *
 * Automatically retries on failure
 *
 * @param checkoutSessionId - The checkout session ID
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param retryDelay - Delay between retries in ms (default: 1000)
 * @returns Promise<OrderConfirmationResponse>
 */
export const getOrderConfirmationWithRetry = async (
  checkoutSessionId: string,
  maxRetries: number = 3,
  retryDelay: number = 1000,
): Promise<OrderConfirmationResponse> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries}`);
      return await getOrderConfirmation(checkoutSessionId);
    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
        await new Promise<void>(resolve => setTimeout(() => resolve(), retryDelay));
        retryDelay *= 2; // Exponential backoff
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
};
