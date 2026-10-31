// src/core/components/buyers/home/ProductCardHome.tsx
import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../../contexts/theme/ThemeContext';
import {
  ApiProductResponse,
  getProductMedia,
  getProductDisplayData,
  formatPrice,
  isValidProduct,
} from '../../../utils/home/productCardUtils';

type RootStackParamList = {
  ProductDetail: { id: string };
  [key: string]: any;
};

export type ProductCardLayout = 'standard' | 'horizontal' | 'tall' | 'featured';

type ProductCardProps = {
  product: ApiProductResponse;
  userId?: string | null;
  showSocialButtons?: boolean;
  layout?: ProductCardLayout;
};

// Badge logic based on product ID
const getBadgeForProduct = (id: string) => {
  if (!id) return null;
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const badges = [
    { text: 'In Demand', bg: '#FEE2B8', color: '#8A4C0F' }, // Light Orange
    { text: 'Value 365', bg: '#FF4D7D', color: '#FFFFFF' }, // Pink
    { text: 'Bestseller', bg: '#E0E7FF', color: '#3730A3' }, // Light Blue
  ];
  return hash % 3 === 0 ? null : badges[hash % 3];
};

const ProductCard: React.FC<ProductCardProps> = React.memo(
  ({ product, layout }) => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { isDark } = useTheme();
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const isValid = useMemo(() => isValidProduct(product), [product]);
    if (!isValid) return null;

    const fullProduct = product.fullProduct;
    const productId = product.productId || fullProduct._id;
    const media = useMemo(() => getProductMedia(product), [product]);
    const displayData = useMemo(() => getProductDisplayData(fullProduct), [fullProduct]);

    const badge = getBadgeForProduct(productId);

    const handlePress = useCallback(() => {
      navigation.navigate('ProductDetail', { id: productId });
    }, [navigation, productId]);

    const handlePressIn = useCallback(() => {
      Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
    }, [scaleAnim]);

    const handlePressOut = useCallback(() => {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    }, [scaleAnim]);

    // Determine Aspect Ratio for Image
    const mediaUrl = media[0] || '';
    const wMatch = /[?&](w|width)=(\d+)/.exec(mediaUrl);
    const hMatch = /[?&](h|height)=(\d+)/.exec(mediaUrl);
    let aspectRatio = 0.85; // default vertical
    if (wMatch && hMatch) {
      const w = Number(wMatch[2]);
      const h = Number(hMatch[2]);
      if (w > 0 && h > 0) aspectRatio = w / h;
    } else {
      if (layout === 'tall') aspectRatio = 0.7;
      else if (layout === 'horizontal') aspectRatio = 1.2;
      else aspectRatio = 0.9;
    }

    const hasDiscount = displayData.discount > 0 && displayData.originalPrice > displayData.sellingPrice;

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={[
            styles.cardContainer,
            { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
          ]}
        >
          {/* IMAGE SECTION */}
          <View
            style={[
              styles.imageWrapper,
              { backgroundColor: isDark ? '#0F172A' : '#F9F9F9' },
            ]}
          >
            <Image
              source={{ uri: mediaUrl }}
              style={[styles.productImage, { aspectRatio }]}
              resizeMode="cover"
            />

            {/* In Demand / Value 365 Badge */}
            {badge && (
              <View style={[styles.topBadge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.topBadgeText, { color: badge.color }]}>
                  {badge.text}
                </Text>
              </View>
            )}

            {/* Rating Bubble (Bottom Left) */}
            {displayData.averageRating > 0 && (
              <View style={styles.ratingBubble}>
                <Text style={styles.ratingBubbleText}>
                  {displayData.averageRating.toFixed(0)}
                </Text>
                <Icon name="star" size={9} color="#fff" style={{ marginHorizontal: 2 }} />
                <Text style={styles.ratingBubbleCount}>
                  (4980)
                </Text>
              </View>
            )}
          </View>

          {/* INFO SECTION */}
          <View style={styles.infoContainer}>
            {/* Brand & Title in a single line layout like the image */}
            <View style={styles.titleRow}>
              <Text
                style={[styles.brandName, { color: isDark ? '#F1F5F9' : '#111111' }]}
                numberOfLines={1}
              >
                {displayData.brand || 'click n buy'}
              </Text>
              <Text
                style={[styles.productTitle, { color: isDark ? '#94A3B8' : '#444444' }]}
                numberOfLines={1}
              >
                {' '}
                {displayData.title}
              </Text>
            </View>

            {/* Price Row */}
            <View style={styles.priceRow}>
              {hasDiscount && (
                <Text
                  style={[styles.mrpText, { color: isDark ? '#94A3B8' : '#777777' }]}
                >
                  {formatPrice(displayData.originalPrice)}
                </Text>
              )}
              <Text
                style={[styles.sellingPrice, { color: isDark ? '#FFFFFF' : '#111111' }]}
              >
                {formatPrice(displayData.sellingPrice)}
              </Text>
              
              {/* Optional: Green text for offer */}
              {hasDiscount && (
                <Text style={styles.discountText}>
                  {displayData.discount}% off
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  },
  (prev, next) => {
    return (
      prev.product?.productId === next.product?.productId &&
      prev.layout === next.layout
    );
  }
);

ProductCard.displayName = 'ProductCard';
export default ProductCard;

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    position: 'relative',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
  },
  
  // Badge
  topBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  topBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Rating Bubble
  ratingBubble: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#1B7A45', // Green color like image
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingBubbleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ratingBubbleCount: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
  },

  // Info
  infoContainer: {
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  brandName: {
    fontSize: 13,
    fontWeight: '700',
  },
  productTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 6,
  },
  mrpText: {
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  sellingPrice: {
    fontSize: 15,
    fontWeight: '700',
  },
  discountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B7A45',
  },
});