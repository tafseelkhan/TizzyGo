// components/ProductHighlights.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Modal,
  Image,
} from 'react-native';
// ✅ REPLACED: Using react-native-vector-icons instead of @expo/vector-icons
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useTheme } from '../contexts/theme/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

// Define types
type HighlightKey =
  | 'fastDelivery'
  | 'safety'
  | 'productQuality'
  | 'paymentOptions'
  | 'manufacturer'
  | 'cashOnDelivery'
  | 'deliveryVehicleType'
  | 'freeDelivery';

type FontAwesome5IconName = string; // React Native Vector Icons uses string names

interface HighlightDetail {
  title: string;
  availableTitle: string;
  unavailableTitle: string;
  icon: FontAwesome5IconName;
  availableDescription: string;
  unavailableDescription: string;
  availableContent: string;
  unavailableContent: string;
  image: any;
}

interface HighlightDetails {
  [key: string]: HighlightDetail;
}

// Highlight data with BOTH available and unavailable content
const highlightDetails: HighlightDetails = {
  fastDelivery: {
    title: 'Delivery Service',
    availableTitle: 'TizzyGo Express Delivery',
    unavailableTitle: 'Standard Delivery',
    icon: 'truck',
    availableDescription:
      'Ultra-fast delivery network optimized for speed and reliability',
    unavailableDescription: 'Regular delivery service with longer timelines',
    availableContent: `• Metro Cities: 24-48 hours guaranteed delivery\n• Tier 2/3 Cities: 3-4 days delivery assurance\n• Real-time GPS tracking for all shipments\n• 500+ cities coverage across India\n• Express delivery options available\n• Scheduled delivery slots for customer convenience\n• Dedicated delivery fleet for electronics`,
    unavailableContent: `• Delivery time: 5-7 business days\n• Basic tracking information only\n• Limited cities coverage\n• No express delivery options\n• No scheduled delivery slots\n• Standard delivery vehicles\n• No dedicated delivery fleet`,
    image: {
      uri: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop',
    },
  },
  safety: {
    title: 'Safety Protocol',
    availableTitle: 'Secure Delivery Protocol',
    unavailableTitle: 'Basic Safety Measures',
    icon: 'shield-alt',
    availableDescription: 'Maximum safety for your products during transit',
    unavailableDescription: 'Standard safety measures with limited protection',
    availableContent: `• Verified delivery personnel with background checks\n• Contactless delivery options available\n• Anti-static packaging for electronics\n• Insurance coverage on all shipments\n• Tamper-evident packaging for security\n• Installation guidance and support\n• 24/7 customer support for delivery queries`,
    unavailableContent: `• Basic delivery personnel verification\n• Standard contact delivery only\n• Regular packaging without special protection\n• No insurance coverage\n• Standard packaging only\n• Limited support options\n• Business hours support only`,
    image: {
      uri: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop',
    },
  },
  productQuality: {
    title: 'Product Quality',
    availableTitle: 'TizzyOS Product Excellence',
    unavailableTitle: 'Standard Product Quality',
    icon: 'microchip',
    availableDescription: 'Premium quality electronics with strict standards',
    unavailableDescription: 'Standard product quality with basic checks',
    availableContent: `• TizzyOS devices with certified quality checks\n• Direct sourcing from authorized manufacturers\n• 7-day quality guarantee on all products\n• Genuine parts and components assurance\n• Performance testing and validation process\n• Warranty registration and support system\n• Regular firmware updates available`,
    unavailableContent: `• Basic quality checks only\n• Indirect sourcing through distributors\n• No quality guarantee period\n• Standard components without verification\n• No performance testing\n• Limited warranty support\n• No firmware updates`,
    image: {
      uri: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&auto=format&fit=crop',
    },
  },
  paymentOptions: {
    title: 'Payment Options',
    availableTitle: 'Flexible Payment Solutions',
    unavailableTitle: 'Limited Payment Methods',
    icon: 'credit-card',
    availableDescription: 'Multiple secure payment methods for orders',
    unavailableDescription: 'Basic payment options with limited flexibility',
    availableContent: `• Secure payment gateways integration\n• UPI, Cards, Net Banking supported\n• Zero-cost EMI options available\n• Corporate billing solutions\n• Instant payment confirmation system\n• GST invoices automatically generated\n• Bulk order payment facilities`,
    unavailableContent: `• Limited payment methods\n• UPI and cards only\n• No EMI options\n• No corporate billing\n• Delayed payment confirmation\n• Manual invoice generation\n• No bulk payment options`,
    image: {
      uri: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=800&auto=format&fit=crop',
    },
  },
  manufacturer: {
    title: 'Manufacturer',
    availableTitle: 'Direct Manufacturer Partnership',
    unavailableTitle: 'Indirect Sourcing',
    icon: 'industry',
    availableDescription: 'Direct sourcing eliminating middlemen',
    unavailableDescription: 'Standard sourcing through distributors',
    availableContent: `• Direct partnerships with manufacturers\n• Eliminate middlemen for competitive pricing\n• Fresh stock and latest technology products\n• Customization options for bulk orders\n• Quality assurance from manufacturing stage\n• Regular new product launches\n• OEM partnerships for exclusive products`,
    unavailableContent: `• Sourcing through distributors\n• Multiple middlemen involved\n• Older stock and previous generation products\n• No customization options\n• Limited quality control\n• Irregular product updates\n• No exclusive products`,
    image: {
      uri: 'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=800&auto=format&fit=crop',
    },
  },
  cashOnDelivery: {
    title: 'COD Service',
    availableTitle: 'Cash on Delivery Available',
    unavailableTitle: 'Pre-payment Only',
    icon: 'money-bill-wave',
    availableDescription: 'Wide COD availability for orders',
    unavailableDescription: 'Online payment required before delivery',
    availableContent: `• Cash on Delivery across 20,000+ pin codes\n• No extra charges for COD payments\n• Multiple currency acceptance\n• Digital payment acceptance at doorstep\n• COD limit up to ₹50,000 for trusted customers\n• Instant order confirmation for COD\n• Easy return process for COD orders`,
    unavailableContent: `• COD not available\n• Online payment mandatory\n• Limited payment acceptance\n• No doorstep digital payment\n• No COD option\n• Order confirmation after payment only\n• Complex return process`,
    image: {
      uri: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop',
    },
  },
  deliveryVehicleType: {
    title: 'Delivery Fleet',
    availableTitle: 'Specialized Delivery Fleet',
    unavailableTitle: 'Basic Delivery Vehicles',
    icon: 'shipping-fast',
    availableDescription: 'Optimized vehicles for product delivery',
    unavailableDescription: 'Standard delivery vehicles with basic handling',
    availableContent: `• Temperature-controlled vehicles for electronics\n• Special handling for fragile devices\n• GPS-enabled fleet for accurate tracking\n• Multiple vehicle types for different sizes\n• Secure storage facilities during transit\n• Trained handlers for tech products\n• Last-mile delivery optimization`,
    unavailableContent: `• Standard temperature vehicles\n• Basic handling for all products\n• Limited tracking capabilities\n• Single vehicle type only\n• No special storage facilities\n• Regular delivery personnel\n• Basic delivery process`,
    image: {
      uri: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop',
    },
  },
  freeDelivery: {
    title: 'Free Delivery',
    availableTitle: 'Free Delivery Available',
    unavailableTitle: 'Delivery Charges Apply',
    icon: 'shipping-fast',
    availableDescription: 'No delivery charges on this product',
    unavailableDescription: 'Standard delivery charges apply',
    availableContent: `• Zero delivery charges nationwide\n• Free shipping on all orders\n• No minimum order value required\n• Free delivery to 25,000+ pin codes\n• No hidden shipping costs\n• Free return shipping if needed\n• Delivery cost included in product price`,
    unavailableContent: `• Delivery charges based on location\n• Minimum order value for free shipping\n• Additional charges for remote areas\n• Limited free delivery pin codes\n• Return shipping charges may apply\n• Delivery cost calculated at checkout\n• Shipping fees vary by location`,
    image: {
      uri: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=800&auto=format&fit=crop',
    },
  },
};

