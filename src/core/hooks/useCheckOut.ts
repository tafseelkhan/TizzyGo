// hooks/useCheckout.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  checkoutService,
  EssentialProductInfo,
} from '../services/shop/checkoutService';
import { Product, CalculatedData, ShippingAddress } from '../types/ShopTypes';
import { triggerHaptic } from '../utils/shop/checkoutUtils';

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
  const [calculatedData, setCalculatedData] = useState<CalculatedData | null>(
    null,
  );
  const [calculating, setCalculating] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [couponManuallyApplied, setCouponManuallyApplied] = useState(false);

  const calculationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  ); // ✅ Fixed: Removed NodeJS.Timeout type for React Native
  const isCalculatingRef = useRef(false);

  const clearCouponMessages = useCallback(() => {
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
      if (isCalculatingRef.current || !essentialProductInfo) return;

      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }

      calculationTimeoutRef.current = setTimeout(async () => {
        try {
          isCalculatingRef.current = true;
          setCalculating(true);
          if (!options.skipCouponCheck) clearCouponMessages();

          const result = await checkoutService.calculatePrice(
            essentialProductInfo,
            quantity,
            shippingAddress,
            couponCode,
            couponManuallyApplied,
            options,
          );

          if (result.calculatedData) {
            const processed = checkoutService.processCouponMessage(
              result.couponMessage,
              result.calculatedData,
              couponSuccess,
            );

            setCouponError(processed.couponError);
            setCouponSuccess(processed.couponSuccess);
            setCouponManuallyApplied(processed.couponManuallyApplied);
            setCalculatedData(result.calculatedData);
          }
        } catch (error: any) {
          console.error('Calculation error:', error.message);
          setCouponError(error.response?.data?.message || 'Calculation failed');
        } finally {
          isCalculatingRef.current = false;
          setCalculating(false);
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

  const applyCoupon = useCallback(
    async (code: string) => {
      if (calculating) return;
      try {
        triggerHaptic('light');
        clearCouponMessages();
        setCouponManuallyApplied(true);
        await fetchCalculatedData();
      } catch (error) {
        setCouponError('Failed to apply coupon');
        setCouponManuallyApplied(false);
      }
    },
    [calculating, clearCouponMessages, fetchCalculatedData],
  );

  const removeCoupon = useCallback(async () => {
    if (calculating) return;
    try {
      triggerHaptic('light');
      clearCouponMessages();
      setCouponManuallyApplied(false);
      await fetchCalculatedData({ skipCouponCheck: true });
      setCouponSuccess('Coupon removed successfully');
    } catch (error) {
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
