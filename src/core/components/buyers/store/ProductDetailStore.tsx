// ProductDetailsScreen.tsx - FINAL WITH SHARE BUTTON

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import { useProduct } from '../../../hooks/useProducts';
import {
  filterValidVariants,
  getSelectedVariant,
  getCurrentPrice,
  getCurrentMrp,
  getCurrentImages,
  getDescriptionText,
} from '../../../utils/buyers/store/productDetailUtils';
import { getStockStatus } from '../../../services/buyers/store/stockService';

import BottomNavigation from './BottomNavigation';
import ProductHighlights from '../../../mappings/ProductHighlights';

// ✅ Rating & Review Imports
import {
  fetchRatingStats,
  fetchReviews,
  RatingStats,
  Review,
} from '../../../../api/features/private/getRatingReviewPrivateSlice';
import RatingReviewSystem from '../global/RatingGlobal';
import LikeComponent from '../global/LikeGlobal';
import CommentComponent from '../global/CommentGlobal';
import ProductShare from '../global/ShareGlobal'; // ✅ IMPORT SHARE
import { useUser } from '../../../contexts/auth/UserContext';

const { width } = Dimensions.get('window');
const ORANGE = '#FF8438';

export const ProductDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const params = route.params as any;
  const productId = params?.productId || params?.id || null;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isInCart, setIsInCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [validVariants, setValidVariants] = useState<any[]>([]);
  const [localDescription, setLocalDescription] = useState('');
  const [variantOptions, setVariantOptions] = useState<string[]>([]);
  const [variantValues, setVariantValues] = useState<any>({});

  // ✅ Rating & Review States
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const {
    product: rawProduct,
    loading: productLoading,
    error: productError,
    onRefresh: productRefresh,
  } = useProduct({ productId, autoFetch: true });

  useEffect(() => {
    if (rawProduct) {
      if (rawProduct.variants && Array.isArray(rawProduct.variants)) {
        const filtered = filterValidVariants(rawProduct.variants);
        setValidVariants(filtered);
      }

      const newDescription =
        rawProduct.fullDescription ||
        rawProduct.description ||
        rawProduct.shortDescription ||
        '';
      setLocalDescription(newDescription);

      if (rawProduct.variantOptions) {
        setVariantOptions(rawProduct.variantOptions);
      }
      if (rawProduct.variantValues) {
        setVariantValues(rawProduct.variantValues);
      }
    }
  }, [rawProduct]);

  // ✅ Fetch Ratings & Reviews
  const loadRatingAndReviews = useCallback(async () => {
    if (!productId) return;
    setRatingLoading(true);
    try {
      const [stats, reviewsData] = await Promise.all([
        fetchRatingStats(productId),
        fetchReviews(productId, 6),
      ]);
      if (stats) setRatingStats(stats);
      if (reviewsData) setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading rating/reviews:', error);
    } finally {
      setRatingLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      loadRatingAndReviews();
    }
  }, [productId, loadRatingAndReviews]);

  const variantsToShow =
    validVariants.length > 0 ? validVariants : rawProduct?.variants || [];
  const selectedVariantObj = getSelectedVariant(
    variantsToShow,
    selectedVariantIndex,
  );
  const currentPrice = getCurrentPrice(selectedVariantObj, rawProduct);
  const currentMrp = getCurrentMrp(selectedVariantObj, rawProduct);
  const currentImages = getCurrentImages(selectedVariantObj, rawProduct);
  const stockStatus = getStockStatus(rawProduct, selectedVariantObj);
  const descriptionText = getDescriptionText(rawProduct, localDescription);

  const product = rawProduct;
  const productImages =
    currentImages.length > 0 ? currentImages : [product?.images?.[0] || ''];
  const productImage =
    productImages[selectedImageIndex] || productImages[0] || '';

  const handleGoBack = () => navigation.goBack();

  // ✅ Derived Values for Rating
  const averageRating =
    ratingStats?.averageRating || product?.averageRating || 0;
  const reviewCount = ratingStats?.totalReviews || product?.reviewCount || 0;

  if (productLoading && !product) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ORANGE} />
        <Text style={styles.loadingText}>Loading product...</Text>
      </SafeAreaView>
    );
  }

  if (productError || !product) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={60} color="#DC2626" />
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorMessage}>
          {productError || 'Product not found'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={productRefresh}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const fullDesc = descriptionText || product.description || '';
  const shortDesc =
    fullDesc.length > 90
      ? fullDesc.slice(0, 90) + '...'
      : fullDesc || 'No description available';

  // Render Stars
  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(star => (
          <Icon
            key={star}
            name={star <= Math.floor(rating) ? 'star' : 'star-outline'}
            size={size}
            color={star <= Math.floor(rating) ? '#FFB800' : '#CBD5E1'}
          />
        ))}
      </View>
    );
  };

  const renderHighlightsArray = () => {
    if (!product.highlights || product.highlights.length === 0) return null;
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Highlights</Text>
        {product.highlights.map((item: string, index: number) => (
          <View key={index} style={styles.highlightItem}>
            <Icon name="checkmark-circle" size={16} color={ORANGE} />
            <Text style={styles.highlightText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderSpecs = () => {
    if (!product.specs || Object.keys(product.specs).length === 0) return null;
    const specsArray = Object.entries(product.specs);
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Specifications</Text>
        {specsArray.map(([key, value], index) => (
          <View key={index} style={styles.specItem}>
            <Text style={styles.specKey}>{key}</Text>
            <Text style={styles.specValue}>{String(value)}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderVariantOptions = () => {
    if (!variantOptions || variantOptions.length === 0) return null;
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Available Options</Text>
        {variantOptions.map((option, index) => {
          const values = variantValues[option] || [];
          return (
            <View key={index} style={styles.variantOptionContainer}>
              <Text style={styles.variantOptionLabel}>{option}</Text>
              <View style={styles.variantValuesContainer}>
                {values.map((value: string, idx: number) => (
                  <View key={idx} style={styles.variantValueChip}>
                    <Text style={styles.variantValueText}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderDeliveryInfo = () => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Delivery Information</Text>
        <View style={styles.infoRow}>
          <Icon name="time-outline" size={18} color="#666" />
          <Text style={styles.infoText}>
            Delivery Time: {product.deliveryTime || 'Standard'}
          </Text>
        </View>
        {product.sellerLocation && (
          <View style={styles.infoRow}>
            <Icon name="location-outline" size={18} color="#666" />
            <Text style={styles.infoText} numberOfLines={2}>
              {product.sellerLocation.address || 'Location not specified'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderPolicies = () => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Policies</Text>
        {product.warranty && (
          <View style={styles.infoRow}>
            <Icon name="shield-checkmark-outline" size={18} color="#666" />
            <Text style={styles.infoText}>Warranty: {product.warranty}</Text>
          </View>
        )}
        {product.returnPolicy && (
          <View style={styles.infoRow}>
            <Icon name="return-up-back-outline" size={18} color="#666" />
            <Text style={styles.infoText}>
              Return Policy: {product.returnPolicy}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderSellerInfo = () => {
    const hasSellerInfo =
      product.verified !== undefined ||
      product.protectPromiseFees !== undefined ||
      product.fulfillmentType;

    if (!hasSellerInfo) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Seller Information</Text>

        {product.verified !== undefined && (
          <View style={styles.infoRow}>
            <Icon
              name={product.verified ? 'checkmark-circle' : 'close-circle'}
              size={18}
              color={product.verified ? '#22C55E' : '#EF4444'}
            />
            <Text
              style={[
                styles.infoText,
                { color: product.verified ? '#22C55E' : '#EF4444' },
              ]}
            >
              {product.verified ? '✓ Verified Seller' : '✗ Unverified Seller'}
            </Text>
          </View>
        )}

        {product.protectPromiseFees !== undefined && (
          <View style={styles.infoRow}>
            <Icon name="shield-checkmark-outline" size={18} color={ORANGE} />
            <Text style={styles.infoText}>
              Platform Fee:{' '}
              {product.protectPromiseFees ? '✓ Included' : '✗ Not Included'}
            </Text>
          </View>
        )}

        {product.fulfillmentType && (
          <View style={styles.infoRow}>
            <Icon name="cube-outline" size={18} color="#666" />
            <Text style={styles.infoText}>
              Fulfillment:{' '}
              {product.fulfillmentType === 'SELLER'
                ? 'By Seller'
                : 'By TizzyGo'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const hasHighlightFields = () => {
    const highlightFields = [
      'freeDelivery',
      'fastDelivery',
      'safety',
      'productQuality',
      'paymentOptions',
      'manufacturer',
      'cashOnDelivery',
      'deliveryVehicleType',
    ];
    return highlightFields.some(field => product[field] !== undefined);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ECECEC" />

      {/* SafeArea with Gray Background */}
      <View style={[styles.safeAreaTop, { paddingTop: insets.top }]} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + insets.bottom },
        ]}
      >
        {/* ========== IMAGE CARD ========== */}
        <View style={styles.imageCardContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Icon name="arrow-back" size={24} color="#222" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Product Details</Text>

          <View style={styles.mainImageWrapper}>
            {productImage ? (
              <Image
                source={{ uri: productImage }}
                style={styles.mainImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.noImageContainer}>
                <Icon name="image-outline" size={50} color="#9CA3AF" />
                <Text style={styles.noImageText}>No Image</Text>
              </View>
            )}
          </View>

          {productImages.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailContainer}
            >
              {productImages.map((img: string, index: number) => {
                const isSelected = index === selectedImageIndex;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedImageIndex(index)}
                    style={[
                      styles.thumbnailWrapper,
                      isSelected && styles.selectedThumbnail,
                    ]}
                  >
                    <Image
                      source={{ uri: img }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ========== DETAILS ========== */}
        <View style={styles.detailsContainer}>
          {/* Title + Heart */}
          <View style={styles.titleRow}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {product.title || 'Product'}
            </Text>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => setIsFavorite(!isFavorite)}
            >
              <Icon
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite ? '#FF0000' : '#FF4D4D'}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.categoryText}>
            {product.brand ? `${product.brand}` : ''}
            {product.category ? ` • ${product.category}` : ''}
            {product.subcategory ? ` • ${product.subcategory}` : ''}
          </Text>

          <Text style={styles.skuText}>
            SKU: {product.productId || product.sku || 'N/A'}
          </Text>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>
              ₹{currentPrice || product.finalPrice || product.price || '0'}
            </Text>
            {(currentMrp > currentPrice || product.mrp) && (
              <Text style={styles.originalPrice}>
                ₹{currentMrp || product.mrp || '0'}
              </Text>
            )}
            {product.discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{product.discount}% OFF</Text>
              </View>
            )}
          </View>

          {product.gstRate && (
            <Text style={styles.gstText}>
              GST: {product.gstRate}% ({product.gstType || 'EXCLUSIVE'})
            </Text>
          )}

          {/* Stock Status */}
          <View style={styles.stockContainer}>
            <Icon
              name={
                stockStatus?.isInStock ? 'checkmark-circle' : 'close-circle'
              }
              size={16}
              color={stockStatus?.isInStock ? '#22C55E' : '#EF4444'}
            />
            <Text
              style={[
                styles.stockText,
                { color: stockStatus?.isInStock ? '#22C55E' : '#EF4444' },
              ]}
            >
              {stockStatus?.isInStock
                ? `In Stock (${stockStatus.stock || product.quantityAvailable || 0} available)`
                : 'Out of Stock'}
            </Text>
          </View>

          {/* PRODUCT HIGHLIGHTS */}
          {hasHighlightFields() && (
            <View style={styles.highlightsWrapper}>
              <ProductHighlights product={product} />
            </View>
          )}

          {/* Weight & Dimensions */}
          {(product.weight ||
            product.length ||
            product.width ||
            product.height) && (
            <View style={styles.dimensionsContainer}>
              <Text style={styles.dimensionsLabel}>Product Details:</Text>
              <View style={styles.dimensionsRow}>
                {product.weight && (
                  <Text style={styles.dimensionsText}>
                    Weight: {product.weight} {product.weightUnit || 'KG'}
                  </Text>
                )}
                {(product.length || product.width || product.height) && (
                  <Text style={styles.dimensionsText}>
                    Size: {product.length || 0} × {product.width || 0} ×{' '}
                    {product.height || 0} {product.dimensionUnit || 'CM'}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Description */}
          {(fullDesc || product.shortDescription) && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>
                {showFullDesc ? fullDesc : shortDesc}
                {fullDesc.length > 90 && (
                  <Text
                    style={styles.readMore}
                    onPress={() => setShowFullDesc(!showFullDesc)}
                  >
                    {showFullDesc ? ' Read less' : ' Read more...'}
                  </Text>
                )}
              </Text>
            </View>
          )}

          {/* ⭐⭐⭐ RATING & REVIEWS SECTION ⭐⭐⭐ */}
          <View style={styles.ratingContainer}>
            <TouchableOpacity
              style={styles.ratingMain}
              onPress={() => setShowRatingModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.ratingLeft}>
                <Text style={styles.ratingNumber}>
                  {averageRating.toFixed(1)}
                </Text>
                <Text style={styles.ratingTotal}>/5</Text>
                {renderStars(averageRating, 16)}
              </View>
              <View style={styles.ratingRight}>
                <Text style={styles.reviewCount}>{reviewCount} Reviews</Text>
                <Icon name="chevron-forward" size={20} color="#94A3B8" />
              </View>
            </TouchableOpacity>

            {/* Reviewers Avatars */}
            {reviews.length > 0 && (
              <TouchableOpacity
                style={styles.avatarRow}
                onPress={() => setShowRatingModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.avatarContainer}>
                  {reviews.slice(0, 4).map((review, index) => (
                    <View
                      key={index}
                      style={[
                        styles.avatarCircle,
                        { marginLeft: index > 0 ? -8 : 0 },
                      ]}
                    >
                      <Text style={styles.avatarText}>
                        {(review as any)?.user?.name
                          ?.charAt(0)
                          ?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                  ))}
                  {reviews.length > 4 && (
                    <View style={[styles.avatarCircle, styles.moreAvatar]}>
                      <Text style={styles.moreText}>+{reviews.length - 4}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.verifiedText}>Verified Buyers</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Write Review Section */}
          <View style={styles.writeReviewContainer}>
            <Text style={styles.sectionTitle}>Write a Review</Text>
            <RatingReviewSystem
              productId={productId}
              onRatingSubmit={async (rating: number, review: string) => {
                console.log('Submit review:', rating, review);
                loadRatingAndReviews();
              }}
              initialRating={0}
              initialReview=""
            />
          </View>

          {/* ========== ACTION BUTTONS (Like, Comment, Share) ========== */}
          <View style={styles.actionButtonsContainer}>
            <View style={styles.actionRow}>
              <View style={styles.actionItem}>
                <LikeComponent productId={productId} />
                <Text style={styles.actionLabel}>Like</Text>
              </View>
              <View style={styles.actionItem}>
                <CommentComponent productId={productId} />
                <Text style={styles.actionLabel}>Comment</Text>
              </View>
              {/* ✅ SHARE BUTTON ADDED */}
              <View style={styles.actionItem}>
                <ProductShare
                  productId={productId}
                  productTitle={product.title || 'Product'}
                  category={product.category || ''}
                  productImage={productImages[0] || ''}
                  productPrice={`₹${currentPrice || product.finalPrice || product.price || 0}`}
                />
                <Text style={styles.actionLabel}>Share</Text>
              </View>
            </View>
          </View>

          {/* Highlights Array */}
          {renderHighlightsArray()}

          {/* Variant Options */}
          {renderVariantOptions()}

          {/* Specifications */}
          {renderSpecs()}

          {/* Delivery Info */}
          {renderDeliveryInfo()}

          {/* Policies */}
          {renderPolicies()}

          {/* Seller Info */}
          {renderSellerInfo()}
        </View>
      </ScrollView>

      {/* ========== BOTTOM NAVIGATION ========== */}
      <View
        style={[styles.bottomNavContainer, { paddingBottom: insets.bottom }]}
      >
        <BottomNavigation productData={product} productId={productId} />
      </View>

      {/* ========== RATING MODAL ========== */}
      <Modal
        visible={showRatingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRatingModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                <Icon name="arrow-back" size={24} color="#1F2937" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>All Reviews</Text>
              <View style={{ width: 40 }} />
            </View>
            <ScrollView style={styles.modalScroll}>
              <RatingReviewSystem
                productId={productId}
                onRatingSubmit={async (rating: number, review: string) => {
                  console.log('Submit review:', rating, review);
                  loadRatingAndReviews();
                }}
                initialRating={0}
                initialReview=""
              />
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeAreaTop: {
    backgroundColor: '#ECECEC',
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: ORANGE,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Image Card
  imageCardContainer: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 14,
    position: 'relative',
    paddingTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E1E1E',
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 8,
  },
  mainImageWrapper: {
    width: width,
    height: width * 0.82,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    width: '90%',
    height: '95%',
  },
  noImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#9CA3AF',
    marginTop: 8,
  },
  thumbnailContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  thumbnailWrapper: {
    width: 52,
    height: 52,
    borderRadius: 10,
    padding: 3,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    marginRight: 8,
  },
  selectedThumbnail: {
    borderColor: ORANGE,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 7,
  },

  // Details
  detailsContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222222',
    flex: 1,
    marginRight: 12,
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  skuText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  originalPrice: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  discountBadge: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  discountText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  gstText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600',
  },
  highlightsWrapper: {
    marginTop: 12,
    marginHorizontal: -20,
  },
  dimensionsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  dimensionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  dimensionsRow: {
    gap: 4,
  },
  dimensionsText: {
    fontSize: 13,
    color: '#475569',
  },
  descriptionContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
  },
  readMore: {
    color: ORANGE,
    fontWeight: '600',
  },

  // Rating Section
  ratingContainer: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  ratingMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  ratingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  ratingTotal: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },
  starsRow: {
    flexDirection: 'row',
    marginLeft: 8,
    gap: 2,
  },
  ratingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#64748B',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  moreAvatar: {
    backgroundColor: '#94A3B8',
  },
  moreText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  verifiedText: {
    fontSize: 12,
    color: '#64748B',
  },
  writeReviewContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },

  // Action Buttons
  actionButtonsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionItem: {
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },

  // Section styles
  sectionContainer: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  highlightText: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  specKey: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  specValue: {
    fontSize: 13,
    color: '#1E293B',
    flex: 1,
    textAlign: 'right',
  },
  variantOptionContainer: {
    marginBottom: 12,
  },
  variantOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  variantValuesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantValueChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  variantValueText: {
    fontSize: 13,
    color: '#334155',
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
    textAlign: 'center',
  },
  modalScroll: {
    flex: 1,
    padding: 16,
  },
});

export default ProductDetailsScreen;