// Highlight keys mapping from backend
const highlightKeysMap: Record<HighlightKey, string> = {
  fastDelivery: 'fastDelivery',
  safety: 'safety',
  productQuality: 'productQuality',
  paymentOptions: 'paymentOptions',
  manufacturer: 'manufacturer',
  cashOnDelivery: 'cashOnDelivery',
  deliveryVehicleType: 'deliveryVehicleType',
  freeDelivery: 'freeDelivery',
};

interface Product {
  [key: string]: any;
}

interface ProductHighlightsProps {
  productId: string;
  isDark?: boolean; // ✅ Keep the prop name as isDark
}

interface HighlightStatus {
  key: HighlightKey;
  isAvailable: boolean;
  data: HighlightDetail;
}

const ProductHighlights: React.FC<ProductHighlightsProps> = ({
  productId,
  isDark: propIsDark, // ✅ Rename during destructuring
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [activeHighlight, setActiveHighlight] =
    useState<HighlightStatus | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollableWidth, setScrollableWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Theme context
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;

  // Dynamic styles based on theme
  const dynamicStyles = getDynamicStyles(isDark);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setApiError(null);
        console.log('✅ Fetching product with ID:', productId);
        console.log(
          '🔗 API URL:',
          `http://172.20.10.12:5000/api/seller/forms/categories/${productId}`,
        );

        const response = await fetch(
          `http://172.20.10.12:5000/api/seller/forms/categories/${productId}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          },
        );

        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);

        const responseText = await response.text();
        console.log('📡 Raw response text:', responseText);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ Failed to parse JSON:', parseError);
          setApiError('Invalid JSON response from server');
          return;
        }

        console.log('📊 Parsed API response:', JSON.stringify(data, null, 2));

        if (data.success) {
          console.log('✅ Product data received');

          const productData = data.product || data.data;
          console.log('📦 Full product data:', productData);

          if (productData) {
            setProduct(productData);

            // Check if highlight fields exist
            Object.keys(highlightKeysMap).forEach(key => {
              const highlightKey = key as HighlightKey;
              const backendKey = highlightKeysMap[highlightKey];
              console.log(
                `🔍 Checking ${highlightKey} (${backendKey}):`,
                productData[backendKey],
                'Type:',
                typeof productData[backendKey],
                'Exists:',
                backendKey in productData,
              );
            });
          } else {
            console.warn('⚠️ API returned success but no product data found');
            console.warn('Available keys in response:', Object.keys(data));
          }
        } else {
          console.error('❌ API error:', data.message);
          setApiError(data.message || 'API returned error');
        }
      } catch (error: any) {
        console.error('❌ Network error:', error);
        setApiError(error.message || 'Failed to fetch product data');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Get ALL highlights with their status (true/false from backend)
  const getAllHighlights = (): HighlightStatus[] => {
    if (!product) {
      console.log('❌ No product data available');
      return [];
    }

    console.log('📋 Current product data:', product);

    const highlights = Object.keys(highlightKeysMap).map(key => {
      const highlightKey = key as HighlightKey;
      const backendKey = highlightKeysMap[highlightKey];
      const value = product[backendKey];

      console.log(`🔍 Processing ${highlightKey}:`, {
        backendKey,
        value,
        type: typeof value,
        exists: backendKey in product,
      });

      const isAvailable =
        value === true || value === 'true' || value === 1 || value === '1';

      console.log(`   → isAvailable: ${isAvailable}`);

      return {
        key: highlightKey,
        isAvailable,
        data: highlightDetails[highlightKey],
      };
    });

    console.log('📊 Generated highlights:', highlights);
    return highlights;
  };

  const handleHighlightPress = (highlight: HighlightStatus) => {
    setActiveHighlight(highlight);
    setModalVisible(true);
  };

  const scrollLeft = () => {
    scrollViewRef.current?.scrollTo({
      x: Math.max(0, scrollPosition - 200),
      animated: true,
    });
  };

  const scrollRight = () => {
    scrollViewRef.current?.scrollTo({
      x: Math.min(scrollableWidth, scrollPosition + 200),
      animated: true,
    });
  };

  const handleScroll = (event: any) => {
    const position = event.nativeEvent.contentOffset.x;
    setScrollPosition(position);
    setShowLeftArrow(position > 0);
    setShowRightArrow(position < scrollableWidth - screenWidth);
  };

  const onContentSizeChange = (contentWidth: number) => {
    setScrollableWidth(contentWidth);
  };

  const closeModal = () => {
    setModalVisible(false);
    setActiveHighlight(null);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, dynamicStyles.loadingContainer]}>
        <ActivityIndicator size="small" color="#2563eb" />
        <Text style={[styles.loadingText, dynamicStyles.loadingText]}>
          Loading highlights...
        </Text>
      </View>
    );
  }

  const allHighlights = getAllHighlights();
  const availableHighlights = allHighlights.filter(h => h.isAvailable);
  const unavailableHighlights = allHighlights.filter(h => !h.isAvailable);

  console.log(
    '📈 Summary - Total:',
    allHighlights.length,
    'Available:',
    availableHighlights.length,
    'Unavailable:',
    unavailableHighlights.length,
  );

  if (apiError) {
    return (
      <View style={[styles.errorContainer, dynamicStyles.errorContainer]}>
        <Icon name="exclamation-triangle" size={32} color="#ef4444" />
        <Text style={[styles.errorTitle, dynamicStyles.errorTitle]}>
          API Error
        </Text>
        <Text style={[styles.errorText, dynamicStyles.errorText]}>
          {apiError}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            setApiError(null);
            fetch(
              `http://172.20.10.12:5000/api/seller/forms/categories/${productId}`,
            )
              .then(res => res.json())
              .then(data => {
                if (data.success) setProduct(data.product || data.data);
                setLoading(false);
              })
              .catch(err => {
                console.error('Retry error:', err);
                setLoading(false);
              });
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (allHighlights.length === 0) {
    return (
      <View
        style={[
          styles.noHighlightsContainer,
          dynamicStyles.noHighlightsContainer,
        ]}
      >
        <Icon name="info-circle" size={24} color="#94a3b8" />
        <Text style={[styles.noHighlightsText, dynamicStyles.noHighlightsText]}>
          {product
            ? 'No highlights configured for this product'
            : 'Failed to load product data'}
        </Text>
        <Text style={[styles.debugText, dynamicStyles.debugText]}>
          Product ID: {productId}
        </Text>
        {product && (
          <View style={[styles.debugInfo, dynamicStyles.debugInfo]}>
            <Text style={[styles.debugInfoText, dynamicStyles.debugInfoText]}>
              Product loaded but no highlight fields found
            </Text>
            <Text style={[styles.debugInfoText, dynamicStyles.debugInfoText]}>
              Looking for: {Object.values(highlightKeysMap).join(', ')}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* TizzyGo Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>
          TizzyGo&TizzyOS Services
        </Text>
        <Text style={[styles.headerSubtitle, dynamicStyles.headerSubtitle]}>
          {availableHighlights.length > 0
            ? `${availableHighlights.length} services available`
            : 'No premium services available'}
        </Text>
      </View>

      {/* Navigation Arrows */}
      {showLeftArrow && allHighlights.length > 4 && (
        <TouchableOpacity
          style={[
            styles.arrowButton,
            styles.leftArrow,
            dynamicStyles.arrowButton,
          ]}
          onPress={scrollLeft}
        >
          <Icon name="chevron-left" size={16} color="#2563eb" />
        </TouchableOpacity>
      )}

      {showRightArrow && allHighlights.length > 4 && (
        <TouchableOpacity
          style={[
            styles.arrowButton,
            styles.rightArrow,
            dynamicStyles.arrowButton,
          ]}
          onPress={scrollRight}
        >
          <Icon name="chevron-right" size={16} color="#2563eb" />
        </TouchableOpacity>
      )}

      {/* Scrollable Highlights - ALL Highlights Show (Available & Unavailable) */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.scrollContainer, dynamicStyles.scrollContainer]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={onContentSizeChange}
      >
        <View style={styles.highlightsContainer}>
          {allHighlights.map(highlight => (
            <TouchableOpacity
              key={highlight.key}
              style={[
                styles.highlightItem,
                !highlight.isAvailable && styles.unavailableItem,
                dynamicStyles.highlightItem,
              ]}
              onPress={() => handleHighlightPress(highlight)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  !highlight.isAvailable && styles.unavailableIcon,
                  dynamicStyles.iconContainer,
                ]}
              >
                <Icon
                  name={highlight.data.icon}
                  size={24}
                  color={highlight.isAvailable ? '#2563eb' : '#94a3b8'}
                />
              </View>
              <Text
                style={[
                  styles.highlightText,
                  !highlight.isAvailable && styles.unavailableText,
                  dynamicStyles.highlightText,
                ]}
              >
                {highlight.data.title}
              </Text>
              {!highlight.isAvailable && (
                <View style={styles.unavailableBadge}>
                  <Text style={styles.unavailableBadgeText}>Not Available</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Summary Section */}
      <View style={[styles.summaryContainer, dynamicStyles.summaryContainer]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Icon name="check-circle" size={16} color="#10b981" />
            <Text style={[styles.summaryText, dynamicStyles.summaryText]}>
              Available:{' '}
              <Text style={styles.summaryCount}>
                {availableHighlights.length}
              </Text>
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Icon name="times-circle" size={16} color="#ef4444" />
            <Text style={[styles.summaryText, dynamicStyles.summaryText]}>
              Not Available:{' '}
              <Text style={styles.summaryCount}>
                {unavailableHighlights.length}
              </Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Modal for Detailed View */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible && activeHighlight !== null}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              !activeHighlight?.isAvailable && styles.unavailableModal,
              dynamicStyles.modalContainer,
            ]}
          >
            {/* Modal Header */}
            <View
              style={[
                styles.modalHeader,
                !activeHighlight?.isAvailable && styles.unavailableModalHeader,
              ]}
            >
              <View
                style={[
                  styles.modalIconContainer,
                  !activeHighlight?.isAvailable && styles.unavailableModalIcon,
                ]}
              >
                <Icon
                  name={activeHighlight?.data.icon || 'info-circle'}
                  size={28}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>
                  {activeHighlight?.isAvailable
                    ? activeHighlight?.data.availableTitle
                    : activeHighlight?.data.unavailableTitle}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {activeHighlight?.isAvailable
                    ? activeHighlight?.data.availableDescription
                    : activeHighlight?.data.unavailableDescription}
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeModal}
                style={styles.modalCloseButton}
              >
                <Icon name="times" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Status Badge */}
            <View style={styles.statusBadgeContainer}>
              <View
                style={[
                  styles.statusBadge,
                  activeHighlight?.isAvailable
                    ? styles.availableBadge
                    : styles.unavailableBadgeModal,
                ]}
              >
                <Icon
                  name={
                    activeHighlight?.isAvailable
                      ? 'check-circle'
                      : 'times-circle'
                  }
                  size={14}
                  color="#FFFFFF"
                />
                <Text style={styles.statusBadgeText}>
                  {activeHighlight?.isAvailable ? 'AVAILABLE' : 'NOT AVAILABLE'}
                </Text>
              </View>
            </View>

            {/* Modal Content */}
            <ScrollView
              style={[styles.modalContent, dynamicStyles.modalContent]}
            >
              {/* Image Section */}
              <View style={styles.modalImageContainer}>
                <Image
                  source={activeHighlight?.data.image}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
              </View>

              {/* Detailed Content */}
              <View style={styles.modalTextContainer}>
                <Text
                  style={[
                    styles.modalSectionTitle,
                    dynamicStyles.modalSectionTitle,
                  ]}
                >
                  {activeHighlight?.isAvailable
                    ? 'What You Get'
                    : 'Limitations'}
                </Text>
                {activeHighlight &&
                  (activeHighlight.isAvailable
                    ? activeHighlight.data.availableContent
                    : activeHighlight.data.unavailableContent
                  )
                    .split('\n')
                    .map((point, index) => (
                      <View key={index} style={styles.featureRow}>
                        <Icon
                          name={
                            activeHighlight?.isAvailable
                              ? 'check-circle'
                              : 'times-circle'
                          }
                          size={16}
                          color={
                            activeHighlight?.isAvailable ? '#10b981' : '#ef4444'
                          }
                        />
                        <Text
                          style={[
                            styles.featureText,
                            dynamicStyles.featureText,
                          ]}
                        >
                          {point}
                        </Text>
                      </View>
                    ))}

                {/* Additional Info */}
                <View
                  style={[styles.additionalInfo, dynamicStyles.additionalInfo]}
                >
                  <Text
                    style={[
                      styles.additionalTitle,
                      dynamicStyles.additionalTitle,
                    ]}
                  >
                    {activeHighlight?.isAvailable
                      ? 'TizzyGo Advantage'
                      : 'Alternative Options'}
                  </Text>
                  <Text
                    style={[
                      styles.additionalText,
                      dynamicStyles.additionalText,
                    ]}
                  >
                    {activeHighlight?.isAvailable
                      ? 'This premium service is included with your TizzyOS product for enhanced experience.'
                      : 'Consider upgrading to TizzyOS premium products to access this service.'}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={[styles.modalFooter, dynamicStyles.modalFooter]}>
              <TouchableOpacity style={styles.gotItButton} onPress={closeModal}>
                <Text style={styles.gotItButtonText}>Got It</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Dynamic styles based on theme
const getDynamicStyles = (isDark: boolean) => {
  return StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      shadowColor: isDark ? '#000' : '#000',
    },
    loadingContainer: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    },
    loadingText: {
      color: isDark ? '#94A3B8' : '#64748b',
    },
    errorContainer: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    },
    errorTitle: {
      color: isDark ? '#FCA5A5' : '#ef4444',
    },
    errorText: {
      color: isDark ? '#CBD5E1' : '#64748b',
    },
    noHighlightsContainer: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    },
    noHighlightsText: {
      color: isDark ? '#CBD5E1' : '#64748b',
    },
    debugText: {
      color: isDark ? '#94A3B8' : '#94a3b8',
    },
    debugInfo: {
      backgroundColor: isDark ? '#334155' : '#f1f5f9',
    },
    debugInfoText: {
      color: isDark ? '#CBD5E1' : '#64748b',
    },
    headerTitle: {
      color: isDark ? '#F1F5F9' : '#1e293b',
    },
    headerSubtitle: {
      color: isDark ? '#94A3B8' : '#64748b',
    },
    arrowButton: {
      backgroundColor: isDark ? '#334155' : '#FFFFFF',
      borderColor: isDark ? '#475569' : '#e2e8f0',
    },
    scrollContainer: {
      backgroundColor: isDark ? '#1E293B' : 'transparent',
    },
    highlightItem: {
      backgroundColor: isDark ? '#1E293B' : 'transparent',
    },
    iconContainer: {
      backgroundColor: isDark ? '#334155' : '#f0f9ff',
      borderColor: isDark ? '#475569' : '#dbeafe',
    },
    highlightText: {
      color: isDark ? '#E2E8F0' : '#334155',
    },
    summaryContainer: {
      backgroundColor: isDark ? '#1E293B' : 'transparent',
    },
    summaryText: {
      color: isDark ? '#CBD5E1' : '#64748b',
    },
    modalContainer: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    },
    modalContent: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    },
    modalSectionTitle: {
      color: isDark ? '#F1F5F9' : '#1e293b',
    },
    featureText: {
      color: isDark ? '#E2E8F0' : '#475569',
    },
    additionalInfo: {
      backgroundColor: isDark ? '#334155' : '#f1f5f9',
      borderLeftColor: isDark ? '#60A5FA' : '#2563eb',
    },
    additionalTitle: {
      color: isDark ? '#93C5FD' : '#1e40af',
    },
    additionalText: {
      color: isDark ? '#CBD5E1' : '#475569',
    },
    modalFooter: {
      borderTopColor: isDark ? '#334155' : '#e2e8f0',
    },
  });
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    position: 'relative',
    borderRadius: 12,
    paddingVertical: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
  },
  errorContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noHighlightsContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  noHighlightsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  debugText: {
    fontSize: 10,
    marginTop: 8,
  },
  debugInfo: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  debugInfoText: {
    fontSize: 10,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  arrowButton: {
    position: 'absolute',
    top: '60%',
    zIndex: 10,
    borderRadius: 20,
    padding: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
  },
  leftArrow: {
    left: 4,
    transform: [{ translateY: -30 }],
  },
  rightArrow: {
    right: 4,
    transform: [{ translateY: -30 }],
  },
  scrollContainer: {
    paddingVertical: 8,
  },
  highlightsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 20,
  },
  highlightItem: {
    alignItems: 'center',
    gap: 8,
    minWidth: 80,
    position: 'relative',
  },
  unavailableItem: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    borderWidth: 2,
  },
  unavailableIcon: {
    borderColor: '#e2e8f0',
  },
  highlightText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  unavailableText: {
    color: '#94a3b8',
  },
  unavailableBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unavailableBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  summaryContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    fontSize: 13,
  },
  summaryCount: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  unavailableModal: {
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 16,
  },
  unavailableModalHeader: {
    backgroundColor: '#64748b',
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableModalIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#dbeafe',
    marginTop: 2,
  },
  modalCloseButton: {
    padding: 8,
  },
  statusBadgeContainer: {
    alignItems: 'center',
    marginTop: -12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1,
  },
  availableBadge: {
    backgroundColor: '#10b981',
  },
  unavailableBadgeModal: {
    backgroundColor: '#ef4444',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalContent: {
    paddingBottom: 20,
  },
  modalImageContainer: {
    padding: 20,
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  modalTextContainer: {
    paddingHorizontal: 20,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  additionalInfo: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  additionalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  additionalText: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
  gotItButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  gotItButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductHighlights;
