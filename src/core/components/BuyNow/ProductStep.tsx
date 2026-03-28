import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {
  Product,
  CheckoutData,
  CalculatedData,
  getProductDimensions,
  getProductWeight,
  getProductDimensionsDisplay,
} from '../../types/BuyNowTypes';
import AddToCart from './AddToCart';
import { useTheme } from '../../contexts/theme/ThemeContext'; // ✅ THÊME CONTEXT IMPORT

// Custom Icon Components
const MaterialIcons = ({ name, size, color, style }: any) => {
  const getIcon = () => {
    switch (name) {
      case 'location-on':
        return '📍';
      case 'check-circle':
        return '✓';
      case 'warning':
        return '⚠️';
      case 'local-offer':
        return '🏷️';
      case 'local-shipping':
        return '🚚';
      case 'category':
        return '📦';
      case 'directions':
        return '🧭';
      case 'info':
        return 'ℹ️';
      case 'account-balance-wallet':
        return '💰';
      case 'money-off':
        return '💸';
      default:
        return '●';
    }
  };

  return <Text style={[style, { fontSize: size, color }]}>{getIcon()}</Text>;
};

interface ProductStepProps {
  product: Product | null;
  checkoutData: CheckoutData;
  updateCheckoutData: (key: keyof CheckoutData, value: any) => void;
  calculatedData: CalculatedData | null;
  loading: boolean;
  isInCart: boolean;
  cartLoading: boolean;
  onUpdateQuantity: (quantity: number) => void;
  onAddToCart: () => Promise<void>;
  onUpdateCartQuantity: (quantity: number) => Promise<void>;
  onRemoveFromCart: () => Promise<void>;
  userId: string;
  showToast: {
    error: (message: string) => void;
    success: (message: string) => void;
  };
  isDark?: boolean; // ✅ OPTIONAL PROP
}

// ✅ FIREBASE URL HELPER - Fix ellipsis issue
const fixFirebaseUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';

  // Remove ellipsis and any unwanted characters
  let fixedUrl = url.replace('…', '').trim();

  // If URL has firebasestorage but ends with ellipsis
  if (
    fixedUrl.includes('firebasestorage.googleapis.com') &&
    fixedUrl.includes('…')
  ) {
    fixedUrl = fixedUrl.replace(/…/g, '');
  }

  // Ensure URL is complete
  if (fixedUrl.startsWith('https://') && !fixedUrl.includes('alt=media')) {
    // Add media parameter if missing
    if (fixedUrl.includes('?')) {
      fixedUrl += '&alt=media';
    } else {
      fixedUrl += '?alt=media';
    }
  }

  return fixedUrl;
};

// ✅ Helper to get product data from productData field
const getProductData = (product: Product) => {
  return product?.productData || product;
};

// ✅ Get variant images
const getVariantImages = (product: Product): string[] => {
  try {
    if (product?.variantImages && Array.isArray(product.variantImages)) {
      return product.variantImages
        .map(img => fixFirebaseUrl(img))
        .filter(Boolean);
    }
  } catch (error) {
    console.log('Error getting variant images:', error);
  }
  return [];
};

// ✅ Get variant video
const getVariantVideo = (product: Product): string | null => {
  try {
    if (product?.variantVideo) {
      return fixFirebaseUrl(product.variantVideo);
    }
  } catch (error) {
    console.log('Error getting variant video:', error);
  }
  return null;
};

// ✅ Get primary product image
const getProductImage = (product: Product): string => {
  try {
    // Try variantImages first
    const variantImages = getVariantImages(product);
    if (variantImages.length > 0) {
      return variantImages[0];
    }

    // Fallback to regular images
    if (product?.images?.[0]) {
      return fixFirebaseUrl(product.images[0]);
    }

    // Try from productData
    const productData = getProductData(product);
    if (productData?.images?.[0]) {
      return fixFirebaseUrl(productData.images[0]);
    }
  } catch (error) {
    console.log('Error getting product image:', error);
  }
  return 'https://placehold.co/120x120/e0e0e0/666?text=IMG';
};

// ✅ Format price
const formatPrice = (price: number | undefined): string => {
  if (!price && price !== 0) return '0.00';
  return parseFloat(price.toString()).toFixed(2);
};

