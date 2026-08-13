// components/ProductHighlights.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Image,
  Animated,
  PanResponder,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const ORANGE = '#FF8438';

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

interface HighlightDetail {
  title: string;
  availableTitle: string;
  unavailableTitle: string;
  icon: string;
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

interface HighlightStatus {
  key: HighlightKey;
  isAvailable: boolean;
  data: HighlightDetail;
}

interface ProductHighlightsProps {
  product: any;
}

const ProductHighlights: React.FC<ProductHighlightsProps> = ({ product }) => {
  const [activeHighlight, setActiveHighlight] =
    useState<HighlightStatus | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollableWidth, setScrollableWidth] = useState(0);

  // Animation for bottom sheet
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  // Get ALL highlights with their status from product data
  const getAllHighlights = (): HighlightStatus[] => {
    if (!product) return [];

    const highlights = Object.keys(highlightKeysMap).map(key => {
      const highlightKey = key as HighlightKey;
      const backendKey = highlightKeysMap[highlightKey];
      const value = product[backendKey];
      const isAvailable =
        value === true || value === 'true' || value === 1 || value === '1';

      return {
        key: highlightKey,
        isAvailable,
        data: highlightDetails[highlightKey],
      };
    });

    return highlights;
  };

  const allHighlights = getAllHighlights();
  const availableHighlights = allHighlights.filter(h => h.isAvailable);

  // Agar koi highlights nahi hai toh return null
  if (allHighlights.length === 0 || !product) {
    return null;
  }

