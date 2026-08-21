// components/ReviewItem.tsx - REDESIGNED

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../../contexts/theme/ThemeContext';

const { width } = Dimensions.get('window');

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
};

const fixUrl = (url: string) => {
  if (!url) return 'https://via.placeholder.com/48x48?text=U';
  if (url.startsWith('http') || url.startsWith('https')) return url;
  if (url.startsWith('/')) return `http://10.133.59.121:5000${url}`;
  return `http://10.133.59.121:5000/${url}`;
};

export default function ReviewItem({
  review,
  handleDelete,
  currentUserId,
}: ReviewItemProps) {
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;

  const extractUserId = (userId: any): string => {
    if (!userId) return '';
    if (typeof userId === 'string') return userId.trim();
    let id = userId._id;
    while (id && typeof id === 'object') {
      if ('_id' in id) {
        id = id._id;
      } else {
        break;
      }
    }
    return typeof id === 'string' ? id.trim() : '';
  };

  const reviewUserId = extractUserId(review.userId);
  const isOwner =
    currentUserId && reviewUserId && currentUserId === reviewUserId;

  const handleReport = () => {
    Alert.alert('Report Review', 'Do you want to report this review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        onPress: () => {
          const reportUrl = `http://10.133.59.121:5000/report/${reviewUserId}/users`;
          Linking.openURL(reportUrl).catch(() =>
            Alert.alert('Error', 'Could not open report page'),
          );
        },
      },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDelete(review._id),
        },
      ],
    );
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map(star => (
        <Icon
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={16}
          color={star <= rating ? '#F59E0B' : '#CBD5E1'}
        />
      ))}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {review.userId.image ? (
              <Image
                source={{ uri: fixUrl(review.userId.image) }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={[styles.avatarText, { color: colors.text }]}>
                {review.userId.name?.[0]?.toUpperCase() || 'U'}
              </Text>
            )}
          </View>
          <View style={styles.userText}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {review.userId.name || 'Anonymous User'}
            </Text>
            <Text style={[styles.userDate, { color: colors.muted }]}>
              {new Date(review.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          {isOwner && (
            <TouchableOpacity
              onPress={confirmDelete}
              style={[styles.deleteButton, { backgroundColor: colors.error }]}
            >
              <Icon name="trash-outline" size={16} color="white" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleReport} style={styles.reportButton}>
            <Icon name="flag-outline" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.ratingContainer}>
        <StarRating rating={review.rating} />
        <Text style={[styles.ratingText, { color: colors.muted }]}>
          {review.rating}.0
        </Text>
      </View>

      {review.review && (
        <Text style={[styles.reviewText, { color: colors.text }]}>
          {review.review}
        </Text>
      )}

      {review.images && review.images.length > 0 && (
        <View style={styles.imagesContainer}>
          {review.images.map((img, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.imageWrapper, { borderColor: colors.border }]}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: fixUrl(img.url) }}
                style={styles.image}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 44,
    height: 44,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  userText: {
    gap: 2,
  },
  userName: {
    fontWeight: '600',
    fontSize: 15,
  },
  userDate: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
  },
  reportButton: {
    padding: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  starContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  imageWrapper: {
    width: (width - 80) / 3,
    height: (width - 80) / 3,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
