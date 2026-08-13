// CheckoutStepper.tsx - COMPLETE FIXED VERSION
// ✅ COD and Razorpay both navigate to OrderConfirmation

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
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
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../../contexts/theme/ThemeContext';
import { useCheckout } from '../../../hooks/useCheckOut';
import { useProduct } from '../../../hooks/useProductStep';
import {
  scaleFont,
  scaleSpacing,
  formatTruncate2Decimals,
  parseCoordinate,
  triggerHaptic,
  getGrandTotalSafe,
  getDiscountAppliedSafe,
} from '../../../utils/buyers/shop/checkoutUtils';
import {
  Product,
  CheckoutData,
  CalculatedData,
  ShippingAddress,
} from '../../../types/ShopTypes';
import ProductStep from './ProductStep';
import PaymentStep from './PaymentStep';

import { EssentialProductInfo } from '../../../services/buyers/shop/checkoutService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ANIMATION_DURATION = 300;

// ✅ GREEN THEME COLORS
const GREEN_PRIMARY = '#10B981';
const GREEN_BG = '#ECFDF5';
const GREEN_DARK = '#065F46';

const getColors = (isDark: boolean) => ({
  primary: GREEN_PRIMARY,
  background: isDark ? '#0F172A' : GREEN_BG,
  surface: isDark ? '#1E293B' : '#FFFFFF',
  textPrimary: isDark ? '#F1F5F9' : '#1E293B',
  textSecondary: isDark ? '#CBD5E1' : '#64748B',
  success: GREEN_PRIMARY,
  error: '#EF4444',
  border: isDark ? '#334155' : '#E5E7EB',
});

