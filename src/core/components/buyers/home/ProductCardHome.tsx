// components/ProductCard.tsx - FINAL CLEAN VERSION
import React, { useRef, useState } from 'react';
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
import LikeComponent from '../global/LikeGlobal';
import ShareWithStats from '../global/ShareGlobal';
import CommentComponent from '../global/CommentGlobal';
import RatingDisplay from './common/RatingDisplay';
import CustomMediaViewer from './common/CustomMediaViewer';
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

type ProductCardProps = {
  product: ApiProductResponse;
  userId?: string | null;
  showSocialButtons?: boolean;
};

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  userId,
  showSocialButtons = true,
}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  if (!isValidProduct(product)) {
    return null;
  }

  const fullProduct = product.fullProduct;
  const productId = product.productId || fullProduct._id;
  const media = getProductMedia(product);
  const displayData = getProductDisplayData(fullProduct);

  const handleImageClick = () => {
    navigation.navigate('ProductDetail', { id: productId });
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const hasDiscount =
    displayData.discount > 0 &&
    displayData.originalPrice > displayData.sellingPrice;

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Image Section */}
      <TouchableOpacity
        style={[
          styles.mediaContainer,
          { backgroundColor: isDark ? '#0F172A' : '#f9fafb' },
        ]}
        onPress={handleImageClick}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <CustomMediaViewer media={media} currentIndex={currentMediaIndex} />
        {media.length > 1 && (
          <View style={styles.dotsContainer}>
            {media.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentMediaIndex
                    ? styles.activeDot
                    : styles.inactiveDot,
                ]}
              />
            ))}
          </View>
        )}
      </TouchableOpacity>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        {/* Brand and Category */}
        <View style={styles.brandRow}>
          {displayData.brand && (
            <Text
              style={[
                styles.brandText,
                { color: isDark ? '#7DD3FC' : '#3b82f6' },
              ]}
            >
              {displayData.brand}
            </Text>
          )}
          <Text
            style={[
              styles.categoryText,
              { color: isDark ? '#94A3B8' : '#6b7280' },
            ]}
          >
            {displayData.subcategory || 'Product'}
          </Text>
        </View>

        {/* Product Title */}
        <Text
          style={[styles.titleText, { color: isDark ? '#F1F5F9' : '#1f2937' }]}
          numberOfLines={2}
        >
          {displayData.title}
        </Text>

        {/* Pricing Section */}
        <View style={styles.pricingSection}>
          <View style={styles.priceRow}>
            {hasDiscount && (
              <View
                style={[
                  styles.discountWithArrow,
                  { backgroundColor: isDark ? '#dc2626' : '#ffffffff' },
                ]}
              >
                <Icon name="arrow-down" size={12} color="#ffffff" />
                <Text style={[styles.discountPercent, { color: '#ffffff' }]}>
                  {displayData.discount}%
                </Text>
              </View>
            )}
            <Text
              style={[
                styles.sellingPrice,
                { color: isDark ? '#FFFFFF' : '#000000' },
              ]}
            >
              {formatPrice(displayData.sellingPrice)}
            </Text>
            {hasDiscount && (
              <Text
                style={[
                  styles.originalPrice,
                  { color: isDark ? '#94A3B8' : '#9ca3af' },
                ]}
              >
                {formatPrice(displayData.originalPrice)}
              </Text>
            )}
          </View>

          <View style={styles.ratingContainer}>
            <RatingDisplay
              productId={productId}
              averageRating={displayData.averageRating}
            />
          </View>
        </View>

        {/* Description */}
        {displayData.description && (
          <Text
            style={[
              styles.descriptionText,
              { color: isDark ? '#94A3B8' : '#6b7280' },
            ]}
            numberOfLines={1}
          >
            {displayData.description}
          </Text>
        )}

        {/* Action Bar */}
        {showSocialButtons && (
          <View
            style={[
              styles.actionBar,
              { borderTopColor: isDark ? '#334155' : '#f3f4f6' },
            ]}
          >
            <View style={styles.actionButtons}>
              <LikeComponent productId={productId} />
              <CommentComponent productId={productId} />
              <ShareWithStats
                productId={productId}
                productTitle={displayData.title}
                category={displayData.subcategory || 'product'}
              />
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  mediaContainer: {
    aspectRatio: 1,
    backgroundColor: '#f9fafb',
    position: 'relative',
    width: '100%',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  dot: { width: 4, height: 4, borderRadius: 2 },
  activeDot: { backgroundColor: '#3b82f6' },
  inactiveDot: { backgroundColor: '#d1d5db' },
  contentContainer: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 8 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  brandText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3b82f6',
    marginRight: 4,
    textTransform: 'uppercase',
  },
  categoryText: { fontSize: 10, color: '#6b7280', fontWeight: '500' },
  titleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
    lineHeight: 16,
    marginBottom: 6,
  },
  pricingSection: { marginBottom: 6 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  discountWithArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffffff',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    marginRight: 6,
  },
  discountPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
    marginLeft: 2,
  },
  sellingPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 11,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  ratingContainer: { marginTop: 2 },
  descriptionText: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 14,
    marginBottom: 8,
  },
  actionBar: {
    borderTopWidth: 0.5,
    borderTopColor: '#f3f4f6',
    paddingTop: 8,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
});

export default ProductCard;
