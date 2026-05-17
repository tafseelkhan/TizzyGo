// screens/AddressCouponStep.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Keyboard,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import {
  Product,
  CheckoutData,
  ShippingAddress,
  CalculatedData,
} from '../../types/BuyNowTypes';
import MapSelectionModal from './MapSelectionModal';
import MapViewModal from './MapViewModal';
import { useTheme } from '../../contexts/theme/ThemeContext'; // ✅ THÊME CONTEXT IMPORT

const { width, height } = Dimensions.get('window');

// Custom Icon Components - replacing @expo/vector-icons
const MaterialIcons = ({ name, size, color, style }: any) => {
  const getIcon = () => {
    switch (name) {
      case 'location-on':
        return '📍';
      case 'clear':
        return '✕';
      case 'search':
        return '🔍';
      case 'place':
        return '📍';
      case 'chevron-right':
        return '›';
      case 'map':
        return '🗺️';
      case 'check-circle':
        return '✓';
      case 'warning':
        return '⚠️';
      case 'home':
        return '🏠';
      case 'my-location':
        return '📍';
      case 'error-outline':
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
      case 'confirmation-number':
        return '🎫';
      case 'close':
        return '✕';
      case 'check':
        return '✓';
      case 'payment':
        return '💰';
      case 'access-time':
        return '⏰';
      case 'shopping-cart':
        return '🛒';
      case 'account-balance-wallet':
        return '💰';
      case 'money-off':
        return '💸';
      case 'search-off':
        return '🔍';
      case 'lightbulb':
        return '💡';
      case 'timer-off':
        return '⏲️';
      case 'attach-money':
        return '💰';
      default:
        return '●';
    }
  };

  return <Text style={[style, { fontSize: size, color }]}>{getIcon()}</Text>;
};

const FontAwesome = ({ name, size, color, style }: any) => {
  const getIcon = () => {
    switch (name) {
      case 'rupee':
        return '₹';
      default:
        return '●';
    }
  };

  return <Text style={[style, { fontSize: size, color }]}>{getIcon()}</Text>;
};

const Ionicons = ({ name, size, color, style }: any) => {
  const getIcon = () => {
    switch (name) {
      case 'information-circle':
        return 'ℹ️';
      default:
        return '●';
    }
  };

  return <Text style={[style, { fontSize: size, color }]}>{getIcon()}</Text>;
};

const Feather = ({ name, size, color, style }: any) => {
  const getIcon = () => {
    switch (name) {
      case 'info':
        return 'ℹ️';
      default:
        return '●';
    }
  };

  return <Text style={[style, { fontSize: size, color }]}>{getIcon()}</Text>;
};

interface AddressCouponStepProps {
  checkoutData: CheckoutData;
  updateCheckoutData: (key: keyof CheckoutData, value: any) => void;
  updateShippingAddress: (
    field: keyof ShippingAddress,
    value: string | number | null,
  ) => void;
  onApplyCoupon: (couponCode: string) => Promise<void>;
  onRemoveCoupon: () => Promise<void>;
  isApplyingCoupon: boolean;
  product: Product | null;
  calculatedData: CalculatedData | null;
  loading: boolean;
  onAddressSelected?: (address: ShippingAddress) => void;
  // ✅ NEW PROPS ADDED
  couponError?: string | null;
  couponSuccess?: string | null;
  clearCouponMessages?: () => void;
  isDark?: boolean; // ✅ OPTIONAL PROP
}

const GOOGLE_API_KEY = 'AIzaSyAOYUGLlj-cKzkwE0kDmCUolAQvf7cMjpY';

