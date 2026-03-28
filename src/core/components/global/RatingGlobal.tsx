// components/RatingComponent.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  Text,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../contexts/theme/ThemeContext';

// Types
interface JwtPayload {
  userId?: string;
  _id?: string;
  id?: string;
}

interface RatingStats {
  totalRatings: number;
  averageRating: string;
  percentage: string;
  distribution: number[];
  totalReviews: number;
}

interface ReviewImage {
  url: string;
  publicId: string;
}

interface User {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
}

interface Review {
  _id: string;
  userId: User;
  rating: number;
  review: string;
  images: ReviewImage[];
  createdAt: string;
  updatedAt: string;
}

interface UserRating {
  _id: string;
  rating: number;
  review: string;
  images: ReviewImage[];
}

// ✅ FIXED: Added missing props
interface RatingComponentProps {
  productId: string;
  onRatingSubmit?: (rating: number, review: string) => Promise<void>;
  initialRating?: number;
  initialReview?: string;
}

const lightColors = {
  background: '#FFFFFF',
  card: '#F8F9FA',
  text: '#1E293B',
  border: '#E2E8F0',
  primary: '#3B82F6',
  secondary: '#64748B',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  muted: '#94A3B8',
};

const darkColors = {
  background: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  border: '#334155',
  primary: '#60A5FA',
  secondary: '#94A3B8',
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  muted: '#64748B',
};

// Import components
import RatingSummary from './ReviewSummaryGlobal';
import ReviewList from './ReviewListGlobal';
import ReviewForm from './ReviewFormGlobal';
import * as api from '../../services/GlobalService';

