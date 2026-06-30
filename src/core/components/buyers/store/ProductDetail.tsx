// screens/ProductDetailScreen.tsx - FINAL WORKING VERSION

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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../../contexts/auth/UserContext';
import { useTheme } from '../../../contexts/theme/ThemeContext';
import { useProduct } from '../../../hooks/useProducts';
import {
  filterValidVariants,
  getSelectedVariant,
  getVariantDisplayName,
  getCurrentPrice,
  getCurrentMrp,
  getCurrentDiscount,
  getCurrentImages,
  getCurrentVideo,
  getCurrentSku,
  getVariantFieldsArray,
  getDescriptionText,
  Product,
  Variant,
} from '../../../utils/buyers/store/productDetailUtils';
import { getStockStatus } from '../../../services/buyers/store/stockService';
import {
  handleGoBack,
  handleCategoryPress,
  handleMorePress,
} from '../../../services/buyers/store/navigationService';
import ProductImages from './ProductImages';
import ProductVideo from './ProductVideos';
import ProductInfo from './ProductInfo';
import RelatedProducts from './RelatedProducts';
import RelatedSecond from './RelatedSecond';
import RelatedThird from './RelatedThird';
import Toast from 'react-native-toast-message';
import BottomNavigation from './BottomNavigation';
import Icon from 'react-native-vector-icons/Ionicons';

type RootStackParamList = {
  Home: undefined;
  ProductDetail: { productId: string };
  CategoryProducts: { category: string };
  ProductMore: { productId: string; productTitle: string };
};

type ProductDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ProductDetail'
>;

const { width } = Dimensions.get('window');

const ProductDetailScreen: React.FC = () => {
  const navigation = useNavigation<ProductDetailScreenNavigationProp>();
  const route = useRoute();
  const scrollViewRef = useRef<ScrollView>(null);

  const params = route.params as any;
  const productId = params?.productId || params?.id || null;

  const { user } = useUser();
  const { isDark } = useTheme();
  const currentUserId = user?._id;

  // Use product hook - 1 API call
  const {
    product: rawProduct,
    loading: productLoading,
    error: productError,
    refreshing,
    onRefresh: productRefresh,
  } = useProduct({ productId, autoFetch: true });

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [validVariants, setValidVariants] = useState<Variant[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTabs, setActiveTabs] = useState('home');
  const [localDescription, setLocalDescription] = useState<string>(''); // ADD THIS STATE

  // Process product when loaded
  useEffect(() => {
    if (rawProduct) {
      // Filter valid variants
      if (rawProduct.variants && Array.isArray(rawProduct.variants)) {
        const filtered = filterValidVariants(rawProduct.variants);
        setValidVariants(filtered);
      }
      
      // Set local description
      const newDescription = rawProduct.fullDescription || rawProduct.description || rawProduct.shortDescription || '';
      if (newDescription !== localDescription) {
        setLocalDescription(newDescription);
      }
    }
  }, [rawProduct, localDescription]);

  // Handle variant change
  const handleVariantChange = useCallback((variantIndex: number) => {
    setSelectedVariantIndex(variantIndex);
  }, []);

  // Memoized values
  const variantsToShow = validVariants.length > 0 ? validVariants : rawProduct?.variants || [];
  const selectedVariant = getSelectedVariant(variantsToShow, selectedVariantIndex);
  const variantName = getVariantDisplayName(selectedVariant);
  const currentPrice = getCurrentPrice(selectedVariant, rawProduct);
  const currentMrp = getCurrentMrp(selectedVariant, rawProduct);
  const currentDiscount = getCurrentDiscount(selectedVariant, rawProduct);
  const currentImages = getCurrentImages(selectedVariant, rawProduct);
  const currentVideo = getCurrentVideo(selectedVariant);
  const currentSku = getCurrentSku(selectedVariant);
  const variantFieldsArray = getVariantFieldsArray(selectedVariant);
  const stockStatus = getStockStatus(rawProduct, selectedVariant);
  // FIXED: Pass both arguments
  const descriptionText = getDescriptionText(rawProduct, localDescription);

  const product = rawProduct;
  const loading = productLoading;

  // Navigation handlers using service
  const onGoBack = useCallback(() => handleGoBack(navigation), [navigation]);
  const onCategoryPress = useCallback(
    () => handleCategoryPress(navigation, product?.category),
    [navigation, product?.category],
  );
  const onMorePress = useCallback(
    () => handleMorePress(navigation, product?._id, product?.title),
    [navigation, product?._id, product?.title],
  );

  const onRefresh = useCallback(() => {
    productRefresh();
  }, [productRefresh]);

  const dynamicStyles = getDynamicStyles(isDark);

  // Loading State
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

  // Error State
  if (productError || !product) {
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
            {productError || 'Product not found'}
          </Text>
          <Text style={[styles.debugText, dynamicStyles.debugText]}>
            Product ID: {productId || 'Not found'}
          </Text>

          <View style={styles.errorButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={onRefresh}>
              <Icon name="refresh" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, dynamicStyles.secondaryButton]}
              onPress={onGoBack}
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
              />
            }
          >
            <View>
              {/* Product Images */}
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

              {/* Variant Info Card */}
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

              {/* Product Video */}
              {currentVideo && (
                <ProductVideo
                  videoUrl={currentVideo}
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
                  originalPrice={currentMrp}
                  discount={currentDiscount}
                  stock={stockStatus.stock}
                  inStock={stockStatus.isInStock}
                  isDark={isDark}
                />
              </View>

              {/* Stock Status Card */}
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

              {/* Product Description */}
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

              {/* Key Highlights */}
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

              {/* Related Products */}
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

// Dynamic Styles (keep from your original)
const getDynamicStyles = (isDark: boolean) => {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: isDark ? '#0F172A' : 'white' },
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
    variantInfoCard: {
      backgroundColor: isDark ? '#1E293B' : '#F0F9FF',
      borderColor: isDark ? '#334155' : '#E0F2FE',
    },
    variantInfoTitle: { color: isDark ? '#93C5FD' : '#1E40AF' },
    variantName: { color: isDark ? '#F1F5F9' : '#1F2937' },
    variantSkuText: { color: isDark ? '#94A3B8' : '#6B7280' },
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
  });
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  mainContainer: { flex: 1 },
  productImagesWrapper: { zIndex: 2 },
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
  loadingText: { marginTop: 12, fontSize: 16 },
  debugText: { fontSize: 12, marginTop: 8 },
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
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
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
  primaryButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '600' },
  noVariantsImageContainer: { height: 300, backgroundColor: '#f0f0f0' },
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
  variantInfoTitle: { fontSize: 16, fontWeight: '600' },
  variantName: { fontSize: 14, marginBottom: 8, fontWeight: '500' },
  variantDetails: { borderRadius: 8, padding: 12, borderWidth: 1 },
  variantField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  variantFieldName: { fontSize: 13 },
  variantFieldValue: { fontSize: 13, fontWeight: '500' },
  variantSkuText: { fontSize: 12, marginTop: 8, fontStyle: 'italic' },
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
  stockStatusText: { fontSize: 16, fontWeight: '600' },
  stockQuantity: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  outOfStockDetails: { marginTop: 4 },
  outOfStockMessage: { fontSize: 14, color: '#DC2626', fontWeight: '500' },
  outOfStockSubtext: { fontSize: 12, marginTop: 2 },
  variantNote: { fontSize: 12, fontStyle: 'italic', marginTop: 8 },
  productDescriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  descriptionCard: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  descriptionText: { fontSize: 14, lineHeight: 22 },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
  relatedProductsTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
});

export default ProductDetailScreen;