// components/RatingSummary.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AirbnbRating } from 'react-native-ratings';
import { useTheme } from "../../../contexts/theme/ThemeContext";

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

export default function RatingSummary({ stats }: RatingSummaryProps) {
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;
  
  const { totalRatings, averageRating, totalReviews, distribution } = stats;
  const MAX_RATINGS_PER_STAR = 100;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        Product Rating
      </Text>

      {/* Average star rating */}
      <AirbnbRating
        count={5}
        defaultRating={parseFloat(averageRating)}
        size={20}
        showRating={false}
        isDisabled={true}
        selectedColor="#ffd700"
      />
      <Text style={[styles.ratingText, { color: colors.text, opacity: 0.8 }]}>
        {averageRating} ({totalRatings} ratings, {totalReviews} reviews)
      </Text>

      {/* Star distribution */}
      <View style={styles.distributionContainer}>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star - 1] || 0;
          const percentage = Math.min((count / MAX_RATINGS_PER_STAR) * 100, 100);

          return (
            <View key={star} style={styles.starRow}>
              <Text style={[styles.starLabel, { color: colors.text }]}>
                {star} ★
              </Text>
              <View style={[styles.barBackground, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${percentage}%`,
                      backgroundColor: colors.primary,
                    }
                  ]}
                />
              </View>
              <Text style={[styles.starCount, { color: colors.text }]}>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    marginTop: 4,
  },
  distributionContainer: {
    marginTop: 8,
    maxWidth: 200,
    alignSelf: "center",
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  starLabel: {
    fontSize: 12,
    width: 30,
  },
  barBackground: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
  },
  starCount: {
    fontSize: 12,
    marginLeft: 8,
  },
});