// components/RatingDisplay.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../../contexts/theme/ThemeContext';
import { useRating } from '../../../../hooks/useRating';
import { ratingService } from '../../../../services/home/ratingService';

interface RatingDisplayProps {
  productId: string;
  averageRating: number;
}

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

const RatingDisplay: React.FC<RatingDisplayProps> = ({
  productId,
  averageRating,
}) => {
  const { isDark } = useTheme();
  const {
    showRatingModal,
    ratingStats,
    reviews,
    userReview,
    loadingSubmit,
    loadingDelete,
    showRatingForm,
    setShowRatingModal,
    setShowRatingForm,
    handleSubmit,
    handleDelete,
    closeModal,
  } = useRating({ productId, averageRating });

  const [rating, setRating] = React.useState(userReview?.rating || 0);
  const [reviewText, setReviewText] = React.useState(userReview?.review || '');
  const [images, setImages] = React.useState<any[]>(userReview?.images || []);

  const onSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    await handleSubmit({ rating, review: reviewText, images });
  };

  const onDelete = async () => {
    await handleDelete();
  };

  const totalReviews = ratingService.getTotalReviews(ratingStats);
  const distribution = ratingService.calculateRatingDistribution(ratingStats);

  const renderRatingForm = () => (
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
          style={[styles.formLabel, { color: isDark ? '#CBD5E1' : '#4b5563' }]}
        >
          Rating
        </Text>
        {renderStars(rating, 24, true, setRating)}
      </View>
      <View style={styles.formGroup}>
        <Text
          style={[styles.formLabel, { color: isDark ? '#CBD5E1' : '#4b5563' }]}
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

  return (
    <>
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
          {totalReviews} reviews
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showRatingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? '#1E293B' : 'white' },
            ]}
          >
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
                onPress={closeModal}
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

              {showRatingForm && renderRatingForm()}

              {userReview && !showRatingForm && (
                <TouchableOpacity
                  style={[
                    styles.deleteReviewButton,
                    { backgroundColor: isDark ? '#991b1b' : '#fee2e2' },
                  ]}
                  onPress={onDelete}
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
                      {totalReviews} reviews
                    </Text>
                  </View>
                </View>

                {distribution && (
                  <View style={styles.ratingDistribution}>
                    {distribution.map((count, index) => {
                      const starNumber = 5 - index;
                      const percentage = ratingService.getPercentageForStar(
                        ratingStats,
                        index,
                      );
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

// Styles remain same as original RatingDisplay styles
const styles = StyleSheet.create({
  starsRow: { flexDirection: 'row', gap: 2 },
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
  ratingCountText: { fontSize: 9, color: '#78350f', fontWeight: '600' },
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
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalCloseButton: { padding: 4, borderRadius: 20 },
  modalScrollView: { paddingHorizontal: 20, paddingVertical: 16 },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },
  writeReviewButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  deleteReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },
  deleteReviewButtonText: { fontSize: 14, fontWeight: '600' },
  ratingForm: { padding: 16, borderRadius: 12, marginBottom: 20 },
  ratingFormTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  formTextarea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { fontSize: 14, fontWeight: '500' },
  submitButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: 'white', fontSize: 14, fontWeight: '500' },
  ratingSummary: { marginBottom: 20 },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  overallRatingNumber: { fontSize: 40, fontWeight: 'bold', marginRight: 12 },
  overallRatingStars: { flex: 1 },
  totalReviewsText: { fontSize: 13, marginTop: 3 },
  ratingDistribution: { marginTop: 12 },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  starLabel: { fontSize: 13, width: 55 },
  ratingBarContainer: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  ratingBar: { height: '100%', backgroundColor: '#fbbf24', borderRadius: 3 },
  ratingCount: { fontSize: 13, width: 25, textAlign: 'right' },
  reviewsSection: { marginTop: 12 },
  reviewsTitle: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  reviewCard: { borderRadius: 10, padding: 12, marginBottom: 10 },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reviewerInfo: { flex: 1 },
  reviewerName: { fontSize: 13, fontWeight: '600', marginBottom: 3 },
  reviewMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewDate: { fontSize: 11 },
  reviewText: { fontSize: 13, lineHeight: 18 },
  noReviews: { alignItems: 'center', paddingVertical: 30 },
  noReviewsText: { fontSize: 15, fontWeight: '600', marginTop: 10 },
  noReviewsSubText: { fontSize: 13, marginTop: 3 },
});

export default RatingDisplay;
