// services/cartService.ts
import { CartAPI } from '../../../../api/features/private/addToCartPrivateSlice';
import { SelectedVariant, ProductVariant } from '../../../types/CartTypes';

/**
 * Cart Service - All cart related business logic and API calls
 * Extracted from AddToCart component for reusability
 */
export class CartService {
  /**
   * Fetch product variants from API
   */
  static async fetchProductVariants(
    productId: string,
  ): Promise<ProductVariant[]> {
    try {
      const variants = await CartAPI.fetchProductVariants(productId);
      return variants || [];
    } catch (error) {
      console.error('Error loading variants:', error);
      return [];
    }
  }

  /**
   * Check cart status for a product
   */
  static async checkCartStatus(productId: string): Promise<{
    inCart: boolean;
    quantity: number;
    selectedVariant: SelectedVariant | null;
  }> {
    try {
      const cartStatus = await CartAPI.fetchCart(productId);
      if (cartStatus) {
        return {
          inCart: cartStatus.inCart,
          quantity: cartStatus.quantity,
          selectedVariant: cartStatus.selectedVariant || null,
        };
      }
    } catch (error) {
      console.error('Error checking cart status:', error);
    }

    return {
      inCart: false,
      quantity: 1,
      selectedVariant: null,
    };
  }

  /**
   * Add item to cart
   */
  static async addToCart(params: {
    productId: string;
    productData: any;
    quantity: number;
    selectedVariant: SelectedVariant | null;
  }): Promise<boolean> {
    try {
      const success = await CartAPI.addToCart(params);
      return success;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  }

  /**
   * Update cart item quantity
   */
  static async updateCartItem(params: {
    productId: string;
    quantity: number;
    selectedVariant: SelectedVariant | null;
  }): Promise<boolean> {
    try {
      const success = await CartAPI.updateCartItem(params);
      return success;
    } catch (error) {
      console.error('Error updating cart item:', error);
      return false;
    }
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(productId: string): Promise<boolean> {
    try {
      const success = await CartAPI.removeFromCart(productId);
      return success;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    }
  }

  /**
   * Validate variant selection
   */
  static validateVariantSelection(
    variants: ProductVariant[],
    selectedVariantIndex: number | null,
  ): boolean {
    return (
      selectedVariantIndex !== null &&
      selectedVariantIndex >= 0 &&
      selectedVariantIndex < variants.length
    );
  }

  /**
   * Get variant stock status
   */
  static getVariantStockStatus(variant: ProductVariant): {
    inStock: boolean;
    availableQuantity: number;
  } {
    return {
      inStock: variant.inStock === true,
      availableQuantity: variant.quantityAvailable || 0,
    };
  }

  /**
   * Calculate discount percentage
   */
  static calculateDiscount(mrp: number, finalPrice: number): number {
    if (mrp > finalPrice && mrp > 0) {
      return Math.round(((mrp - finalPrice) / mrp) * 100);
    }
    return 0;
  }
}

/**
 * React Hook for Cart Service (optional)
 */
export const useCartService = () => {
  return {
    fetchProductVariants: CartService.fetchProductVariants,
    checkCartStatus: CartService.checkCartStatus,
    addToCart: CartService.addToCart,
    updateCartItem: CartService.updateCartItem,
    removeFromCart: CartService.removeFromCart,
    validateVariantSelection: CartService.validateVariantSelection,
    getVariantStockStatus: CartService.getVariantStockStatus,
    calculateDiscount: CartService.calculateDiscount,
  };
};
