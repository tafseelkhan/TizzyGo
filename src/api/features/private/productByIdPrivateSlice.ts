import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { TIZZYOS_API_BASE_URL } from '../../connections/snippet/apiBaseUrl';
import { apiRequest } from '../../../core/utils/handler/apiClient';

// ============================================================
// SAFE URL JOINER — TIZZYOS base
// ============================================================

const apiUrl = (path: string): string => {
  if (!TIZZYOS_API_BASE_URL) {
    throw new Error('TIZZYOS_API_BASE_URL is not configured.');
  }
  return `${TIZZYOS_API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
};

// ============================================================
// TYPES
// ============================================================

export interface Product {
  _id: string;
  id?: string;
  title: string;
  brand: string;
  category: string;
  subcategory?: string;
  productId: string;
  mrp: number;
  price: number;
  discount: number;
  offerText?: string;
  finalPrice: number;
  variants?: any[];
  variantOptions?: string[];
  variantValues?: Record<string, string[]>;
  weight?: string;
  height?: string;
  width?: string;
  depth?: string;
  dimensions?: string;
  inStock: boolean;
  quantityAvailable?: number | null;
  stock?: number;
  deliveryTime?: string;
  warranty?: string;
  returnPolicy?: string;
  shortDescription?: string;
  fullDescription?: string;
  description?: string;
  highlights?: string[];
  images?: string[];
  video?: string;
  sellerLocation?: {
    address: string;
    latitude: number;
    longitude: number;
    googlePlaceId: string;
  };
  specs?: Record<string, any>;
  reviewCount?: number;
  originalPrice?: number;
  rating?: number;
  averageRating?: number;
  Discount?: number;
  Offer?: number;
  FinalPrice?: number;
  verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  protectPromiseFees?: number;
  freeDelivery?: boolean;
  fastDelivery?: boolean;
  safety?: boolean;
  productQuality?: boolean;
  paymentOptions?: boolean;
  manufacturer?: boolean;
  cashOnDelivery?: boolean;
  deliveryVehicleType?: boolean;
  vendorCodeUID?: string;
  sellerId?: string;
  gstRate?: number;
  gstSource?: string;
  fulfillmentType?: 'SELLER' | 'FFC';
  [key: string]: any;
}

// ================================
// GET SINGLE PRODUCT — public
// ================================

export const fetchProduct = async (productId: string): Promise<Product> => {
  const data = await apiRequest<any>(
    apiUrl(`${API_ENDPOINTS.GET_PRODUCT}/${productId}`),
    {
      auth: false,
      retryOnUnauthorized: false,
    },
  );

  const product = data?.product || data?.data || data;

  if (!product?._id) {
    throw new Error('Invalid product data');
  }

  return product;
};

// ================================
// GET RAW PRODUCT (DEBUG) — public
// ================================

export const fetchProductRaw = async (productId: string) => {
  return await apiRequest<any>(
    apiUrl(`${API_ENDPOINTS.GET_PRODUCT}/${productId}`),
    {
      auth: false,
      retryOnUnauthorized: false,
    },
  );
};