// types/ShopTypes.ts - FINAL VERSION (Based on Product.model.ts)

/* ==================== CORE TYPES (Matching MongoDB Schema) ==================== */

/**
 * Variant Fields (dynamic like Storage, RAM, Color)
 */
export interface VariantFields {
  [key: string]: string;
}

/**
 * Individual Product Variant Structure
 * Matches IProductVariant from MongoDB schema
 */
export interface ProductVariant {
  variantId: string;
  fields: VariantFields;
  combinationKey: string;

  // Pricing
  mrp: number;
  price: number;
  savedAmount: number;
  discount: number;
  offerText?: string;
  finalPrice: number;

  // Physical specs per variant
  weight?: string;
  height?: string;
  width?: string;
  length?: string;

  // Stock
  inStock: boolean;
  quantityAvailable: number;

  // Other variant fields
  sku: string;
  images: string[];
  video?: string;
  isDefault: boolean;

  // Optional for frontend convenience
  _id?: string;
  availableQuantity?: number; // Alias for quantityAvailable
}

/**
 * Seller Location Structure
 * Matches sellerLocation from MongoDB schema
 */
export interface SellerLocation {
  address: string;
  latitude: number;
  longitude: number;
  googlePlaceId: string;
}

/**
 * Dynamic Specs (from category JSON)
 */
export interface ProductSpecs {
  [key: string]: any;
}

/**
 * Variant Values Map
 */
export interface VariantValues {
  [optionName: string]: string[];
}

/**
 * Main Product Interface
 * Matches IProduct from MongoDB schema
 */
export interface Product {
  // Basic Info
  _id: string;
  id?: string; // Frontend convenience
  title: string;
  brand: string;
  description: string;
  category: string;
  subcategory: string;
  productId: string;
  vendorCodeUID: string;
  sellerId: string;

  // Delivery/Policy
  deliveryTime: string;
  warranty: string;
  returnPolicy: string;

  // Descriptions
  shortDescription: string;
  fullDescription: string;
  highlights: string[];

  // Seller Location
  sellerLocation: SellerLocation;

  // Dynamic Specs (from category JSON)
  specs: ProductSpecs | Map<string, any>;

  // Variant System Fields
  variantOptions: string[]; // e.g., ["Storage", "RAM", "Color"]
  variantValues: VariantValues | Map<string, string[]>;
  variants: ProductVariant[];

  // GST
  gstRate: number;
  gstSource: 'auto' | 'manual';

  // Fulfillment
  fulfillmentType: 'SELLER' | 'FFC';

  // Extra boolean flags
  protectPromiseFees: boolean;
  freeDelivery: boolean;
  fastDelivery: boolean;
  safety: boolean;
  productQuality: boolean;
  paymentOptions: boolean;
  manufacturer: boolean;
  cashOnDelivery: boolean;
  deliveryVehicleType: boolean;

  // Status
  verified: boolean;

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;

  // Frontend convenience fields (not in DB)
  inStock?: boolean;
  maxOrderQty?: number;
  images?: string[];
  video?: string;
}

/* ==================== CHECKOUT & CART TYPES ==================== */

/**
 * Shipping Address
 */
export interface ShippingAddress {
  address: string;
  latitude: number | null;
  longitude: number | null;
  googlePlaceId: string;
}

/**
 * Selected Variant for Cart/Checkout
 */
export interface SelectedVariant {
  variantId: string;
  fields: VariantFields;
  combinationKey: string;
  mrp: number;
  price: number;
  savedAmount: number;
  discount: number;
  offerText?: string;
  finalPrice: number;
  weight?: string;
  height?: string;
  width?: string;
  length?: string;
  inStock: boolean;
  quantityAvailable: number;
  sku: string;
  images: string[];
  video?: string;
  isDefault: boolean;
  _id?: string;
  availableQuantity?: number;
  createdAt?: string;
  updatedAt?: string;
}
/**
 * Checkout Data
 */
export interface CheckoutData {
  productId: string;
  quantity: number;
  shippingAddress: ShippingAddress;
  couponCode: string;
  paymentMethod: string | null;
  orderNotes: string;
  selectedVariant?: SelectedVariant | null;
  price?: number;
}

/**
 * Calculated Data from Backend API
 */
export interface CalculatedData {
  finalPrice: number;
  quantity: number;
  productGstRate: number;
  productGst: number;
  deliveryCharge: number;
  totalFinalPrice: number;
  discountApplied: number;
  couponUsed: string | null;
  coFundApplied: boolean;
  fundSplit: { bank: number; merchant: number };
  distance?: number;
  distanceKm?: number;

  // Product dimensions from backend
  productWeight?: number | string;
  productHeight?: number | string;
  productWidth?: number | string;
  productLength?: number | string;

  // Location data
  buyerLocation?: {
    address?: string;
    latitude?: number;
    longitude?: number;
    googlePlaceId?: string;
  };

