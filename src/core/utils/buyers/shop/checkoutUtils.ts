// utils/checkoutUtils.ts
import { Dimensions, Platform, Vibration } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const isSmallDevice = SCREEN_HEIGHT < 700;
export const isLargeDevice = SCREEN_HEIGHT >= 800;

export const scaleFont = (baseSize: number): number => {
  if (isSmallDevice) return baseSize - 2;
  if (isLargeDevice) return baseSize + 2;
  return baseSize;
};

export const scaleSpacing = (baseSpacing: number): number => {
  if (isSmallDevice) return baseSpacing - 2;
  if (isLargeDevice) return baseSpacing + 2;
  return baseSpacing;
};

export const formatTruncate2Decimals = (value: number): string => {
  if (!value || isNaN(value)) return '0.00';
  const strValue = value.toString();
  const decimalIndex = strValue.indexOf('.');
  if (decimalIndex === -1) return `${strValue}.00`;
  const decimalPart = strValue.substring(decimalIndex + 1);
  if (decimalPart.length === 1) return `${strValue}0`;
  if (decimalPart.length >= 2) return strValue.substring(0, decimalIndex + 3);
  return strValue;
};

export const parseCoordinate = (value: any): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error';

export const triggerHaptic = (type: HapticType = 'light') => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      const vibrationPattern: Record<HapticType, number | number[]> = {
        light: 10,
        medium: 20,
        heavy: 30,
        success: [0, 50, 30, 50],
        warning: [0, 100, 50, 100],
        error: [0, 200, 100, 200],
      };
      Vibration.vibrate(vibrationPattern[type]);
    } catch (error) {
      // Silent fail
    }
  }
};

export const getSafeValue = <T>(
  value: T | undefined | null,
  defaultValue: T,
): T => {
  return value !== undefined && value !== null ? value : defaultValue;
};

export const getGrandTotalSafe = (calculatedData: any): number => {
  return getSafeValue(calculatedData?.grandTotal, 0);
};

export const getDiscountAppliedSafe = (calculatedData: any): number => {
  return getSafeValue(calculatedData?.discountApplied, 0);
};

export const getDeliveryChargeSafe = (calculatedData: any): number => {
  return getSafeValue(calculatedData?.deliveryCharge, 0);
};

export const getSubtotalSafe = (calculatedData: any): number => {
  return getSafeValue(calculatedData?.subtotal, 0);
};
