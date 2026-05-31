// src/utils/couponUtils.ts
export interface CouponErrorInfo {
  type: 'expired' | 'maxAmount' | 'minAmount' | 'invalid' | 'general';
  title: string;
  icon: string;
  color: string;
  suggestion: string;
}

export const parseCouponError = (errorMessage: string): CouponErrorInfo => {
  const lowerMsg = errorMessage.toLowerCase();

  if (lowerMsg.includes('expired')) {
    return {
      type: 'expired',
      title: 'Coupon Expired',
      icon: 'timer-off',
      color: '#f39c12',
      suggestion: 'This coupon has expired. Check for new coupons.',
    };
  }

  if (
    lowerMsg.includes('maximum') ||
    lowerMsg.includes('maxamount') ||
    lowerMsg.includes('maximum applicable amount')
  ) {
    return {
      type: 'maxAmount',
      title: 'Amount Limit Exceeded',
      icon: 'money-off',
      color: '#9b59b6',
      suggestion:
        'This coupon has a maximum discount limit. Try applying on smaller orders.',
    };
  }

  if (lowerMsg.includes('minimum') || lowerMsg.includes('minamount')) {
    return {
      type: 'minAmount',
      title: 'Minimum Amount Required',
      icon: 'attach-money',
      color: '#3498db',
      suggestion: 'Add more items to reach the minimum order amount.',
    };
  }

  if (
    lowerMsg.includes('invalid') ||
    lowerMsg.includes('not found') ||
    lowerMsg.includes('not valid')
  ) {
    return {
      type: 'invalid',
      title: 'Invalid Coupon',
      icon: 'close',
      color: '#e74c3c',
      suggestion: 'Please check the coupon code and try again.',
    };
  }

  return {
    type: 'general',
    title: 'Coupon Error',
    icon: 'error-outline',
    color: '#e74c3c',
    suggestion: 'Failed to apply coupon. Please try again.',
  };
};

export const getCouponStatusText = (couponUsed: string | undefined): string => {
  return couponUsed || 'None';
};

export const getDiscountDisplay = (discount: number | undefined): string => {
  if (!discount) return '₹0.00';
  return `₹${discount.toFixed(2)}`;
};
