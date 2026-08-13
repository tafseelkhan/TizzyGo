// components/RatingComponent.tsx - COMPLETE FIXED VERSION (No Emojis, Only Icons)

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
  Dimensions,
  Platform,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../../contexts/theme/ThemeContext';
import { getToken } from '../../../../api/connections/token/tokenSlice';

// Import APIs
import {
  getCurrentUserId,
  fetchRatingStatsAPI,
  fetchReviewsWithUserDataAPI,
  submitReviewAPI,
  deleteReviewAPI,
} from '../../../../api/features/private/RatingGlobalPrivateSlice';

// Types
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

interface RatingComponentProps {
  productId: string;
  onRatingSubmit?: (rating: number, review: string) => Promise<void>;
  initialRating?: number;
  initialReview?: string;
}

// Colors
const lightColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  border: '#E2E8F0',
  primary: '#6366F1',
  secondary: '#64748B',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  muted: '#94A3B8',
  shadow: 'rgba(99, 102, 241, 0.1)',
};

const darkColors = {
  background: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  border: '#334155',
  primary: '#818CF8',
  secondary: '#94A3B8',
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  muted: '#64748B',
  shadow: 'rgba(99, 102, 241, 0.2)',
};

// Import UI components
import RatingSummary from './ReviewSummaryGlobal';
import ReviewList from './ReviewListGlobal';
import ReviewForm from './ReviewFormGlobal';

const { width } = Dimensions.get('window');