// ✅ Get seller location from productData
const getSellerLocation = (product: Product): string => {
  try {
    const productData = getProductData(product);

    if (productData?.sellerLocation?.address) {
      return productData.sellerLocation.address;
    }

    if (product?.sellerLocation?.address) {
      return product.sellerLocation.address;
    }
  } catch (error) {
    console.log('Error getting seller location:', error);
  }
  return 'Location not available';
};

// ✅ Get product description
const getProductDescription = (product: Product): string => {
  try {
    const productData = getProductData(product);

    if (productData?.description) return productData.description;
    if (product?.description) return product.description;
    if (productData?.shortDescription) return productData.shortDescription;
    if (product?.shortDescription) return product.shortDescription;
  } catch (error) {
    console.log('Error getting product description:', error);
  }
  return 'No description available';
};

// ✅ Get product details from productData
const getProductDetails = (product: Product) => {
  const productData = getProductData(product);

  return {
    title: productData?.title || product?.title || '',
    brand: productData?.brand || product?.brand || '',
    productId: productData?.productId || product?.productId || '',
    mrp: productData?.mrp || product?.mrp || 0,
    price: productData?.price || product?.price || 0,
    savedAmount: productData?.savedAmount || product?.savedAmount || 0,
    discount: productData?.discount || product?.discount || 0,
    offerText: productData?.offerText || product?.offerText || '',
    finalPrice: productData?.finalPrice || product?.finalPrice || 0,
    freeDelivery: productData?.freeDelivery || product?.freeDelivery || false,

    // ✅ Product Dimensions
    weight: productData?.weight || product?.weight || '0',
    height: productData?.height || product?.height || '0',
    width: productData?.width || product?.width || '0',
    length: productData?.length || product?.length || '0',

    // ✅ Inventory Info
    inStock: productData?.inStock || false,
    quantityAvailable: productData?.quantityAvailable || 0,
    deliveryTime: productData?.deliveryTime || '',
    warranty: productData?.warranty || '',
    returnPolicy: productData?.returnPolicy || '',
  };
};

// ✅ Render selected variant as key-value pairs
const renderSelectedVariant = (selectedVariant: any, isDark: boolean) => {
  if (!selectedVariant || typeof selectedVariant !== 'object') return null;

  const entries = Object.entries(selectedVariant);

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
    </View>
  );
};

// ✅ Render product dimensions
const renderProductDimensions = (productDetails: any, isDark: boolean) => {
  return (
    <View
      style={[
        styles.dimensionsCard,
        { backgroundColor: isDark ? '#1E293B' : '#fff' },
      ]}
    >
      <Text style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#333' }]}>
        📦 Product Dimensions
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
            {productDetails.weight || '0'} kg
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
            {productDetails.height || '0'} cm
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
            {productDetails.width || '0'} cm
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
            {productDetails.length || '0'} cm
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.dimensionSummary,
          { backgroundColor: isDark ? '#2A4365' : '#e8f5e9' },
        ]}
      >
        <Text
          style={[
            styles.dimensionSummaryText,
            { color: isDark ? '#90CDF4' : '#27ae60' },
          ]}
        >
          Dimensions: {productDetails.height || '0'} ×{' '}
          {productDetails.width || '0'} × {productDetails.length || '0'} cm
        </Text>
      </View>
    </View>
  );
};

