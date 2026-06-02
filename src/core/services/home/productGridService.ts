// services/productGridService.ts
import {
  Product,
  safeFormatPrice,
  safeGetNumber,
  getProductImage,
  calculateBundlePrices,
} from '../../utils/home/productGridUtils';

export class ProductGridService {
  /**
   * Process product data for display
   */
  static processProduct(product: Product) {
    return {
      id: product.productId || product.fullProduct?._id,
      title: product.fullProduct?.title || 'Product',
      brand: product.fullProduct?.brand || 'Brand',
      finalPrice: safeGetNumber(product?.fullProduct?.finalPrice),
      mrp: safeGetNumber(product?.fullProduct?.mrp),
      discount: safeGetNumber(product?.fullProduct?.discount),
      averageRating: safeGetNumber(product?.fullProduct?.averageRating, 4.5),
      imageUrl: getProductImage(product),
      formattedPrice: safeFormatPrice(
        safeGetNumber(product?.fullProduct?.finalPrice),
      ),
    };
  }

  /**
   * Get bundle data for trending bundle section
   */
  static getBundleData(products: Product[]) {
    const bundleProducts = products.slice(0, 4);
    const { totalOriginalPrice, totalBundlePrice, averageDiscount } =
      calculateBundlePrices(bundleProducts);

    return {
      bundleProducts,
      totalOriginalPrice,
      totalBundlePrice,
      averageDiscount,
    };
  }

  /**
   * Get fastest selling product
   */
  static getFastestSellingProduct(products: Product[]): Product | null {
    if (products.length === 0) return null;
    return products[Math.floor(Math.random() * products.length)];
  }

  /**
   * Validate product ID for navigation
   */
  static getValidProductId(product: Product): string | null {
    return product?.productId || product?.fullProduct?._id || null;
  }
}
