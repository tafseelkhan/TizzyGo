// ============================================================
// screens/tizzygo/OrderConfirmationScreen.tsx - FIXED TYPESCRIPT
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../../contexts/theme/ThemeContext';
import { useOrderConfirmation } from '../../../hooks/useOrderConfirmation';
import {
  ConfirmationStatus,
  PaymentMethod,
} from '../../../../api/features/private/orderConfirmationPrivateSlice';

const { width } = Dimensions.get('window');

// ============================================================
// TYPES
// ============================================================

interface RouteParams {
  checkoutSessionId: string;
}

// ✅ Define navigation param list
type RootStackParamList = {
  CustomerShop: undefined;
  OrderTracking: { orderId: string };
  // Add other screens as needed
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ============================================================
// COMPONENT
// ============================================================

export default function OrderConfirmationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { isDark } = useTheme();
  const { checkoutSessionId } = route.params as RouteParams;

  const { loading, refreshing, confirmation, error, refresh, retry } =
    useOrderConfirmation(checkoutSessionId);

  const colors = isDark ? darkColors : lightColors;

  // ✅ Get first order ID for tracking
  const getOrderIdForTracking = () => {
    if (confirmation?.orders && confirmation.orders.length > 0) {
      return confirmation.orders[0].orderId;
    }
    return null;
  };

  // ✅ Navigate to tracking with order ID
  const handleTrackOrder = () => {
    const orderId = getOrderIdForTracking();
    if (orderId) {
      console.log('📍 Navigating to OrderTracking with orderId:', orderId);
      navigation.navigate('OrderTracking', {
        orderId: orderId,
      });
    } else {
      console.warn('⚠️ No order ID available for tracking');
      Alert.alert('Error', 'Unable to track order. Please try again later.');
    }
  };

  // ✅ Loading state
  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading confirmation...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ Error state
  if (error || !confirmation) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.errorContainer}>
          <MaterialIcon name="error-outline" size={64} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Something went wrong
          </Text>
          <Text style={[styles.errorMessage, { color: colors.secondary }]}>
            {error || 'Failed to load confirmation details'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={retry}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = confirmation.confirmationStatus;
  const paymentMethod = confirmation.paymentMethod;
  const isCOD = paymentMethod === PaymentMethod.COD;
  const isSuccess = status === ConfirmationStatus.SUCCESS;
  const isFailed = status === ConfirmationStatus.FAILED;
  const isPending = status === ConfirmationStatus.PENDING;
  const isExpired = status === ConfirmationStatus.EXPIRED;

  const statusColors = getStatusColors(isDark, status);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { backgroundColor: statusColors.background },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Lottie Animation */}
        <View style={styles.lottieContainer}>
          <LottieView
            source={getLottieSource(status)}
            autoPlay
            loop={isPending}
            style={styles.lottie}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: statusColors.text }]}>
          {getTitle(status, isCOD)}
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: statusColors.subtitle }]}>
          {getSubtitle(status, confirmation, isCOD)}
        </Text>

        {/* ✅ COD: Show cash ready message */}
        {isCOD && isSuccess && (
          <View style={styles.codSuccessMessage}>
            <Text
              style={[styles.codSuccessText, { color: statusColors.subtitle }]}
            >
              Your order has been placed successfully.
            </Text>
            <Text
              style={[
                styles.codSuccessSubText,
                { color: statusColors.subtitle },
              ]}
            >
              Please keep cash ready for delivery.
            </Text>
          </View>
        )}

        {/* ✅ ONLINE PENDING: Show processing message only */}
        {isPending && !isCOD && (
          <View style={styles.processingContainer}>
            <Text
              style={[styles.processingText, { color: statusColors.subtitle }]}
            >
              Please wait while we confirm your payment...
            </Text>
          </View>
        )}

        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>
            Order Summary
          </Text>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.secondary }]}>
              Subtotal
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ₹{confirmation.summary.subtotal.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.secondary }]}>
              GST
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ₹{confirmation.summary.gst.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.secondary }]}>
              Platform Fee
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ₹{confirmation.summary.platformFee.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.secondary }]}>
              Delivery Charge
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ₹{confirmation.summary.deliveryCharge.toFixed(2)}
            </Text>
          </View>

          {confirmation.summary.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.secondary }]}>
                Discount
              </Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                -₹{confirmation.summary.discount.toFixed(2)}
              </Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.grandTotalLabel, { color: colors.text }]}>
              Grand Total
            </Text>
            <Text style={[styles.grandTotalValue, { color: colors.primary }]}>
              ₹{confirmation.summary.grandTotal.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Orders List */}
        <View style={styles.ordersContainer}>
          <Text style={[styles.ordersTitle, { color: colors.text }]}>
            Order{confirmation.orders.length > 1 ? 's' : ''} (
            {confirmation.orders.length})
          </Text>

          <FlatList
            data={confirmation.orders}
            keyExtractor={item => item._id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View
                style={[styles.orderCard, { backgroundColor: colors.card }]}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderHeaderLeft}>
                    <Text style={[styles.orderId, { color: colors.text }]}>
                      #{item.orderId}
                    </Text>
                    <View
                      style={[
                        styles.statusChip,
                        { backgroundColor: statusColors.chip },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          { color: statusColors.text },
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.orderPrice, { color: colors.primary }]}>
                    ₹{item.price.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.productRow}>
                  {item.productImage ? (
                    <View style={styles.productImageWrapper}>
                      <Text style={styles.productImagePlaceholder}>📷</Text>
                    </View>
                  ) : (
                    <View style={styles.productImageFallback}>
                      <MaterialIcon
                        name="image"
                        size={24}
                        color={colors.secondary}
                      />
                    </View>
                  )}
                  <View style={styles.productInfo}>
                    <Text style={[styles.productTitle, { color: colors.text }]}>
                      {item.productTitle}
                    </Text>
                    <Text
                      style={[styles.productMeta, { color: colors.secondary }]}
                    >
                      Seller: {item.sellerName}
                    </Text>
                    {item.variant && (
                      <Text
                        style={[
                          styles.productMeta,
                          { color: colors.secondary },
                        ]}
                      >
                        Variant: {item.variant}
                      </Text>
                    )}
                    <Text
                      style={[styles.productMeta, { color: colors.secondary }]}
                    >
                      Qty: {item.quantity}
                    </Text>
                  </View>
                </View>

                {/* ✅ Track Order Button for each order */}
                <TouchableOpacity
                  style={styles.trackOrderButton}
                  onPress={() => {
                    console.log('📍 Tracking order:', item.orderId);
                    navigation.navigate('OrderTracking', {
                      orderId: item.orderId,
                    });
                  }}
                >
                  <MaterialIcon
                    name="track-changes"
                    size={18}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.trackOrderText, { color: colors.primary }]}
                  >
                    Track Order
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>

        {/* ✅ Buttons - User controlled, NO auto-redirect */}
        <View style={styles.buttonsContainer}>
          {confirmation.buttons.canGoHome && (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => navigation.navigate('CustomerShop')}
            >
              <Icon name="home-outline" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
          )}

          {confirmation.buttons.canRetryPayment && (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.primary }]}
              onPress={retry}
            >
              <Icon name="refresh-outline" size={20} color={colors.primary} />
              <Text
                style={[styles.secondaryButtonText, { color: colors.primary }]}
              >
                Retry Payment
              </Text>
            </TouchableOpacity>
          )}

          {/* ✅ FIXED: Tracking button with Order ID */}
          {confirmation.buttons.canTrackOrder && (
            <TouchableOpacity
              style={[styles.fab, { backgroundColor: colors.primary }]}
              onPress={handleTrackOrder}
            >
              <MaterialIcon name="track-changes" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// HELPERS (Same as before)
// ============================================================

const lightColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  secondary: '#64748B',
  border: '#E2E8F0',
  primary: '#10B981',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

const darkColors = {
  background: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  secondary: '#94A3B8',
  border: '#334155',
  primary: '#34D399',
  success: '#34D399',
  error: '#F87171',
  warning: '#FBBF24',
};

const getStatusColors = (isDark: boolean, status: ConfirmationStatus) => {
  const base = isDark ? darkColors : lightColors;

  switch (status) {
    case ConfirmationStatus.SUCCESS:
      return {
        background: isDark ? '#064E3B' : '#ECFDF5',
        text: base.success,
        subtitle: isDark ? '#A7F3D0' : '#065F46',
        chip: isDark ? '#065F46' : '#D1FAE5',
      };
    case ConfirmationStatus.FAILED:
      return {
        background: isDark ? '#7F1D1D' : '#FEF2F2',
        text: base.error,
        subtitle: isDark ? '#FCA5A5' : '#991B1B',
        chip: isDark ? '#991B1B' : '#FEE2E2',
      };
    case ConfirmationStatus.PENDING:
      return {
        background: isDark ? '#78350F' : '#FFFBEB',
        text: base.warning,
        subtitle: isDark ? '#FCD34D' : '#92400E',
        chip: isDark ? '#92400E' : '#FEF3C7',
      };
    case ConfirmationStatus.EXPIRED:
      return {
        background: isDark ? '#1C1917' : '#F9FAFB',
        text: base.secondary,
        subtitle: isDark ? '#D1D5DB' : '#4B5563',
        chip: isDark ? '#374151' : '#F3F4F6',
      };
    default:
      return {
        background: base.background,
        text: base.text,
        subtitle: base.secondary,
        chip: base.border,
      };
  }
};

const getLottieSource = (status: ConfirmationStatus) => {
  switch (status) {
    case ConfirmationStatus.SUCCESS:
      return require('../../animations/lotties/Success.json');
    case ConfirmationStatus.FAILED:
      return require('../../animations/lotties/Failed.json');
    case ConfirmationStatus.PENDING:
      return require('../../animations/lotties/loading.json');
    case ConfirmationStatus.EXPIRED:
      return require('../../animations/lotties/no-data-found.json');
    default:
      return require('../../animations/lotties/loading.json');
  }
};

const getTitle = (status: ConfirmationStatus, isCOD: boolean): string => {
  if (isCOD && status === ConfirmationStatus.SUCCESS) {
    return 'Order Confirmed! 🎉';
  }
  switch (status) {
    case ConfirmationStatus.SUCCESS:
      return 'Payment Successful! 🎉';
    case ConfirmationStatus.FAILED:
      return 'Payment Failed';
    case ConfirmationStatus.PENDING:
      return 'Processing Payment...';
    case ConfirmationStatus.EXPIRED:
      return 'Session Expired';
    default:
      return 'Order Status';
  }
};

const getSubtitle = (
  status: ConfirmationStatus,
  confirmation: any,
  isCOD: boolean,
): string => {
  if (isCOD && status === ConfirmationStatus.SUCCESS) {
    return `Your order ${confirmation.orders.length > 1 ? 's have' : 'has'} been confirmed successfully. Please keep cash ready for delivery.`;
  }
  switch (status) {
    case ConfirmationStatus.SUCCESS:
      return `Your order ${confirmation.orders.length > 1 ? 's have' : 'has'} been confirmed successfully.`;
    case ConfirmationStatus.FAILED:
      return 'Your payment could not be processed. Please try again.';
    case ConfirmationStatus.PENDING:
      return 'Please wait while we confirm your payment.';
    case ConfirmationStatus.EXPIRED:
      return 'Your checkout session has expired. Please try again.';
    default:
      return 'Please check your order status.';
  }
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    minHeight: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
  },
  errorMessage: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  lottieContainer: {
    width: width * 0.4,
    height: width * 0.4,
    alignSelf: 'center',
    marginTop: 20,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  codSuccessMessage: {
    marginTop: 12,
    alignItems: 'center',
  },
  codSuccessText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  codSuccessSubText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  processingContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  ordersContainer: {
    marginTop: 16,
  },
  ordersTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  orderCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  orderPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#E5E7EB',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 24,
  },
  productImageFallback: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  productMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  trackOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 6,
  },
  trackOrderText: {
    fontSize: 13,
    fontWeight: '600',
  },
  buttonsContainer: {
    marginTop: 20,
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    width: '100%',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    width: '100%',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
