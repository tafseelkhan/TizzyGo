// components/ReviewList.tsx
import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import ReviewItem from "./ReviewItemGlobal";
import { Review } from "../../types/HomeTypes";
import { useTheme } from "../../contexts/theme/ThemeContext";

interface ReviewListProps {
  reviews: Review[];
  currentUserId: string | null;
  handleDelete: (reviewId: string) => void;
}

// Define colors directly
const lightColors = {
  background: '#FFFFFF',
  card: '#F8F9FA',
  text: '#1E293B',
  border: '#E2E8F0',
  primary: '#3B82F6',
  error: '#EF4444',
};

const darkColors = {
  background: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  border: '#334155',
  primary: '#60A5FA',
  error: '#F87171',
};

export default function ReviewList({
  reviews,
  currentUserId,
  handleDelete,
}: ReviewListProps) {
  const { isDark } = useTheme();
  
  // Get colors based on theme
  const colors = isDark ? darkColors : lightColors;

  if (reviews.length === 0) {
    return (
      <Text style={[styles.noReviewsText, { color: colors.text }]}>
        No reviews yet.
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      {reviews.map((review) => (
        <ReviewItem
          key={review._id}
          review={review}
          handleDelete={handleDelete}
          currentUserId={currentUserId}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  noReviewsText: {
    textAlign: "center",
    fontSize: 16,
    marginVertical: 20,
    opacity: 0.7,
  },
});