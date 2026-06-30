// src/services/couponService.ts
export interface CouponValidationResult {
  isValid: boolean;
  error?: string;
  discount?: number;
}

class CouponService {
  private static instance: CouponService;

  static getInstance(): CouponService {
    if (!CouponService.instance) {
      CouponService.instance = new CouponService();
    }
    return CouponService.instance;
  }

  validateCouponCode(code: string): CouponValidationResult {
    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedCode) {
      return { isValid: false, error: 'Please enter coupon code' };
    }

    if (trimmedCode.length < 3) {
      return { isValid: false, error: 'Coupon code is too short' };
    }

    if (!/^[A-Z0-9]+$/.test(trimmedCode)) {
      return { isValid: false, error: 'Invalid coupon format' };
    }

    return { isValid: true };
  }

  isCouponAlreadyApplied(
    couponCode: string,
    appliedCode: string | undefined,
  ): boolean {
    return !!(appliedCode && couponCode === appliedCode);
  }
}

export default CouponService.getInstance();
