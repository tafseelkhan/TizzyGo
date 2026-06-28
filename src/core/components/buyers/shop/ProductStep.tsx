// components/ProductStep.tsx - FINAL WITH react-native-compressor

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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import { createVideoThumbnail } from 'react-native-compressor';
import {
  Product,
  CheckoutData,
  CalculatedData,
  getSellerLocation,
  formatPrice,
} from '../../../types/ShopTypes';
import { useTheme } from '../../../contexts/theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProductStepProps {
  product: Product | null;
  checkoutData: CheckoutData;
  updateCheckoutData: (key: keyof CheckoutData, value: any) => void;
  calculatedData: CalculatedData | null;
  loading: boolean;
  userId: string;
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

// Generate video thumbnail using react-native-compressor
const generateVideoThumbnail = async (
  videoUrl: string,
): Promise<string | null> => {
  try {
    const result = await createVideoThumbnail(videoUrl);
    // result.path is the local file path of the thumbnail
    return result.path;
  } catch (error) {
    console.log('Thumbnail generation error:', error);
    return null;
  }
};

const renderSelectedVariantFields = (selectedVariant: any, isDark: boolean) => {
  if (!selectedVariant) return null;

  const fields = selectedVariant.fields || {};
  const entries = Object.entries(fields);

  if (entries.length === 0) return null;

  return (
    <View
      style={[
        styles.variantDetails,
        { backgroundColor: isDark ? '#2D3748' : '#f8f9fa' },
      ]}
    >
      {entries.map(([key, value]) => (
        <View key={key} style={styles.variantRow}>
          <Text
            style={[styles.variantKey, { color: isDark ? '#CBD5E0' : '#666' }]}
          >
            {key}:
          </Text>
          <Text
            style={[
              styles.variantValue,
              { color: isDark ? '#F7FAFC' : '#333' },
            ]}
          >
            {String(value)}
          </Text>
        </View>
      ))}
      <View style={styles.variantRow}>
        <Text
          style={[styles.variantKey, { color: isDark ? '#CBD5E0' : '#666' }]}
        >
          SKU:
        </Text>
        <Text
          style={[styles.variantValue, { color: isDark ? '#F7FAFC' : '#333' }]}
        >
          {selectedVariant.sku || 'N/A'}
        </Text>
      </View>
      <View style={styles.variantRow}>
        <Text
          style={[styles.variantKey, { color: isDark ? '#CBD5E0' : '#666' }]}
        >
          Combination Key:
        </Text>
        <Text
          style={[styles.variantValue, { color: isDark ? '#F7FAFC' : '#333' }]}
          numberOfLines={2}
        >
          {selectedVariant.combinationKey || 'N/A'}
        </Text>
      </View>
    </View>
  );
};

