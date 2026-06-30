// utils/cart.utils.ts
import { Platform, Vibration } from 'react-native';
import {
  ProductVariant,
  SelectedVariant,
  VariantField,
  SelectedVariantExtended,
} from '../../../types/CartTypes';

export const isVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  const urlLower = url.toLowerCase();
  return (
    /\.(mp4|mov|webm|mkv|avi|wmv|flv|m4v)$/i.test(urlLower) ||
    urlLower.includes('/video/') ||
    urlLower.includes('video=true')
  );
};

export const normalizeMedia = (
  images: string[] = [],
  video?: string,
): { type: 'image' | 'video'; url: string }[] => {
  const media: { type: 'image' | 'video'; url: string }[] = [];
  if (images && Array.isArray(images)) {
    images.forEach(img => {
      if (img && img.trim() !== '') {
        media.push({ type: 'image', url: img });
      }
    });
  }
  if (video && video.trim() !== '') {
    media.unshift({ type: 'video', url: video });
  }
  return media;
};

export const formatPrice = (price: number): string => {
  return `₹${price.toLocaleString('en-IN')}`;
};

export const triggerVibration = () => {
  if (Platform.OS === 'ios') Vibration.vibrate([0, 30, 0, 30]);
  else Vibration.vibrate(300);
};

/**
 * Create a SelectedVariant from a ProductVariant
 * Returns SelectedVariantExtended to include all properties
 */
export const createSelectedVariant = (
  variant: ProductVariant,
  variantIndex: number,
): SelectedVariantExtended | null => {
  if (!variant) return null;

  const variantIdToUse: string = variant.variantId || variant._id || '';

  // Get fields as object if they exist
  let fields: Record<string, string> = {};
  let fieldsArray: VariantField[] = [];

  if (variant.fields) {
    if (Array.isArray(variant.fields)) {
      // If fields is an array of VariantField
      fieldsArray = variant.fields;
      variant.fields.forEach((field: VariantField) => {
        if (field.name && field.value) {
          fields[field.name] = field.value;
        }
      });
    } else if (typeof variant.fields === 'object') {
      // If fields is already a Record<string, string>
      fields = variant.fields as Record<string, string>;
      fieldsArray = Object.entries(fields).map(([name, value]) => ({
        name,
        value,
      }));
    }
  }

  // Build the base variant object that matches SelectedVariant
  const baseVariant: SelectedVariant = {
    variantId: variantIdToUse,
    combinationKey: variant.combinationKey || '',
    price: variant.price || 0,
    mrp: variant.mrp || 0,
    finalPrice: variant.finalPrice || variant.price || 0,
    sku: variant.sku || '',
    fields: fields,
    inStock: variant.inStock ?? false,
    quantityAvailable: variant.quantityAvailable ?? 0,
    images: variant.images || [],
    isDefault: variant.isDefault ?? false,
    savedAmount: variant.savedAmount ?? 0,
    discount: variant.discount ?? 0,
  };

  // Return extended variant with additional properties
  const extendedVariant: SelectedVariantExtended = {
    ...baseVariant,
    _id: variant._id,
    variantImages: variant.images || [],
    variantVideo: variant.video,
    variantImage: variant.images?.[0],
    variantSku: variant.sku,
    fieldsArray: fieldsArray,
  };

  return extendedVariant;
};

/**
 * Legacy function - use createSelectedVariant instead
 * @deprecated
 */
export const createSelectedVariantLegacy = (
  variant: ProductVariant,
  variantIndex: number,
): SelectedVariant | null => {
  if (!variant) return null;

  const variantIdToUse: string = variant.variantId || variant._id || '';

  // Get fields as object
  let fields: Record<string, string> = {};
  if (variant.fields) {
    if (Array.isArray(variant.fields)) {
      variant.fields.forEach((field: VariantField) => {
        if (field.name && field.value) {
          fields[field.name] = field.value;
        }
      });
    } else if (typeof variant.fields === 'object') {
      fields = variant.fields as Record<string, string>;
    }
  }

  // Build the variant object with all required properties
  const newVariant: SelectedVariant = {
    variantId: variantIdToUse,
    combinationKey: variant.combinationKey || '',
    price: variant.price || 0,
    mrp: variant.mrp || 0,
    finalPrice: variant.finalPrice || variant.price || 0,
    sku: variant.sku || '',
    fields: fields,
    inStock: variant.inStock ?? false,
    quantityAvailable: variant.quantityAvailable ?? 0,
    images: variant.images || [],
    isDefault: variant.isDefault ?? false,
    savedAmount: variant.savedAmount ?? 0,
    discount: variant.discount ?? 0,
  };

  return newVariant;
};

