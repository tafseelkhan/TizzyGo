// types/cart.types.ts - SYNCED WITH SHOPTYPES

import {
  ProductVariant as ShopProductVariant,
  SelectedVariant as ShopSelectedVariant,
  VariantFields as ShopVariantFields,
  Product,
} from './ShopTypes';

// ============ RE-EXPORT SHOP TYPES ============
export type { ShopProductVariant as ProductVariant };
export type { ShopSelectedVariant as SelectedVariant };
export type { ShopVariantFields as VariantFields };

// ============ COMPATIBILITY TYPES (For backward compatibility) ============

// VariantField interface (matches ShopTypes VariantFields)
export interface VariantField {
  name: string;
  value: string;
  price?: number;
  stock?: number;
  sku?: string;
  image?: string;
}

// Convert VariantFields (object) to VariantField[] (array)
export function variantFieldsToArray(
  fields: Record<string, string>,
): VariantField[] {
  return Object.entries(fields || {}).map(([name, value]) => ({
    name,
    value,
  }));
}

// Convert VariantField[] to VariantFields (object)
export function variantArrayToFields(
  variants: VariantField[],
): Record<string, string> {
  const result: Record<string, string> = {};
  variants?.forEach(variant => {
    if (variant.name && variant.value) {
      result[variant.name] = variant.value;
    }
  });
  return result;
}

// Extended ProductVariant with array fields support
export interface ProductVariantExtended extends ShopProductVariant {
  fieldsArray?: VariantField[]; // For compatibility with array-based fields
}

// Extended SelectedVariant with more flexible properties
export interface SelectedVariantExtended extends ShopSelectedVariant {
  variantImages?: string[];
  variantVideo?: string;
  variantImage?: string;
  variantSku?: string;
  [key: string]: any;
}

// ============ CART SPECIFIC TYPES ============

export interface CartItemParams {
  productId: string;
  productData?: Product | any;
  quantity?: number;
  selectedVariant?: ShopSelectedVariant | SelectedVariantExtended | null;
}

export interface CartState {
  isInCart: boolean;
  quantity: number;
  isLoading: boolean;
  isAdding: boolean;
}

export interface AddToCartProps {
  productId: string;
  productData: Product | any;
  initialIsInCart?: boolean;
  initialQuantity?: number;
  productLoading?: boolean;
  productAvailable?: boolean;
  maxQuantity?: number;
  style?: any;
  compact?: boolean;
  variants?: ShopProductVariant[] | ProductVariantExtended[];
  selectedVariant?: ShopSelectedVariant | SelectedVariantExtended | null;
  onVariantSelect?: (
    variant: ShopSelectedVariant | SelectedVariantExtended | null,
  ) => void;
  onAddToCartSuccess?: () => void;
}

export interface CartStatusResponse {
  inCart: boolean;
  quantity: number;
  selectedVariant?: ShopSelectedVariant | SelectedVariantExtended | null;
}

// ============ HELPER FUNCTIONS ============

/**
 * Convert ShopTypes ProductVariant to CartTypes format (with fields array)
 */
export function toCartVariant(
  variant: ShopProductVariant,
): ProductVariantExtended {
  const fieldsArray = variant.fields
    ? Object.entries(variant.fields).map(([name, value]) => ({ name, value }))
    : [];

  return {
    ...variant,
    fieldsArray,
    variantId: variant.variantId,
    mrp: variant.mrp,
    price: variant.price,
    savedAmount: variant.savedAmount,
    discount: variant.discount,
    finalPrice: variant.finalPrice,
    images: variant.images,
    video: variant.video,
    combinationKey: variant.combinationKey,
    inStock: variant.inStock,
    quantityAvailable: variant.quantityAvailable,
    sku: variant.sku,
    isDefault: variant.isDefault,
  };
}

/**
 * Convert CartTypes SelectedVariant to ShopTypes format
 */
export function toShopSelectedVariant(
  variant: SelectedVariantExtended | null,
): ShopSelectedVariant | null {
  if (!variant) return null;

  // Convert fields from array to object if needed
  let fields: Record<string, string> = {};
  if (variant.fields) {
    fields = variant.fields;
  } else if ((variant as any).fieldsArray) {
    (variant as any).fieldsArray.forEach((field: VariantField) => {
      if (field.name && field.value) {
        fields[field.name] = field.value;
      }
    });
  }

  return {
    variantId: variant.variantId,
    combinationKey: variant.combinationKey || '',
    price: variant.price || 0,
    mrp: variant.mrp || 0,
    finalPrice: variant.finalPrice || variant.price || 0,
    sku: variant.variantSku || variant.sku || '',
    fields: fields,
  };
}

/**
 * Create SelectedVariant from ProductVariant
 */
export function createSelectedVariant(
  variant: ShopProductVariant | ProductVariantExtended,
  variantIndex?: number,
): SelectedVariantExtended | null {
  if (!variant) return null;

  // Convert fields to array format if needed
  let fieldsArray: VariantField[] = [];
  if ((variant as any).fieldsArray) {
    fieldsArray = (variant as any).fieldsArray;
  } else if (variant.fields) {
    fieldsArray = Object.entries(variant.fields).map(([name, value]) => ({
      name,
      value,
    }));
  }

  return {
    variantId: variant.variantId,
    _id: variant._id,
    mrp: variant.mrp,
    price: variant.price,
    savedAmount: variant.savedAmount,
    discount: variant.discount,
    finalPrice: variant.finalPrice || variant.price,
    variantImages: variant.images,
    variantVideo: variant.video,
    variantImage: variant.images?.[0],
    sku: variant.sku,
    fields: variant.fields,
    fieldsArray: fieldsArray,
    combinationKey: variant.combinationKey,
  };
}