// ✅ Render calculated price breakdown
const renderPriceBreakdown = (
  calculatedData: CalculatedData,
  isDark: boolean,
) => {
  return (
    <View
      style={[
        styles.priceCard,
        { backgroundColor: isDark ? '#1E293B' : '#fff' },
      ]}
    >
      <Text style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#333' }]}>
        💰 Price Breakdown
      </Text>

      {/* Step 1: Product Calculation */}
      <View style={styles.stepSection}>
        <Text
          style={[styles.stepTitle, { color: isDark ? '#CBD5E0' : '#555' }]}
        >
          Step 1: Product Calculation
        </Text>

        <View style={styles.dataRow}>
          <Text
            style={[styles.dataLabel, { color: isDark ? '#A0AEC0' : '#666' }]}
          >
            finalPrice:
          </Text>
          <Text
            style={[styles.dataValue, { color: isDark ? '#F7FAFC' : '#333' }]}
          >
            ₹{formatPrice(calculatedData.finalPrice)}
          </Text>
        </View>

        <View style={styles.dataRow}>
          <Text
            style={[styles.dataLabel, { color: isDark ? '#A0AEC0' : '#666' }]}
          >
            quantity:
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
            productGst:
          </Text>
          <Text
            style={[styles.dataValue, { color: isDark ? '#F7FAFC' : '#333' }]}
          >
            ₹{formatPrice(calculatedData.productGst)}
          </Text>
        </View>

        <View style={styles.dataRow}>
          <Text
            style={[styles.dataLabel, { color: isDark ? '#A0AEC0' : '#666' }]}
          >
            productGstRate:
          </Text>
          <Text
            style={[styles.dataValue, { color: isDark ? '#F7FAFC' : '#333' }]}
          >
            {calculatedData.productGstRate}%
          </Text>
        </View>

        <View style={styles.totalRow}>
          <Text
            style={[styles.totalLabel, { color: isDark ? '#CBD5E0' : '#333' }]}
          >
            totalFinalPrice:
          </Text>
          <Text
            style={[
              styles.totalValue,
              { color: isDark ? '#68D391' : '#2ecc71' },
            ]}
          >
            ₹{formatPrice(calculatedData.totalFinalPrice)}
          </Text>
        </View>
      </View>

      {/* Step 2: Delivery */}
      <View style={styles.stepSection}>
        <Text
          style={[styles.stepTitle, { color: isDark ? '#CBD5E0' : '#555' }]}
        >
          Step 2: Delivery
        </Text>

        <View style={styles.dataRow}>
          <Text
            style={[styles.dataLabel, { color: isDark ? '#A0AEC0' : '#666' }]}
          >
            deliveryCharge:
          </Text>
          <Text
            style={[styles.dataValue, { color: isDark ? '#F7FAFC' : '#333' }]}
          >
            ₹{formatPrice(calculatedData.deliveryCharge || 0)}
          </Text>
        </View>

        <View style={styles.dataRow}>
          <Text
            style={[styles.dataLabel, { color: isDark ? '#A0AEC0' : '#666' }]}
          >
            distanceKm:
          </Text>
          <Text
            style={[styles.dataValue, { color: isDark ? '#F7FAFC' : '#333' }]}
          >
            {calculatedData.distanceKm || 0} km
          </Text>
        </View>

        {/* Optional discount */}
        {calculatedData.discountApplied !== undefined &&
          calculatedData.discountApplied > 0 && (
            <View style={styles.dataRow}>
              <Text
                style={[
                  styles.dataLabel,
                  { color: isDark ? '#A0AEC0' : '#666' },
                ]}
              >
                discountApplied:
              </Text>
              <Text
                style={[
                  styles.dataValue,
                  styles.discountPrice,
                  { color: isDark ? '#68D391' : '#2ecc71' },
                ]}
              >
                -₹{formatPrice(calculatedData.discountApplied)}
              </Text>
            </View>
          )}
      </View>

      {/* Final Total */}
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
          {formatPrice(
            calculatedData.totalFinalPrice +
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
  checkoutData,
  calculatedData,
  loading,
  isInCart,
  cartLoading,
  onUpdateCartQuantity,
  onAddToCart,
  onRemoveFromCart,
  userId,
  showToast,
  isDark: propIsDark, // ✅ PROP से isDark लें
}) => {
  // ✅ थीम कॉन्टेक्स्ट से isDark लें (prop नहीं मिला तो)
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;

  if (!product) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? '#0F172A' : '#ffffffff' },
        ]}
      >
        <Text
          style={[styles.errorText, { color: isDark ? '#FC8181' : '#e74c3c' }]}
        >
          Product not found
        </Text>
      </View>
    );
  }

  // Get all product data
  const productData = getProductDetails(product);
  const productImage = getProductImage(product);
  const variantImages = getVariantImages(product);
  const variantVideo = getVariantVideo(product);
  const sellerLocation = getSellerLocation(product);
  const productDescription = getProductDescription(product);

  // Calculate final price
  const finalPrice =
    productData.finalPrice ||
    productData.price - (productData.price * (productData.discount || 0)) / 100;

  // Handle video press
  const handleVideoPress = () => {
    if (variantVideo) {
      Linking.openURL(variantVideo).catch(err =>
        showToast.error('Cannot open video: ' + err.message),
      );
    }
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#0F172A' : '#ffffffff' },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ✅ PRODUCT CARD */}
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
            {productData.title}
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
            {productData.mrp && productData.mrp > finalPrice && (
              <Text
                style={[styles.mrp, { color: isDark ? '#A0AEC0' : '#999' }]}
              >
                ₹{formatPrice(productData.mrp)}
              </Text>
            )}
          </View>

          {productData.brand && (
            <Text
              style={[styles.brandText, { color: isDark ? '#CBD5E0' : '#666' }]}
            >
              Brand: {productData.brand}
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

      {/* ✅ SELLER LOCATION */}
      {sellerLocation && sellerLocation !== 'Location not available' && (
        <View
          style={[
            styles.locationCard,
            { backgroundColor: isDark ? '#1E293B' : '#fff' },
          ]}
        >
          <Text
            style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#333' }]}
          >
            📍 Seller Location
          </Text>
          <Text
            style={[
              styles.locationText,
              { color: isDark ? '#CBD5E0' : '#555' },
            ]}
          >
            {sellerLocation}
          </Text>
        </View>
      )}

      {/* ✅ SELECTED VARIANT OBJECT */}
      {product.selectedVariant && (
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
            {renderSelectedVariant(product.selectedVariant, isDark)}
          </View>
        </View>
      )}

      {/* ✅ VARIANT IMAGES ARRAY */}
      {variantImages.length > 0 && (
        <View
          style={[
            styles.imagesCard,
            { backgroundColor: isDark ? '#1E293B' : '#fff' },
          ]}
        >
          <Text
            style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#333' }]}
          >
            Product Images ({variantImages.length})
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {variantImages.map((img, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image
                  source={{ uri: img }}
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

      {/* ✅ VARIANT VIDEO */}
      {variantVideo && (
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
            onPress={handleVideoPress}
            style={[
              styles.videoButton,
              {
                backgroundColor: isDark ? '#2A4365' : '#e8f5ff',
                borderColor: isDark ? '#4299E1' : '#3498db',
              },
            ]}
          >
            <Text
              style={[
                styles.videoButtonText,
                { color: isDark ? '#90CDF4' : '#3498db' },
              ]}
            >
              ▶️ Play Product Video
            </Text>
            <Text
              style={[styles.videoHint, { color: isDark ? '#A0AEC0' : '#666' }]}
            >
              Tap to view
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ✅ PRODUCT DIMENSIONS */}
      {renderProductDimensions(productData, isDark)}

      {/* ✅ PRODUCT INFORMATION */}
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
          {productData.productId && (
            <View style={styles.infoItem}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: isDark ? '#A0AEC0' : '#888' },
                ]}
              >
                Product ID
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: isDark ? '#F7FAFC' : '#333' },
                ]}
              >
                {productData.productId}
              </Text>
            </View>
          )}

          {productData.offerText && (
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
                {productData.offerText}
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
              {productData.discount || 0}%
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
                productData.freeDelivery
                  ? styles.freeDelivery
                  : styles.paidDelivery,
                {
                  backgroundColor: isDark
                    ? productData.freeDelivery
                      ? '#22543D'
                      : '#742A2A'
                    : productData.freeDelivery
                    ? '#e8f5e9'
                    : '#ffeaea',
                  color: isDark
                    ? productData.freeDelivery
                      ? '#9AE6B4'
                      : '#FEB2B2'
                    : productData.freeDelivery
                    ? '#27ae60'
                    : '#e74c3c',
                },
              ]}
            >
              {productData.freeDelivery ? 'FREE' : 'PAID'}
            </Text>
          </View>
        </View>

        {/* Additional product info */}
        <View
          style={[
            styles.additionalInfo,
            { backgroundColor: isDark ? '#2D3748' : '#f8f9fa' },
          ]}
        >
          <View style={styles.additionalRow}>
            <Text
              style={[
                styles.additionalLabel,
                { color: isDark ? '#CBD5E0' : '#666' },
              ]}
            >
              MRP:
            </Text>
            <Text
              style={[
                styles.additionalValue,
                { color: isDark ? '#F7FAFC' : '#333' },
              ]}
            >
              ₹{formatPrice(productData.mrp)}
            </Text>
          </View>
          <View style={styles.additionalRow}>
            <Text
              style={[
                styles.additionalLabel,
                { color: isDark ? '#CBD5E0' : '#666' },
              ]}
            >
              Price:
            </Text>
            <Text
              style={[
                styles.additionalValue,
                { color: isDark ? '#F7FAFC' : '#333' },
              ]}
            >
              ₹{formatPrice(productData.price)}
            </Text>
          </View>
          <View style={styles.additionalRow}>
            <Text
              style={[
                styles.additionalLabel,
                { color: isDark ? '#CBD5E0' : '#666' },
              ]}
            >
              You Save:
            </Text>
            <Text
              style={[
                styles.saveValue,
                { color: isDark ? '#68D391' : '#2ecc71' },
              ]}
            >
              ₹{formatPrice(productData.savedAmount)}
            </Text>
          </View>
        </View>
      </View>

      {/* ✅ INVENTORY INFO */}
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
                productData.inStock
                  ? styles.inStockBadge
                  : styles.outOfStockBadge,
                {
                  backgroundColor: isDark
                    ? productData.inStock
                      ? '#22543D'
                      : '#742A2A'
                    : productData.inStock
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
                {productData.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
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
              {productData.quantityAvailable}
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
              {productData.deliveryTime || 'Standard'}
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
              {productData.warranty || 'Not specified'}
            </Text>
          </View>
        </View>
      </View>

      {/* ✅ CART OPTIONS */}
      <View
        style={[
          styles.cartCard,
          { backgroundColor: isDark ? '#1E293B' : '#fff' },
        ]}
      >
        <Text
          style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#333' }]}
        >
          Cart Options
        </Text>
        <AddToCart
          userId={userId}
          productId={product?.id || ''}
          productData={product}
          isInCart={isInCart}
          quantity={checkoutData.quantity}
          isAdding={loading}
          isLoading={cartLoading}
          productLoading={loading}
          productAvailable={!!product}
          onAddToCart={onAddToCart}
          onUpdateQuantity={onUpdateCartQuantity}
          onRemoveFromCart={onRemoveFromCart}
        />
      </View>

      {/* ✅ LOADING INDICATOR */}
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

      {/* ✅ PRICE BREAKDOWN */}
      {calculatedData && renderPriceBreakdown(calculatedData, isDark)}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },

  // Product Card
  productCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  finalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  mrp: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  brandText: {
    fontSize: 12,
    marginBottom: 2,
  },
  descriptionText: {
    fontSize: 11,
    marginTop: 4,
  },

  // Location Card
  locationCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  locationText: {
    fontSize: 12,
    lineHeight: 16,
  },

  // Variant Card
  variantCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },

  // Selected Variant Object
  variantObjectContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  variantObjectTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  variantDetails: {
    marginTop: 4,
  },
  variantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  variantKey: {
    fontSize: 12,
    fontWeight: '500',
  },
  variantValue: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Images Card
  imagesCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  imageContainer: {
    marginRight: 12,
    alignItems: 'center',
  },
  variantImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
  },
  imageIndex: {
    fontSize: 10,
    marginTop: 4,
  },

  // Video Card
  videoCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  videoButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  videoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  videoHint: {
    fontSize: 10,
    fontStyle: 'italic',
  },

  // Dimensions Card
  dimensionsCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
  dimensionLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  dimensionValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  dimensionSummary: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  dimensionSummaryText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Info Card
  infoCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    width: '48%',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  offerValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  discountValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  deliveryText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  freeDelivery: {},
  paidDelivery: {},
  additionalInfo: {
    padding: 10,
    borderRadius: 8,
  },
  additionalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  additionalLabel: {
    fontSize: 12,
  },
  additionalValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  saveValue: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Inventory Card
  inventoryCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  inventoryItem: {
    width: '48%',
    marginBottom: 12,
  },
  inventoryLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  inStockBadge: {},
  outOfStockBadge: {},
  stockText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  deliveryTimeValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  warrantyValue: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Cart Card
  cartCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  // Loading
  loadingCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  loadingText: {
    fontSize: 12,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },

  // Price Card
  priceCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  stepSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 3,
  },
  dataLabel: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  dataValue: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  discountPrice: {},
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  finalTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  finalTotalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  finalTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProductStep;
