// hooks/useCheckout.ts - WITH FULL CONSOLE LOGS
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  checkoutService,
  EssentialProductInfo,
} from '../services/buyers/shop/checkoutService';
import { Product, CalculatedData, ShippingAddress } from '../types/ShopTypes';
import { triggerHaptic } from '../utils/buyers/shop/checkoutUtils';

interface UseCheckoutProps {
  essentialProductInfo: EssentialProductInfo | null;
  quantity: number;
  shippingAddress: ShippingAddress;
  couponCode: string;
}

export const useCheckout = ({
  essentialProductInfo,
  quantity,
  shippingAddress,
  couponCode,
}: UseCheckoutProps) => {
  console.log('========================================');
  console.log('🎯 [useCheckout] HOOK INITIALIZED');
  console.log('========================================');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('📦 essentialProductInfo:', !!essentialProductInfo);
  console.log('  - mongoObjectId:', essentialProductInfo?.mongoObjectId);
  console.log('  - vendorCodeUID:', essentialProductInfo?.vendorCodeUID);
  console.log('  - sellerId:', essentialProductInfo?.sellerId);
  console.log('💰 quantity:', quantity);
  console.log('📍 shippingAddress:', {
    hasAddress: !!shippingAddress?.address,
    hasLat: !!shippingAddress?.latitude,
    hasLng: !!shippingAddress?.longitude,
    lat: shippingAddress?.latitude,
    lng: shippingAddress?.longitude,
  });
  console.log('🏷️ couponCode:', couponCode);
  console.log('========================================');

  const [calculatedData, setCalculatedData] = useState<CalculatedData | null>(
    null,
  );
  const [calculating, setCalculating] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [couponManuallyApplied, setCouponManuallyApplied] = useState(false);

  const calculationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const isCalculatingRef = useRef(false);

  const clearCouponMessages = useCallback(() => {
    console.log('🔄 [useCheckout] clearCouponMessages called');
    setCouponError(null);
    setCouponSuccess(null);
  }, []);

  const fetchCalculatedData = useCallback(
    async (
      options: {
        skipCouponCheck?: boolean;
        skipCouponOnAddressChange?: boolean;
        isLocationUpdate?: boolean;
      } = {},
    ) => {
      console.log('========================================');
      console.log('🔄 [useCheckout] fetchCalculatedData CALLED');
      console.log('========================================');
      console.log('  - isCalculatingRef.current:', isCalculatingRef.current);
      console.log('  - essentialProductInfo:', !!essentialProductInfo);
      console.log('  - quantity:', quantity);
      console.log('  - shippingAddress:', !!shippingAddress?.latitude);
      console.log('  - couponCode:', couponCode);
      console.log('  - options:', options);

      if (isCalculatingRef.current || !essentialProductInfo) {
        console.log(
          '❌ [useCheckout] Skipping - already calculating or no product info',
        );
        return;
      }

      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }

      calculationTimeoutRef.current = setTimeout(async () => {
        console.log(
          '⏰ [useCheckout] Timeout completed, starting calculation...',
        );
        try {
          isCalculatingRef.current = true;
          setCalculating(true);
          if (!options.skipCouponCheck) clearCouponMessages();

          console.log(
            '📤 [useCheckout] Calling checkoutService.calculatePrice...',
          );
          const result = await checkoutService.calculatePrice(
            essentialProductInfo,
            quantity,
            shippingAddress,
            couponCode,
            couponManuallyApplied,
            options,
          );

          console.log('📥 [useCheckout] Result received:');
          console.log('  - has calculatedData:', !!result.calculatedData);
          console.log('  - couponMessage:', result.couponMessage);
          if (result.calculatedData) {
            console.log('  - grandTotal:', result.calculatedData.grandTotal);
            console.log('  - subtotal:', result.calculatedData.subtotal);
            console.log('  - deliveryFee:', result.calculatedData.deliveryFee);
            console.log('  - tax:', result.calculatedData.tax);
            console.log('  - discount:', result.calculatedData.discount);
          }

          if (result.calculatedData) {
            console.log('✅ [useCheckout] Setting calculatedData');
            const processed = checkoutService.processCouponMessage(
              result.couponMessage,
              result.calculatedData,
              couponSuccess,
            );

            setCouponError(processed.couponError);
            setCouponSuccess(processed.couponSuccess);
            setCouponManuallyApplied(processed.couponManuallyApplied);
            setCalculatedData(result.calculatedData);
            console.log('✅ [useCheckout] calculatedData set successfully');
          } else {
            console.log('❌ [useCheckout] No calculatedData in response');
          }
        } catch (error: any) {
          console.error('❌ [useCheckout] Calculation error:', error.message);
          console.error('  - error stack:', error.stack);
          setCouponError(error.response?.data?.message || 'Calculation failed');
        } finally {
          isCalculatingRef.current = false;
          setCalculating(false);
          console.log('🔓 [useCheckout] Calculation finished, lock released');
        }
      }, 500);
    },
    [
      essentialProductInfo,
      quantity,
      shippingAddress,
      couponCode,
      couponManuallyApplied,
      couponSuccess,
      clearCouponMessages,
    ],
  );

  // ✅ Auto-trigger calculation when essential data changes
  useEffect(() => {
    console.log('🔍 [useCheckout] useEffect triggered for auto-calculation');
    console.log('  - essentialProductInfo:', !!essentialProductInfo);
    console.log('  - shippingAddress has lat:', !!shippingAddress?.latitude);
    console.log('  - shippingAddress has lng:', !!shippingAddress?.longitude);

    if (
      essentialProductInfo &&
      shippingAddress?.latitude &&
      shippingAddress?.longitude
    ) {
      console.log(
        '✅ [useCheckout] All data ready, triggering fetchCalculatedData...',
      );
      fetchCalculatedData();
    } else {
      console.log('❌ [useCheckout] Data not ready for calculation');
      if (!essentialProductInfo)
        console.log('  - missing: essentialProductInfo');
      if (!shippingAddress?.latitude)
        console.log('  - missing: shippingAddress.latitude');
      if (!shippingAddress?.longitude)
        console.log('  - missing: shippingAddress.longitude');
    }
  }, [essentialProductInfo, shippingAddress, fetchCalculatedData]);

  const applyCoupon = useCallback(
    async (code: string) => {
      console.log('🔄 [useCheckout] applyCoupon called with code:', code);
      if (calculating) {
        console.log('❌ [useCheckout] Already calculating, skipping');
        return;
      }
      try {
        triggerHaptic('light');
        clearCouponMessages();
        setCouponManuallyApplied(true);
        await fetchCalculatedData();
        console.log('✅ [useCheckout] Coupon applied successfully');
      } catch (error) {
        console.error('❌ [useCheckout] Failed to apply coupon:', error);
        setCouponError('Failed to apply coupon');
        setCouponManuallyApplied(false);
      }
    },
    [calculating, clearCouponMessages, fetchCalculatedData],
  );

  const removeCoupon = useCallback(async () => {
    console.log('🔄 [useCheckout] removeCoupon called');
    if (calculating) {
      console.log('❌ [useCheckout] Already calculating, skipping');
      return;
    }
    try {
      triggerHaptic('light');
      clearCouponMessages();
      setCouponManuallyApplied(false);
      await fetchCalculatedData({ skipCouponCheck: true });
      setCouponSuccess('Coupon removed successfully');
      console.log('✅ [useCheckout] Coupon removed successfully');
    } catch (error) {
      console.error('❌ [useCheckout] Failed to remove coupon:', error);
      setCouponError('Failed to remove coupon');
    }
  }, [calculating, clearCouponMessages, fetchCalculatedData]);

  return {
    calculatedData,
    calculating,
    couponError,
    couponSuccess,
    couponManuallyApplied,
    setCouponError,
    setCouponSuccess,
    setCouponManuallyApplied,
    clearCouponMessages,
    fetchCalculatedData,
    applyCoupon,
    removeCoupon,
  };
};
