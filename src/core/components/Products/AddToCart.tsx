import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  Image,
  TouchableWithoutFeedback,
  Vibration,
  Platform,
} from 'react-native';
// ✅ REPLACED: Using react-native-vector-icons instead of @expo/vector-icons
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import SwipeButton from 'rn-swipe-button';
import { useTheme } from '../../contexts/theme/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CART_API_URL = 'http://192.168.251.121:5000';
const PRODUCT_API_URL = 'http://192.168.251.121:5000';

// ✅ Get theme-based colors
const getThemeColors = (isDark: boolean) => {
  return {
    primary: isDark ? '#F59E0B' : '#F59E0B', // Yellow color for both themes
    secondary: isDark ? '#7DD3FC' : '#6366F1',
    accent: isDark ? '#F59E0B' : '#F59E0B',
    success: isDark ? '#10B981' : '#10B981',
    danger: isDark ? '#EF4444' : '#EF4444',
    dark: isDark ? '#F1F5F9' : '#1F2937', // Text colors reversed
    light: isDark ? '#1E293B' : '#F9FAFB', // Background colors reversed
    gray: isDark ? '#94A3B8' : '#6B7280',
    white: isDark ? '#0F172A' : '#FFFFFF', // White background in dark mode = dark
    black: isDark ? '#FFFFFF' : '#000000', // Black text in dark mode = white
    railFill: isDark ? '#F59E0B' : '#F59E0B', // Yellow
    thumbIcon: isDark ? '#0F172A' : '#FFFFFF', // Icon color based on theme
    railBackground: isDark ? '#334155' : '#F3F4F6',
    cardHover: isDark ? '#92400e' : '#FEF3C7', // Dark mode: brown, Light mode: light yellow
    warning: isDark ? '#F59E0B' : '#F59E0B', // Yellow warning
    modalBg: isDark ? '#1E293B' : '#FFFFFF',
    modalContentBg: isDark ? '#0F172A' : '#FFFFFF',
    borderColor: isDark ? '#334155' : '#E5E7EB',
    lightBorder: isDark ? '#475569' : '#F3F4F6',
    textSecondary: isDark ? '#CBD5E1' : '#4B5563',
    textTertiary: isDark ? '#94A3B8' : '#6B7280',
  };
};

// ✅ Thumb Icon Component for Swipe Button - Theme aware
const ThumbIconComponent = ({ isDark }: { isDark: boolean }) => {
  const colors = getThemeColors(isDark);
  return (
    <View
      style={[
        swiperStyles.thumbIconContent,
        { backgroundColor: colors.white, borderColor: colors.primary },
      ]}
    >
      <Icon name="arrow-forward" size={16} color={colors.primary} />
    </View>
  );
};

// ✅ Types (same as before)
export interface VariantField {
  name: string;
  value: string;
  price?: number;
  stock?: number;
  sku?: string;
  image?: string;
}

export interface ProductVariant {
  _id?: string;
  fields?: VariantField[];
  images?: string[];
  video?: string;
}

export interface SelectedVariant {
  variantId?: string;
  [key: string]: any;
  variantSku?: string;
  variantImage?: string;
}

export interface CartItemParams {
  productId: string;
  productData?: any;
  quantity?: number;
  selectedVariant?: SelectedVariant | null;
}

interface CartState {
  isInCart: boolean;
  quantity: number;
  isLoading: boolean;
  isAdding: boolean;
}

interface AddToCartProps {
  productId: string;
  productData: any;
  initialIsInCart?: boolean;
  initialQuantity?: number;
  productLoading?: boolean;
  productAvailable?: boolean;
  maxQuantity?: number;
  style?: any;
  compact?: boolean;
  variants?: ProductVariant[];
  selectedVariant?: SelectedVariant | null;
  onVariantSelect?: (variant: SelectedVariant | null) => void;
  onAddToCartSuccess?: () => void;
}

// ✅ FIXED: Function to fetch product variants from API
export const fetchProductVariants = async (
  productId: string,
): Promise<ProductVariant[]> => {
  console.log('🚀 Fetching variants for product:', productId);

  try {
    const response = await fetch(
      `${PRODUCT_API_URL}/api/products/${productId}/variants`,
    );

    if (!response.ok) {
      throw new Error('Failed to fetch variants');
    }

    const data = await response.json();
    console.log('✅ API variants response:', data);

    // Handle array response
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        _id: item._id,
        fields: item.fields || [],
        images: item.images || [],
        video: item.video || '',
      }));
    }

    return [];
  } catch (error) {
    console.error('❌ Error fetching variants:', error);
    return [];
  }
};

// ✅ Helper functions for media (BuyNow se liya)
const isVideoUrl = (url?: string) => {
  if (!url) return false;

  // Firebase storage video URLs ke liye check
  if (url.includes('firebasestorage.googleapis.com/v0/b/')) {
    // Check if URL has video extension or contains video in path
    const videoExtensions = [
      '.mp4',
      '.mov',
      '.webm',
      '.mkv',
      '.avi',
      '.wmv',
      '.flv',
      '.m4v',
    ];
    const hasVideoExtension = videoExtensions.some(ext =>
      url.toLowerCase().includes(ext),
    );

    // Also check for "video" in URL path
    const hasVideoInPath =
      url.toLowerCase().includes('/video/') ||
      url.toLowerCase().includes('video=true') ||
      url.toLowerCase().includes('media_type=video');

    return hasVideoExtension || hasVideoInPath;
  }

  return /\.(mp4|mov|webm|mkv|avi|wmv|flv|m4v)$/i.test(url);
};

