// ============================================================
// screens/tizzygo/CartScreen.tsx
// ============================================================
// ✅ FIXED: Navigation to OrderConfirmation after payment
// ✅ FIXED: Success alert removed, only notification shown
// ✅ MIGRATED: Removed react-native-reanimated, using built-in Animated
// ✅ FIXED: Removed backgroundColor prop from StatusBar (not supported)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  SafeAreaView,
  StatusBar,
  ImageSourcePropType,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Platform,
  PermissionsAndroid,
  Animated, // ✅ Built-in Animated from react-native
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import RazorpayCheckout from 'react-native-razorpay';
import Config from 'react-native-config';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import notifee, {
  AndroidImportance,
  EventType,
  AuthorizationStatus,
} from '@notifee/react-native';

import CartAPI from '../../../../api/features/private/cartPrivateSlice';
import * as PaymentAPI from '../../../../api/features/private/cartpaymentPrivateSlice';
import AddToCart from './AddToCart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CartItem {
  id: string;
  name: string;
  brand: string;
  shortDescription: string;
  price: number;
  quantity: number;
  image: ImageSourcePropType;
  productId: string;
  variantId?: string | null;
  productData?: any;
  selectedVariant?: any;
  variants?: any[];
  inStock?: boolean;
  calculated?: any;
  mrp?: number;
  variantImages?: string[];
}

interface CartSummary {
  subtotal: number;
  platformFee: number;
  packagingFee: number;
  deliveryCharge: number;
  discount: number;
  grandTotal: number;
  gstAmount?: number;
}

// ✅ Loading Skeleton
const LoadingSkeleton = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#E8521A" />
    <Text style={styles.loadingText}>Loading cart...</Text>
  </View>
);

// ✅ Empty Cart
const EmptyCart = () => (
  <View style={styles.emptyContainer}>
    <LottieView
      source={require('../../../components/animations/lotties/Add to cart.json')}
      autoPlay
      loop
      style={styles.emptyLottie}
    />
    <Text style={styles.emptyTitle}>Your cart is empty</Text>
    <Text style={styles.emptySubtitle}>Add some items to get started</Text>
  </View>
);

// ✅ Button Shimmer Overlay - Migrated to built-in Animated
const ButtonShimmerOverlay = () => {
  // Use built-in Animated.Value instead of useSharedValue
  const shimmerValue = new Animated.Value(0);

  useEffect(() => {
    // Create the animation loop: 0 -> 1 -> 0 continuously
    const animation = Animated.loop(
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [shimmerValue]);

  // Interpolate the value to translateX
  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const animatedStyle = {
    transform: [{ translateX }],
  };

  return (
    <Animated.View style={[styles.shimmerOverlay, animatedStyle]}>
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.25)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.shimmerGradient}
      />
    </Animated.View>
  );
};

// ✅ Product Image Component
const ProductImage: React.FC<{
  source: ImageSourcePropType;
  style?: any;
  resizeMode?: 'contain' | 'cover' | 'stretch';
}> = ({ source, style, resizeMode = 'contain' }) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  const defaultImage = require('../../../../assets/images/placeholder.png');

  const imageSource = imageError || !source ? defaultImage : source;

  return (
    <View style={[styles.imageWrapper, style]}>
      {loading && (
        <View style={styles.imageLoader}>
          <ActivityIndicator size="small" color="#E8521A" />
        </View>
      )}
      <Image
        source={imageSource}
        style={[styles.productImage, style]}
        resizeMode={resizeMode}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setImageError(true);
          setLoading(false);
        }}
      />
    </View>
  );
};

// ✅ Invoice Row Component
const InvoiceRow = ({
  label,
  value,
  isTotal = false,
  isDiscount = false,
}: any) => (
  <View style={[styles.invoiceRow, isTotal && styles.invoiceTotalRow]}>
    <Text style={[styles.invoiceLabel, isTotal && styles.invoiceTotalLabel]}>
      {label}
    </Text>
    <Text
      style={[
        styles.invoiceValue,
        isTotal && styles.invoiceTotalValue,
        isDiscount && styles.invoiceDiscountValue,
      ]}
    >
      {value}
    </Text>
  </View>
);

