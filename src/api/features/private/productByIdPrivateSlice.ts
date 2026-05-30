import Config from 'react-native-config';
import { API_ENDPOINTS } from '../../connection/snippet/apiEndpoints';
import { fetchHandler } from '../../../core/utils/handler/fetchHandler';

// ================================
// TYPES
// ================================

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
  [key: string]: any;
}

// ================================
// BASE URL
// ================================

const API_BASE_URL = Config.API_AXIOS_BASE_URL;

// ================================
// GET SINGLE PRODUCT
// ================================

export const fetchProduct = async (productId: string): Promise<Product> => {
  console.log(
    'Fetching product:',
    `${API_BASE_URL}${API_ENDPOINTS.GET_PRODUCT}/${productId}`,
  );

  const data = await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.GET_PRODUCT}/${productId}`,
    {
      method: 'GET',
    },
  );

  const product = data?.product || data?.data || data;

  if (!product?._id) {
    throw new Error('Invalid product data');
  }

  return product;
};

// ================================
// GET RAW PRODUCT (DEBUG)
// ================================

export const fetchProductRaw = async (productId: string) => {
  return await fetchHandler(
    `${API_BASE_URL}${API_ENDPOINTS.GET_PRODUCT}/${productId}`,
    {
      method: 'GET',
    },
  );
};
