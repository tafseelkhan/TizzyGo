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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

// Icons
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';

// Lottie
import LottieView from 'lottie-react-native';

// Haptics
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// Context
import { useTheme } from '../../contexts/theme/ThemeContext';

// Services & Utils
import {
  orderSuccessService,
  OrderDetails,
} from '../../services/orders/orderSuccessService';
import {
  getStatusDisplayInfo,
  calculateTotalAmount,
  getStepsWithStatus,
  getDefaultDeliveryEstimate,
  getPaymentMethodType,
} from '../../utils/orders/orderSuccessUtils';
import { DeliveryStatus, LiveDeliveryData } from '../../../api/features/private/orderSuccessPrivateSlice';

const { width, height } = Dimensions.get('window');

// Animation JSON files
const SUCCESS_ANIMATION_LIGHT = require('../animations/lotties/successcheck.json');
const DELIVERY_ANIMATION = require('../animations/lotties/delivery.json');

// Navigation param types
type RootStackParamList = {
  Home: undefined;
  RateOrder: { orderId: string };
  OrderDetails: { orderId: string };
  OrderTracking: { orderId: string; liveData?: LiveDeliveryData | null };
  OrderSuccessScreen: OrderSuccessParams;
};

interface OrderSuccessParams {
  orderId?: string;
  source?: 'stripe_payment' | 'cod' | 'online' | 'unknown';
  totalAmount?: number;
}

// Haptic options
const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const triggerHaptic = (
  type:
    | 'notificationSuccess'
    | 'impactLight'
    | 'impactMedium'
    | 'impactHeavy' = 'notificationSuccess',
) => {
  if (Platform.OS === 'ios') {
    const hapticMap = {
      notificationSuccess: 'notificationSuccess',
      impactLight: 'impactLight',
      impactMedium: 'impactMedium',
      impactHeavy: 'impactHeavy',
    };
    ReactNativeHapticFeedback.trigger(hapticMap[type] as any, hapticOptions);
  } else {
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
  }
};

const OrderSuccessScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'OrderSuccessScreen'>>();
  const params = (route.params || {}) as OrderSuccessParams;
  const { isDark, resolvedTheme } = useTheme();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deliveryEstimate, setDeliveryEstimate] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(true);
  const [liveData, setLiveData] = useState<LiveDeliveryData | null>(null);
  const [deliveryStatus, setDeliveryStatus] =
    useState<DeliveryStatus>('waiting_for_seller');
  const [eta, setEta] = useState<string>('');
  const [distance, setDistance] = useState<string>('');
  const [liveLoading, setLiveLoading] = useState(false);
  const [apiCallStatus, setApiCallStatus] = useState({
    orderFetch: 'idle' as 'idle' | 'loading' | 'success' | 'error',
    liveFetch: 'idle' as 'idle' | 'loading' | 'success' | 'error',
    errorMessage: '',
  });

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;
  const successAnimationRef = useRef<LottieView>(null);
  const deliveryAnimationRef = useRef<LottieView>(null);

  // Get theme colors
  const getThemeColors = () => ({
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
  });

  const colors = getThemeColors();
  const statusConfig = orderSuccessService.getStatusConfig(deliveryStatus);
  const statusInfo = getStatusDisplayInfo(deliveryStatus, colors);
  const steps = getStepsWithStatus();

  // Start progress animation
  const startProgressAnimation = (status: DeliveryStatus) => {
    const config = orderSuccessService.getStatusConfig(status);
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: config.progressPercentage / 100,
      duration: 1500,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
  };

  // Update delivery status from API
  const updateDeliveryStatus = (apiData: LiveDeliveryData) => {
    const statusFromApi =
      apiData.deliveryStatus || apiData.currentStatus || apiData.status;

    if (statusFromApi) {
      const mappedStatus =
        orderSuccessService.mapApiStatusToDeliveryStatus(statusFromApi);
      if (mappedStatus !== deliveryStatus) {
        setDeliveryStatus(mappedStatus);
        startProgressAnimation(mappedStatus);
      }
    }
  };

  // Fetch live ETA
  const fetchLiveEstimate = async () => {
    if (!params.orderId) return;

    try {
      setLiveLoading(true);
      const data = await orderSuccessService.fetchLiveDeliveryData(
        params.orderId,
      );

      if (data.estimate) {
        setEta(data.estimate.text);
        setDistance(data.estimate.distance);
      }

      updateDeliveryStatus(data);
      setLiveData(prev => ({ ...prev, ...data }));

      if (Platform.OS === 'ios') {
        triggerHaptic('impactLight');
      }
    } catch (err: any) {
      console.log('Live ETA error:', err.message);
    } finally {
      setLiveLoading(false);
    }
  };

  // Fetch order details
  const fetchOrderDetails = async () => {
    try {
      if (!params.orderId) throw new Error('Order ID is required');

      setApiCallStatus(prev => ({ ...prev, orderFetch: 'loading' }));

      const order = await orderSuccessService.fetchOrderDetails(params.orderId);
      setOrderDetails(order);
      setApiCallStatus(prev => ({ ...prev, orderFetch: 'success' }));

      if (order.deliveryStatus) {
        setDeliveryStatus(order.deliveryStatus);
        startProgressAnimation(order.deliveryStatus);
      }

      const liveData = await orderSuccessService.fetchLiveDeliveryData(
        params.orderId,
      );
      setLiveData(liveData);
      updateDeliveryStatus(liveData);

      if (liveData.estimate) {
        setEta(liveData.estimate.text);
        setDistance(liveData.estimate.distance);
        setDeliveryEstimate({
          estimatedTime: liveData.estimate.minutes,
          estimatedDelivery: liveData.estimate.text,
          deliveryType:
            liveData.estimate.minutes <= 30 ? 'express' : 'standard',
          distance: liveData.estimate.distance,
        });
      }
    } catch (error: any) {
      console.error('Order fetch error:', error);
      setApiCallStatus(prev => ({
        ...prev,
        orderFetch: 'error',
        errorMessage: error.message,
      }));

      setDeliveryStatus('waiting_for_seller');
      startProgressAnimation('waiting_for_seller');
      const defaultEstimate = getDefaultDeliveryEstimate();
      setDeliveryEstimate(defaultEstimate);
      setEta(defaultEstimate.estimatedDelivery);
      setDistance(defaultEstimate.distance);

      Alert.alert(
        'Network Error',
        'Unable to load order details. Please check your internet connection.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto refresh every minute
  useEffect(() => {
    if (!params.orderId || loading) return;

    fetchLiveEstimate();
    const interval = setInterval(fetchLiveEstimate, 60000);
    return () => clearInterval(interval);
  }, [params.orderId, loading]);

  // Initial setup
  useEffect(() => {
    if (!params.orderId) {
      Alert.alert('Error', 'Order information not found.', [
        { text: 'Go Home', onPress: () => navigation.navigate('Home') },
      ]);
      return;
    }

    triggerHaptic('notificationSuccess');
    if (successAnimationRef.current) successAnimationRef.current.play();

    setTimeout(() => {
      setShowSuccessAnimation(false);
      fetchOrderDetails();
    }, 3000);
  }, []);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    triggerHaptic('impactLight');
    progressAnim.setValue(0);
    fetchOrderDetails();
  }, []);

  // Handle button press
  const handleMainButtonPress = () => {
    if (!params.orderId) {
      Alert.alert('Error', 'Order ID not available');
      return;
    }
    triggerHaptic('impactMedium');

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
          liveData,
        });
        break;
    }
  };

  // Render progress steps
  const renderProgressSteps = () => {
    const currentStep = statusConfig.currentStepIndex;

    return (
      <View style={styles.progressFullContainer}>
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

        <View style={styles.allLabelsContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.singleLabelContainer}>
              <Text
                numberOfLines={1}
                style={[
                  styles.progressStepLabel,
                  index === currentStep && styles.currentStepLabel,
                  index < currentStep && styles.completedStepLabel,
                  index > currentStep && styles.upcomingStepLabel,
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

  // Success animation screen
  if (showSuccessAnimation) {
    return (
      <SafeAreaView style={styles.initialAnimationContainer}>
        <LottieView
          ref={successAnimationRef}
          source={SUCCESS_ANIMATION_LIGHT}
          autoPlay
          loop={false}
          style={styles.initialSuccessAnimation}
        />
        <Text style={styles.preparingText}>Preparing your order....!</Text>
      </SafeAreaView>
    );
  }

  // Error screen
  if (!params.orderId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={60} color={colors.error} />
          <Text style={styles.errorTitle}>Order Not Found</Text>
          <Text style={styles.errorText}>
            We couldn't find your order details. Please check your order
            history.
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
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

  const paymentMethodType = getPaymentMethodType(
    params.source,
    orderDetails?.paymentMethod,
  );
  const totalAmount = calculateTotalAmount(
    params.totalAmount,
    orderDetails?.finalAmount,
  );
  const paymentMethodColor =
    colors[paymentMethodType.colorKey as keyof typeof colors] || colors.primary;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
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
            <Text style={styles.mainTitle}>{statusConfig.title}</Text>
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

          {statusConfig.showDeliveryProgress && renderProgressSteps()}

          {/* Rider Info */}
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

          {/* Seller Info */}
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

          {/* Distance & Time */}
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

        {/* Order Summary */}
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
                <Text style={styles.itemPrice}>₹{totalAmount}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalAmount}>₹{totalAmount}</Text>
            </View>
            <View style={styles.paymentMethodRow}>
              <Text style={styles.paymentLabel}>Payment Method</Text>
              <View
                style={[
                  styles.paymentBadge,
                  { borderColor: paymentMethodColor },
                ]}
              >
                <Text
                  style={[
                    styles.paymentText,
                    { color: paymentMethodColor },
                  ]}
                >
                  {paymentMethodType.text}
                </Text>
              </View>
            </View>
          </View>
        )}

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

// Styles - keep as is from original
const makeStyles = (colors: any, isDarkMode: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    initialAnimationContainer: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    initialSuccessAnimation: { width: 200, height: 200 },
    preparingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textPrimary,
      fontWeight: '600',
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
    errorButtonText: { fontSize: 14, fontWeight: '700' },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 80 },
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
    deliveryAnimation: { width: '100%', height: '100%' },
    textContainer: { alignItems: 'center', marginTop: 20 },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
      marginBottom: 10,
    },
    statusBadgeText: { fontSize: 11, fontWeight: '600', marginLeft: 5 },
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
    progressFullContainer: { marginBottom: 10 },
    progressBarContainer: { marginBottom: 25 },
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
    progressDotActive: { backgroundColor: colors.success },
    progressDotInactive: { backgroundColor: colors.textTertiary },
    allLabelsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      width: '100%',
      paddingHorizontal: 0,
    },
    singleLabelContainer: { flex: 1, alignItems: 'center', minWidth: 0 },
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
    completedStepLabel: { color: colors.success, fontWeight: '600' },
    upcomingStepLabel: { color: colors.textTertiary, opacity: 0.8 },
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
    riderInfo: { flex: 1 },
    riderName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 3,
    },
    riderVehicle: { fontSize: 11, color: colors.textSecondary },
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
    sellerText: { fontSize: 13, color: colors.textPrimary, lineHeight: 18 },
    distanceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      padding: 10,
      backgroundColor: colors.deliveryCardBg,
      borderRadius: 10,
    },
    distanceInfo: { flex: 1, marginLeft: 8 },
    distanceText: {
      fontSize: 13,
      color: colors.textPrimary,
      fontWeight: '500',
    },
    distanceHighlight: { color: colors.primary, fontWeight: '700' },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
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
    timeInfo: { flex: 1, marginLeft: 8 },
    timeText: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
    timeHighlight: { color: colors.primary, fontWeight: '700' },
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
    orderIdText: { fontSize: 10, color: colors.textSecondary, marginLeft: 6 },
    orderIdHighlight: { color: colors.textPrimary, fontWeight: '200' },
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
    itemInfo: { flex: 1 },
    itemName: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 3,
    },
    itemQuantity: { fontSize: 11, color: colors.textSecondary },
    itemPrice: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
    divider: { height: 1, backgroundColor: colors.divider, marginVertical: 14 },
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
    totalAmount: { fontSize: 20, fontWeight: '800', color: colors.primary },
    paymentMethodRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    paymentLabel: { fontSize: 13, color: colors.textSecondary },
    paymentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.orderIdBg,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
    },
    paymentText: { fontSize: 11, fontWeight: '600', marginLeft: 4 },
    spacer: { height: 36 },
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
    buttonTextContainer: { flex: 1, marginHorizontal: 10 },
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

const styles = makeStyles(getThemeColors(), false);
export default OrderSuccessScreen;
function getThemeColors(): any {
  return {
    primary: '#635BFF',
    primaryLight: '#A8A4FF',
    primaryDark: '#4A43D9',
    background: '#f8fafc',
    cardBackground: '#ffffff',
    surface: '#f1f5f9',
    textPrimary: '#1a1a1a',
    textSecondary: '#64748b',
    textTertiary: '#94A3B8',
    success: '#10b981',
    successLight: '#D1FAE5',
    warning: '#f59e0b',
    warningLight: '#FEF3C7',
    error: '#ef4444',
    errorLight: '#FEE2E2',
    info: '#3b82f6',
    border: '#e2e8f0',
    divider: '#e2e8f0',
    shadow: 'rgba(0, 0, 0, 0.1)',
    progressBarBg: '#e2e8f0',
    progressBarFill: '#635BFF',
    deliveryCardBg: '#f0f7ff',
    orderIdBg: '#f8fafc',
    statusWaiting: '#f59e0b',
    statusPending: '#f59e0b',
    statusAssigned: '#3b82f6',
    statusReady: '#10b981',
    statusPicked: '#8b5cf6',
    statusDelivered: '#10b981',
  };
}

