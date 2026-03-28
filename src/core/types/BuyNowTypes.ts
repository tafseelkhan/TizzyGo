// types/BuyNow.ts

export type Product = {
  _id: string;
  id?: string;
  title: string;
  price: number;
  mrp?: number;
  discount?: number;
  finalPrice?: number;
  cashOnDelivery?: boolean;
  category: string;
  delivery: string;
  freeDelivery?: boolean;
  
  // Seller Location
  sellerLocation?: {
    address?: string;
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
    googlePlaceId?: string;
  };
  
  // Product Images & Media
  images?: string[];
  description?: string;
  brand?: string;
  productId?: string;
  offerText?: string;
  savedAmount?: number;
  shortDescription?: string;
  
  // ✅ Product Dimensions
  weight?: number | string;
  height?: number | string;
  width?: number | string;
  length?: number | string;
  
  // ✅ Additional Fields
  inStock?: boolean;
  quantityAvailable?: number;
  deliveryTime?: string;
  warranty?: string;
  returnPolicy?: string;
  
  // ✅ Variant Data
  selectedVariant?: {
    Storage?: string;
    RAM?: string;
    Color?: string;
    Warranty?: string;
    [key: string]: any; // For other variant properties
  };
  
  variantImages?: string[];
  variantVideo?: string;
  
  // ✅ Nested Product Data
  productData?: {
    _id?: string;
    title?: string;
    brand?: string;
    description?: string;
    productId?: string;
    mrp?: number;
    price?: number;
    savedAmount?: number;
    discount?: number;
    offerText?: string;
    finalPrice?: number;
    freeDelivery?: boolean;
    weight?: number | string;
    height?: number | string;
    width?: number | string;
    length?: number | string;
    inStock?: boolean;
    quantityAvailable?: number;
    deliveryTime?: string;
    warranty?: string;
    returnPolicy?: string;
    shortDescription?: string;
    sellerLocation?: {
      address?: string;
      latitude?: number;
      longitude?: number;
      googlePlaceId?: string;
    };
    images?: string[];
    variants?: Array<any>;
    [key: string]: any;
  };
  
  // ✅ Full Product (backward compatibility)
  fullProduct?: any;
};

export type CalculatedData = {
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
  
  // ✅ Product dimensions from backend response
  productWeight?: number | string;
  productHeight?: number | string;
  productWidth?: number | string;
  productLength?: number | string;
  
  // ✅ Location data
  buyerLocation?: {
    address?: string;
    latitude?: number;
    longitude?: number;
    googlePlaceId?: string;
  };
  
  sellerLocation?: {
    address?: string;
    latitude?: number;
    longitude?: number;
    googlePlaceId?: string;
  };
};

export type ShippingAddress = {
  address: string;
  latitude: number | null;
  longitude: number | null;
  googlePlaceId: string;
};

export type CheckoutData = {
  productId: string;
  quantity: number;
  shippingAddress: ShippingAddress;
  couponCode: string;
  paymentMethod: string | null;
  orderNotes: string;
  // Add optional price field for display purposes
  price?: number;
};

// ✅ Helper function to get product dimensions
export function getProductDimensions(product: Product | null): {
  weight: string;
  height: string;
  width: string;
  length: string;
} {
  if (!product) {
    return {
      weight: "0",
      height: "0",
      width: "0",
      length: "0"
    };
  }

  const productData = product.productData || product;
  
  // Extract dimensions from productData or product
  return {
    weight: String(productData.weight || product.weight || "0"),
    height: String(productData.height || product.height || "0"),
    width: String(productData.width || product.width || "0"),
    length: String(productData.length || product.length || "0")
  };
}

// ✅ Get product weight for display
export function getProductWeight(product: Product | null): string {
  if (!product) return "0";
  
  const productData = product.productData || product;
  const weight = productData.weight || product.weight || "0";
  
  if (typeof weight === 'number') {
    return `${weight} kg`;
  }
  return `${weight}`;
}

// ✅ Get product dimensions for display
export function getProductDimensionsDisplay(product: Product | null): string {
  if (!product) return "Not available";
  
  const dims = getProductDimensions(product);
  
  if (dims.height === "0" && dims.width === "0" && dims.length === "0") {
    return "Not available";
  }
  
  return `${dims.height} × ${dims.width} × ${dims.length} cm`;
}

// ✅ Parse coordinate safely
export function parseCoordinate(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  
  return null;
}

// ✅ Format coordinate for display
export function formatCoordinate(value: number | null): string {
  if (value === null || isNaN(value)) return "Not set";
  return value.toFixed(6);
}

