// hooks/useRating.ts
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { ratingService } from '../services/home/ratingService';
import {
  RatingStats,
  Review,
} from '../../api/features/private/productRatingReviewStatesPrivateSlice';

interface UseRatingProps {
  productId: string;
  averageRating: number;
}

interface UseRatingReturn {
  // State
  showRatingModal: boolean;
  ratingStats: RatingStats | null;
  reviews: Review[];
  userReview: Review | null;
  loadingSubmit: boolean;
  loadingDelete: boolean;
  showRatingForm: boolean;

  // Handlers
  setShowRatingModal: (show: boolean) => void;
  setShowRatingForm: (show: boolean) => void;
  fetchRatingData: () => Promise<void>;
  handleSubmit: (formData: {
    rating: number;
    review: string;
    images: any[];
  }) => Promise<void>;
  handleDelete: () => Promise<void>;
  closeModal: () => void;
}

export const useRating = ({
  productId,
  averageRating,
}: UseRatingProps): UseRatingReturn => {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);

  const fetchRatingData = useCallback(async () => {
    const {
      stats,
      reviews: fetchedReviews,
      userReview: fetchedUserReview,
    } = await ratingService.getRatingData(productId);

    setRatingStats(stats);
    setReviews(fetchedReviews);
    setUserReview(fetchedUserReview);
  }, [productId]);

  // Fetch data when modal opens
  useEffect(() => {
    if (showRatingModal) {
      fetchRatingData();
    }
  }, [showRatingModal, fetchRatingData]);

  const handleSubmit = useCallback(
    async (formData: { rating: number; review: string; images: any[] }) => {
      if (formData.rating === 0) {
        Alert.alert('Error', 'Please select a rating');
        return;
      }

      setLoadingSubmit(true);
      try {
        const success = await ratingService.submitReview(
          {
            productId,
            rating: formData.rating,
            review: formData.review,
            images: formData.images,
          },
          userReview?._id,
        );

        if (success) {
          await fetchRatingData();
          setShowRatingForm(false);
          Alert.alert(
            'Success',
            userReview ? 'Review updated!' : 'Review submitted!',
          );
        }
      } catch (err: any) {
        Alert.alert(
          'Error',
          err.response?.data?.error || 'Failed to submit review',
        );
      } finally {
        setLoadingSubmit(false);
      }
    },
    [productId, userReview, fetchRatingData],
  );

  const handleDelete = useCallback(async () => {
    if (!userReview) return;

    setLoadingDelete(true);
    try {
      const success = await ratingService.deleteReview(userReview._id);
      if (success) {
        await fetchRatingData();
        setUserReview(null);
        Alert.alert('Success', 'Review deleted successfully!');
      }
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.error || 'Failed to delete review',
      );
    } finally {
      setLoadingDelete(false);
    }
  }, [userReview, fetchRatingData]);

  const closeModal = useCallback(() => {
    setShowRatingModal(false);
    setShowRatingForm(false);
  }, []);

  return {
    showRatingModal,
    ratingStats,
    reviews,
    userReview,
    loadingSubmit,
    loadingDelete,
    showRatingForm,
    setShowRatingModal,
    setShowRatingForm,
    fetchRatingData,
    handleSubmit,
    handleDelete,
    closeModal,
  };
};
