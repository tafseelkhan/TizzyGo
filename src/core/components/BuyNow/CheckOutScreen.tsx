// screens/CheckoutStepper.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Platform,
  Animated,
  Easing,
  Dimensions,
  Vibration,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';
import ProductStep from './ProductStep';
import AddressCouponStep from './AddressCouponStep';
import {
  Product,
  CheckoutData,
  CalculatedData,
  ShippingAddress,
  getProductDimensions,
} from '../../types/BuyNowTypes';
import {
  addToCart,
  updateCartItem,
  removeFromCart,
  fetchCart,
} from './AddToCart';
import PaymentStep from './PaymentStep';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { API_URL } from '@env';

// ✅ Color Palette with theme support
const getColors = (isDark: boolean) => ({
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',
  secondary: '#F59E0B',
  secondaryLight: '#FBBF24',
  secondaryDark: '#D97706',
  background: isDark ? '#0F172A' : '#FFFFFF',
  surface: isDark ? '#1E293B' : '#FFFFFF',
  bg: isDark ? '#0F172A' : '#FFFFFF',
  textPrimary: isDark ? '#F1F5F9' : '#1E293B',
  textSecondary: isDark ? '#CBD5E1' : '#64748B',
  textLight: isDark ? '#94A3B8' : '#94A3B8',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: isDark ? '#334155' : '#E5E7EB',
  shadow: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(124, 58, 237, 0.1)',
  gradientStart: '#7C3AED',
  gradientEnd: '#3B82F6',
  darkBackground: '#0F172A',
  darkSurface: '#1E293B',
  darkBorder: '#334155',
  darkTextPrimary: '#F1F5F9',
  darkTextSecondary: '#CBD5E1',
  lightBackground: '#FFFFFF',
  lightSurface: '#FFFFFF',
  lightBorder: '#E5E7EB',
  lightTextPrimary: '#1E293B',
  lightTextSecondary: '#64748B',
});

// ✅ Animation Constants
const ANIMATION_DURATION = 300;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ✅ Device-specific sizing
const isSmallDevice = SCREEN_HEIGHT < 700;
const isLargeDevice = SCREEN_HEIGHT >= 800;

// Font size scaling
const scaleFont = (baseSize: number) => {
  if (isSmallDevice) return baseSize - 2;
  if (isLargeDevice) return baseSize + 2;
  return baseSize;
};

// Spacing scaling
const scaleSpacing = (baseSpacing: number) => {
  if (isSmallDevice) return baseSpacing - 2;
  if (isLargeDevice) return baseSpacing + 2;
  return baseSpacing;
};

// ✅ Haptic Feedback Helper Function using Vibration
const triggerHaptic = (
  type:
    | 'light'
    | 'medium'
    | 'heavy'
    | 'success'
    | 'warning'
    | 'error' = 'light',
) => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      switch (type) {
        case 'light':
          Vibration.vibrate(10);
          break;
        case 'medium':
          Vibration.vibrate(20);
          break;
        case 'heavy':
          Vibration.vibrate(30);
          break;
        case 'success':
          Vibration.vibrate([0, 50, 30, 50]);
          break;
        case 'warning':
          Vibration.vibrate([0, 100, 50, 100]);
          break;
        case 'error':
          Vibration.vibrate([0, 200, 100, 200]);
          break;
      }
    } catch (error) {
      console.log('Vibration not available:', error);
    }
  }
};

// Utility Functions
const formatTruncate2Decimals = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) return '0.00';
  const strValue = value.toString();
  const decimalIndex = strValue.indexOf('.');
  if (decimalIndex === -1) return `${strValue}.00`;
  const decimalPart = strValue.substring(decimalIndex + 1);
  if (decimalPart.length === 1) return `${strValue}0`;
  else if (decimalPart.length >= 2)
    return strValue.substring(0, decimalIndex + 3);
  return strValue;
};

