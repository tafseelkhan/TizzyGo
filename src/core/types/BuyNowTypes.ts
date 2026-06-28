// types/buyNow.types.ts

export interface VariantField {
  name: string;
  value: string;
  price?: number;
  stock?: number;
  sku?: string;
  image?: string;
}

export interface ProductVariant {
  _id?: string;
  variantId?: string;
  id?: string;
  mrp?: number;
  price?: number;
  savedAmount?: number;
  discount?: number;
  finalPrice?: number;
  inStock?: boolean;
  quantityAvailable?: number;
  sku?: string;
  combinationKey?: string;
  images?: string[];
  video?: string;
  fields?: VariantField[];
  [key: string]: any;
}

export interface SelectedVariant {
  variantId?: string;
  _id?: string;
  mrp?: number;
  price?: number;
  savedAmount?: number;
  discount?: number;
  finalPrice?: number;
  variantImage?: string;
  variantImages?: string[];
  variantVideo?: string;
  variantSku?: string;
  [key: string]: any;
}

export interface ProductData {
  _id?: string;
  id?: string;
  title?: string;
  brand?: string;
  description?: string;
  verified?: boolean;
  images?: string[];
  video?: string;
  highlights?: string[];
  variants?: any[];
  [key: string]: any;
}

export interface BuyNowProps {
  product?: ProductData | null;
  productLoading?: boolean;
  productAvailable?: boolean;
  variants?: ProductVariant[];
  selectedVariant?: SelectedVariant | null;
  onVariantSelect?: (variant: SelectedVariant | null) => void;
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  success: string;
  danger: string;
  dark: string;
  light: string;
  gray: string;
  white: string;
  black: string;
  cardHover: string;
  modalBg: string;
  modalBorder: string;
  textPrimary: string;
  textSecondary: string;
  cardBg: string;
  borderColor: string;
  shadowColor: string;
  infoBg: string;
  infoBorder: string;
  videoBg: string;
  badgeBg: string;
  stockBg: string;
  stockText: string;
  inStockBg: string;
  inStockText: string;
}

export type RootStackParamList = {
  BuyNow: { productId: string; variantId?: string | null };
};
