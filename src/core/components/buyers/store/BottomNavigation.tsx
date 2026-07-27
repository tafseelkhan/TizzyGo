// BottomNavigation.tsx - FINAL FIXED VERSION WITH ZEPTPAYACCOUNTID
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  useSafeAreaInsets,
  SafeAreaView,
} from 'react-native-safe-area-context';
import AddToCart from './AddToCart';
import BuyNow from './BuyNow';
import { useTheme } from '../../../contexts/theme/ThemeContext';

const ORANGE = '#FF8438';

interface BottomNavigationProps {
  productData?: any;
  productId?: string;
}

const BottomNavigation = ({
  productData,
  productId,
}: BottomNavigationProps) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const [isInCart, setIsInCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  // ✅ Ensure zeptPayAccountId is set in product
  const productWithVendor = productData
    ? {
        ...productData,
        zeptPayAccountId:
          productData?.zeptPayAccountId ||
          productData?.vendorCodeUID ||
          productData?.seller?.zeptPayAccountId ||
          'DEFAULT_VENDOR',
      }
    : null;

  const product = productWithVendor;
  const id = productId || product?.id || product?._id;

  // Default variant select - also ensure variant has zeptPayAccountId
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
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

  // ✅ Product available check - Sirf product data ke hisaab se
  const isProductAvailable = () => {
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
  };

  const variants =
    product?.variants?.map((v: any) => ({
      ...v,
      zeptPayAccountId:
        v?.zeptPayAccountId || product?.zeptPayAccountId || 'DEFAULT_VENDOR',
    })) || [];

  const handleVariantSelect = (variant: any) => {
    // ✅ Ensure variant has zeptPayAccountId
    const variantWithVendor = {
      ...variant,
      zeptPayAccountId:
        variant?.zeptPayAccountId ||
        product?.zeptPayAccountId ||
        'DEFAULT_VENDOR',
    };
    setSelectedVariant(variantWithVendor);
  };

  const handleAddToCartSuccess = () => {
    setIsInCart(true);
    setQuantity(1);
  };

  // Agar product nahi hai toh loading dikhao
  if (!product) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
          <ActivityIndicator size="small" color={ORANGE} />
        </View>
      </SafeAreaView>
    );
  }

  const buyNowProduct = {
    ...product,
    _id: product._id || product.id || id,
    id: product.id || product._id || id,
    zeptPayAccountId: product?.zeptPayAccountId || 'DEFAULT_VENDOR',
  };

  const productAvailable = isProductAvailable();

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? '#0F172A' : '#FFF' },
      ]}
    >
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            paddingBottom: Math.max(insets.bottom, 12),
            paddingTop: 12,
            borderTopColor: isDark ? '#334155' : '#F0F0F0',
          },
        ]}
      >
        {/* LEFT: Buy Now */}
        <View style={styles.buyNowWrap}>
          <BuyNow
            product={buyNowProduct}
            productLoading={false}
            productAvailable={productAvailable}
            variants={variants}
            selectedVariant={selectedVariant}
            onVariantSelect={handleVariantSelect}
          />
        </View>

        {/* RIGHT: Add to Cart (orange pill) */}
        <View style={styles.addToCartWrap}>
          <AddToCart
            productId={id}
            productData={product}
            initialIsInCart={isInCart}
            initialQuantity={quantity}
            productLoading={false}
            productAvailable={productAvailable}
            variants={variants}
            selectedVariant={selectedVariant}
            onVariantSelect={handleVariantSelect}
            onAddToCartSuccess={handleAddToCartSuccess}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 12,
    minHeight: 60,
  },
  buyNowWrap: {
    flex: 0.9,
  },
  addToCartWrap: {
    flex: 1.3,
  },
});

export default BottomNavigation;
