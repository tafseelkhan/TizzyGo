// src/hooks/useCoupon.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import couponService from '../services/shop/couponService';
import { parseCouponError } from '../utils/shop/couponUtils';

interface UseCouponProps {
  initialCode?: string;
  onApplyCoupon: (code: string) => Promise<void>;
  onRemoveCoupon: () => Promise<void>;
  isApplyingCoupon: boolean;
  couponError?: string | null;
  couponSuccess?: string | null;
  clearCouponMessages?: () => void;
}

export const useCoupon = ({
  initialCode = '',
  onApplyCoupon,
  onRemoveCoupon,
  isApplyingCoupon,
  couponError,
  couponSuccess,
  clearCouponMessages,
}: UseCouponProps) => {
  const [couponInput, setCouponInput] = useState(initialCode);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const isApplyingRef = useRef(false);

  useEffect(() => {
    if (couponInput && (couponError || localError || localSuccess)) {
      setLocalError(null);
      setLocalSuccess(null);
      clearCouponMessages?.();
    }
  }, [couponInput]);

  useEffect(() => {
    if (couponError) {
      setLocalError(couponError);
      setLocalSuccess(null);
    }
  }, [couponError]);

  useEffect(() => {
    if (couponSuccess) {
      setLocalSuccess(couponSuccess);
      setLocalError(null);
    }
  }, [couponSuccess]);

  useEffect(() => {
    if (initialCode !== couponInput) {
      setCouponInput(initialCode);
    }
  }, [initialCode]);

  const handleApplyCoupon = useCallback(async () => {
    if (isApplyingRef.current) return;
    
    const validation = couponService.validateCouponCode(couponInput);
    if (!validation.isValid) {
      setLocalError(validation.error || 'Invalid coupon');
      return;
    }
    
    try {
      isApplyingRef.current = true;
      setLocalError(null);
      setLocalSuccess(null);
      await onApplyCoupon(couponInput.trim().toUpperCase());
    } catch (error) {
      console.error('Apply coupon error:', error);
    } finally {
      setTimeout(() => { isApplyingRef.current = false; }, 500);
    }
  }, [couponInput, onApplyCoupon]);

  const handleRemoveCoupon = useCallback(async () => {
    try {
      setCouponInput('');
      setLocalError(null);
      setLocalSuccess(null);
      await onRemoveCoupon();
    } catch (error) {
      setLocalError('Failed to remove coupon');
    }
  }, [onRemoveCoupon]);

  const getParsedError = useCallback(() => {
    if (!localError) return null;
    return parseCouponError(localError);
  }, [localError]);

  return {
    couponInput,
    setCouponInput,
    localError,
    localSuccess,
    isApplyingRef,
    handleApplyCoupon,
    handleRemoveCoupon,
    getParsedError,
  };
};