// ✅ Animated Collapsible Item - Migrated to built-in Animated
const CollapsibleItem: React.FC<{
  item: CartItem;
  index: number;
  isCollapsed: boolean;
  onToggle: () => void;
}> = ({ item, index, isCollapsed, onToggle }) => {
  // Use built-in Animated.Value for height
  const heightAnim = new Animated.Value(isCollapsed ? 0 : 1);
  // Use built-in Animated.Value for rotation
  const rotationAnim = new Animated.Value(isCollapsed ? 0 : 1);

  // Animate height and rotation when isCollapsed changes
  useEffect(() => {
    // Animate height (layout property - no native driver)
    Animated.timing(heightAnim, {
      toValue: isCollapsed ? 0 : 1,
      duration: 300, // Spring-like effect with duration
      useNativeDriver: false, // height is a layout property
    }).start();

    // Animate rotation (transform - can use native driver)
    Animated.timing(rotationAnim, {
      toValue: isCollapsed ? 0 : 1,
      duration: 300, // Spring-like effect with duration
      useNativeDriver: true,
    }).start();
  }, [isCollapsed]);

  // Interpolate height: 0 -> 500, 1 -> 500 (full height)
  // Note: With built-in Animated, we interpolate the value to control maxHeight
  const maxHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 500],
  });

  // Interpolate opacity
  const opacity = heightAnim.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [0, 0.5, 1],
  });

  // Interpolate scale
  const scale = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  // Interpolate rotation
  const rotate = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // ✅ Get first image from variantImages
  const getImageSource = () => {
    if (item.variantImages && item.variantImages.length > 0) {
      return { uri: item.variantImages[0] };
    }
    return item.image || require('../../../../assets/images/placeholder.png');
  };

  return (
    <View style={styles.productItemContainer}>
      <TouchableOpacity
        style={styles.productSummaryHeader}
        activeOpacity={0.7}
        onPress={onToggle}
      >
        <Text style={styles.productSummaryTitle}>
          {index + 1}. {item.name}
        </Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <MaterialIcons name="keyboard-arrow-down" size={24} color="#888888" />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.itemCardWrapper,
          {
            maxHeight,
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={styles.itemCard}>
          <View style={styles.imageContainer}>
            <ProductImage
              source={getImageSource()}
              style={styles.itemImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.brand && <Text style={styles.itemBrand}>{item.brand}</Text>}
            {item.shortDescription && (
              <Text style={styles.itemShortDesc} numberOfLines={1}>
                {item.shortDescription}
              </Text>
            )}
            <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
          </View>

          <View style={styles.rightSection}>
            <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
            {item.mrp && item.mrp > item.price && (
              <Text style={styles.itemMrp}>₹{item.mrp.toFixed(2)}</Text>
            )}
            <AddToCart
              productId={item.productId}
              initialIsInCart={true}
              initialQuantity={item.quantity}
              compact={true}
              productAvailable={item.inStock !== false}
              onVariantSelect={() => {}}
              onAddToCartSuccess={() => {}}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export const CartScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [couponCode, setCouponCode] = useState<string>('');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [cartSubTotal, setCartSubTotal] = useState<number>(0);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [platformFee, setPlatformFee] = useState<number>(0);
  const [packagingFee, setPackagingFee] = useState<number>(0);
  const [gstAmount, setGstAmount] = useState<number>(0);
  const [applyingCoupon, setApplyingCoupon] = useState<boolean>(false);
  const [hasLocation, setHasLocation] = useState<boolean>(true);
  const [isProcessingPayment, setIsProcessingPayment] =
    useState<boolean>(false);
  const [paymentIntentData, setPaymentIntentData] = useState<any>(null);
  const [showRazorpayButton, setShowRazorpayButton] = useState<boolean>(false);
  const [showCODButton, setShowCODButton] = useState<boolean>(false);
  const [checkoutSessionId, setCheckoutSessionId] = useState<string>('');
  const [notificationPermissionGranted, setNotificationPermissionGranted] =
    useState<boolean>(false);
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set());
  const [couponApplied, setCouponApplied] = useState<boolean>(false);
  const [originalTotal, setOriginalTotal] = useState<number>(0);

  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>(
    'info',
  );

  // ================================
  // ✅ NOTIFICATION FUNCTIONS
  // ================================
  const requestNotificationPermission = useCallback(async () => {
    console.log('📱 [Notification] Starting permission request...');
    console.log(`📱 [Notification] Platform: ${Platform.OS}`);
    console.log(`📱 [Notification] Android Version: ${Platform.Version}`);

    try {
      if (Platform.OS === 'android') {
        const settings = await notifee.getNotificationSettings();
        console.log(
          '📱 [Notification] Current notification settings:',
          settings,
        );

        if (settings.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
          console.log('✅ [Notification] Permission already granted');
          setNotificationPermissionGranted(true);
          return true;
        }

        if (Platform.Version >= 33) {
          console.log(
            '📱 [Notification] Android 13+ - Requesting POST_NOTIFICATIONS permission...',
          );
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
          console.log(
            `📱 [Notification] POST_NOTIFICATIONS result: ${granted}`,
          );
        }

        const result = await notifee.requestPermission();
        console.log('📱 [Notification] Notifee permission result:', result);

        if (result.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
          console.log('✅ [Notification] Notifee permission granted');
          setNotificationPermissionGranted(true);
          return true;
        } else {
          console.log('❌ [Notification] Notifee permission denied');
          setNotificationPermissionGranted(false);
          return false;
        }
      } else if (Platform.OS === 'ios') {
        const settings = await notifee.requestPermission();
        console.log('📱 [Notification] iOS permission result:', settings);
        if (settings.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
          console.log('✅ [Notification] iOS permission granted');
          setNotificationPermissionGranted(true);
          return true;
        } else {
          console.log('❌ [Notification] iOS permission denied');
          setNotificationPermissionGranted(false);
          return false;
        }
      }
    } catch (error) {
      console.error('❌ [Notification] Error requesting permission:', error);
      setNotificationPermissionGranted(false);
      return false;
    }
  }, []);

  const displayOrderSuccessNotification = async (orderId: string) => {
    console.log('🔔 [Notification] Starting notification display...');
    console.log(`🔔 [Notification] Order ID: ${orderId}`);
    console.log(
      `🔔 [Notification] Permission granted: ${notificationPermissionGranted}`,
    );

    try {
      if (!notificationPermissionGranted) {
        console.log(
          '⚠️ [Notification] Permission not granted, requesting again...',
        );
        const granted = await requestNotificationPermission();
        if (!granted) {
          console.log(
            '❌ [Notification] Cannot display notification - permission denied',
          );
          return;
        }
      }

      const channelId = await notifee.createChannel({
        id: 'order_success',
        name: 'Order Updates',
        description: 'Notifications for order status updates',
        vibration: true,
        importance: AndroidImportance.HIGH,
      });
      console.log(`✅ [Notification] Channel created with ID: ${channelId}`);

      const notificationId = await notifee.displayNotification({
        title: 'Order Placed Successfully',
        body: `Your order #${orderId} has been confirmed. Request will be sent to the vendor(seller).`,
        android: {
          channelId,
          pressAction: { id: 'default' },
          smallIcon: 'ic_launcher',
          autoCancel: true,
        },
        data: {
          orderId: orderId,
          type: 'order_success',
          timestamp: Date.now().toString(),
        },
      });
      console.log(
        `✅ [Notification] Notification displayed! ID: ${notificationId}`,
      );
    } catch (error) {
      console.error('❌ [Notification] Error displaying notification:', error);
    }
  };

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const settings = await notifee.getNotificationSettings();
        if (settings.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
          setNotificationPermissionGranted(true);
        } else {
          await requestNotificationPermission();
        }
      } catch (error) {
        console.error('❌ [Notification] Error checking permission:', error);
      }
    };
    checkPermission();
  }, []);

  // ================================
  // ✅ TOAST & UI FUNCTIONS
  // ================================
  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
  ) => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const toggleItemCollapse = (itemId: string) => {
    const newCollapsed = new Set(collapsedItems);
    if (newCollapsed.has(itemId)) {
      newCollapsed.delete(itemId);
    } else {
      newCollapsed.add(itemId);
    }
    setCollapsedItems(newCollapsed);
  };

  // ================================
  // ✅ LOAD CART DATA
  // ================================
  const loadCartData = async (showLoading: boolean = true) => {
    console.log('🔄 [Cart] Loading cart data...');
    try {
      if (showLoading) setLoading(true);

      const response = await CartAPI.getCartCheckout(couponCode || undefined);

      if (response?.success && response?.data) {
        const cartData = response.data;

        if (cartData.hasLocation === false) {
          setHasLocation(false);
          setItems([]);
          setCartSubTotal(0);
          setDeliveryFee(0);
          setCartDiscount(0);
          setCartTotal(0);
          setPlatformFee(0);
          setPackagingFee(0);
          setGstAmount(0);
          setLoading(false);
          return;
        }

        setHasLocation(true);

        const products = cartData.products || [];
        const summary: CartSummary = cartData.summary || {
          subtotal: 0,
          platformFee: 0,
          packagingFee: 0,
          deliveryCharge: 0,
          discount: 0,
          grandTotal: 0,
          gstAmount: 0,
        };

        if (couponCode && summary.discount > 0) {
          setOriginalTotal(
            summary.subtotal +
              summary.deliveryCharge +
              summary.platformFee +
              summary.packagingFee,
          );
          setCouponApplied(true);
        } else {
          setCouponApplied(false);
          setOriginalTotal(0);
        }

        const mappedItems: CartItem[] = products.map(
          (item: any, index: number) => {
            const finalPrice = item.calculated?.finalPrice || 0;
            const mrp = item.calculated?.mrp || 0;

            let imageUrl = '';
            let variantImages: string[] = [];

            if (
              item.variantImages &&
              Array.isArray(item.variantImages) &&
              item.variantImages.length > 0
            ) {
              variantImages = item.variantImages;
              imageUrl = item.variantImages[0];
            } else if (
              item.variantDetails?.images &&
              Array.isArray(item.variantDetails.images) &&
              item.variantDetails.images.length > 0
            ) {
              variantImages = item.variantDetails.images;
              imageUrl = item.variantDetails.images[0];
            } else if (
              item.productData?.images &&
              Array.isArray(item.productData.images) &&
              item.productData.images.length > 0
            ) {
              imageUrl = item.productData.images[0];
            }

            const imageSource = imageUrl
              ? { uri: imageUrl }
              : require('../../../../assets/images/placeholder.png');

            return {
              id: item.productId || `item-${index}`,
              productId: item.productId || '',
              name: item.title || item.productTitle || 'Product',
              brand: item.productBrand || item.brand || '',
              shortDescription:
                item.productShortDescription || item.shortDescription || '',
              price: finalPrice,
              mrp: mrp,
              quantity: item.quantity || 1,
              image: imageSource,
              variantImages: variantImages,
              variantId: item.variantId || null,
              productData: item.productData || null,
              selectedVariant: item.selectedVariant || null,
              variants: item.productData?.variants || [],
              inStock: item.variantDetails?.inStock !== false,
              calculated: item.calculated || {},
            };
          },
        );

        setItems(mappedItems);

        const newCollapsed = new Set<string>();
        mappedItems.forEach((item, index) => {
          if (index >= 5) newCollapsed.add(item.id);
        });
        setCollapsedItems(newCollapsed);

        setCartSubTotal(summary.subtotal || 0);
        setDeliveryFee(summary.deliveryCharge || 0);
        setCartDiscount(summary.discount || 0);
        setPlatformFee(summary.platformFee || 0);
        setPackagingFee(summary.packagingFee || 0);
        setGstAmount(summary?.gstAmount || 0);
        setCartTotal(summary.grandTotal || 0);

        setShowRazorpayButton(false);
        setShowCODButton(false);
        setPaymentIntentData(null);
        setIsProcessingPayment(false);
      } else {
        setItems([]);
        setCartSubTotal(0);
        setDeliveryFee(0);
        setCartDiscount(0);
        setCartTotal(0);
        setPlatformFee(0);
        setPackagingFee(0);
        setGstAmount(0);
        setCollapsedItems(new Set());
      }
    } catch (error: any) {
      console.error('❌ [Cart] Error:', error);
      if (error?.response?.status === 404 || error?.response?.status === 400) {
        setItems([]);
        setCartSubTotal(0);
        setDeliveryFee(0);
        setCartDiscount(0);
        setCartTotal(0);
        setPlatformFee(0);
        setPackagingFee(0);
        setGstAmount(0);
        setCollapsedItems(new Set());
        showToast('Cart is empty or invalid', 'error');
      } else {
        showToast('Failed to load cart. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCartData(true);
    }, [couponCode]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCartData(false);
    showToast('Cart refreshed successfully', 'success');
  };

  // ================================
  // ✅ COUPON FUNCTIONS
  // ================================
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      Alert.alert('Error', 'Please enter a coupon code');
      return;
    }

    setApplyingCoupon(true);
    try {
      const response = await CartAPI.getCartCheckout(couponCode.trim());
      if (response?.success && response?.data) {
        await loadCartData(false);
        showToast('Coupon applied successfully!', 'success');
        setCouponApplied(true);
      } else {
        showToast('Invalid coupon code', 'error');
        setCouponApplied(false);
      }
    } catch (error) {
      console.error('❌ [Coupon] Error:', error);
      Alert.alert('Error', 'Failed to apply coupon');
      setCouponApplied(false);
    } finally {
      setApplyingCoupon(false);
    }
  };

  // ================================
  // ✅ PAYMENT FUNCTIONS
  // ================================
  const createCheckoutSession = async () => {
    if (items.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return null;
    }

    try {
      console.log('💰 [Payment] Creating checkout session...');
      setIsProcessingPayment(true);

      const paymentResponse = await PaymentAPI.createPaymentIntentAPI(
        {
          address: items[0]?.calculated?.buyerLocation?.address || 'Address',
          latitude: items[0]?.calculated?.buyerLocation?.latitude || 0,
          longitude: items[0]?.calculated?.buyerLocation?.longitude || 0,
        },
        'online',
        `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      );

      console.log('💰 [Payment] Payment Response:', paymentResponse);

      if (!paymentResponse?.success) {
        Alert.alert(
          'Error',
          paymentResponse?.error || 'Failed to create payment session',
        );
        setIsProcessingPayment(false);
        return null;
      }

      setPaymentIntentData({
        checkoutSessionId: paymentResponse.checkoutSessionId,
        paymentIntentId: paymentResponse.paymentIntentId,
        finalAmount: paymentResponse.finalAmount,
        orderId: paymentResponse.orderId || `ORD-${Date.now()}`,
      });

      setCheckoutSessionId(paymentResponse.checkoutSessionId);
      setIsProcessingPayment(false);
      return paymentResponse;
    } catch (error: any) {
      console.error('❌ [Payment] Payment intent error:', error);
      Alert.alert('Error', error.message || 'Failed to initiate payment');
      setIsProcessingPayment(false);
      return null;
    }
  };

  // ✅ CREATE PAYMENT INTENT - Called when user clicks "Proceed to Checkout"
  const handleCreatePaymentIntent = async () => {
    if (items.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    const response = await createCheckoutSession();
    if (response) {
      setShowRazorpayButton(true);
      setShowCODButton(true);
      showToast('Ready to pay', 'success');
    }
  };

  // ✅ ✅ ✅ FIXED: Navigate to OrderConfirmation
  const navigateToOrderConfirmation = (sessionId: string) => {
    console.log(
      `📱 [Navigation] Navigating to OrderConfirmation with: ${sessionId}`,
    );
    navigation.navigate('OrderConfirmation', {
      checkoutSessionId: sessionId,
    });
  };

  // ✅ PAY WITH RAZORPAY
  const handlePayWithRazorpay = async () => {
    if (!paymentIntentData) {
      Alert.alert('Error', 'Payment data not found');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const { checkoutSessionId, paymentIntentId, finalAmount, orderId } =
        paymentIntentData;

      console.log(
        '💳 [Razorpay] Opening Razorpay with order ID:',
        paymentIntentId,
      );

      const razorpayKey = Config.RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error('Razorpay key is not configured.');
      }

      const options = {
        description: 'Quton Powered by Razorpay',
        image: require('../../../../assets/images/tizzy-logo.jpg'),
        currency: 'INR',
        key: razorpayKey,
        amount: Math.round(finalAmount * 100),
        name: 'Quton',
        order_id: paymentIntentId,
        prefill: {
          email: 'user@example.com',
          contact: '9999999999',
          name: 'Customer',
        },
        theme: { color: '#E8521A' },
        modal: {
          ondismiss: () => {
            console.log('❌ [Razorpay] Modal closed');
            setIsProcessingPayment(false);
          },
        },
      };

      RazorpayCheckout.open(options)
        .then(async (data: any) => {
          console.log('✅ [Razorpay] Payment Success:', data);

          try {
            console.log('🔄 [Payment] Processing payment on backend...');
            const processResponse = await PaymentAPI.processPaymentAPI(
              checkoutSessionId,
              data.razorpay_order_id,
              data.razorpay_payment_id,
              data.razorpay_signature,
            );

            console.log(
              '📦 [Payment] Process Payment Response:',
              processResponse,
            );

            if (processResponse?.success) {
              showToast('Payment successful! Order placed.', 'success');

              const successfulOrderId = processResponse.orderId || orderId;
              console.log(
                `🔔 [Notification] Attempting to show notification for order: ${successfulOrderId}`,
              );
              await displayOrderSuccessNotification(successfulOrderId);

              // ✅ ✅ ✅ FIXED: Navigate to OrderConfirmation instead of Alert
              console.log(
                `📱 [Navigation] Payment success, navigating to OrderConfirmation`,
              );
              setShowRazorpayButton(false);
              setShowCODButton(false);
              setPaymentIntentData(null);
              setCheckoutSessionId('');

              // ✅ Navigate to OrderConfirmation
              navigateToOrderConfirmation(checkoutSessionId);
            } else {
              console.log('❌ [Payment] Process payment failed');
              showToast('Payment processing failed', 'error');
              Alert.alert(
                'Error',
                processResponse?.error || 'Payment processing failed',
              );
              setIsProcessingPayment(false);
            }
          } catch (error: any) {
            console.error('❌ [Payment] Process payment error:', error);
            showToast('Payment processing failed', 'error');
            Alert.alert('Error', error.message || 'Payment processing failed');
            setIsProcessingPayment(false);
          }
        })
        .catch((error: any) => {
          console.error('❌ [Razorpay] Error:', error);
          showToast('Payment failed', 'error');
          Alert.alert('Error', error?.description || 'Payment failed');
          setIsProcessingPayment(false);
        });
    } catch (error: any) {
      console.error('❌ [Razorpay] Open error:', error);
      Alert.alert('Error', error.message || 'Failed to open payment');
      setIsProcessingPayment(false);
    }
  };

  // ✅ PAY WITH COD
  const handleCODOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const response = await createCheckoutSession();
      if (!response) {
        setIsProcessingPayment(false);
        return;
      }

      console.log('📦 [COD] Confirming COD order...');
      const codResponse = await PaymentAPI.confirmCODAPI(
        response.checkoutSessionId,
      );

      console.log('📦 [COD] COD Response:', codResponse);

      if (codResponse?.success) {
        showToast('Order placed successfully!', 'success');

        const orderId = codResponse.orderId || `COD-${Date.now()}`;
        await displayOrderSuccessNotification(orderId);

        // ✅ ✅ ✅ FIXED: Navigate to OrderConfirmation instead of Alert
        console.log(
          `📱 [Navigation] COD success, navigating to OrderConfirmation`,
        );
        setShowRazorpayButton(false);
        setShowCODButton(false);
        setPaymentIntentData(null);
        setCheckoutSessionId('');

        // ✅ Navigate to OrderConfirmation
        navigateToOrderConfirmation(response.checkoutSessionId);
      } else {
        showToast('COD order failed', 'error');
        Alert.alert('Error', codResponse?.error || 'Failed to place COD order');
        setIsProcessingPayment(false);
      }
    } catch (error: any) {
      console.error('❌ [COD] Error placing COD order:', error);
      showToast('Failed to place order', 'error');
      Alert.alert('Error', error.message || 'Failed to place COD order');
      setIsProcessingPayment(false);
    }
  };

  // ✅ CANCEL PAYMENT
  const handleCancelPayment = () => {
    console.log('❌ [Payment] Payment cancelled by user');
    setShowRazorpayButton(false);
    setShowCODButton(false);
    setPaymentIntentData(null);
    setCheckoutSessionId('');
    setIsProcessingPayment(false);
    showToast('Payment cancelled', 'info');
  };

  // ================================
  // ✅ RENDER
  // ================================
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back-ios" size={24} color="#E8521A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={{ width: 40 }} />
        </View>
        <LoadingSkeleton />
      </SafeAreaView>
    );
  }

  if (!hasLocation) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back-ios" size={24} color="#E8521A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.noLocationContainer}>
          <MaterialIcons name="location-off" size={64} color="#CCCCCC" />
          <Text style={styles.noLocationTitle}>No Address Found</Text>
          <Text style={styles.noLocationSubtitle}>
            Please add your delivery address to see cart items
          </Text>
          <TouchableOpacity
            style={styles.addAddressButton}
            onPress={() => navigation.navigate('AddAddress')}
          >
            <Text style={styles.addAddressButtonText}>Add Address</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back-ios" size={24} color="#E8521A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={{ width: 40 }} />
      </View>

      {toastMessage !== '' && (
        <View
          style={[
            styles.toastContainer,
            {
              backgroundColor:
                toastType === 'success'
                  ? '#4CAF50'
                  : toastType === 'error'
                    ? '#E8521A'
                    : '#333333',
            },
          ]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 30 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#E8521A']}
            tintColor="#E8521A"
          />
        }
      >
        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <>
            {items.map((item, index) => {
              const isCollapsed = collapsedItems.has(item.id);
              return (
                <CollapsibleItem
                  key={item.id}
                  item={item}
                  index={index}
                  isCollapsed={isCollapsed}
                  onToggle={() => toggleItemCollapse(item.id)}
                />
              );
            })}

            {/* Coupon Input */}
            <View style={styles.couponContainer}>
              <TextInput
                style={styles.couponInput}
                placeholder="Enter coupon code"
                placeholderTextColor="#A0A0A0"
                value={couponCode}
                onChangeText={setCouponCode}
                editable={!applyingCoupon}
              />
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  couponApplied && styles.couponAppliedButton,
                ]}
                activeOpacity={0.8}
                onPress={handleApplyCoupon}
                disabled={applyingCoupon}
              >
                {applyingCoupon ? (
                  <ActivityIndicator size="small" color="#E8521A" />
                ) : (
                  <Text style={styles.applyButtonText}>
                    {couponApplied ? '✓ Applied' : 'Apply'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Invoice Style Order Summary */}
            <View style={styles.invoiceContainer}>
              <View style={styles.invoiceHeader}>
                <Text style={styles.invoiceTitle}>Order Summary</Text>
                <Text style={styles.invoiceSubtitle}>
                  {new Date().toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              <View style={styles.invoiceDivider} />

              <View style={styles.invoiceItemsContainer}>
                {items.map((item, idx) => (
                  <View key={idx} style={styles.invoiceItemRow}>
                    <View style={styles.invoiceItemLeft}>
                      <Text style={styles.invoiceItemName}>{item.name}</Text>
                      <Text style={styles.invoiceItemQty}>
                        × {item.quantity}
                      </Text>
                    </View>
                    <Text style={styles.invoiceItemPrice}>
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.invoiceDivider} />

              {couponApplied && originalTotal > 0 && (
                <>
                  <InvoiceRow
                    label="Subtotal (Before Coupon)"
                    value={`₹${originalTotal.toFixed(2)}`}
                  />
                  <InvoiceRow
                    label="Coupon Discount"
                    value={`-₹${cartDiscount.toFixed(2)}`}
                    isDiscount={true}
                  />
                  <View style={styles.invoiceDivider} />
                </>
              )}

              <InvoiceRow
                label="Subtotal"
                value={`₹${cartSubTotal.toFixed(2)}`}
              />
              {gstAmount > 0 && (
                <InvoiceRow
                  label="GST (18%)"
                  value={`₹${gstAmount.toFixed(2)}`}
                />
              )}
              <InvoiceRow
                label="Platform Fee"
                value={`₹${platformFee.toFixed(2)}`}
              />
              <InvoiceRow
                label="Packaging Fee"
                value={`₹${packagingFee.toFixed(2)}`}
              />
              <InvoiceRow
                label="Delivery Fee"
                value={`₹${deliveryFee.toFixed(2)}`}
              />
              {cartDiscount > 0 && !couponApplied && (
                <InvoiceRow
                  label="Discount"
                  value={`-₹${cartDiscount.toFixed(2)}`}
                  isDiscount={true}
                />
              )}

              <View style={styles.invoiceDivider} />
              <InvoiceRow
                label="GRAND TOTAL"
                value={`₹${cartTotal.toFixed(2)}`}
                isTotal={true}
              />

              {gstAmount > 0 && (
                <View style={styles.gstBreakupContainer}>
                  <Text style={styles.gstBreakupTitle}>Tax Details</Text>
                  <View style={styles.gstBreakupRow}>
                    <Text style={styles.gstBreakupLabel}>CGST (9%)</Text>
                    <Text style={styles.gstBreakupValue}>
                      ₹{(gstAmount / 2).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.gstBreakupRow}>
                    <Text style={styles.gstBreakupLabel}>SGST (9%)</Text>
                    <Text style={styles.gstBreakupValue}>
                      ₹{(gstAmount / 2).toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Checkout Button */}
            {!showRazorpayButton && !showCODButton ? (
              <TouchableOpacity
                style={styles.checkoutButton}
                activeOpacity={0.9}
                onPress={handleCreatePaymentIntent}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.checkoutText}>Proceed to Checkout</Text>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.paymentButtonsContainer}>
                <TouchableOpacity
                  style={styles.razorpayButton}
                  activeOpacity={0.9}
                  onPress={handlePayWithRazorpay}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialIcons name="payment" size={20} color="#FFFFFF" />
                      <Text style={styles.razorpayButtonText}>
                        Pay with Razorpay
                      </Text>
                    </>
                  )}
                  <ButtonShimmerOverlay />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.codButton}
                  activeOpacity={0.9}
                  onPress={handleCODOrder}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialIcons
                        name="payments"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.codButtonText}>
                        Pay on Delivery (COD)
                      </Text>
                    </>
                  )}
                  <ButtonShimmerOverlay />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelButton, { marginBottom: insets.bottom }]}
                  activeOpacity={0.8}
                  onPress={handleCancelPayment}
                  disabled={isProcessingPayment}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ✅ Styles (same as before)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FAF7F5',
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1C' },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
    flexGrow: 1,
  },
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    zIndex: 9999,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  productItemContainer: { marginBottom: 4 },
  productSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE8',
  },
  productSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1C',
    flex: 1,
  },
  itemCardWrapper: { overflow: 'hidden' },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  imageContainer: {
    width: 65,
    height: 65,
    borderRadius: 16,
    backgroundColor: '#FDEEE9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: { width: 42, height: 42 },
  imageLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDEEE9',
  },
  itemImage: { width: 42, height: 42 },
  itemDetails: { flex: 1, justifyContent: 'center' },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E8521A',
    marginBottom: 1,
  },
  itemShortDesc: { fontSize: 12, color: '#8E8E93', marginBottom: 2 },
  itemQty: { fontSize: 12, color: '#8E8E93' },
  rightSection: { alignItems: 'flex-end' },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#1C1C1C' },
  itemMrp: {
    fontSize: 12,
    fontWeight: '400',
    color: '#888888',
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  couponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  couponInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    fontSize: 13,
    color: '#222222',
    borderWidth: 1,
    borderColor: '#F0ECE8',
    marginRight: 12,
  },
  applyButton: {
    backgroundColor: '#FDEEE9',
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponAppliedButton: { backgroundColor: '#E8F5E9' },
  applyButtonText: { color: '#E8521A', fontWeight: '600', fontSize: 14 },

  // Invoice Styles
  invoiceContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1C',
    letterSpacing: 0.5,
  },
  invoiceSubtitle: { fontSize: 12, color: '#888888' },
  invoiceDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  invoiceItemsContainer: { marginVertical: 4 },
  invoiceItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  invoiceItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  invoiceItemName: { fontSize: 13, color: '#333333', flex: 1 },
  invoiceItemQty: { fontSize: 12, color: '#888888', marginLeft: 8 },
  invoiceItemPrice: { fontSize: 13, fontWeight: '600', color: '#1C1C1C' },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  invoiceTotalRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 4,
  },
  invoiceLabel: { fontSize: 13, color: '#666666' },
  invoiceTotalLabel: { fontSize: 16, fontWeight: '700', color: '#1C1C1C' },
  invoiceValue: { fontSize: 13, color: '#1C1C1C', fontWeight: '500' },
  invoiceTotalValue: { fontSize: 18, fontWeight: '800', color: '#E8521A' },
  invoiceDiscountValue: { color: '#22C55E' },
  gstBreakupContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  gstBreakupTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  gstBreakupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  gstBreakupLabel: { fontSize: 11, color: '#888888' },
  gstBreakupValue: { fontSize: 11, color: '#555555', fontWeight: '500' },

  checkoutButton: {
    backgroundColor: '#E8521A',
    borderRadius: 28,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#E8521A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  paymentButtonsContainer: { marginTop: 10, gap: 10 },
  razorpayButton: {
    backgroundColor: '#1A1A2E',
    borderRadius: 28,
    height: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  razorpayButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  codButton: {
    backgroundColor: '#03363D',
    borderRadius: 28,
    height: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#03363D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  codButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: 28,
  },
  shimmerGradient: { width: '100%', height: '100%' },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 28,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  cancelButtonText: { color: '#666666', fontSize: 14, fontWeight: '600' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#777777' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyLottie: { width: 200, height: 200, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1C',
    marginBottom: 8,
  },
  emptySubtitle: { fontSize: 14, color: '#777777' },
  noLocationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  noLocationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1C',
    marginTop: 16,
    marginBottom: 8,
  },
  noLocationSubtitle: {
    fontSize: 14,
    color: '#777777',
    textAlign: 'center',
    marginBottom: 24,
  },
  addAddressButton: {
    backgroundColor: '#E8521A',
    borderRadius: 28,
    height: 48,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAddressButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default CartScreen;
