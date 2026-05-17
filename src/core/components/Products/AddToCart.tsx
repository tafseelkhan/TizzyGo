import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  Vibration,
  Platform,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CART_API_URL = 'http://172.20.10.12:5000';

// Types
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
  variantId?: string;
  mrp?: number;
  price?: number;
  savedAmount?: number;
  discount?: number;
  finalPrice?: number;
  fields?: VariantField[];
  images?: string[];
  video?: string;
  combinationKey?: string;
  inStock?: boolean;
  quantityAvailable?: number;
  sku?: string;
  isDefault?: boolean;
}

export interface SelectedVariant {
  variantId: string;
  _id?: string;
  mrp?: number;
  price?: number;
  savedAmount?: number;
  discount?: number;
  finalPrice?: number;
  variantImages?: string[];
  variantVideo?: string;
  variantImage?: string;
  variantSku?: string;
  [key: string]: any;
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

// Helper functions
const isVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  const urlLower = url.toLowerCase();
  return (
    /\.(mp4|mov|webm|mkv|avi|wmv|flv|m4v)$/i.test(urlLower) ||
    urlLower.includes('/video/') ||
    urlLower.includes('video=true')
  );
};

const normalizeMedia = (
  images: string[] = [],
  video?: string,
): { type: 'image' | 'video'; url: string }[] => {
  const media: { type: 'image' | 'video'; url: string }[] = [];
  if (images && Array.isArray(images)) {
    images.forEach(img => {
      if (img && img.trim() !== '') {
        media.push({ type: 'image', url: img });
      }
    });
  }
  if (video && video.trim() !== '') {
    media.unshift({ type: 'video', url: video });
  }
  return media;
};

const formatPrice = (price: number): string => {
  return `₹${price.toLocaleString('en-IN')}`;
};