const normalizeMedia = (images: string[] = [], video?: string) => {
  const media: { type: 'image' | 'video'; url: string }[] = [];

  // Add images first (filter out empty strings)
  images.forEach(img => {
    if (img && img.trim() !== '') {
      media.push({ type: 'image', url: img });
    }
  });

  // Add video at the beginning if exists
  if (video && video.trim() !== '') {
    media.unshift({ type: 'video', url: video });
  }

  return media;
};

// ✅ Format price
const formatPrice = (price: number) => {
  return `₹${price.toLocaleString('en-IN')}`;
};

// ✅ Cart API functions (same as before)
export const addToCart = async (params: CartItemParams): Promise<boolean> => {
  const {
    productId,
    productData,
    quantity = 1,
    selectedVariant = null,
  } = params;

  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      Alert.alert('Error', 'Please login to add items to cart');
      return false;
    }

    const requestBody: any = {
      productId,
      productData,
      quantity,
    };

    if (selectedVariant && Object.keys(selectedVariant).length > 0) {
      requestBody.selectedVariant = selectedVariant;
    }

    console.log('📦 Adding to cart:', requestBody);

    const response = await fetch(`${CART_API_URL}/api/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add to cart');
    }

    return true;
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Failed to add item to cart');
    return false;
  }
};

export const updateCartItem = async (
  params: Omit<CartItemParams, 'productData'>,
): Promise<boolean> => {
  const { productId, quantity = 1, selectedVariant = null } = params;

  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      Alert.alert('Error', 'Please login to update cart');
      return false;
    }

    const requestBody: any = {
      productId,
      quantity,
    };

    if (selectedVariant && Object.keys(selectedVariant).length > 0) {
      requestBody.selectedVariant = selectedVariant;
    }

    const response = await fetch(`${CART_API_URL}/api/cart/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update cart');
    }

    return true;
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Failed to update cart');
    return false;
  }
};

export const removeFromCart = async (productId: string): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      Alert.alert('Error', 'Please login to remove from cart');
      return false;
    }

    const response = await fetch(`${CART_API_URL}/api/cart/remove`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to remove from cart');
    }

    return true;
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Failed to remove from cart');
    return false;
  }
};

