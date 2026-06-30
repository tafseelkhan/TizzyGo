// utils/productUtils.ts

export interface VariantFields {
  [key: string]: string;
}

export interface Variant {
  fields?: VariantFields;
  combinationKey?: string;
  mrp?: number;
  price?: number;
  savedAmount?: number;
  discount?: number;
  offerText?: string;
  finalPrice?: number;
  weight?: string;
  height?: string;
  width?: string;
  length?: string;
  inStock?: boolean;
  quantityAvailable?: number | null; // FIXED: Added null type
  sku?: string;
  images?: string[];
  video?: string;
  isDefault?: boolean;
  variantId?: string;
  stock?: number;
}

export interface Product {
  _id: string;
  title?: string;
  category?: string;
  brand?: string;
  price?: number;
  mrp?: number;
  discount?: number;
  description?: string;
  images?: string[];
  variants?: Variant[];
  variantOptions?: string[];
  variantValues?: Record<string, string[]>;
  shortDescription?: string;
  fullDescription?: string;
  highlights?: string[];
  specs?: Record<string, any>;
  inStock?: boolean | string;
  quantityAvailable?: number | null; // FIXED: Added null type
  sellerLocation?: any;
  sellerId?: string;
  vendorCodeUID?: string;
  deliveryTime?: string;
  warranty?: string;
  returnPolicy?: string;
  finalPrice?: number;
  protectPromiseFees?: number;
  freeDelivery?: boolean;
  fastDelivery?: boolean;
  safety?: boolean;
  productQuality?: boolean;
  paymentOptions?: boolean;
  manufacturer?: boolean;
  cashOnDelivery?: boolean;
  verified?: boolean;
}

// Filter valid variants
export const filterValidVariants = (variants: any[]): Variant[] => {
  if (!variants || !Array.isArray(variants)) return [];
  return variants.filter(
    v => v && (v.fields || v.combinationKey || v.sku || v.variantId),
  );
};

// Get selected variant
export const getSelectedVariant = (
  variants: Variant[],
  selectedIndex: number,
): Variant | null => {
  if (!variants || variants.length === 0) return null;
  if (selectedIndex >= variants.length) return variants[0];
  return variants[selectedIndex];
};

// Get variant display name
export const getVariantDisplayName = (variant: Variant | null): string => {
  if (!variant) return '';

  if (
    variant.fields &&
    typeof variant.fields === 'object' &&
    Object.keys(variant.fields).length > 0
  ) {
    return Object.entries(variant.fields)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' • ');
  }

  if (variant.combinationKey) {
    return variant.combinationKey.replace(/\|/g, ' • ');
  }

  return '';
};

// Get current price
export const getCurrentPrice = (
  variant: Variant | null,
  product: Product | null,
): number => {
  if (variant?.finalPrice) return variant.finalPrice;
  if (variant?.price) return variant.price;
  if (product?.finalPrice) return product.finalPrice;
  return product?.price || 0;
};

// Get current MRP
export const getCurrentMrp = (
  variant: Variant | null,
  product: Product | null,
): number => {
  if (variant?.mrp) return variant.mrp;
  return product?.mrp || 0;
};

// Get current discount
export const getCurrentDiscount = (
  variant: Variant | null,
  product: Product | null,
): number => {
  if (variant?.discount) return variant.discount;
  return product?.discount || 0;
};

// Get current images
export const getCurrentImages = (
  variant: Variant | null,
  product: Product | null,
): string[] => {
  if (variant?.images && variant.images.length > 0) return variant.images;
  return product?.images || [];
};

// Get current video
export const getCurrentVideo = (
  variant: Variant | null,
): string | undefined => {
  return variant?.video;
};

// Get current SKU
export const getCurrentSku = (variant: Variant | null): string | undefined => {
  return variant?.sku;
};

// Get variant fields array
export const getVariantFieldsArray = (
  variant: Variant | null,
): { name: string; value: string }[] => {
  if (!variant?.fields) return [];
  return Object.entries(variant.fields).map(([name, value]) => ({
    name,
    value: String(value),
  }));
};

// Get stock status - FIXED: Proper null handling
export const getStockStatus = (
  product: Product | null,
  variant: Variant | null,
) => {
  if (!product) {
    return {
      isInStock: false,
      stock: 0,
      message: 'Product not available',
      showSoldOutBanner: true,
    };
  }

  let isInStock: boolean;
  let finalStock: number;

  if (variant) {
    if (variant.inStock !== undefined) {
      isInStock = variant.inStock;
    } else if (
      variant.quantityAvailable !== undefined &&
      variant.quantityAvailable !== null
    ) {
      isInStock = variant.quantityAvailable > 0;
    } else {
      isInStock = true;
    }
    finalStock = (variant.quantityAvailable ?? variant.stock) || 0;
  } else {
    const inStockValue = product.inStock;
    if (typeof inStockValue === 'boolean') {
      isInStock = inStockValue;
    } else if (typeof inStockValue === 'string') {
      isInStock = inStockValue.toLowerCase() === 'true';
    } else {
      isInStock = false;
    }
    finalStock = product.quantityAvailable ?? 0;
  }

  const shouldShowSoldOut =
    !isInStock || (finalStock !== undefined && finalStock <= 0);

  return {
    isInStock: !shouldShowSoldOut,
    stock: finalStock || 0,
    message: shouldShowSoldOut
      ? 'Out of Stock'
      : finalStock
      ? `In Stock (${finalStock} available)`
      : 'In Stock',
    showSoldOutBanner: shouldShowSoldOut,
  };
};

// Get description text
export const getDescriptionText = (
  product: Product | null,
  localDescription: string,
): string => {
  if (localDescription) return localDescription;
  if (!product) return '';
  return (
    product.fullDescription ||
    product.description ||
    product.shortDescription ||
    ''
  );
};