const getExactTotal = (calculatedData: CalculatedData | null): string => {
  if (
    !calculatedData ||
    !calculatedData.totalFinalPrice ||
    isNaN(calculatedData.totalFinalPrice)
  ) {
    return '0.00';
  }
  return formatTruncate2Decimals(calculatedData.totalFinalPrice);
};

// Helper function to parse coordinates
const parseCoordinate = (
  value: string | number | null | undefined,
): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

// ✅ Type-safe web style helper
const webStyle = <T extends Record<string, any>>(style: T): Partial<T> => {
  if (Platform.OS !== 'web') return {};
  return style as Partial<T>;
};

const CheckoutStepper: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  // ✅ Theme context
  const { isDark } = useTheme();
  const COLORS = getColors(isDark);

  // Extract route params
  const productId = route.params?.productId || null;
  const fromCart = route.params?.fromCart || false;
  const cartQuantity = route.params?.cartQuantity || 1;
  const routeProductData = route.params?.productData || null;

  // ✅ Animation Refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // State management
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState<boolean>(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [calculatedData, setCalculatedData] = useState<CalculatedData | null>(
    null,
  );
  const [backendResponse, setBackendResponse] = useState<any>(null);
  const [placingOrder, setPlacingOrder] = useState<boolean>(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [couponManuallyApplied, setCouponManuallyApplied] =
    useState<boolean>(false);
  const [isInCart, setIsInCart] = useState<boolean>(fromCart);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [cartLoading, setCartLoading] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>('user123');

  // Checkout data state
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    productId: productId || '',
    quantity: fromCart ? cartQuantity : 1,
    shippingAddress: {
      address: '',
      latitude: null,
      longitude: null,
      googlePlaceId: '',
    },
    couponCode: '',
    paymentMethod: null,
    orderNotes: '',
  });

  // Refs for debouncing and tracking - FIXED: Use ReturnType<typeof setTimeout>
  const calculationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCalculatingRef = useRef<boolean>(false);
  const lastAppliedCouponRef = useRef<string>('');

  // ✅ Fixed Toast function
  const showToast = {
    error: (message: string) => {
      Alert.alert('Error', message);
    },
    success: (message: string) => {
      Alert.alert('Success', message);
    },
  };

  // ✅ Step Change Animation
  const animateStepChange = (
    newStep: number,
    direction: 'forward' | 'backward',
  ) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: ANIMATION_DURATION / 2,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: ANIMATION_DURATION / 2,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(newStep);
      slideAnim.setValue(
        direction === 'forward' ? SCREEN_WIDTH : -SCREEN_WIDTH,
      );

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, []);

  // Initial data loading
  useEffect(() => {
    if (productId) {
      fetchUserId();
      fetchProductData();
    }
  }, [productId]);

  const fetchUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUserId(parsedUser._id || parsedUser.id || 'user123');
      }
    } catch (error) {
      console.error('Error fetching user ID:', error);
    }
  };

  const fetchProductData = async () => {
    if (!productId) {
      Alert.alert('Error', 'Product ID not found');
      navigation.goBack();
      return;
    }

    setLoading(true);

    try {
      let productData: Product;

      if (routeProductData) {
        console.log('✅ Using routeProductData');
        productData = routeProductData;
      } else {
        console.log('📡 Fetching product from API');
        const productUrl = `${API_URL}/api/seller/forms/categories/${productId}`;
        const response = await axios.get(productUrl, { timeout: 10000 });

        if (response.data.product) productData = response.data.product;
        else if (response.data.data) productData = response.data.data;
        else productData = response.data;
      }

      console.log('🎯 Product loaded:', productData.title);
      setProduct(productData);
      await fetchInitialCalculation(productData);

      if (!fromCart) {
        await checkIfInCart(productData);
      }
    } catch (error: any) {
      console.error('❌ Product fetch error:', error.message);
      let errorMessage = 'Failed to load product';
      if (error.response?.status === 404) errorMessage = 'Product not found';
      else if (error.code === 'ERR_NETWORK')
        errorMessage = 'Cannot connect to server.';

      Alert.alert('Product Load Failed', errorMessage, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const checkIfInCart = async (productData: Product) => {
    try {
      setCartLoading(true);
      const cartItem = await fetchCart(productData.id || productData._id);
      if (cartItem) {
        setIsInCart(true);
        setCheckoutData(prev => ({
          ...prev,
          quantity: cartItem.quantity || 1,
        }));
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setCartLoading(false);
    }
  };

  const clearCouponMessages = () => {
    setCouponError(null);
    setCouponSuccess(null);
  };

  const fetchInitialCalculation = async (productData: Product) => {
    console.log('\n💰 STEP 1: Initial calculation');

    try {
      const token = await AsyncStorage.getItem('authToken');
      setCalculating(true);

      const params: any = {
        productId,
        quantity: checkoutData.quantity,
      };

      if (productData.sellerLocation) {
        const sellerLat =
          productData.sellerLocation.latitude || productData.sellerLocation.lat;
        const sellerLng =
          productData.sellerLocation.longitude ||
          productData.sellerLocation.lng;

        if (sellerLat && sellerLng) {
          params.sellerLat = sellerLat;
          params.sellerLng = sellerLng;
        }
      }

      const response = await axios.get(`${API_URL}/api/buyer/buy`, {
        params,
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        timeout: 15000,
        validateStatus: status => status < 500,
      });

      if (response.status >= 400) {
        throw new Error(
          response.data?.error ||
            `Request failed with status ${response.status}`,
        );
      }

      if (response.data && response.data.calculated) {
        setCalculatedData(response.data.calculated);
      }
    } catch (error: any) {
      console.error('❌ Calculation error:', error.message);
      Alert.alert(
        'Calculation Error',
        'Price calculation failed. Please try again.',
      );
    } finally {
      setCalculating(false);
    }
  };

  // ✅ FIXED: Main calculation function
  const fetchCalculatedData = useCallback(
    async (
      options: {
        skipCouponCheck?: boolean;
        skipCouponOnAddressChange?: boolean;
        isLocationUpdate?: boolean;
      } = {},
    ) => {
      if (isCalculatingRef.current) {
        return;
      }

      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }

      calculationTimeoutRef.current = setTimeout(async () => {
        if (!productId || !product) {
          return;
        }

        try {
          isCalculatingRef.current = true;
          const token = await AsyncStorage.getItem('authToken');
          setCalculating(true);

          if (!options.skipCouponCheck) {
            clearCouponMessages();
          }

          const params: any = {
            productId,
            quantity: checkoutData.quantity,
          };

          if (options.isLocationUpdate) {
            params.isLocationUpdate = 'true';
          }

          // Seller location
          if (product.sellerLocation) {
            const sellerLat =
              product.sellerLocation.latitude || product.sellerLocation.lat;
            const sellerLng =
              product.sellerLocation.longitude || product.sellerLocation.lng;

            if (sellerLat && sellerLng) {
              params.sellerLat = sellerLat;
              params.sellerLng = sellerLng;
            }
            if (product.sellerLocation.address) {
              params.sellerAddress = product.sellerLocation.address;
            }
            if (product.sellerLocation.googlePlaceId) {
              params.sellerGooglePlaceId = product.sellerLocation.googlePlaceId;
            }
          }

          // Buyer location
          const shippingAddress = checkoutData.shippingAddress;
          const hasValidBuyerLocation =
            shippingAddress &&
            shippingAddress.latitude !== null &&
            shippingAddress.longitude !== null &&
            shippingAddress.latitude !== 0 &&
            shippingAddress.longitude !== 0;

          if (hasValidBuyerLocation) {
            params.buyerLat = shippingAddress.latitude;
            params.buyerLng = shippingAddress.longitude;
            if (shippingAddress.address) {
              params.buyerAddress = shippingAddress.address;
            }
            if (shippingAddress.googlePlaceId) {
              params.buyerGooglePlaceId = shippingAddress.googlePlaceId;
            }
          }

          // Coupon code
          const shouldSendCouponCode =
            checkoutData.couponCode &&
            checkoutData.couponCode.trim() !== '' &&
            !options.skipCouponOnAddressChange &&
            couponManuallyApplied;

          if (shouldSendCouponCode) {
            params.couponCode = checkoutData.couponCode;
          }

          const response = await axios.get(`${API_URL}/api/buyer/buy`, {
            params,
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json',
            },
            timeout: 20000,
            validateStatus: status => status < 500,
          });

          if (response.data && response.data.calculated) {
            const calculated = response.data.calculated;

            if (response.data.couponMessage) {
              if (
                response.data.couponMessage.includes('applied successfully') ||
                response.data.couponMessage.toLowerCase().includes('success')
              ) {
                setCouponSuccess(response.data.couponMessage);
                setCouponError(null);
                setCouponManuallyApplied(true);
              } else {
                setCouponError(response.data.couponMessage);
                setCouponSuccess(null);
                setCouponManuallyApplied(false);
              }
            }

            if (calculated.couponUsed && !couponSuccess) {
              setCouponSuccess(
                `Coupon "${calculated.couponUsed}" applied successfully!`,
              );
              setCouponError(null);
              setCouponManuallyApplied(true);
            } else if (!calculated.couponUsed) {
              setCouponManuallyApplied(false);
            }

            setCalculatedData(calculated);
          }
        } catch (error: any) {
          console.error('❌ Calculation error:', error.message);
          if (error.response?.data?.message) {
            setCouponError(error.response.data.message);
            setCouponManuallyApplied(false);
          }
        } finally {
          isCalculatingRef.current = false;
          setCalculating(false);
        }
      }, 500);
    },
    [
      productId,
      product,
      checkoutData.quantity,
      checkoutData.shippingAddress,
      checkoutData.couponCode,
      couponManuallyApplied,
      couponSuccess,
    ],
  );

  // ✅ Effect to trigger recalculation
  useEffect(() => {
    const hasValidCoordinates =
      checkoutData.shippingAddress &&
      checkoutData.shippingAddress.latitude !== null &&
      checkoutData.shippingAddress.longitude !== null &&
      checkoutData.shippingAddress.latitude !== 0 &&
      checkoutData.shippingAddress.longitude !== 0;

    if (hasValidCoordinates && product) {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }

      calculationTimeoutRef.current = setTimeout(() => {
        fetchCalculatedData({
          skipCouponOnAddressChange: true,
          isLocationUpdate: true,
        });
      }, 800);
    }

    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, [
    checkoutData.shippingAddress?.latitude,
    checkoutData.shippingAddress?.longitude,
    checkoutData.shippingAddress?.address,
    product,
    fetchCalculatedData,
  ]);

  // ✅ Handle address selected
  const handleAddressSelected = useCallback(
    (addressData: ShippingAddress) => {
      const processedAddress = {
        ...addressData,
        latitude: parseCoordinate(addressData.latitude),
        longitude: parseCoordinate(addressData.longitude),
      };

      setCheckoutData(prev => ({
        ...prev,
        shippingAddress: processedAddress,
      }));

      setTimeout(() => {
        fetchCalculatedData({
          skipCouponOnAddressChange: true,
          isLocationUpdate: true,
        });
      }, 800);
    },
    [fetchCalculatedData],
  );

  // ✅ FIXED: updateShippingAddress with generic type
  const updateShippingAddress = useCallback(
    (field: string | number | symbol, value: any) => {
      let processedValue = value;
      if (
        (field === 'latitude' || field === 'longitude') &&
        typeof value === 'string'
      ) {
        processedValue = parseCoordinate(value);
      }

      setCheckoutData(prev => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          [field]: processedValue,
        },
      }));
    },
    [],
  );

  // ✅ FIXED: updateCheckoutData with generic type
  const updateCheckoutData = useCallback(
    (key: string | number | symbol, value: any) => {
      if (key === 'couponCode') {
        clearCouponMessages();
      }

      setCheckoutData(prev => ({
        ...prev,
        [key]: value,
      }));

      if (key === 'quantity') {
        setTimeout(() => {
          fetchCalculatedData();
        }, 300);
      }
    },
    [fetchCalculatedData],
  );

  // ✅ Coupon handlers
  const handleApplyCoupon = async (couponCode: string) => {
    if (isApplyingCoupon || calculating) return;

    if (couponManuallyApplied && calculatedData?.couponUsed === couponCode) {
      return;
    }

    try {
      setIsApplyingCoupon(true);
      clearCouponMessages();

      setCheckoutData(prev => ({
        ...prev,
        couponCode: couponCode,
      }));

      setCouponManuallyApplied(true);
      await fetchCalculatedData();
    } catch (error) {
      setCouponError('Failed to apply coupon. Please try again.');
      setCouponManuallyApplied(false);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    if (isApplyingCoupon || calculating) return;

    try {
      setIsApplyingCoupon(true);
      clearCouponMessages();

      setCheckoutData(prev => ({
        ...prev,
        couponCode: '',
      }));

      setCouponManuallyApplied(false);
      lastAppliedCouponRef.current = '';
      await fetchCalculatedData({ skipCouponCheck: true });
      setCouponSuccess('Coupon removed successfully');
    } catch (error) {
      setCouponError('Failed to remove coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Cart handlers
  const handleAddToCart = async () => {
    if (!product) return;

    setIsAdding(true);
    try {
      const success = await addToCart({
        productId: product.id || product._id,
        productData: product,
        quantity: checkoutData.quantity,
      });

      if (success) {
        setIsInCart(true);
        Alert.alert('Success', 'Added to cart successfully!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error adding to cart');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateCartQuantity = async (newQuantity: number) => {
    if (!product || newQuantity < 1) return;

    setCartLoading(true);
    try {
      const success = await updateCartItem({
        productId: product.id || product._id,
        quantity: newQuantity,
      });

      if (success) {
        setCheckoutData(prev => ({ ...prev, quantity: newQuantity }));
        Alert.alert('Success', 'Quantity updated successfully!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error updating quantity');
    } finally {
      setCartLoading(false);
    }
  };

  const handleRemoveFromCart = async () => {
    if (!product) return;

    setCartLoading(true);
    try {
      const success = await removeFromCart(product.id || product._id);
      if (success) {
        setIsInCart(false);
        Alert.alert('Success', 'Removed from cart successfully!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error removing from cart');
    } finally {
      setCartLoading(false);
    }
  };

  const handleUpdateQuantity = (newQuantity: number) => {
    if (!product || newQuantity < 1) return;
    updateCheckoutData('quantity', newQuantity);
  };

  // Navigation handlers
  const handleNext = () => {
    if (calculating || loading || isApplyingCoupon || placingOrder) {
      Alert.alert('Please Wait', 'Processing... Please wait.');
      return;
    }

    if (currentStep === 0) {
      if (checkoutData.quantity < 1) {
        Alert.alert('Error', 'Quantity must be at least 1');
        return;
      }
      triggerHaptic('medium');
      animateStepChange(1, 'forward');
    } else if (currentStep === 1) {
      const isFreeDelivery =
        product?.freeDelivery === true || product?.delivery === 'free';

      if (!isFreeDelivery) {
        if (!checkoutData.shippingAddress.address.trim()) {
          Alert.alert('Error', 'Please enter shipping address');
          return;
        }

        const lat = checkoutData.shippingAddress.latitude;
        const lng = checkoutData.shippingAddress.longitude;

        if (lat === null || lng === null || lat === 0 || lng === 0) {
          Alert.alert(
            'Error',
            'Please select a valid address from suggestions',
          );
          return;
        }
      }
      triggerHaptic('medium');
      animateStepChange(2, 'forward');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      triggerHaptic('light');
      animateStepChange(currentStep - 1, 'backward');
    }
  };

  // Step Circle Component
  const StepCircle = ({
    index,
    isActive,
    isCompleted,
  }: {
    index: number;
    isActive: boolean;
    isCompleted: boolean;
  }) => {
    const scaleAnim = useRef(new Animated.Value(isActive ? 1.1 : 1)).current;

    useEffect(() => {
      Animated.spring(scaleAnim, {
        toValue: isActive ? 1.1 : 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }, [isActive]);

    const circleSize = scaleSpacing(32);

    return (
      <Animated.View
        style={[
          styles.stepCircle,
          isCompleted && styles.completedStep,
          isActive && styles.activeStep,
          {
            transform: [{ scale: scaleAnim }],
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            backgroundColor: isCompleted
              ? COLORS.success
              : isActive
              ? COLORS.primary
              : COLORS.border,
          },
        ]}
      >
        {isCompleted ? (
          <Text style={styles.stepCheck}>✓</Text>
        ) : (
          <Text
            style={[
              styles.stepNumber,
              isActive && styles.activeStepNumber,
              { color: isActive ? '#fff' : COLORS.textSecondary },
            ]}
          >
            {index + 1}
          </Text>
        )}
      </Animated.View>
    );
  };

  // Render current step
  const renderCurrentStep = () => {
    const stepComponent = (() => {
      switch (currentStep) {
        case 0:
          return (
            <ProductStep
              product={product}
              checkoutData={checkoutData}
              updateCheckoutData={updateCheckoutData}
              calculatedData={calculatedData}
              loading={calculating}
              isInCart={isInCart}
              cartLoading={cartLoading}
              onUpdateQuantity={handleUpdateQuantity}
              userId={userId}
              onAddToCart={handleAddToCart}
              onUpdateCartQuantity={handleUpdateCartQuantity}
              onRemoveFromCart={handleRemoveFromCart}
              showToast={showToast}
            />
          );
        case 1:
          return (
            <AddressCouponStep
              checkoutData={checkoutData}
              updateCheckoutData={updateCheckoutData}
              updateShippingAddress={updateShippingAddress}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              isApplyingCoupon={isApplyingCoupon}
              product={product}
              calculatedData={calculatedData}
              loading={calculating}
              onAddressSelected={handleAddressSelected}
              couponError={couponError}
              couponSuccess={couponSuccess}
              clearCouponMessages={clearCouponMessages}
            />
          );
        case 2:
          return (
            <PaymentStep
              checkoutData={checkoutData}
              updateCheckoutData={updateCheckoutData}
              product={product}
              calculatedData={calculatedData}
              loading={placingOrder}
            />
          );
        default:
          return null;
      }
    })();

    return (
      <Animated.View
        style={[
          styles.stepContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
            backgroundColor: COLORS.bg,
          },
        ]}
      >
        {stepComponent}
      </Animated.View>
    );
  };

  const getTotal = (): string => {
    return `₹${getExactTotal(calculatedData)}`;
  };

  const renderFooterButtons = () => {
    if (currentStep === 2) {
      return null;
    }

    return (
      <View
        style={[
          styles.buttonContainer,
          currentStep > 0
            ? styles.buttonRowWithBack
            : styles.buttonRowWithoutBack,
        ]}
      >
        {currentStep > 0 && (
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              styles.buttonHover,
              {
                backgroundColor: COLORS.surface,
                borderColor: COLORS.border,
              },
            ]}
            onPress={() => {
              triggerHaptic('light');
              handlePrevious();
            }}
            disabled={calculating || isApplyingCoupon || placingOrder}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                { color: COLORS.textSecondary },
              ]}
            >
              ← Back
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.primaryButtonContainer,
            (calculating || loading || isApplyingCoupon || placingOrder) &&
              styles.disabledButton,
          ]}
          onPress={() => {
            triggerHaptic('medium');
            handleNext();
          }}
          disabled={calculating || loading || isApplyingCoupon || placingOrder}
        >
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            style={styles.primaryButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {calculating || loading || isApplyingCoupon || placingOrder ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.primaryButtonText}>Continue</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  // Loading state
  if (loading && !product) {
    return (
      <View
        style={[styles.loaderContainer, { backgroundColor: COLORS.background }]}
      >
        <Animated.View style={styles.loadingSpinner}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </Animated.View>
        <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>
          Loading product details...
        </Text>
      </View>
    );
  }

  // Error state
  if (!product) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: COLORS.background }]}
      >
        <View style={styles.errorIcon}>
          <Text style={styles.errorIconText}>!</Text>
        </View>
        <Text style={[styles.errorText, { color: COLORS.textPrimary }]}>
          Product not found
        </Text>
        <TouchableOpacity
          style={[styles.goBackButton, styles.buttonHover]}
          onPress={() => {
            triggerHaptic('light');
            navigation.goBack();
          }}
        >
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  // Main render
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: COLORS.background }]}
    >
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              navigation.goBack();
            }}
            style={[styles.backButton, styles.buttonHover]}
          >
            <Text style={styles.headerBackText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <View
        style={[
          styles.stepIndicatorContainer,
          { backgroundColor: COLORS.surface },
        ]}
      >
        {['Product', 'Address', 'Payment'].map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <View key={index} style={styles.stepItem}>
              <StepCircle
                index={index}
                isActive={isActive}
                isCompleted={isCompleted}
              />
              <Text
                style={[
                  styles.stepText,
                  isActive && styles.activeStepText,
                  isCompleted && styles.completedStepText,
                  {
                    color: isActive
                      ? COLORS.primary
                      : isCompleted
                      ? COLORS.success
                      : COLORS.textLight,
                  },
                ]}
              >
                {step}
              </Text>

              {index < 2 && (
                <View
                  style={[
                    styles.stepConnector,
                    isCompleted && styles.completedConnector,
                    {
                      backgroundColor: isCompleted
                        ? COLORS.success
                        : COLORS.border,
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      <ScrollView
        style={[styles.content, { backgroundColor: COLORS.background }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {renderCurrentStep()}
      </ScrollView>

      {currentStep < 2 && (
        <LinearGradient
          colors={['#0F172A', COLORS.background]}
          style={styles.footerGradient}
        >
          <View style={styles.footer}>
            <View
              style={[styles.priceCard, { backgroundColor: COLORS.surface }]}
            >
              <View style={styles.priceRow}>
                <Text
                  style={[styles.totalLabel, { color: COLORS.textSecondary }]}
                >
                  Total:
                </Text>
                <View style={styles.totalContainer}>
                  <Text style={[styles.totalPrice, { color: COLORS.primary }]}>
                    {getTotal()}
                  </Text>
                  {calculatedData?.discountApplied &&
                    calculatedData.discountApplied > 0 && (
                      <Text
                        style={[
                          styles.discountBadge,
                          {
                            color: COLORS.success,
                            backgroundColor: `${COLORS.success}15`,
                          },
                        ]}
                      >
                        -₹
                        {formatTruncate2Decimals(
                          calculatedData.discountApplied,
                        )}
                      </Text>
                    )}
                </View>
              </View>
            </View>
            {renderFooterButtons()}
          </View>
        </LinearGradient>
      )}
    </SafeAreaView>
  );
};

// Styles remain the same as your existing styles...
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingSpinner: {
    transform: [{ scale: 1.1 }],
  },
  loadingText: {
    marginTop: scaleSpacing(12),
    fontSize: scaleFont(14),
    fontWeight: '500',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorIcon: {
    width: scaleSpacing(50),
    height: scaleSpacing(50),
    borderRadius: scaleSpacing(25),
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSpacing(16),
  },
  errorIconText: {
    color: '#fff',
    fontSize: scaleFont(28),
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: scaleFont(16),
    marginBottom: scaleSpacing(20),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  goBackButton: {
    width: '80%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingHorizontal: scaleSpacing(20),
    paddingVertical: scaleSpacing(12),
    alignItems: 'center',
  },
  goBackButtonText: {
    color: '#fff',
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  headerGradient: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSpacing(16),
    paddingVertical: scaleSpacing(12),
    paddingTop: Platform.OS === 'ios' ? scaleSpacing(8) : scaleSpacing(12),
  },
  backButton: {
    padding: scaleSpacing(8),
    borderRadius: 10,
  },
  headerBackText: {
    fontSize: scaleFont(20),
    fontWeight: 'bold',
    color: '#fff',
  },
  headerTitle: {
    fontSize: scaleFont(16),
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: scaleSpacing(36),
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleSpacing(20),
    paddingVertical: scaleSpacing(16),
    marginHorizontal: scaleSpacing(12),
    marginTop: scaleSpacing(-12),
    borderRadius: 12,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
    minWidth: 70,
  },
  stepCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSpacing(6),
    zIndex: 2,
  },
  activeStep: {},
  completedStep: {
    backgroundColor: '#10B981',
  },
  stepNumber: {
    fontWeight: 'bold',
    fontSize: scaleFont(12),
  },
  activeStepNumber: {
    color: '#fff',
  },
  stepCheck: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: scaleFont(14),
  },
  stepText: {
    fontSize: scaleFont(10),
    fontWeight: '600',
    textAlign: 'center',
    marginTop: scaleSpacing(2),
  },
  activeStepText: {
    fontWeight: '700',
  },
  completedStepText: {
    fontWeight: '600',
  },
  stepConnector: {
    position: 'absolute',
    top: scaleSpacing(16),
    left: '55%',
    right: '-45%',
    height: 2,
    zIndex: 1,
  },
  completedConnector: {},
  content: {
    flex: 1,
    paddingHorizontal: scaleSpacing(12),
    paddingVertical: scaleSpacing(8),
  },
  scrollContent: {
    paddingBottom: scaleSpacing(100),
  },
  stepContainer: {
    borderRadius: 12,
    padding: scaleSpacing(16),
    marginBottom: scaleSpacing(12),
  },
  footerGradient: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  footer: {
    padding: scaleSpacing(16),
  },
  priceCard: {
    borderRadius: 10,
    padding: scaleSpacing(12),
    marginBottom: scaleSpacing(16),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalPrice: {
    fontSize: scaleFont(22),
    fontWeight: 'bold',
  },
  discountBadge: {
    fontSize: scaleFont(10),
    paddingHorizontal: scaleSpacing(6),
    paddingVertical: scaleSpacing(1),
    borderRadius: 3,
    marginTop: scaleSpacing(2),
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: scaleSpacing(10),
  },
  buttonRowWithBack: {
    justifyContent: 'space-between',
  },
  buttonRowWithoutBack: {
    justifyContent: 'flex-end',
  },
  primaryButtonContainer: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    minHeight: scaleSpacing(44),
  },
  primaryButtonGradient: {
    paddingVertical: scaleSpacing(12),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: scaleSpacing(44),
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: scaleFont(14),
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  buttonArrow: {
    color: '#fff',
    fontSize: scaleFont(16),
    fontWeight: 'bold',
    marginLeft: scaleSpacing(4),
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: scaleSpacing(12),
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: scaleSpacing(44),
  },
  secondaryButtonText: {
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonHover: {},
});

export default CheckoutStepper;