  const handleHighlightPress = (highlight: HighlightStatus) => {
    setActiveHighlight(highlight);
    setModalVisible(true);
    // Reset animation value to bottom
    slideAnim.setValue(screenHeight);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setActiveHighlight(null);
    });
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

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TizzyGo Services</Text>
          <Text style={styles.headerSubtitle}>
            {availableHighlights.length} of {allHighlights.length} services
            available
          </Text>
        </View>

        {/* Scrollable Highlights */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollContainer}
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
                ]}
                onPress={() => handleHighlightPress(highlight)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    highlight.isAvailable
                      ? styles.availableIcon
                      : styles.unavailableIcon,
                  ]}
                >
                  <Icon
                    name={highlight.data.icon}
                    size={22}
                    color={highlight.isAvailable ? ORANGE : '#94a3b8'}
                  />
                </View>
                <Text
                  style={[
                    styles.highlightText,
                    !highlight.isAvailable && styles.unavailableText,
                  ]}
                >
                  {highlight.data.title}
                </Text>
                {!highlight.isAvailable && (
                  <View style={styles.unavailableBadge}>
                    <Text style={styles.unavailableBadgeText}>NA</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Modal for Bottom Sheet - Fixed position, won't scroll with parent */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="none"
        onRequestClose={closeSheet}
        statusBarTranslucent={true}
      >
        <View style={styles.modalContainer}>
          {/* Backdrop */}
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={closeSheet}
          />

          {/* Animated Bottom Sheet */}
          <Animated.View
            style={[
              styles.sheetContainer,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {activeHighlight && (
              <>
                {/* Drag Handle */}
                <View style={styles.dragHandleContainer}>
                  <View style={styles.dragHandle} />
                </View>

                {/* Sheet Header */}
                <View style={styles.sheetHeader}>
                  <View
                    style={[
                      styles.sheetIconContainer,
                      activeHighlight.isAvailable
                        ? styles.sheetAvailableIcon
                        : styles.sheetUnavailableIcon,
                    ]}
                  >
                    <Icon
                      name={activeHighlight.data.icon}
                      size={28}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.sheetTitleContainer}>
                    <Text style={styles.sheetTitle}>
                      {activeHighlight.isAvailable
                        ? activeHighlight.data.availableTitle
                        : activeHighlight.data.unavailableTitle}
                    </Text>
                    <Text style={styles.sheetSubtitle}>
                      {activeHighlight.isAvailable
                        ? activeHighlight.data.availableDescription
                        : activeHighlight.data.unavailableDescription}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={closeSheet}
                    style={styles.sheetCloseButton}
                  >
                    <Icon name="times" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>

                {/* Status Badge */}
                <View style={styles.statusBadgeContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      activeHighlight.isAvailable
                        ? styles.availableBadge
                        : styles.unavailableBadgeModal,
                    ]}
                  >
                    <Icon
                      name={
                        activeHighlight.isAvailable
                          ? 'check-circle'
                          : 'times-circle'
                      }
                      size={14}
                      color="#FFFFFF"
                    />
                    <Text style={styles.statusBadgeText}>
                      {activeHighlight.isAvailable
                        ? 'AVAILABLE'
                        : 'NOT AVAILABLE'}
                    </Text>
                  </View>
                </View>

                {/* Sheet Content */}
                <ScrollView
                  style={styles.sheetContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Image */}
                  <View style={styles.sheetImageContainer}>
                    <Image
                      source={activeHighlight.data.image}
                      style={styles.sheetImage}
                      resizeMode="cover"
                    />
                  </View>

                  {/* Details */}
                  <View style={styles.sheetTextContainer}>
                    <Text style={styles.sheetSectionTitle}>
                      {activeHighlight.isAvailable
                        ? 'Service Details'
                        : 'Limitations'}
                    </Text>
                    {(activeHighlight.isAvailable
                      ? activeHighlight.data.availableContent
                      : activeHighlight.data.unavailableContent
                    )
                      .split('\n')
                      .map((point, index) => (
                        <View key={index} style={styles.featureRow}>
                          <Icon
                            name={
                              activeHighlight.isAvailable
                                ? 'check-circle'
                                : 'times-circle'
                            }
                            size={16}
                            color={
                              activeHighlight.isAvailable
                                ? '#10b981'
                                : '#ef4444'
                            }
                          />
                          <Text style={styles.featureText}>{point}</Text>
                        </View>
                      ))}

                    {/* Additional Info */}
                    <View style={styles.additionalInfo}>
                      <Text style={styles.additionalTitle}>
                        {activeHighlight.isAvailable
                          ? '✓ Service Included'
                          : '✗ Not Available'}
                      </Text>
                      <Text style={styles.additionalText}>
                        {activeHighlight.isAvailable
                          ? 'This premium service is included with your product for enhanced experience.'
                          : 'This service is currently not available. Consider upgrading for premium features.'}
                      </Text>
                    </View>
                  </View>
                </ScrollView>

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.closeSheetButton}
                  onPress={closeSheet}
                >
                  <Text style={styles.closeSheetButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    position: 'relative',
    borderRadius: 12,
    paddingVertical: 12,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    color: '#64748b',
  },
  scrollContainer: {
    paddingVertical: 4,
  },
  highlightsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 16,
  },
  highlightItem: {
    alignItems: 'center',
    gap: 6,
    minWidth: 70,
    position: 'relative',
  },
  unavailableItem: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    borderWidth: 2,
  },
  availableIcon: {
    borderColor: ORANGE,
    backgroundColor: '#FFF5ED',
  },
  unavailableIcon: {
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  highlightText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'capitalize',
    color: '#334155',
  },
  unavailableText: {
    color: '#94a3b8',
  },
  unavailableBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: '#ef4444',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  unavailableBadgeText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: 'bold',
  },

  // Modal Container - Fixed position
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 1000,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sheetIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetAvailableIcon: {
    backgroundColor: ORANGE,
  },
  sheetUnavailableIcon: {
    backgroundColor: '#94a3b8',
  },
  sheetTitleContainer: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  sheetCloseButton: {
    padding: 8,
  },
  statusBadgeContainer: {
    alignItems: 'center',
    marginTop: -10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  availableBadge: {
    backgroundColor: '#10b981',
  },
  unavailableBadgeModal: {
    backgroundColor: '#ef4444',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  sheetImageContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  sheetImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
  },
  sheetTextContainer: {
    paddingBottom: 16,
  },
  sheetSectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1e293b',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },
  additionalInfo: {
    marginTop: 20,
    padding: 14,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: ORANGE,
    backgroundColor: '#f1f5f9',
  },
  additionalTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1e40af',
  },
  additionalText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#475569',
  },
  closeSheetButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: ORANGE,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeSheetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductHighlights;