// ✅ FIXED: Added new props with defaults
export default function RatingComponent({
  productId,
  onRatingSubmit,
  initialRating = 0,
  initialReview = '',
}: RatingComponentProps) {
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;

  const [stats, setStats] = useState<RatingStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userRating, setUserRating] = useState<UserRating | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [openReviewDialog, setOpenReviewDialog] = useState<boolean>(false);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false);
  const [loadingDelete, setLoadingDelete] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Get current user ID from authToken
  useEffect(() => {
    const getAuthToken = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const decoded = jwtDecode<JwtPayload>(token);
          const userId = decoded.userId || decoded._id || decoded.id;

          if (userId) {
            setCurrentUserId(userId);
          } else {
            setCurrentUserId(null);
          }
        }
      } catch (err) {
        console.error('❌ JWT Decode Error:', err);
        setError('Failed to authenticate user');
        setSnackbarOpen(true);
      }
    };
    getAuthToken();
  }, []);

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const statsData = await api.fetchStats(productId);

        const transformedStats: RatingStats = {
          totalRatings: statsData.totalRatings || 0,
          averageRating: statsData.averageRating?.toString() || '0',
          percentage: statsData.percentage || '0',
          distribution: statsData.distribution || [0, 0, 0, 0, 0],
          totalReviews: statsData.totalReviews || 0,
        };
        setStats(transformedStats);
      } catch (err: any) {
        console.error('❌ Error fetching stats:', err);
        setError('Failed to load rating statistics');
        setSnackbarOpen(true);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [productId]);

  // Fetch reviews and user data when dialog opens
  useEffect(() => {
    if (!openReviewDialog) return;

    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const fetchedReviews = await api.fetchReviewsWithUserData(
          productId,
          page,
        );
        setReviews(fetchedReviews);

        // Find current user's review if exists
        if (currentUserId) {
          const currentReview = fetchedReviews.find(
            (r: Review) => r.userId._id === currentUserId,
          );
          if (currentReview) {
            setUserRating({
              _id: currentReview._id,
              rating: currentReview.rating,
              review: currentReview.review,
              images: currentReview.images,
            });
          } else {
            setUserRating(null);
          }
        }
      } catch (err: any) {
        console.error('❌ Error fetching reviews:', err);
        setError('Failed to load reviews. Please try again.');
        setSnackbarOpen(true);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [openReviewDialog, page, productId, currentUserId]);

  const handlePlaceholderClick = () => {
    setShowReviewForm(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleCancel = () => {
    setShowReviewForm(false);
    setError(null);
  };

  // ✅ FIXED: Modified handleSubmit to call onRatingSubmit prop
  const handleSubmit = async (submitData: any, reviewId?: string) => {
    setLoadingSubmit(true);
    try {
      // ✅ Call the parent's onRatingSubmit if provided
      if (onRatingSubmit) {
        await onRatingSubmit(submitData.rating, submitData.review);
      }

      const token = await api.getTokenFromStorage();
      if (!token) {
        setError('Please login to submit a review');
        setSnackbarOpen(true);
        return;
      }

      const completeSubmitData = {
        ...submitData,
        productId: submitData.productId || productId,
      };

      await api.submitReview(completeSubmitData, reviewId);

      // Refresh reviews
      const updatedReviews = await api.fetchReviewsWithUserData(productId, 1);
      setReviews(updatedReviews);

      // Update user rating
      if (currentUserId) {
        const currentReview = updatedReviews.find(
          (r: Review) => r.userId._id === currentUserId,
        );
        if (currentReview) {
          setUserRating({
            _id: currentReview._id,
            rating: currentReview.rating,
            review: currentReview.review,
            images: currentReview.images,
          });
        } else {
          setUserRating(null);
        }
      }

      // Refresh stats
      const statsData = await api.fetchStats(productId);
      const transformedStats: RatingStats = {
        totalRatings: statsData.totalRatings || 0,
        averageRating: statsData.averageRating?.toString() || '0',
        percentage: statsData.percentage || '0',
        distribution: statsData.distribution || [0, 0, 0, 0, 0],
        totalReviews: statsData.totalReviews || 0,
      };
      setStats(transformedStats);

      // Reset form
      handleCancel();
      setError(null);

      Alert.alert(
        'Success',
        reviewId
          ? 'Review updated successfully!'
          : 'Review submitted successfully!',
        [{ text: 'OK' }],
      );
    } catch (err: any) {
      console.error('❌ Error submitting review:', err);
      const errorMessage =
        err.response?.data?.error || err.message || 'Failed to submit review';
      setError(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDelete = useCallback(
    async (reviewId: string) => {
      setLoadingDelete(true);
      try {
        const token = await api.getTokenFromStorage();
        if (!token) {
          setError('Please login to delete a review');
          setSnackbarOpen(true);
          return;
        }

        Alert.alert(
          'Delete Review',
          'Are you sure you want to delete this review?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  await api.deleteReview(reviewId);

                  setReviews(prevReviews =>
                    prevReviews.filter(r => r._id !== reviewId),
                  );
                  if (userRating && userRating._id === reviewId) {
                    setUserRating(null);
                  }
                  setShowReviewForm(false);

                  const statsData = await api.fetchStats(productId);
                  const transformedStats: RatingStats = {
                    totalRatings: statsData.totalRatings || 0,
                    averageRating: statsData.averageRating?.toString() || '0',
                    percentage: statsData.percentage || '0',
                    distribution: statsData.distribution || [0, 0, 0, 0, 0],
                    totalReviews: statsData.totalReviews || 0,
                  };
                  setStats(transformedStats);

                  setError(null);
                  Alert.alert('Success', 'Review deleted successfully!');
                } catch (deleteError) {
                  console.error('❌ Error deleting review:', deleteError);
                  setError('Failed to delete review');
                  setSnackbarOpen(true);
                }
              },
            },
          ],
        );
      } catch (err: any) {
        console.error('❌ Error in delete process:', err);
        const errorMessage =
          err.response?.data?.error || err.message || 'Failed to delete review';
        setError(errorMessage);
        setSnackbarOpen(true);
      } finally {
        setLoadingDelete(false);
      }
    },
    [productId, userRating],
  );

  const hideSnackbar = () => {
    setSnackbarOpen(false);
    setError(null);
  };

  const buttonText = userRating
    ? 'View Your Review'
    : reviews.length > 0
    ? 'View Reviews'
    : 'Rate & Review';

  return (
    <View style={styles.container}>
      {/* Star Button to Open Modal */}
      <TouchableOpacity
        onPress={() => setOpenReviewDialog(true)}
        style={styles.starButton}
      >
        <Image
          source={require('../../../assets/images/star-logo.png')}
          style={styles.starImage}
        />
      </TouchableOpacity>

      {/* Review List Modal */}
      <Modal
        visible={openReviewDialog}
        animationType="slide"
        onRequestClose={() => setOpenReviewDialog(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: colors.card,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Customer Reviews
            </Text>
            <TouchableOpacity
              onPress={() => setOpenReviewDialog(false)}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Rating Summary */}
            <View style={styles.ratingSummaryContainer}>
              {loadingStats ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : stats ? (
                <RatingSummary stats={stats} />
              ) : (
                <Text
                  style={[
                    styles.noDataText,
                    { color: colors.text, opacity: 0.8 },
                  ]}
                >
                  No rating statistics available
                </Text>
              )}
            </View>

            {/* Rate & Review Button */}
            <TouchableOpacity
              onPress={handlePlaceholderClick}
              disabled={
                loadingStats || loadingReviews || loadingSubmit || loadingDelete
              }
              style={[
                styles.reviewButton,
                {
                  borderColor: colors.primary,
                  backgroundColor: colors.card,
                  opacity:
                    loadingStats ||
                    loadingReviews ||
                    loadingSubmit ||
                    loadingDelete
                      ? 0.6
                      : 1,
                },
              ]}
            >
              {loadingStats ||
              loadingReviews ||
              loadingSubmit ||
              loadingDelete ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <MaterialIcon
                    name="star-border"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.reviewButtonText, { color: colors.primary }]}
                  >
                    {buttonText}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Placeholder or Form */}
            {!showReviewForm ? (
              <TouchableOpacity
                onPress={handlePlaceholderClick}
                style={[
                  styles.placeholderButton,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Icon name="create-outline" size={20} color={colors.text} />
                <Text style={[styles.placeholderText, { color: colors.text }]}>
                  Add Rating & Review
                </Text>
              </TouchableOpacity>
            ) : (
              <ReviewForm
                handleSubmit={handleSubmit}
                handleCancel={handleCancel}
                loadingSubmit={loadingSubmit}
                productId={productId}
              />
            )}

            {/* Review List */}
            {loadingReviews ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                  Loading reviews...
                </Text>
              </View>
            ) : reviews.length > 0 ? (
              <ReviewList
                reviews={reviews}
                currentUserId={currentUserId}
                handleDelete={handleDelete}
              />
            ) : (
              <View style={styles.noReviewsContainer}>
                <Icon
                  name="chatbubble-outline"
                  size={48}
                  color={colors.border}
                />
                <Text style={[styles.noReviewsText, { color: colors.text }]}>
                  No reviews yet
                </Text>
                <Text
                  style={[
                    styles.noReviewsSubtext,
                    { color: colors.text, opacity: 0.7 },
                  ]}
                >
                  Be the first to review this product!
                </Text>
              </View>
            )}

            {/* Pagination */}
            {!loadingReviews && reviews.length > 0 && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  onPress={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loadingReviews}
                  style={[
                    styles.paginationButton,
                    {
                      borderColor:
                        page === 1 || loadingReviews
                          ? colors.border
                          : colors.primary,
                      backgroundColor:
                        page === 1 || loadingReviews
                          ? colors.card
                          : colors.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.paginationButtonText,
                      {
                        color:
                          page === 1 || loadingReviews
                            ? colors.text
                            : colors.primary,
                        opacity: page === 1 || loadingReviews ? 0.5 : 1,
                      },
                    ]}
                  >
                    Previous
                  </Text>
                </TouchableOpacity>

                <View
                  style={[
                    styles.pageIndicator,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.pageIndicatorText}>Page {page}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setPage(p => p + 1)}
                  disabled={reviews.length < 10 || loadingReviews}
                  style={[
                    styles.paginationButton,
                    {
                      borderColor:
                        reviews.length < 10 || loadingReviews
                          ? colors.border
                          : colors.primary,
                      backgroundColor:
                        reviews.length < 10 || loadingReviews
                          ? colors.card
                          : colors.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.paginationButtonText,
                      {
                        color:
                          reviews.length < 10 || loadingReviews
                            ? colors.text
                            : colors.primary,
                        opacity:
                          reviews.length < 10 || loadingReviews ? 0.5 : 1,
                      },
                    ]}
                  >
                    Next
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Snackbar for errors */}
      {snackbarOpen && (
        <View
          style={[
            styles.snackbar,
            {
              backgroundColor: colors.error,
            },
          ]}
        >
          <Text style={styles.snackbarText}>{error}</Text>
          <TouchableOpacity onPress={hideSnackbar} style={styles.snackbarClose}>
            <Icon name="close" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '100%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  starButton: {
    padding: 10,
  },
  starImage: {
    width: 32,
    height: 32,
  },
  modalContainer: {
    flex: 1,
    paddingTop: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  ratingSummaryContainer: {
    marginVertical: 16,
  },
  noDataText: {
    textAlign: 'center',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  reviewButtonText: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 16,
  },
  placeholderButton: {
    borderWidth: 1,
    borderRadius: 25,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderText: {
    marginLeft: 8,
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  loadingText: {
    marginTop: 12,
  },
  noReviewsContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  noReviewsText: {
    marginTop: 12,
    fontSize: 16,
  },
  noReviewsSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  paginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 6,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pageIndicator: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  pageIndicatorText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  snackbar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  snackbarText: {
    color: 'white',
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  snackbarClose: {
    marginLeft: 8,
  },
});
