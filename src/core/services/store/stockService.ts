// services/stockService.ts

import { Product, Variant } from '../../utils/store/productDetailUtils';

export interface StockStatus {
  isInStock: boolean;
  stock: number;
  message: string;
  showSoldOutBanner: boolean;
}

export const getStockStatus = (
  product: Product | null,
  variant: Variant | null,
): StockStatus => {
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
    // Check variant stock
    if (variant.inStock !== undefined) {
      isInStock = variant.inStock;
    } else if (
      variant.quantityAvailable !== undefined &&
      variant.quantityAvailable !== null
    ) {
      // FIXED: Added null check here
      isInStock = variant.quantityAvailable > 0;
    } else {
      isInStock = true;
    }

    // FIXED: Handle null properly using nullish coalescing operator
    finalStock = (variant.quantityAvailable ?? variant.stock) || 0;
  } else {
    // Check product stock
    const inStockValue = product.inStock;
    if (typeof inStockValue === 'boolean') {
      isInStock = inStockValue;
    } else if (typeof inStockValue === 'string') {
      isInStock = inStockValue.toLowerCase() === 'true';
    } else {
      isInStock = false;
    }

    // FIXED: Handle null properly
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