const renderPriceBreakdown = (
  calculatedData: CalculatedData,
  isDark: boolean,
) => {
  const formatPriceNum = (num: number | undefined) => {
    if (!num && num !== 0) return '0.00';
    return num.toFixed(2);
  };

  return (
    <View
      style={[
        styles.priceCard,
        { backgroundColor: isDark ? '#1E293B' : '#fff' },
      ]}
    >
      <Text style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#333' }]}>
        Price Breakdown
      </Text>

      <View style={styles.stepSection}>
        <Text
          style={[styles.stepTitle, { color: isDark ? '#CBD5E0' : '#555' }]}
        >
          Product Details
        </Text>
        <View style={styles.dataRow}>
          <Text
            style={[styles.dataLabel, { color: isDark ? '#A0AEC0' : '#666' }]}
          >
            Final Price:
          </Text>
          <Text
            style={[styles.dataValue, { color: isDark ? '#F7FAFC' : '#333' }]}
          >
            ₹{formatPriceNum(calculatedData.finalPrice)}
          </Text>
        </View>
        <View style={styles.dataRow}>
          <Text
            style={[styles.dataLabel, { color: isDark ? '#A0AEC0' : '#666' }]}
          >
            Quantity:
          </Text>
          <Text
            style={[styles.dataValue, { color: isDark ? '#F7FAFC' : '#333' }]}
          >
            {calculatedData.quantity}
          </Text>
        </View>
        <View style={styles.dataRow}>
          <Text
            style={[styles.dataLabel, { color: isDark ? '#A0AEC0' : '#666' }]}
          >
            GST:
          </Text>
          <Text
            style={[styles.dataValue, { color: isDark ? '#F7FAFC' : '#333' }]}
          >
            ₹{formatPriceNum(calculatedData.productGst)} (
            {calculatedData.productGstRate}%)
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text
            style={[styles.totalLabel, { color: isDark ? '#CBD5E0' : '#333' }]}
          >
            Subtotal:
          </Text>
          <Text
            style={[
              styles.totalValue,
              { color: isDark ? '#68D391' : '#2ecc71' },
            ]}
          >
            ₹{formatPriceNum(calculatedData.grandTotal)}
          </Text>
        </View>
      </View>

      <View style={styles.stepSection}>
        <Text
          style={[styles.stepTitle, { color: isDark ? '#CBD5E0' : '#555' }]}
        >
          Delivery
        </Text>
        <View style={styles.dataRow}>
          <Text
            style={[styles.dataLabel, { color: isDark ? '#A0AEC0' : '#666' }]}
          >
            Delivery Charge:
          </Text>
          <Text
            style={[styles.dataValue, { color: isDark ? '#F7FAFC' : '#333' }]}
          >
            ₹{formatPriceNum(calculatedData.deliveryCharge)}
          </Text>
        </View>
        <View style={styles.dataRow}>
          <Text
            style={[styles.dataLabel, { color: isDark ? '#A0AEC0' : '#666' }]}
          >
            Distance:
          </Text>
          <Text
            style={[styles.dataValue, { color: isDark ? '#F7FAFC' : '#333' }]}
          >
            {calculatedData.distanceKm || calculatedData.distance || 0} km
          </Text>
        </View>
        {calculatedData.discountApplied > 0 && (
          <View style={styles.dataRow}>
            <Text
              style={[styles.dataLabel, { color: isDark ? '#A0AEC0' : '#666' }]}
            >
              Coupon Discount:
            </Text>
            <Text
              style={[
                styles.dataValue,
                { color: isDark ? '#68D391' : '#2ecc71' },
              ]}
            >
              -₹{formatPriceNum(calculatedData.discountApplied)}
            </Text>
          </View>
        )}
      </View>

      <View
        style={[
          styles.finalTotal,
          { backgroundColor: isDark ? '#2A4365' : '#e8f5e9' },
        ]}
      >
        <Text
          style={[
            styles.finalTotalLabel,
            { color: isDark ? '#90CDF4' : '#27ae60' },
          ]}
        >
          Total Payable:
        </Text>
        <Text
          style={[
            styles.finalTotalValue,
            { color: isDark ? '#90CDF4' : '#27ae60' },
          ]}
        >
          ₹
          {formatPriceNum(
            (calculatedData.grandTotal || 0) +
              (calculatedData.deliveryCharge || 0) -
              (calculatedData.discountApplied || 0),
          )}
        </Text>
      </View>
    </View>
  );
};

