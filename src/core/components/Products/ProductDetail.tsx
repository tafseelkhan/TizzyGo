// screens/ProductDetailScreen.tsx - FIXED VERSION
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/auth/UserContext';
import { useTheme } from '../../contexts/theme/ThemeContext';
import axios from 'axios';
import ProductImages from '../../components/Products/ProductImages';
import ProductVideo from '../../components/Products/ProductVideos';
import ProductInfo from '../../components/Products/ProductInfo';
import RelatedProducts from './RelatedProducts';
import RelatedSecond from './RelatedSecond';
import RelatedThird from './RelatedThird';
import Toast from 'react-native-toast-message';
import BottomNavigation from './BottomNavigation';
import Icon from 'react-native-vector-icons/Ionicons';

// Types define karo
type RootStackParamList = {
  Home: undefined;
  ProductDetail: {
    productId: string;
  };
  CategoryProducts: {
    category: string;
  };
  ProductMore: {
    productId: string;
    productTitle: string;
  };
};

type ProductDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ProductDetail'
>;

interface VariantFields {
  [key: string]: string;
}

interface Variant {
  fields?: VariantFields;
  combinationKey?: string;
  mrp?: number;
  price?: number;
  savedAmount?: number;
  discount?: number;
  offerText?: string;
  finalPrice?: number;
  weight?: string;
  height?: string;
  width?: string;
  length?: string;
  inStock?: boolean;
  quantityAvailable?: number;
  sku?: string;
  images?: string[];
  video?: string;
  isDefault?: boolean;
  variantId?: string;
  stock?: number;
}

interface Product {
  _id: string;
  title?: string;
  category?: string;
  brand?: string;
  price?: number;
  mrp?: number;
  discount?: number;
  description?: string;
  images?: string[];
  variants?: Variant[];
  variantOptions?: string[];
  variantValues?: Record<string, string[]>;
  shortDescription?: string;
  fullDescription?: string;
  highlights?: string[];
  specs?: Record<string, any>;
  inStock?: boolean | string;
  quantityAvailable?: number;
  sellerLocation?: any;
  sellerId?: string;
  vendorCodeUID?: string;
  deliveryTime?: string;
  warranty?: string;
  returnPolicy?: string;
  finalPrice?: number;
  protectPromiseFees?: number;
  freeDelivery?: boolean;
  fastDelivery?: boolean;
  safety?: boolean;
  productQuality?: boolean;
  paymentOptions?: boolean;
  manufacturer?: boolean;
  cashOnDelivery?: boolean;
  verified?: boolean;
}

const { width } = Dimensions.get('window');

