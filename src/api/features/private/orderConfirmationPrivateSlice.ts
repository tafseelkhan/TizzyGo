// ============================================================
// api/features/private/orderConfirmationService.ts
// ============================================================
// NO REDUX - Pure API Service with TypeScript

import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { TIZZYGO_API_BASE_URL } from '../../connections/snippet/apiBaseUrl';
import {
  apiRequest,
  ApiError,
} from '../../../core/utils/handler/apiClient';

// ============================================================
// SAFE URL JOINER
// ============================================================

const apiUrl = (path: string): string => {
  if (!TIZZYGO_API_BASE_URL) {
    throw new Error('TIZZYGO_API_BASE_URL is not configured.');
  }
  return `${TIZZYGO_API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
};

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
// API METHODS
// ============================================================

/**
 * ✅ GET ORDER CONFIRMATION
 */
export const getOrderConfirmation = async (
  checkoutSessionId: string,
): Promise<OrderConfirmationResponse> => {
  if (!checkoutSessionId) {
    throw new Error('checkoutSessionId is required');
  }

  try {
    const data = await apiRequest<OrderConfirmationResponse>(
      apiUrl(`${API_ENDPOINTS.ORDER_CONFIRMATION}/${checkoutSessionId}`),
    );

    if (!data || !data.success) {
      throw new Error(
        (data as any)?.error || 'Failed to fetch confirmation',
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ Order Confirmation API Error:', error.message);
    } else {
      console.error('❌ Order Confirmation API Error:', error);
    }

    throw error;
  }
};

/**
 * ✅ REFRESH ORDER CONFIRMATION (Alias)
 */
export const refreshOrderConfirmation = async (
  checkoutSessionId: string,
): Promise<OrderConfirmationResponse> => {
  return getOrderConfirmation(checkoutSessionId);
};

/**
 * ✅ GET ORDER CONFIRMATION WITH RETRY
 */
export const getOrderConfirmationWithRetry = async (
  checkoutSessionId: string,
  maxRetries: number = 3,
  retryDelay: number = 1000,
): Promise<OrderConfirmationResponse> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await getOrderConfirmation(checkoutSessionId);
    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ Attempt ${attempt} failed:`, error?.message);

      // Don't retry on auth errors — refresh already failed inside apiClient
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        throw error;
      }

      if (attempt < maxRetries) {
        await new Promise<void>(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 2;
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
};