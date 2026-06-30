// components/BuyNow.tsx - FINAL VERSION with variantId

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  View,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  useSafeAreaInsets,
  SafeAreaView,
} from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme } from '../../../contexts/theme/ThemeContext';

import {
  ProductVariant,
  SelectedVariant,
  BuyNowProps,
  RootStackParamList,
  ThemeColors,
} from '../../../types/BuyNowTypes';

import {
  fetchProductVariants,
  processBuyNowCheckout,
} from '../../../services/buyers/store/buynowServices';

import {
  normalizeMedia,
  formatPrice,
  triggerVibration,
  createSelectedVariant,
  calculateDiscount,
  getVariantStockStatus,
} from '../../../utils/buyers/store/buynowUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const getThemeColors = (isDark: boolean): ThemeColors => {
  return {
    primary: '#10B981',
    primaryLight: '#34D399',
    primaryDark: '#059669',
    success: '#10B981',
    danger: '#EF4444',
    dark: isDark ? '#F1F5F9' : '#1A1A2E',
    light: isDark ? '#1E293B' : '#F8F9FA',
    gray: isDark ? '#94A3B8' : '#6C757D',
    white: isDark ? '#0F172A' : '#FFFFFF',
    black: isDark ? '#F1F5F9' : '#000000',
    cardHover: isDark ? '#1E293B' : '#ECFDF5',
    modalBg: isDark ? '#1E293B' : '#FFFFFF',
    modalBorder: isDark ? '#334155' : '#f3f4f6',
    textPrimary: isDark ? '#F1F5F9' : '#1A1A2E',
    textSecondary: isDark ? '#CBD5E1' : '#485696',
    cardBg: isDark ? '#1E293B' : '#FFFFFF',
    borderColor: isDark ? '#334155' : '#E5E7EB',
    shadowColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)',
    infoBg: isDark ? '#1E293B' : '#ECFDF5',
    infoBorder: isDark ? '#334155' : '#D1FAE5',
    videoBg: isDark ? '#1E293B' : '#ECFDF5',
    badgeBg: '#10B981',
    stockBg: isDark ? '#451A03' : '#FEF3C7',
    stockText: '#D97706',
    inStockBg: isDark ? '#064E3B' : '#D1FAE5',
    inStockText: '#059669',
  };
};