export default function RatingComponent({
  productId,
  onRatingSubmit,
}: RatingComponentProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
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
  const scrollViewRef = useRef<ScrollView>(null);

  // ============ SNACKBAR STATE ============
  const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const snackbarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSnackbar = (message: string) => {
    if (snackbarTimeoutRef.current) {
      clearTimeout(snackbarTimeoutRef.current);
      snackbarTimeoutRef.current = null;
    }

    setSnackbarMessage(message);
    setSnackbarVisible(true);

    snackbarTimeoutRef.current = setTimeout(() => {
      setSnackbarVisible(false);
      setSnackbarMessage('');
      snackbarTimeoutRef.current = null;
    }, 3000);
  };

  const hideSnackbar = () => {
    if (snackbarTimeoutRef.current) {
      clearTimeout(snackbarTimeoutRef.current);
      snackbarTimeoutRef.current = null;
    }
    setSnackbarVisible(false);
    setSnackbarMessage('');
  };

  useEffect(() => {
    return () => {
      if (snackbarTimeoutRef.current) {
        clearTimeout(snackbarTimeoutRef.current);
        snackbarTimeoutRef.current = null;
      }
    };
  }, []);

  // ============ GET CURRENT USER ID ============
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userId = await getCurrentUserId();
        console.log('✅ Current User ID fetched:', userId);
        setCurrentUserId(userId);
      } catch (err) {
        console.error('❌ Error fetching user ID:', err);
      }
    };
    fetchUserId();
  }, []);

  // ============ FETCH RATING STATS ============
  useEffect(() => {
    const fetchStats = async () => {
      if (!productId) {
        console.warn('⚠️ No productId provided to RatingComponent');
        return;
      }

      console.log('📊 Fetching rating stats for product:', productId);
      setLoadingStats(true);
      setError(null);

      try {
        console.log(
          '📤 Calling fetchRatingStatsAPI with productId:',
          productId,
        );

        const statsData = await fetchRatingStatsAPI(productId);

        console.log(
          '📥 Raw response from API:',
          JSON.stringify(statsData, null, 2),
        );
        console.log('📊 Stats data type:', typeof statsData);

        if (!statsData) {
          console.error('❌ Stats data is null or undefined');
          const defaultStats: RatingStats = {
            totalRatings: 0,
            averageRating: '0.0',
            percentage: '0%',
            distribution: [0, 0, 0, 0, 0],
            totalReviews: 0,
          };
          setStats(defaultStats);
          return;
        }

        const mappedStats: RatingStats = {
          totalRatings:
            Number(statsData.totalRatings) ||
            Number((statsData as any).total_ratings) ||
            Number(statsData.totalReviews) ||
            0,
          averageRating: String(
            statsData.averageRating ||
              (statsData as any).avgRating ||
              (statsData as any).average_rating ||
              '0.0',
          ),
          percentage: String(
            statsData.percentage ||
              (statsData as any).percent ||
              (statsData as any).rating_percentage ||
              '0%',
          ),
          distribution: Array.isArray(statsData.distribution)
            ? statsData.distribution
            : Array.isArray((statsData as any).rating_distribution)
              ? (statsData as any).rating_distribution
              : [0, 0, 0, 0, 0],
          totalReviews:
            Number(statsData.totalReviews) ||
            Number((statsData as any).total_reviews) ||
            Number((statsData as any).reviewCount) ||
            0,
        };

        console.log('✅ Mapped stats:', mappedStats);
        console.log('✅ Average Rating:', mappedStats.averageRating);
        console.log('✅ Total Reviews:', mappedStats.totalReviews);

        setStats(mappedStats);
        setError(null);
      } catch (err: any) {
        console.error('❌ ERROR in fetchStats:', err);
        console.error('❌ Error message:', err.message);
        console.error('❌ Error stack:', err.stack);

        if (err.response) {
          console.error('❌ Error response status:', err.response.status);
          console.error(
            '❌ Error response data:',
            JSON.stringify(err.response.data, null, 2),
          );
        }

        console.log('📊 Using default stats due to error');
        const defaultStats: RatingStats = {
          totalRatings: 0,
          averageRating: '0.0',
          percentage: '0%',
          distribution: [0, 0, 0, 0, 0],
          totalReviews: 0,
        };
        setStats(defaultStats);
        setError(null);
      } finally {
        setLoadingStats(false);
        console.log('🏁 fetchStats completed');
      }
    };

    fetchStats();
  }, [productId]);

  // ============ FETCH REVIEWS ============
  useEffect(() => {
    if (!openReviewDialog) return;

    const fetchReviews = async () => {
      console.log('📚 Fetching reviews for product:', productId, 'page:', page);
      setLoadingReviews(true);
      try {
        const fetchedReviews = await fetchReviewsWithUserDataAPI(
          productId,
          page,
        );
        console.log('✅ Reviews fetched:', fetchedReviews?.length || 0);
        setReviews(fetchedReviews || []);

        if (currentUserId && fetchedReviews) {
          const currentReview = fetchedReviews.find(
            (r: Review) => r.userId?._id === currentUserId,
          );
          if (currentReview) {
            setUserRating({
              _id: currentReview._id,
              rating: currentReview.rating,
              review: currentReview.review,
              images: currentReview.images || [],
            });
          } else {
            setUserRating(null);
          }
        }
      } catch (err: any) {
        console.error('❌ Error fetching reviews:', err);
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [openReviewDialog, page, productId, currentUserId]);

  // ============ HANDLERS ============
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

  const handleSubmit = async (submitData: any, reviewId?: string) => {
    setLoadingSubmit(true);
    try {
      if (onRatingSubmit) {
        await onRatingSubmit(submitData.rating, submitData.review);
      }

      const completeSubmitData = {
        ...submitData,
        productId: submitData.productId || productId,
      };

      await submitReviewAPI(completeSubmitData, reviewId);

      const updatedReviews = await fetchReviewsWithUserDataAPI(productId, 1);
      setReviews(updatedReviews || []);

      if (currentUserId && updatedReviews) {
        const currentReview = updatedReviews.find(
          (r: Review) => r.userId?._id === currentUserId,
        );
        if (currentReview) {
          setUserRating({
            _id: currentReview._id,
            rating: currentReview.rating,
            review: currentReview.review,
            images: currentReview.images || [],
          });
        } else {
          setUserRating(null);
        }
      }

      try {
        const statsData = await fetchRatingStatsAPI(productId);
        if (statsData) {
          const mappedStats: RatingStats = {
            totalRatings: Number(statsData.totalRatings) || 0,
            averageRating: String(statsData.averageRating || '0.0'),
            percentage: String(statsData.percentage || '0%'),
            distribution: Array.isArray(statsData.distribution)
              ? statsData.distribution
              : [0, 0, 0, 0, 0],
            totalReviews: Number(statsData.totalReviews) || 0,
          };
          setStats(mappedStats);
        }
      } catch (statsErr) {
        console.warn('⚠️ Could not refresh stats:', statsErr);
      }

      handleCancel();
      setError(null);

      // ✅ FIX: Removed emoji, using icon instead
      Alert.alert(
        'Success',
        reviewId
          ? 'Review updated successfully!'
          : 'Review submitted successfully!',
        [{ text: 'OK' }],
      );
    } catch (err: any) {
      console.error('❌ Error submitting review:', err);
      showSnackbar(err.message || 'Failed to submit review');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDelete = useCallback(
    async (reviewId: string) => {
      setLoadingDelete(true);
      try {
        const token = await getToken();
        if (!token) {
          showSnackbar('Please login to delete a review');
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
                  await deleteReviewAPI(reviewId);

                  setReviews(prevReviews =>
                    (prevReviews || []).filter(r => r._id !== reviewId),
                  );
                  if (userRating && userRating._id === reviewId) {
                    setUserRating(null);
                  }
                  setShowReviewForm(false);

                  try {
                    const statsData = await fetchRatingStatsAPI(productId);
                    if (statsData) {
                      const mappedStats: RatingStats = {
                        totalRatings: Number(statsData.totalRatings) || 0,
                        averageRating: String(statsData.averageRating || '0.0'),
                        percentage: String(statsData.percentage || '0%'),
                        distribution: Array.isArray(statsData.distribution)
                          ? statsData.distribution
                          : [0, 0, 0, 0, 0],
                        totalReviews: Number(statsData.totalReviews) || 0,
                      };
                      setStats(mappedStats);
                    }
                  } catch (statsErr) {
                    console.warn('⚠️ Could not refresh stats:', statsErr);
                  }

                  setError(null);
                  // ✅ FIX: Removed emoji, using icon instead
                  Alert.alert('Deleted', 'Review deleted successfully!');
                } catch (deleteError) {
                  console.error('❌ Error deleting review:', deleteError);
                  showSnackbar('Failed to delete review');
                }
              },
            },
          ],
        );
      } catch (err: any) {
        console.error('❌ Error in delete process:', err);
        showSnackbar(err.message || 'Failed to delete review');
      } finally {
        setLoadingDelete(false);
      }
    },
    [productId, userRating],
  );

  // ✅ FIX: Removed emojis from button text
  const buttonText = userRating
    ? 'Edit Your Review'
    : (reviews || []).length > 0
      ? 'View Reviews'
      : 'Rate & Review';

  // ============ RENDER ============
  return (
    <View style={styles.container}>
      {/* Star Button */}
      <TouchableOpacity
        onPress={() => setOpenReviewDialog(true)}
        style={styles.starButton}
        activeOpacity={0.9}
      >
        <View style={styles.starWrapper}>
          <Image
            source={require('../../../../assets/images/star-logo.png')}
            style={styles.starImage}
            resizeMode="contain"
          />
          <View style={styles.starBadge}>
            <Text style={styles.starBadgeText}>
              {stats?.averageRating || '0'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Review Modal */}
      <Modal
        visible={openReviewDialog}
        animationType="slide"
        onRequestClose={() => setOpenReviewDialog(false)}
        statusBarTranslucent
      >
        <SafeAreaView
          style={[styles.safeArea, { backgroundColor: colors.background }]}
          edges={['top', 'bottom']}
        >
          {/* Header */}
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: colors.card,
                borderBottomColor: colors.border,
                paddingTop: insets.top || 12,
              },
            ]}
          >
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => setOpenReviewDialog(false)}
                style={styles.backButton}
              >
                <Icon name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Reviews
              </Text>
            </View>
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
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 20 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Rating Summary */}
            <View style={styles.ratingSummaryContainer}>
              {loadingStats ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : stats ? (
                <RatingSummary stats={stats} />
              ) : (
                <Text style={[styles.noDataText, { color: colors.text }]}>
                  No ratings yet
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                onPress={handlePlaceholderClick}
                disabled={
                  loadingStats ||
                  loadingReviews ||
                  loadingSubmit ||
                  loadingDelete
                }
                style={[
                  styles.primaryActionButton,
                  {
                    backgroundColor: colors.primary,
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
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <MaterialIcon name="rate-review" size={20} color="white" />
                    <Text style={styles.primaryActionText}>{buttonText}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Review Form */}
            {showReviewForm && (
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
            ) : (reviews || []).length > 0 ? (
              <ReviewList
                reviews={reviews || []}
                currentUserId={currentUserId}
                handleDelete={handleDelete}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Icon
                  name="chatbubble-outline"
                  size={64}
                  color={colors.border}
                />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No Reviews Yet
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.muted }]}>
                  Be the first to review this product!
                </Text>
              </View>
            )}

            {/* Pagination */}
            {!loadingReviews && (reviews || []).length > 0 && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  onPress={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loadingReviews}
                  style={[
                    styles.paginationButton,
                    {
                      backgroundColor:
                        page === 1 ? colors.border : colors.primary,
                      opacity: page === 1 || loadingReviews ? 0.5 : 1,
                    },
                  ]}
                >
                  <Text style={styles.paginationButtonText}>Previous</Text>
                </TouchableOpacity>

                <View
                  style={[
                    styles.pageIndicator,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.pageIndicatorText}>{page}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setPage(p => p + 1)}
                  disabled={(reviews || []).length < 10 || loadingReviews}
                  style={[
                    styles.paginationButton,
                    {
                      backgroundColor:
                        (reviews || []).length < 10
                          ? colors.border
                          : colors.primary,
                      opacity:
                        (reviews || []).length < 10 || loadingReviews ? 0.5 : 1,
                    },
                  ]}
                >
                  <Text style={styles.paginationButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ============ SNACKBAR AS FLOATING OVERLAY ============ */}
      {snackbarVisible && (
        <View
          style={[
            styles.snackbarContainer,
            {
              bottom: insets.bottom + 20,
              left: insets.left + 20,
              right: insets.right + 20,
            },
          ]}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.snackbar,
              {
                backgroundColor: colors.error,
              },
            ]}
          >
            <Text style={styles.snackbarText}>
              {snackbarMessage || 'Something went wrong'}
            </Text>
            <TouchableOpacity
              onPress={hideSnackbar}
              style={styles.snackbarClose}
            >
              <Icon name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    // Empty container - no layout constraints
  },
  safeArea: {
    flex: 1,
  },
  // Star Button
  starButton: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 36,
  },
  starWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starImage: {
    width: 48,
    height: 48,
  },
  starBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  starBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Modal Header
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
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
    marginBottom: 20,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
  },
  actionContainer: {
    marginBottom: 20,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  paginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  paginationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  pageIndicator: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  pageIndicatorText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // ============ SNACKBAR STYLES ============
  snackbarContainer: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 9999,
    pointerEvents: 'box-none',
  },
  snackbar: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  snackbarText: {
    color: 'white',
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  snackbarClose: {
    marginLeft: 8,
    padding: 4,
  },
});
