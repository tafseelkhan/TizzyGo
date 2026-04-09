// screens/ProductDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/auth/UserContext';
import { useTheme } from '../../contexts/theme/ThemeContext';
import axios from 'axios';
import ProductImages, {
  Variant,
} from '../../components/Products/ProductImages';
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
};

type ProductDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ProductDetail'
>;

// Extended Product interface with variants
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
  shortDescription?: string;
  fullDescription?: string;
  highlights?: string[];
  specs?: Record<string, any>;
  inStock?: boolean | string;
  quantityAvailable?: number;
  sellerLocation?: any;
}

const { width } = Dimensions.get('window');

const ProductDetailScreen: React.FC = () => {
  const navigation = useNavigation<ProductDetailScreenNavigationProp>();
  const route = useRoute();

  const params = route.params as any;
  const productId = params?.productId || params?.id || null;

  console.log('🔍 ProductDetailScreen - productId:', productId);

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

  // ✅ थीम के हिसाब से स्टाइल्स डायनामिक बनाएं
  const dynamicStyles = getDynamicStyles(isDark);

  useEffect(() => {
    console.log('🔍 useEffect running with productId:', productId);

    if (!productId) {
      console.error('❌ Product ID is undefined or null!');
      setError('Product ID is missing. Please go back and try again.');
      setLoading(false);
      return;
    }

    fetchProduct();
  }, [productId]);

  // ✅ थीम डिबगिंग (optional)
  useEffect(() => {
    console.log('🎨 Current Theme:', theme);
    console.log('🌙 Is Dark Mode:', isDark);
    console.log('🔧 Resolved Theme:', resolvedTheme);
  }, [theme, isDark, resolvedTheme]);

  // ✅ Local description update on product change
  useEffect(() => {
    if (product) {
      const newDescription =
        product.fullDescription ||
        product.description ||
        product.shortDescription ||
        '';

      setLocalDescription(newDescription);
      console.log('✅ Local description updated:', newDescription);
    }
  }, [product]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      console.log('📡 Fetching product with ID:', productId);

      const response = await axios.get(
        `http://192.168.251.121:5000/api/seller/forms/categories/${productId}`,
      );

      console.log('✅ API Response:', response.data);

      const productData =
        response.data.product || response.data.data || response.data;

      if (!productData?._id) {
        console.error('❌ Product data not found in response');
        throw new Error('Product not found in response');
      }

      console.log('✅ Product data loaded:', productData.title);
      console.log('✅ Product variants:', productData.variants?.length || 0);

      setProduct(productData);
      setSelectedVariantIndex(0);
      setError(null);
    } catch (err: any) {
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
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleVariantChange = (variantIndex: number) => {
    console.log('🔄 Variant changed to:', variantIndex);
    setSelectedVariantIndex(variantIndex);
  };

  const getSelectedVariant = (): Variant | null => {
    if (!product?.variants || product.variants.length === 0) return null;
    return product.variants[selectedVariantIndex];
  };

  const getVariantDisplayName = (): string => {
    const variant = getSelectedVariant();
    if (!variant || !variant.fields) return '';

    return variant.fields?.map(field => field.value).join(' • ') || '';
  };

  const getCurrentPrice = (): number => {
    const variant = getSelectedVariant();
    if (variant?.price) return variant.price;
    return product?.price || 0;
  };

  const getCurrentStock = (): number | undefined => {
    const variant = getSelectedVariant();
    if (variant?.stock !== undefined) return variant.stock;
    return product?.quantityAvailable;
  };

  const getCurrentImages = (): string[] => {
    const variant = getSelectedVariant();
    if (variant?.images && variant.images.length > 0) return variant.images;
    return product?.images || [];
  };

  // ✅ Stock status logic
  const getStockStatus = () => {
    if (!product) {
      return {
        isInStock: false,
        stock: 0,
        message: 'Product not available',
        showSoldOutBanner: true,
      };
    }

    const inStockValue = product.inStock;
    let isInStock: boolean;

    if (typeof inStockValue === 'boolean') {
      isInStock = inStockValue;
    } else if (typeof inStockValue === 'string') {
      isInStock = inStockValue.toLowerCase() === 'true';
    } else {
      isInStock = false;
    }

    const finalStock = getCurrentStock();
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

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  const handleCategoryPress = () => {
    if (product?.category) {
      navigation.navigate('CategoryProducts', {
        category: product.category,
      });
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const onRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    fetchProduct();
  };

  // ✅ Get description text with priority
  const getDescriptionText = () => {
    if (localDescription) return localDescription;
    if (product?.fullDescription) return product.fullDescription;
    if (product?.description) return product.description;
    if (product?.shortDescription) return product.shortDescription;
    return '';
  };

  // ✅ Loading State
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

  // ✅ Error State
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

  const selectedVariant = getSelectedVariant();
  const variantName = getVariantDisplayName();
  const currentPrice = getCurrentPrice();
  const currentImages = getCurrentImages();
  const stockStatus = getStockStatus();
  const descriptionText = getDescriptionText();

  return (
    <SafeAreaView
      style={[styles.safeArea, dynamicStyles.safeArea]}
      edges={['top', 'left', 'right']}
    >
      <View style={[styles.mainContainer, dynamicStyles.mainContainer]}>
        {/* ✅ Sold Out Banner */}
        {stockStatus.showSoldOutBanner && (
          <View style={styles.soldOutBanner}>
            <Icon name="close-circle" size={24} color="#FFFFFF" />
            <Text style={styles.soldOutText}>SOLD OUT</Text>
          </View>
        )}

        {/* Header */}
        <View style={[styles.header, dynamicStyles.header]}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Icon
              name="arrow-back"
              size={24}
              color={isDark ? '#FFFFFF' : '#374151'}
            />
          </TouchableOpacity>
          <Text
            style={[styles.headerTitle, dynamicStyles.headerTitle]}
            numberOfLines={1}
          >
            {product.title || 'Product'}
          </Text>
          <TouchableOpacity style={styles.shareButton} />
        </View>

        <ScrollView
          style={[styles.container, dynamicStyles.container]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FFA41C']}
              tintColor="#FFA41C"
              style={dynamicStyles.refreshControl}
            />
          }
        >
          {/* Breadcrumbs */}
          <View
            style={[
              styles.breadcrumbContainer,
              dynamicStyles.breadcrumbContainer,
            ]}
          >
            <TouchableOpacity
              onPress={handleGoHome}
              style={styles.breadcrumbItem}
            >
              <Text
                style={[styles.breadcrumbLink, dynamicStyles.breadcrumbLink]}
              >
                Home
              </Text>
            </TouchableOpacity>
            <Text
              style={[
                styles.breadcrumbSeparator,
                dynamicStyles.breadcrumbSeparator,
              ]}
            >
              {' '}
              ›{' '}
            </Text>
            <TouchableOpacity
              onPress={handleCategoryPress}
              style={styles.breadcrumbItem}
            >
              <Text
                style={[styles.breadcrumbLink, dynamicStyles.breadcrumbLink]}
              >
                {product.category || 'Category'}
              </Text>
            </TouchableOpacity>
            {product.brand && (
              <>
                <Text
                  style={[
                    styles.breadcrumbSeparator,
                    dynamicStyles.breadcrumbSeparator,
                  ]}
                >
                  {' '}
                  ›{' '}
                </Text>
                <Text
                  style={[
                    styles.breadcrumbCurrent,
                    dynamicStyles.breadcrumbCurrent,
                  ]}
                >
                  {product.brand}
                </Text>
              </>
            )}
          </View>

          {/* Product Images */}
          {product.variants && product.variants.length > 0 ? (
            <ProductImages
              variants={product.variants}
              onVariantChange={handleVariantChange}
              initialVariantIndex={selectedVariantIndex}
            />
          ) : currentImages.length > 0 ? (
            <View
              style={[
                styles.noVariantsContainer,
                dynamicStyles.noVariantsContainer,
              ]}
            >
              <View
                style={[
                  {
                    backgroundColor: isDark ? '#1F2937' : 'white',
                    padding: 16,
                  },
                ]}
              >
                {currentImages.length > 0 && (
                  <View style={styles.simpleImageContainer}>
                    <Text
                      style={[
                        styles.imageCountText,
                        dynamicStyles.imageCountText,
                      ]}
                    >
                      {currentImages.length} image
                      {currentImages.length > 1 ? 's' : ''} available
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : null}

          {/* Selected Variant Info */}
          {variantName && (
            <View
              style={[styles.variantInfoCard, dynamicStyles.variantInfoCard]}
            >
              <View style={styles.variantInfoHeader}>
                <Icon name="options-outline" size={20} color="#3B82F6" />
                <Text
                  style={[
                    styles.variantInfoTitle,
                    dynamicStyles.variantInfoTitle,
                  ]}
                >
                  Selected Variant
                </Text>
              </View>
              <Text style={[styles.variantName, dynamicStyles.variantName]}>
                {variantName}
              </Text>
              {selectedVariant?.fields && (
                <View
                  style={[styles.variantDetails, dynamicStyles.variantDetails]}
                >
                  {selectedVariant.fields.map((field, index) => (
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
            </View>
          )}

          {/* Product Video */}
          {selectedVariant?.video && (
            <ProductVideo
              videoUrl={selectedVariant.video}
              title={`${product.title || ''} ${variantName}`}
            />
          )}

          {/* Product Info */}
          <View style={{ padding: 16 }}>
            <ProductInfo
              category={product.category || ''}
              id={product._id}
              variantName={variantName}
              currentPrice={currentPrice}
              originalPrice={product.mrp}
              discount={product.discount}
              stock={stockStatus.stock}
              inStock={stockStatus.isInStock}
              isDark={isDark}
            />
          </View>

          {/* Stock Status Display */}
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
                  stockStatus.isInStock ? 'checkmark-circle' : 'close-circle'
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
              <Text style={[styles.stockQuantity, dynamicStyles.stockQuantity]}>
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

          {/* ✅ Product Description Section */}
          <Text
            style={[
              styles.productDescriptionTitle,
              dynamicStyles.productDescriptionTitle,
            ]}
          >
            Product Description
          </Text>

          <View style={[styles.descriptionCard, dynamicStyles.descriptionCard]}>
            <Text
              style={[styles.descriptionText, dynamicStyles.descriptionText]}
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

          {/* Highlights Section */}
          {product.highlights && product.highlights.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                Key Highlights
              </Text>
              <View style={styles.highlightsContainer}>
                {product.highlights.map((highlight, index) => (
                  <View
                    key={index}
                    style={[styles.highlightItem, dynamicStyles.highlightItem]}
                  >
                    <Icon name="checkmark-circle" size={18} color="#10B981" />
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

          {/* Related products */}
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
        </ScrollView>
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation activeTabs={activeTabs} setActiveTabs={setActiveTabs} />

      <Toast />
    </SafeAreaView>
  );
};

// ✅ थीम के हिसाब से डायनामिक स्टाइल्स फंक्शन
const getDynamicStyles = (isDark: boolean) => {
  return StyleSheet.create({
    safeArea: { backgroundColor: isDark ? '#0F172A' : 'white' },
    mainContainer: { backgroundColor: isDark ? '#0F172A' : 'white' },
    container: { backgroundColor: isDark ? '#0F172A' : 'white' },
    loadingContainer: { backgroundColor: isDark ? '#0F172A' : 'white' },
    loadingText: { color: isDark ? '#E2E8F0' : '#666' },
    debugText: { color: isDark ? '#94A3B8' : '#6b7280' },
    errorContainer: { backgroundColor: isDark ? '#0F172A' : 'white' },
    errorTitle: { color: isDark ? '#F1F5F9' : '#1F2937' },
    errorMessage: { color: isDark ? '#CBD5E1' : '#6B7280' },
    secondaryButton: { backgroundColor: isDark ? '#334155' : '#E5E7EB' },
    secondaryButtonText: { color: isDark ? '#E2E8F0' : '#374151' },
    header: {
      backgroundColor: isDark ? '#1E293B' : 'white',
      borderBottomColor: isDark ? '#334155' : '#E5E7EB',
    },
    headerTitle: { color: isDark ? '#F1F5F9' : '#1F2937' },
    breadcrumbContainer: { backgroundColor: isDark ? '#1E293B' : '#F9FAFB' },
    breadcrumbLink: { color: isDark ? '#60A5FA' : '#3B82F6' },
    breadcrumbSeparator: { color: isDark ? '#94A3B8' : '#6B7280' },
    breadcrumbCurrent: { color: isDark ? '#E2E8F0' : '#374151' },
    noVariantsContainer: { backgroundColor: isDark ? '#1E293B' : '#F9FAFB' },
    imageCountText: { color: isDark ? '#CBD5E1' : '#6B7280' },
    variantInfoCard: {
      backgroundColor: isDark ? '#1E293B' : '#F0F9FF',
      borderColor: isDark ? '#334155' : '#E0F2FE',
    },
    variantInfoTitle: { color: isDark ? '#93C5FD' : '#1E40AF' },
    variantName: { color: isDark ? '#F1F5F9' : '#1F2937' },
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

// ✅ Base styles
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  mainContainer: { flex: 1 },
  soldOutBanner: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
    zIndex: 10,
  },
  soldOutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  shareButton: { padding: 4, width: 40 },
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
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  breadcrumbItem: { maxWidth: 100 },
  breadcrumbLink: { fontSize: 12, fontFamily: 'System', fontWeight: '500' },
  breadcrumbSeparator: {
    fontSize: 12,
    marginHorizontal: 4,
    fontFamily: 'System',
  },
  breadcrumbCurrent: { fontSize: 12, fontFamily: 'System', fontWeight: '600' },
  noVariantsContainer: { marginBottom: 16 },
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