export const fetchCart = async (
  productId: string,
): Promise<{
  inCart: boolean;
  quantity: number;
  selectedVariant?: SelectedVariant;
} | null> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return null;

    const response = await fetch(
      `${CART_API_URL}/api/cart/check?productId=${productId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch cart status');
    }

    const data = await response.json();
    return {
      inCart: data.inCart || false,
      quantity: data.quantity || 1,
      selectedVariant: data.selectedVariant || null,
    };
  } catch (error) {
    console.error('Error fetching cart:', error);
    return null;
  }
};

const AddToCart: React.FC<AddToCartProps> = ({
  productId,
  productData,
  initialIsInCart = false,
  initialQuantity = 1,
  productLoading = false,
  productAvailable = true,
  maxQuantity = 10,
  style = {},
  compact = false,
  variants: propVariants = [],
  selectedVariant: propSelectedVariant = null,
  onVariantSelect = () => {},
  onAddToCartSuccess = () => {},
}) => {
  const { isDark } = useTheme(); // ✅ Theme context
  const [cartState, setCartState] = useState<CartState>({
    isInCart: initialIsInCart,
    quantity: initialQuantity,
    isLoading: false,
    isAdding: false,
  });

  const [variants, setVariants] = useState<ProductVariant[]>(propVariants);
  const [selectedVariant, setSelectedVariant] =
    useState<SelectedVariant | null>(propSelectedVariant);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<
    number | null
  >(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [showAnim, setShowAnim] = useState<'success' | 'failed' | null>(null);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [swipeLoading, setSwipeLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const modalOpenRef = useRef(false);
  const swipeButtonRef = useRef<any>(null);

  // ✅ Get theme colors based on current theme
  const themeColors = getThemeColors(isDark);

  // ✅ Fetch variants if not provided as prop
  useEffect(() => {
    const loadVariants = async () => {
      console.log('📥 Loading variants for product:', productId);

      if (propVariants.length === 0 && productId) {
        setVariantsLoading(true);
        try {
          const fetchedVariants = await fetchProductVariants(productId);
          console.log('✅ Variants loaded:', fetchedVariants);
          console.log('✅ Number of variant objects:', fetchedVariants.length);
          setVariants(fetchedVariants);
        } catch (error) {
          console.error('❌ Error loading variants:', error);
        } finally {
          setVariantsLoading(false);
        }
      } else {
        console.log('✅ Using prop variants:', propVariants);
        console.log('✅ Number of variant objects:', propVariants.length);
        setVariants(propVariants);
      }
    };

    loadVariants();
  }, [productId, propVariants]);

  // ✅ Debug logging
  useEffect(() => {
    console.log('🔄 VARIANT STATE UPDATED:');
    console.log('Variants:', variants);
    console.log('Variants length:', variants?.length);
    console.log('Selected Variant Index:', selectedVariantIndex);
    console.log('Selected Variant:', selectedVariant);
  }, [variants, selectedVariant, selectedVariantIndex]);

  // ✅ Fetch cart status
  useEffect(() => {
    const checkCartStatus = async () => {
      try {
        const cartStatus = await fetchCart(productId);
        if (cartStatus) {
          setCartState({
            isInCart: cartStatus.inCart,
            quantity: cartStatus.quantity,
            isLoading: false,
            isAdding: false,
          });

          if (cartStatus.selectedVariant) {
            setSelectedVariant(cartStatus.selectedVariant);
            onVariantSelect(cartStatus.selectedVariant);

            // Find variant index if variantId exists
            if (cartStatus.selectedVariant.variantId && variants.length > 0) {
              const index = variants.findIndex(
                v => v._id === cartStatus.selectedVariant?.variantId,
              );
              if (index !== -1) {
                setSelectedVariantIndex(index);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking cart status:', error);
      }
    };

    if (variants.length > 0) {
      checkCartStatus();
    }
  }, [productId, variants]);

  // ✅ Vibration function (BuyNow se liya)
  const triggerVibration = () => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate([0, 30, 0, 30]);
    } else {
      Vibration.vibrate(300);
    }
  };

  // ✅ Handle variant selection with vibration (BuyNow style)
  const handleVariantSelect = (variantIndex: number) => {
    triggerVibration();

    console.log('🎯 Selecting complete variant object at index:', variantIndex);

    const selectedVariantObj = variants[variantIndex];
    if (!selectedVariantObj) return;

    const newVariant: SelectedVariant = {
      variantId: selectedVariantObj._id,
    };

    // Add all fields to selected variant
    if (selectedVariantObj.fields) {
      selectedVariantObj.fields.forEach(field => {
        newVariant[field.name] = field.value;

        // Store additional info
        if (field.image) newVariant.variantImage = field.image;
        if (field.sku) newVariant.variantSku = field.sku;
      });
    }

    // Add images if available
    if (selectedVariantObj.images && selectedVariantObj.images.length > 0) {
      newVariant.variantImages = selectedVariantObj.images;
    }

    // Add video if available
    if (selectedVariantObj.video) {
      newVariant.variantVideo = selectedVariantObj.video;
    }

    setSelectedVariantIndex(variantIndex);
    setSelectedVariant(newVariant);
    onVariantSelect(newVariant);

    console.log('✅ Selected variant:', newVariant);
  };

  // ✅ Check if a variant is selected
  const isVariantSelected = () => {
    return selectedVariantIndex !== null && selectedVariant !== null;
  };

  // ✅ Check if product has variants
  const hasVariants = () => {
    return variants && variants.length > 0;
  };

  // ✅ Render media thumbnails (BuyNow se liya)
  const renderMediaThumbnail = (variant: ProductVariant, index: number) => {
    const media = normalizeMedia(variant.images || [], variant.video);

    console.log(`🔍 Variant ${index} media data:`, {
      hasVideo: !!variant.video,
      videoUrl: variant.video,
      imagesCount: variant.images?.length || 0,
      images: variant.images,
      normalizedMedia: media,
    });

    if (media.length === 0) {
      console.log(`📭 Variant ${index}: No media available`);
      return (
        <View
          style={[
            swiperStyles.noMediaContainer,
            {
              backgroundColor: themeColors.light,
              borderColor: themeColors.light,
            },
          ]}
        >
          <Icon name="image" size={32} color={themeColors.gray} />
          <Text style={[swiperStyles.noMediaText, { color: themeColors.gray }]}>
            No media
          </Text>
        </View>
      );
    }

    console.log(`✅ Variant ${index}: Rendering ${media.length} media items`);

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[
          swiperStyles.variantImagesContainer,
          { backgroundColor: themeColors.light },
        ]}
        contentContainerStyle={swiperStyles.variantImagesContent}
      >
        {media.map((item, mediaIndex) => {
          const isVideo = isVideoUrl(item.url);

          console.log(`   📄 Media ${mediaIndex}:`, {
            type: item.type,
            url: item.url,
            isVideo: isVideo,
            detectedByFunction: isVideoUrl(item.url),
          });

          if (isVideo) {
            return (
              <View
                key={`media-${index}-${mediaIndex}`}
                style={swiperStyles.videoThumbnailContainer}
              >
                <View
                  style={[
                    swiperStyles.videoThumbnail,
                    {
                      borderColor: themeColors.primary,
                      backgroundColor: '#FEF3C7',
                    },
                  ]}
                >
                  <Icon name="videocam" size={24} color={themeColors.primary} />
                </View>
                <View style={swiperStyles.videoPlayIcon}>
                  <Icon
                    name="play-circle-filled"
                    size={28}
                    color="rgba(255, 255, 255, 0.9)"
                  />
                </View>
                <View
                  style={[
                    swiperStyles.videoBadge,
                    { backgroundColor: themeColors.primary },
                  ]}
                >
                  <Icon name="videocam" size={12} color={themeColors.white} />
                  <Text
                    style={[
                      swiperStyles.videoBadgeText,
                      { color: themeColors.white },
                    ]}
                  >
                    VIDEO
                  </Text>
                </View>
              </View>
            );
          } else {
            return (
              <View
                key={`media-${index}-${mediaIndex}`}
                style={swiperStyles.imageContainer}
              >
                <Image
                  source={{ uri: item.url }}
                  style={[
                    swiperStyles.variantImage,
                    { borderColor: themeColors.light },
                  ]}
                  resizeMode="cover"
                  onError={error => {
                    console.log(
                      `❌ Error loading image for variant ${index}:`,
                      error.nativeEvent.error,
                    );
                  }}
                  onLoad={() => {
                    console.log(
                      `✅ Successfully loaded image for variant ${index}`,
                    );
                  }}
                />
              </View>
            );
          }
        })}
      </ScrollView>
    );
  };

  // ✅ Modal Component (BuyNow jaisa) - Theme aware
  const renderVariantModal = () => {
    console.log('🎨 Rendering variant modal...');
    console.log('Modal visible:', showVariantModal);
    console.log('Number of variant objects:', variants.length);

    return (
      <Modal
        visible={showVariantModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVariantModal(false)}
      >
        <View style={swiperStyles.modalFullScreenContainer}>
          <TouchableWithoutFeedback onPress={() => setShowVariantModal(false)}>
            <View style={swiperStyles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <View
            style={[
              swiperStyles.variantModalContainer,
              {
                backgroundColor: themeColors.modalBg,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              },
            ]}
          >
            {/* Modal Header */}
            <View
              style={[
                swiperStyles.variantModalHeader,
                {
                  borderBottomColor: themeColors.borderColor,
                  backgroundColor: themeColors.modalBg,
                },
              ]}
            >
              <View style={swiperStyles.modalHeaderLeft}>
                <Icon name="inventory" size={24} color={themeColors.primary} />
                <Text
                  style={[
                    swiperStyles.variantModalTitle,
                    { color: themeColors.dark },
                  ]}
                >
                  Select Option
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  swiperStyles.closeButton,
                  { backgroundColor: themeColors.light },
                ]}
                onPress={() => setShowVariantModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={24} color={themeColors.dark} />
              </TouchableOpacity>
            </View>

            {/* Variant List - Flexible Height */}
            <ScrollView
              style={[
                swiperStyles.variantScrollView,
                { backgroundColor: themeColors.modalBg },
              ]}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                swiperStyles.variantScrollContent,
                { backgroundColor: themeColors.modalBg },
              ]}
            >
              {variantsLoading ? (
                <View
                  style={[
                    swiperStyles.loadingContainer,
                    { backgroundColor: themeColors.modalBg },
                  ]}
                >
                  <ActivityIndicator size="large" color={themeColors.primary} />
                  <Text
                    style={[
                      swiperStyles.loadingText,
                      { color: themeColors.gray },
                    ]}
                  >
                    Loading options...
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    swiperStyles.variantListContainer,
                    { backgroundColor: themeColors.modalBg },
                  ]}
                >
                  <Text
                    style={[
                      swiperStyles.variantModalSubtitle,
                      { color: themeColors.secondary },
                    ]}
                  >
                    {variants.length} variant{variants.length !== 1 ? 's' : ''}{' '}
                    available
                  </Text>

                  {variants && variants.length > 0 ? (
                    variants.map((variant, index) => {
                      const fields = variant.fields || [];
                      const isSelected = selectedVariantIndex === index;

                      return (
                        <TouchableOpacity
                          key={`addtocart-variant-${index}`}
                          style={[
                            swiperStyles.variantCard,
                            {
                              backgroundColor: themeColors.modalContentBg,
                              borderColor: themeColors.borderColor,
                            },
                            isSelected && [
                              swiperStyles.variantCardSelected,
                              {
                                backgroundColor: themeColors.cardHover,
                                borderColor: themeColors.primary,
                              },
                            ],
                          ]}
                          onPress={() => handleVariantSelect(index)}
                          activeOpacity={0.7}
                        >
                          {/* Selected Indicator */}
                          {isSelected && (
                            <View
                              style={[
                                swiperStyles.selectedBadge,
                                { backgroundColor: themeColors.success },
                              ]}
                            >
                              <Icon
                                name="check"
                                size={16}
                                color={themeColors.white}
                              />
                            </View>
                          )}

                          {/* Images and Video Thumbnail */}
                          {renderMediaThumbnail(variant, index)}

                          {/* Variant Details */}
                          <View
                            style={[
                              swiperStyles.variantDetails,
                              { backgroundColor: themeColors.modalContentBg },
                            ]}
                          >
                            <View style={swiperStyles.variantHeader}>
                              <Text
                                style={[
                                  swiperStyles.variantName,
                                  { color: themeColors.dark },
                                ]}
                              >
                                Option {index + 1}
                              </Text>
                              {variant.video && (
                                <View
                                  style={[
                                    swiperStyles.videoIconSmall,
                                    { backgroundColor: '#FEF3C7' },
                                  ]}
                                >
                                  <Icon
                                    name="videocam"
                                    size={20}
                                    color={themeColors.primary}
                                  />
                                </View>
                              )}
                            </View>

                            {/* Fields */}
                            {fields.map((field, fieldIndex) => (
                              <View
                                key={`field-${index}-${fieldIndex}`}
                                style={swiperStyles.fieldRow}
                              >
                                <Text
                                  style={[
                                    swiperStyles.fieldName,
                                    { color: themeColors.secondary },
                                  ]}
                                >
                                  {field.name}:
                                </Text>
                                <Text
                                  style={[
                                    swiperStyles.fieldValue,
                                    { color: themeColors.dark },
                                  ]}
                                >
                                  {field.value}
                                </Text>
                                {field.price && field.price > 0 && (
                                  <Text
                                    style={[
                                      swiperStyles.fieldPrice,
                                      { color: themeColors.success },
                                    ]}
                                  >
                                    +{formatPrice(field.price)}
                                  </Text>
                                )}
                              </View>
                            ))}

                            {/* Status */}
                            <View style={swiperStyles.variantBottomRow}>
                              <View
                                style={[
                                  swiperStyles.statusTag,
                                  isSelected
                                    ? [
                                        swiperStyles.statusSelected,
                                        {
                                          backgroundColor: themeColors.success,
                                        },
                                      ]
                                    : [
                                        swiperStyles.statusDefault,
                                        { backgroundColor: themeColors.light },
                                      ],
                                ]}
                              >
                                <Text
                                  style={[
                                    swiperStyles.statusText,
                                    isSelected && [
                                      swiperStyles.statusSelectedText,
                                      { color: themeColors.white },
                                    ],
                                    {
                                      color: isSelected
                                        ? themeColors.white
                                        : themeColors.dark,
                                    },
                                  ]}
                                >
                                  {isSelected ? 'Selected' : 'Available'}
                                </Text>
                              </View>

                              {/* Video indicator */}
                              {variant.video && (
                                <TouchableOpacity
                                  style={[
                                    swiperStyles.videoIndicator,
                                    { backgroundColor: themeColors.secondary },
                                  ]}
                                >
                                  <Icon
                                    name="play-circle"
                                    size={14}
                                    color={themeColors.white}
                                  />
                                  <Text
                                    style={[
                                      swiperStyles.videoIndicatorText,
                                      { color: themeColors.white },
                                    ]}
                                  >
                                    Video Available
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View
                      style={[
                        swiperStyles.noVariantsContainer,
                        { backgroundColor: themeColors.modalBg },
                      ]}
                    >
                      <Icon
                        name="inventory"
                        size={48}
                        color={themeColors.gray}
                      />
                      <Text
                        style={[
                          swiperStyles.noVariantsText,
                          { color: themeColors.dark },
                        ]}
                      >
                        No variants available
                      </Text>
                      <Text
                        style={[
                          swiperStyles.noVariantsSubtext,
                          { color: themeColors.gray },
                        ]}
                      >
                        Proceed with basic product
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {/* ✅ SWIPE BUTTON SECTION */}
            <View
              style={[
                swiperStyles.swipeSection,
                {
                  backgroundColor: themeColors.modalBg,
                  borderTopColor: themeColors.borderColor,
                },
              ]}
            >
              <View
                style={[
                  swiperStyles.swipeInfo,
                  {
                    backgroundColor: '#FEF3C7',
                    borderColor: '#FDE68A',
                  },
                ]}
              >
                <Icon
                  name="info-outline"
                  size={16}
                  color={themeColors.secondary}
                />
                <Text
                  style={[
                    swiperStyles.swipeInfoText,
                    { color: themeColors.secondary },
                  ]}
                >
                  {isVariantSelected()
                    ? 'Swipe to add to cart'
                    : 'Select an option to proceed'}
                </Text>
              </View>

              {isVariantSelected() ? (
                <View style={swiperStyles.swipeButtonWrapper}>
                  // ✅ CORRECTED SWIPE BUTTON COMPONENT - Remove unsupported
                  props
                  <SwipeButton
                    ref={swipeButtonRef}
                    disabled={swipeLoading}
                    swipeSuccessThreshold={70}
                    height={48}
                    width={Math.min(screenWidth - 32, 400)}
                    title="Swipe to Add to Cart"
                    titleStyles={[
                      swiperStyles.swipeButtonTitle,
                      { fontWeight: '600' },
                    ]}
                    titleColor={themeColors.white}
                    titleFontSize={14}
                    onSwipeStart={() => triggerVibration()}
                    onSwipeSuccess={handleSwipeSuccess}
                    shouldResetAfterSuccess={true}
                    railFillBackgroundColor={themeColors.railFill}
                    railFillBorderColor={themeColors.primary}
                    thumbIconBackgroundColor={themeColors.white}
                    thumbIconBorderColor={themeColors.primary}
                    railBackgroundColor={themeColors.railBackground}
                    railBorderColor={themeColors.light}
                    // ❌ REMOVED: railBorderWidth - not supported
                    containerStyles={[
                      swiperStyles.swipeButtonContainer,
                      {
                        backgroundColor: themeColors.primary,
                        borderColor: themeColors.primary,
                      },
                    ]}
                    railStyles={swiperStyles.swipeRail}
                    thumbIconStyles={swiperStyles.thumbIcon}
                    thumbIconComponent={() => (
                      <ThumbIconComponent isDark={isDark} />
                    )}
                  />
                  {swipeLoading && (
                    <View style={swiperStyles.swipeLoadingOverlay}>
                      <ActivityIndicator
                        size="small"
                        color={themeColors.primary}
                      />
                      <Text
                        style={[
                          swiperStyles.swipeLoadingText,
                          { color: themeColors.primary },
                        ]}
                      >
                        Adding...
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    swiperStyles.selectPromptContainer,
                    {
                      backgroundColor: themeColors.light,
                      borderColor: themeColors.railBackground,
                    },
                  ]}
                  onPress={() => {
                    if (variants.length > 0) {
                      handleVariantSelect(0);
                    }
                  }}
                  disabled={variants.length === 0}
                  activeOpacity={0.6}
                >
                  <Icon name="touch-app" size={18} color={themeColors.gray} />
                  <Text
                    style={[
                      swiperStyles.selectPromptText,
                      { color: themeColors.gray },
                    ]}
                  >
                    {variants.length > 0
                      ? 'Tap to select first option'
                      : 'No options available'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ✅ Handle Add to Cart (SAME AS BEFORE - NO CHANGES)
  const handleAddToCart = async () => {
    console.log('🛒 ======= ADD TO CART CLICKED =======');
    console.log('Product ID:', productId);
    console.log('Has Variants?', hasVariants());
    console.log('Is Variant Selected?', isVariantSelected());
    console.log('Variants:', variants);

    if (!productAvailable) {
      setShowAnim('failed');
      Alert.alert('Out of Stock', 'This product is currently out of stock');
      return;
    }

    // ✅ Check if variants exist and are not selected
    if (hasVariants() && !isVariantSelected()) {
      console.log('📱 OPENING VARIANT MODAL...');
      setShowVariantModal(true);
      return;
    }

    // ✅ If no variants OR variant is selected, add to cart directly
    setCartState(prev => ({ ...prev, isAdding: true }));

    try {
      const success = await addToCart({
        productId,
        productData,
        quantity: 1,
        selectedVariant: hasVariants() ? selectedVariant : null,
      });

      if (success) {
        setCartState({
          isInCart: true,
          quantity: 1,
          isLoading: false,
          isAdding: false,
        });
        setShowAnim('success');
        onAddToCartSuccess();

        setTimeout(() => {
          showQuantityController();
        }, 800);
      } else {
        setCartState(prev => ({ ...prev, isAdding: false }));
        setShowAnim('failed');
      }
    } catch {
      setCartState(prev => ({ ...prev, isAdding: false }));
      setShowAnim('failed');
    }
  };

  // ✅ Handle SWIPE button completion (SAME AS BEFORE)
  const handleSwipeSuccess = async () => {
    console.log('🔄 Swipe completed! Adding to cart...');
    setSwipeLoading(true);

    if (!productAvailable) {
      Alert.alert('Out of Stock', 'This product is currently out of stock');
      setSwipeLoading(false);
      if (swipeButtonRef.current) {
        swipeButtonRef.current.reset();
      }
      return;
    }

    try {
      const success = await addToCart({
        productId,
        productData,
        quantity: 1,
        selectedVariant: hasVariants() ? selectedVariant : null,
      });

      if (success) {
        setCartState({
          isInCart: true,
          quantity: 1,
          isLoading: false,
          isAdding: false,
        });
        setShowAnim('success');
        onAddToCartSuccess();
        setShowVariantModal(false);

        setTimeout(() => {
          showQuantityController();
        }, 800);
      } else {
        Alert.alert('Error', 'Failed to add to cart');
        if (swipeButtonRef.current) {
          swipeButtonRef.current.reset();
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add to cart');
      if (swipeButtonRef.current) {
        swipeButtonRef.current.reset();
      }
    } finally {
      setSwipeLoading(false);
    }
  };

  // ✅ Quantity Modal Functions (SAME AS BEFORE - NO CHANGES)
  const showQuantityController = () => {
    if (modalOpenRef.current) return;

    modalOpenRef.current = true;
    setShowQuantityModal(true);

    slideAnim.setValue(0);
    scaleAnim.setValue(0);

    setTimeout(() => {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }),
      ]).start();
    }, 50);
  };

  const hideQuantityController = () => {
    if (!modalOpenRef.current) return;

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
    ]).start(() => {
      setShowQuantityModal(false);
      modalOpenRef.current = false;
    });
  };

  const slideUpAnimation = {
    transform: [
      {
        translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [300, 0],
        }),
      },
    ],
  };

  const scaleAnimation = {
    transform: [
      {
        scale: scaleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
    ],
  };

  // ✅ Handle quantity update (SAME AS BEFORE)
  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > maxQuantity) return;

    setCartState(prev => ({ ...prev, isLoading: true }));

    const success = await updateCartItem({
      productId,
      quantity: newQuantity,
      selectedVariant: hasVariants() ? selectedVariant : null,
    });

    if (success) {
      setCartState({
        ...cartState,
        quantity: newQuantity,
        isLoading: false,
      });
      setShowAnim('success');
    } else {
      setCartState(prev => ({ ...prev, isLoading: false }));
      setShowAnim('failed');
    }
  };

  // ✅ Handle remove from cart (SAME AS BEFORE)
  const handleRemoveFromCart = async () => {
    setCartState(prev => ({ ...prev, isLoading: true }));

    const success = await removeFromCart(productId);
    if (success) {
      setCartState({
        isInCart: false,
        quantity: 1,
        isLoading: false,
        isAdding: false,
      });
      setSelectedVariant(null);
      setSelectedVariantIndex(null);
      onVariantSelect(null);
      setShowAnim('success');
      hideQuantityController();
    } else {
      setCartState(prev => ({ ...prev, isLoading: false }));
      setShowAnim('failed');
    }
  };

  const handleAnimationFinish = () => {
    setShowAnim(null);
  };

  // ✅ Get button text (SAME AS BEFORE)
  const getButtonText = () => {
    if (!productAvailable) return 'Out of Stock';
    if (cartState.isAdding) return 'Adding to Cart...';
    if (hasVariants() && !isVariantSelected()) return 'Add to Cart';
    return 'Add to Cart';
  };

  const successAnimation = require('../animations/lotties/Success.json');
  const failedAnimation = require('../animations/lotties/Failed.json');

  // ✅ Compact version - Theme aware
  if (compact) {
    if (!cartState.isInCart) {
      return (
        <>
          {renderVariantModal()}

          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={cartState.isAdding || productLoading || !productAvailable}
            style={[
              styles.compactAddButton,
              { backgroundColor: themeColors.primary },
              (!productAvailable || cartState.isAdding || productLoading) &&
                styles.disabledButton,
            ]}
          >
            {cartState.isAdding ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.compactButtonText}>{getButtonText()}</Text>
            )}
          </TouchableOpacity>
        </>
      );
    }

    return (
      <View style={styles.compactContainer}>
        <TouchableOpacity
          onPress={showQuantityController}
          style={[
            styles.compactQuantityButton,
            {
              backgroundColor: themeColors.light,
              borderColor: themeColors.borderColor,
            },
          ]}
        >
          <Text
            style={[styles.compactQuantityText, { color: themeColors.dark }]}
          >
            {cartState.quantity}
          </Text>
          <Icon name="keyboard-arrow-down" size={16} color={themeColors.gray} />
        </TouchableOpacity>

        <Modal
          visible={showQuantityModal}
          transparent={true}
          animationType="fade"
          onRequestClose={hideQuantityController}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={hideQuantityController}
          >
            <Animated.View style={[styles.modalContent, slideUpAnimation]}>
              <Animated.View
                style={[
                  styles.modalQuantityContainer,
                  scaleAnimation,
                  {
                    backgroundColor: themeColors.modalContentBg,
                  },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text
                    style={[styles.modalTitle, { color: themeColors.dark }]}
                  >
                    Quantity
                  </Text>
                  <TouchableOpacity onPress={hideQuantityController}>
                    <Icon name="close" size={24} color={themeColors.gray} />
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.modalControls,
                    {
                      backgroundColor: themeColors.light,
                      borderColor: themeColors.borderColor,
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => handleQuantityChange(cartState.quantity - 1)}
                    disabled={cartState.isLoading || cartState.quantity <= 1}
                    style={[
                      styles.modalQuantityButton,
                      {
                        backgroundColor: themeColors.white,
                        borderColor: themeColors.borderColor,
                      },
                      (cartState.quantity <= 1 || cartState.isLoading) &&
                        styles.disabledButton,
                    ]}
                  >
                    <Icon
                      name="remove"
                      size={24}
                      color={themeColors.textSecondary}
                    />
                  </TouchableOpacity>

                  <View style={styles.modalQuantityDisplay}>
                    {cartState.isLoading ? (
                      <ActivityIndicator
                        size="small"
                        color={themeColors.textSecondary}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.modalQuantityText,
                          { color: themeColors.dark },
                        ]}
                      >
                        {cartState.quantity}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => handleQuantityChange(cartState.quantity + 1)}
                    disabled={
                      cartState.isLoading || cartState.quantity >= maxQuantity
                    }
                    style={[
                      styles.modalQuantityButton,
                      {
                        backgroundColor: themeColors.white,
                        borderColor: themeColors.borderColor,
                      },
                      (cartState.quantity >= maxQuantity ||
                        cartState.isLoading) &&
                        styles.disabledButton,
                    ]}
                  >
                    <Icon
                      name="add"
                      size={24}
                      color={themeColors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleRemoveFromCart}
                  disabled={cartState.isLoading}
                  style={[
                    styles.modalRemoveButton,
                    {
                      backgroundColor: '#FEF2F2',
                      borderColor: '#FECACA',
                    },
                    cartState.isLoading && styles.disabledButton,
                  ]}
                >
                  <Icon name="delete-outline" size={20} color="#DC2626" />
                  <Text style={styles.modalRemoveText}>Remove from Cart</Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  // ✅ Full version - Theme aware
  return (
    <View style={[styles.container, style]}>
      {renderVariantModal()}

      <Modal
        visible={showAnim !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAnim(null)}
      >
        <View style={styles.animationContainer}>
          <View style={styles.animationBackground}>
            <LottieView
              source={
                showAnim === 'success' ? successAnimation : failedAnimation
              }
              autoPlay
              loop={false}
              style={styles.animation}
              onAnimationFinish={handleAnimationFinish}
            />
          </View>
        </View>
      </Modal>

      {!cartState.isInCart ? (
        <TouchableOpacity
          onPress={handleAddToCart}
          disabled={cartState.isAdding || productLoading || !productAvailable}
          style={[
            styles.addButton,
            { backgroundColor: themeColors.primary },
            (!productAvailable || cartState.isAdding || productLoading) &&
              styles.disabledButton,
          ]}
        >
          {cartState.isAdding ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          ) : (
            <View style={styles.iconContent}>
              <Icon name="add-shopping-cart" size={16} color="#FFFFFF" />
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>{getButtonText()}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.fullContainer}>
          <TouchableOpacity
            onPress={showQuantityController}
            style={[
              styles.showControlsButton,
              {
                backgroundColor: themeColors.light,
                borderColor: themeColors.borderColor,
              },
            ]}
          >
            <View style={styles.quantityInfo}>
              <Text style={[styles.quantityText, { color: themeColors.gray }]}>
                Qty: {cartState.quantity}
              </Text>
            </View>
            <Icon
              name="keyboard-arrow-down"
              size={16}
              color={themeColors.gray}
            />
          </TouchableOpacity>

          <Modal
            visible={showQuantityModal}
            transparent={true}
            animationType="fade"
            onRequestClose={hideQuantityController}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={hideQuantityController}
            >
              <Animated.View style={[styles.modalContent, slideUpAnimation]}>
                <Animated.View
                  style={[
                    styles.modalQuantityContainer,
                    scaleAnimation,
                    {
                      backgroundColor: themeColors.modalContentBg,
                    },
                  ]}
                >
                  <View style={styles.modalHeader}>
                    <Text
                      style={[styles.modalTitle, { color: themeColors.dark }]}
                    >
                      Update Quantity
                    </Text>
                    <TouchableOpacity onPress={hideQuantityController}>
                      <Icon name="close" size={24} color={themeColors.gray} />
                    </TouchableOpacity>
                  </View>

                  <View
                    style={[
                      styles.modalControls,
                      {
                        backgroundColor: themeColors.light,
                        borderColor: themeColors.borderColor,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        handleQuantityChange(cartState.quantity - 1)
                      }
                      disabled={cartState.isLoading || cartState.quantity <= 1}
                      style={[
                        styles.modalQuantityButton,
                        {
                          backgroundColor: themeColors.white,
                          borderColor: themeColors.borderColor,
                        },
                        (cartState.quantity <= 1 || cartState.isLoading) &&
                          styles.disabledButton,
                      ]}
                    >
                      <Icon
                        name="remove"
                        size={24}
                        color={themeColors.textSecondary}
                      />
                    </TouchableOpacity>

                    <View style={styles.modalQuantityDisplay}>
                      {cartState.isLoading ? (
                        <ActivityIndicator
                          size="small"
                          color={themeColors.textSecondary}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.modalQuantityText,
                            { color: themeColors.dark },
                          ]}
                        >
                          {cartState.quantity}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() =>
                        handleQuantityChange(cartState.quantity + 1)
                      }
                      disabled={
                        cartState.isLoading || cartState.quantity >= maxQuantity
                      }
                      style={[
                        styles.modalQuantityButton,
                        {
                          backgroundColor: themeColors.white,
                          borderColor: themeColors.borderColor,
                        },
                        (cartState.quantity >= maxQuantity ||
                          cartState.isLoading) &&
                          styles.disabledButton,
                      ]}
                    >
                      <Icon
                        name="add"
                        size={24}
                        color={themeColors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={handleRemoveFromCart}
                    disabled={cartState.isLoading}
                    style={[
                      styles.modalRemoveButton,
                      {
                        backgroundColor: '#FEF2F2',
                        borderColor: '#FECACA',
                      },
                      cartState.isLoading && styles.disabledButton,
                    ]}
                  >
                    <Icon name="delete-outline" size={20} color="#DC2626" />
                    <Text style={styles.modalRemoveText}>Remove from Cart</Text>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            </TouchableOpacity>
          </Modal>
        </View>
      )}
    </View>
  );
};

// ✅ NEW SWIPER STYLES (BuyNow jaisa with Theme support)
const swiperStyles = StyleSheet.create({
  // ✅ Modal Full Screen Container
  modalFullScreenContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // ✅ Modal Backdrop
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  // ✅ Modal Container - Proper Height (59% of screen)
  variantModalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: screenHeight * 0.59,
    maxHeight: screenHeight * 0.65,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },

  // ✅ Modal Header - Proper padding
  variantModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  variantModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  variantModalSubtitle: {
    fontSize: 14,
    color: '#6366F1',
    marginBottom: 12,
    fontWeight: '500',
    paddingHorizontal: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 150,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  // ✅ Variant List Container
  variantListContainer: {
    paddingHorizontal: 4,
    backgroundColor: '#FFFFFF',
  },

  // ✅ Variant Scroll View - Flexible Height
  variantScrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  variantScrollContent: {
    paddingBottom: 20,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
  },

  // ✅ Variant Card
  variantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 12,
  },
  variantCardSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 2,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#10B981',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },

  // ✅ Variant Images Container
  variantImagesContainer: {
    maxHeight: 100,
    backgroundColor: '#F3F4F6',
  },
  variantImagesContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  imageContainer: {
    marginRight: 8,
  },
  variantImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },

  // ✅ Video Thumbnail Styles
  videoThumbnailContainer: {
    position: 'relative',
    marginRight: 8,
  },
  videoThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -14 }, { translateY: -14 }],
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 14,
    padding: 2,
  },
  videoBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  videoBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  videoIconSmall: {
    backgroundColor: '#FEF3C7',
    padding: 4,
    borderRadius: 8,
  },

  // ✅ No Media Container
  noMediaContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    borderStyle: 'dashed',
  },
  noMediaText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '600',
  },

  // ✅ Variant Details
  variantDetails: {
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  variantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  fieldName: {
    fontSize: 12,
    color: '#6366F1',
    marginRight: 6,
    width: 70,
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  fieldPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 6,
  },

  // ✅ Bottom Row
  variantBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDefault: {
    backgroundColor: '#F3F4F6',
  },
  statusSelected: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusSelectedText: {
    color: '#FFFFFF',
  },
  videoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  videoIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ✅ No Variants
  noVariantsContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  noVariantsText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8,
  },
  noVariantsSubtext: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },

  // ✅ Swipe Section
  swipeSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  swipeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    width: '100%',
  },
  swipeInfoText: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '500',
    textAlign: 'center',
  },

  // ✅ Swipe Button
  swipeButtonWrapper: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
  },
  swipeButtonContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F59E0B',
    backgroundColor: '#F59E0B',
  },
  swipeRail: {
    borderRadius: 24,
  },
  swipeButtonTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ✅ Thumb Icon
  thumbIcon: {
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
  },
  thumbIconContent: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },

  // ✅ Select Prompt
  selectPromptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    borderStyle: 'dashed',
    gap: 8,
    width: '100%',
  },
  selectPromptText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  // ✅ Loading Overlay
  swipeLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    gap: 8,
  },
  swipeLoadingText: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
  },
});

// ✅ ORIGINAL STYLES (SAME AS BEFORE - NO CHANGES)
const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    zIndex: 10,
  },
  fullContainer: {
    width: '100%',
  },
  compactContainer: {
    position: 'relative',
  },
  compactAddButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 22,
    paddingVertical: 6,
    borderRadius: 6,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  compactButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  compactQuantityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 28,
    minWidth: 60,
    justifyContent: 'space-between',
  },
  compactQuantityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  addButton: {
    width: '100%',
    backgroundColor: '#ff7b00ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    right: 5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconContent: {
    flexDirection: 'row',
    left: 5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  quantityInfo: {
    flex: 1,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  variantInfoText: {
    fontSize: 12,
    color: '#059669',
    marginTop: 2,
  },
  showControlsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalQuantityContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedVariantDisplay: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  selectedVariantText: {
    fontSize: 14,
    color: '#0369A1',
    fontWeight: '500',
  },
  modalControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
    marginBottom: 16,
  },
  modalQuantityButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalQuantityDisplay: {
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalQuantityText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalRemoveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  modalRemoveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  disabledButton: {
    opacity: 0.5,
  },
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  animationBackground: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: 220,
    height: 220,
  },
});

export default AddToCart;