const ProductStep: React.FC<ProductStepProps> = ({
  product,
  calculatedData,
  loading,
  isDark: propIsDark,
}) => {
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const videoRef = useRef(null);

  if (!product) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? '#0F172A' : '#ffffffff' },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={isDark ? '#68D391' : '#2ecc71'}
        />
        <Text
          style={[styles.loadingText, { color: isDark ? '#CBD5E0' : '#666' }]}
        >
          Loading product...
        </Text>
      </View>
    );
  }

  const selectedVariant = (product as any).selectedVariant;
  const productImage = getProductImage(product, selectedVariant);
  const sellerLocation = getSellerLocation(product);
  const productDescription = product.description || product.shortDescription;
  const finalPrice = selectedVariant?.finalPrice || selectedVariant?.price || 0;
  const mrp = selectedVariant?.mrp || 0;
  const videoUrl = selectedVariant?.video
    ? fixFirebaseUrl(selectedVariant.video)
    : null;

  // Generate thumbnail when video URL is available
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

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#0F172A' : '#ffffffff' },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Product Card */}
      <View
        style={[
          styles.productCard,
          { backgroundColor: isDark ? '#1E293B' : '#fff' },
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
              { color: isDark ? '#F1F5F9' : '#333' },
            ]}
            numberOfLines={2}
          >
            {product.title}
          </Text>
          <View style={styles.priceRow}>
            <Text
              style={[
                styles.finalPrice,
                { color: isDark ? '#68D391' : '#2ecc71' },
              ]}
            >
              ₹{formatPrice(finalPrice)}
            </Text>
            {mrp > finalPrice && (
              <Text
                style={[styles.mrp, { color: isDark ? '#A0AEC0' : '#999' }]}
              >
                ₹{formatPrice(mrp)}
              </Text>
            )}
          </View>
          {product.brand && (
            <Text
              style={[styles.brandText, { color: isDark ? '#CBD5E0' : '#666' }]}
            >
              Brand: {product.brand}
            </Text>
          )}
          {productDescription && (
            <Text
              style={[
                styles.descriptionText,
                { color: isDark ? '#A0AEC0' : '#777' },
              ]}
              numberOfLines={2}
            >
              {productDescription}
            </Text>
          )}
        </View>
      </View>

      {/* Seller Location */}
      {sellerLocation?.address && (
        <View
          style={[
            styles.locationCard,
            { backgroundColor: isDark ? '#1E293B' : '#fff' },
          ]}
        >
          <Text
            style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#333' }]}
          >
            Seller Location
          </Text>
          <Text
            style={[
              styles.locationText,
              { color: isDark ? '#CBD5E0' : '#555' },
            ]}
          >
            {sellerLocation.address}
          </Text>
        </View>
      )}

      {/* Selected Variant Fields */}
      {selectedVariant &&
        selectedVariant.fields &&
        Object.keys(selectedVariant.fields).length > 0 && (
          <View
            style={[
              styles.variantCard,
              { backgroundColor: isDark ? '#1E293B' : '#fff' },
            ]}
          >
            <Text
              style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#333' }]}
            >
              Selected Variant
            </Text>
            <View
              style={[
                styles.variantObjectContainer,
                {
                  backgroundColor: isDark ? '#2D3748' : '#f8f9fa',
                  borderColor: isDark ? '#4A5568' : '#e0e0e0',
                },
              ]}
            >
              <Text
                style={[
                  styles.variantObjectTitle,
                  { color: isDark ? '#CBD5E0' : '#555' },
                ]}
              >
                Variant Details:
              </Text>
              {renderSelectedVariantFields(selectedVariant, isDark)}
            </View>
          </View>
        )}

      {/* Variant Images */}
      {selectedVariant?.images && selectedVariant.images.length > 0 && (
        <View
          style={[
            styles.imagesCard,
            { backgroundColor: isDark ? '#1E293B' : '#fff' },
          ]}
        >
          <Text
            style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#333' }]}
          >
            Product Images ({selectedVariant.images.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedVariant.images.map((img: string, index: number) => (
              <View key={index} style={styles.imageContainer}>
                <Image
                  source={{ uri: fixFirebaseUrl(img) }}
                  style={[
                    styles.variantImage,
                    { borderColor: isDark ? '#4A5568' : '#e0e0e0' },
                  ]}
                  resizeMode="cover"
                />
                <Text
                  style={[
                    styles.imageIndex,
                    { color: isDark ? '#A0AEC0' : '#666' },
                  ]}
                >
                  Image {index + 1}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Variant Video - With Generated Thumbnail */}
      {videoUrl && (
        <View
          style={[
            styles.videoCard,
            { backgroundColor: isDark ? '#1E293B' : '#fff' },
          ]}
        >
          <Text
            style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#333' }]}
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
                  backgroundColor: isDark ? '#2D3748' : '#f3f4f6',
                  borderColor: isDark ? '#4A5568' : '#e5e7eb',
                },
              ]}
            >
              {generatingThumbnail ? (
                <View style={styles.videoPlaceholder}>
                  <ActivityIndicator
                    size="large"
                    color={isDark ? '#68D391' : '#2ecc71'}
                  />
                  <Text
                    style={[
                      styles.videoThumbnailText,
                      { color: isDark ? '#CBD5E0' : '#555', marginTop: 12 },
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
                    <Icon name="play-circle-filled" size={60} color="#fff" />
                  </View>
                </>
              ) : (
                <View style={styles.videoPlaceholder}>
                  <Icon
                    name="play-circle-filled"
                    size={64}
                    color={isDark ? '#90CDF4' : '#3498db'}
                  />
                  <Text
                    style={[
                      styles.videoThumbnailText,
                      { color: isDark ? '#CBD5E0' : '#555', marginTop: 12 },
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
            { backgroundColor: isDark ? '#0F172A' : '#000' },
          ]}
        >
          <View style={styles.videoModalHeader}>
            <TouchableOpacity
              onPress={() => setVideoModalVisible(false)}
              style={styles.videoModalClose}
            >
              <Icon name="close" size={28} color="#fff" />
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
          { backgroundColor: isDark ? '#1E293B' : '#fff' },
        ]}
      >
        <Text
          style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#333' }]}
        >
          Product Information
        </Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text
              style={[styles.infoLabel, { color: isDark ? '#A0AEC0' : '#888' }]}
            >
              Product ID
            </Text>
            <Text
              style={[styles.infoValue, { color: isDark ? '#F7FAFC' : '#333' }]}
            >
              {product.productId}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text
              style={[styles.infoLabel, { color: isDark ? '#A0AEC0' : '#888' }]}
            >
              Category
            </Text>
            <Text
              style={[styles.infoValue, { color: isDark ? '#F7FAFC' : '#333' }]}
            >
              {product.category || 'N/A'}
            </Text>
          </View>
          {product.subcategory && (
            <View style={styles.infoItem}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: isDark ? '#A0AEC0' : '#888' },
                ]}
              >
                Subcategory
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: isDark ? '#F7FAFC' : '#333' },
                ]}
              >
                {product.subcategory}
              </Text>
            </View>
          )}
          <View style={styles.infoItem}>
            <Text
              style={[styles.infoLabel, { color: isDark ? '#A0AEC0' : '#888' }]}
            >
              Fulfillment
            </Text>
            <Text
              style={[styles.infoValue, { color: isDark ? '#F7FAFC' : '#333' }]}
            >
              {product.fulfillmentType || 'Standard'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text
              style={[styles.infoLabel, { color: isDark ? '#A0AEC0' : '#888' }]}
            >
              COD Available
            </Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color: product.cashOnDelivery
                    ? isDark
                      ? '#68D391'
                      : '#2ecc71'
                    : isDark
                    ? '#FC8181'
                    : '#e74c3c',
                },
              ]}
            >
              {product.cashOnDelivery ? 'Yes' : 'No'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text
              style={[styles.infoLabel, { color: isDark ? '#A0AEC0' : '#888' }]}
            >
              Verified
            </Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color: product.verified
                    ? isDark
                      ? '#68D391'
                      : '#2ecc71'
                    : isDark
                    ? '#FC8181'
                    : '#e74c3c',
                },
              ]}
            >
              {product.verified ? 'Yes' : 'No'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text
              style={[styles.infoLabel, { color: isDark ? '#A0AEC0' : '#888' }]}
            >
              Fast Delivery
            </Text>
            <Text
              style={[styles.infoValue, { color: isDark ? '#F7FAFC' : '#333' }]}
            >
              {product.fastDelivery ? 'Yes' : 'No'}
            </Text>
          </View>
          {selectedVariant?.offerText && (
            <View style={styles.infoItem}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: isDark ? '#A0AEC0' : '#888' },
                ]}
              >
                Offer
              </Text>
              <Text
                style={[
                  styles.offerValue,
                  { color: isDark ? '#FC8181' : '#e74c3c' },
                ]}
              >
                {selectedVariant.offerText}
              </Text>
            </View>
          )}
          <View style={styles.infoItem}>
            <Text
              style={[styles.infoLabel, { color: isDark ? '#A0AEC0' : '#888' }]}
            >
              Discount
            </Text>
            <Text
              style={[
                styles.discountValue,
                { color: isDark ? '#68D391' : '#2ecc71' },
              ]}
            >
              {selectedVariant?.discount || 0}%
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text
              style={[styles.infoLabel, { color: isDark ? '#A0AEC0' : '#888' }]}
            >
              Delivery
            </Text>
            <Text
              style={[
                styles.deliveryText,
                {
                  backgroundColor: isDark
                    ? product.freeDelivery
                      ? '#22543D'
                      : '#742A2A'
                    : product.freeDelivery
                    ? '#e8f5e9'
                    : '#ffeaea',
                  color: isDark
                    ? product.freeDelivery
                      ? '#9AE6B4'
                      : '#FEB2B2'
                    : product.freeDelivery
                    ? '#27ae60'
                    : '#e74c3c',
                },
              ]}
            >
              {product.freeDelivery ? 'FREE' : 'PAID'}
            </Text>
          </View>
        </View>

        {/* Highlights */}
        {product.highlights && product.highlights.length > 0 && (
          <View
            style={[
              styles.highlightsCard,
              {
                backgroundColor: isDark ? '#2D3748' : '#f8f9fa',
                marginTop: 12,
              },
            ]}
          >
            <Text
              style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#333' }]}
            >
              Highlights
            </Text>
            {product.highlights.map((highlight, index) => (
              <View key={index} style={styles.highlightRow}>
                <Icon
                  name="check-circle"
                  size={16}
                  color={isDark ? '#68D391' : '#2ecc71'}
                />
                <Text
                  style={[
                    styles.highlightText,
                    { color: isDark ? '#CBD5E0' : '#555' },
                  ]}
                >
                  {highlight}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* GST Info */}
        {product.gstRate && (
          <View
            style={[
              styles.gstCard,
              {
                backgroundColor: isDark ? '#2D3748' : '#f8f9fa',
                marginTop: 12,
              },
            ]}
          >
            <Text
              style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#333' }]}
            >
              Tax Information
            </Text>
            <View style={styles.gstRow}>
              <Text
                style={[
                  styles.gstLabel,
                  { color: isDark ? '#CBD5E0' : '#666' },
                ]}
              >
                GST Rate:
              </Text>
              <Text
                style={[
                  styles.gstValue,
                  { color: isDark ? '#F7FAFC' : '#333' },
                ]}
              >
                {product.gstRate}%
              </Text>
            </View>
            <View style={styles.gstRow}>
              <Text
                style={[
                  styles.gstLabel,
                  { color: isDark ? '#CBD5E0' : '#666' },
                ]}
              >
                GST Source:
              </Text>
              <Text
                style={[
                  styles.gstValue,
                  { color: isDark ? '#F7FAFC' : '#333' },
                ]}
              >
                {product.gstSource || 'Auto'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Dimensions */}
      {selectedVariant && (
        <View
          style={[
            styles.dimensionsCard,
            { backgroundColor: isDark ? '#1E293B' : '#fff' },
          ]}
        >
          <Text
            style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#333' }]}
          >
            Product Dimensions
          </Text>
          <View style={styles.dimensionsGrid}>
            <View
              style={[
                styles.dimensionItem,
                { backgroundColor: isDark ? '#2D3748' : '#f8f9fa' },
              ]}
            >
              <Text
                style={[
                  styles.dimensionLabel,
                  { color: isDark ? '#CBD5E0' : '#666' },
                ]}
              >
                Weight
              </Text>
              <Text
                style={[
                  styles.dimensionValue,
                  { color: isDark ? '#F7FAFC' : '#333' },
                ]}
              >
                {selectedVariant.weight || '0'} kg
              </Text>
            </View>
            <View
              style={[
                styles.dimensionItem,
                { backgroundColor: isDark ? '#2D3748' : '#f8f9fa' },
              ]}
            >
              <Text
                style={[
                  styles.dimensionLabel,
                  { color: isDark ? '#CBD5E0' : '#666' },
                ]}
              >
                Height
              </Text>
              <Text
                style={[
                  styles.dimensionValue,
                  { color: isDark ? '#F7FAFC' : '#333' },
                ]}
              >
                {selectedVariant.height || '0'} cm
              </Text>
            </View>
            <View
              style={[
                styles.dimensionItem,
                { backgroundColor: isDark ? '#2D3748' : '#f8f9fa' },
              ]}
            >
              <Text
                style={[
                  styles.dimensionLabel,
                  { color: isDark ? '#CBD5E0' : '#666' },
                ]}
              >
                Width
              </Text>
              <Text
                style={[
                  styles.dimensionValue,
                  { color: isDark ? '#F7FAFC' : '#333' },
                ]}
              >
                {selectedVariant.width || '0'} cm
              </Text>
            </View>
            <View
              style={[
                styles.dimensionItem,
                { backgroundColor: isDark ? '#2D3748' : '#f8f9fa' },
              ]}
            >
              <Text
                style={[
                  styles.dimensionLabel,
                  { color: isDark ? '#CBD5E0' : '#666' },
                ]}
              >
                Length
              </Text>
              <Text
                style={[
                  styles.dimensionValue,
                  { color: isDark ? '#F7FAFC' : '#333' },
                ]}
              >
                {selectedVariant.length || '0'} cm
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Inventory Information */}
      {selectedVariant && (
        <View
          style={[
            styles.inventoryCard,
            { backgroundColor: isDark ? '#1E293B' : '#fff' },
          ]}
        >
          <Text
            style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#333' }]}
          >
            Inventory Information
          </Text>
          <View style={styles.inventoryGrid}>
            <View style={styles.inventoryItem}>
              <Text
                style={[
                  styles.inventoryLabel,
                  { color: isDark ? '#CBD5E0' : '#666' },
                ]}
              >
                Stock Status
              </Text>
              <View
                style={[
                  styles.stockBadge,
                  {
                    backgroundColor: isDark
                      ? selectedVariant.inStock
                        ? '#22543D'
                        : '#742A2A'
                      : selectedVariant.inStock
                      ? '#d4edda'
                      : '#f8d7da',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stockText,
                    { color: isDark ? '#9AE6B4' : '#155724' },
                  ]}
                >
                  {selectedVariant.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                </Text>
              </View>
            </View>
            <View style={styles.inventoryItem}>
              <Text
                style={[
                  styles.inventoryLabel,
                  { color: isDark ? '#CBD5E0' : '#666' },
                ]}
              >
                Available Qty
              </Text>
              <Text
                style={[
                  styles.quantityValue,
                  { color: isDark ? '#F7FAFC' : '#333' },
                ]}
              >
                {selectedVariant.quantityAvailable || 0}
              </Text>
            </View>
            <View style={styles.inventoryItem}>
              <Text
                style={[
                  styles.inventoryLabel,
                  { color: isDark ? '#CBD5E0' : '#666' },
                ]}
              >
                Delivery Time
              </Text>
              <Text
                style={[
                  styles.deliveryTimeValue,
                  { color: isDark ? '#90CDF4' : '#3498db' },
                ]}
              >
                {product.deliveryTime || 'Standard'}
              </Text>
            </View>
            <View style={styles.inventoryItem}>
              <Text
                style={[
                  styles.inventoryLabel,
                  { color: isDark ? '#CBD5E0' : '#666' },
                ]}
              >
                Warranty
              </Text>
              <Text
                style={[
                  styles.warrantyValue,
                  { color: isDark ? '#F6AD55' : '#e67e22' },
                ]}
              >
                {product.warranty || 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Loading Indicator */}
      {loading && (
        <View
          style={[
            styles.loadingCard,
            { backgroundColor: isDark ? '#1E293B' : '#fff' },
          ]}
        >
          <ActivityIndicator
            size="small"
            color={isDark ? '#68D391' : '#2ecc71'}
          />
          <Text
            style={[styles.loadingText, { color: isDark ? '#CBD5E0' : '#666' }]}
          >
            Calculating...
          </Text>
        </View>
      )}

      {/* Price Breakdown */}
      {calculatedData && renderPriceBreakdown(calculatedData, isDark)}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8 },
  productCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 2,
  },
  productImage: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
  productDetails: { flex: 1 },
  productTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  finalPrice: { fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  mrp: { fontSize: 12, textDecorationLine: 'line-through' },
  brandText: { fontSize: 12, marginBottom: 2 },
  descriptionText: { fontSize: 11, marginTop: 4 },
  locationCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  locationText: { fontSize: 12, lineHeight: 16 },
  variantCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  variantObjectContainer: { padding: 12, borderRadius: 8, borderWidth: 1 },
  variantObjectTitle: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  variantDetails: { marginTop: 4 },
  variantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  variantKey: { fontSize: 12, fontWeight: '500' },
  variantValue: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  imagesCard: { borderRadius: 12, padding: 12, marginBottom: 12, elevation: 2 },
  imageContainer: { marginRight: 12, alignItems: 'center' },
  variantImage: { width: 80, height: 80, borderRadius: 8, borderWidth: 1 },
  imageIndex: { fontSize: 10, marginTop: 4 },
  videoCard: { borderRadius: 12, padding: 12, marginBottom: 12, elevation: 2 },
  videoThumbnailContainer: {
    borderRadius: 8,
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
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoThumbnailText: { fontSize: 14, marginTop: 12 },
  videoModalContainer: { flex: 1, backgroundColor: '#000' },
  videoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  videoModalClose: { padding: 8 },
  videoModalTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  videoPlayer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.56,
    position: 'absolute',
    top: '40%',
  },
  infoCard: { borderRadius: 12, padding: 12, marginBottom: 12, elevation: 2 },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: { width: '48%', marginBottom: 10 },
  infoLabel: { fontSize: 11, marginBottom: 2 },
  infoValue: { fontSize: 12, fontWeight: '500' },
  offerValue: { fontSize: 12, fontWeight: '500' },
  discountValue: { fontSize: 12, fontWeight: '500' },
  deliveryText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  highlightsCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  highlightText: { fontSize: 12, flex: 1 },
  gstCard: { borderRadius: 12, padding: 12, marginBottom: 12, elevation: 2 },
  gstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  gstLabel: { fontSize: 12, fontWeight: '500' },
  gstValue: { fontSize: 12, fontWeight: '600' },
  dimensionsCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  dimensionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dimensionItem: {
    width: '48%',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  dimensionLabel: { fontSize: 11, marginBottom: 4 },
  dimensionValue: { fontSize: 13, fontWeight: '600' },
  inventoryCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  inventoryItem: { width: '48%', marginBottom: 12 },
  inventoryLabel: { fontSize: 11, marginBottom: 4 },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  stockText: { fontSize: 10, fontWeight: 'bold' },
  quantityValue: { fontSize: 14, fontWeight: '600' },
  deliveryTimeValue: { fontSize: 12, fontWeight: '500' },
  warrantyValue: { fontSize: 12, fontWeight: '500' },
  loadingCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
  },
  loadingText: { fontSize: 12, marginTop: 8 },
  errorText: { fontSize: 14, textAlign: 'center', marginTop: 20 },
  priceCard: { borderRadius: 12, padding: 12, marginBottom: 12, elevation: 2 },
  stepSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  stepTitle: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 3,
  },
  dataLabel: { fontSize: 12, fontFamily: 'monospace' },
  dataValue: { fontSize: 12, fontWeight: '500', fontFamily: 'monospace' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  totalLabel: { fontSize: 13, fontWeight: '600', fontFamily: 'monospace' },
  totalValue: { fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace' },
  finalTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  finalTotalLabel: { fontSize: 15, fontWeight: 'bold' },
  finalTotalValue: { fontSize: 18, fontWeight: 'bold' },
});

export default ProductStep;
