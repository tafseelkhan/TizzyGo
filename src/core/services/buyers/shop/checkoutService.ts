// services/checkoutService.ts

import {
  checkoutApi,
  CalculationParams,
  CheckoutResponse,
  CalculatedData,
} from '../../../../api/features/private/checkoutPrivateSlice';
import { locationApi } from '../../../../api/features/private/locationPrivateSlice';
import { Product, ShippingAddress } from '../../../types/ShopTypes';

export interface EssentialProductInfo {
  mongoObjectId: string;
  displayProductId: string;
  vendorCodeUID: string;
  sellerId: string;
  sellerLocation?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    lat?: number;
    lng?: number;
  };
}

export interface CalculationOptions {
  skipCouponCheck?: boolean;
  skipCouponOnAddressChange?: boolean;
  isLocationUpdate?: boolean;
}

export interface CalculatePriceResult {
  calculatedData: CalculatedData | null;
  couponMessage?: string;
  locationError?: string;
}

class CheckoutService {
  /**
   * ✅ CALCULATE PRICE
   *
   * CRITICAL: Backend automatically fetches buyer location from database.
   * We DO NOT send buyer location parameters.
   * Only product details and coupon code are sent.
   */
  async calculatePrice(
    essentialInfo: EssentialProductInfo,
    quantity: number,
    shippingAddress: ShippingAddress, // KEEP - used for UI display only
    couponCode: string,
    couponManuallyApplied: boolean,
    options: CalculationOptions = {},
  ): Promise<CalculatePriceResult> {
    console.log('========================================');
    console.log('🚀 [CheckoutService] calculatePrice CALLED');
    console.log('========================================');
    console.log('📦 essentialInfo:', {
      mongoObjectId: essentialInfo?.mongoObjectId,
      vendorCodeUID: essentialInfo?.vendorCodeUID,
      sellerId: essentialInfo?.sellerId,
      displayProductId: essentialInfo?.displayProductId,
    });
    console.log('💰 quantity:', quantity);
    console.log('🏷️ couponCode:', couponCode);
    console.log('🔄 couponManuallyApplied:', couponManuallyApplied);
    console.log('⚙️ options:', options);
    console.log('📍 shippingAddress (FOR DISPLAY ONLY):', {
      address: shippingAddress?.address,
      lat: shippingAddress?.latitude,
      lng: shippingAddress?.longitude,
      hasValid: !!(shippingAddress?.latitude && shippingAddress?.longitude),
    });

    if (!essentialInfo) {
      console.log('❌ [CheckoutService] No essentialInfo, returning null');
      return { calculatedData: null };
    }

    // ✅ Build params - NO LOCATION PARAMS
    const params: CalculationParams = {
      mongoObjectId: essentialInfo.mongoObjectId,
      quantity: quantity,
      vendorCodeUID: essentialInfo.vendorCodeUID,
      sellerId: essentialInfo.sellerId,
      displayProductId: essentialInfo.displayProductId,
      isLocationUpdate: options.isLocationUpdate,
    };

    // ✅ Add coupon code if applicable
    const shouldSendCoupon =
      couponCode?.trim() &&
      !options.skipCouponOnAddressChange &&
      couponManuallyApplied;

    if (shouldSendCoupon) {
      console.log('🏷️ [CheckoutService] Adding coupon to params:', couponCode);
      params.couponCode = couponCode;
    } else {
      console.log('ℹ️ [CheckoutService] No coupon to send');
    }

    // ❌ REMOVED: All location params (backend fetches from DB)

    console.log('📤 [CheckoutService] Final params sent to API:', {
      ...params,
      hasCoupon: !!params.couponCode,
    });

    try {
      const response = await checkoutApi.fetchCalculatedDataAPI(params);

      console.log('📥 [CheckoutService] API Response received');
      console.log('  - success:', response?.success);
      console.log('  - has calculated:', !!response?.calculated);
      console.log('  - couponMessage:', response?.couponMessage);

      // ✅ Check for location error
      if (
        response?.code === 'LOCATION_NOT_FOUND' ||
        response?.calculated?.code === 'LOCATION_NOT_FOUND'
      ) {
        console.warn('⚠️ [CheckoutService] Location not found in database');
        return {
          calculatedData: null,
          locationError: 'LOCATION_NOT_FOUND',
        };
      }

      // ✅ Check for error in response
      if (!response?.success) {
        console.warn(
          '⚠️ [CheckoutService] API returned error:',
          response?.error,
        );
        return {
          calculatedData: null,
          locationError: response?.error || 'Checkout calculation failed',
        };
      }

      // ✅ Log location from backend
      if (response?.calculated?.buyerLocation) {
        console.log('📍 [CheckoutService] Location from backend:', {
          address: response.calculated.buyerLocation.address,
          lat: response.calculated.buyerLocation.latitude,
          lng: response.calculated.buyerLocation.longitude,
          googlePlaceId: response.calculated.buyerLocation.googlePlaceId,
        });
      }

      return {
        calculatedData: response?.calculated || null,
        couponMessage: response?.couponMessage,
      };
    } catch (error: any) {
      console.error('❌ [CheckoutService] API Error:', error.message);

      // ✅ Check if it's a location error from API
      if (
        error.message === 'LOCATION_NOT_FOUND' ||
        error.message?.toLowerCase().includes('location not found')
      ) {
        return {
          calculatedData: null,
          locationError: 'LOCATION_NOT_FOUND',
        };
      }

      throw error;
    }
  }

