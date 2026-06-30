// screens/CheckoutStepper.tsx - FINAL COMPLETE VERSION

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
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
import LinearGradient from 'react-native-linear-gradient';
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
  SelectedVariant,
} from '../../../types/ShopTypes';
import AddressStep from './AddressCouponStep';
import ProductStep from './ProductStep';
import PaymentStep from './PaymentStep';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ANIMATION_DURATION = 300;

const getColors = (isDark: boolean) => ({
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',
  secondary: '#F59E0B',
  background: isDark ? '#0F172A' : '#FFFFFF',
  surface: isDark ? '#1E293B' : '#FFFFFF',
  textPrimary: isDark ? '#F1F5F9' : '#1E293B',
  textSecondary: isDark ? '#CBD5E1' : '#64748B',
  textLight: isDark ? '#94A3B8' : '#94A3B8',
  success: '#10B981',
  error: '#EF4444',
  border: isDark ? '#334155' : '#E5E7EB',
  gradientStart: '#7C3AED',
  gradientEnd: '#3B82F6',
});

const StepCircle = memo(({ index, isActive, isCompleted, colors }: any) => {
  const scaleAnim = useRef(new Animated.Value(isActive ? 1.1 : 1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isActive ? 1.1 : 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [isActive, scaleAnim]);

  return (
    <Animated.View
      style={[
        styles.stepCircle,
        isCompleted && styles.completedStep,
        isActive && styles.activeStep,
        {
          transform: [{ scale: scaleAnim }],
          width: scaleSpacing(32),
          height: scaleSpacing(32),
          borderRadius: scaleSpacing(16),
          backgroundColor: isCompleted
            ? colors.success
            : isActive
            ? colors.primary
            : colors.border,
        },
      ]}
    >
      {isCompleted ? (
        <Icon name="check" size={scaleFont(14)} color="#fff" />
      ) : (
        <Text
          style={[
            styles.stepNumber,
            isActive && styles.activeStepNumber,
            { color: isActive ? '#fff' : colors.textSecondary },
          ]}
        >
          {index + 1}
        </Text>
      )}
    </Animated.View>
  );
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

  // ✅ Step Order: 0 = Address, 1 = Product, 2 = Payment
  const [currentStep, setCurrentStep] = useState(0);
  const [essentialProductInfo, setEssentialProductInfo] = useState<any>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [userId, setUserId] = useState('user123');

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
    selectedVariant: null,
  });

  useEffect(() => {
    if (product) {
      const essentialInfo = {
        mongoObjectId: product._id || '',
        displayProductId: product.productId || productId,
        vendorCodeUID: (product as any).vendorCodeUID || '',
        sellerId: (product as any).sellerId || '',
        sellerLocation: product.sellerLocation || null,
      };
      setEssentialProductInfo(essentialInfo);
      console.log('✅ [Checkout] Essential product info set:', essentialInfo);

      if ((product as any).selectedVariant) {
        setCheckoutData(prev => ({
          ...prev,
          selectedVariant: (product as any).selectedVariant,
        }));
      }
    }
  }, [product, productId]);

  // ✅ useCheckout hook - calculatedData properly fetched
  const {
    calculatedData,
    calculating,
    couponError,
    couponSuccess,
    clearCouponMessages,
    applyCoupon,
    removeCoupon,
  } = useCheckout({
    essentialProductInfo,
    quantity: checkoutData.quantity,
    shippingAddress: checkoutData.shippingAddress,
    couponCode: checkoutData.couponCode,
  });

  // ✅ Debug: Log calculatedData changes
  useEffect(() => {
    console.log('📊 [Checkout] calculatedData updated:', {
      hasData: !!calculatedData,
      grandTotal: calculatedData?.grandTotal,
      subtotal: calculatedData?.subtotal,
    });
  }, [calculatedData]);

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

  const handleAddressSelected = useCallback((addressData: ShippingAddress) => {
    setCheckoutData(prev => ({
      ...prev,
      shippingAddress: {
        ...addressData,
        latitude: parseCoordinate(addressData.latitude),
        longitude: parseCoordinate(addressData.longitude),
      },
    }));
  }, []);

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
        shippingAddress: { ...prev.shippingAddress, [field]: processedValue },
      }));
    },
    [],
  );

  const updateCheckoutData = useCallback(
    (key: string, value: any) => {
      if (key === 'couponCode') clearCouponMessages();
      setCheckoutData(prev => ({
        ...prev,
        [key as keyof CheckoutData]: value,
      }));
    },
    [clearCouponMessages],
  );

  const handleApplyCoupon = useCallback(
    async (code: string) => {
      if (isApplyingCoupon || calculating) return;
      setIsApplyingCoupon(true);
      setCheckoutData(prev => ({ ...prev, couponCode: code }));
      await applyCoupon(code);
      setIsApplyingCoupon(false);
    },
    [isApplyingCoupon, calculating, applyCoupon],
  );

  const handleRemoveCoupon = useCallback(async () => {
    if (isApplyingCoupon || calculating) return;
    setIsApplyingCoupon(true);
    setCheckoutData(prev => ({ ...prev, couponCode: '' }));
    await removeCoupon();
    setIsApplyingCoupon(false);
  }, [isApplyingCoupon, calculating, removeCoupon]);

  // ✅ Step validation
  const handleNext = useCallback(() => {
    if (calculating || productLoading || isApplyingCoupon || placingOrder) {
      Alert.alert('Please Wait', 'Processing... Please wait.');
      return;
    }

    // Step 0: Address Validation
    if (currentStep === 0) {
      const isFreeDelivery = product?.freeDelivery === true;
      if (!isFreeDelivery) {
        if (!checkoutData.shippingAddress.address?.trim()) {
          Alert.alert('Error', 'Please enter shipping address');
          return;
        }
        const { latitude, longitude } = checkoutData.shippingAddress;
        if (!latitude || !longitude || latitude === 0 || longitude === 0) {
          Alert.alert(
            'Error',
            'Please select a valid address from suggestions',
          );
          return;
        }
      }
      triggerHaptic('medium');
      animateStepChange(1, 'forward');
    }
    // Step 1: Product Validation
    else if (currentStep === 1) {
      if (!product) {
        Alert.alert('Error', 'Product not found');
        return;
      }
      triggerHaptic('medium');
      animateStepChange(2, 'forward');
    }
    // Step 2: Payment - Place Order
    else if (currentStep === 2) {
      triggerHaptic('medium');
      // Payment will be handled by PaymentStep component
    }
  }, [
    calculating,
    productLoading,
    isApplyingCoupon,
    placingOrder,
    currentStep,
    checkoutData,
    product,
    animateStepChange,
  ]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      triggerHaptic('light');
      animateStepChange(currentStep - 1, 'backward');
    }
  }, [currentStep, animateStepChange]);

  const getTotal = useMemo(() => {
    const total = getGrandTotalSafe(calculatedData);
    return total ? `₹${formatTruncate2Decimals(total)}` : '₹0.00';
  }, [calculatedData]);

  const getDiscountApplied = useMemo(
    () => getDiscountAppliedSafe(calculatedData),
    [calculatedData],
  );

  const handleOrderConfirmed = useCallback(
    (orderData: any) => {
      console.log('🎉 Order confirmed:', orderData);
      Alert.alert('Success', 'Order placed successfully!', [
        { text: 'View Orders', onPress: () => navigation.navigate('Orders') },
        { text: 'OK', onPress: () => navigation.replace('Home') },
      ]);
    },
    [navigation],
  );

  if (productLoading && !product) {
    return (
      <View
        style={[styles.loaderContainer, { backgroundColor: COLORS.background }]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>
          Loading product details...
        </Text>
      </View>
    );
  }

  if (!product && productError) {
    return (
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
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            style={styles.gradientButton}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  if (!product) {
    return null;
  }

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
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={scaleFont(20)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* ✅ Step Indicator: Address → Product → Payment */}
      <View
        style={[
          styles.stepIndicatorContainer,
          { backgroundColor: COLORS.surface },
        ]}
      >
        {['Address', 'Product', 'Payment'].map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <StepCircle
              index={index}
              isActive={index === currentStep}
              isCompleted={index < currentStep}
              colors={COLORS}
            />
            <Text
              style={[
                styles.stepText,
                {
                  color:
                    index === currentStep
                      ? COLORS.primary
                      : index < currentStep
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
                  {
                    backgroundColor:
                      index < currentStep ? COLORS.success : COLORS.border,
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>

      <ScrollView
        style={[styles.content, { backgroundColor: COLORS.background }]}
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
          {/* ✅ Step 0: Address */}
          {currentStep === 0 && (
            <AddressStep
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
          )}

          {/* ✅ Step 1: Product */}
          {currentStep === 1 && (
            <ProductStep
              product={product}
              checkoutData={checkoutData}
              updateCheckoutData={updateCheckoutData}
              calculatedData={calculatedData}
              loading={calculating}
              userId={userId}
              showToast={{
                error: (msg: string) => Alert.alert('Error', msg),
                success: (msg: string) => Alert.alert('Success', msg),
              }}
            />
          )}

          {/* ✅ Step 2: Payment */}
          {currentStep === 2 && (
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

      <LinearGradient
        colors={['#0F172A', COLORS.background]}
        style={styles.footerGradient}
      >
        <View style={styles.footer}>
          <View style={[styles.priceCard, { backgroundColor: COLORS.surface }]}>
            <View style={styles.priceRow}>
              <Text
                style={[styles.totalLabel, { color: COLORS.textSecondary }]}
              >
                Total:
              </Text>
              <Text style={[styles.totalPrice, { color: COLORS.primary }]}>
                {getTotal}
              </Text>
              {getDiscountApplied > 0 && (
                <Text
                  style={[
                    styles.discountBadge,
                    {
                      color: COLORS.success,
                      backgroundColor: `${COLORS.success}15`,
                    },
                  ]}
                >
                  -₹{formatTruncate2Decimals(getDiscountApplied)}
                </Text>
              )}
            </View>
          </View>
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
                  {
                    backgroundColor: COLORS.surface,
                    borderColor: COLORS.border,
                  },
                ]}
                onPress={handlePrevious}
                disabled={calculating || isApplyingCoupon}
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: COLORS.textSecondary },
                  ]}
                >
                  Back
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.primaryButtonContainer,
                (calculating || productLoading || isApplyingCoupon) &&
                  styles.disabledButton,
              ]}
              onPress={handleNext}
              disabled={calculating || productLoading || isApplyingCoupon}
            >
              <LinearGradient
                colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                style={styles.primaryButtonGradient}
              >
                {calculating || productLoading || isApplyingCoupon ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {currentStep === 0
                      ? 'Continue to Product'
                      : currentStep === 1
                      ? 'Proceed to Payment'
                      : 'Place Order'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSpacing(16),
  },
  errorText: {
    fontSize: scaleFont(16),
    marginBottom: scaleSpacing(20),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  goBackButton: { width: '80%', borderRadius: 10, overflow: 'hidden' },
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
  headerGradient: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSpacing(16),
    paddingVertical: scaleSpacing(12),
    paddingTop: Platform.OS === 'ios' ? scaleSpacing(8) : scaleSpacing(12),
  },
  backButton: { padding: scaleSpacing(8), borderRadius: 10 },
  headerTitle: {
    fontSize: scaleFont(16),
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerSpacer: { width: scaleSpacing(36) },
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
  completedStep: {},
  stepNumber: { fontWeight: 'bold', fontSize: scaleFont(12) },
  activeStepNumber: { color: '#fff' },
  stepText: {
    fontSize: scaleFont(10),
    fontWeight: '600',
    textAlign: 'center',
    marginTop: scaleSpacing(2),
  },
  stepConnector: {
    position: 'absolute',
    top: scaleSpacing(16),
    left: '55%',
    right: '-45%',
    height: 2,
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: scaleSpacing(12),
    paddingVertical: scaleSpacing(8),
  },
  stepContainer: {
    borderRadius: 12,
    padding: scaleSpacing(16),
    marginBottom: scaleSpacing(12),
  },
  footerGradient: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  footer: { padding: scaleSpacing(16) },
  priceCard: {
    borderRadius: 10,
    padding: scaleSpacing(12),
    marginBottom: scaleSpacing(16),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  totalLabel: { fontSize: scaleFont(14), fontWeight: '600' },
  totalPrice: { fontSize: scaleFont(22), fontWeight: 'bold' },
  discountBadge: {
    fontSize: scaleFont(10),
    paddingHorizontal: scaleSpacing(6),
    paddingVertical: scaleSpacing(1),
    borderRadius: 3,
    marginLeft: scaleSpacing(8),
    fontWeight: '600',
  },
  buttonContainer: { flexDirection: 'row', gap: scaleSpacing(10) },
  buttonRowWithBack: { justifyContent: 'space-between' },
  buttonRowWithoutBack: { justifyContent: 'flex-end' },
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
  primaryButtonText: {
    color: '#fff',
    fontSize: scaleFont(14),
    fontWeight: 'bold',
    letterSpacing: 0.3,
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
  secondaryButtonText: { fontSize: scaleFont(14), fontWeight: '600' },
  disabledButton: { opacity: 0.6 },
});

export default CheckoutStepper;
