// screens/CheckoutStepper.tsx - COMPLETELY FIXED VERSION

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
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useCheckout } from '../../hooks/useCheckOut';
import { useProduct } from '../../hooks/useProducts';
import {
  scaleFont,
  scaleSpacing,
  formatTruncate2Decimals,
  parseCoordinate,
  triggerHaptic,
  getGrandTotalSafe,
  getDiscountAppliedSafe,
} from '../../utils/shop/checkoutUtils';
import {
  Product,
  CheckoutData,
  CalculatedData,
  ShippingAddress,
  ProductVariant,
  SelectedVariant,
} from '../../types/ShopTypes';
import ProductStep from './ProductStep';
import AddressCouponStep from './AddressCouponStep';
import PaymentStep from './PaymentStep';
import AddToCart from './AddToCart';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
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
            ? colors.success
            : isActive
            ? colors.primary
            : colors.border,
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
  const fromCart = route.params?.fromCart || false;
  const cartQuantity = route.params?.cartQuantity || 1;
  const routeProductData = route.params?.productData || null;

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [currentStep, setCurrentStep] = useState(0);
  const [essentialProductInfo, setEssentialProductInfo] = useState<any>(null);
  const [isInCart, setIsInCart] = useState(fromCart);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [userId, setUserId] = useState('user123');
  const [selectedVariant, setSelectedVariant] =
    useState<SelectedVariant | null>(null);

  // ✅ Use the useProduct hook
  const {
    product: fetchedProduct,
    loading: productLoading,
    error: productError,
    refreshing,
    onRefresh,
  } = useProduct({
    productId,
    initialData: routeProductData || null,
    autoFetch: true,
  });

  // ✅ Safely cast product with type assertion using 'as any'
  const product = useMemo(() => {
    if (!fetchedProduct) return null;
    // Use type assertion to avoid property mismatch errors
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
  });

  // ✅ Extract variants from product
  const productVariants = useMemo(() => product?.variants || [], [product]);

  // ✅ Set essential product info when product loads
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
    }
  }, [product, productId]);

  const {
    calculatedData,
    calculating,
    couponError,
    couponSuccess,
    clearCouponMessages,
    fetchCalculatedData,
    applyCoupon,
    removeCoupon,
  } = useCheckout({
    essentialProductInfo,
    quantity: checkoutData.quantity,
    shippingAddress: checkoutData.shippingAddress,
    couponCode: checkoutData.couponCode,
  });

  // Fetch user ID
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

  // ✅ If coming from cart, set isInCart to true
  useEffect(() => {
    if (fromCart) {
      setIsInCart(true);
    }
  }, [fromCart]);

  // Handle product error
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
    (key: string | number | symbol, value: any) => {
      if (key === 'couponCode') clearCouponMessages();
      setCheckoutData(prev => ({ ...prev, [key]: value }));
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

  // ✅ Convert to async functions for ProductStep compatibility
  const handleAddToCartAsync = useCallback(async () => {
    setIsInCart(true);
    triggerHaptic('success');
    Alert.alert('Success', 'Product added to cart successfully!');
    return Promise.resolve();
  }, []);

  const handleUpdateCartQuantityAsync = useCallback(async (qty: number) => {
    setCheckoutData(prev => ({ ...prev, quantity: qty }));
    return Promise.resolve();
  }, []);

  const handleRemoveFromCartAsync = useCallback(async () => {
    setIsInCart(false);
    setCheckoutData(prev => ({ ...prev, quantity: 1 }));
    return Promise.resolve();
  }, []);

  const handleVariantSelect = useCallback((variant: SelectedVariant | null) => {
    setSelectedVariant(variant);
  }, []);

  const handleQuantityChange = useCallback((newQuantity: number) => {
    if (newQuantity >= 1) {
      setCheckoutData(prev => ({ ...prev, quantity: newQuantity }));
    }
  }, []);

  const handleNext = useCallback(() => {
    if (calculating || productLoading || isApplyingCoupon || placingOrder) {
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
      animateStepChange(2, 'forward');
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

  // Loading state
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

  // Error state
  if (!product && productError) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: COLORS.background }]}
      >
        <View style={styles.errorIcon}>
          <Text style={styles.errorIconText}>!</Text>
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
        {['Product', 'Address', 'Payment'].map((step, index) => (
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
          {currentStep === 0 && (
            <>
              {/* Product Info Card */}
              <View style={styles.productInfoCard}>
                <Text
                  style={[styles.productTitle, { color: COLORS.textPrimary }]}
                >
                  {product.title}
                </Text>
                {product.brand && (
                  <Text
                    style={[
                      styles.productBrand,
                      { color: COLORS.textSecondary },
                    ]}
                  >
                    Brand: {product.brand}
                  </Text>
                )}
                {product.description && (
                  <Text
                    style={[
                      styles.productDescription,
                      { color: COLORS.textSecondary },
                    ]}
                  >
                    {product.description}
                  </Text>
                )}
              </View>

              {/* Add to Cart Component */}
              <AddToCart
                productId={productId || ''}
                productData={product as any}
                initialIsInCart={isInCart}
                initialQuantity={checkoutData.quantity}
                productLoading={productLoading}
                productAvailable={product.inStock !== false}
                maxQuantity={(product as any)?.maxOrderQty || 10}
                variants={productVariants as any}
                selectedVariant={selectedVariant as any}
                onVariantSelect={handleVariantSelect as any}
                onAddToCartSuccess={() => {
                  setIsInCart(true);
                  triggerHaptic('success');
                }}
              />

              {/* Product Step Component with async handlers */}
              <ProductStep
                product={product}
                checkoutData={checkoutData}
                updateCheckoutData={updateCheckoutData}
                calculatedData={calculatedData}
                loading={calculating}
                isInCart={isInCart}
                cartLoading={productLoading}
                onUpdateQuantity={handleQuantityChange}
                userId={userId}
                onAddToCart={handleAddToCartAsync}
                onUpdateCartQuantity={handleUpdateCartQuantityAsync}
                onRemoveFromCart={handleRemoveFromCartAsync}
                showToast={{
                  error: (msg: string) => Alert.alert('Error', msg),
                  success: (msg: string) => Alert.alert('Success', msg),
                }}
              />
            </>
          )}

          {currentStep === 1 && (
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
          )}

          {currentStep === 2 && (
            <PaymentStep
              checkoutData={checkoutData}
              updateCheckoutData={updateCheckoutData}
              product={product}
              calculatedData={calculatedData}
              loading={placingOrder}
            />
          )}
        </Animated.View>
      </ScrollView>

      {currentStep >= 1 && (
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
                    ← Back
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
                    <View style={styles.buttonContent}>
                      <Text style={styles.primaryButtonText}>
                        {currentStep === 1 ? 'Proceed to Payment' : 'Continue'}
                      </Text>
                      <Text style={styles.buttonArrow}>→</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      )}
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
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSpacing(16),
  },
  errorIconText: { color: '#fff', fontSize: scaleFont(28), fontWeight: 'bold' },
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
  completedStep: { backgroundColor: '#10B981' },
  stepNumber: { fontWeight: 'bold', fontSize: scaleFont(12) },
  activeStepNumber: { color: '#fff' },
  stepCheck: { color: '#fff', fontWeight: 'bold', fontSize: scaleFont(14) },
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
  productInfoCard: {
    padding: scaleSpacing(12),
    borderRadius: 12,
    backgroundColor: 'transparent',
    marginBottom: scaleSpacing(8),
  },
  productTitle: {
    fontSize: scaleFont(18),
    fontWeight: 'bold',
    marginBottom: scaleSpacing(4),
  },
  productBrand: {
    fontSize: scaleFont(14),
    marginBottom: scaleSpacing(4),
  },
  productDescription: {
    fontSize: scaleFont(14),
    lineHeight: 20,
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
  secondaryButtonText: { fontSize: scaleFont(14), fontWeight: '600' },
  disabledButton: { opacity: 0.6 },
});

export default CheckoutStepper;
