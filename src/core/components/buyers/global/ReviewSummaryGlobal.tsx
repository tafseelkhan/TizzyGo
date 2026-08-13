// components/RatingSummary.tsx - REDESIGNED

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../contexts/theme/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

interface RatingStats {
  totalRatings: number;
  averageRating: string;
  percentage: string;
  distribution: number[];
  totalReviews: number;
}

interface RatingSummaryProps {
  stats: RatingStats;
}

const lightColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  border: '#E2E8F0',
  primary: '#6366F1',
  muted: '#94A3B8',
};

const darkColors = {
  background: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  border: '#334155',
  primary: '#818CF8',
  muted: '#64748B',
};

export default function RatingSummary({ stats }: RatingSummaryProps) {
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;

  const { totalRatings, averageRating, totalReviews, distribution } = stats;
  const MAX_RATINGS_PER_STAR = 100;

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map(star => (
          <Icon
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={14}
            color={star <= rating ? '#F59E0B' : colors.border}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.ratingMain}>
          <Text style={[styles.averageRating, { color: colors.text }]}>
            {averageRating}
          </Text>
          {renderStars(parseFloat(averageRating))}
          <Text style={[styles.ratingCount, { color: colors.muted }]}>
            {totalRatings} ratings • {totalReviews} reviews
          </Text>
        </View>
        <View style={styles.percentageBadge}>
          <Text style={styles.percentageText}>{stats.percentage}%</Text>
        </View>
      </View>

      <View style={styles.distribution}>
        {[5, 4, 3, 2, 1].map(star => {
          const count = distribution[star - 1] || 0;
          const percentage = Math.min(
            (count / MAX_RATINGS_PER_STAR) * 100,
            100,
          );

          return (
            <View key={star} style={styles.distributionRow}>
              <Text style={[styles.starLabel, { color: colors.text }]}>
                {star}★
              </Text>
              <View
                style={[
                  styles.barBackground,
                  { backgroundColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${percentage}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.countLabel, { color: colors.muted }]}>
                {count}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingMain: {
    gap: 4,
  },
  averageRating: {
    fontSize: 32,
    fontWeight: '700',
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingCount: {
    fontSize: 13,
  },
  percentageBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  percentageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  distribution: {
    gap: 6,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starLabel: {
    fontSize: 13,
    fontWeight: '500',
    width: 30,
  },
  barBackground: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  countLabel: {
    fontSize: 12,
    width: 30,
    textAlign: 'right',
  },
});