// API Functions
export const fetchProductVariants = async (
  productId: string,
): Promise<ProductVariant[]> => {
  try {
    const response = await fetch(
      `${CART_API_URL}/api/products/${productId}/variants`,
    );
    if (!response.ok) throw new Error('Failed to fetch variants');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching variants:', error);
    return [];
  }
};

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

    const requestBody: any = { productId, productData, quantity };
    if (selectedVariant && Object.keys(selectedVariant).length > 0) {
      requestBody.selectedVariant = selectedVariant;
    }

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

    const requestBody: any = { productId, quantity };
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
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) throw new Error('Failed to fetch cart status');
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
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const themeColors = {
    primary: '#F59E0B',
    primaryLight: '#FBBF24',
    success: '#10B981',
    danger: '#EF4444',
    dark: isDark ? '#F1F5F9' : '#1A1A2E',
    light: isDark ? '#1E293B' : '#F8F9FA',
    gray: isDark ? '#94A3B8' : '#6C757D',
    white: isDark ? '#0F172A' : '#FFFFFF',
    modalBg: isDark ? '#1E293B' : '#FFFFFF',
    modalBorder: isDark ? '#334155' : '#f3f4f6',
    textPrimary: isDark ? '#F1F5F9' : '#1A1A2E',
    textSecondary: isDark ? '#CBD5E1' : '#485696',
    cardBg: isDark ? '#1E293B' : '#FFFFFF',
    borderColor: isDark ? '#334155' : '#E5E7EB',
    videoBg: isDark ? '#1E293B' : '#E6F7F1',
  };

  const [cartState, setCartState] = useState<CartState>({
    isInCart: initialIsInCart,
    quantity: initialQuantity,
    isLoading: false,
    isAdding: false,
  });

  const [variants, setVariants] = useState<ProductVariant[]>(
    propVariants || [],
  );
  const [selectedVariant, setSelectedVariant] =
    useState<SelectedVariant | null>(propSelectedVariant);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<
    number | null
  >(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [showAnim, setShowAnim] = useState<'success' | 'failed' | null>(null);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [isModalInitialized, setIsModalInitialized] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const modalOpenRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize modal when opened
  useEffect(() => {
    if (showVariantModal && !isModalInitialized) {
      setIsModalInitialized(true);
    }
  }, [showVariantModal, isModalInitialized]);

  // Load variants
  useEffect(() => {
    const loadVariants = async () => {
      if ((!propVariants || propVariants.length === 0) && productId) {
        setVariantsLoading(true);
        try {
          const fetchedVariants = await fetchProductVariants(productId);
          if (isMountedRef.current) setVariants(fetchedVariants || []);
        } catch (error) {
          console.error('Error loading variants:', error);
        } finally {
          if (isMountedRef.current) setVariantsLoading(false);
        }
      } else {
        setVariants(propVariants || []);
      }
    };
    loadVariants();
  }, [productId, propVariants]);

  // Fetch cart status
  useEffect(() => {
    const checkCartStatus = async () => {
      const cartStatus = await fetchCart(productId);
      if (cartStatus && isMountedRef.current) {
        setCartState(prev => ({
          ...prev,
          isInCart: cartStatus.inCart,
          quantity: cartStatus.quantity,
        }));
        if (cartStatus.selectedVariant) {
          setSelectedVariant(cartStatus.selectedVariant);
          onVariantSelect(cartStatus.selectedVariant);
        }
      }
    };
    if (variants && variants.length > 0) checkCartStatus();
  }, [productId, variants.length]);

  const triggerVibration = () => {
    if (Platform.OS === 'ios') Vibration.vibrate([0, 30, 0, 30]);
    else Vibration.vibrate(300);
  };

  // Handle variant selection
  const handleVariantSelect = useCallback(
    (variantIndex: number) => {
      triggerVibration();
      if (!variants || !variants.length || variantIndex >= variants.length)
        return;

      const selectedVariantObj = variants[variantIndex];
      if (!selectedVariantObj) return;

      const variantIdToUse: string =
        selectedVariantObj.variantId || selectedVariantObj._id || '';

      const newVariant: SelectedVariant = {
        variantId: variantIdToUse,
        _id: selectedVariantObj._id,
        mrp: selectedVariantObj.mrp || 0,
        price: selectedVariantObj.price || 0,
        savedAmount: selectedVariantObj.savedAmount || 0,
        discount: selectedVariantObj.discount || 0,
        finalPrice:
          selectedVariantObj.finalPrice || selectedVariantObj.price || 0,
      };

      if (
        selectedVariantObj.fields &&
        Array.isArray(selectedVariantObj.fields)
      ) {
        selectedVariantObj.fields.forEach((field: VariantField) => {
          newVariant[field.name] = field.value;
          if (field.image) newVariant.variantImage = field.image;
          if (field.sku) newVariant.variantSku = field.sku;
        });
      }

      if (selectedVariantObj.images?.length)
        newVariant.variantImages = selectedVariantObj.images;
      if (selectedVariantObj.video)
        newVariant.variantVideo = selectedVariantObj.video;

      setSelectedVariantIndex(variantIndex);
      setSelectedVariant(newVariant);
      onVariantSelect(newVariant);
    },
    [variants, onVariantSelect],
  );

  const isVariantSelected = (): boolean =>
    selectedVariantIndex !== null && selectedVariant !== null;
  const hasVariants = (): boolean => variants && variants.length > 0;

  // Render variant media thumbnails
  const renderVariantMedia = (variant: ProductVariant, index: number) => {
    const media = normalizeMedia(variant.images || [], variant.video);

    if (media.length === 0) {
      return (
        <View
          style={[styles.emptyMedia, { backgroundColor: themeColors.light }]}
        >
          <Icon name="image-not-supported" size={28} color={themeColors.gray} />
          <Text style={[styles.emptyMediaText, { color: themeColors.gray }]}>
            No media
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.variantMediaScroll}
        contentContainerStyle={styles.variantMediaContent}
      >
        {media.map((item, mediaIndex) => {
          const isVideo = isVideoUrl(item.url);
          return (
            <View key={`media-${index}-${mediaIndex}`} style={styles.mediaItem}>
              {isVideo ? (
                <View
                  style={[
                    styles.variantVideoThumb,
                    {
                      backgroundColor: themeColors.videoBg,
                      borderColor: themeColors.primary,
                    },
                  ]}
                >
                  <Ionicons
                    name="play-circle"
                    size={36}
                    color={themeColors.primary}
                  />
                  <View style={styles.videoOverlayBadge}>
                    <Text style={styles.videoBadgeSmallText}>VIDEO</Text>
                  </View>
                </View>
              ) : (
                <Image
                  source={{ uri: item.url }}
                  style={styles.variantMediaImage}
                  resizeMode="cover"
                />
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  // Render product header in modal
  const renderProductHeader = () => {
    const productImages = productData?.images || [];
    const productVideo = productData?.video;
    const media = normalizeMedia(productImages, productVideo);
    const firstMedia = media[0];

    return (
      <View style={styles.productHeader}>
        {firstMedia && (
          <View style={styles.productMediaContainer}>
            {firstMedia.type === 'video' ? (
              <View style={styles.productVideoContainer}>
                <Ionicons
                  name="play-circle"
                  size={64}
                  color={themeColors.primary}
                />
                <View style={styles.videoBadgeLarge}>
                  <Ionicons name="videocam" size={16} color="#fff" />
                  <Text style={styles.videoBadgeLargeText}>VIDEO</Text>
                </View>
              </View>
            ) : (
              <Image
                source={{ uri: firstMedia.url }}
                style={styles.productImage}
                resizeMode="cover"
              />
            )}
          </View>
        )}

        <View style={styles.productInfo}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.productTitle, { color: themeColors.textPrimary }]}
              numberOfLines={2}
            >
              {productData?.title || 'Product'}
            </Text>
            {productData?.verified === true && (
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons
                  name="verified"
                  size={18}
                  color={themeColors.primary}
                />
                <Text
                  style={[styles.verifiedText, { color: themeColors.primary }]}
                >
                  Verified
                </Text>
              </View>
            )}
          </View>

          {productData?.brand && (
            <View style={styles.brandRow}>
              <Icon name="business" size={16} color={themeColors.gray} />
              <Text
                style={[styles.brandText, { color: themeColors.textSecondary }]}
              >
                {productData.brand}
              </Text>
            </View>
          )}

          {productData?.description && (
            <Text
              style={[
                styles.productDescription,
                { color: themeColors.textSecondary },
              ]}
              numberOfLines={3}
            >
              {productData.description}
            </Text>
          )}
        </View>
      </View>
    );
  };

  // Add to cart handler
  const handleAddToCart = async () => {
    if (!productAvailable) {
      setShowAnim('failed');
      Alert.alert('Out of Stock', 'This product is currently out of stock');
      return;
    }

    if (hasVariants() && !isVariantSelected()) {
      setShowVariantModal(true);
      return;
    }

    setCartState(prev => ({ ...prev, isAdding: true }));

    try {
      const success = await addToCart({
        productId,
        productData,
        quantity: 1,
        selectedVariant: hasVariants() ? selectedVariant : null,
      });

      if (success && isMountedRef.current) {
        setCartState({
          isInCart: true,
          quantity: 1,
          isLoading: false,
          isAdding: false,
        });
        setShowAnim('success');
        onAddToCartSuccess();
        setTimeout(() => showQuantityController(), 800);
      } else {
        setCartState(prev => ({ ...prev, isAdding: false }));
        setShowAnim('failed');
      }
    } catch {
      setCartState(prev => ({ ...prev, isAdding: false }));
      setShowAnim('failed');
    }
  };

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

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > maxQuantity) return;
    setCartState(prev => ({ ...prev, isLoading: true }));
    const success = await updateCartItem({
      productId,
      quantity: newQuantity,
      selectedVariant: hasVariants() ? selectedVariant : null,
    });
    if (success && isMountedRef.current) {
      setCartState(prev => ({
        ...prev,
        quantity: newQuantity,
        isLoading: false,
      }));
      setShowAnim('success');
    } else {
      setCartState(prev => ({ ...prev, isLoading: false }));
      setShowAnim('failed');
    }
  };

  const handleRemoveFromCart = async () => {
    setCartState(prev => ({ ...prev, isLoading: true }));
    const success = await removeFromCart(productId);
    if (success && isMountedRef.current) {
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

  const handleModalClose = useCallback(() => {
    setShowVariantModal(false);
    setIsModalInitialized(false);
  }, []);

  const getButtonText = (): string => {
    if (!productAvailable) return 'Out of Stock';
    if (cartState.isAdding) return 'Adding...';
    if (hasVariants() && !isVariantSelected()) return 'Add to Cart';
    return 'Add to Cart';
  };

  // Render Variant Info Section with all details
  const renderVariantInfo = (variant: ProductVariant) => {
    const inStock = variant.inStock === true;
    const quantityAvailable = variant.quantityAvailable || 0;
    const sku = variant.sku || 'N/A';
    const combinationKey = variant.combinationKey || 'N/A';

    return (
      <View style={styles.variantInfoContainer}>
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <MaterialCommunityIcons
              name={inStock ? 'check-circle' : 'alert-circle'}
              size={16}
              color={inStock ? themeColors.success : themeColors.danger}
            />
          </View>
          <Text
            style={[styles.infoLabel, { color: themeColors.textSecondary }]}
          >
            Stock Status:
          </Text>
          <Text
            style={[
              styles.infoValue,
              {
                color: inStock ? themeColors.success : themeColors.danger,
                fontWeight: '600',
              },
            ]}
          >
            {inStock ? 'In Stock' : 'Out of Stock'}
          </Text>
        </View>

        {inStock && quantityAvailable > 0 && (
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <MaterialCommunityIcons
                name="package-variant"
                size={16}
                color={themeColors.primary}
              />
            </View>
            <Text
              style={[styles.infoLabel, { color: themeColors.textSecondary }]}
            >
              Quantity Available:
            </Text>
            <Text
              style={[
                styles.infoValue,
                { color: themeColors.textPrimary, fontWeight: '600' },
              ]}
            >
              {quantityAvailable} units
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <MaterialCommunityIcons
              name="barcode"
              size={16}
              color={themeColors.primary}
            />
          </View>
          <Text
            style={[styles.infoLabel, { color: themeColors.textSecondary }]}
          >
            SKU:
          </Text>
          <Text
            style={[
              styles.infoValue,
              { color: themeColors.textPrimary, fontSize: 11, flex: 1 },
            ]}
            numberOfLines={1}
          >
            {sku}
          </Text>
        </View>

        {combinationKey !== 'N/A' && (
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <MaterialCommunityIcons
                name="link-variant"
                size={16}
                color={themeColors.primary}
              />
            </View>
            <Text
              style={[styles.infoLabel, { color: themeColors.textSecondary }]}
            >
              Combo Key:
            </Text>
            <Text
              style={[
                styles.infoValue,
                { color: themeColors.textPrimary, fontSize: 10, flex: 1 },
              ]}
              numberOfLines={2}
            >
              {combinationKey}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render Variant Modal - FULL SCREEN with BuyNow-like header and close button
  const renderVariantModal = () => (
    <Modal
      visible={showVariantModal}
      transparent={false}
      animationType="slide"
      onRequestClose={handleModalClose}
    >
      <SafeAreaView
        style={[
          styles.fullScreenModal,
          { backgroundColor: themeColors.modalBg },
        ]}
      >
        {/* Modal Header - Same as BuyNow */}
        <View
          style={[
            styles.modalHeader,
            {
              borderBottomColor: themeColors.modalBorder,
              backgroundColor: themeColors.modalBg,
            },
          ]}
        >
          <Text style={[styles.modalTitle, { color: themeColors.textPrimary }]}>
            Choose your option
          </Text>
          <TouchableOpacity
            onPress={handleModalClose}
            style={[styles.closeButton, { backgroundColor: themeColors.light }]}
          >
            <Icon name="close" size={24} color={themeColors.dark} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.modalScrollContent}
        >
          {/* Product Header */}
          {renderProductHeader()}

          {/* Variants List */}
          {variantsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColors.primary} />
              <Text style={[styles.loadingText, { color: themeColors.gray }]}>
                Loading options...
              </Text>
            </View>
          ) : (
            <>
              <Text
                style={[
                  styles.variantCount,
                  { color: themeColors.textPrimary },
                ]}
              >
                {variants?.length || 0} variant
                {(variants?.length || 0) !== 1 ? 's' : ''} available
              </Text>

              {variants && Array.isArray(variants) && variants.length > 0 ? (
                variants.map((variant: ProductVariant, index: number) => {
                  const isSelected = selectedVariantIndex === index;
                  const finalPrice = variant.finalPrice || variant.price || 0;
                  const mrp = variant.mrp || 0;
                  const discount =
                    variant.discount ||
                    (mrp > finalPrice
                      ? Math.round(((mrp - finalPrice) / mrp) * 100)
                      : 0);
                  const inStock = variant.inStock === true;

                  return (
                    <TouchableOpacity
                      key={`variant-${
                        variant.variantId || variant._id || index
                      }`}
                      style={[
                        styles.variantCard,
                        {
                          backgroundColor: themeColors.cardBg,
                          borderColor: themeColors.borderColor,
                          opacity: !inStock ? 0.6 : 1,
                        },
                        isSelected && styles.variantCardSelected,
                      ]}
                      onPress={() => inStock && handleVariantSelect(index)}
                      activeOpacity={inStock ? 0.7 : 1}
                      disabled={!inStock}
                    >
                      {isSelected && (
                        <View
                          style={[
                            styles.selectedBadge,
                            { backgroundColor: themeColors.primary },
                          ]}
                        >
                          <Icon name="check" size={16} color="#fff" />
                        </View>
                      )}
                      {!inStock && (
                        <View style={styles.outOfStockOverlay}>
                          <Text style={styles.outOfStockText}>
                            OUT OF STOCK
                          </Text>
                        </View>
                      )}
                      {renderVariantMedia(variant, index)}
                      <View
                        style={[
                          styles.variantDetails,
                          { backgroundColor: themeColors.cardBg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.variantName,
                            { color: themeColors.textPrimary },
                          ]}
                        >
                          Option {index + 1}
                        </Text>

                        {variant.fields &&
                          Array.isArray(variant.fields) &&
                          variant.fields.map(
                            (field: VariantField, fieldIndex: number) => (
                              <View
                                key={`field-${fieldIndex}-${index}`}
                                style={styles.fieldRow}
                              >
                                <Text
                                  style={[
                                    styles.fieldName,
                                    { color: themeColors.textSecondary },
                                  ]}
                                >
                                  {field.name}:
                                </Text>
                                <Text
                                  style={[
                                    styles.fieldValue,
                                    { color: themeColors.textPrimary },
                                  ]}
                                >
                                  {field.value}
                                </Text>
                              </View>
                            ),
                          )}

                        <View style={styles.priceSection}>
                          <View style={styles.priceRow}>
                            <Text
                              style={[
                                styles.finalPrice,
                                { color: themeColors.primary },
                              ]}
                            >
                              {formatPrice(finalPrice)}
                            </Text>
                            {mrp > finalPrice && (
                              <>
                                <Text
                                  style={[
                                    styles.originalPrice,
                                    { color: themeColors.gray },
                                  ]}
                                >
                                  {formatPrice(mrp)}
                                </Text>
                                <View style={styles.discountBadge}>
                                  <Text style={styles.discountText}>
                                    {discount}% OFF
                                  </Text>
                                </View>
                              </>
                            )}
                          </View>
                          {variant.savedAmount && variant.savedAmount > 0 && (
                            <Text
                              style={[
                                styles.savedText,
                                { color: themeColors.success },
                              ]}
                            >
                              You save {formatPrice(variant.savedAmount)}
                            </Text>
                          )}
                        </View>

                        <View
                          style={[
                            styles.itemDivider,
                            { backgroundColor: themeColors.borderColor },
                          ]}
                        />

                        {renderVariantInfo(variant)}

                        <View
                          style={[
                            styles.variantStatus,
                            isSelected
                              ? styles.statusSelected
                              : styles.statusAvailable,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              isSelected && styles.statusTextSelected,
                            ]}
                          >
                            {isSelected
                              ? '✓ Selected'
                              : inStock
                              ? 'Tap to select'
                              : 'Out of Stock'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Icon name="inventory" size={48} color={themeColors.gray} />
                  <Text
                    style={[
                      styles.emptyStateText,
                      { color: themeColors.gray, marginTop: 12 },
                    ]}
                  >
                    No variants available
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Footer with Confirm Button - Yellow */}
        <View
          style={[
            styles.modalFooter,
            {
              backgroundColor: themeColors.modalBg,
              borderTopColor: themeColors.modalBorder,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              if (isVariantSelected()) {
                handleAddToCart();
                setShowVariantModal(false);
              }
            }}
            style={[
              styles.confirmButton,
              {
                backgroundColor: isVariantSelected()
                  ? themeColors.primary
                  : '#9CA3AF',
                shadowColor: isVariantSelected()
                  ? themeColors.primary
                  : '#9CA3AF',
              },
              !isVariantSelected() && styles.disabledButton,
            ]}
            disabled={!isVariantSelected() || cartState.isAdding}
            activeOpacity={0.8}
          >
            {cartState.isAdding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="cart-plus"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.confirmButtonText}>
                  {isVariantSelected() ? 'CONFIRM & ADD TO CART' : 'SELECT AN OPTION'}
                </Text>
                {isVariantSelected() && (
                  <FontAwesome5 name="arrow-right" size={14} color="#fff" />
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  // Compact version
  if (compact) {
    return (
      <>
        {renderVariantModal()}
        {!cartState.isInCart ? (
          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={cartState.isAdding || productLoading || !productAvailable}
            style={[
              styles.compactAddButton,
              { backgroundColor: themeColors.primary },
              (!productAvailable || cartState.isAdding) &&
                styles.disabledButton,
            ]}
          >
            {cartState.isAdding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.compactButtonText}>{getButtonText()}</Text>
            )}
          </TouchableOpacity>
        ) : (
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
                style={[
                  styles.compactQuantityText,
                  { color: themeColors.textPrimary },
                ]}
              >
                {cartState.quantity}
              </Text>
              <Icon
                name="keyboard-arrow-down"
                size={16}
                color={themeColors.gray}
              />
            </TouchableOpacity>
            {/* Quantity Modal */}
            <Modal
              visible={showQuantityModal}
              transparent
              animationType="fade"
              onRequestClose={hideQuantityController}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={hideQuantityController}
              >
                <Animated.View
                  style={[
                    styles.modalContent,
                    {
                      transform: [
                        {
                          translateY: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [300, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.modalQuantityContainer,
                      { transform: [{ scale: scaleAnim }] },
                      { backgroundColor: themeColors.modalBg },
                    ]}
                  >
                    <View style={styles.modalHeader}>
                      <Text
                        style={[
                          styles.modalTitle,
                          { color: themeColors.textPrimary },
                        ]}
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
                        onPress={() =>
                          handleQuantityChange(cartState.quantity - 1)
                        }
                        disabled={
                          cartState.isLoading || cartState.quantity <= 1
                        }
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
                              { color: themeColors.textPrimary },
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
                          cartState.isLoading ||
                          cartState.quantity >= maxQuantity
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
                        { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
                        cartState.isLoading && styles.disabledButton,
                      ]}
                    >
                      <Icon name="delete-outline" size={20} color="#DC2626" />
                      <Text style={styles.modalRemoveText}>
                        Remove from Cart
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>
              </TouchableOpacity>
            </Modal>
          </View>
        )}
      </>
    );
  }

  // Full version
  return (
    <View style={[styles.container, style]}>
      {renderVariantModal()}
      <Modal
        visible={showAnim !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAnim(null)}
      >
        <View style={styles.animationContainer}>
          <View style={styles.animationBackground}>
            <LottieView
              source={
                showAnim === 'success'
                  ? require('../animations/lotties/Success.json')
                  : require('../animations/lotties/Failed.json')
              }
              autoPlay
              loop={false}
              style={styles.animation}
              onAnimationFinish={() => setShowAnim(null)}
            />
          </View>
        </View>
      </Modal>
      {!cartState.isInCart ? (
        <TouchableOpacity
          onPress={handleAddToCart}
          disabled={cartState.isAdding || productLoading || !productAvailable}
          style={[
            styles.buyNowButton,
            {
              backgroundColor: themeColors.primary,
              shadowColor: themeColors.primary,
            },
            (!productAvailable || cartState.isAdding) && styles.disabledButton,
          ]}
          activeOpacity={0.7}
        >
          {cartState.isAdding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="cart-plus" size={18} color="#fff" />
              <Text style={styles.buttonText}>{getButtonText()}</Text>
              <FontAwesome5 name="arrow-right" size={14} color="#fff" />
            </>
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
            <View>
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
            transparent
            animationType="fade"
            onRequestClose={hideQuantityController}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={hideQuantityController}
            >
              <Animated.View
                style={[
                  styles.modalContent,
                  {
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [300, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.modalQuantityContainer,
                    { transform: [{ scale: scaleAnim }] },
                    { backgroundColor: themeColors.modalBg },
                  ]}
                >
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
                            { color: themeColors.textPrimary },
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
                      { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
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

const styles = StyleSheet.create({
  container: { width: '100%', position: 'relative', zIndex: 10 },
  fullContainer: { width: '100%' },
  compactContainer: { position: 'relative' },
  compactAddButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 22,
    paddingVertical: 6,
    borderRadius: 50,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  compactButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  compactQuantityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    height: 28,
    minWidth: 60,
    justifyContent: 'space-between',
  },
  compactQuantityText: { fontSize: 12, fontWeight: '600' },
  buyNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 50,
    gap: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  iconContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  quantityText: { fontSize: 14, fontWeight: '500' },
  showControlsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalQuantityContainer: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    flex: 1,
    marginLeft: 15,
  },
  modalControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    marginBottom: 16,
  },
  modalQuantityButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  modalQuantityDisplay: {
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalQuantityText: { fontSize: 20, fontWeight: '600' },
  modalRemoveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  modalRemoveText: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
  disabledButton: { opacity: 0.5 },
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  animationBackground: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: { width: 220, height: 220 },

  // Full Screen Modal Styles
  fullScreenModal: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  productHeader: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  productMediaContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#F3F4F6',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productVideoContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6F7F1',
  },
  videoBadgeLarge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  videoBadgeLargeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  productInfo: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '500',
  },
  productDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  variantCount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  variantCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  variantCardSelected: {
    borderWidth: 2,
    borderColor: '#F59E0B',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderRadius: 16,
  },
  outOfStockText: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
  variantMediaScroll: { maxHeight: 100 },
  variantMediaContent: { padding: 12, gap: 8 },
  mediaItem: { marginRight: 8 },
  variantMediaImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  variantVideoThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  videoOverlayBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoBadgeSmallText: { fontSize: 8, fontWeight: '700', color: '#fff' },
  emptyMedia: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 12,
  },
  emptyMediaText: { fontSize: 10, marginTop: 4 },
  variantDetails: { padding: 16 },
  variantName: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  fieldName: { fontSize: 12, width: 80, fontWeight: '500' },
  fieldValue: { fontSize: 13, fontWeight: '500', flex: 1 },
  priceSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  finalPrice: { fontSize: 18, fontWeight: '700', color: '#F59E0B' },
  originalPrice: { fontSize: 13, textDecorationLine: 'line-through' },
  discountBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  savedText: { fontSize: 11, marginTop: 4 },
  itemDivider: {
    height: 1,
    marginVertical: 10,
  },
  variantInfoContainer: {
    marginTop: 10,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  infoIcon: {
    width: 20,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
  },
  variantStatus: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusAvailable: { backgroundColor: '#F3F4F6' },
  statusSelected: { backgroundColor: '#F59E0B' },
  statusText: { fontSize: 12, fontWeight: '600' },
  statusTextSelected: { color: '#fff' },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 150,
    gap: 12,
  },
  loadingText: { fontSize: 14, fontWeight: '500' },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 50,
    gap: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  emptyStateContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default AddToCart;
