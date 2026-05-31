// utils/productCardUtils.ts
import { Dimensions } from 'react-native';

export const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type Variant = {
  fields?: any[];
  images?: string[];
  video?: string;
};

export type FullProduct = {
  _id: string;
  title: string;
  brand: string;
  description: string;
  subcategory: string;
  variants?: Variant[];
  mrp: number;
  price: number;
  discount: number;
  finalPrice: number;
  offerText?: string;
  averageRating?: number;
  reviewCount?: number;
};

export type ApiProductResponse = {
  productId: string;
  fullProduct: FullProduct;
};

export const FALLBACK_IMAGE =
  'https://placehold.co/400x400/e5e7eb/6b7280?text=Product';

export const cleanImageUrl = (url: string): string => {
  if (!url) return FALLBACK_IMAGE;
  let cleanUrl = url.replace('…', '').trim();
  if (cleanUrl && !cleanUrl.startsWith('http')) {
    cleanUrl = `https://${cleanUrl}`;
  }
  return cleanUrl;
};

export const getProductMedia = (product: ApiProductResponse): string[] => {
  const media: string[] = [];
  const fullProduct = product.fullProduct;

  if (!fullProduct?.variants?.length) {
    return [FALLBACK_IMAGE];
  }

  const firstVariant = fullProduct.variants[0];

  if (firstVariant.images && Array.isArray(firstVariant.images)) {
    firstVariant.images.forEach((img: string) => {
      if (img && typeof img === 'string' && img.length > 10) {
        const cleanUrl = cleanImageUrl(img);
        if (cleanUrl && !media.includes(cleanUrl)) {
          media.push(cleanUrl);
        }
      }
    });
  }

  if (media.length === 0) {
    media.push(FALLBACK_IMAGE);
  }

  return media;
};

export const getProductDisplayData = (fullProduct: FullProduct) => {
  return {
    originalPrice: fullProduct.mrp || 0,
    sellingPrice: fullProduct.finalPrice || fullProduct.price || 0,
    discount: fullProduct.discount || 0,
    averageRating: fullProduct.averageRating || 0,
    title: fullProduct.title,
    brand: fullProduct.brand,
    description: fullProduct.description,
    subcategory: fullProduct.subcategory,
  };
};

export const formatPrice = (price: number): string => {
  return `₹${price.toLocaleString()}`;
};

export const isValidProduct = (product: ApiProductResponse | null): boolean => {
  return !!product?.fullProduct?._id;
};
