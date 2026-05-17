import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {
  useSafeAreaInsets,
  SafeAreaView,
} from 'react-native-safe-area-context';
import AddToCart, {
  fetchCart,
  fetchProductVariants,
  ProductVariant,
  SelectedVariant,
} from './AddToCart';
import EmiOption from './EmiOption';
import BuyNow from './BuyNow';
import { useTheme } from '../../contexts/theme/ThemeContext';

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const triggerFeedback = async () => {
  try {
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
  } catch (error) {
    console.log('Haptic feedback not available');
  }
};

interface BottomNavigationProps {
  activeTabs: string;
  setActiveTabs: (tab: string) => void;
}

interface Product {
  id: string;
  _id?: string;
  category: string;
  title: string;
  brand: string;
  reviewCount?: number;
  price: number;
  originalPrice?: number;
  stock?: number;
  rating?: number;
  model: string;
  averageRating?: number;
  Discount?: number;
  Offer?: number;
  FinalPrice?: number;
  variants?: ProductVariant[];
}

type RootStackParamList = {
  Home: undefined;
  ProductDetail: {
    productId: string;
    category?: string;
    productData?: any;
  };
};

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

const fetchProduct = async (productId: string): Promise<Product> => {
  try {
    const apiUrl = `http://172.20.10.12:5000/api/seller/forms/categories/${productId}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error('API returned unsuccessful response');
    }

    if (!data.product) {
      throw new Error('No product data found in response');
    }

    const productData = data.product;

    return {
      ...productData,
      id: productData._id || productId,
      title: productData.title || 'No Title',
      brand: productData.brand || 'No Brand',
      price: productData.price || 0,
      model: productData.model || 'No Model',
      category: productData.category || 'Unknown Category',
      originalPrice:
        productData.originalPrice || productData.mrp || productData.price,
      FinalPrice: productData.finalPrice || productData.price,
      Discount: productData.discount || productData.Discount || 0,
      Offer: productData.offerText || productData.Offer || '',
      averageRating: productData.averageRating || 0,
      reviewCount: productData.reviewCount || 0,
      stock: productData.quantityAvailable || productData.stock || 0,
      rating: productData.rating || 0,
      variants: productData.variants || [],
    };
  } catch (error: any) {
    console.error('Error in fetchProduct:', error.message);
    throw new Error(error.message || 'Failed to fetch product from server');
  }
};

const BottomNavigation = ({
  activeTabs,
  setActiveTabs,
}: BottomNavigationProps) => {
  const route = useRoute<ProductDetailRouteProp>();
  const { width, height } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const params = route.params;
  const productId = params?.productId;
  const routeCategory = params?.category;
  const routeProductData = params?.productData;

  const id = productId || (params as any)?.id;
  const category = routeCategory || (params as any)?.category || 'Unknown';

  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [isInCart, setIsInCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] =
    useState<SelectedVariant | null>(null);
  const [scaleAnim] = useState(new Animated.Value(1));

  const showToast = {
    error: (message: string) => Alert.alert('Error', message),
    success: (message: string) => Alert.alert('Success', message),
    info: (message: string) => Alert.alert('Info', message),
  };

  const handleVariantSelect = (variant: SelectedVariant | null) => {
    setSelectedVariant(variant);
  };

  const handleAddToCartSuccess = () => {
    setIsInCart(true);
    setQuantity(1);
  };

  const handleTabPress = async (tabName: string) => {
    await triggerFeedback();

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();

    setActiveTabs(tabName);
  };

  const handleRetryPress = async () => {
    await triggerFeedback();
    setProductLoading(true);
    setProductError(null);
    const loadData = async () => {
      try {
        const productData = await fetchProduct(id);
        setProduct(productData);
      } catch (error: any) {
        setProductError(error.message);
      } finally {
        setProductLoading(false);
      }
    };
    loadData();
  };

  useEffect(() => {
    if (!id || id === 'undefined' || id === 'null') {
      const errorMsg = `Product ID is missing. Current ID: ${id}`;
      setProductError(errorMsg);
      setProductLoading(false);
      showToast.error('Product ID is missing. Please check the product link.');
      return;
    }

    const loadData = async () => {
      setProductLoading(true);
      setProductError(null);

      try {
        if (routeProductData) {
          const formattedProduct: Product = {
            ...routeProductData,
            id: routeProductData._id || routeProductData.id || id,
            category: routeProductData.category || category,
            title: routeProductData.title || 'No Title',
            brand: routeProductData.brand || 'No Brand',
            price: routeProductData.price || 0,
            model: routeProductData.model || 'No Model',
            originalPrice:
              routeProductData.originalPrice || routeProductData.price,
            FinalPrice: routeProductData.FinalPrice || routeProductData.price,
            Discount: routeProductData.Discount || 0,
            Offer: routeProductData.Offer || 0,
            averageRating: routeProductData.averageRating || 0,
            reviewCount: routeProductData.reviewCount || 0,
            stock: routeProductData.stock || 0,
            rating: routeProductData.rating || 0,
            variants: routeProductData.variants || [],
          };
          setProduct(formattedProduct);
          setVariants(routeProductData.variants || []);
        } else {
          const productData = await fetchProduct(id);
          setProduct(productData);
          setVariants(productData.variants || []);
        }
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to load product';
        setProductError(errorMessage);
        showToast.error(errorMessage);
      } finally {
        setProductLoading(false);
      }

      try {
        const cartItem = await fetchCart(id);
        if (cartItem) {
          setIsInCart(true);
          setQuantity(cartItem.quantity);
          if (cartItem.selectedVariant) {
            setSelectedVariant(cartItem.selectedVariant);
          }
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    };

    loadData();
  }, [id, routeProductData]);

  const getThemeColors = () => {
    return {
      navBg: isDark ? '#1E293B' : '#FFFFFF',
      safeAreaBg: isDark ? '#0F172A' : '#FFFFFF',
      activeNavButtonBg: isDark ? '#0F766E' : '#F0FFF4',
      activeTabIconBg: isDark ? '#134E4A' : '#E6F7F1',
      tabIconBg: isDark ? '#334155' : '#F3F4F6',
      tabContentBg: isDark ? '#1E293B' : '#FFFFFF',
      closeButtonBg: isDark ? '#334155' : '#F3F4F6',
      loadingBg: isDark ? '#1E293B' : '#FFFFFF',
      errorBg: isDark ? '#1E293B' : '#FFFFFF',

      navBorder: isDark ? '#334155' : '#E5E7EB',
      navTopBorder: isDark ? '#475569' : '#F3F4F6',
      activeTabBorder: isDark ? '#2DD4BF' : '#10B981',

      tabLabel: isDark ? '#94A3B8' : '#6B7280',
      activeTabLabel: isDark ? '#2DD4BF' : '#10B981',
      loadingText: isDark ? '#CBD5E1' : '#666',
      errorText: isDark ? '#FCA5A5' : 'red',
      errorDesc: isDark ? '#FECACA' : 'red',
      retryButtonText: '#FFFFFF',

      activeTabIcon: isDark ? '#2DD4BF' : '#10B981',
      inactiveTabIcon: isDark ? '#94A3B8' : '#6B7280',
      closeIcon: isDark ? '#CBD5E1' : '#6B7280',

      tabIndicator: isDark ? '#2DD4BF' : '#10B981',
      retryButtonBg: isDark ? '#0D9488' : '#10B981',
      shadowColor: isDark ? '#000' : '#000',
    };
  };

  const themeColors = getThemeColors();

  if (productLoading) {
    return (
      <View
        style={[
          styles.bottomNav,
          {
            paddingBottom: insets.bottom,
            backgroundColor: themeColors.navBg,
          },
        ]}
      >
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: themeColors.loadingBg },
          ]}
        >
          <Text
            style={[styles.loadingText, { color: themeColors.loadingText }]}
          >
            Loading product...
          </Text>
        </View>
      </View>
    );
  }

  if (productError) {
    return (
      <View
        style={[
          styles.bottomNav,
          {
            paddingBottom: insets.bottom,
            backgroundColor: themeColors.navBg,
          },
        ]}
      >
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: themeColors.errorBg },
          ]}
        >
          <Text style={[styles.errorText, { color: themeColors.errorText }]}>
            Product Error
          </Text>
          <Text
            style={[styles.errorDescription, { color: themeColors.errorDesc }]}
          >
            {productError}
          </Text>
          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: themeColors.retryButtonBg },
            ]}
            onPress={handleRetryPress}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.retryButtonText,
                { color: themeColors.retryButtonText },
              ]}
            >
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const buyNowProduct = product
    ? {
        ...product,
        _id: product._id || product.id,
        id: product.id,
      }
    : null;

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[
        styles.safeAreaContainer,
        { backgroundColor: themeColors.safeAreaBg },
      ]}
    >
      {/* Bottom Navigation - Always Visible, No Swipe Needed */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: themeColors.navBg,
            borderColor: themeColors.navBorder,
            shadowColor: themeColors.shadowColor,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {/* Tab Content Area */}
        <View
          style={[
            styles.tabContentArea,
            { backgroundColor: themeColors.tabContentBg },
          ]}
        >
          {activeTabs === 'cart' && (
            <View style={styles.tabPanel}>
              <AddToCart
                productId={product?.id || id}
                productData={product}
                initialIsInCart={isInCart}
                initialQuantity={quantity}
                productLoading={productLoading}
                productAvailable={!!product}
                variants={variants}
                selectedVariant={selectedVariant}
                onVariantSelect={handleVariantSelect}
                onAddToCartSuccess={handleAddToCartSuccess}
              />
            </View>
          )}

          {activeTabs === 'emi' && (
            <View style={styles.tabPanel}>
              <EmiOption />
            </View>
          )}

          {activeTabs === 'buy' && (
            <View style={styles.tabPanel}>
              <BuyNow
                product={buyNowProduct}
                productLoading={productLoading}
                productAvailable={!!product}
                variants={variants}
                selectedVariant={selectedVariant}
                onVariantSelect={handleVariantSelect}
              />
            </View>
          )}
        </View>

        {/* Tabs Navigation */}
        <View
          style={[
            styles.navContent,
            {
              borderTopColor: themeColors.navTopBorder,
              backgroundColor: themeColors.navBg,
            },
          ]}
        >
          {/* Tab 1: Add to Cart */}
          <View style={styles.navButtonWrapper}>
            <Animated.View
              style={[
                styles.navButton,
                activeTabs === 'cart' && [
                  styles.activeNavButton,
                  { backgroundColor: themeColors.activeNavButtonBg },
                ],
                {
                  transform: [{ scale: activeTabs === 'cart' ? scaleAnim : 1 }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.tabButton}
                onPress={() => handleTabPress('cart')}
                activeOpacity={0.7}
              >
                <View style={styles.tabContent}>
                  <View
                    style={[
                      styles.tabIconContainer,
                      activeTabs === 'cart' && [
                        styles.activeTabIconContainer,
                        {
                          backgroundColor: themeColors.activeTabIconBg,
                          borderColor: themeColors.activeTabBorder,
                        },
                      ],
                      { backgroundColor: themeColors.tabIconBg },
                    ]}
                  >
                    <Icon
                      name="add-shopping-cart"
                      size={20}
                      color={
                        activeTabs === 'cart'
                          ? themeColors.activeTabIcon
                          : themeColors.inactiveTabIcon
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      activeTabs === 'cart' && styles.activeTabLabel,
                      { color: themeColors.tabLabel },
                    ]}
                  >
                    Cart
                  </Text>
                </View>
              </TouchableOpacity>

              {activeTabs === 'cart' && (
                <View
                  style={[
                    styles.tabIndicator,
                    { backgroundColor: themeColors.tabIndicator },
                  ]}
                />
              )}
            </Animated.View>
          </View>

          {/* Tab 2: EMI Options */}
          <View style={styles.navButtonWrapper}>
            <Animated.View
              style={[
                styles.navButton,
                activeTabs === 'emi' && [
                  styles.activeNavButton,
                  { backgroundColor: themeColors.activeNavButtonBg },
                ],
                {
                  transform: [{ scale: activeTabs === 'emi' ? scaleAnim : 1 }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.tabButton}
                onPress={() => handleTabPress('emi')}
                activeOpacity={0.7}
              >
                <View style={styles.tabContent}>
                  <View
                    style={[
                      styles.tabIconContainer,
                      activeTabs === 'emi' && [
                        styles.activeTabIconContainer,
                        {
                          backgroundColor: themeColors.activeTabIconBg,
                          borderColor: themeColors.activeTabBorder,
                        },
                      ],
                      { backgroundColor: themeColors.tabIconBg },
                    ]}
                  >
                    <Icon
                      name="credit-card"
                      size={20}
                      color={
                        activeTabs === 'emi'
                          ? themeColors.activeTabIcon
                          : themeColors.inactiveTabIcon
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      activeTabs === 'emi' && styles.activeTabLabel,
                      { color: themeColors.tabLabel },
                    ]}
                  >
                    EMI
                  </Text>
                </View>
              </TouchableOpacity>

              {activeTabs === 'emi' && (
                <View
                  style={[
                    styles.tabIndicator,
                    { backgroundColor: themeColors.tabIndicator },
                  ]}
                />
              )}
            </Animated.View>
          </View>

          {/* Tab 3: Buy Now */}
          <View style={styles.navButtonWrapper}>
            <Animated.View
              style={[
                styles.navButton,
                activeTabs === 'buy' && [
                  styles.activeNavButton,
                  { backgroundColor: themeColors.activeNavButtonBg },
                ],
                {
                  transform: [{ scale: activeTabs === 'buy' ? scaleAnim : 1 }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.tabButton}
                onPress={() => handleTabPress('buy')}
                activeOpacity={0.7}
              >
                <View style={styles.tabContent}>
                  <View
                    style={[
                      styles.tabIconContainer,
                      activeTabs === 'buy' && [
                        styles.activeTabIconContainer,
                        {
                          backgroundColor: themeColors.activeTabIconBg,
                          borderColor: themeColors.activeTabBorder,
                        },
                      ],
                      { backgroundColor: themeColors.tabIconBg },
                    ]}
                  >
                    <FontAwesome5
                      name="bolt"
                      size={18}
                      color={
                        activeTabs === 'buy'
                          ? themeColors.activeTabIcon
                          : themeColors.inactiveTabIcon
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      activeTabs === 'buy' && styles.activeTabLabel,
                      { color: themeColors.tabLabel },
                    ]}
                  >
                    Buy Now
                  </Text>
                </View>
              </TouchableOpacity>

              {activeTabs === 'buy' && (
                <View
                  style={[
                    styles.tabIndicator,
                    { backgroundColor: themeColors.tabIndicator },
                  ]}
                />
              )}
            </Animated.View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    backgroundColor: 'transparent',
  },
  bottomNav: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 15,
    zIndex: 1000,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
    minHeight: 68,
  },
  navButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    width: '100%',
  },
  activeNavButton: {
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  activeTabIconContainer: {
    backgroundColor: '#E6F7F1',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  activeTabLabel: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 13,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -8,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  tabContentArea: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 100,
    justifyContent: 'center',
  },
  tabPanel: {
    minHeight: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BottomNavigation;