  /**
   * ✅ PROCESS COUPON MESSAGE
   */
  processCouponMessage(
    message: string | undefined,
    calculatedData: CalculatedData | null,
    existingCouponSuccess: string | null,
  ): {
    couponError: string | null;
    couponSuccess: string | null;
    couponManuallyApplied: boolean;
  } {
    console.log('🔄 [CheckoutService] processCouponMessage called');
    console.log('  - message:', message);
    console.log('  - has calculatedData:', !!calculatedData);
    console.log('  - existingCouponSuccess:', existingCouponSuccess);

    let couponError: string | null = null;
    let couponSuccess: string | null = null;
    let couponManuallyApplied = false;

    if (message) {
      const isSuccess =
        message.includes('applied successfully') ||
        message.toLowerCase().includes('success') ||
        message.includes('coupon applied');

      if (isSuccess) {
        couponSuccess = message;
        console.log('✅ [CheckoutService] Coupon success message detected');
      } else {
        couponError = message;
        console.log('❌ [CheckoutService] Coupon error message detected');
      }
    }

    // Check if coupon is applied from calculatedData
    if (calculatedData?.couponUsed && !existingCouponSuccess) {
      couponSuccess = `Coupon "${calculatedData.couponUsed}" applied successfully!`;
      console.log(
        '✅ [CheckoutService] Coupon found in calculatedData:',
        calculatedData.couponUsed,
      );
    }

    couponManuallyApplied = !!couponSuccess;

    console.log('📊 [CheckoutService] Processed result:', {
      couponError,
      couponSuccess,
      couponManuallyApplied,
    });

    return { couponError, couponSuccess, couponManuallyApplied };
  }

  /**
   * ✅ GET LOCATION FROM BACKEND
   *
   * Fetch user's saved location from database
   */
  async getBuyerLocation() {
    console.log('📍 [CheckoutService] getBuyerLocation called');
    try {
      const response = await locationApi.getLocation();
      console.log('✅ [CheckoutService] Location fetched:', response);

      // ✅ Return location data if available
      if (response?.success && response?.data) {
        return {
          success: true,
          location: response.data,
        };
      }

      return {
        success: false,
        error: response?.message || 'Failed to fetch location',
      };
    } catch (error: any) {
      console.error(
        '❌ [CheckoutService] Failed to fetch location:',
        error.message,
      );
      return {
        success: false,
        error: error.message || 'Failed to fetch location',
      };
    }
  }

  /**
   * ✅ SAVE LOCATION
   *
   * Save user's location to database
   */
  async saveBuyerLocation(
    lat: number,
    lng: number,
    address: string,
    city: string = '',
    state: string = '',
    country: string = 'India',
    pinCode: string = '',
    placeId: string = '',
  ) {
    console.log('📍 [CheckoutService] saveBuyerLocation called');
    console.log('  - address:', address);
    console.log('  - lat/lng:', lat, lng);

    try {
      const response = await locationApi.saveLocation(
        lat,
        lng,
        address,
        city,
        state,
        country,
        pinCode,
        placeId,
      );

      console.log('✅ [CheckoutService] Location saved successfully');
      return response;
    } catch (error: any) {
      console.error(
        '❌ [CheckoutService] Failed to save location:',
        error.message,
      );
      throw error;
    }
  }

  /**
   * ✅ UPDATE GPS TRACKING
   */
  async updateGpsTracking(enabled: boolean) {
    console.log('📍 [CheckoutService] updateGpsTracking called:', enabled);
    try {
      const response = await locationApi.updateGpsTracking(enabled);
      console.log('✅ [CheckoutService] GPS tracking updated');
      return response;
    } catch (error: any) {
      console.error(
        '❌ [CheckoutService] Failed to update GPS tracking:',
        error.message,
      );
      throw error;
    }
  }

  /**
   * ✅ CHECK IF LOCATION EXISTS
   *
   * Quick check if user has saved location
   */
  async hasValidLocation(): Promise<boolean> {
    try {
      const result = await this.getBuyerLocation();
      return result.success && !!result.location;
    } catch (error) {
      console.error('❌ [CheckoutService] Error checking location:', error);
      return false;
    }
  }
}

export const checkoutService = new CheckoutService();
