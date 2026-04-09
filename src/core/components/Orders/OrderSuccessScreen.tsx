// screens/OrderSuccessScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
  Easing,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  NavigationProp,
  RouteProp,
} from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

// ✅ REPLACED: Using react-native-vector-icons instead of @expo/vector-icons
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';

// ✅ REPLACED: Using react-native-lottie-splash-screen or react-native-lottie
// Note: You'll need to install: npm install lottie-react-native
import LottieView from 'lottie-react-native';

// ✅ REPLACED: expo-haptics with react-native-haptic-feedback
// Note: You'll need to install: npm install react-native-haptic-feedback
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import { useTheme } from '../../contexts/theme/ThemeContext';

const { width, height } = Dimensions.get('window');

// Animation JSON files
const SUCCESS_ANIMATION_LIGHT = require('../animations/lotties/successcheck.json');
const DELIVERY_ANIMATION = require('../animations/lotties/delivery.json');

// Define delivery status types based on your DB model (EXACT MATCH WITH DB ENUM)
type DeliveryStatus =
  | 'waiting_for_seller'
  | 'pending_rider_accept'
  | 'assigned'
  | 'waiting_for_rider'
  | 'picked_up'
  | 'delivered';

// Define all possible payment method types
type PaymentMethodType = 'stripe_payment' | 'cod' | 'online' | 'unknown';

// ✅ Define navigation param list for type safety
type RootStackParamList = {
  Home: undefined;
  RateOrder: { orderId: string };
  OrderDetails: { orderId: string };
  OrderTracking: { orderId: string; liveData?: LiveDeliveryData | null };
  OrderSuccessScreen: OrderSuccessParams;
  Order: { screen: string; params: any };
};

interface OrderSuccessParams {
  orderId?: string;
  source?: PaymentMethodType;
  totalAmount?: number;
}

// Interface for Live API Response with delivery status
interface LiveDeliveryData {
  success: boolean;
  deliveryStatus?: DeliveryStatus;
  currentStatus?: string;
  status?: string;
  riderLocation?: {
    latitude: number;
    longitude: number;
  };
  estimate?: {
    minutes: number;
    text: string;
    distance: string;
  };
  route?: {
    polyline: string;
    legs: any[];
  };
  riderDetails?: {
    name?: string;
    phone?: string;
    vehicleType?: string;
  };
  sellerDetails?: {
    name?: string;
    address?: string;
  };
}

interface DeliveryEstimate {
  estimatedTime: number;
  estimatedDelivery: string;
  deliveryType: 'express' | 'standard';
  distance: string;
}

// Status configuration interface
interface StatusConfig {
  title: string;
  subtitle: string;
  animation: any;
  progressPercentage: number;
  currentStepIndex: number; // Current step index (0-4)
  showRiderInfo: boolean;
  showSellerInfo: boolean;
  showDeliveryProgress: boolean;
  mainButtonText: string;
}

// ✅ Haptic feedback options
const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

// Trigger haptic feedback (replaces expo-haptics)
const triggerHaptic = (
  type:
    | 'notificationSuccess'
    | 'impactLight'
    | 'impactMedium'
    | 'impactHeavy' = 'notificationSuccess',
) => {
  if (Platform.OS === 'ios') {
    switch (type) {
      case 'notificationSuccess':
        ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
        break;
      case 'impactLight':
        ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
        break;
      case 'impactMedium':
        ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
        break;
      case 'impactHeavy':
        ReactNativeHapticFeedback.trigger('impactHeavy', hapticOptions);
        break;
    }
  } else {
    // Android fallback
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
  }
};

