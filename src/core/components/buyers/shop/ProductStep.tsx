// components/ProductStep.tsx - PREMIUM REDESIGN

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from 'react-native-video';
import { createVideoThumbnail } from 'react-native-compressor';
import {
  Product,
  CheckoutData,
  CalculatedData,
  getSellerLocation,
  formatPrice,
  ShippingAddress,
} from '../../../types/ShopTypes';
import { useTheme } from '../../../contexts/theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Color System
const COLORS = {
  background: '#F8FAF8',
  card: '#FFFFFF',
  cardBorder: '#E7ECE9',
  divider: '#EEF2F0',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  success: '#22C55E',
  successLight: '#ECFDF3',
  accent: '#16A34A',
  danger: '#EF4444',
  warning: '#F59E0B',
  buttonPrimary: '#16A34A',
  buttonText: '#FFFFFF',
  dark: {
    background: '#0F172A',
    card: '#1E293B',
    border: '#334155',
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
  },
};

interface ProductStepProps {
  product: Product | null;
  checkoutData: CheckoutData;
  updateCheckoutData: (key: keyof CheckoutData, value: any) => void;
  updateShippingAddress?: (
    field: keyof ShippingAddress,
    value: string | number | null,
  ) => void;
  calculatedData: CalculatedData | null;
  loading: boolean;
  userId: string;
  onApplyCoupon: (code: string) => Promise<void>;
  onRemoveCoupon: () => Promise<void>;
  isApplyingCoupon: boolean;
  couponError?: string | null;
  couponSuccess?: string | null;
  clearCouponMessages?: () => void;
  showToast: {
    error: (message: string) => void;
    success: (message: string) => void;
  };
  isDark?: boolean;
}

const fixFirebaseUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  let fixedUrl = url.replace('…', '').trim();
  if (fixedUrl.startsWith('https://') && !fixedUrl.includes('alt=media')) {
    if (fixedUrl.includes('?')) {
      fixedUrl += '&alt=media';
    } else {
      fixedUrl += '?alt=media';
    }
  }
  return fixedUrl;
};

const getProductImage = (
  product: Product | null,
  selectedVariant: any,
): string => {
  if (!product) return 'https://placehold.co/120x120/e0e0e0/666?text=No+Image';
  if (selectedVariant?.images?.length) {
    return fixFirebaseUrl(selectedVariant.images[0]);
  }
  if (product.images?.length) {
    return fixFirebaseUrl(product.images[0]);
  }
  return 'https://placehold.co/120x120/e0e0e0/666?text=No+Image';
};

const generateVideoThumbnail = async (
  videoUrl: string,
): Promise<string | null> => {
  try {
    const result = await createVideoThumbnail(videoUrl);
    return result.path;
  } catch (error) {
    console.log('Thumbnail generation error:', error);
    return null;
  }
};