const ProductDetailScreen: React.FC = () => {
  const navigation = useNavigation<ProductDetailScreenNavigationProp>();
  const route = useRoute();
  const scrollViewRef = useRef<ScrollView>(null);
  const isMountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);

  const params = route.params as any;
  const productId = params?.productId || params?.id || null;

  const { user } = useUser();
  const { theme, isDark, resolvedTheme } = useTheme();
  const currentUserId = user?._id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTabs, setActiveTabs] = useState('home');
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [localDescription, setLocalDescription] = useState<string>('');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [validVariants, setValidVariants] = useState<Variant[]>([]);

  const dynamicStyles = getDynamicStyles(isDark);

  // Helper: Filter valid variants
  const filterValidVariants = useCallback((variants: any[]): Variant[] => {
    if (!variants || !Array.isArray(variants)) return [];
    return variants.filter(
      v => v && (v.fields || v.combinationKey || v.sku || v.variantId),
    );
  }, []);

  // Fetch product function - wrapped in useCallback
  const fetchProduct = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (fetchInProgressRef.current) {
      console.log('⏳ Fetch already in progress, skipping...');
      return;
    }

    if (!productId) {
      if (isMountedRef.current) {
        setError('Product ID is missing. Please go back and try again.');
        setLoading(false);
      }
      return;
    }

    try {
      fetchInProgressRef.current = true;

      if (!refreshing) {
        setLoading(true);
      }

      console.log('📡 Fetching product with ID:', productId);

      const response = await axios.get(
        `http://172.20.10.12:5000/api/seller/forms/categories/${productId}`,
      );

      if (!isMountedRef.current) return;

      let productData =
        response.data.product || response.data.data || response.data;

      if (response.data.success && response.data.product) {
        productData = response.data.product;
      }

      if (!productData?._id) {
        throw new Error('Product not found in response');
      }

      // Filter valid variants
      if (productData.variants && Array.isArray(productData.variants)) {
        const filteredVariants = filterValidVariants(productData.variants);
        productData.variants = filteredVariants;
        setValidVariants(filteredVariants);
      }

      setProduct(productData);
      setSelectedVariantIndex(0);
      setError(null);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.error('❌ Fetch error:', err);
      const errorMessage =
        err.response?.data?.message || err.message || 'Product load failed';
      setError(errorMessage);
      Toast.show({
        type: 'error',
        text1: 'Failed to load product',
        text2: errorMessage,
      });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
        fetchInProgressRef.current = false;
      }
    }
  }, [productId, refreshing, filterValidVariants]);

  // MAIN FIXED useEffect - with cleanup and mounted flag
  useEffect(() => {
    isMountedRef.current = true;
    fetchProduct();

    return () => {
      isMountedRef.current = false;
      fetchInProgressRef.current = false;
    };
  }, [productId]); // Only runs when productId changes

  // FIXED: Remove theme logging useEffect OR make it run once
  useEffect(() => {
    // Only log in development and only once
    if (__DEV__) {
      console.log('Theme mode:', isDark ? 'Dark' : 'Light');
    }
  }, []); // Empty dependency array - runs only once

  // FIXED: Description update with compare
  useEffect(() => {
    if (product) {
      const newDescription =
        product.fullDescription ||
        product.description ||
        product.shortDescription ||
        '';

      // Only update if changed
      if (newDescription !== localDescription) {
        setLocalDescription(newDescription);
      }
    }
  }, [product, localDescription]); // Added localDescription dependency

  const handleVariantChange = useCallback((variantIndex: number) => {
    console.log('🔄 Variant changed to:', variantIndex);
    setSelectedVariantIndex(variantIndex);
  }, []);

  const getSelectedVariant = useCallback((): Variant | null => {
    const variants =
      validVariants.length > 0 ? validVariants : product?.variants;
    if (!variants || variants.length === 0) return null;
    if (selectedVariantIndex >= variants.length) return variants[0];
    return variants[selectedVariantIndex];
  }, [validVariants, product?.variants, selectedVariantIndex]);

  const getVariantDisplayName = useCallback((): string => {
    const variant = getSelectedVariant();
    if (!variant) return '';

    if (
      variant.fields &&
      typeof variant.fields === 'object' &&
      Object.keys(variant.fields).length > 0
    ) {
      return Object.entries(variant.fields)
        .map(([key, value]) => `${key}: ${value}`)
        .join(' • ');
    }

    if (variant.combinationKey) {
      return variant.combinationKey.replace(/\|/g, ' • ');
    }

    return '';
  }, [getSelectedVariant]);

  const getCurrentPrice = useCallback((): number => {
    const variant = getSelectedVariant();
    if (variant?.finalPrice) return variant.finalPrice;
    if (variant?.price) return variant.price;
    if (product?.finalPrice) return product.finalPrice;
    return product?.price || 0;
  }, [getSelectedVariant, product]);

  const getCurrentMrp = useCallback((): number => {
    const variant = getSelectedVariant();
    if (variant?.mrp) return variant.mrp;
    return product?.mrp || 0;
  }, [getSelectedVariant, product]);

  const getCurrentDiscount = useCallback((): number => {
    const variant = getSelectedVariant();
    if (variant?.discount) return variant.discount;
    return product?.discount || 0;
  }, [getSelectedVariant, product]);

  const getCurrentImages = useCallback((): string[] => {
    const variant = getSelectedVariant();
    if (variant?.images && variant.images.length > 0) return variant.images;
    return product?.images || [];
  }, [getSelectedVariant, product]);

  const getCurrentVideo = useCallback((): string | undefined => {
    const variant = getSelectedVariant();
    return variant?.video;
  }, [getSelectedVariant]);

  const getCurrentSku = useCallback((): string | undefined => {
    const variant = getSelectedVariant();
    return variant?.sku;
  }, [getSelectedVariant]);

  const getVariantFieldsArray = useCallback((): {
    name: string;
    value: string;
  }[] => {
    const variant = getSelectedVariant();
    if (!variant?.fields) return [];
    return Object.entries(variant.fields).map(([name, value]) => ({
      name,
      value: String(value),
    }));
  }, [getSelectedVariant]);

  const getStockStatus = useCallback(() => {
    if (!product) {
      return {
        isInStock: false,
        stock: 0,
        message: 'Product not available',
        showSoldOutBanner: true,
      };
    }

    const variant = getSelectedVariant();
    let isInStock: boolean;
    let finalStock: number;

    if (variant) {
      if (variant.inStock !== undefined) {
        isInStock = variant.inStock;
      } else if (variant.quantityAvailable !== undefined) {
        isInStock = variant.quantityAvailable > 0;
      } else {
        isInStock = true;
      }
      finalStock = variant.quantityAvailable || variant.stock || 0;
    } else {
      const inStockValue = product.inStock;
      if (typeof inStockValue === 'boolean') {
        isInStock = inStockValue;
      } else if (typeof inStockValue === 'string') {
        isInStock = inStockValue.toLowerCase() === 'true';
      } else {
        isInStock = false;
      }
      finalStock = product.quantityAvailable || 0;
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
  }, [product, getSelectedVariant]);

  const handleGoHome = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  const handleCategoryPress = useCallback(() => {
    if (product?.category) {
      navigation.navigate('CategoryProducts', {
        category: product.category,
      });
    }
  }, [navigation, product?.category]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleMorePress = useCallback(() => {
    if (product?._id) {
      navigation.navigate('ProductMore', {
        productId: product._id,
        productTitle: product.title || 'Product Details',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Unable to load more details',
      });
    }
  }, [navigation, product]);

  const onRefresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    fetchProduct();
  }, [fetchProduct]);

  const getDescriptionText = useCallback(() => {
    if (localDescription) return localDescription;
    if (product?.fullDescription) return product.fullDescription;
    if (product?.description) return product.description;
    if (product?.shortDescription) return product.shortDescription;
    return '';
  }, [localDescription, product]);

  // Memoized values to prevent unnecessary re-renders
  const selectedVariant = getSelectedVariant();
  const variantName = getVariantDisplayName();
  const currentPrice = getCurrentPrice();
  const currentMrp = getCurrentMrp();
  const currentDiscount = getCurrentDiscount();
  const currentImages = getCurrentImages();
  const currentVideo = getCurrentVideo();
  const currentSku = getCurrentSku();
  const variantFieldsArray = getVariantFieldsArray();
  const stockStatus = getStockStatus();
  const descriptionText = getDescriptionText();
  const variantsToShow =
    validVariants.length > 0 ? validVariants : product?.variants || [];

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={[styles.safeArea, dynamicStyles.safeArea]}
        edges={['top', 'left', 'right']}
      >
        <View style={[styles.loadingContainer, dynamicStyles.loadingContainer]}>
          <ActivityIndicator size="large" color="#FFA41C" />
          <Text style={[styles.loadingText, dynamicStyles.loadingText]}>
            Loading product...
          </Text>
          <Text style={[styles.debugText, dynamicStyles.debugText]}>
            Product ID: {productId || 'Not found'}
          </Text>
        </View>
        <BottomNavigation
          activeTabs={activeTabs}
          setActiveTabs={setActiveTabs}
        />
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView
        style={[styles.safeArea, dynamicStyles.safeArea]}
        edges={['top', 'left', 'right']}
      >
        <View style={[styles.errorContainer, dynamicStyles.errorContainer]}>
          <Icon name="alert-circle-outline" size={60} color="#DC2626" />
          <Text style={[styles.errorTitle, dynamicStyles.errorTitle]}>
            Oops! Something went wrong
          </Text>
          <Text style={[styles.errorMessage, dynamicStyles.errorMessage]}>
            {error || 'Product not found'}
          </Text>
          <Text style={[styles.debugText, dynamicStyles.debugText]}>
            Product ID: {productId || 'Not found'}
          </Text>

          <View style={styles.errorButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={fetchProduct}
            >
              <Icon name="refresh" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, dynamicStyles.secondaryButton]}
              onPress={handleGoBack}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  dynamicStyles.secondaryButtonText,
                ]}
              >
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <BottomNavigation
          activeTabs={activeTabs}
          setActiveTabs={setActiveTabs}
        />
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <SafeAreaView
        style={[styles.safeArea, dynamicStyles.safeArea]}
        edges={['left', 'right']}
      >
        <View style={[styles.mainContainer, dynamicStyles.mainContainer]}>

          {stockStatus.showSoldOutBanner && (
            <View style={styles.soldOutBanner}>
              <Icon name="close-circle" size={24} color="#FFFFFF" />
              <Text style={styles.soldOutText}>SOLD OUT</Text>
            </View>
          )}

          <ScrollView
            ref={scrollViewRef}
            style={[styles.container, dynamicStyles.container]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#FFA41C']}
                tintColor="#FFA41C"
                progressViewOffset={80}
                size="default"
              />
            }
          >
            <View>
              <View style={styles.productImagesWrapper}>
                {variantsToShow.length > 0 ? (
                  <ProductImages
                    variants={variantsToShow as any}
                    onVariantChange={handleVariantChange}
                    initialVariantIndex={selectedVariantIndex}
                  />
                ) : currentImages.length > 0 ? (
                  <View style={styles.noVariantsImageContainer} />
                ) : null}
              </View>

              {(variantName || variantFieldsArray.length > 0) && (
                <View
                  style={[
                    styles.variantInfoCard,
                    dynamicStyles.variantInfoCard,
                  ]}
                >
                  <View style={styles.variantInfoHeader}>
                    <Icon name="options-outline" size={20} color="#3B82F6" />
                    <Text
                      style={[
                        styles.variantInfoTitle,
                        dynamicStyles.variantInfoTitle,
                      ]}
                    >
                      Selected Configuration
                    </Text>
                  </View>

                  {variantName ? (
                    <Text
                      style={[styles.variantName, dynamicStyles.variantName]}
                    >
                      {variantName}
                    </Text>
                  ) : null}

                  {variantFieldsArray.length > 0 && (
                    <View
                      style={[
                        styles.variantDetails,
                        dynamicStyles.variantDetails,
                      ]}
                    >
                      {variantFieldsArray.map((field, index) => (
                        <View key={index} style={styles.variantField}>
                          <Text
                            style={[
                              styles.variantFieldName,
                              dynamicStyles.variantFieldName,
                            ]}
                          >
                            {field.name}:
                          </Text>
                          <Text
                            style={[
                              styles.variantFieldValue,
                              dynamicStyles.variantFieldValue,
                            ]}
                          >
                            {field.value}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {currentSku && (
                    <Text
                      style={[
                        styles.variantSkuText,
                        dynamicStyles.variantSkuText,
                      ]}
                    >
                      SKU: {currentSku}
                    </Text>
                  )}
                </View>
              )}

              {currentVideo && (
                <ProductVideo
                  videoUrl={currentVideo}
                  title={`${product.title || ''} ${variantName}`}
                />
              )}

              <View style={{ padding: 16 }}>
                <ProductInfo
                  category={product.category || ''}
                  id={product._id}
                  variantName={variantName}
                  currentPrice={currentPrice}
                  originalPrice={currentMrp}
                  discount={currentDiscount}
                  stock={stockStatus.stock}
                  inStock={stockStatus.isInStock}
                  isDark={isDark}
                />
              </View>

              <View
                style={[
                  styles.stockStatusCard,
                  stockStatus.isInStock
                    ? styles.inStockCard
                    : styles.outOfStockCard,
                  dynamicStyles.stockStatusCard,
                ]}
              >
                <View style={styles.stockStatusHeader}>
                  <Icon
                    name={
                      stockStatus.isInStock
                        ? 'checkmark-circle'
                        : 'close-circle'
                    }
                    size={24}
                    color={stockStatus.isInStock ? '#059669' : '#DC2626'}
                  />
                  <Text
                    style={[
                      styles.stockStatusText,
                      { color: stockStatus.isInStock ? '#059669' : '#DC2626' },
                    ]}
                  >
                    {stockStatus.message}
                  </Text>
                </View>

                {stockStatus.isInStock && stockStatus.stock > 0 && (
                  <Text
                    style={[styles.stockQuantity, dynamicStyles.stockQuantity]}
                  >
                    Hurry! Only {stockStatus.stock} units left
                  </Text>
                )}

                {!stockStatus.isInStock && (
                  <View style={styles.outOfStockDetails}>
                    <Text style={styles.outOfStockMessage}>
                      This item is currently out of stock
                    </Text>
                    <Text
                      style={[
                        styles.outOfStockSubtext,
                        dynamicStyles.outOfStockSubtext,
                      ]}
                    >
                      Check back later or browse similar products
                    </Text>
                  </View>
                )}

                {selectedVariant && (
                  <Text style={[styles.variantNote, dynamicStyles.variantNote]}>
                    Availability is for selected variant only
                  </Text>
                )}
              </View>

              <Text
                style={[
                  styles.productDescriptionTitle,
                  dynamicStyles.productDescriptionTitle,
                ]}
              >
                Product Description
              </Text>

              <View
                style={[styles.descriptionCard, dynamicStyles.descriptionCard]}
              >
                <Text
                  style={[
                    styles.descriptionText,
                    dynamicStyles.descriptionText,
                  ]}
                  numberOfLines={showFullDescription ? undefined : 4}
                >
                  {descriptionText || 'No description available'}
                </Text>
                {descriptionText.length > 200 && (
                  <TouchableOpacity
                    onPress={() => setShowFullDescription(!showFullDescription)}
                    style={styles.readMoreButton}
                  >
                    <Text style={styles.readMoreText}>
                      {showFullDescription ? 'Show Less' : 'Read More'}
                    </Text>
                    <Icon
                      name={showFullDescription ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#3B82F6"
                    />
                  </TouchableOpacity>
                )}
              </View>

              {product.highlights && product.highlights.length > 0 && (
                <>
                  <Text
                    style={[styles.sectionTitle, dynamicStyles.sectionTitle]}
                  >
                    Key Highlights
                  </Text>
                  <View style={styles.highlightsContainer}>
                    {product.highlights.map((highlight, index) => (
                      <View
                        key={index}
                        style={[
                          styles.highlightItem,
                          dynamicStyles.highlightItem,
                        ]}
                      >
                        <Icon
                          name="checkmark-circle"
                          size={18}
                          color="#10B981"
                        />
                        <Text
                          style={[
                            styles.highlightText,
                            dynamicStyles.highlightText,
                          ]}
                        >
                          {highlight}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              <View
                style={[
                  styles.relatedProductsContainer,
                  dynamicStyles.relatedProductsContainer,
                ]}
              >
                <Text
                  style={[
                    styles.relatedProductsTitle,
                    dynamicStyles.relatedProductsTitle,
                  ]}
                >
                  Similar Products
                </Text>
                <RelatedProducts
                  id={product._id}
                  userId={currentUserId || 'userId123'}
                  category={product.category}
                />
                <RelatedSecond
                  id={product._id}
                  userId={currentUserId || 'userId123'}
                />
                <RelatedThird
                  id={product._id}
                  userId={currentUserId || 'userId123'}
                />
              </View>
            </View>
          </ScrollView>
        </View>

        <BottomNavigation
          activeTabs={activeTabs}
          setActiveTabs={setActiveTabs}
        />

        <Toast />
      </SafeAreaView>
    </>
  );
};

const getDynamicStyles = (isDark: boolean) => {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: isDark ? '#0F172A' : 'white' },
    whiteCapsuleBackground: {
      backgroundColor: isDark ? '#2f3a53' : '#FFFFFF',
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
      color: isDark ? '#F1F5F9' : '#1F2937',
    },
    whiteCircleBackground: {
      backgroundColor: isDark ? '#2f3a53' : '#FFFFFF',
    },
    mainContainer: { flex: 1, backgroundColor: isDark ? '#0F172A' : 'white' },
    container: { backgroundColor: isDark ? '#0F172A' : 'white' },
    loadingContainer: { backgroundColor: isDark ? '#0F172A' : 'white' },
    loadingText: { color: isDark ? '#E2E8F0' : '#666' },
    debugText: { color: isDark ? '#94A3B8' : '#6b7280' },
    errorContainer: { backgroundColor: isDark ? '#0F172A' : 'white' },
    errorTitle: { color: isDark ? '#F1F5F9' : '#1F2937' },
    errorMessage: { color: isDark ? '#CBD5E1' : '#6B7280' },
    secondaryButton: { backgroundColor: isDark ? '#334155' : '#E5E7EB' },
    secondaryButtonText: { color: isDark ? '#E2E8F0' : '#374151' },
    noVariantsContainer: { backgroundColor: isDark ? '#1E293B' : '#F9FAFB' },
    imageCountText: { color: isDark ? '#CBD5E1' : '#6B7280' },
    variantInfoCard: {
      backgroundColor: isDark ? '#1E293B' : '#F0F9FF',
      borderColor: isDark ? '#334155' : '#E0F2FE',
    },
    variantInfoTitle: { color: isDark ? '#93C5FD' : '#1E40AF' },
    variantName: { color: isDark ? '#F1F5F9' : '#1F2937' },
    variantSkuText: {
      color: isDark ? '#94A3B8' : '#6B7280',
      fontSize: 12,
      marginTop: 8,
      fontStyle: 'italic',
    },
    variantDetails: {
      backgroundColor: isDark ? '#0F172A' : 'white',
      borderColor: isDark ? '#334155' : '#E5E7EB',
    },
    variantFieldName: { color: isDark ? '#94A3B8' : '#6B7280' },
    variantFieldValue: { color: isDark ? '#E2E8F0' : '#1F2937' },
    stockStatusCard: { backgroundColor: isDark ? '#1E293B' : undefined },
    stockQuantity: { color: isDark ? '#34D399' : '#059669' },
    outOfStockSubtext: { color: isDark ? '#94A3B8' : '#9CA3AF' },
    variantNote: { color: isDark ? '#94A3B8' : '#6B7280' },
    productDescriptionTitle: { color: isDark ? '#F1F5F9' : '#1F2937' },
    descriptionCard: { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
    descriptionText: { color: isDark ? '#CBD5E1' : '#374151' },
    sectionTitle: { color: isDark ? '#F1F5F9' : '#1F2937' },
    highlightItem: { backgroundColor: isDark ? '#1E293B' : '#F9FAFB' },
    highlightText: { color: isDark ? '#CBD5E1' : '#4B5563' },
    relatedProductsContainer: {
      backgroundColor: isDark ? '#1E293B' : '#F9FAFB',
    },
    relatedProductsTitle: { color: isDark ? '#F1F5F9' : '#1F2937' },
    refreshControl: { backgroundColor: isDark ? '#0F172A' : 'white' },
  });
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  mainContainer: { flex: 1 },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 1,
  },
  productImagesWrapper: {
    zIndex: 2,
  },
  soldOutBanner: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
    zIndex: 20,
  },
  soldOutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: { marginTop: 12, fontSize: 16, fontFamily: 'System' },
  debugText: { fontSize: 12, fontFamily: 'monospace', marginTop: 8 },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'System',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'System',
    lineHeight: 24,
  },
  errorButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  primaryButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  noVariantsImageContainer: { height: 300, backgroundColor: '#f0f0f0' },
  simpleImageContainer: { padding: 16, borderRadius: 12, alignItems: 'center' },
  imageCountText: { fontSize: 14, fontFamily: 'System' },
  variantInfoCard: {
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  variantInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  variantInfoTitle: { fontSize: 16, fontWeight: '600', fontFamily: 'System' },
  variantName: {
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 8,
    fontWeight: '500',
  },
  variantDetails: { borderRadius: 8, padding: 12, borderWidth: 1 },
  variantField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  variantFieldName: { fontSize: 13, fontFamily: 'System' },
  variantFieldValue: { fontSize: 13, fontFamily: 'System', fontWeight: '500' },
  variantSkuText: {
    fontSize: 12,
    fontFamily: 'System',
    marginTop: 8,
    fontStyle: 'italic',
  },
  stockStatusCard: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  inStockCard: { borderColor: '#BBF7D0' },
  outOfStockCard: { borderColor: '#FECACA' },
  stockStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  stockStatusText: { fontSize: 16, fontWeight: '600', fontFamily: 'System' },
  stockQuantity: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '500',
    marginBottom: 4,
  },
  outOfStockDetails: { marginTop: 4 },
  outOfStockMessage: {
    fontSize: 14,
    color: '#DC2626',
    fontFamily: 'System',
    fontWeight: '500',
  },
  outOfStockSubtext: { fontSize: 12, fontFamily: 'System', marginTop: 2 },
  variantNote: {
    fontSize: 12,
    fontFamily: 'System',
    fontStyle: 'italic',
    marginTop: 8,
  },
  productDescriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 12,
    fontFamily: 'System',
  },
  descriptionCard: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  descriptionText: { fontSize: 14, lineHeight: 22, fontFamily: 'System' },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 12,
    gap: 4,
  },
  readMoreText: { fontSize: 14, color: '#3B82F6', fontWeight: '500' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  highlightsContainer: { marginHorizontal: 16, marginBottom: 16, gap: 10 },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  highlightText: { fontSize: 14, flex: 1, lineHeight: 20 },
  relatedProductsContainer: { paddingVertical: 20, paddingHorizontal: 16 },
  relatedProductsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: 'System',
  },
});

export default ProductDetailScreen;
