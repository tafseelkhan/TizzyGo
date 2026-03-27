// components/ProductCard.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Animated,
  ScrollView,
  TextInput,  // Add this
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import LikeComponent from '../global/LikeGlobal';
import ShareWithStats from '../global/ShareGlobal';
import CommentComponent from '../global/CommentGlobal';
import RatingReviewSystem from '../global/RatingGlobal';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { useTheme } from '../../contexts/theme/ThemeContext';

// Types
type Variant = {
  fields?: any[];
  images?: string[];
  video?: string;
};

type FullProduct = {
  _id: string;
  title: string;
  brand: string;
  description: string;
  subcategory: string;
  variants?: Variant[];
  mrp: number;
  price: number;
  discount: number;
  finalPrice: number;
  offerText?: string;
  averageRating?: number;
  reviewCount?: number;
};

type ApiProductResponse = {
  productId: string;
  fullProduct: FullProduct;
};

type ProductCardProps = {
  product: ApiProductResponse;
  userId?: string | null;
  showSocialButtons?: boolean;
};

// Navigation types
type RootStackParamList = {
  ProductDetail: { id: string };
  [key: string]: any;
};

interface RatingStats {
  totalRatings: number;
  averageRating: number;
  percentage: number;
  distribution: number[];
  totalReviews: number;
}

interface Review {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email?: string;
    image?: string;
  };
  rating: number;
  review: string;
  images: any[];
  createdAt: string;
  updatedAt: string;
}