// ============================================================
// COUPON SECTION - PREMIUM REDESIGN
// ============================================================
const CouponSection: React.FC<{
  couponCode: string;
  onApplyCoupon: (code: string) => Promise<void>;
  onRemoveCoupon: () => Promise<void>;
  isApplyingCoupon: boolean;
  couponError?: string | null;
  couponSuccess?: string | null;
  clearCouponMessages?: () => void;
  calculatedData: CalculatedData | null;
  isDark: boolean;
}> = ({
  couponCode,
  onApplyCoupon,
  onRemoveCoupon,
  isApplyingCoupon,
  couponError,
  couponSuccess,
  clearCouponMessages,
  calculatedData,
  isDark,
}) => {
  const [code, setCode] = useState(couponCode || '');
  const [couponApplied, setCouponApplied] = useState(!!couponCode);

  useEffect(() => {
    if (couponCode) {
      setCode(couponCode);
      setCouponApplied(true);
    }
  }, [couponCode]);

  const handleApply = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter a coupon code');
      return;
    }
    if (clearCouponMessages) clearCouponMessages();
    await onApplyCoupon(code.trim().toUpperCase());
    setCouponApplied(true);
  };

  const handleRemove = async () => {
    await onRemoveCoupon();
    setCode('');
    setCouponApplied(false);
    if (clearCouponMessages) clearCouponMessages();
  };

  const getTheme = () => (isDark ? COLORS.dark : COLORS);

  return (
    <View
      style={[
        styles.couponContainer,
        {
          backgroundColor: isDark ? COLORS.dark.card : COLORS.card,
          borderColor: isDark ? COLORS.dark.border : COLORS.cardBorder,
        },
      ]}
    >
      <View style={styles.couponHeader}>
        <Icon name="ticket-percent" size={20} color={COLORS.accent} />
        <Text
          style={[
            styles.couponTitle,
            { color: isDark ? COLORS.dark.textPrimary : COLORS.textPrimary },
          ]}
        >
          Apply Coupon
        </Text>
      </View>

      <View style={styles.couponInputContainer}>
        <TextInput
          style={[
            styles.couponInput,
            {
              backgroundColor: isDark ? '#2D3748' : '#F8FAF8',
              borderColor: isDark ? COLORS.dark.border : COLORS.cardBorder,
              color: isDark ? COLORS.dark.textPrimary : COLORS.textPrimary,
            },
            couponApplied && styles.couponInputApplied,
          ]}
          placeholder="Enter coupon code"
          placeholderTextColor={
            isDark ? COLORS.dark.textMuted : COLORS.textMuted
          }
          value={code}
          onChangeText={setCode}
          editable={!isApplyingCoupon && !couponApplied}
        />
        <TouchableOpacity
          style={[
            styles.applyButton,
            couponApplied && styles.couponAppliedButton,
            {
              backgroundColor: couponApplied
                ? COLORS.successLight
                : COLORS.buttonPrimary,
            },
          ]}
          activeOpacity={0.8}
          onPress={couponApplied ? handleRemove : handleApply}
          disabled={isApplyingCoupon}
        >
          {isApplyingCoupon ? (
            <ActivityIndicator
              size="small"
              color={couponApplied ? COLORS.accent : '#FFFFFF'}
            />
          ) : (
            <Text
              style={[
                styles.applyButtonText,
                {
                  color: couponApplied ? COLORS.accent : '#FFFFFF',
                },
              ]}
            >
              {couponApplied ? 'Remove' : 'Apply'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {couponApplied && (
        <View style={styles.couponSuccessContainer}>
          <Icon name="check-circle" size={16} color={COLORS.success} />
          <Text style={styles.couponSuccessText}>
            Coupon applied successfully!
          </Text>
        </View>
      )}
    </View>
  );
};

// ============================================================
// ADDRESS CARD - PREMIUM REDESIGN
// ============================================================
const AddressCard: React.FC<{
  shippingAddress: ShippingAddress;
  calculatedData: CalculatedData | null;
  product: Product | null;
  loading: boolean;
  isDark: boolean;
}> = ({ shippingAddress, calculatedData, product, loading, isDark }) => {
  const hasValidAddress =
    shippingAddress.address &&
    shippingAddress.latitude &&
    shippingAddress.longitude;

  const buyerLocation = calculatedData?.buyerLocation;
  const sellerLocation =
    calculatedData?.sellerLocation || product?.sellerLocation;

  const displayAddress =
    buyerLocation?.address || shippingAddress.address || 'No address';
  const displayLat = buyerLocation?.latitude || shippingAddress.latitude || 0;
  const displayLng = buyerLocation?.longitude || shippingAddress.longitude || 0;

  const getTheme = () => (isDark ? COLORS.dark : COLORS);

  return (
    <View
      style={[
        styles.addressCard,
        {
          backgroundColor: isDark ? COLORS.dark.card : COLORS.card,
          borderColor: isDark ? COLORS.dark.border : COLORS.cardBorder,
        },
      ]}
    >
      <View style={styles.addressHeader}>
        <View style={styles.addressIconContainer}>
          <Icon name="map-marker" size={20} color={COLORS.accent} />
        </View>
        <Text
          style={[
            styles.addressTitle,
            { color: isDark ? COLORS.dark.textPrimary : COLORS.textPrimary },
          ]}
        >
          Delivery Address
        </Text>
        {loading && <ActivityIndicator size="small" color={COLORS.accent} />}
      </View>

      {loading ? (
        <View style={styles.addressLoading}>
          <ActivityIndicator size="small" color={COLORS.accent} />
          <Text
            style={[
              styles.addressLoadingText,
              { color: isDark ? COLORS.dark.textMuted : COLORS.textMuted },
            ]}
          >
            Fetching address...
          </Text>
        </View>
      ) : hasValidAddress ? (
        <>
          <Text
            style={[
              styles.addressText,
              { color: isDark ? COLORS.dark.textPrimary : COLORS.textPrimary },
            ]}
          >
            {displayAddress}
          </Text>

          {buyerLocation?.googlePlaceId && (
            <Text
              style={[
                styles.addressMeta,
                { color: isDark ? COLORS.dark.textMuted : COLORS.textMuted },
              ]}
            >
              Place ID: {buyerLocation.googlePlaceId}
            </Text>
          )}

          <View style={styles.coordinatesRow}>
            <Icon name="crosshairs-gps" size={14} color={COLORS.textMuted} />
            <Text
              style={[
                styles.coordinatesText,
                { color: isDark ? COLORS.dark.textMuted : COLORS.textMuted },
              ]}
            >
              {displayLat.toFixed(6)}, {displayLng.toFixed(6)}
            </Text>
          </View>

          {sellerLocation?.address && (
            <View style={styles.sellerAddressContainer}>
              <View style={styles.sellerAddressHeader}>
                <Icon name="store" size={16} color={COLORS.accent} />
                <Text
                  style={[
                    styles.sellerAddressLabel,
                    {
                      color: isDark
                        ? COLORS.dark.textSecondary
                        : COLORS.textSecondary,
                    },
                  ]}
                >
                  Seller Address:
                </Text>
              </View>
              <Text
                style={[
                  styles.sellerAddressText,
                  {
                    color: isDark
                      ? COLORS.dark.textPrimary
                      : COLORS.textPrimary,
                  },
                ]}
              >
                {sellerLocation.address}
              </Text>
            </View>
          )}

          {calculatedData && (
            <View style={styles.deliveryInfoRow}>
              <View style={styles.deliveryInfoItem}>
                <Text
                  style={[
                    styles.deliveryLabel,
                    {
                      color: isDark ? COLORS.dark.textMuted : COLORS.textMuted,
                    },
                  ]}
                >
                  Distance
                </Text>
                <Text
                  style={[
                    styles.deliveryValue,
                    {
                      color: isDark
                        ? COLORS.dark.textPrimary
                        : COLORS.textPrimary,
                    },
                  ]}
                >
                  {calculatedData.distanceKm || 0} km
                </Text>
              </View>
              <View style={styles.deliveryInfoItem}>
                <Text
                  style={[
                    styles.deliveryLabel,
                    {
                      color: isDark ? COLORS.dark.textMuted : COLORS.textMuted,
                    },
                  ]}
                >
                  Delivery
                </Text>
                <Text
                  style={[
                    styles.deliveryValue,
                    {
                      color: isDark
                        ? COLORS.dark.textPrimary
                        : COLORS.textPrimary,
                    },
                  ]}
                >
                  ₹{calculatedData.deliveryCharge || 0}
                </Text>
              </View>
              {product?.freeDelivery && (
                <View style={styles.freeDeliveryBadge}>
                  <Icon name="truck-fast" size={14} color={COLORS.accent} />
                  <Text style={styles.freeDeliveryText}>FREE</Text>
                </View>
              )}
            </View>
          )}
        </>
      ) : (
        <View style={styles.noAddressContainer}>
          <Icon name="alert-circle" size={20} color={COLORS.warning} />
          <Text
            style={[
              styles.noAddressText,
              { color: isDark ? '#FBD38D' : '#856404' },
            ]}
          >
            No address found. Please set address in profile.
          </Text>
        </View>
      )}
    </View>
  );
};

// ============================================================
// INVOICE ROW - PREMIUM REDESIGN
// ============================================================
const InvoiceRow = ({
  label,
  value,
  isTotal = false,
  isDiscount = false,
  isDark = false,
}: any) => (
  <View style={[styles.invoiceRow, isTotal && styles.invoiceTotalRow]}>
    <Text
      style={[
        styles.invoiceLabel,
        isTotal && styles.invoiceTotalLabel,
        {
          color: isDark
            ? isTotal
              ? COLORS.dark.textPrimary
              : COLORS.dark.textSecondary
            : isTotal
              ? COLORS.textPrimary
              : COLORS.textSecondary,
        },
      ]}
    >
      {label}
    </Text>
    <Text
      style={[
        styles.invoiceValue,
        isTotal && styles.invoiceTotalValue,
        {
          color: isDiscount
            ? COLORS.success
            : isTotal
              ? COLORS.accent
              : isDark
                ? COLORS.dark.textPrimary
                : COLORS.textPrimary,
          fontSize: isTotal ? 20 : 14,
          fontWeight: isTotal ? '700' : '500',
        },
      ]}
    >
      {value}
    </Text>
  </View>
);

// ============================================================
// MAIN PRODUCT STEP COMPONENT
// ============================================================
const ProductStep: React.FC<ProductStepProps> = ({
  product,
  checkoutData,
  updateCheckoutData,
  updateShippingAddress,
  calculatedData,
  loading,
  userId,
  onApplyCoupon,
  onRemoveCoupon,
  isApplyingCoupon,
  couponError,
  couponSuccess,
  clearCouponMessages,
  showToast,
  isDark: propIsDark,
}) => {
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (calculatedData?.buyerLocation && updateShippingAddress) {
      const loc = calculatedData.buyerLocation;
      updateShippingAddress('address', loc.address || 'Address from database');
      updateShippingAddress('latitude', loc.latitude || 0);
      updateShippingAddress('longitude', loc.longitude || 0);
      updateShippingAddress('googlePlaceId', loc.googlePlaceId || '');
    }
  }, [calculatedData, updateShippingAddress]);

  useEffect(() => {
    const errorMsg = calculatedData?.error || '';
    if (
      errorMsg?.includes('LOCATION_NOT_FOUND') ||
      errorMsg?.includes('location not found')
    ) {
      Alert.alert(
        '📍 Address Required',
        'Please set your delivery address in your profile first.',
        [
          {
            text: 'Go to Profile',
            onPress: () => {},
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    }
  }, [calculatedData]);

  if (!product) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark
              ? COLORS.dark.background
              : COLORS.background,
          },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text
          style={[
            styles.loadingText,
            {
              color: isDark ? COLORS.dark.textSecondary : COLORS.textSecondary,
            },
          ]}
        >
          Loading product...
        </Text>
      </View>
    );
  }

  const selectedVariant = (product as any).selectedVariant;
  const productImage = getProductImage(product, selectedVariant);
  const productDescription = product.description || product.shortDescription;
  const finalPrice = selectedVariant?.finalPrice || selectedVariant?.price || 0;
  const mrp = selectedVariant?.mrp || 0;
  const videoUrl = selectedVariant?.video
    ? fixFirebaseUrl(selectedVariant.video)
    : null;
  const shippingAddress = checkoutData.shippingAddress || {
    address: '',
    latitude: null,
    longitude: null,
    googlePlaceId: '',
  };

  useEffect(() => {
    if (videoUrl && !videoThumbnail && !generatingThumbnail) {
      setGeneratingThumbnail(true);
      generateVideoThumbnail(videoUrl)
        .then(thumbnail => {
          setVideoThumbnail(thumbnail);
          setGeneratingThumbnail(false);
        })
        .catch(() => {
          setGeneratingThumbnail(false);
        });
    }
  }, [videoUrl]);

  // ============================================================
  // ORDER SUMMARY - PREMIUM REDESIGN
  // ============================================================
  const renderOrderSummary = () => {
    if (!calculatedData) return null;

    const subtotal = calculatedData.subtotal || 0;
    const deliveryCharge = calculatedData.deliveryCharge || 0;
    const platformFee = calculatedData.platformFee || 0;
    const packagingFee = calculatedData.packagingFee || 0;
    const discount = calculatedData.discountAppliedAmount || 0;
    const gstAmount = calculatedData.gstAmount || 0;
    const grandTotal = calculatedData.grandTotal || 0;

    const originalTotal =
      subtotal + deliveryCharge + platformFee + packagingFee + (gstAmount || 0);
    const hasDiscount = discount > 0;

    return (
      <View
        style={[
          styles.invoiceContainer,
          {
            backgroundColor: isDark ? COLORS.dark.card : COLORS.card,
            borderColor: isDark ? COLORS.dark.border : COLORS.cardBorder,
          },
        ]}
      >
        <View style={styles.invoiceHeader}>
          <Text
            style={[
              styles.invoiceTitle,
              { color: isDark ? COLORS.dark.textPrimary : COLORS.textPrimary },
            ]}
          >
            Order Summary
          </Text>
          <Text
            style={[
              styles.invoiceSubtitle,
              { color: isDark ? COLORS.dark.textMuted : COLORS.textMuted },
            ]}
          >
            {new Date().toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>

        <View
          style={[
            styles.invoiceDivider,
            { backgroundColor: isDark ? COLORS.dark.border : COLORS.divider },
          ]}
        />

        <View style={styles.invoiceItemsContainer}>
          <View style={styles.invoiceItemRow}>
            <View style={styles.invoiceItemLeft}>
              <Text
                style={[
                  styles.invoiceItemName,
                  {
                    color: isDark
                      ? COLORS.dark.textPrimary
                      : COLORS.textPrimary,
                  },
                ]}
              >
                {product.title}
              </Text>
              <Text
                style={[
                  styles.invoiceItemQty,
                  { color: isDark ? COLORS.dark.textMuted : COLORS.textMuted },
                ]}
              >
                × {calculatedData.quantity || 1}
              </Text>
            </View>
            <Text
              style={[
                styles.invoiceItemPrice,
                {
                  color: isDark ? COLORS.dark.textPrimary : COLORS.textPrimary,
                },
              ]}
            >
              ₹{(finalPrice * (calculatedData.quantity || 1)).toFixed(2)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.invoiceDivider,
            { backgroundColor: isDark ? COLORS.dark.border : COLORS.divider },
          ]}
        />

        <View style={styles.invoiceBreakdown}>
          <InvoiceRow
            label="Subtotal"
            value={`₹${subtotal.toFixed(2)}`}
            isDark={isDark}
          />
          {gstAmount > 0 && (
            <InvoiceRow
              label="GST (18%)"
              value={`₹${gstAmount.toFixed(2)}`}
              isDark={isDark}
            />
          )}
          <InvoiceRow
            label="Platform Fee"
            value={`₹${platformFee.toFixed(2)}`}
            isDark={isDark}
          />
          <InvoiceRow
            label="Packaging"
            value={`₹${packagingFee.toFixed(2)}`}
            isDark={isDark}
          />
          <InvoiceRow
            label="Delivery"
            value={`₹${deliveryCharge.toFixed(2)}`}
            isDark={isDark}
          />
          {hasDiscount && (
            <InvoiceRow
              label="Discount"
              value={`-₹${discount.toFixed(2)}`}
              isDiscount={true}
              isDark={isDark}
            />
          )}
        </View>

        <View
          style={[
            styles.invoiceDivider,
            { backgroundColor: isDark ? COLORS.dark.border : COLORS.divider },
          ]}
        />

        <View style={[styles.invoiceRow, styles.invoiceTotalRow]}>
          <Text
            style={[
              styles.invoiceTotalLabel,
              { color: isDark ? COLORS.dark.textPrimary : COLORS.textPrimary },
            ]}
          >
            Grand Total
          </Text>
          <Text style={styles.invoiceTotalValue}>₹{grandTotal.toFixed(2)}</Text>
        </View>

        {gstAmount > 0 && (
          <View style={styles.gstBreakupContainer}>
            <Text
              style={[
                styles.gstBreakupTitle,
                { color: isDark ? COLORS.dark.textMuted : COLORS.textMuted },
              ]}
            >
              Tax Details
            </Text>
            <View style={styles.gstBreakupRow}>
              <Text
                style={[
                  styles.gstBreakupLabel,
                  { color: isDark ? COLORS.dark.textMuted : COLORS.textMuted },
                ]}
              >
                CGST (9%)
              </Text>
              <Text
                style={[
                  styles.gstBreakupValue,
                  {
                    color: isDark
                      ? COLORS.dark.textPrimary
                      : COLORS.textPrimary,
                  },
                ]}
              >
                ₹{(gstAmount / 2).toFixed(2)}
              </Text>
            </View>
            <View style={styles.gstBreakupRow}>
              <Text
                style={[
                  styles.gstBreakupLabel,
                  { color: isDark ? COLORS.dark.textMuted : COLORS.textMuted },
                ]}
              >
                SGST (9%)
              </Text>
              <Text
                style={[
                  styles.gstBreakupValue,
                  {
                    color: isDark
                      ? COLORS.dark.textPrimary
                      : COLORS.textPrimary,
                  },
                ]}
              >
                ₹{(gstAmount / 2).toFixed(2)}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: isDark ? COLORS.dark.background : COLORS.background,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Product Card - Premium */}
      <View
        style={[
          styles.productCard,
          {
            backgroundColor: isDark ? COLORS.dark.card : COLORS.card,
            borderColor: isDark ? COLORS.dark.border : COLORS.cardBorder,
          },
        ]}
      >
        <Image
          source={{ uri: productImage }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.productDetails}>
          <Text
            style={[
              styles.productTitle,
              { color: isDark ? COLORS.dark.textPrimary : COLORS.textPrimary },
            ]}
            numberOfLines={2}
          >
            {product.title}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.finalPrice}>₹{formatPrice(finalPrice)}</Text>
            {mrp > finalPrice && (
              <Text
                style={[
                  styles.mrp,
                  { color: isDark ? COLORS.dark.textMuted : COLORS.textMuted },
                ]}
              >
                ₹{formatPrice(mrp)}
              </Text>
            )}
          </View>

          {product.brand && (
            <View style={styles.brandContainer}>
              <Icon name="tag-outline" size={14} color={COLORS.textMuted} />
              <Text
                style={[
                  styles.brandText,
                  {
                    color: isDark
                      ? COLORS.dark.textSecondary
                      : COLORS.textSecondary,
                  },
                ]}
              >
                {product.brand}
              </Text>
            </View>
          )}

          {productDescription && (
            <Text
              style={[
                styles.descriptionText,
                {
                  color: isDark
                    ? COLORS.dark.textSecondary
                    : COLORS.textSecondary,
                },
              ]}
              numberOfLines={2}
            >
              {productDescription}
            </Text>
          )}
        </View>
      </View>

      {/* Address Card */}
      <AddressCard
        shippingAddress={shippingAddress}
        calculatedData={calculatedData}
        product={product}
        loading={loading}
        isDark={isDark}
      />

      {/* Coupon Section */}
      <CouponSection
        couponCode={checkoutData.couponCode || ''}
        onApplyCoupon={onApplyCoupon}
        onRemoveCoupon={onRemoveCoupon}
        isApplyingCoupon={isApplyingCoupon}
        couponError={couponError}
        couponSuccess={couponSuccess}
        clearCouponMessages={clearCouponMessages}
        calculatedData={calculatedData}
        isDark={isDark}
      />

      {/* Order Summary */}
      {renderOrderSummary()}

      {/* Variant Fields */}
      {selectedVariant?.fields &&
        Object.keys(selectedVariant.fields).length > 0 && (
          <View
            style={[
              styles.variantCard,
              {
                backgroundColor: isDark ? COLORS.dark.card : COLORS.card,
                borderColor: isDark ? COLORS.dark.border : COLORS.cardBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.cardTitle,
                {
                  color: isDark ? COLORS.dark.textPrimary : COLORS.textPrimary,
                },
              ]}
            >
              Selected Variant
            </Text>
            <View
              style={[
                styles.variantObjectContainer,
                {
                  backgroundColor: isDark ? '#2D3748' : '#F8FAF8',
                  borderColor: isDark ? COLORS.dark.border : COLORS.cardBorder,
                },
              ]}
            >
              {Object.entries(selectedVariant.fields).map(([key, value]) => (
                <View key={key} style={styles.variantRow}>
                  <Text
                    style={[
                      styles.variantKey,
                      {
                        color: isDark
                          ? COLORS.dark.textSecondary
                          : COLORS.textSecondary,
                      },
                    ]}
                  >
                    {key}
                  </Text>
                  <Text
                    style={[
                      styles.variantValue,
                      {
                        color: isDark
                          ? COLORS.dark.textPrimary
                          : COLORS.textPrimary,
                      },
                    ]}
                  >
                    {String(value)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

      {/* Variant Images */}
      {selectedVariant?.images && selectedVariant.images.length > 0 && (
        <View
          style={[
            styles.imagesCard,
            {
              backgroundColor: isDark ? COLORS.dark.card : COLORS.card,
              borderColor: isDark ? COLORS.dark.border : COLORS.cardBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: isDark ? COLORS.dark.textPrimary : COLORS.textPrimary },
            ]}
          >
            Product Images
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedVariant.images.map((img: string, index: number) => (
              <View key={index} style={styles.imageContainer}>
                <Image
                  source={{ uri: fixFirebaseUrl(img) }}
                  style={[
                    styles.variantImage,
                    {
                      borderColor: isDark
                        ? COLORS.dark.border
                        : COLORS.cardBorder,
                    },
                  ]}
                  resizeMode="cover"
                />
                <View style={styles.imageCountBadge}>
                  <Text style={styles.imageCountText}>{index + 1}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Video */}
      {videoUrl && (
        <View
          style={[
            styles.videoCard,
            {
              backgroundColor: isDark ? COLORS.dark.card : COLORS.card,
              borderColor: isDark ? COLORS.dark.border : COLORS.cardBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: isDark ? COLORS.dark.textPrimary : COLORS.textPrimary },
            ]}
          >
            Product Video
          </Text>
          <TouchableOpacity
            onPress={() => setVideoModalVisible(true)}
            activeOpacity={0.9}
          >
            <View
              style={[
                styles.videoThumbnailContainer,
                {
                  backgroundColor: isDark ? '#2D3748' : '#F8FAF8',
                  borderColor: isDark ? COLORS.dark.border : COLORS.cardBorder,
                },
              ]}
            >
              {generatingThumbnail ? (
                <View style={styles.videoPlaceholder}>
                  <ActivityIndicator size="large" color={COLORS.accent} />
                  <Text
                    style={[
                      styles.videoThumbnailText,
                      {
                        color: isDark
                          ? COLORS.dark.textMuted
                          : COLORS.textMuted,
                      },
                    ]}
                  >
                    Generating thumbnail...
                  </Text>
                </View>
              ) : videoThumbnail ? (
                <>
                  <Image
                    source={{ uri: videoThumbnail }}
                    style={styles.videoThumbnailImage}
                    resizeMode="cover"
                  />
                  <View style={styles.playIconOverlay}>
                    <Icon name="play-circle" size={56} color="#FFFFFF" />
                  </View>
                </>
              ) : (
                <View style={styles.videoPlaceholder}>
                  <Icon name="video" size={48} color={COLORS.accent} />
                  <Text
                    style={[
                      styles.videoThumbnailText,
                      {
                        color: isDark
                          ? COLORS.dark.textMuted
                          : COLORS.textMuted,
                      },
                    ]}
                  >
                    Tap to play video
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Video Modal */}
      <Modal
        visible={videoModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setVideoModalVisible(false)}
      >
        <View
          style={[
            styles.videoModalContainer,
            { backgroundColor: isDark ? COLORS.dark.background : '#000' },
          ]}
        >
          <View style={styles.videoModalHeader}>
            <TouchableOpacity
              onPress={() => setVideoModalVisible(false)}
              style={styles.videoModalClose}
            >
              <Icon name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.videoModalTitle}>Product Video</Text>
            <View style={{ width: 40 }} />
          </View>
          <Video
            ref={videoRef}
            source={videoUrl ? { uri: videoUrl } : undefined}
            style={styles.videoPlayer}
            controls={true}
            resizeMode="contain"
            repeat={false}
            onError={e => console.log('Video Error:', e)}
            paused={true}
          />
        </View>
      </Modal>

      {/* Product Information */}
      <View
        style={[
          styles.infoCard,
          {
            backgroundColor: isDark ? COLORS.dark.card : COLORS.card,
            borderColor: isDark ? COLORS.dark.border : COLORS.cardBorder,
          },
        ]}
      >
        <Text
          style={[
            styles.cardTitle,
            { color: isDark ? COLORS.dark.textPrimary : COLORS.textPrimary },
          ]}
        >
          Product Information
        </Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Icon name="barcode" size={16} color={COLORS.textMuted} />
            </View>
            <Text
              style={[
                styles.infoLabel,
                { color: isDark ? COLORS.dark.textMuted : COLORS.textMuted },
              ]}
            >
              Product ID
            </Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color: isDark ? COLORS.dark.textPrimary : COLORS.textPrimary,
                },
              ]}
            >
              {product.productId}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Icon name="folder-outline" size={16} color={COLORS.textMuted} />
            </View>
            <Text
              style={[
                styles.infoLabel,
                { color: isDark ? COLORS.dark.textMuted : COLORS.textMuted },
              ]}
            >
              Category
            </Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color: isDark ? COLORS.dark.textPrimary : COLORS.textPrimary,
                },
              ]}
            >
              {product.category || 'N/A'}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Icon name="cash" size={16} color={COLORS.textMuted} />
            </View>
            <Text
              style={[
                styles.infoLabel,
                { color: isDark ? COLORS.dark.textMuted : COLORS.textMuted },
              ]}
            >
              COD Available
            </Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color: product.cashOnDelivery
                    ? COLORS.success
                    : COLORS.danger,
                },
              ]}
            >
              {product.cashOnDelivery ? 'Yes' : 'No'}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Icon name="truck" size={16} color={COLORS.textMuted} />
            </View>
            <Text
              style={[
                styles.infoLabel,
                { color: isDark ? COLORS.dark.textMuted : COLORS.textMuted },
              ]}
            >
              Delivery
            </Text>
            <View
              style={[
                styles.deliveryBadge,
                {
                  backgroundColor: product.freeDelivery
                    ? COLORS.successLight
                    : '#FEE2E2',
                },
              ]}
            >
              <Text
                style={[
                  styles.deliveryBadgeText,
                  {
                    color: product.freeDelivery
                      ? COLORS.success
                      : COLORS.danger,
                  },
                ]}
              >
                {product.freeDelivery ? 'FREE' : 'PAID'}
              </Text>
            </View>
          </View>
        </View>

        {product.highlights && product.highlights.length > 0 && (
          <View
            style={[
              styles.highlightsCard,
              {
                backgroundColor: isDark ? '#2D3748' : '#F8FAF8',
                borderColor: isDark ? COLORS.dark.border : COLORS.cardBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.highlightsTitle,
                {
                  color: isDark ? COLORS.dark.textPrimary : COLORS.textPrimary,
                },
              ]}
            >
              Highlights
            </Text>
            {product.highlights.map((highlight, index) => (
              <View key={index} style={styles.highlightRow}>
                <Icon name="check-circle" size={16} color={COLORS.accent} />
                <Text
                  style={[
                    styles.highlightText,
                    {
                      color: isDark
                        ? COLORS.dark.textSecondary
                        : COLORS.textSecondary,
                    },
                  ]}
                >
                  {highlight}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {loading && (
        <View
          style={[
            styles.loadingCard,
            {
              backgroundColor: isDark ? COLORS.dark.card : COLORS.card,
              borderColor: isDark ? COLORS.dark.border : COLORS.cardBorder,
            },
          ]}
        >
          <ActivityIndicator size="small" color={COLORS.accent} />
          <Text
            style={[
              styles.loadingText,
              { color: isDark ? COLORS.dark.textMuted : COLORS.textMuted },
            ]}
          >
            Calculating...
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

// ============================================================
// STYLES - PREMIUM REDESIGN
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },

  // Product Card
  productCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  productImage: {
    width: 96,
    height: 96,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#F8FAF8',
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 22,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  finalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent,
    marginRight: 10,
  },
  mrp: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  brandText: {
    fontSize: 13,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },

  // Address Card
  addressCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  addressIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  addressLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  addressLoadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 4,
  },
  addressMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  coordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  coordinatesText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sellerAddressContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  sellerAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sellerAddressLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sellerAddressText: {
    fontSize: 13,
    lineHeight: 18,
  },
  deliveryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    gap: 24,
  },
  deliveryInfoItem: {
    alignItems: 'center',
  },
  deliveryLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  deliveryValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  freeDeliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    marginLeft: 'auto',
  },
  freeDeliveryText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  noAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  noAddressText: {
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },

  // Coupon Section
  couponContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  couponHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  couponTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  couponInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  couponInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
    borderWidth: 1,
  },
  couponInputApplied: {
    opacity: 0.6,
  },
  applyButton: {
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponAppliedButton: {
    backgroundColor: COLORS.successLight,
  },
  applyButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  couponSuccessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  couponSuccessText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.success,
  },

  // Invoice / Order Summary
  invoiceContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  invoiceSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  invoiceDivider: {
    height: 1,
    marginVertical: 12,
  },
  invoiceItemsContainer: {
    marginVertical: 4,
  },
  invoiceItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  invoiceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  invoiceItemName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  invoiceItemQty: {
    fontSize: 13,
    fontWeight: '500',
  },
  invoiceItemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  invoiceBreakdown: {
    marginVertical: 4,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  invoiceTotalRow: {
    paddingVertical: 10,
    marginTop: 4,
  },
  invoiceLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  invoiceTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  invoiceValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  invoiceTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.accent,
  },
  gstBreakupContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  gstBreakupTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  gstBreakupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  gstBreakupLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  gstBreakupValue: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Card Title
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },

  // Variant Card
  variantCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  variantObjectContainer: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  variantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  variantKey: {
    fontSize: 13,
    fontWeight: '500',
  },
  variantValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },

  // Images
  imagesCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    marginRight: 12,
    alignItems: 'center',
    position: 'relative',
  },
  variantImage: {
    width: 88,
    height: 88,
    borderRadius: 12,
    borderWidth: 1,
  },
  imageCountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  imageCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },

  // Video
  videoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  videoThumbnailContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  videoThumbnailImage: {
    width: '100%',
    height: 200,
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoPlaceholder: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  videoThumbnailText: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  videoModalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 20,
  },
  videoModalClose: {
    padding: 8,
  },
  videoModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  videoPlayer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.56,
    position: 'absolute',
    top: '40%',
  },

  // Info Card
  infoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoItem: {
    width: '48%',
    marginBottom: 16,
  },
  infoIconContainer: {
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  deliveryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  deliveryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Highlights
  highlightsCard: {
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
  },
  highlightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  highlightText: {
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Loading
  loadingCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
});

export default ProductStep;
