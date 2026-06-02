// services/checkoutService.ts
import {
  checkoutApi,
  CalculationParams,
} from '../../../api/features/private/checkoutPrivateSlice';
import {
  Product,
  CalculatedData,
  ShippingAddress,
} from '../../types/ShopTypes';

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

class CheckoutService {
  async calculatePrice(
    essentialInfo: EssentialProductInfo,
    quantity: number,
    shippingAddress: ShippingAddress,
    couponCode: string,
    couponManuallyApplied: boolean,
    options: CalculationOptions = {},
  ): Promise<{
    calculatedData: CalculatedData | null;
    couponMessage?: string;
  }> {
    if (!essentialInfo) {
      return { calculatedData: null };
    }

    const params: CalculationParams = {
      mongoObjectId: essentialInfo.mongoObjectId,
      quantity: quantity,
      vendorCodeUID: essentialInfo.vendorCodeUID,
      sellerId: essentialInfo.sellerId,
      displayProductId: essentialInfo.displayProductId,
      isLocationUpdate: options.isLocationUpdate,
    };

    // Add seller location
    if (essentialInfo.sellerLocation) {
      const sellerLat =
        essentialInfo.sellerLocation.latitude ||
        essentialInfo.sellerLocation.lat;
      const sellerLng =
        essentialInfo.sellerLocation.longitude ||
        essentialInfo.sellerLocation.lng;
      if (sellerLat && sellerLng) {
        params.sellerLat = sellerLat;
        params.sellerLng = sellerLng;
      }
      if (essentialInfo.sellerLocation.address) {
        params.sellerAddress = essentialInfo.sellerLocation.address;
      }
    }

    // Add buyer location
    const buyerLat = shippingAddress.latitude;
    const buyerLng = shippingAddress.longitude;
    const hasValidLocation =
      buyerLat && buyerLng && buyerLat !== 0 && buyerLng !== 0;

    if (hasValidLocation) {
      params.buyerLat = buyerLat;
      params.buyerLng = buyerLng;
      if (shippingAddress.address)
        params.buyerAddress = shippingAddress.address;
      if (shippingAddress.googlePlaceId)
        params.buyerGooglePlaceId = shippingAddress.googlePlaceId;
    }

    // Add coupon code
    const shouldSendCoupon =
      couponCode?.trim() &&
      !options.skipCouponOnAddressChange &&
      couponManuallyApplied;
    if (shouldSendCoupon) {
      params.couponCode = couponCode;
    }

    const response = await checkoutApi.fetchCalculatedDataAPI(params);

    return {
      calculatedData: response?.calculated || null,
      couponMessage: response?.couponMessage,
    };
  }

  processCouponMessage(
    message: string | undefined,
    calculatedData: CalculatedData | null,
    existingCouponSuccess: string | null,
  ): {
    couponError: string | null;
    couponSuccess: string | null;
    couponManuallyApplied: boolean;
  } {
    let couponError: string | null = null;
    let couponSuccess: string | null = null;
    let couponManuallyApplied = false;

    if (message) {
      const isSuccess =
        message.includes('applied successfully') ||
        message.toLowerCase().includes('success');
      if (isSuccess) {
        couponSuccess = message;
      } else {
        couponError = message;
      }
    }

    if (calculatedData?.couponUsed && !existingCouponSuccess) {
      couponSuccess = `Coupon "${calculatedData.couponUsed}" applied successfully!`;
    }

    couponManuallyApplied = !!couponSuccess;

    return { couponError, couponSuccess, couponManuallyApplied };
  }
}

export const checkoutService = new CheckoutService();