const CheckoutStepper: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const COLORS = getColors(isDark);

  const productId = route.params?.productId || null;
  const variantId = route.params?.variantId || null;
  const fromCart = route.params?.fromCart || false;
  const cartQuantity = route.params?.cartQuantity || 1;
  const routeProductData = route.params?.productData || null;

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [currentStep, setCurrentStep] = useState(0);
  const [essentialProductInfo, setEssentialProductInfo] =
    useState<EssentialProductInfo | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [userId, setUserId] = useState('user123');
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(
    null,
  );

  const productSetRef = useRef(false);
  const locationAlertShownRef = useRef(false);

  const {
    product: fetchedProduct,
    loading: productLoading,
    error: productError,
    refreshing,
    onRefresh,
  } = useProduct({
    productId,
    variantId: variantId,
    initialData: routeProductData || null,
    autoFetch: true,
  });

  const product = useMemo(() => {
    if (!fetchedProduct) return null;
    return fetchedProduct as any as Product;
  }, [fetchedProduct]);

  const [checkoutData, setCheckoutData] = useState<CheckoutData>(() => ({
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
    selectedVariant: null,
    isBuyNow: !fromCart,
    sellerId: '',
    productDataId: productId || '',
  }));

  const updateCheckoutData = useCallback((key: string, value: any) => {
    setCheckoutData(prev => {
      if (prev[key as keyof CheckoutData] === value) {
        return prev;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const updateShippingAddress = useCallback(
    (field: keyof ShippingAddress, value: any) => {
      let processedValue = value;
      if (
        (field === 'latitude' || field === 'longitude') &&
        typeof value === 'string'
      ) {
        processedValue = parseCoordinate(value);
      }

      setCheckoutData(prev => {
        if (prev.shippingAddress[field] === processedValue) {
          return prev;
        }
        return {
          ...prev,
          shippingAddress: { ...prev.shippingAddress, [field]: processedValue },
        };
      });
    },
    [],
  );

  const setEssentialInfo = useCallback((info: EssentialProductInfo) => {
    setEssentialProductInfo(prev => {
      if (JSON.stringify(prev) === JSON.stringify(info)) {
        return prev;
      }
      return info;
    });
  }, []);

  useEffect(() => {
    if (product && !productSetRef.current) {
      productSetRef.current = true;

      const essentialInfo: EssentialProductInfo = {
        mongoObjectId: product._id || '',
        displayProductId: product.productId || productId || '',
        vendorCodeUID: (product as any).vendorCodeUID || '',
        sellerId: (product as any).sellerId || '',
        sellerLocation: product.sellerLocation || null,
      };
      setEssentialInfo(essentialInfo);

      updateCheckoutData('sellerId', (product as any).sellerId || '');
      updateCheckoutData('productDataId', product.productId || productId || '');

      if ((product as any).selectedVariant) {
        updateCheckoutData('selectedVariant', (product as any).selectedVariant);
      }
    }
  }, [product, productId, setEssentialInfo, updateCheckoutData]);

  const {
    calculatedData,
    calculating,
    couponError,
    couponSuccess,
    locationError,
    clearCouponMessages,
    applyCoupon,
    removeCoupon,
  } = useCheckout({
    essentialProductInfo,
    quantity: checkoutData.quantity,
    shippingAddress: checkoutData.shippingAddress,
    couponCode: checkoutData.couponCode,
  });

  useEffect(() => {
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
    fetchUserId();
  }, []);

  useEffect(() => {
    if (productError) {
      Alert.alert('Product Load Failed', productError, [
        { text: 'Retry', onPress: () => onRefresh() },
        { text: 'Go Back', onPress: () => navigation.goBack() },
      ]);
    }
  }, [productError, onRefresh, navigation]);

  useEffect(() => {
    if (locationError && !locationAlertShownRef.current) {
      locationAlertShownRef.current = true;
      Alert.alert(
        '📍 Address Required',
        'Please set your delivery address in your profile first.',
        [
          {
            text: 'Go to Profile',
            onPress: () => {
              locationAlertShownRef.current = false;
              navigation.navigate('Profile');
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              locationAlertShownRef.current = false;
            },
          },
        ],
      );
    }
  }, [locationError, navigation]);

  const animateStepChange = useCallback(
    (newStep: number, direction: 'forward' | 'backward') => {
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
    },
    [fadeAnim, scaleAnim, slideAnim],
  );

  const handleApplyCoupon = useCallback(
    async (code: string) => {
      if (isApplyingCoupon || calculating) return;
      setIsApplyingCoupon(true);
      updateCheckoutData('couponCode', code);
      await applyCoupon(code);
      setIsApplyingCoupon(false);
    },
    [isApplyingCoupon, calculating, applyCoupon, updateCheckoutData],
  );

  const handleRemoveCoupon = useCallback(async () => {
    if (isApplyingCoupon || calculating) return;
    setIsApplyingCoupon(true);
    updateCheckoutData('couponCode', '');
    await removeCoupon();
    setIsApplyingCoupon(false);
  }, [isApplyingCoupon, calculating, removeCoupon, updateCheckoutData]);

  const handleNext = useCallback(() => {
    if (calculating || productLoading || isApplyingCoupon || placingOrder) {
      Alert.alert('Please Wait', 'Processing... Please wait.');
      return;
    }

    if (locationError) {
      Alert.alert(
        '📍 Address Required',
        'Please set your delivery address in your profile first.',
        [
          {
            text: 'Go to Profile',
            onPress: () => navigation.navigate('Profile'),
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }

    if (currentStep === 0) {
      if (!product) {
        Alert.alert('Error', 'Product not found');
        return;
      }
      triggerHaptic('medium');
      animateStepChange(1, 'forward');
    }
  }, [
    calculating,
    productLoading,
    isApplyingCoupon,
    placingOrder,
    currentStep,
    product,
    locationError,
    animateStepChange,
    navigation,
  ]);

  const getTotal = useMemo(() => {
    const total = getGrandTotalSafe(calculatedData);
    return total ? `₹${formatTruncate2Decimals(total)}` : '₹0.00';
  }, [calculatedData]);

  const getDiscountApplied = useMemo(
    () => getDiscountAppliedSafe(calculatedData),
    [calculatedData],
  );

  // ✅ FIXED: handleOrderConfirmed with proper navigation for both COD and Razorpay
  const handleOrderConfirmed = useCallback(
    (orderData: any) => {
      console.log('🎉 [CheckoutStepper] Order confirmed callback received:');
      console.log('📦 orderData:', JSON.stringify(orderData, null, 2));

      // ✅ Extract checkoutSessionId from multiple possible sources
      let sessionId =
        orderData?.checkoutSessionId ||
        orderData?.checkoutSession?.checkoutSessionId ||
        orderData?.transaction?.checkoutSessionId ||
        orderData?.transaction?.checkoutSession?.checkoutSessionId ||
        null;

      console.log(
        `📱 [CheckoutStepper] Extracted checkoutSessionId: ${sessionId}`,
      );

      // ✅ If we have checkoutSessionId, navigate to OrderConfirmation
      if (sessionId) {
        console.log(
          `📱 [CheckoutStepper] ✅ Navigating to OrderConfirmation with: ${sessionId}`,
        );
        navigation.navigate('OrderConfirmation', {
          checkoutSessionId: sessionId,
        });
        return;
      }

      // ✅ Fallback: Check if orderData has orderId
      const orderId =
        orderData?.orderId || orderData?.transaction?.orderId || null;
      if (orderId) {
        console.log(
          `📱 [CheckoutStepper] ⚠️ No checkoutSessionId, but has orderId: ${orderId}`,
        );
        Alert.alert(
          'Order Placed',
          `Your order #${orderId} has been placed successfully!`,
          [
            {
              text: 'View Orders',
              onPress: () => navigation.navigate('Orders'),
            },
            { text: 'OK', onPress: () => navigation.navigate('CustomerShop') },
          ],
        );
        return;
      }

      // ✅ Ultimate fallback - show success and go to Orders
      console.log('⚠️ [CheckoutStepper] No checkoutSessionId or orderId found');
      Alert.alert('Order Placed', 'Your order has been placed successfully!', [
        { text: 'View Orders', onPress: () => navigation.navigate('Orders') },
        { text: 'OK', onPress: () => navigation.navigate('CustomerShop') },
      ]);
    },
    [navigation, checkoutData],
  );

  const loadingView = useMemo(
    () => (
      <View
        style={[styles.loaderContainer, { backgroundColor: COLORS.background }]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>
          Loading product details...
        </Text>
      </View>
    ),
    [COLORS],
  );

  const errorView = useMemo(
    () => (
      <View
        style={[styles.errorContainer, { backgroundColor: COLORS.background }]}
      >
        <View style={[styles.errorIcon, { backgroundColor: COLORS.error }]}>
          <Icon name="error" size={scaleFont(28)} color="#fff" />
        </View>
        <Text style={[styles.errorText, { color: COLORS.textPrimary }]}>
          {productError || 'Product not found'}
        </Text>
        <TouchableOpacity
          style={styles.goBackButton}
          onPress={() => navigation.goBack()}
        >
          <View
            style={[styles.gradientButton, { backgroundColor: COLORS.primary }]}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </View>
        </TouchableOpacity>
      </View>
    ),
    [COLORS, productError, navigation],
  );

  if (productLoading && !product) return loadingView;
  if (!product && productError) return errorView;
  if (!product) return null;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: COLORS.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>
          {currentStep === 0 ? 'Checkout' : 'Payment'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <Animated.View
          style={[
            styles.stepContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          {currentStep === 0 && (
            <ProductStep
              product={product}
              checkoutData={checkoutData}
              updateCheckoutData={updateCheckoutData}
              updateShippingAddress={updateShippingAddress}
              calculatedData={calculatedData}
              loading={calculating}
              userId={userId}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              isApplyingCoupon={isApplyingCoupon}
              couponError={couponError}
              couponSuccess={couponSuccess}
              clearCouponMessages={clearCouponMessages}
              showToast={{
                error: (msg: string) => Alert.alert('Error', msg),
                success: (msg: string) => Alert.alert('Success', msg),
              }}
            />
          )}
          {currentStep === 1 && (
            <PaymentStep
              checkoutData={checkoutData}
              updateCheckoutData={updateCheckoutData}
              product={product}
              calculatedData={calculatedData}
              loading={placingOrder}
              onOrderConfirmed={handleOrderConfirmed}
            />
          )}
        </Animated.View>
      </ScrollView>

      {currentStep === 0 && (
        <View
          style={[
            styles.footerWrapper,
            {
              paddingBottom: Platform.OS === 'ios' ? 20 : 12,
              paddingHorizontal: 24,
            },
          ]}
        >
          <View
            style={[
              styles.footerContainer,
              {
                backgroundColor: isDark ? '#1E293B' : '#10B981',
                borderColor: isDark ? '#334155' : '#10B981',
              },
            ]}
          >
            <View style={styles.footerContent}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: '#FFFFFF',
                  },
                  (calculating || productLoading || isApplyingCoupon) &&
                    styles.disabledButton,
                ]}
                onPress={handleNext}
                disabled={calculating || productLoading || isApplyingCoupon}
                activeOpacity={0.8}
              >
                {calculating || productLoading || isApplyingCoupon ? (
                  <ActivityIndicator color={GREEN_PRIMARY} size="small" />
                ) : (
                  <>
                    <Text
                      style={[
                        styles.primaryButtonText,
                        { color: GREEN_PRIMARY },
                      ]}
                    >
                      Proceed to Payment
                    </Text>
                    <Icon
                      name="arrow-forward"
                      size={20}
                      color={GREEN_PRIMARY}
                    />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.totalContainer}>
              <Text
                style={[styles.totalLabel, { color: 'rgba(255,255,255,0.8)' }]}
              >
                Total:
              </Text>
              <Text style={[styles.totalPrice, { color: '#FFFFFF' }]}>
                {getTotal}
              </Text>
              {getDiscountApplied > 0 && (
                <Text
                  style={[
                    styles.discountBadge,
                    {
                      color: '#FFFFFF',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                    },
                  ]}
                >
                  -₹{formatTruncate2Decimals(getDiscountApplied)}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSpacer: { width: 40 },
  content: { flex: 1 },
  stepContainer: {
    paddingHorizontal: 12,
    paddingBottom: 120,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  goBackButton: { width: '80%', borderRadius: 10, overflow: 'hidden' },
  gradientButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  goBackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerContainer: {
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  discountBadge: {
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    minHeight: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  disabledButton: { opacity: 0.6 },
});

export default CheckoutStepper;
