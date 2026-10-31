// api/features/private/checkoutPrivateSlice.ts
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

// ================================
// TYPES
// ================================

export interface CalculationParams {
  mongoObjectId: string;
  displayProductId: string;
  sellerId: string;
  vendorCodeUID: string;
  quantity: number;
  couponCode?: string;
  isLocationUpdate?: boolean;
}

export interface CheckoutResponse {
  success: boolean;
  code?: string;
  calculated: CalculatedData;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  couponMessage?: string;
}

export interface CalculatedData {
  mrp: number;
  price: number;
  finalPrice: number;
  savedAmount: number;
  discountPercent: number;
  quantity: number;
  totalMrp: number;
  totalFinalPrice: number;
  totalSavedAmount: number;
  gstRate: number;
  gstType: string;
  gstAmount: number;
  perProductGst: number;
  platformFee: number;
  packagingFee: number;
  deliveryCharge: number;
  distanceKm: number;
  volumetricWeight: number;
  actualWeight: number;
  chargeableWeight: number;
  deliveryRatePerKm: number;
  deliveryRatePerKg: number;
  subtotal: number;
  totalBeforeCoupon: number;
  discountAppliedAmount: number;
  grandTotal: number;
  couponUsed: string | null;
  couponData: any | null;
  buyerLocation: {
    latitude: number;
    longitude: number;
    address: string;
    googlePlaceId: string | null;
  };
  sellerLocation: {
    latitude: number;
    longitude: number;
    address: string | null;
    googlePlaceId: string | null;
  };
  error?: string;
  code?: string;
}

// ================================
// CHECKOUT API CLASS
// ================================

class CheckoutApi {
  /**
   * ✅ FETCH CALCULATED CHECKOUT DATA
   * Backend automatically fetches buyer location from database.
   */
  fetchCalculatedDataAPI = async (params: CalculationParams) => {
    const urlParams = new URLSearchParams();

    urlParams.append('productId', params.mongoObjectId);
    urlParams.append('quantity', params.quantity.toString());
    urlParams.append('vendorCodeUID', params.vendorCodeUID);
    urlParams.append('sellerId', params.sellerId);
    urlParams.append('productDataId', params.displayProductId);

    if (params.couponCode) {
      urlParams.append('couponCode', params.couponCode);
    }

    if (params.isLocationUpdate) {
      urlParams.append('isLocationUpdate', 'true');
    }

    try {
      const data = await apiRequest<CheckoutResponse>(
        apiUrl(`${API_ENDPOINTS.CALCULATE_CHECKOUT}?${urlParams.toString()}`),
      );

      if (!data.success && data.code === 'LOCATION_NOT_FOUND') {
        throw new Error('LOCATION_NOT_FOUND');
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        // Preserve LOCATION_NOT_FOUND code if backend returns it in data
        if (
          error.data &&
          typeof error.data === 'object' &&
          (error.data as any).code === 'LOCATION_NOT_FOUND'
        ) {
          throw new Error('LOCATION_NOT_FOUND');
        }
      }

      if (error instanceof Error && error.message === 'LOCATION_NOT_FOUND') {
        throw error;
      }

      throw error;
    }
  };
}

// ================================
// ✅ EXPORT SINGLETON INSTANCE
// ================================

export const checkoutApi = new CheckoutApi();
export { CheckoutApi };