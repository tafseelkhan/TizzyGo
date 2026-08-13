// api/features/private/checkoutPrivateSlice.ts

import Config from 'react-native-config';
import { getToken } from '../../connections/token/tokenSlice';
import { fetchHandler } from '../../../core/utils/handler/fetchHandler';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { API_BASE_URL } from '../../connections/snippet/apiBaseUrl';

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
// CHECKOUT API CLASS
// ================================

class CheckoutApi {
  /**
   * ✅ FETCH CALCULATED CHECKOUT DATA
   * Backend automatically fetches buyer location from database.
   */
  fetchCalculatedDataAPI = async (params: CalculationParams) => {
    console.log('🚀 [CheckoutApi] fetchCalculatedDataAPI called');
    console.log('📦 Params:', JSON.stringify(params, null, 2));

    const urlParams = new URLSearchParams();

    // ✅ REQUIRED PARAMS
    urlParams.append('productId', params.mongoObjectId);
    urlParams.append('quantity', params.quantity.toString());
    urlParams.append('vendorCodeUID', params.vendorCodeUID);
    urlParams.append('sellerId', params.sellerId);
    urlParams.append('productDataId', params.displayProductId);

    // ✅ OPTIONAL PARAMS
    if (params.couponCode) {
      urlParams.append('couponCode', params.couponCode);
    }

    if (params.isLocationUpdate) {
      urlParams.append('isLocationUpdate', 'true');
    }

    // ❌ REMOVED ALL LOCATION PARAMS

    const url = `${API_BASE_URL}${API_ENDPOINTS.CALCULATE_CHECKOUT}?${urlParams.toString()}`;
    console.log('🌐 [CheckoutApi] URL:', url);

    try {
      const data = await fetchHandler(url, {
        method: 'GET',
        headers: await getHeaders(),
      });

      console.log('✅ [CheckoutApi] Response received');
      console.log('📊 Response data:', JSON.stringify(data, null, 2));

      if (!data.success && data.code === 'LOCATION_NOT_FOUND') {
        console.warn('⚠️ [CheckoutApi] Location not found in database');
        throw new Error('LOCATION_NOT_FOUND');
      }

      return data;
    } catch (error: any) {
      console.error('❌ [CheckoutApi] Error:', error.message);
      if (error.message === 'LOCATION_NOT_FOUND') {
        throw new Error('LOCATION_NOT_FOUND');
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
