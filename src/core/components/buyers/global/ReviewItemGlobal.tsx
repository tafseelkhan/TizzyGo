// components/ReviewItem.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  StyleSheet,
} from "react-native";
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from "../../../contexts/theme/ThemeContext";

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

interface ReviewItemProps {
  review: Review;
  handleDelete: (reviewId: string) => void;
  currentUserId?: string | null;
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

// Helper function to fix image URL
const fixUrl = (url: string) => {
  if (!url) return "https://via.placeholder.com/48x48?text=U";
  if (url.startsWith("http") || url.startsWith("https")) return url;
  if (url.startsWith("/")) return `http://192.168.11.121:5000${url}`;
  return `http://192.168.11.121:5000/${url}`;
};

export default function ReviewItem({
  review,
  handleDelete,
  currentUserId,
}: ReviewItemProps) {
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;

  // Extract reviewUserId as string
  const extractUserId = (userId: any): string => {
    if (!userId) return "";
    if (typeof userId === "string") return userId.trim();
    let id = userId._id;
    while (id && typeof id === "object") {
      if ("_id" in id) {
        id = id._id;
      } else {
        break;
      }
    }
    return typeof id === "string" ? id.trim() : "";
  };

  const reviewUserId = extractUserId(review.userId);
  const isOwner =
    currentUserId &&
    reviewUserId &&
    currentUserId === reviewUserId;

  const handleReport = () => {
    Alert.alert(
      "Report Review",
      "Do you want to report this review?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Report",
          onPress: () => {
            const reportUrl = `http://192.168.11.121:5000/report/${reviewUserId}/users`;
            Linking.openURL(reportUrl).catch(err => 
              Alert.alert("Error", "Could not open report page")
            );
          }
        }
      ]
    );
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete Review",
      "Are you sure you want to delete this review?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete(review._id)
        }
      ]
    );
  };

  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={20}
            color={star <= rating ? "#ffd700" : "#ccc"}
            style={styles.starIcon}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.card,
        borderColor: colors.border,
      }
    ]}>
      <View style={styles.contentContainer}>
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            {review.userId.image ? (
              <Image
                source={{ uri: fixUrl(review.userId.image) }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={[styles.avatarText, { color: colors.text }]}>
                {review.userId.name?.[0]?.toUpperCase() || "U"}
              </Text>
            )}
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.textContainer}>
          {/* Header with name and buttons */}
          <View style={styles.headerContainer}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {review.userId.name || "Anonymous User"}
            </Text>

            <View style={styles.buttonContainer}>
              {isOwner && (
                <TouchableOpacity
                  onPress={confirmDelete}
                  style={[styles.deleteButton, { backgroundColor: colors.error }]}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleReport}
                style={styles.reportButton}
              >
                <Icon name="warning" size={20} color="#d97706" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <StarRating rating={review.rating} />
          </View>

          {/* Review Text */}
          <Text style={[styles.reviewText, { color: colors.text, opacity: 0.9 }]}>
            {review.review}
          </Text>

          {/* Review Images */}
          {review.images && review.images.length > 0 && (
            <View style={styles.imagesContainer}>
              {review.images.map((img, i) => (
                <View
                  key={i}
                  style={[styles.imageWrapper, { borderColor: colors.border }]}
                >
                  <Image
                    source={{ uri: fixUrl(img.url) }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  contentContainer: {
    flexDirection: "row",
    gap: 16,
  },
  avatarContainer: {
    flexShrink: 0,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  userName: {
    fontWeight: "bold",
    fontSize: 18,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reportButton: {
    padding: 8,
    borderRadius: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
  },
  starContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  starIcon: {
    marginRight: 2,
  },
  ratingContainer: {
    marginBottom: 8,
  },
  reviewText: {
    marginTop: 8,
    lineHeight: 20,
  },
  imagesContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
});