  sellerLocation?: SellerLocation;

  // Additional fields
  subtotal?: number;
  grandTotal?: number;
  gst?: number;
  gstAmount?: number;
  totalMrp?: number;
  totalSavings?: number;
  platformFee?: number;

  [key: string]: any;
}

/**
 * Cart Item
 */
export interface CartItem {
  productId: string;
  productData: Product;
  quantity: number;
  selectedVariant?: SelectedVariant | null;
  addedAt: Date;
}

/**
 * Cart State
 */
export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
}

/**
 * Cart Status Response
 */
export interface CartStatus {
  inCart: boolean;
  quantity: number;
  selectedVariant?: SelectedVariant | null;
}

/* ==================== ADD TO CART PROPS ==================== */

export interface AddToCartParams {
  productId: string;
  productData: Product;
  quantity: number;
  selectedVariant?: SelectedVariant | null;
}

export interface UpdateCartParams {
  productId: string;
  quantity: number;
  selectedVariant?: SelectedVariant | null;
}

export interface AddToCartProps {
  productId: string;
  productData: Product;
  initialIsInCart?: boolean;
  initialQuantity?: number;
  productLoading?: boolean;
  productAvailable?: boolean;
  maxQuantity?: number;
  style?: object;
  compact?: boolean;
  variants?: ProductVariant[];
  selectedVariant?: SelectedVariant | null;
  onVariantSelect?: (variant: SelectedVariant | null) => void;
  onAddToCartSuccess?: () => void;
}

/* ==================== UTILITY FUNCTIONS ==================== */

/**
 * Get product ID safely
 */
export const getProductId = (product: Product | null): string => {
  return product?._id || product?.id || product?.productId || '';
};

/**
 * Get product title
 */
export const getProductTitle = (product: Product | null): string => {
  return product?.title || 'Product';
};

/**
 * Get product main image
 */
export const getProductImage = (product: Product | null): string => {
  if (!product) return '';

  if (product.images && product.images.length > 0) {
    return product.images[0];
  }

  const defaultVariant =
    product.variants?.find(v => v.isDefault) || product.variants?.[0];
  if (defaultVariant?.images?.length) {
    return defaultVariant.images[0];
  }

  return '';
};

/**
 * Get default variant from product
 */
export const getDefaultVariant = (
  product: Product | null,
): ProductVariant | null => {
  if (!product?.variants?.length) return null;
  return product.variants.find(v => v.isDefault) || product.variants[0];
};

/**
 * Convert ProductVariant to SelectedVariant
 */
export const toSelectedVariant = (variant: ProductVariant): SelectedVariant => {
  return {
    variantId: variant.variantId,
    combinationKey: variant.combinationKey,
    price: variant.price,
    mrp: variant.mrp,
    finalPrice: variant.finalPrice,
    sku: variant.sku,
    fields: variant.fields,
    savedAmount: variant.savedAmount,
    discount: variant.discount,
    offerText: variant.offerText,
    weight: variant.weight,
    height: variant.height,
    width: variant.width,
    length: variant.length,
    inStock: variant.inStock,
    quantityAvailable: variant.quantityAvailable,
    images: variant.images,
    video: variant.video,
    isDefault: variant.isDefault,
  };
};

/**
 * Check if product has variants
 */
export const hasVariants = (product: Product | null): boolean => {
  return !!(product?.variants && product.variants.length > 0);
};

/**
 * Get product price (from default variant or product)
 */
export const getProductPrice = (product: Product | null): number => {
  if (!product) return 0;
  const defaultVariant = getDefaultVariant(product);
  return (
    defaultVariant?.finalPrice ||
    defaultVariant?.price ||
    (product as any).price ||
    0
  );
};

/**
 * Get product MRP
 */
export const getProductMrp = (product: Product | null): number => {
  if (!product) return 0;
  const defaultVariant = getDefaultVariant(product);
  return (
    defaultVariant?.mrp || (product as any).mrp || getProductPrice(product)
  );
};

/**
 * Get product discount percentage
 */
export const getProductDiscount = (product: Product | null): number => {
  if (!product) return 0;
  const defaultVariant = getDefaultVariant(product);
  return defaultVariant?.discount || (product as any).discount || 0;
};

/**
 * Get product in-stock status
 */
export const getProductInStock = (product: Product | null): boolean => {
  if (!product) return false;

  if (hasVariants(product)) {
    return product.variants!.some(v => v.inStock && v.quantityAvailable > 0);
  }

  return (product as any).inStock !== false;
};

/**
 * Get product available quantity
 */
export const getProductQuantity = (product: Product | null): number => {
  if (!product) return 0;

  const defaultVariant = getDefaultVariant(product);
  if (defaultVariant) {
    return defaultVariant.quantityAvailable;
  }

  return (product as any).quantityAvailable || 0;
};

/**
 * Get max order quantity
 */