// ✅ Check if coordinates are valid
export function hasValidCoordinates(address: ShippingAddress): boolean {
  return (
    address.latitude !== null &&
    address.longitude !== null &&
    !isNaN(address.latitude) &&
    !isNaN(address.longitude) &&
    address.latitude !== 0 &&
    address.longitude !== 0
  );
}

// ✅ Get coordinates as string for API requests
export function getCoordinatesAsString(address: ShippingAddress): { 
  latitude: string | null; 
  longitude: string | null 
} {
  return {
    latitude: address.latitude !== null ? String(address.latitude) : null,
    longitude: address.longitude !== null ? String(address.longitude) : null
  };
}

// ✅ Create shipping address from Google Place result
export function createShippingAddressFromGooglePlace(
  placeResult: any
): ShippingAddress {
  const address = placeResult.formatted_address || '';
  const location = placeResult.geometry?.location;
  
  return {
    address,
    latitude: location?.lat || null,
    longitude: location?.lng || null,
    googlePlaceId: placeResult.place_id || ''
  };
}

// ✅ Validate shipping address
export function validateShippingAddress(address: ShippingAddress): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!address.address.trim()) {
    errors.push("Address is required");
  }
  
  if (!hasValidCoordinates(address)) {
    errors.push("Valid coordinates are required");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ✅ Default shipping address
export const DEFAULT_SHIPPING_ADDRESS: ShippingAddress = {
  address: '',
  latitude: null,
  longitude: null,
  googlePlaceId: ''
};

// ✅ Get product inventory status
export function getProductInventoryStatus(product: Product | null): {
  inStock: boolean;
  quantity: number;
  deliveryTime: string;
} {
  if (!product) {
    return {
      inStock: false,
      quantity: 0,
      deliveryTime: 'Not available'
    };
  }
  
  const productData = product.productData || product;
  
  return {
    inStock: productData.inStock || false,
    quantity: productData.quantityAvailable || 0,
    deliveryTime: productData.deliveryTime || 'Standard delivery'
  };
}

// ✅ Calculate discount percentage
export function calculateDiscountPercentage(product: Product): number {
  const mrp = product.mrp || product.price;
  const price = product.price;
  
  if (mrp && price && mrp > price) {
    return Math.round(((mrp - price) / mrp) * 100);
  }
  
  return product.discount || 0;
}

// ✅ Get product display price
export function getProductDisplayPrice(product: Product): {
  price: number;
  mrp: number;
  discount: number;
} {
  return {
    price: product.price || 0,
    mrp: product.mrp || product.price || 0,
    discount: calculateDiscountPercentage(product)
  };
}

// ✅ Check if product is on sale
export function isProductOnSale(product: Product): boolean {
  const discount = calculateDiscountPercentage(product);
  return discount > 0;
}

// ✅ Get delivery type
export function getDeliveryType(product: Product): {
  type: 'free' | 'paid' | 'unknown';
  text: string;
} {
  if (product.freeDelivery === true || product.delivery === 'free') {
    return { type: 'free', text: 'FREE Delivery' };
  }
  
  if (product.delivery === 'paid') {
    return { type: 'paid', text: 'Paid Delivery' };
  }
  
  return { type: 'unknown', text: 'Delivery information not available' };
}

// ✅ Format price with Indian Rupee symbol
export function formatPrice(amount: number): string {
  if (isNaN(amount)) return '₹0';
  
  // Format with commas for thousands
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  
  return `₹${formatted}`;
}

// ✅ Create empty checkout data
export function createEmptyCheckoutData(): CheckoutData {
  return {
    productId: '',
    quantity: 1,
    shippingAddress: DEFAULT_SHIPPING_ADDRESS,
    couponCode: '',
    paymentMethod: null,
    orderNotes: ''
  };
}

// ✅ Type guards
export function isProduct(obj: any): obj is Product {
  return (
    obj &&
    typeof obj === 'object' &&
    'title' in obj &&
    'price' in obj &&
    'category' in obj
  );
}

export function isCalculatedData(obj: any): obj is CalculatedData {
  return (
    obj &&
    typeof obj === 'object' &&
    'finalPrice' in obj &&
    'totalFinalPrice' in obj
  );
}

export function isShippingAddress(obj: any): obj is ShippingAddress {
  return (
    obj &&
    typeof obj === 'object' &&
    'address' in obj &&
    'latitude' in obj &&
    'longitude' in obj
  );
}