export const getThemeColors = (isDark: boolean) => ({
  primary: '#F59E0B',
  primaryLight: '#FBBF24',
  success: '#10B981',
  danger: '#EF4444',
  dark: isDark ? '#F1F5F9' : '#1A1A2E',
  light: isDark ? '#1E293B' : '#F8F9FA',
  gray: isDark ? '#94A3B8' : '#6C757D',
  white: isDark ? '#0F172A' : '#FFFFFF',
  modalBg: isDark ? '#1E293B' : '#FFFFFF',
  modalBorder: isDark ? '#334155' : '#f3f4f6',
  textPrimary: isDark ? '#F1F5F9' : '#1A1A2E',
  textSecondary: isDark ? '#CBD5E1' : '#485696',
  cardBg: isDark ? '#1E293B' : '#FFFFFF',
  borderColor: isDark ? '#334155' : '#E5E7EB',
  videoBg: isDark ? '#1E293B' : '#E6F7F1',
});

/**
 * Helper to check if a variant is in stock
 */
export const isVariantAvailable = (
  variant: SelectedVariant | SelectedVariantExtended | null | undefined,
): boolean => {
  if (!variant) return false;
  return variant.inStock === true && (variant.quantityAvailable ?? 0) > 0;
};

/**
 * Helper to get display price
 */
export const getDisplayPrice = (
  variant: SelectedVariant | SelectedVariantExtended | null | undefined,
): string => {
  if (!variant) return formatPrice(0);
  return formatPrice(variant.price || 0);
};

/**
 * Helper to get display MRP
 */
export const getDisplayMRP = (
  variant: SelectedVariant | SelectedVariantExtended | null | undefined,
): string => {
  if (!variant) return formatPrice(0);
  return formatPrice(variant.mrp || 0);
};

/**
 * Helper to get savings
 */
export const getSavings = (
  variant: SelectedVariant | SelectedVariantExtended | null | undefined,
): number => {
  if (!variant) return 0;
  return (variant.mrp || 0) - (variant.price || 0);
};

/**
 * Helper to get discount percentage
 */
export const getDiscountPercent = (
  variant: SelectedVariant | SelectedVariantExtended | null | undefined,
): number => {
  if (!variant || !variant.mrp || variant.mrp === 0) return 0;
  return Math.round(((variant.mrp - (variant.price || 0)) / variant.mrp) * 100);
};

/**
 * Get primary image from variant
 */
export const getPrimaryImage = (
  variant: SelectedVariant | SelectedVariantExtended | null | undefined,
): string | undefined => {
  if (!variant) return undefined;

  // Try images array first
  if (variant.images && variant.images.length > 0) {
    return variant.images[0];
  }

  // Try variantImages (extended)
  const extended = variant as SelectedVariantExtended;
  if (extended.variantImages && extended.variantImages.length > 0) {
    return extended.variantImages[0];
  }

  // Try variantImage (single)
  if (extended.variantImage) {
    return extended.variantImage;
  }

  return undefined;
};

/**
 * Get all media (images + video) from variant
 */
export const getVariantMedia = (
  variant: SelectedVariant | SelectedVariantExtended | null | undefined,
): { type: 'image' | 'video'; url: string }[] => {
  if (!variant) return [];

  const images =
    variant.images || (variant as SelectedVariantExtended).variantImages || [];
  const video = (variant as SelectedVariantExtended).variantVideo;

  return normalizeMedia(images, video);
};
