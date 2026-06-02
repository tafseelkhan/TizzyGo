// services/ratingService.ts
import {
  ratingAPI,
  RatingStats,
  Review,
  SubmitReviewData,
} from '../../../api/features/private/productRatingReviewStatesPrivateSlice';

class RatingService {
  async getRatingData(productId: string): Promise<{
    stats: RatingStats | null;
    reviews: Review[];
    userReview: Review | null;
  }> {
    const [stats, reviews, userReview] = await Promise.all([
      ratingAPI.getRatingStats(productId),
      ratingAPI.getReviews(productId, 10),
      ratingAPI.getUserReview(productId),
    ]);

    return { stats, reviews, userReview };
  }

  async submitReview(
    data: SubmitReviewData,
    reviewId?: string,
  ): Promise<boolean> {
    return await ratingAPI.submitReview(data, reviewId);
  }

  async deleteReview(reviewId: string): Promise<boolean> {
    return await ratingAPI.deleteReview(reviewId);
  }

  calculateRatingDistribution(stats: RatingStats | null): number[] {
    if (!stats?.distribution) return [0, 0, 0, 0, 0];
    return stats.distribution;
  }

  getAverageRating(stats: RatingStats | null, fallback: number = 0): number {
    return stats?.averageRating || fallback;
  }

  getTotalReviews(stats: RatingStats | null): number {
    return stats?.totalReviews || 0;
  }

  getPercentageForStar(stats: RatingStats | null, starIndex: number): number {
    if (!stats || stats.totalReviews === 0) return 0;
    const count = stats.distribution?.[starIndex] || 0;
    return (count / stats.totalReviews) * 100;
  }
}

export const ratingService = new RatingService();