export const getMaxOrderQuantity = (product: Product | null): number => {
  return (product as any)?.maxOrderQty || 10;
};

/**
 * Check if delivery is free
 */
export const isFreeDelivery = (product: Product | null): boolean => {
  return (
    product?.freeDelivery === true || (product as any)?.delivery === 'free'
  );
};

/**
 * Get seller location
 */
export const getSellerLocation = (
  product: Product | null,
): SellerLocation | null => {
  return product?.sellerLocation || null;
};

/**
 * Get seller coordinates
 */
export const getSellerCoordinates = (
  product: Product | null,
): { latitude: number | null; longitude: number | null } => {
  const location = getSellerLocation(product);
  return {
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
  };
};

/**
 * Format price with Indian Rupee symbol
 */
export const formatPrice = (amount: number): string => {
  if (!amount || isNaN(amount)) return '₹0';

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `₹${formatted}`;
};

/**
 * Format price without symbol
 */
export const formatPriceNumber = (amount: number): string => {
  if (!amount || isNaN(amount)) return '0';

  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Parse coordinate safely
 */
export const parseCoordinate = (
  value: string | number | null | undefined,
): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return isNaN(value) ? null : value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const num = parseFloat(trimmed);
    return isNaN(num) ? null : num;
  }
  return null;
};

/**
 * Check if coordinates are valid
 */
export const hasValidCoordinates = (address: ShippingAddress): boolean => {
  return (
    address.latitude !== null &&
    address.longitude !== null &&
    !isNaN(address.latitude) &&
    !isNaN(address.longitude) &&
    address.latitude !== 0 &&
    address.longitude !== 0
  );
};

/**
 * Validate shipping address
 */
export const validateShippingAddress = (
  address: ShippingAddress,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!address.address?.trim()) {
    errors.push('Address is required');
  }

  if (!hasValidCoordinates(address)) {
    errors.push('Valid coordinates are required');
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Create shipping address from Google Place
 */
export const createShippingAddressFromGooglePlace = (
  placeResult: any,
): ShippingAddress => {
  const address = placeResult.formatted_address || '';
  const location = placeResult.geometry?.location;

  return {
    address,
    latitude: location?.lat ?? location?.latitude ?? null,
    longitude: location?.lng ?? location?.longitude ?? null,
    googlePlaceId: placeResult.place_id || '',
  };
};

/**
 * Get product dimensions
 */
export const getProductDimensions = (
  product: Product | null,
  variant?: ProductVariant | null,
): ProductDimensions => {
  const defaultDimensions: ProductDimensions = {
    weight: '0',
    height: '0',
    width: '0',
    length: '0',
  };

  if (!product) return defaultDimensions;

  const targetVariant = variant || getDefaultVariant(product);

  if (targetVariant) {
    return {
      weight: targetVariant.weight || '0',
      height: targetVariant.height || '0',
      width: targetVariant.width || '0',
      length: targetVariant.length || '0',
    };
  }

  return defaultDimensions;
};

/**
 * Get product dimensions display string
 */
export const getProductDimensionsDisplay = (
  product: Product | null,
  variant?: ProductVariant | null,
): string => {
  const dims = getProductDimensions(product, variant);

  if (dims.height === '0' && dims.width === '0' && dims.length === '0') {
    return 'Not available';
  }

  return `${dims.height} × ${dims.width} × ${dims.length} cm`;
};

/* ==================== PRODUCT DIMENSIONS INTERFACE ==================== */

export interface ProductDimensions {
  weight: string;
  height: string;
  width: string;
  length: string;
}

/* ==================== CONSTANTS ==================== */

export const DEFAULT_SHIPPING_ADDRESS: ShippingAddress = {
  address: '',
  latitude: null,
  longitude: null,
  googlePlaceId: '',
};

export const createEmptyCheckoutData = (): CheckoutData => ({
  productId: '',
  quantity: 1,
  shippingAddress: { ...DEFAULT_SHIPPING_ADDRESS },
  couponCode: '',
  paymentMethod: null,
  orderNotes: '',
});

/* ==================== TYPE GUARDS ==================== */

export const isProduct = (obj: any): obj is Product => {
  return obj && typeof obj === 'object' && 'title' in obj && 'category' in obj;
};

export const isProductVariant = (obj: any): obj is ProductVariant => {
  return (
    obj &&
    typeof obj === 'object' &&
    'variantId' in obj &&
    'combinationKey' in obj
  );
};

export const isCalculatedData = (obj: any): obj is CalculatedData => {
  return (
    obj &&
    typeof obj === 'object' &&
    'finalPrice' in obj &&
    'totalFinalPrice' in obj
  );
};

export const isShippingAddress = (obj: any): obj is ShippingAddress => {
  return (
    obj &&
    typeof obj === 'object' &&
    'address' in obj &&
    'latitude' in obj &&
    'longitude' in obj
  );
};