const BuyNow: React.FC<BuyNowProps> = ({
  product,
  productLoading = false,
  productAvailable = true,
  variants: propVariants = [],
  selectedVariant: propSelectedVariant = null,
  onVariantSelect = () => {},
}) => {
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] =
    useState<SelectedVariant | null>(propSelectedVariant);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<
    number | null
  >(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>(
    propVariants && Array.isArray(propVariants) ? propVariants : [],
  );
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [isModalInitialized, setIsModalInitialized] = useState(false);

  const isMountedRef = useRef(true);
  const modalOpenedRef = useRef(false);

  const productId = product?._id || product?.id;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const loadVariants = async () => {
      if ((!propVariants || propVariants.length === 0) && product?.id) {
        setVariantsLoading(true);
        try {
          const fetchedVariants = await fetchProductVariants(product.id);
          if (
            isMountedRef.current &&
            fetchedVariants &&
            Array.isArray(fetchedVariants)
          ) {
            setVariants(fetchedVariants);
          } else if (isMountedRef.current) {
            setVariants([]);
          }
        } catch (error) {
          console.error('Error loading variants:', error);
          if (isMountedRef.current) setVariants([]);
        } finally {
          if (isMountedRef.current) setVariantsLoading(false);
        }
      } else if (
        propVariants &&
        Array.isArray(propVariants) &&
        propVariants.length > 0
      ) {
        if (
          isMountedRef.current &&
          JSON.stringify(variants) !== JSON.stringify(propVariants)
        ) {
          setVariants(propVariants);
        }
      }
    };
    loadVariants();
  }, [product?.id, propVariants]);

  const handleVariantSelect = useCallback(
    (variantIndex: number) => {
      triggerVibration();

      if (
        !variants ||
        !Array.isArray(variants) ||
        variantIndex >= variants.length
      )
        return;

      const selectedVariantObj = variants[variantIndex];
      if (!selectedVariantObj) return;

      const newVariant = createSelectedVariant(
        selectedVariantObj,
        variantIndex,
      );

      if (newVariant && isMountedRef.current) {
        setSelectedVariantIndex(variantIndex);
        setSelectedVariant(newVariant);
        onVariantSelect(newVariant);
      }
    },
    [variants, onVariantSelect],
  );

  const isVariantSelected = useCallback(() => {
    return (
      (selectedVariantIndex !== null || selectedVariant !== null) &&
      selectedVariant !== null
    );
  }, [selectedVariantIndex, selectedVariant]);

  const hasVariants = useCallback(() => {
    return variants && Array.isArray(variants) && variants.length > 0;
  }, [variants]);

  const handleProceedToCheckout = useCallback(async () => {
    if (!product || !productId) {
      Alert.alert('Error', 'Product data missing!');
      return;
    }

    if (!productAvailable) {
      Alert.alert('Error', 'Product not available!');
      return;
    }

    setLoading(true);

    try {
      const result = await processBuyNowCheckout(product, selectedVariant);

      if (!result.success) {
        Alert.alert('Error', result.error || 'Something went wrong!');
        setLoading(false);
        return;
      }

      setShowVariantModal(false);

      // ✅ FIX: Sirf variantId pass karo
      navigation.navigate('BuyNow', {
        productId: productId,
        variantId: selectedVariant?.variantId || null,
      });
    } catch (err: any) {
      Alert.alert('Error', 'Failed to process buy now!');
    } finally {
      setLoading(false);
    }
  }, [product, productId, productAvailable, selectedVariant, navigation]);

  const handleBuyNowClick = useCallback(() => {
    if (!product || !productId) {
      Alert.alert('Error', 'Product data missing!');
      return;
    }

    if (!productAvailable) {
      Alert.alert('Error', 'Product not available!');
      return;
    }

    if (hasVariants()) {
      setSelectedVariantIndex(null);
      setSelectedVariant(null);
      setShowVariantModal(true);
      return;
    }

    handleProceedToCheckout();
  }, [
    product,
    productId,
    productAvailable,
    hasVariants,
    handleProceedToCheckout,
  ]);

  const handleModalClose = useCallback(() => {
    setShowVariantModal(false);
    setIsModalInitialized(false);
    modalOpenedRef.current = false;
  }, []);

  useEffect(() => {
    if (showVariantModal && !isModalInitialized) {
      modalOpenedRef.current = true;
      setIsModalInitialized(true);
    }
  }, [showVariantModal, isModalInitialized]);

  const isVariantSelectedInModal = useCallback(
    (variantIndex: number) => {
      if (!modalOpenedRef.current) return false;
      if (selectedVariantIndex !== null)
        return selectedVariantIndex === variantIndex;
      if (selectedVariant && variants && Array.isArray(variants)) {
        const variantData = variants[variantIndex];
        const variantIdFromData = variantData?.variantId || variantData?._id;
        return (
          variantIdFromData !== undefined &&
          (selectedVariant.variantId === variantIdFromData ||
            selectedVariant._id === variantIdFromData)
        );
      }
      return false;
    },
    [selectedVariantIndex, selectedVariant, variants],
  );

  const renderVariantMedia = (variant: ProductVariant, index: number) => {
    const images = variant.images || [];
    const video = variant.video;
    const media = normalizeMedia(images, video);

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
        {media.map((item, mediaIndex) => (
          <View key={`media-${index}-${mediaIndex}`} style={styles.mediaItem}>
            {item.type === 'video' ? (
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
        ))}
      </ScrollView>
    );
  };

  const renderVariantInfo = (variant: ProductVariant) => {
    const { inStock, availableQuantity } = getVariantStockStatus(variant);
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

        {inStock && availableQuantity > 0 && (
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
              {availableQuantity} units
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

  const renderProductHeader = () => {
    const productImages = product?.images || [];
    const productVideo = product?.video;
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
              {product?.title || 'Product'}
            </Text>
            {product?.verified === true && (
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

          {product?.brand && (
            <View style={styles.brandRow}>
              <Icon name="business" size={16} color={themeColors.gray} />
              <Text
                style={[styles.brandText, { color: themeColors.textSecondary }]}
              >
                {product.brand}
              </Text>
            </View>
          )}

          {product?.description && (
            <Text
              style={[
                styles.productDescription,
                { color: themeColors.textSecondary },
              ]}
              numberOfLines={3}
            >
              {product.description}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderVariantCard = (variant: ProductVariant, index: number) => {
    const isSelected = isVariantSelectedInModal(index);
    const finalPrice = variant.finalPrice ?? variant.price ?? 0;
    const mrp = variant.mrp ?? 0;
    const discount = variant.discount || calculateDiscount(mrp, finalPrice);
    const savedAmount = variant.savedAmount ?? 0;
    const { inStock } = getVariantStockStatus(variant);

    return (
      <TouchableOpacity
        key={`variant-${variant.variantId || variant._id || index}`}
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
            <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
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
            style={[styles.variantName, { color: themeColors.textPrimary }]}
          >
            Option {index + 1}
          </Text>

          {variant.fields &&
            Array.isArray(variant.fields) &&
            variant.fields.length > 0 && (
              <View style={styles.fieldsContainer}>
                {variant.fields.map((field, fieldIndex) => (
                  <View
                    key={`field-${index}-${fieldIndex}`}
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
                ))}
              </View>
            )}

          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={[styles.finalPrice, { color: themeColors.primary }]}>
                {formatPrice(finalPrice)}
              </Text>
              {mrp > finalPrice && (
                <>
                  <Text
                    style={[styles.originalPrice, { color: themeColors.gray }]}
                  >
                    {formatPrice(mrp)}
                  </Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{discount}% OFF</Text>
                  </View>
                </>
              )}
            </View>
            {savedAmount > 0 && (
              <Text style={[styles.savedText, { color: themeColors.success }]}>
                You save {formatPrice(savedAmount)}
              </Text>
            )}
          </View>

          {renderVariantInfo(variant)}

          <View
            style={[
              styles.variantStatus,
              isSelected ? styles.statusSelected : styles.statusAvailable,
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
  };

  const variantsCount =
    variants && Array.isArray(variants) ? variants.length : 0;

  return (
    <>
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
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: themeColors.modalBorder },
            ]}
          >
            <Text
              style={[styles.modalTitle, { color: themeColors.textPrimary }]}
            >
              Choose your option
            </Text>
            <TouchableOpacity
              onPress={handleModalClose}
              style={[
                styles.closeButton,
                { backgroundColor: themeColors.light },
              ]}
            >
              <Icon name="close" size={24} color={themeColors.dark} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            {renderProductHeader()}

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
                  {variantsCount} variant{variantsCount !== 1 ? 's' : ''}{' '}
                  available
                </Text>

                {variants && Array.isArray(variants) && variants.length > 0 ? (
                  variants.map((variant, index) =>
                    renderVariantCard(variant, index),
                  )
                ) : (
                  <View style={styles.noVariantsContainer}>
                    <Icon name="inventory" size={64} color={themeColors.gray} />
                    <Text style={styles.noVariantsText}>
                      No variants available
                    </Text>
                    <Text style={styles.noVariantsSubtext}>
                      Proceed with basic product
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

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
              onPress={handleProceedToCheckout}
              disabled={loading || (hasVariants() && !isVariantSelected())}
              style={[
                styles.confirmButton,
                {
                  backgroundColor:
                    hasVariants() && !isVariantSelected()
                      ? '#9CA3AF'
                      : themeColors.primary,
                  shadowColor:
                    hasVariants() && !isVariantSelected()
                      ? '#9CA3AF'
                      : themeColors.primary,
                },
              ]}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome5 name="shopping-bag" size={20} color="#fff" />
                  <Text style={styles.confirmButtonText}>
                    {hasVariants() && !isVariantSelected()
                      ? 'SELECT AN OPTION'
                      : 'CONFIRM & BUY NOW'}
                  </Text>
                  {(!hasVariants() || isVariantSelected()) && (
                    <FontAwesome5 name="arrow-right" size={14} color="#fff" />
                  )}
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <TouchableOpacity
        onPress={handleBuyNowClick}
        disabled={loading || productLoading || !productAvailable || !product}
        style={[
          styles.buyNowButton,
          {
            backgroundColor:
              !productAvailable || loading || productLoading || !product
                ? '#9CA3AF'
                : themeColors.primary,
            shadowColor:
              !productAvailable || loading || productLoading || !product
                ? '#9CA3AF'
                : themeColors.primary,
          },
        ]}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <FontAwesome5 name="bolt" size={18} color="#fff" />
            <Text style={styles.buttonText}>BUY NOW</Text>
            <FontAwesome5 name="arrow-right" size={14} color="#fff" />
          </>
        )}
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  fullScreenModal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  closeButton: { padding: 8, borderRadius: 20 },
  modalScrollContent: { padding: 20, paddingBottom: 100 },
  productHeader: {
    marginBottom: 24,
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
  productImage: { width: '100%', height: '100%' },
  productVideoContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadgeLarge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  videoBadgeLargeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  productInfo: { padding: 16 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  productTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  verifiedText: { fontSize: 12, fontWeight: '600' },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  brandText: { fontSize: 14, fontWeight: '500' },
  productDescription: { fontSize: 14, lineHeight: 20 },
  variantCount: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  variantCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  variantCardSelected: {
    borderWidth: 2.5,
    borderColor: '#10B981',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
    borderWidth: 2,
  },
  videoOverlayBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#10B981',
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
  fieldsContainer: { marginBottom: 12 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
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
  finalPrice: { fontSize: 18, fontWeight: '700' },
  originalPrice: { fontSize: 13, textDecorationLine: 'line-through' },
  discountBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  savedText: { fontSize: 11, marginTop: 4 },
  variantInfoContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  infoIcon: { width: 20 },
  infoLabel: { fontSize: 11, fontWeight: '500' },
  infoValue: { fontSize: 11, fontWeight: '500', flexShrink: 1 },
  variantStatus: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusAvailable: { backgroundColor: '#F3F4F6' },
  statusSelected: { backgroundColor: '#10B981' },
  statusText: { fontSize: 12, fontWeight: '600' },
  statusTextSelected: { color: '#fff' },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 150,
    gap: 12,
  },
  loadingText: { fontSize: 14, fontWeight: '500' },
  noVariantsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noVariantsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    textAlign: 'center',
    marginTop: 12,
  },
  noVariantsSubtext: {
    fontSize: 13,
    color: '#6C757D',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyStateContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
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
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#fff',
  },
});

export default BuyNow;
