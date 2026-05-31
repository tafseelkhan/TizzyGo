// utils/cart.utils.ts
import { Platform, Vibration } from 'react-native';
import {
  ProductVariant,
  SelectedVariant,
  VariantField,
} from '../../types/CartTypes';

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

export const createSelectedVariant = (
  variant: ProductVariant,
  variantIndex: number,
): SelectedVariant | null => {
  if (!variant) return null;

  const variantIdToUse: string = variant.variantId || variant._id || '';

  const newVariant: SelectedVariant = {
    variantId: variantIdToUse,
    _id: variant._id,
    mrp: variant.mrp || 0,
    price: variant.price || 0,
    savedAmount: variant.savedAmount || 0,
    discount: variant.discount || 0,
    finalPrice: variant.finalPrice || variant.price || 0,
  };

  if (variant.fields && Array.isArray(variant.fields)) {
    variant.fields.forEach((field: VariantField) => {
      newVariant[field.name] = field.value;
      if (field.image) newVariant.variantImage = field.image;
      if (field.sku) newVariant.variantSku = field.sku;
    });
  }

  if (variant.images?.length) newVariant.variantImages = variant.images;
  if (variant.video) newVariant.variantVideo = variant.video;

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