// Simple MediaViewer Component
const CustomMediaViewer = ({
  media,
  currentIndex,
}: {
  media: string[];
  currentIndex: number;
}) => {
  const { isDark } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentMedia = media[currentIndex] || '';

  const handleImageError = () => {
    setImageError(true);
    setLoading(false);
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  const getFallbackImage = () => {
    return 'https://placehold.co/400x400/e5e7eb/6b7280?text=Product';
  };

  return (
    <View style={styles.mediaViewerContainer}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3b82f6" />
        </View>
      )}

      {imageError || !currentMedia || currentMedia.includes('...') ? (
        <Image
          source={{ uri: getFallbackImage() }}
          style={styles.productImage}
          resizeMode="contain"
        />
      ) : (
        <Image
          source={{
            uri: currentMedia.startsWith('http')
              ? currentMedia
              : `https://${currentMedia}`,
            cache: 'force-cache',
          }}
          style={styles.productImage}
          resizeMode="contain"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </View>
  );
};

// Helper function to get media
const getProductMedia = (productData: ApiProductResponse): string[] => {
  const media: string[] = [];
  const fullProduct = productData.fullProduct;

  if (
    !fullProduct ||
    !fullProduct.variants ||
    fullProduct.variants.length === 0
  ) {
    return ['https://placehold.co/400x400/e5e7eb/6b7280?text=Product'];
  }

  const firstVariant = fullProduct.variants[0];

  if (firstVariant.images && Array.isArray(firstVariant.images)) {
    firstVariant.images.forEach((img: string) => {
      if (img && typeof img === 'string' && img.length > 10) {
        const cleanUrl = img.replace('…', '').trim();
        if (cleanUrl && !media.includes(cleanUrl)) {
          media.push(cleanUrl);
        }
      }
    });
  }

  if (media.length === 0) {
    media.push('https://placehold.co/400x400/e5e7eb/6b7280?text=Product');
  }

  return media;
};

// ✅ Custom Rating Component (Replacing RatingWrapper)
const RatingDisplay = ({
  productId,
  averageRating,
}: {
  productId: string;
  averageRating: number;
}) => {
  const { isDark } = useTheme();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);

  // Fetch rating data when modal opens
  useEffect(() => {
    if (!showRatingModal) return;

    const fetchRatingData = async () => {
      try {
        const statsResponse = await axios.get(
          `http://192.168.42.121:5000/api/rating-review/rating/stats/${productId}`,
        );
        if (statsResponse.data.success) {
          setRatingStats(statsResponse.data.data);
        }

        const reviewsResponse = await axios.get(
          `http://192.168.42.121:5000/api/rating-review/rating/reviews/${productId}?limit=10`,
        );
        if (reviewsResponse.data.success) {
          setReviews(reviewsResponse.data.data || []);
        }

        // Fetch user's own review
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          try {
            const userReviewResponse = await axios.get(
              `http://192.168.42.121:5000/api/rating-review/rating/user/${productId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
            if (
              userReviewResponse.data.success &&
              userReviewResponse.data.data
            ) {
              setUserReview(userReviewResponse.data.data);
            }
          } catch (err) {
            // User may not have a review yet
            console.log('No existing review found');
          }
        }
      } catch (err) {
        console.log('Error fetching rating data:', err);
      }
    };

    fetchRatingData();
  }, [productId, showRatingModal]);

  const fetchRatingData = async () => {
    try {
      const statsResponse = await axios.get(
        `http://192.168.42.121:5000/api/rating-review/rating/stats/${productId}`,
      );
      if (statsResponse.data.success) {
        setRatingStats(statsResponse.data.data);
      }

      const reviewsResponse = await axios.get(
        `http://192.168.42.121:5000/api/rating-review/rating/reviews/${productId}?limit=10`,
      );
      if (reviewsResponse.data.success) {
        setReviews(reviewsResponse.data.data || []);
      }

      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        try {
          const userReviewResponse = await axios.get(
            `http://192.168.42.121:5000/api/rating-review/rating/user/${productId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          if (userReviewResponse.data.success && userReviewResponse.data.data) {
            setUserReview(userReviewResponse.data.data);
          }
        } catch (err) {
          console.log('No existing review found');
        }
      }
    } catch (err) {
      console.log('Error fetching rating data:', err);
    }
  };

  const handleSubmit = async (formData: any): Promise<void> => {
    setLoadingSubmit(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Please login to submit a review');
        return;
      }

      const submitData = {
        productId: productId,
        rating: formData.rating,
        review: formData.review || '',
        images: formData.images || [],
      };

      const endpoint = userReview
        ? `http://192.168.42.121:5000/api/rating-review/rating/${userReview._id}`
        : `http://192.168.42.121:5000/api/rating-review/rating`;
      const method = userReview ? 'put' : 'post';

      const response = await axios({
        method,
        url: endpoint,
        data: submitData,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        await fetchRatingData();
        setShowRatingForm(false);
        Alert.alert(
          'Success',
          userReview ? 'Review updated!' : 'Review submitted!',
        );
      }
    } catch (err: any) {
      console.error('Error submitting review:', err);
      Alert.alert(
        'Error',
        err.response?.data?.error || 'Failed to submit review',
      );
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!userReview) return;

    setLoadingDelete(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Please login to delete a review');
        return;
      }

      await axios.delete(
        `http://192.168.42.121:5000/api/rating-review/rating/${userReview._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await fetchRatingData();
      setUserReview(null);
      Alert.alert('Success', 'Review deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting review:', err);
      Alert.alert(
        'Error',
        err.response?.data?.error || 'Failed to delete review',
      );
    } finally {
      setLoadingDelete(false);
    }
  };

  const renderStars = (
    rating: number,
    size: number = 16,
    interactive: boolean = false,
    onStarPress?: (rating: number) => void,
  ) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => interactive && onStarPress && onStarPress(star)}
            disabled={!interactive}
            activeOpacity={0.7}
          >
            <Icon
              name={
                star <= rating
                  ? 'star'
                  : star - 0.5 <= rating
                  ? 'star-half'
                  : 'star-outline'
              }
              size={size}
              color="#fbbf24"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderRatingForm = () => {
    const [rating, setRating] = useState(userReview?.rating || 0);
    const [reviewText, setReviewText] = useState(userReview?.review || '');
    const [images, setImages] = useState<any[]>(userReview?.images || []);

    const onSubmit = async () => {
      if (rating === 0) {
        Alert.alert('Error', 'Please select a rating');
        return;
      }

      await handleSubmit({ rating, review: reviewText, images });
    };

    return (
      <View
        style={[
          styles.ratingForm,
          { backgroundColor: isDark ? '#0F172A' : '#f9fafb' },
        ]}
      >
        <Text
          style={[
            styles.ratingFormTitle,
            { color: isDark ? '#F1F5F9' : '#1f2937' },
          ]}
        >
          {userReview ? 'Edit Your Review' : 'Write a Review'}
        </Text>

        <View style={styles.formGroup}>
          <Text
            style={[
              styles.formLabel,
              { color: isDark ? '#CBD5E1' : '#4b5563' },
            ]}
          >
            Rating
          </Text>
          {renderStars(rating, 24, true, setRating)}
        </View>

        <View style={styles.formGroup}>
          <Text
            style={[
              styles.formLabel,
              { color: isDark ? '#CBD5E1' : '#4b5563' },
            ]}
          >
            Your Review
          </Text>
          <TextInput
            style={[
              styles.formTextarea,
              {
                backgroundColor: isDark ? '#1E293B' : 'white',
                color: isDark ? '#F1F5F9' : '#1f2937',
                borderColor: isDark ? '#334155' : '#e5e7eb',
              },
            ]}
            multiline
            numberOfLines={4}
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Share your experience with this product..."
            placeholderTextColor={isDark ? '#64748B' : '#9ca3af'}
          />
        </View>

        <View style={styles.formActions}>
          <TouchableOpacity
            style={[
              styles.cancelButton,
              { backgroundColor: isDark ? '#334155' : '#f3f4f6' },
            ]}
            onPress={() => setShowRatingForm(false)}
          >
            <Text
              style={[
                styles.cancelButtonText,
                { color: isDark ? '#CBD5E1' : '#6b7280' },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: '#3b82f6' }]}
            onPress={onSubmit}
            disabled={loadingSubmit}
          >
            {loadingSubmit ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <>
      {/* Rating Icon - Click to Open Modal */}
      <TouchableOpacity
        style={[
          styles.ratingIconButton,
          { backgroundColor: isDark ? '#78350f' : '#fef3c7' },
        ]}
        onPress={() => setShowRatingModal(true)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.ratingBadge,
            { backgroundColor: isDark ? '#92400e' : '#ffffff' },
          ]}
        >
          <Icon name="star" size={12} color="#fbbf24" />
          <Text
            style={[
              styles.ratingBadgeText,
              { color: isDark ? '#FFFFFF' : '#92400e' },
            ]}
          >
            {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
          </Text>
        </View>
        <Text
          style={[
            styles.ratingCountText,
            { color: isDark ? '#FEF3C7' : '#78350f' },
          ]}
        >
          {ratingStats?.totalReviews || 0} reviews
        </Text>
      </TouchableOpacity>

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? '#1E293B' : 'white' },
            ]}
          >
            {/* Header */}
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: isDark ? '#334155' : '#f3f4f6' },
              ]}
            >
              <Text
                style={[
                  styles.modalTitle,
                  { color: isDark ? '#F1F5F9' : '#1f2937' },
                ]}
              >
                Ratings & Reviews
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowRatingModal(false);
                  setShowRatingForm(false);
                }}
                style={[
                  styles.modalCloseButton,
                  { backgroundColor: isDark ? '#334155' : '#f3f4f6' },
                ]}
              >
                <Icon
                  name="close"
                  size={24}
                  color={isDark ? '#CBD5E1' : '#6b7280'}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {/* Write Review Button */}
              {!showRatingForm && (
                <TouchableOpacity
                  style={[
                    styles.writeReviewButton,
                    { backgroundColor: '#3b82f6' },
                  ]}
                  onPress={() => setShowRatingForm(true)}
                >
                  <Icon name="create-outline" size={20} color="white" />
                  <Text style={styles.writeReviewButtonText}>
                    {userReview ? 'Edit Your Review' : 'Write a Review'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Rating Form */}
              {showRatingForm && renderRatingForm()}

              {/* Delete Review Button */}
              {userReview && !showRatingForm && (
                <TouchableOpacity
                  style={[
                    styles.deleteReviewButton,
                    { backgroundColor: isDark ? '#991b1b' : '#fee2e2' },
                  ]}
                  onPress={handleDelete}
                  disabled={loadingDelete}
                >
                  {loadingDelete ? (
                    <ActivityIndicator
                      size="small"
                      color={isDark ? '#fecaca' : '#dc2626'}
                    />
                  ) : (
                    <>
                      <Icon
                        name="trash-outline"
                        size={20}
                        color={isDark ? '#fecaca' : '#dc2626'}
                      />
                      <Text
                        style={[
                          styles.deleteReviewButtonText,
                          { color: isDark ? '#fecaca' : '#dc2626' },
                        ]}
                      >
                        Delete My Review
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Rating Summary */}
              <View style={styles.ratingSummary}>
                <View style={styles.overallRating}>
                  <Text
                    style={[
                      styles.overallRatingNumber,
                      { color: isDark ? '#F1F5F9' : '#1f2937' },
                    ]}
                  >
                    {averageRating.toFixed(1)}
                  </Text>
                  <View style={styles.overallRatingStars}>
                    {renderStars(averageRating, 20)}
                    <Text
                      style={[
                        styles.totalReviewsText,
                        { color: isDark ? '#94A3B8' : '#6b7280' },
                      ]}
                    >
                      {ratingStats?.totalReviews || 0} reviews
                    </Text>
                  </View>
                </View>

                {/* Rating Distribution */}
                {ratingStats?.distribution && (
                  <View style={styles.ratingDistribution}>
                    {ratingStats.distribution.map((count, index) => {
                      const starNumber = 5 - index;
                      const percentage =
                        ratingStats.totalReviews > 0
                          ? (count / ratingStats.totalReviews) * 100
                          : 0;

                      return (
                        <View key={starNumber} style={styles.ratingBarRow}>
                          <Text
                            style={[
                              styles.starLabel,
                              { color: isDark ? '#94A3B8' : '#6b7280' },
                            ]}
                          >
                            {starNumber} star
                          </Text>
                          <View
                            style={[
                              styles.ratingBarContainer,
                              {
                                backgroundColor: isDark ? '#334155' : '#e5e7eb',
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.ratingBar,
                                { width: `${percentage}%` },
                              ]}
                            />
                          </View>
                          <Text
                            style={[
                              styles.ratingCount,
                              { color: isDark ? '#94A3B8' : '#6b7280' },
                            ]}
                          >
                            {count}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <View style={styles.reviewsSection}>
                  <Text
                    style={[
                      styles.reviewsTitle,
                      { color: isDark ? '#F1F5F9' : '#1f2937' },
                    ]}
                  >
                    Customer Reviews
                  </Text>
                  {reviews.map(review => (
                    <View
                      key={review._id}
                      style={[
                        styles.reviewCard,
                        { backgroundColor: isDark ? '#0F172A' : '#f9fafb' },
                      ]}
                    >
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewerInfo}>
                          <Text
                            style={[
                              styles.reviewerName,
                              { color: isDark ? '#F1F5F9' : '#1f2937' },
                            ]}
                          >
                            {review.userId?.name || 'Anonymous'}
                          </Text>
                          <View style={styles.reviewMeta}>
                            {renderStars(review.rating, 14)}
                            <Text
                              style={[
                                styles.reviewDate,
                                { color: isDark ? '#94A3B8' : '#6b7280' },
                              ]}
                            >
                              {new Date(review.createdAt).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {review.review && (
                        <Text
                          style={[
                            styles.reviewText,
                            { color: isDark ? '#CBD5E1' : '#4b5563' },
                          ]}
                        >
                          {review.review}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noReviews}>
                  <Icon
                    name="chatbubble-outline"
                    size={48}
                    color={isDark ? '#475569' : '#d1d5db'}
                  />
                  <Text
                    style={[
                      styles.noReviewsText,
                      { color: isDark ? '#94A3B8' : '#6b7280' },
                    ]}
                  >
                    No reviews yet
                  </Text>
                  <Text
                    style={[
                      styles.noReviewsSubText,
                      { color: isDark ? '#64748B' : '#9ca3af' },
                    ]}
                  >
                    Be the first to review this product
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  userId,
  showSocialButtons = true,
}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark } = useTheme();

  if (!product || !product.fullProduct || !product.fullProduct._id) {
    return null;
  }

  const fullProduct = product.fullProduct;
  const productId = product.productId || fullProduct._id;
  const media = getProductMedia(product);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // DIRECTLY USE VALUES FROM BACKEND - NO CALCULATION
  const originalPrice = fullProduct.mrp || 0;
  const sellingPrice = fullProduct.finalPrice || 0;
  const discount = fullProduct.discount || 0;

  const averageRating = fullProduct.averageRating || 0;

  const handleImageClick = () => {
    navigation.navigate('ProductDetail', { id: productId });
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Image Section */}
      <TouchableOpacity
        style={[
          styles.mediaContainer,
          { backgroundColor: isDark ? '#0F172A' : '#f9fafb' },
        ]}
        onPress={handleImageClick}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <CustomMediaViewer media={media} currentIndex={currentMediaIndex} />

        {/* Media Indicator Dots */}
        {media.length > 1 && (
          <View style={styles.dotsContainer}>
            {media.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentMediaIndex
                    ? styles.activeDot
                    : styles.inactiveDot,
                ]}
              />
            ))}
          </View>
        )}
      </TouchableOpacity>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        {/* Brand and Category */}
        <View style={styles.brandRow}>
          {fullProduct.brand && (
            <Text
              style={[
                styles.brandText,
                { color: isDark ? '#7DD3FC' : '#3b82f6' },
              ]}
            >
              {fullProduct.brand}
            </Text>
          )}
          <Text
            style={[
              styles.categoryText,
              { color: isDark ? '#94A3B8' : '#6b7280' },
            ]}
          >
            {fullProduct.subcategory || 'Product'}
          </Text>
        </View>

        {/* Product Title */}
        <Text
          style={[styles.titleText, { color: isDark ? '#F1F5F9' : '#1f2937' }]}
          numberOfLines={2}
        >
          {fullProduct.title}
        </Text>

        {/* Pricing Section */}
        <View style={styles.pricingSection}>
          <View style={styles.priceRow}>
            {/* Discount with Arrow - Only if discount > 0 */}
            {discount > 0 && (
              <View
                style={[
                  styles.discountWithArrow,
                  { backgroundColor: isDark ? '#dc2626' : '#ffffffff' },
                ]}
              >
                <Icon name="arrow-down" size={12} color="#ffffff" />
                <Text style={[styles.discountPercent, { color: '#ffffff' }]}>
                  {discount}%
                </Text>
              </View>
            )}

            {/* Selling Price - Direct from backend */}
            <Text
              style={[
                styles.sellingPrice,
                { color: isDark ? '#FFFFFF' : '#000000' },
              ]}
            >
              ₹{sellingPrice.toLocaleString()}
            </Text>

            {/* Original Price - Only if MRP > sellingPrice */}
            {originalPrice > sellingPrice && (
              <Text
                style={[
                  styles.originalPrice,
                  { color: isDark ? '#94A3B8' : '#9ca3af' },
                ]}
              >
                ₹{originalPrice.toLocaleString()}
              </Text>
            )}
          </View>

          {/* Rating Icon */}
          <View style={styles.ratingContainer}>
            <RatingDisplay
              productId={productId}
              averageRating={averageRating}
            />
          </View>
        </View>

        {/* Description */}
        {fullProduct.description && (
          <Text
            style={[
              styles.descriptionText,
              { color: isDark ? '#94A3B8' : '#6b7280' },
            ]}
            numberOfLines={1}
          >
            {fullProduct.description}
          </Text>
        )}

        {/* Action Bar */}
        {showSocialButtons && (
          <View
            style={[
              styles.actionBar,
              { borderTopColor: isDark ? '#334155' : '#f3f4f6' },
            ]}
          >
            <View style={styles.actionButtons}>
              <LikeComponent productId={productId} />
              <CommentComponent productId={productId} />
              <ShareWithStats productId={productId} title={fullProduct.title} />
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },

  mediaContainer: {
    aspectRatio: 1,
    backgroundColor: '#f9fafb',
    position: 'relative',
    width: '100%',
  },
  mediaViewerContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dotsContainer: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  activeDot: {
    backgroundColor: '#3b82f6',
  },
  inactiveDot: {
    backgroundColor: '#d1d5db',
  },

  contentContainer: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  brandText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3b82f6',
    marginRight: 4,
    textTransform: 'uppercase',
  },
  categoryText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },

  titleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
    lineHeight: 16,
    marginBottom: 6,
  },

  pricingSection: {
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  discountWithArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffffff',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    marginRight: 6,
  },
  discountPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
    marginLeft: 2,
  },
  sellingPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 11,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },

  ratingContainer: {
    marginTop: 2,
  },

  ratingIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    marginRight: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
    marginLeft: 1,
  },
  ratingCountText: {
    fontSize: 9,
    color: '#78350f',
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalCloseButton: {
    padding: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
  },
  modalScrollView: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },
  writeReviewButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  deleteReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },
  deleteReviewButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },

  ratingForm: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  ratingFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8,
  },
  formTextarea: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },

  ratingSummary: {
    marginBottom: 20,
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  overallRatingNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 12,
  },
  overallRatingStars: {
    flex: 1,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  totalReviewsText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 3,
  },

  ratingDistribution: {
    marginTop: 12,
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  starLabel: {
    fontSize: 13,
    color: '#6b7280',
    width: 55,
  },
  ratingBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  ratingBar: {
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 3,
  },
  ratingCount: {
    fontSize: 13,
    color: '#6b7280',
    width: 25,
    textAlign: 'right',
  },

  reviewsSection: {
    marginTop: 12,
  },
  reviewsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  reviewCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 3,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewDate: {
    fontSize: 11,
    color: '#6b7280',
  },
  reviewText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
  },

  noReviews: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noReviewsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 10,
  },
  noReviewsSubText: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 3,
  },

  descriptionText: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 14,
    marginBottom: 8,
  },

  actionBar: {
    borderTopWidth: 0.5,
    borderTopColor: '#f3f4f6',
    paddingTop: 8,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
});

export default ProductCard;