const OrderSuccessScreen: React.FC = () => {
  // ✅ Typed navigation
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'OrderSuccessScreen'>>();

  const params = (route.params || {}) as OrderSuccessParams;
  const { isDark, resolvedTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deliveryEstimate, setDeliveryEstimate] =
    useState<DeliveryEstimate | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(true);
  const [liveData, setLiveData] = useState<LiveDeliveryData | null>(null);
  const [apiCallStatus, setApiCallStatus] = useState<{
    orderFetch: 'idle' | 'loading' | 'success' | 'error';
    liveFetch: 'idle' | 'loading' | 'success' | 'error';
    errorMessage?: string;
  }>({
    orderFetch: 'idle',
    liveFetch: 'idle',
  });

  // LIVE ETA STATE
  const [eta, setEta] = useState<string>('');
  const [distance, setDistance] = useState<string>('');
  const [liveLoading, setLiveLoading] = useState(false);

  // Delivery Status State - Initialize with DB enum value
  const [deliveryStatus, setDeliveryStatus] =
    useState<DeliveryStatus>('waiting_for_seller');

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;
  const successAnimationRef = useRef<LottieView>(null);
  const deliveryAnimationRef = useRef<LottieView>(null);

  // Track if animations have been played once
  const [animationsPlayed, setAnimationsPlayed] = useState(false);

  // Get theme-based colors
  const getThemeColors = () => {
    return {
      primary: '#635BFF',
      primaryLight: '#A8A4FF',
      primaryDark: '#4A43D9',

      background: isDark ? '#0F172A' : '#f8fafc',
      cardBackground: isDark ? '#1E293B' : '#ffffff',
      surface: isDark ? '#334155' : '#f1f5f9',

      textPrimary: isDark ? '#F1F5F9' : '#1a1a1a',
      textSecondary: isDark ? '#94A3B8' : '#64748b',
      textTertiary: isDark ? '#64748B' : '#94A3B8',

      success: '#10b981',
      successLight: isDark ? '#064E3B' : '#D1FAE5',
      warning: '#f59e0b',
      warningLight: isDark ? '#78350F' : '#FEF3C7',
      error: '#ef4444',
      errorLight: isDark ? '#7F1D1D' : '#FEE2E2',
      info: '#3b82f6',

      border: isDark ? '#334155' : '#e2e8f0',
      divider: isDark ? '#334155' : '#e2e8f0',

      shadow: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)',

      progressBarBg: isDark ? '#334155' : '#e2e8f0',
      progressBarFill: '#635BFF',
      deliveryCardBg: isDark ? '#1E293B' : '#f0f7ff',
      orderIdBg: isDark ? '#0F172A' : '#f8fafc',

      statusWaiting: isDark ? '#f59e0b' : '#f59e0b',
      statusPending: isDark ? '#f59e0b' : '#f59e0b',
      statusAssigned: isDark ? '#3b82f6' : '#3b82f6',
      statusReady: isDark ? '#10b981' : '#10b981',
      statusPicked: isDark ? '#8b5cf6' : '#8b5cf6',
      statusDelivered: isDark ? '#10b981' : '#10b981',
    };
  };

  const colors = getThemeColors();

  // Get status configuration based on delivery status (EXACT MATCH WITH DB ENUM)
  const getStatusConfig = (status: DeliveryStatus): StatusConfig => {
    const configs: Record<DeliveryStatus, StatusConfig> = {
      waiting_for_seller: {
        title: 'Order Confirmed!',
        subtitle: 'Seller is preparing your order',
        animation: DELIVERY_ANIMATION,
        progressPercentage: 0, // First step
        currentStepIndex: 0, // Step 0
        showRiderInfo: false,
        showSellerInfo: true,
        showDeliveryProgress: true,
        mainButtonText: 'View Order Details',
      },
      pending_rider_accept: {
        title: 'Order Ready!',
        subtitle: 'Waiting for rider to accept delivery',
        animation: DELIVERY_ANIMATION,
        progressPercentage: 25, // Second step
        currentStepIndex: 1, // Step 1
        showRiderInfo: false,
        showSellerInfo: true,
        showDeliveryProgress: true,
        mainButtonText: 'Track Order Status',
      },
      assigned: {
        title: 'Rider Assigned!',
        subtitle: 'Your delivery rider is on the way to seller',
        animation: DELIVERY_ANIMATION,
        progressPercentage: 50, // Third step
        currentStepIndex: 2, // Step 2
        showRiderInfo: true,
        showSellerInfo: true,
        showDeliveryProgress: true,
        mainButtonText: 'Track Live Location',
      },
      waiting_for_rider: {
        title: 'Waiting for Rider',
        subtitle: 'Rider has arrived at seller location',
        animation: DELIVERY_ANIMATION,
        progressPercentage: 75, // Fourth step
        currentStepIndex: 3, // Step 3
        showRiderInfo: true,
        showSellerInfo: true,
        showDeliveryProgress: true,
        mainButtonText: 'Track Live Location',
      },
      picked_up: {
        title: 'Order Picked Up!',
        subtitle: 'Rider has picked up your order and is on the way',
        animation: DELIVERY_ANIMATION,
        progressPercentage: 90, // Fifth step
        currentStepIndex: 4, // Step 4
        showRiderInfo: true,
        showSellerInfo: false,
        showDeliveryProgress: true,
        mainButtonText: 'Track Live Delivery',
      },
      delivered: {
        title: 'Order Delivered!',
        subtitle: 'Your order has been successfully delivered',
        animation: DELIVERY_ANIMATION,
        progressPercentage: 100, // Final step
        currentStepIndex: 5, // Step 5 (completed)
        showRiderInfo: false,
        showSellerInfo: false,
        showDeliveryProgress: false,
        mainButtonText: 'Rate Your Order',
      },
    };

    return configs[status];
  };

  const successAnimationSource = SUCCESS_ANIMATION_LIGHT;

  const styles = makeStyles(colors, isDark);
  const statusConfig = getStatusConfig(deliveryStatus);

  // Start initial animations
  useEffect(() => {
    console.log('🎬 ========== ORDER SUCCESS SCREEN STARTED ==========');

    if (!params.orderId) {
      console.error('❌ CRITICAL: No orderId found in params!');
      Alert.alert('Error', 'Order information not found. Please try again.', [
        {
          text: 'Go Home',
          onPress: () => navigation.navigate('Home'),
        },
      ]);
      return;
    }

    console.log('✅ Order ID found:', params.orderId);
    triggerHaptic('notificationSuccess');

    if (successAnimationRef.current) {
      successAnimationRef.current.play();
    }

    setTimeout(() => {
      setShowSuccessAnimation(false);
      fetchOrderDetails();
    }, 3000);
  }, []);

  // Function to start progress animation based on status
  const startProgressAnimation = (status: DeliveryStatus) => {
    const config = getStatusConfig(status);

    progressAnim.setValue(0);

    Animated.timing(progressAnim, {
      toValue: config.progressPercentage / 100,
      duration: 1500,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
  };

  // Update delivery status from API response - CORRECTED VERSION
  const updateDeliveryStatus = (apiData: LiveDeliveryData) => {
    // Try multiple possible fields from API
    const statusFromApi =
      apiData.deliveryStatus || apiData.currentStatus || apiData.status;

    console.log('📦 API Status Received:', statusFromApi);

    if (statusFromApi) {
      // Direct mapping to DB enum values
      const statusMap: Record<string, DeliveryStatus> = {
        // Direct matches with DB enum
        waiting_for_seller: 'waiting_for_seller',
        pending_rider_accept: 'pending_rider_accept',
        assigned: 'assigned',
        waiting_for_rider: 'waiting_for_rider',
        picked_up: 'picked_up',
        delivered: 'delivered',

        // Possible variations from API
        order_confirmed: 'waiting_for_seller',
        order_ready: 'pending_rider_accept',
        rider_assigned: 'assigned',
        rider_arrived: 'waiting_for_rider',
        order_picked: 'picked_up',
        delivery_completed: 'delivered',
      };

      const mappedStatus = statusMap[statusFromApi] || 'waiting_for_seller';

      console.log('🔄 Mapped Status:', mappedStatus);

      if (mappedStatus !== deliveryStatus) {
        console.log('📊 Status Changed:', deliveryStatus, '→', mappedStatus);
        setDeliveryStatus(mappedStatus);
        startProgressAnimation(mappedStatus);
      }
    } else {
      console.log(
        '⚠️ No status found in API, defaulting to waiting_for_seller',
      );
      setDeliveryStatus('waiting_for_seller');
      startProgressAnimation('waiting_for_seller');
    }
  };

  // LIVE ETA FETCH FUNCTION - 1 minute mein update
  const fetchLiveEstimate = async () => {
    try {
      setLiveLoading(true);
      console.log('🔄 Fetching live ETA update...');

      const token = await AsyncStorage.getItem('authToken');
      if (!token || !params.orderId) {
        return;
      }

      const response = await axios.get(
        `http://192.168.251.121:5000/api/orders/tracking/live/${params.orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        },
      );

      if (response.data.success) {
        console.log('✅ Live ETA Data:', response.data);

        if (response.data.estimate) {
          const { text, distance } = response.data.estimate;
          setEta(text);
          setDistance(distance);
        }

        // Update delivery status from live data
        updateDeliveryStatus(response.data);

        setLiveData(prev => ({
          ...prev,
          ...response.data,
        }));

        if (Platform.OS === 'ios') {
          triggerHaptic('impactLight');
        }
      }
    } catch (err: any) {
      console.log('⚠️ Live ETA error:', err.message);
    } finally {
      setLiveLoading(false);
    }
  };

  // AUTO REFRESH HAR 1 MINUTE MEIN
  useEffect(() => {
    if (!params.orderId || loading) {
      return;
    }

    console.log('⏱️ Starting live updates every 1 minute');

    fetchLiveEstimate();

    const interval = setInterval(() => {
      fetchLiveEstimate();
    }, 60000); // HAR 1 MINUTE MEIN UPDATE

    return () => {
      clearInterval(interval);
    };
  }, [params.orderId, loading]);

  // Fetch order details and live delivery data
  const fetchOrderDetails = async () => {
    try {
      if (!params.orderId) {
        throw new Error('Order ID is required');
      }

      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        throw new Error('Authentication required - No token found');
      }

      setApiCallStatus(prev => ({ ...prev, orderFetch: 'loading' }));

      console.log('📡 Fetching order details for:', params.orderId);

      const orderResponse = await axios.get(
        `http://192.168.251.121:5000/api/orders/delivery/${params.orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      console.log('📦 Order Details Response:', orderResponse.data);

      if (orderResponse.data.success) {
        setOrderDetails(orderResponse.data.order);
        setApiCallStatus(prev => ({ ...prev, orderFetch: 'success' }));

        // Check if order has delivery status
        if (orderResponse.data.order?.deliveryStatus) {
          console.log(
            '📊 Order has deliveryStatus:',
            orderResponse.data.order.deliveryStatus,
          );
          setDeliveryStatus(orderResponse.data.order.deliveryStatus);
          startProgressAnimation(orderResponse.data.order.deliveryStatus);
        }

        const liveData = await fetchLiveDeliveryData(params.orderId!, token);
        setLiveData(liveData);

        // Update from live data (overrides if available)
        updateDeliveryStatus(liveData);

        if (liveData.estimate) {
          setEta(liveData.estimate.text);
          setDistance(liveData.estimate.distance);

          const newEstimate: DeliveryEstimate = {
            estimatedTime: liveData.estimate.minutes,
            estimatedDelivery: liveData.estimate.text,
            deliveryType:
              liveData.estimate.minutes <= 30 ? 'express' : 'standard',
            distance: liveData.estimate.distance,
          };
          setDeliveryEstimate(newEstimate);
        }
      } else {
        throw new Error(
          orderResponse.data.message || 'Failed to fetch order details',
        );
      }
    } catch (error: any) {
      console.error('❌ Order fetch error:', error);
      setApiCallStatus(prev => ({
        ...prev,
        orderFetch: 'error',
        errorMessage: error.message,
      }));

      // Set default values
      setDeliveryStatus('waiting_for_seller');
      startProgressAnimation('waiting_for_seller');

      setDeliveryEstimate({
        estimatedTime: 45,
        estimatedDelivery: '45-60 minutes',
        deliveryType: 'express',
        distance: '5 km',
      });
      setEta('45-60 minutes');
      setDistance('5 km');

      Alert.alert(
        'Network Error',
        'Unable to load order details. Please check your internet connection.',
        [{ text: 'OK' }],
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch LIVE delivery data from API
  const fetchLiveDeliveryData = async (
    orderId: string,
    token: string,
  ): Promise<LiveDeliveryData> => {
    try {
      setApiCallStatus(prev => ({ ...prev, liveFetch: 'loading' }));

      console.log('🚚 Fetching live delivery data...');

      const response = await axios.get(
        `http://192.168.251.121:5000/api/orders/tracking/live/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      console.log('📡 Live Delivery Response:', response.data);

      if (response.data.success) {
        setApiCallStatus(prev => ({ ...prev, liveFetch: 'success' }));
        return response.data;
      } else {
        throw new Error('Failed to get live delivery data');
      }
    } catch (error: any) {
      console.error('❌ Live delivery fetch error:', error);
      setApiCallStatus(prev => ({
        ...prev,
        liveFetch: 'error',
        errorMessage: error.message,
      }));

      // Return default data
      return {
        success: false,
        deliveryStatus: 'waiting_for_seller',
        estimate: {
          minutes: 45,
          text: '45-55 minutes',
          distance: '5 km',
        },
      };
    }
  };

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    triggerHaptic('impactLight');

    progressAnim.setValue(0);

    fetchOrderDetails();
  }, []);

  // Handle button press based on status
  const handleMainButtonPress = () => {
    if (!params.orderId) {
      Alert.alert('Error', 'Order ID not available');
      return;
    }
    triggerHaptic('impactMedium');

    console.log('👉 Main button pressed for status:', deliveryStatus);

    switch (deliveryStatus) {
      case 'delivered':
        navigation.navigate('RateOrder', { orderId: params.orderId });
        break;
      case 'waiting_for_seller':
        navigation.navigate('OrderDetails', { orderId: params.orderId });
        break;
      default:
        navigation.navigate('OrderTracking', {
          orderId: params.orderId,
          liveData: liveData,
        });
        break;
    }
  };

  // Get status display information
  const getStatusDisplayInfo = () => {
    const statusInfo: Record<
      DeliveryStatus,
      { icon: string; color: string; label: string }
    > = {
      waiting_for_seller: {
        icon: 'store',
        color: colors.statusWaiting,
        label: 'Preparing Order',
      },
      pending_rider_accept: {
        icon: 'hourglass-empty',
        color: colors.statusPending,
        label: 'Finding Rider',
      },
      assigned: {
        icon: 'motorcycle',
        color: colors.statusAssigned,
        label: 'Rider Assigned',
      },
      waiting_for_rider: {
        icon: 'person-pin',
        color: colors.statusReady,
        label: 'Rider Arrived',
      },
      picked_up: {
        icon: 'local-shipping',
        color: colors.statusPicked,
        label: 'On the Way',
      },
      delivered: {
        icon: 'check-circle',
        color: colors.statusDelivered,
        label: 'Delivered',
      },
    };

    return statusInfo[deliveryStatus];
  };

  // Get payment method display
  const getPaymentMethodDisplay = () => {
    const paymentSource: PaymentMethodType =
      params.source || orderDetails?.paymentMethod || 'unknown';

    if (paymentSource === 'stripe_payment' || paymentSource === 'online') {
      return {
        type: 'stripe',
        icon: () => (
          <>
            <View style={styles.stripeDot} />
            <View style={[styles.stripeDot, styles.stripeDotGreen]} />
            <View style={[styles.stripeDot, styles.stripeDotRed]} />
          </>
        ),
        text: 'Stripe',
        color: colors.primary,
      };
    } else if (paymentSource === 'cod') {
      return {
        type: 'cod',
        icon: () => <Icon name="money" size={12} color={colors.warning} />,
        text: 'Cash on Delivery',
        color: colors.warning,
      };
    } else {
      return {
        type: 'unknown',
        icon: () => (
          <Icon name="payment" size={12} color={colors.textSecondary} />
        ),
        text: 'Paid',
        color: colors.textSecondary,
      };
    }
  };

  // Render progress steps with labels - FIXED VERSION
  const renderProgressSteps = () => {
    const steps = [
      { icon: 'store', label: 'Seller', status: 'waiting_for_seller' },
      {
        icon: 'hourglass-empty',
        label: 'Finding Rider',
        status: 'pending_rider_accept',
      },
      { icon: 'motorcycle', label: 'Rider Assigned', status: 'assigned' },
      { icon: 'local-shipping', label: 'On the way', status: 'picked_up' },
      { icon: 'location-on', label: 'Delivered', status: 'delivered' },
    ];

    const currentStep = statusConfig.currentStepIndex;

    return (
      <View style={styles.progressFullContainer}>
        {/* Progress Bar with Dots */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBackground}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
            {/* Progress Dots */}
            <View style={styles.progressDotsContainer}>
              {steps.map((step, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index <= currentStep
                      ? styles.progressDotActive
                      : styles.progressDotInactive,
                  ]}
                >
                  <Icon name={step.icon as any} size={12} color="#fff" />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* All Labels - Full width with equal spacing */}
        <View style={styles.allLabelsContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.singleLabelContainer}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.progressStepLabel,
                  index === currentStep ? styles.currentStepLabel : {},
                  index < currentStep ? styles.completedStepLabel : {},
                  index > currentStep ? styles.upcomingStepLabel : {},
                ]}
              >
                {step.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render initial success animation screen
  if (showSuccessAnimation) {
    return (
      <SafeAreaView style={styles.initialAnimationContainer}>
        <LottieView
          ref={successAnimationRef}
          source={successAnimationSource}
          autoPlay
          loop={false}
          style={styles.initialSuccessAnimation}
          onAnimationFinish={() => {
            triggerHaptic('notificationSuccess');
          }}
        />
        <Text style={styles.preparingText}>Preparing your order....!</Text>
      </SafeAreaView>
    );
  }

  const paymentMethod = getPaymentMethodDisplay();
  const statusInfo = getStatusDisplayInfo();

  // If no orderId, show error screen
  if (!params.orderId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={60} color={colors.error} />
          <Text style={styles.errorTitle}>Order Not Found</Text>
          <Text style={styles.errorText}>
            We couldn't find your order details. Please check your order history
            or contact support.
          </Text>
          <TouchableOpacity
            style={[styles.errorButton, { marginTop: 20 }]}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={[styles.errorButtonText, { color: colors.primary }]}>
              Go to Home
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            title="Pull to refresh"
            titleColor={colors.textSecondary}
          />
        }
      >
        {/* Header with Status Animation */}
        <View style={styles.headerContainer}>
          <View style={styles.animationContainer}>
            <LottieView
              ref={deliveryAnimationRef}
              source={statusConfig.animation}
              autoPlay
              loop={deliveryStatus !== 'delivered'}
              style={styles.deliveryAnimation}
            />
          </View>

          <View style={styles.textContainer}>
            {/* Status Badge */}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusInfo.color + '20' },
              ]}
            >
              <Icon
                name={statusInfo.icon as any}
                size={14}
                color={statusInfo.color}
              />
              <Text
                style={[styles.statusBadgeText, { color: statusInfo.color }]}
              >
                {statusInfo.label}
              </Text>
            </View>

            {/* Main Title */}
            <Text style={styles.mainTitle}>{statusConfig.title}</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>{statusConfig.subtitle}</Text>
          </View>
        </View>

        {/* Delivery Progress Card */}
        <View style={styles.deliveryCard}>
          <View style={styles.deliveryCardHeader}>
            <MaterialCommunityIcons
              name="progress-clock"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.deliveryCardTitle}>Delivery Progress</Text>
          </View>

          {/* Progress Bar */}
          {statusConfig.showDeliveryProgress && (
            <View style={styles.progressContainer}>
              {renderProgressSteps()}
            </View>
          )}

          {/* Rider Information */}
          {statusConfig.showRiderInfo && liveData?.riderDetails && (
            <View style={styles.riderContainer}>
              <View style={styles.riderHeader}>
                <MaterialCommunityIcons
                  name="motorbike"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.riderTitle}>Your Delivery Rider</Text>
              </View>
              <View style={styles.riderDetails}>
                <View style={styles.riderInfo}>
                  <Text style={styles.riderName}>
                    {liveData.riderDetails.name || 'Rider'}
                  </Text>
                  {liveData.riderDetails.vehicleType && (
                    <Text style={styles.riderVehicle}>
                      {liveData.riderDetails.vehicleType}
                    </Text>
                  )}
                </View>
                {liveData.riderDetails.phone && (
                  <TouchableOpacity style={styles.callButton}>
                    <Icon name="phone" size={16} color="#fff" />
                    <Text style={styles.callButtonText}>Call</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Seller Information */}
          {statusConfig.showSellerInfo && (
            <View style={styles.sellerContainer}>
              <View style={styles.sellerHeader}>
                <Icon name="store" size={20} color={colors.textSecondary} />
                <Text style={styles.sellerTitle}>Seller Information</Text>
              </View>
              <Text style={styles.sellerText}>
                {liveData?.sellerDetails?.name || 'Seller'} is preparing your
                order
              </Text>
            </View>
          )}

          {/* Time and Distance Information */}
          {deliveryStatus !== 'delivered' && (
            <>
              <View style={styles.distanceContainer}>
                <Icon
                  name="location-on"
                  size={18}
                  color={colors.textSecondary}
                />
                <View style={styles.distanceInfo}>
                  <Text style={styles.distanceText}>
                    Distance:{' '}
                    <Text style={styles.distanceHighlight}>
                      {distance || 'Calculating...'}
                    </Text>
                  </Text>
                  {liveLoading && (
                    <View style={styles.liveIndicator}>
                      <Text style={styles.liveIndicatorText}>
                        Live updating...
                      </Text>
                      <View style={styles.liveDot} />
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.timeContainer}>
                <Icon name="access-time" size={20} color={colors.primary} />
                <View style={styles.timeInfo}>
                  <Text style={styles.timeText}>
                    Est. Delivery:{' '}
                    <Text style={styles.timeHighlight}>
                      {eta || 'Calculating...'}
                    </Text>
                  </Text>
                  <Text style={styles.liveUpdateText}>
                    Updates every minute
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Order ID */}
          <View style={styles.orderIdContainer}>
            <Icon name="receipt" size={18} color={colors.textSecondary} />
            <Text style={styles.orderIdText}>
              Order ID:{' '}
              <Text style={styles.orderIdHighlight}>
                {orderDetails?.orderId || 'N/A'}
              </Text>
            </Text>
          </View>
        </View>

        {/* Order Summary - Only show for non-delivered status */}
        {deliveryStatus !== 'delivered' && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>

            {orderDetails?.items?.map((item: any, index: number) => (
              <View key={index} style={styles.summaryItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.title || 'Product'}
                  </Text>
                  <Text style={styles.itemQuantity}>
                    Qty: {item.quantity || 1}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  ₹
                  {params.totalAmount?.toFixed(2) ||
                    orderDetails?.finalAmount?.toFixed(2) ||
                    '0.00'}
                </Text>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalAmount}>
                ₹
                {params.totalAmount?.toFixed(2) ||
                  orderDetails?.finalAmount?.toFixed(2) ||
                  '0.00'}
              </Text>
            </View>

            <View style={styles.paymentMethodRow}>
              <Text style={styles.paymentLabel}>Payment Method</Text>
              <View
                style={[
                  styles.paymentBadge,
                  { borderColor: paymentMethod.color },
                ]}
              >
                {paymentMethod.icon()}
                <Text
                  style={[styles.paymentText, { color: paymentMethod.color }]}
                >
                  {paymentMethod.text}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Spacer for buttons */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Fixed Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.trackButton}
          onPress={handleMainButtonPress}
          activeOpacity={0.9}
        >
          <View style={styles.buttonContent}>
            <MaterialCommunityIcons
              name={deliveryStatus === 'delivered' ? 'star' : 'map-marker-path'}
              size={22}
              color="#fff"
            />
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonMainText}>
                {statusConfig.mainButtonText}
              </Text>
              <Text style={styles.buttonSubText}>
                {deliveryStatus === 'delivered'
                  ? 'Rate your experience'
                  : 'Live tracking & updates'}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Create dynamic styles based on theme colors
const makeStyles = (colors: any, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    initialAnimationContainer: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    initialSuccessAnimation: {
      width: 200,
      height: 200,
    },
    preparingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingAnimation: {
      width: 150,
      height: 150,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 16,
      marginBottom: 8,
    },
    errorText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    errorButton: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
    },
    errorButtonText: {
      fontSize: 14,
      fontWeight: '700',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 80,
    },
    headerContainer: {
      alignItems: 'center',
      paddingTop: 20,
      paddingBottom: 24,
    },
    animationContainer: {
      width: 295,
      height: 295,
      left: -105,
      marginBottom: 10,
    },
    deliveryAnimation: {
      width: '100%',
      height: '100%',
    },
    textContainer: {
      alignItems: 'center',
      marginTop: 20,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
      marginBottom: 10,
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      marginLeft: 5,
    },
    mainTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 16,
    },
    deliveryCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    deliveryCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    deliveryCardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginLeft: 8,
    },
    progressContainer: {
      marginBottom: 20,
    },
    progressFullContainer: {
      marginBottom: 10,
    },
    progressBarContainer: {
      marginBottom: 25,
    },
    progressBackground: {
      height: 20,
      backgroundColor: colors.progressBarBg,
      borderRadius: 10,
      overflow: 'hidden',
      justifyContent: 'center',
      position: 'relative',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.progressBarFill,
      borderRadius: 10,
      position: 'absolute',
      left: 0,
    },
    progressDotsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'absolute',
      width: '100%',
      top: 0,
      paddingHorizontal: 10,
    },
    progressDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.cardBackground,
      zIndex: 1,
    },
    progressDotActive: {
      backgroundColor: colors.success,
    },
    progressDotInactive: {
      backgroundColor: colors.textTertiary,
    },
    allLabelsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      width: '100%',
      paddingHorizontal: 0,
    },
    singleLabelContainer: {
      flex: 1,
      alignItems: 'center',
      minWidth: 0,
    },
    progressStepLabel: {
      fontSize: 10,
      textAlign: 'center',
      maxWidth: 70,
      overflow: 'hidden',
    },
    currentStepLabel: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 11,
    },
    completedStepLabel: {
      color: colors.success,
      fontWeight: '600',
    },
    upcomingStepLabel: {
      color: colors.textTertiary,
      opacity: 0.8,
    },
    progressLabelsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      position: 'absolute',
      width: '100%',
      top: 20,
    },
    labelContainer: {
      alignItems: 'center',
      minWidth: 60,
    },
    emptyLabelContainer: {
      minWidth: 60,
    },
    currentLabelContainer: {
      // Optional: Add styling for current label container
    },
    nextLabelContainer: {
      // Optional: Add styling for next label container
    },
    progressLabel: {
      fontSize: 9,
      color: colors.textSecondary,
      fontWeight: '500',
      textAlign: 'center',
    },
    currentLabel: {
      color: colors.textPrimary,
      fontWeight: '700',
    },
    nextLabel: {
      color: colors.textSecondary,
      fontWeight: '500',
    },
    riderContainer: {
      backgroundColor: colors.deliveryCardBg,
      borderRadius: 10,
      padding: 14,
      marginBottom: 14,
    },
    riderHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    riderTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      marginLeft: 6,
    },
    riderDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    riderInfo: {
      flex: 1,
    },
    riderName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 3,
    },
    riderVehicle: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    callButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.success,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 6,
    },
    callButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 5,
    },
    sellerContainer: {
      backgroundColor: colors.deliveryCardBg,
      borderRadius: 10,
      padding: 14,
      marginBottom: 14,
    },
    sellerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    sellerTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginLeft: 6,
    },
    sellerText: {
      fontSize: 13,
      color: colors.textPrimary,
      lineHeight: 18,
    },
    distanceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      padding: 10,
      backgroundColor: colors.deliveryCardBg,
      borderRadius: 10,
    },
    distanceInfo: {
      flex: 1,
      marginLeft: 8,
    },
    distanceText: {
      fontSize: 13,
      color: colors.textPrimary,
      fontWeight: '500',
    },
    distanceHighlight: {
      color: colors.primary,
      fontWeight: '700',
    },
    liveIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 3,
    },
    liveIndicatorText: {
      fontSize: 10,
      color: colors.success,
      fontWeight: '500',
      marginRight: 5,
    },
    liveDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: colors.success,
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
      padding: 10,
      backgroundColor: colors.deliveryCardBg,
      borderRadius: 10,
    },
    timeInfo: {
      flex: 1,
      marginLeft: 8,
    },
    timeText: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '500',
    },
    timeHighlight: {
      color: colors.primary,
      fontWeight: '700',
    },
    liveUpdateText: {
      fontSize: 10,
      color: colors.textTertiary,
      marginTop: 2,
      fontStyle: 'italic',
    },
    orderIdContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      backgroundColor: colors.orderIdBg,
      borderRadius: 10,
    },
    orderIdText: {
      fontSize: 10,
      color: colors.textSecondary,
      marginLeft: 6,
    },
    orderIdHighlight: {
      color: colors.textPrimary,
      fontWeight: '200',
    },
    summaryCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 16,
    },
    summaryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    itemInfo: {
      flex: 1,
    },
    itemName: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 3,
    },
    itemQuantity: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    itemPrice: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginVertical: 14,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    totalLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    totalAmount: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.primary,
    },
    paymentMethodRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    paymentLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    paymentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.orderIdBg,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
    },
    stripeDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: colors.primary,
      marginRight: 2,
    },
    stripeDotGreen: {
      backgroundColor: '#00D4AA',
    },
    stripeDotRed: {
      backgroundColor: '#FF6B6B',
    },
    paymentText: {
      fontSize: 11,
      fontWeight: '600',
      marginLeft: 4,
    },
    spacer: {
      height: 36,
    },
    buttonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.cardBackground,
      paddingHorizontal: 16,
      paddingVertical: 16,
      paddingBottom: Platform.OS === 'ios' ? 24 : 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 8,
    },
    trackButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 5,
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
    },
    buttonTextContainer: {
      flex: 1,
      marginHorizontal: 10,
    },
    buttonMainText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 2,
    },
    buttonSubText: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: 11,
      fontWeight: '500',
    },
  });

export default OrderSuccessScreen;
