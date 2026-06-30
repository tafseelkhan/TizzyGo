// utils/buyNow.utils.ts

import { Platform, Vibration } from 'react-native';
import { MediaItem, ProductVariant, SelectedVariant, VariantField } from '../../../types/BuyNowTypes';

export const isVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  const urlLower = url.toLowerCase();
  return (
    /\.(mp4|mov|webm|mkv|avi|wmv|flv|m4v)$/i.test(urlLower) ||
    urlLower.includes('/video/') ||
    urlLower.includes('video=true') ||
    urlLower.includes('.mp4') ||
    urlLower.includes('youtube.com') ||
    urlLower.includes('youtu.be') ||
    urlLower.includes('vimeo.com')
  );
};

export const normalizeMedia = (images: string[] = [], video?: string): MediaItem[] => {
  const media: MediaItem[] = [];

  images.forEach(img => {
    if (img && img.trim() !== '') {
      media.push({ type: 'image', url: img });
    }
  });

  if (video && video.trim() !== '') {
    media.unshift({ type: 'video', url: video });
  }

  return media;
};

export const formatPrice = (price: number): string => {
  if (!price && price !== 0) return '₹0';
  return `₹${price.toLocaleString('en-IN')}`;
};

export const triggerVibration = (): void => {
  try {
    if (Platform.OS === 'ios') {
      Vibration.vibrate([0, 30, 0, 30]);
    } else {
      Vibration.vibrate(100);
    }
  } catch (error) {
    console.log('Vibration not supported');
  }
};

export const calculateDiscount = (mrp: number, price: number): number => {
  if (mrp <= 0 || price >= mrp) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
};

export const createSelectedVariant = (variant: ProductVariant, index: number): SelectedVariant | null => {
  if (!variant) return null;

  const variantIdToUse = (variant.variantId || variant._id || '').toString();

  const newVariant: SelectedVariant = {
    variantId: variantIdToUse,
    _id: variant._id,
    mrp: variant.mrp ?? 0,
    price: variant.price ?? 0,
    savedAmount: variant.savedAmount ?? 0,
    discount: variant.discount ?? 0,
    finalPrice: variant.finalPrice ?? variant.price ?? 0,
  };

  if (variant.fields && Array.isArray(variant.fields)) {
    variant.fields.forEach((field: VariantField) => {
      newVariant[field.name] = field.value;
      if (field.image) newVariant.variantImage = field.image;
      if (field.sku) newVariant.variantSku = field.sku;
    });
  }

  if (variant.images && variant.images.length > 0) {
    newVariant.variantImages = variant.images;
  }
  if (variant.video) {
    newVariant.variantVideo = variant.video;
  }

  return newVariant;
};

export const getVariantStockStatus = (variant: ProductVariant): { inStock: boolean; availableQuantity: number } => {
  const inStock = variant.inStock === true;
  const availableQuantity = variant.quantityAvailable || 0;
  return { inStock, availableQuantity };
};