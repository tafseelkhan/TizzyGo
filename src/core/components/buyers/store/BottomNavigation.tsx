// components/BottomNavigation.tsx - WITH BUYNOW & ADDTOCART (Layout Same)

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../contexts/theme/ThemeContext';
import AddToCart from './AddToCart';
import BuyNow from './BuyNow';

const ORANGE = '#FF8438';
const { width } = Dimensions.get('window');

// Type definitions for props
interface BottomNavigationProps {
  productData?: any;
  productId?: string;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

// ✅ FIX 1: Memoize component
const BottomNavigation = React.memo(
  ({
    productData,
    productId,
    activeTab,
    setActiveTab,
  }: BottomNavigationProps) => {
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const [isInCart, setIsInCart] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);

    // ✅ FIX 2: Use useMemo to stabilize product object
    const productWithVendor = useMemo(() => {
      if (!productData) return null;
      return {
        ...productData,
        zeptPayAccountId:
          productData?.zeptPayAccountId ||
          productData?.vendorCodeUID ||
          productData?.seller?.zeptPayAccountId ||
          'DEFAULT_VENDOR',
      };
    }, [productData]);

    const product = productWithVendor;
    const id = productId || product?.id || product?._id;

    // ✅ FIX 3: Use useMemo for variants with stable reference
    const variants = useMemo(() => {
      if (!product?.variants) return [];
      return product.variants.map((v: any) => ({
        ...v,
        zeptPayAccountId:
          v?.zeptPayAccountId || product?.zeptPayAccountId || 'DEFAULT_VENDOR',
      }));
    }, [product]);

    // ✅ FIX 4: Use useRef to track if default variant is set
    const defaultVariantSetRef = useRef(false);

    useEffect(() => {
      // ✅ Only set default variant once
      if (
        product?.variants &&
        product.variants.length > 0 &&
        !defaultVariantSetRef.current
      ) {
        defaultVariantSetRef.current = true;
        const defaultVariant = {
          ...product.variants[0],
          zeptPayAccountId:
            product.variants[0]?.zeptPayAccountId ||
            product?.zeptPayAccountId ||
            'DEFAULT_VENDOR',
        };
        setSelectedVariant(defaultVariant);
      }
    }, [product]);

    // ✅ FIX 5: Memoize callbacks
    const handleVariantSelect = useCallback(
      (variant: any) => {
        const variantWithVendor = {
          ...variant,
          zeptPayAccountId:
            variant?.zeptPayAccountId ||
            product?.zeptPayAccountId ||
            'DEFAULT_VENDOR',
        };
        setSelectedVariant(variantWithVendor);
      },
      [product],
    );

    const handleAddToCartSuccess = useCallback(() => {
      setIsInCart(true);
      setQuantity(1);
    }, []);

    // ✅ FIX 6: Memoize computed values
    const isProductAvailable = useMemo(() => {
      if (!product) return false;

      if (product.inStock !== undefined && product.inStock !== null) {
        return product.inStock === true;
      }
      if (
        product.quantityAvailable !== undefined &&
        product.quantityAvailable !== null
      ) {
        return product.quantityAvailable > 0;
      }
      if (product.stock !== undefined && product.stock !== null) {
        return product.stock > 0;
      }
      return true;
    }, [product]);

    // ✅ FIX 7: Memoize buyNowProduct
    const buyNowProduct = useMemo(() => {
      if (!product) return null;
      return {
        ...product,
        _id: product._id || product.id || id,
        id: product.id || product._id || id,
        zeptPayAccountId: product?.zeptPayAccountId || 'DEFAULT_VENDOR',
      };
    }, [product, id]);

    // Loading state
    if (!product) {
      return (
        <View
          style={[
            styles.bottomNav,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E5E7EB',
              bottom: Math.max(insets.bottom, 16),
              left: Math.max(insets.left, 16),
              right: Math.max(insets.right, 16),
            },
          ]}
        >
          <View style={styles.navContent}>
            <ActivityIndicator size="small" color={ORANGE} />
          </View>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderColor: isDark ? '#334155' : '#E5E7EB',
            bottom: Math.max(insets.bottom, 16),
            left: Math.max(insets.left, 16),
            right: Math.max(insets.right, 16),
          },
        ]}
      >
        <View style={styles.navContent}>
          {/* LEFT: Buy Now */}
          <View style={styles.buyNowWrap}>
            <BuyNow
              product={buyNowProduct}
              productLoading={false}
              productAvailable={isProductAvailable}
              variants={variants}
              selectedVariant={selectedVariant}
              onVariantSelect={handleVariantSelect}
            />
          </View>

          {/* RIGHT: Add to Cart */}
          <View style={styles.addToCartWrap}>
            <AddToCart
              productId={id}
              productData={product}
              initialIsInCart={isInCart}
              initialQuantity={quantity}
              productLoading={false}
              productAvailable={isProductAvailable}
              variants={variants}
              selectedVariant={selectedVariant}
              onVariantSelect={handleVariantSelect}
              onAddToCartSuccess={handleAddToCartSuccess}
            />
          </View>
        </View>
      </View>
    );
  },
);

// ✅ FIX 8: Add display name
BottomNavigation.displayName = 'BottomNavigation';

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    zIndex: 1000,
    elevation: 50,
    borderWidth: 1,
    width: width * 0.92,
    alignSelf: 'center',
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buyNowWrap: {
    flex: 0.9,
  },
  addToCartWrap: {
    flex: 1.3,
  },
});

export default BottomNavigation;
