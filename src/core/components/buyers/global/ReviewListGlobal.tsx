// components/ReviewList.tsx - REDESIGNED WITH SAFEAREA & MODERN UI

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReviewItem from './ReviewItemGlobal';
import { useTheme } from '../../../contexts/theme/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

// Types
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

interface ReviewListProps {
  reviews: Review[];
  currentUserId: string | null;
  handleDelete: (reviewId: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

// Modern Colors
const lightColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  border: '#E2E8F0',
  primary: '#6366F1',
  error: '#EF4444',
  muted: '#94A3B8',
  shadow: 'rgba(99, 102, 241, 0.1)',
};

const darkColors = {
  background: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  border: '#334155',
  primary: '#818CF8',
  error: '#F87171',
  muted: '#64748B',
  shadow: 'rgba(99, 102, 241, 0.2)',
};

const { width } = Dimensions.get('window');

export default function ReviewList({
  reviews,
  currentUserId,
  handleDelete,
  onRefresh,
  refreshing = false,
  showLoadMore = false,
  onLoadMore,
  loadingMore = false,
}: ReviewListProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = isDark ? darkColors : lightColors;

  // Empty state
  if (reviews.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrapper}>
          <Icon name="chatbubble-outline" size={48} color={colors.muted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No Reviews Yet
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.muted }]}>
          Be the first to share your experience!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingBottom: insets.bottom + 20,
        },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    >
      {/* Review Count Header */}
      <View style={styles.headerContainer}>
        <Text style={[styles.reviewCount, { color: colors.muted }]}>
          {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
        </Text>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      </View>

      {/* Reviews List */}
      <View style={styles.listContainer}>
        {reviews.map((review, index) => (
          <View key={review._id}>
            <ReviewItem
              review={review}
              handleDelete={handleDelete}
              currentUserId={currentUserId}
            />
            {/* Separator between reviews */}
            {index < reviews.length - 1 && (
              <View
                style={[styles.separator, { backgroundColor: colors.border }]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Load More */}
      {showLoadMore && onLoadMore && (
        <View style={styles.loadMoreContainer}>
          {loadingMore ? (
            <View style={styles.loadingMoreWrapper}>
              <View
                style={[styles.loadingDot, { backgroundColor: colors.primary }]}
              />
              <View
                style={[
                  styles.loadingDot,
                  { backgroundColor: colors.primary, opacity: 0.6 },
                ]}
              />
              <View
                style={[
                  styles.loadingDot,
                  { backgroundColor: colors.primary, opacity: 0.3 },
                ]}
              />
            </View>
          ) : (
            <Text style={[styles.loadMoreText, { color: colors.primary }]}>
              Load More Reviews
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  // Header
  headerContainer: {
    marginBottom: 16,
    marginTop: 8,
  },
  reviewCount: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    marginTop: 8,
    opacity: 0.3,
  },
  // List
  listContainer: {
    width: '100%',
  },
  separator: {
    height: 1,
    marginVertical: 12,
    opacity: 0.2,
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Load More
  loadMoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  loadingMoreWrapper: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
