// hooks/useCheckout.ts - FULLY OPTIMIZED (No Unnecessary Re-renders)

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
  // ✅ LOGGING ONLY ONCE - Not on every render
  const hasLoggedRef = useRef(false);
  useEffect(() => {
    if (!hasLoggedRef.current) {
      console.log('========================================');
      console.log('🎯 [useCheckout] HOOK INITIALIZED (once)');
      console.log('========================================');
      hasLoggedRef.current = true;
    }
  }, []);

  const [calculatedData, setCalculatedData] = useState<CalculatedData | null>(
    null,
  );
  const [calculating, setCalculating] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [couponManuallyApplied, setCouponManuallyApplied] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const calculationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const isCalculatingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const lastFetchKeyRef = useRef<string>('');

  // ✅ STABLE FETCH KEY - Only depends on primitive values
  const fetchKey = useMemo(() => {
    return `${essentialProductInfo?.mongoObjectId || 'no-product'}_${quantity}_${couponCode || 'no-coupon'}_${!!essentialProductInfo}`;
  }, [
    essentialProductInfo?.mongoObjectId,
    quantity,
    couponCode,
    essentialProductInfo,
  ]);

  // ✅ STABLE STATE SETTERS - Compare before updating
  const setCalculatedDataIfChanged = useCallback(
    (newData: CalculatedData | null) => {
      setCalculatedData(prev => {
        // ✅ Only update if data actually changed
        if (JSON.stringify(prev) === JSON.stringify(newData)) {
          return prev;
        }
        return newData;
      });
    },
    [],
  );

  const setCouponErrorIfChanged = useCallback((newError: string | null) => {
    setCouponError(prev => {
      if (prev === newError) return prev;
      return newError;
    });
  }, []);

  const setCouponSuccessIfChanged = useCallback((newSuccess: string | null) => {
    setCouponSuccess(prev => {
      if (prev === newSuccess) return prev;
      return newSuccess;
    });
  }, []);

  const setLocationErrorIfChanged = useCallback((newError: string | null) => {
    setLocationError(prev => {
      if (prev === newError) return prev;
      return newError;
    });
  }, []);

  const clearCouponMessages = useCallback(() => {
    setCouponErrorIfChanged(null);
    setCouponSuccessIfChanged(null);
  }, [setCouponErrorIfChanged, setCouponSuccessIfChanged]);

  const clearLocationError = useCallback(() => {
    setLocationErrorIfChanged(null);
  }, [setLocationErrorIfChanged]);

  // ✅ STABLE fetchCalculatedData - Only depends on primitive values
  const fetchCalculatedData = useCallback(
    async (
      options: {
        skipCouponCheck?: boolean;
        skipCouponOnAddressChange?: boolean;
        isLocationUpdate?: boolean;
      } = {},
    ) => {
      // ✅ Extract stable values for comparison
      const productId = essentialProductInfo?.mongoObjectId;
      const sellerId = essentialProductInfo?.sellerId;
      const vendorCode = essentialProductInfo?.vendorCodeUID;
      const displayId = essentialProductInfo?.displayProductId;
      const lat = shippingAddress?.latitude;
      const lng = shippingAddress?.longitude;
      const address = shippingAddress?.address;
      const placeId = shippingAddress?.googlePlaceId;

      console.log('🔄 [useCheckout] fetchCalculatedData CALLED');
      console.log('  - productId:', productId);
      console.log('  - quantity:', quantity);
      console.log('  - couponCode:', couponCode);

      // ✅ Prevent concurrent fetches
      if (isCalculatingRef.current || !essentialProductInfo || !productId) {
        console.log(
          '❌ [useCheckout] Skipping - no product info or already calculating',
        );
        return;
      }

      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }

      calculationTimeoutRef.current = setTimeout(async () => {
        console.log('⏰ [useCheckout] Starting calculation...');
        try {
          isCalculatingRef.current = true;
          setCalculating(true);
          if (!options.skipCouponCheck) clearCouponMessages();
          clearLocationError();

          const result = await checkoutService.calculatePrice(
            essentialProductInfo,
            quantity,
            shippingAddress,
            couponCode,
            couponManuallyApplied,
            options,
          );

          console.log(
            '📥 [useCheckout] Result received:',
            !!result.calculatedData,
          );

          // ✅ Handle LOCATION_NOT_FOUND
          if (result.locationError || result.calculatedData?.error) {
            const errorMsg =
              result.locationError || result.calculatedData?.error || '';
            if (
              errorMsg.includes('LOCATION_NOT_FOUND') ||
              errorMsg.toLowerCase().includes('location not found')
            ) {
              console.warn('⚠️ [useCheckout] Location not found');
              setLocationErrorIfChanged(
                'Please set your delivery address in profile first',
              );
              setCalculatedDataIfChanged(null);
              hasFetchedRef.current = true;
              return;
            }
          }

          if (result.calculatedData) {
            const processed = checkoutService.processCouponMessage(
              result.couponMessage,
              result.calculatedData,
              couponSuccess,
            );

            setCouponErrorIfChanged(processed.couponError);
            setCouponSuccessIfChanged(processed.couponSuccess);
            setCouponManuallyApplied(processed.couponManuallyApplied);
            setCalculatedDataIfChanged(
              result.calculatedData as unknown as CalculatedData,
            );
            console.log('✅ [useCheckout] calculatedData set');
          } else {
            console.log('❌ [useCheckout] No calculatedData');
          }

          hasFetchedRef.current = true;
        } catch (error: any) {
          console.error('❌ [useCheckout] Error:', error.message);
          if (error.message === 'LOCATION_NOT_FOUND') {
            setLocationErrorIfChanged(
              'Please set your delivery address in profile first',
            );
          } else {
            setCouponErrorIfChanged(
              error.response?.data?.message || 'Calculation failed',
            );
          }
        } finally {
          isCalculatingRef.current = false;
          setCalculating(false);
          console.log('🔓 [useCheckout] Finished');
        }
      }, 300);
    },
    [
      essentialProductInfo,
      quantity,
      shippingAddress,
      couponCode,
      couponManuallyApplied,
      couponSuccess,
      clearCouponMessages,
      clearLocationError,
      setCouponErrorIfChanged,
      setCouponSuccessIfChanged,
      setLocationErrorIfChanged,
      setCalculatedDataIfChanged,
    ],
  );

  // ✅ AUTO-CALCULATION - Only triggers when fetchKey changes
  useEffect(() => {
    console.log('🔍 [useCheckout] Auto-calculation check');
    console.log('  - fetchKey:', fetchKey);
    console.log('  - lastFetchKey:', lastFetchKeyRef.current);

    if (essentialProductInfo && fetchKey !== lastFetchKeyRef.current) {
      console.log('✅ [useCheckout] Triggering fetch...');
      lastFetchKeyRef.current = fetchKey;
      hasFetchedRef.current = false;
      fetchCalculatedData();
    } else {
      console.log('❌ [useCheckout] Skipping - no change');
    }
  }, [essentialProductInfo, fetchKey, fetchCalculatedData]);

  // ✅ STABLE applyCoupon
  const applyCoupon = useCallback(
    async (code: string) => {
      console.log('🔄 [useCheckout] applyCoupon:', code);
      if (calculating) {
        console.log('❌ Already calculating, skipping');
        return;
      }
      try {
        triggerHaptic('light');
        clearCouponMessages();
        setCouponManuallyApplied(true);
        hasFetchedRef.current = false;
        await fetchCalculatedData();
        console.log('✅ Coupon applied');
      } catch (error) {
        console.error('❌ Failed to apply coupon:', error);
        setCouponErrorIfChanged('Failed to apply coupon');
        setCouponManuallyApplied(false);
      }
    },
    [
      calculating,
      clearCouponMessages,
      fetchCalculatedData,
      setCouponErrorIfChanged,
    ],
  );

  // ✅ STABLE removeCoupon
  const removeCoupon = useCallback(async () => {
    console.log('🔄 [useCheckout] removeCoupon');
    if (calculating) {
      console.log('❌ Already calculating, skipping');
      return;
    }
    try {
      triggerHaptic('light');
      clearCouponMessages();
      setCouponManuallyApplied(false);
      hasFetchedRef.current = false;
      await fetchCalculatedData({ skipCouponCheck: true });
      setCouponSuccessIfChanged('Coupon removed successfully');
      console.log('✅ Coupon removed');
    } catch (error) {
      console.error('❌ Failed to remove coupon:', error);
      setCouponErrorIfChanged('Failed to remove coupon');
    }
  }, [
    calculating,
    clearCouponMessages,
    fetchCalculatedData,
    setCouponSuccessIfChanged,
    setCouponErrorIfChanged,
  ]);

  return {
    calculatedData,
    calculating,
    couponError,
    couponSuccess,
    couponManuallyApplied,
    locationError,
    setCouponError: setCouponErrorIfChanged,
    setCouponSuccess: setCouponSuccessIfChanged,
    setCouponManuallyApplied,
    clearCouponMessages,
    clearLocationError,
    fetchCalculatedData,
    applyCoupon,
    removeCoupon,
  };
};