const AddressCouponStep: React.FC<AddressCouponStepProps> = ({
  checkoutData,
  updateCheckoutData,
  updateShippingAddress,
  onApplyCoupon,
  onRemoveCoupon,
  isApplyingCoupon,
  product,
  calculatedData,
  loading,
  onAddressSelected,
  // ✅ NEW PROPS
  couponError,
  couponSuccess,
  clearCouponMessages,
  isDark: propIsDark, // ✅ PROP से isDark लें
}) => {
  // ✅ थीम कॉन्टेक्स्ट से isDark लें (prop नहीं मिला तो)
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;

  const [couponInput, setCouponInput] = useState(checkoutData.couponCode || '');
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);

  const shippingAddress = checkoutData.shippingAddress || {
    address: '',
    latitude: null,
    longitude: null,
    googlePlaceId: '',
  };

  const [searchQuery, setSearchQuery] = useState(shippingAddress.address || '');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showSelectLocationModal, setShowSelectLocationModal] = useState(false);

  const searchInputRef = useRef<TextInput>(null);
  const isApplyingRef = useRef(false); // ✅ Prevent multiple clicks

  // ✅ थीम के हिसाब से डायनामिक स्टाइल्स
  const dynamicStyles = getDynamicStyles(isDark);

  // ✅ Clear error when user starts typing
  useEffect(() => {
    if (couponInput && (couponError || localError || localSuccess)) {
      setLocalError(null);
      setLocalSuccess(null);
      if (clearCouponMessages) {
        clearCouponMessages();
      }
    }
  }, [couponInput]);

  // ✅ Show errors/success from parent
  useEffect(() => {
    if (couponError) {
      setLocalError(couponError);
      setLocalSuccess(null);
    }
  }, [couponError]);

  useEffect(() => {
    if (couponSuccess) {
      setLocalSuccess(couponSuccess);
      setLocalError(null);
    }
  }, [couponSuccess]);

  // ✅ Keep couponInput in sync with checkoutData
  useEffect(() => {
    if (checkoutData.couponCode !== couponInput) {
      setCouponInput(checkoutData.couponCode || '');
    }
  }, [checkoutData.couponCode]);

  // ✅ Keep searchQuery in sync with shippingAddress
  useEffect(() => {
    if (shippingAddress.address && shippingAddress.address !== searchQuery) {
      setSearchQuery(shippingAddress.address);
    }
  }, [shippingAddress.address]);

  // Search for addresses
  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowResultsModal(false);
      return;
    }

    try {
      setIsSearching(true);
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query,
        )}&key=${GOOGLE_API_KEY}&language=en&components=country:in`,
      );

      const data = await res.json();

      if (data.status === 'OK' && data.predictions) {
        setSearchResults(data.predictions.slice(0, 10));
        setShowResultsModal(true);
      } else {
        setSearchResults([]);
        setShowResultsModal(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search addresses');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    if (updateCheckoutData) {
      updateCheckoutData('shippingAddress', {
        ...shippingAddress,
        address: text,
      });
    } else {
      updateShippingAddress('address', text);
    }

    const timer = setTimeout(() => {
      searchAddress(text);
    }, 500);

    return () => clearTimeout(timer);
  };

  // ✅ Select address from search results
  const selectAddress = async (placeId: string, address: string) => {
    console.log('📍 Selecting address:', placeId);

    try {
      setIsSearching(true);
      setShowResultsModal(false);
      Keyboard.dismiss();

      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}&language=en`,
      );

      const data = await res.json();

      if (data.status === 'OK' && data.result) {
        const result = data.result;
        const fullAddress = result.formatted_address || address;
        let latitude: number | null = null;
        let longitude: number | null = null;

        if (result.geometry?.location) {
          latitude = result.geometry.location.lat;
          longitude = result.geometry.location.lng;
        }

        console.log('✅ Address details fetched:', {
          address: fullAddress,
          latitude,
          longitude,
          placeId,
        });

        setSearchQuery(fullAddress);

        const updatedShippingAddress: ShippingAddress = {
          address: fullAddress,
          latitude: latitude,
          longitude: longitude,
          googlePlaceId: placeId,
        };

        if (updateCheckoutData) {
          updateCheckoutData('shippingAddress', updatedShippingAddress);
        } else {
          updateShippingAddress('address', fullAddress);
          updateShippingAddress('latitude', latitude);
          updateShippingAddress('longitude', longitude);
          updateShippingAddress('googlePlaceId', placeId);
        }

        // ✅ Call the onAddressSelected callback
        if (onAddressSelected) {
          console.log('📍 Calling onAddressSelected callback');
          onAddressSelected(updatedShippingAddress);
        }
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      Alert.alert('Error', 'Failed to fetch address details');
    } finally {
      setIsSearching(false);
    }
  };

  // ✅ FIXED: Single click handler with debounce - UPDATED WITH COUPON VALIDATION
  const handleApplyCoupon = async () => {
    // Prevent multiple clicks
    if (isApplyingRef.current) {
      console.log('⏳ Already applying coupon, skipping...');
      return;
    }

    if (!couponInput.trim()) {
      setLocalError('Please enter coupon code');
      return;
    }

    // Basic validation before API call
    if (couponInput.length < 3) {
      setLocalError('Coupon code is too short');
      return;
    }

    // ✅ IMPORTANT: Convert to uppercase and trim
    const couponCode = couponInput.trim().toUpperCase();

    // ✅ Check if this coupon is already applied
    if (checkoutData.couponCode === couponCode && calculatedData?.couponUsed) {
      setLocalSuccess(`Coupon "${couponCode}" is already applied`);
      setLocalError(null);
      return;
    }

    try {
      isApplyingRef.current = true;
      setLocalError(null);
      setLocalSuccess(null);

      console.log('🎫 Calling onApplyCoupon with:', couponCode);
      await onApplyCoupon(couponCode);
    } catch (error) {
      console.error('Error applying coupon:', error);
      if (!couponError) {
        setLocalError('Failed to apply coupon. Please try again.');
      }
    } finally {
      // Small delay to prevent rapid clicking
      setTimeout(() => {
        isApplyingRef.current = false;
      }, 500);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      setCouponInput('');
      setLocalError(null);
      setLocalSuccess(null);
      await onRemoveCoupon();
    } catch (error) {
      console.error('Error removing coupon:', error);
      setLocalError('Failed to remove coupon');
    }
  };

  const handleClearAddress = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResultsModal(false);

    const clearedShippingAddress: ShippingAddress = {
      address: '',
      latitude: null,
      longitude: null,
      googlePlaceId: '',
    };

    if (updateCheckoutData) {
      updateCheckoutData('shippingAddress', clearedShippingAddress);
    } else {
      updateShippingAddress('address', '');
      updateShippingAddress('latitude', null);
      updateShippingAddress('longitude', null);
      updateShippingAddress('googlePlaceId', '');
    }
  };

  // ✅ Helper function to check if coordinates are valid
  const hasValidCoordinates =
    shippingAddress.latitude !== null &&
    shippingAddress.longitude !== null &&
    shippingAddress.latitude !== 0 &&
    shippingAddress.longitude !== 0;

  // ✅ Function to render error message with icon - UPDATED WITH BETTER ERROR MESSAGES
  const renderErrorMessage = () => {
    if (!localError) return null;

    let icon: string = 'error-outline';
    let color = '#e74c3c';
    let title = 'Coupon Error';

    // Customize based on error type
    if (localError.toLowerCase().includes('expired')) {
      icon = 'timer-off';
      color = '#f39c12';
      title = 'Coupon Expired';
    } else if (
      localError.includes('Maximum applicable amount') ||
      localError.includes('Maximum amount') ||
      localError.includes('maxAmount') ||
      localError.includes('maximum')
    ) {
      icon = 'money-off';
      color = '#9b59b6';
      title = 'Amount Limit Exceeded';
    } else if (
      localError.includes('Minimum') ||
      localError.includes('minAmount')
    ) {
      icon = 'attach-money';
      color = '#3498db';
      title = 'Minimum Amount Required';
    } else if (
      localError.toLowerCase().includes('invalid') ||
      localError.includes('not found') ||
      localError.includes('not valid')
    ) {
      icon = 'close';
      title = 'Invalid Coupon';
    }

    return (
      <View style={[styles.errorCard, dynamicStyles.errorCard]}>
        <View style={styles.errorHeader}>
          <MaterialIcons name={icon} size={18} color={color} />
          <Text style={[styles.errorTitle, { color }]}>{title}</Text>
        </View>
        <Text style={[styles.errorText, dynamicStyles.errorText]}>
          {localError}
        </Text>

        {/* ✅ Show suggestions for specific errors */}
        {localError.includes('Maximum applicable amount') && (
          <View style={[styles.suggestionBox, dynamicStyles.suggestionBox]}>
            <MaterialIcons name="lightbulb" size={14} color="#f39c12" />
            <Text style={[styles.suggestionText, dynamicStyles.suggestionText]}>
              This coupon has a maximum discount limit. Try applying on smaller
              orders.
            </Text>
          </View>
        )}

        {localError.includes('maxAmount') && (
          <View style={[styles.suggestionBox, dynamicStyles.suggestionBox]}>
            <MaterialIcons name="lightbulb" size={14} color="#f39c12" />
            <Text style={[styles.suggestionText, dynamicStyles.suggestionText]}>
              Order amount exceeds coupon limit. Try a different coupon.
            </Text>
          </View>
        )}

        {localError.toLowerCase().includes('expired') && (
          <View style={[styles.suggestionBox, dynamicStyles.suggestionBox]}>
            <MaterialIcons name="lightbulb" size={14} color="#f39c12" />
            <Text style={[styles.suggestionText, dynamicStyles.suggestionText]}>
              This coupon has expired. Check for new coupons.
            </Text>
          </View>
        )}

        {(localError.includes('Minimum') ||
          localError.includes('minAmount')) && (
          <View style={[styles.suggestionBox, dynamicStyles.suggestionBox]}>
            <MaterialIcons name="lightbulb" size={14} color="#f39c12" />
            <Text style={[styles.suggestionText, dynamicStyles.suggestionText]}>
              Add more items to reach the minimum order amount.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={() => {
            setLocalError(null);
            if (clearCouponMessages) clearCouponMessages();
          }}
        >
          <Text
            style={[
              styles.dismissButtonText,
              { color: isDark ? '#FC8181' : '#e74c3c' },
            ]}
          >
            Dismiss
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ✅ Function to render success message
  const renderSuccessMessage = () => {
    if (!localSuccess) return null;

    return (
      <View style={[styles.successCard, dynamicStyles.successCard]}>
        <View style={styles.successHeader}>
          <MaterialIcons name="check-circle" size={18} color="#2ecc71" />
          <Text style={[styles.successTitle, dynamicStyles.successTitle]}>
            Success!
          </Text>
        </View>
        <Text style={[styles.successText, dynamicStyles.successText]}>
          {localSuccess}
        </Text>
        {calculatedData?.discountApplied && (
          <Text style={[styles.successSubtext, dynamicStyles.successSubtext]}>
            Discount of ₹{calculatedData.discountApplied.toFixed(2)} has been
            applied to your order.
          </Text>
        )}

        <TouchableOpacity
          style={styles.successDismissButton}
          onPress={() => {
            setLocalSuccess(null);
            if (clearCouponMessages) clearCouponMessages();
          }}
        >
          <Text
            style={[
              styles.successDismissButtonText,
              dynamicStyles.successDismissButtonText,
            ]}
          >
            OK
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderAddressResult = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.resultItem, dynamicStyles.resultItem]}
      onPress={() => selectAddress(item.place_id, item.description)}
    >
      <View
        style={[styles.resultIconContainer, dynamicStyles.resultIconContainer]}
      >
        <MaterialIcons name="place" size={18} color="#4285F4" />
      </View>
      <View style={styles.resultTextContainer}>
        <Text
          style={[styles.resultPrimaryText, dynamicStyles.resultPrimaryText]}
        >
          {item.structured_formatting?.main_text ||
            item.description.split(',')[0]}
        </Text>
        <Text
          style={[
            styles.resultSecondaryText,
            dynamicStyles.resultSecondaryText,
          ]}
          numberOfLines={1}
        >
          {item.structured_formatting?.secondary_text || item.description}
        </Text>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={20}
        color={isDark ? '#CBD5E0' : '#95a5a6'}
      />
    </TouchableOpacity>
  );

  // ✅ Helper to render coordinates with proper validation
  const renderCoordinateValue = (value: number | null) => {
    if (value === null) {
      return 'Not selected';
    }
    return value.toString();
  };

  // ✅ Helper to check if coordinates are valid
  const hasCoordinates =
    shippingAddress.latitude !== null &&
    shippingAddress.longitude !== null &&
    shippingAddress.latitude !== 0 &&
    shippingAddress.longitude !== 0;

  // Delivery logic
  const isFreeDelivery = product?.freeDelivery === true;
  const shouldShowDeliveryInfo =
    calculatedData && product && shippingAddress.latitude !== null;

  return (
    <ScrollView
      style={[styles.container, dynamicStyles.container]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Address Section */}
      <View style={[styles.card, dynamicStyles.card]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <MaterialIcons name="location-on" size={20} color="#4285F4" />
            <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>
              Shipping Address
            </Text>
          </View>
          {shippingAddress.address && (
            <TouchableOpacity
              onPress={handleClearAddress}
              style={styles.clearButtonContainer}
            >
              <MaterialIcons name="clear" size={18} color="#e74c3c" />
              <Text style={[styles.clearButton, dynamicStyles.clearButton]}>
                Clear
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, dynamicStyles.label]}>
            Search Your Address *
          </Text>
          <View style={[styles.searchContainer, dynamicStyles.searchContainer]}>
            <MaterialIcons
              name="search"
              size={20}
              color="#95a5a6"
              style={styles.searchIcon}
            />
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, dynamicStyles.searchInput]}
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder="Enter your address, city, pincode..."
              placeholderTextColor={isDark ? '#A0AEC0' : '#999'}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {isSearching && (
              <View style={styles.searchLoader}>
                <ActivityIndicator size="small" color="#4285f4" />
              </View>
            )}
          </View>

          <Text style={[styles.instructionText, dynamicStyles.instructionText]}>
            <Feather name="info" size={12} color="#95a5a6" /> Start typing and
            select from suggestions
          </Text>
        </View>

        {/* ✅ Select Location from Map Button */}
        <TouchableOpacity
          style={[
            styles.selectLocationButton,
            dynamicStyles.selectLocationButton,
          ]}
          onPress={() => setShowSelectLocationModal(true)}
        >
          <View style={styles.selectLocationButtonContent}>
            <MaterialIcons name="map" size={20} color="#fff" />
            <Text style={styles.selectLocationButtonText}>
              Select Location from Map
            </Text>
          </View>
          <Text style={styles.selectLocationButtonSubtext}>
            Tap to pick exact location on map
          </Text>
        </TouchableOpacity>

        {/* ✅ Location Details */}
        {shippingAddress.address && (
          <View style={[styles.locationCard, dynamicStyles.locationCard]}>
            <View style={styles.locationTitleContainer}>
              <MaterialIcons
                name={hasCoordinates ? 'check-circle' : 'warning'}
                size={16}
                color={hasCoordinates ? '#2ecc71' : '#f39c12'}
              />
              <Text style={[styles.locationTitle, dynamicStyles.locationTitle]}>
                {hasCoordinates
                  ? 'Selected Address Details'
                  : 'Address Selected - Coordinates Pending'}
              </Text>
            </View>

            <View style={styles.addressDisplay}>
              <View style={styles.addressLabelContainer}>
                <MaterialIcons name="home" size={14} color="#666" />
                <Text style={[styles.addressLabel, dynamicStyles.addressLabel]}>
                  Full Address:
                </Text>
              </View>
              <Text style={[styles.addressValue, dynamicStyles.addressValue]}>
                {shippingAddress.address}
              </Text>
            </View>

            <View style={styles.coordinatesRow}>
              <View style={styles.coordinateContainer}>
                <View style={styles.coordinateLabelContainer}>
                  <MaterialIcons name="my-location" size={14} color="#666" />
                  <Text
                    style={[
                      styles.coordinateLabel,
                      dynamicStyles.coordinateLabel,
                    ]}
                  >
                    Latitude
                  </Text>
                </View>
                <View
                  style={[
                    styles.coordinateValueContainer,
                    shippingAddress.latitude === null &&
                      styles.missingCoordinate,
                    dynamicStyles.coordinateValueContainer,
                  ]}
                >
                  <Text
                    style={[
                      styles.coordinateValue,
                      shippingAddress.latitude === null &&
                        styles.missingCoordinateText,
                      dynamicStyles.coordinateValue,
                    ]}
                  >
                    {renderCoordinateValue(shippingAddress.latitude)}
                  </Text>
                  {shippingAddress.latitude === null && (
                    <MaterialIcons
                      name="error-outline"
                      size={14}
                      color="#e74c3c"
                    />
                  )}
                </View>
              </View>

              <View style={styles.coordinateContainer}>
                <View style={styles.coordinateLabelContainer}>
                  <MaterialIcons name="my-location" size={14} color="#666" />
                  <Text
                    style={[
                      styles.coordinateLabel,
                      dynamicStyles.coordinateLabel,
                    ]}
                  >
                    Longitude
                  </Text>
                </View>
                <View
                  style={[
                    styles.coordinateValueContainer,
                    shippingAddress.longitude === null &&
                      styles.missingCoordinate,
                    dynamicStyles.coordinateValueContainer,
                  ]}
                >
                  <Text
                    style={[
                      styles.coordinateValue,
                      shippingAddress.longitude === null &&
                        styles.missingCoordinateText,
                      dynamicStyles.coordinateValue,
                    ]}
                  >
                    {renderCoordinateValue(shippingAddress.longitude)}
                  </Text>
                  {shippingAddress.longitude === null && (
                    <MaterialIcons
                      name="error-outline"
                      size={14}
                      color="#e74c3c"
                    />
                  )}
                </View>
              </View>
            </View>

            {/* ✅ Map Preview and Actions */}
            {hasCoordinates && (
              <View style={styles.mapActionsContainer}>
                <View style={styles.mapPreviewContainer}>
                  <TouchableOpacity
                    style={[styles.mapPreview, dynamicStyles.mapPreview]}
                    onPress={() => setShowMapModal(true)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.mapPreviewOverlay}>
                      <MaterialIcons name="map" size={24} color="#fff" />
                      <Text style={styles.mapPreviewText}>View on Map</Text>
                    </View>
                    <View
                      style={[
                        styles.mapCoordinatesPreview,
                        dynamicStyles.mapCoordinatesPreview,
                      ]}
                    >
                      <Text style={styles.mapCoordinatesText}>
                        {shippingAddress.latitude!.toFixed(6)},{' '}
                        {shippingAddress.longitude!.toFixed(6)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ✅ Delivery Information */}
        {shouldShowDeliveryInfo && (
          <View
            style={[
              styles.deliveryCard,
              isFreeDelivery
                ? styles.freeDeliveryCard
                : styles.paidDeliveryCard,
              dynamicStyles.deliveryCard,
              isFreeDelivery
                ? dynamicStyles.freeDeliveryCard
                : dynamicStyles.paidDeliveryCard,
            ]}
          >
            <View style={styles.deliveryTitleContainer}>
              <MaterialIcons
                name={isFreeDelivery ? 'local-offer' : 'local-shipping'}
                size={18}
                color={isFreeDelivery ? '#2ecc71' : '#2e7d32'}
              />
              <Text
                style={[
                  styles.deliveryTitle,
                  isFreeDelivery
                    ? styles.freeDeliveryTitle
                    : styles.paidDeliveryTitle,
                  dynamicStyles.deliveryTitle,
                ]}
              >
                Delivery Information
              </Text>
            </View>

            <View style={[styles.deliveryRow, dynamicStyles.deliveryRow]}>
              <View style={styles.deliveryLabelContainer}>
                <MaterialIcons name="category" size={14} color="#666" />
                <Text
                  style={[styles.deliveryLabel, dynamicStyles.deliveryLabel]}
                >
                  Delivery Type:
                </Text>
              </View>
              <View
                style={[
                  styles.deliveryTypeBadge,
                  isFreeDelivery
                    ? styles.freeDeliveryBadge
                    : styles.paidDeliveryBadge,
                  dynamicStyles.deliveryTypeBadge,
                ]}
              >
                <Text
                  style={[
                    styles.deliveryValue,
                    isFreeDelivery
                      ? styles.freeDeliveryText
                      : styles.paidDeliveryText,
                    dynamicStyles.deliveryValue,
                  ]}
                >
                  {isFreeDelivery ? 'FREE Delivery' : 'Paid Delivery'}
                </Text>
              </View>
            </View>

            {!isFreeDelivery && calculatedData.deliveryCharge !== undefined && (
              <View style={[styles.deliveryRow, dynamicStyles.deliveryRow]}>
                <View style={styles.deliveryLabelContainer}>
                  <FontAwesome name="rupee" size={14} color="#666" />
                  <Text
                    style={[styles.deliveryLabel, dynamicStyles.deliveryLabel]}
                  >
                    Delivery Charge:
                  </Text>
                </View>
                <Text
                  style={[styles.deliveryValue, dynamicStyles.deliveryValue]}
                >
                  ₹{calculatedData.deliveryCharge.toFixed(2)}
                </Text>
              </View>
            )}

            {!isFreeDelivery &&
              calculatedData.distance !== undefined &&
              calculatedData.distance > 0 && (
                <View style={[styles.deliveryRow, dynamicStyles.deliveryRow]}>
                  <View style={styles.deliveryLabelContainer}>
                    <MaterialIcons name="directions" size={14} color="#666" />
                    <Text
                      style={[
                        styles.deliveryLabel,
                        dynamicStyles.deliveryLabel,
                      ]}
                    >
                      Distance:
                    </Text>
                  </View>
                  <Text
                    style={[styles.deliveryValue, dynamicStyles.deliveryValue]}
                  >
                    {calculatedData.distance < 1
                      ? `${(calculatedData.distance * 1000).toFixed(0)} meters`
                      : `${calculatedData.distance.toFixed(1)} km`}
                  </Text>
                </View>
              )}

            <View
              style={[
                styles.infoBox,
                isFreeDelivery
                  ? styles.freeDeliveryInfo
                  : styles.paidDeliveryInfo,
                dynamicStyles.infoBox,
              ]}
            >
              <MaterialIcons
                name={isFreeDelivery ? 'local-offer' : 'check-circle'}
                size={14}
                color={isFreeDelivery ? '#f39c12' : '#2ecc71'}
              />
              <Text style={[styles.infoText, dynamicStyles.infoText]}>
                {isFreeDelivery
                  ? ' Free delivery - No delivery charges'
                  : ` Delivery charge calculated based on distance: ${
                      calculatedData.distanceKm?.toFixed(1) || '0'
                    } km`}
              </Text>
            </View>
          </View>
        )}

        {/* ✅ Show warning if paid delivery but no location */}
        {product && !isFreeDelivery && !hasCoordinates && (
          <View style={[styles.warningCard, dynamicStyles.warningCard]}>
            <View style={styles.warningHeader}>
              <MaterialIcons name="warning" size={18} color="#e74c3c" />
              <Text style={[styles.warningTitle, dynamicStyles.warningTitle]}>
                Address Required
              </Text>
            </View>
            <Text style={[styles.warningText, dynamicStyles.warningText]}>
              This product has paid delivery. Please select a delivery address
              to calculate delivery charges.
            </Text>
          </View>
        )}
      </View>

      {/* Coupon Section */}
      <View style={[styles.card, dynamicStyles.card]}>
        <View style={styles.cardTitleContainer}>
          <MaterialIcons name="local-offer" size={20} color="#e74c3c" />
          <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>
            Apply Coupon
          </Text>
        </View>

        {/* ✅ Error Message */}
        {renderErrorMessage()}

        {/* ✅ Success Message */}
        {renderSuccessMessage()}

        <View style={styles.couponContainer}>
          <View
            style={[
              styles.couponInputWrapper,
              localError && styles.errorInput,
              localSuccess && styles.successInput,
              dynamicStyles.couponInputWrapper,
            ]}
          >
            <MaterialIcons
              name="confirmation-number"
              size={18}
              color={
                localError
                  ? '#e74c3c'
                  : localSuccess
                  ? '#2ecc71'
                  : calculatedData?.couponUsed
                  ? '#2ecc71'
                  : '#95a5a6'
              }
              style={styles.couponIcon}
            />
            <TextInput
              style={[
                styles.couponInput,
                calculatedData?.couponUsed && styles.appliedCouponInput,
                localError && styles.errorInputText,
                localSuccess && styles.successInputText,
                dynamicStyles.couponInput,
              ]}
              value={couponInput}
              onChangeText={setCouponInput}
              placeholder={
                localError
                  ? 'Invalid coupon - Try another'
                  : localSuccess
                  ? 'Coupon applied!'
                  : 'Enter coupon code'
              }
              placeholderTextColor={
                localError
                  ? '#e74c3c'
                  : localSuccess
                  ? '#2ecc71'
                  : isDark
                  ? '#A0AEC0'
                  : '#999'
              }
              editable={!calculatedData?.couponUsed}
              autoCapitalize="characters"
              onSubmitEditing={handleApplyCoupon}
            />
          </View>

          {calculatedData?.couponUsed ? (
            <TouchableOpacity
              style={[
                styles.couponButton,
                styles.removeButton,
                (isApplyingCoupon || loading) && styles.disabledButton,
                dynamicStyles.couponButton,
              ]}
              onPress={handleRemoveCoupon}
              disabled={isApplyingCoupon || loading}
            >
              {isApplyingCoupon || loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="close" size={16} color="#fff" />
                  <Text style={styles.couponButtonText}>Remove</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.couponButton,
                (isApplyingCoupon || loading || !couponInput.trim()) &&
                  styles.disabledButton,
                dynamicStyles.couponButton,
              ]}
              onPress={handleApplyCoupon}
              disabled={isApplyingCoupon || loading || !couponInput.trim()}
            >
              {isApplyingCoupon || loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="check" size={16} color="#fff" />
                  <Text style={styles.couponButtonText}>Apply</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* ✅ Show coupon limits information */}
        {!calculatedData?.couponUsed && (
          <View style={[styles.couponInfoBox, dynamicStyles.couponInfoBox]}>
            <View style={styles.couponInfoHeader}>
              <MaterialIcons name="info" size={14} color="#3498db" />
              <Text
                style={[styles.couponInfoTitle, dynamicStyles.couponInfoTitle]}
              >
                Coupon Information
              </Text>
            </View>
            <View style={styles.couponInfoRow}>
              <MaterialIcons name="payment" size={12} color="#666" />
              <Text
                style={[styles.couponInfoText, dynamicStyles.couponInfoText]}
              >
                Coupons may have minimum and maximum order value limits
              </Text>
            </View>
            <View style={styles.couponInfoRow}>
              <MaterialIcons name="access-time" size={12} color="#666" />
              <Text
                style={[styles.couponInfoText, dynamicStyles.couponInfoText]}
              >
                Check expiry date before applying
              </Text>
            </View>
            {localError &&
              (localError.includes('Maximum') ||
                localError.includes('maxAmount')) && (
                <View style={styles.currentAmountRow}>
                  <MaterialIcons
                    name="shopping-cart"
                    size={12}
                    color="#e74c3c"
                  />
                  <Text
                    style={[
                      styles.currentAmountText,
                      dynamicStyles.currentAmountText,
                    ]}
                  >
                    Current order value: ₹
                    {calculatedData?.grandTotal?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              )}
            {localError &&
              (localError.includes('Minimum') ||
                localError.includes('minAmount')) && (
                <View style={styles.currentAmountRow}>
                  <MaterialIcons
                    name="shopping-cart"
                    size={12}
                    color="#e74c3c"
                  />
                  <Text
                    style={[
                      styles.currentAmountText,
                      dynamicStyles.currentAmountText,
                    ]}
                  >
                    Need minimum: ₹{localError.match(/\d+/)?.[0] || '0'}
                  </Text>
                </View>
              )}
          </View>
        )}

        {/* ✅ Coupon Applied Status */}
        {calculatedData && (
          <View
            style={[styles.couponStatusCard, dynamicStyles.couponStatusCard]}
          >
            <View style={styles.couponStatusTitleContainer}>
              <Ionicons name="information-circle" size={16} color="#3498db" />
              <Text
                style={[
                  styles.couponStatusTitle,
                  dynamicStyles.couponStatusTitle,
                ]}
              >
                Coupon Status
              </Text>
            </View>

            <View style={[styles.statusRow, dynamicStyles.statusRow]}>
              <View style={styles.statusLabelContainer}>
                <MaterialIcons
                  name="confirmation-number"
                  size={14}
                  color="#666"
                />
                <Text style={[styles.statusLabel, dynamicStyles.statusLabel]}>
                  Coupon:
                </Text>
              </View>
              <View
                style={[
                  styles.statusValueContainer,
                  calculatedData.couponUsed
                    ? styles.couponApplied
                    : styles.noCoupon,
                  dynamicStyles.statusValueContainer,
                ]}
              >
                <Text style={[styles.statusValue, dynamicStyles.statusValue]}>
                  {calculatedData.couponUsed || 'None'}
                </Text>
              </View>
            </View>

            <View style={[styles.statusRow, dynamicStyles.statusRow]}>
              <View style={styles.statusLabelContainer}>
                <FontAwesome name="rupee" size={14} color="#666" />
                <Text style={[styles.statusLabel, dynamicStyles.statusLabel]}>
                  Discount:
                </Text>
              </View>
              <View style={styles.statusValueContainer}>
                <Text
                  style={[
                    styles.statusValue,
                    calculatedData.discountApplied &&
                    calculatedData.discountApplied > 0
                      ? styles.discountValue
                      : styles.noDiscountValue,
                    dynamicStyles.statusValue,
                  ]}
                >
                  ₹
                  {calculatedData.discountApplied !== undefined
                    ? calculatedData.discountApplied.toFixed(2)
                    : '0.00'}
                </Text>
              </View>
            </View>

            <View style={[styles.statusRow, dynamicStyles.statusRow]}>
              <View style={styles.statusLabelContainer}>
                <MaterialIcons
                  name={
                    calculatedData.coFundApplied
                      ? 'account-balance-wallet'
                      : 'money-off'
                  }
                  size={14}
                  color="#666"
                />
                <Text style={[styles.statusLabel, dynamicStyles.statusLabel]}>
                  Co-Fund:
                </Text>
              </View>
              <View
                style={[
                  styles.statusValueContainer,
                  calculatedData.coFundApplied
                    ? styles.cofundAppliedContainer
                    : styles.cofundNotAppliedContainer,
                  dynamicStyles.statusValueContainer,
                ]}
              >
                <Text
                  style={[
                    styles.statusValue,
                    calculatedData.coFundApplied
                      ? styles.cofundApplied
                      : styles.cofundNotApplied,
                    dynamicStyles.statusValue,
                  ]}
                >
                  {calculatedData.coFundApplied !== undefined
                    ? calculatedData.coFundApplied
                      ? 'INCLUDED'
                      : 'EXCLUDED'
                    : 'EXCLUDED'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Backend Status */}
      {(loading || isApplyingCoupon) && (
        <View style={[styles.loadingCard, dynamicStyles.loadingCard]}>
          <ActivityIndicator size="small" color="#2ecc71" />
          <Text style={[styles.loadingText, dynamicStyles.loadingText]}>
            {isApplyingCoupon
              ? 'Applying coupon...'
              : 'Calculating with backend...'}
          </Text>
        </View>
      )}

      {/* Modal for Address Results */}
      <Modal
        visible={showResultsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowResultsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, dynamicStyles.modalContainer]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>
                Select Address
              </Text>
              <TouchableOpacity
                onPress={() => setShowResultsModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.resultsCountContainer,
                dynamicStyles.resultsCountContainer,
              ]}
            >
              <Text
                style={[
                  styles.resultsCountText,
                  dynamicStyles.resultsCountText,
                ]}
              >
                {searchResults.length} address
                {searchResults.length !== 1 ? 'es' : ''} found
              </Text>
            </View>

            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderAddressResult}
                keyExtractor={item => item.place_id}
                contentContainerStyle={styles.resultsList}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              />
            ) : (
              <View style={styles.noResultsContainer}>
                <MaterialIcons name="search-off" size={50} color="#ddd" />
                <Text
                  style={[styles.noResultsText, dynamicStyles.noResultsText]}
                >
                  No addresses found
                </Text>
                <Text
                  style={[
                    styles.noResultsSubtext,
                    dynamicStyles.noResultsSubtext,
                  ]}
                >
                  Try different keywords
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ✅ Map Selection Modal Component */}
      <MapSelectionModal
        visible={showSelectLocationModal}
        onClose={() => setShowSelectLocationModal(false)}
        shippingAddress={shippingAddress}
        updateCheckoutData={updateCheckoutData}
        updateShippingAddress={updateShippingAddress}
      />

      {/* ✅ Map View Modal Component */}
      <MapViewModal
        visible={showMapModal}
        onClose={() => setShowMapModal(false)}
        shippingAddress={shippingAddress}
      />
    </ScrollView>
  );
};

// ✅ थीम के हिसाब से डायनामिक स्टाइल्स फंक्शन
const getDynamicStyles = (isDark: boolean) => {
  return StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#0F172A' : '#ffffffff',
    },
    card: {
      backgroundColor: isDark ? '#1E293B' : '#fff',
      shadowColor: isDark ? '#000' : '#000',
    },
    cardTitle: {
      color: isDark ? '#F1F5F9' : '#333',
    },
    clearButton: {
      color: isDark ? '#FC8181' : '#e74c3c',
    },
    label: {
      color: isDark ? '#CBD5E0' : '#555',
    },
    searchContainer: {
      backgroundColor: isDark ? '#1E293B' : '#fff',
    },
    searchInput: {
      borderColor: isDark ? '#4A5568' : '#ddd',
      backgroundColor: isDark ? '#2D3748' : '#fff',
      color: isDark ? '#F1F5F9' : '#333',
    },
    instructionText: {
      color: isDark ? '#A0AEC0' : '#95a5a6',
    },
    selectLocationButton: {
      backgroundColor: isDark ? '#3182CE' : '#438bffff',
    },
    locationCard: {
      backgroundColor: isDark ? '#2D3748' : '#f8f9fa',
      borderColor: isDark ? '#4A5568' : '#e0e0e0',
    },
    locationTitle: {
      color: isDark ? '#CBD5E0' : '#555',
    },
    addressLabel: {
      color: isDark ? '#A0AEC0' : '#777',
    },
    addressValue: {
      color: isDark ? '#F7FAFC' : '#333',
    },
    coordinateLabel: {
      color: isDark ? '#A0AEC0' : '#777',
    },
    coordinateValueContainer: {
      backgroundColor: isDark ? '#2D3748' : '#f8f9fa',
      borderColor: isDark ? '#4A5568' : '#e0e0e0',
    },
    coordinateValue: {
      color: isDark ? '#F7FAFC' : '#333',
    },
    mapPreview: {
      backgroundColor: isDark ? '#2A4365' : '#4a90e2',
    },
    mapCoordinatesPreview: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    deliveryCard: {
      backgroundColor: isDark ? '#2D3748' : undefined,
      borderColor: isDark ? '#4A5568' : undefined,
    },
    freeDeliveryCard: {
      backgroundColor: isDark ? '#22543D' : '#f0f9f0',
      borderColor: isDark ? '#276749' : '#d4edda',
    },
    paidDeliveryCard: {
      backgroundColor: isDark ? '#2D3748' : '#f8f9fa',
      borderColor: isDark ? '#4A5568' : '#e0e0e0',
    },
    deliveryTitle: {
      color: isDark ? '#CBD5E0' : undefined,
    },
    deliveryRow: {
      borderBottomColor: isDark ? '#4A5568' : 'rgba(0,0,0,0.1)',
    },
    deliveryLabel: {
      color: isDark ? '#A0AEC0' : '#555',
    },
    deliveryValue: {
      color: isDark ? '#F7FAFC' : undefined,
    },
    deliveryTypeBadge: {
      backgroundColor: isDark ? '#2D3748' : undefined,
    },
    infoBox: {
      backgroundColor: isDark ? '#2D3748' : undefined,
      borderColor: isDark ? '#4A5568' : undefined,
    },
    infoText: {
      color: isDark ? '#CBD5E0' : '#2e7d32',
    },
    warningCard: {
      backgroundColor: isDark ? '#2D3748' : '#fff3cd',
      borderColor: isDark ? '#4A5568' : '#ffeaa7',
    },
    warningTitle: {
      color: isDark ? '#F6AD55' : '#856404',
    },
    warningText: {
      color: isDark ? '#FBD38D' : '#856404',
    },
    couponInputWrapper: {
      borderColor: isDark ? '#4A5568' : '#ddd',
      backgroundColor: isDark ? '#2D3748' : '#fff',
    },
    couponInput: {
      color: isDark ? '#F1F5F9' : '#333',
    },
    couponButton: {
      backgroundColor: isDark ? '#38A169' : '#2ecc71',
    },
    couponInfoBox: {
      backgroundColor: isDark ? '#2D3748' : '#f8f9fa',
      borderColor: isDark ? '#4A5568' : '#e9ecef',
    },
    couponInfoTitle: {
      color: isDark ? '#90CDF4' : '#495057',
    },
    couponInfoText: {
      color: isDark ? '#A0AEC0' : '#6c757d',
    },
    currentAmountText: {
      color: isDark ? '#FC8181' : '#e74c3c',
    },
    couponStatusCard: {
      backgroundColor: isDark ? '#2D3748' : '#f8f9fa',
      borderColor: isDark ? '#4A5568' : '#e0e0e0',
    },
    couponStatusTitle: {
      color: isDark ? '#90CDF4' : '#333',
    },
    statusRow: {
      borderBottomColor: isDark ? '#4A5568' : '#e0e0e0',
    },
    statusLabel: {
      color: isDark ? '#A0AEC0' : '#666',
    },
    statusValueContainer: {
      backgroundColor: isDark ? '#2D3748' : undefined,
    },
    statusValue: {
      color: isDark ? '#F7FAFC' : undefined,
    },
    loadingCard: {
      backgroundColor: isDark ? '#1E293B' : '#fff',
    },
    loadingText: {
      color: isDark ? '#CBD5E0' : '#666',
    },
    errorCard: {
      backgroundColor: isDark ? '#2D3748' : '#fff5f5',
      borderColor: isDark ? '#4A5568' : '#fecaca',
    },
    errorText: {
      color: isDark ? '#FC8181' : '#e74c3c',
    },
    suggestionBox: {
      backgroundColor: isDark ? '#2D3748' : '#fff3cd',
      borderColor: isDark ? '#4A5568' : '#ffeaa7',
    },
    suggestionText: {
      color: isDark ? '#F6AD55' : '#856404',
    },
    successCard: {
      backgroundColor: isDark ? '#22543D' : '#f0f9f0',
      borderColor: isDark ? '#276749' : '#d4edda',
    },
    successTitle: {
      color: isDark ? '#9AE6B4' : '#2e7d32',
    },
    successText: {
      color: isDark ? '#9AE6B4' : '#2e7d32',
    },
    successSubtext: {
      color: isDark ? '#68D391' : '#28a745',
    },
    successDismissButtonText: {
      color: isDark ? '#9AE6B4' : '#2e7d32',
    },
    modalContainer: {
      backgroundColor: isDark ? '#1E293B' : '#fff',
    },
    modalTitle: {
      color: isDark ? '#F1F5F9' : '#333',
    },
    resultsCountContainer: {
      backgroundColor: isDark ? '#2D3748' : '#f8f9fa',
    },
    resultsCountText: {
      color: isDark ? '#A0AEC0' : '#666',
    },
    resultItem: {
      borderBottomColor: isDark ? '#4A5568' : '#f5f5f5',
    },
    resultIconContainer: {
      backgroundColor: isDark ? '#2D3748' : '#e8f0fe',
    },
    resultPrimaryText: {
      color: isDark ? '#F1F5F9' : '#333',
    },
    resultSecondaryText: {
      color: isDark ? '#CBD5E0' : '#666',
    },
    noResultsText: {
      color: isDark ? '#A0AEC0' : '#999',
    },
    noResultsSubtext: {
      color: isDark ? '#718096' : '#bbb',
    },
  });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  searchContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 40,
    paddingVertical: 12,
    fontSize: 15,
  },
  searchLoader: {
    position: 'absolute',
    right: 12,
  },
  instructionText: {
    fontSize: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Select Location from Map Button
  selectLocationButton: {
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectLocationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  selectLocationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectLocationButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    textAlign: 'center',
  },

  locationCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  locationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  addressDisplay: {
    marginBottom: 12,
  },
  addressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  addressValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  coordinatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  coordinateContainer: {
    flex: 1,
  },
  coordinateLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  coordinateLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  coordinateValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  missingCoordinate: {
    borderColor: '#fecaca',
  },
  coordinateValue: {
    fontSize: 13,
    fontFamily: 'monospace',
  },
  missingCoordinateText: {
    color: '#e74c3c',
  },

  // Map Preview Styles
  mapActionsContainer: {
    marginTop: 16,
  },
  mapPreviewContainer: {
    marginBottom: 12,
  },
  mapPreview: {
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  mapPreviewOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  mapPreviewText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  mapCoordinatesPreview: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mapCoordinatesText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'monospace',
  },

  // Error Card Styles
  errorCard: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  suggestionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
  },
  suggestionText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  dismissButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dismissButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Success Card Styles
  successCard: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  successText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  successSubtext: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  successDismissButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  successDismissButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Coupon Information Box
  couponInfoBox: {
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
  },
  couponInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  couponInfoTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  couponInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  couponInfoText: {
    fontSize: 12,
  },
  currentAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 6,
  },
  currentAmountText: {
    fontSize: 12,
    fontWeight: '500',
  },

  deliveryCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  freeDeliveryCard: {},
  paidDeliveryCard: {},
  deliveryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  deliveryTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  freeDeliveryTitle: {
    color: '#2e7d32',
  },
  paidDeliveryTitle: {
    color: '#2e7d32',
  },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  deliveryLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  deliveryTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  freeDeliveryBadge: {},
  paidDeliveryBadge: {},
  deliveryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  freeDeliveryText: {
    color: '#2ecc71',
  },
  paidDeliveryText: {
    color: '#e74c3c',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    gap: 8,
  },
  freeDeliveryInfo: {},
  paidDeliveryInfo: {},
  infoText: {
    flex: 1,
    fontSize: 13,
  },
  warningCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
  couponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  couponInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
  },
  errorInput: {
    borderColor: '#e74c3c',
  },
  successInput: {
    borderColor: '#2ecc71',
  },
  couponIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  couponInput: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 46,
  },
  appliedCouponInput: {
    borderColor: '#2ecc71',
  },
  errorInputText: {
    color: '#e74c3c',
  },
  successInputText: {
    color: '#2e7d32',
  },
  couponButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 90,
    gap: 6,
  },
  removeButton: {
    backgroundColor: '#e74c3c',
  },
  disabledButton: {
    opacity: 0.7,
  },
  couponButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  couponStatusCard: {
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
  },
  couponStatusTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  couponStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  statusLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusValueContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  couponApplied: {
    backgroundColor: '#d4edda',
  },
  noCoupon: {},
  discountValue: {
    color: '#2ecc71',
  },
  noDiscountValue: {
    color: '#95a5a6',
  },
  cofundAppliedContainer: {
    backgroundColor: '#d4edda',
  },
  cofundNotAppliedContainer: {},
  cofundApplied: {
    color: '#3498db',
  },
  cofundNotApplied: {
    color: '#95a5a6',
  },
  loadingCard: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },

  // Modal Styles for Address Results
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
  },
  resultsCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  resultsList: {
    paddingBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  resultIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTextContainer: {
    flex: 1,
  },
  resultPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultSecondaryText: {
    fontSize: 12,
    lineHeight: 16,
  },
  noResultsContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
  },
});

export default AddressCouponStep;
