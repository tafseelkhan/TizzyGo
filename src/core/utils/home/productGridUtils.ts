// utils/productGridUtils.ts
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

export type Product = {
  productId: string;
  fullProduct: FullProduct;
};

/**
 * Safely format price to string with Indian numbering system
 */
export const safeFormatPrice = (price: any): string => {
  const numPrice = typeof price === 'number' ? price : Number(price);
  if (isNaN(numPrice) || numPrice === undefined || numPrice === null) {
    return '0';
  }
  return numPrice.toLocaleString('en-IN');
};

/**
 * Safely get number value from any type
 */
export const safeGetNumber = (value: any, defaultValue: number = 0): number => {
  const num = typeof value === 'number' ? value : Number(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Get product image URL from product object
 */
export const getProductImage = (product: Product): string => {
  try {
    if (product?.fullProduct?.variants?.[0]?.images?.[0]) {
      const imageUrl = product.fullProduct.variants[0].images[0];
      return imageUrl.replace('…', '').trim();
    }
  } catch (error) {
    console.log('Error getting product image:', error);
  }
  return 'https://placehold.co/500x500/6366f1/ffffff?text=Product';
};

/**
 * Get random products from array
 */
export const getRandomProducts = (
  products: Product[],
  count: number,
): Product[] => {
  if (products.length <= count) return products;

  const shuffled = [...products];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
};

/**
 * Calculate total prices for bundle
 */
export const calculateBundlePrices = (products: Product[]) => {
  const totalOriginalPrice = products.reduce(
    (sum, product) => sum + safeGetNumber(product?.fullProduct?.mrp),
    0,
  );

  const totalBundlePrice = products.reduce(
    (sum, product) => sum + safeGetNumber(product?.fullProduct?.finalPrice),
    0,
  );

  const totalDiscount = products.reduce(
    (sum, product) => sum + safeGetNumber(product?.fullProduct?.discount),
    0,
  );

  const averageDiscount =
    products.length > 0 ? Math.round(totalDiscount / products.length) : 0;

  return { totalOriginalPrice, totalBundlePrice, averageDiscount };
};

/**
 * Generate pagination page numbers
 */
export const generatePageNumbers = (
  currentPage: number,
  totalPages: number,
): (number | string)[] => {
  const pages: (number | string)[] = [];
  const maxVisiblePages = 5;

  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 2) {
      end = 3;
    }
    if (currentPage >= totalPages - 1) {
      start = totalPages - 2;
    }

    if (start > 2) {
      pages.push('...');
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages - 1) {
      pages.push('...');
    }
    if (totalPages > 1) {
      pages.push(totalPages);
    }
  }
  return pages;
};

/**
 * Split products into two columns for grid layout
 */
export const splitIntoColumns = (products: Product[]) => {
  const column1: Product[] = [];
  const column2: Product[] = [];

  products.forEach((product, index) => {
    if (index % 2 === 0) {
      column1.push(product);
    } else {
      column2.push(product);
    }
  });
  return { column1, column2 };
};

/**
 * Get paginated products
 */
export const getPaginatedProducts = (
  products: Product[],
  page: number,
  itemsPerPage: number,
) => {
  const startIndex = (page - 1) * itemsPerPage;
  const currentProducts = products.slice(startIndex, startIndex + itemsPerPage);
  const endIndex = Math.min(startIndex + itemsPerPage, products.length);

  return {
    currentProducts,
    startIndex,
    endIndex,
    totalPages: Math.ceil(products.length / itemsPerPage),
  };
};
