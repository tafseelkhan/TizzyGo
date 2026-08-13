// ============================================================
// screens/OrderTrackingScreen.tsx - FIXED TEXT ERROR
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useOrderTracking } from '../../../../hooks/useOrderTracking';
import {
  getDisplayStatus,
  getStatusColor,
  getProgressPercentage,
  formatDistance,
  formatETA,
  getHolderIcon,
  getHolderColor,
} from '../../../../../api/features/private/orderTrackingPrivateSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TrackingMap } from './TrackingMap';
import { RouteHistoryEntry } from '../../../../../api/features/private/orderTrackingPrivateSlice';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ============================================================
// PREMIUM COLORS
// ============================================================

const COLORS = {
  background: '#F5F7FA',
  backgroundDark: '#0F172A',
  card: '#FFFFFF',
  cardDark: '#1E293B',
  text: '#0F172A',
  textDark: '#F1F5F9',
  secondary: '#64748B',
  secondaryDark: '#94A3B8',
  muted: '#94A3B8',
  mutedDark: '#64748B',
  primary: '#059669',
  primaryLight: '#D1FAE5',
  success: '#059669',
  successLight: '#D1FAE5',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  border: '#E2E8F0',
  borderDark: '#334155',
  rider: '#8B5CF6',
  riderLight: '#EDE9FE',
  fws: '#3B82F6',
  fwsLight: '#DBEAFE',
  seller: '#F59E0B',
  sellerLight: '#FEF3C7',
  shadow: '#0F172A',
  gradientStart: '#059669',
  gradientEnd: '#10B981',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// ============================================================
// COMPONENT
// ============================================================

export const OrderTrackingScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params as { orderId: string };
  const mapRef = useRef<any>(null);
  const [routeHistoryExpanded, setRouteHistoryExpanded] = useState(false);

  const {
    isLoading,
    error,
    trackingData,
    isConnected,
    isCompleted,
    isTrackingCreated,
    order,
    reconnect,
    reconnectAttempts,
  } = useOrderTracking(orderId);

  useEffect(() => {
    navigation.setOptions({
      title: 'Track Order',
      headerStyle: {
        backgroundColor: 'transparent',
        shadowColor: 'transparent',
      },
      headerShadowVisible: false,
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 18,
        color: '#FFFFFF',
      },
      headerTransparent: true,
    });
  }, [navigation]);

  // Toggle route history with animation
  const toggleRouteHistory = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRouteHistoryExpanded(!routeHistoryExpanded);
  };

  // ✅ Safe access to tracking data with null checks
  const tracking = trackingData?.tracking;
  const routeHistory = tracking?.routeHistory || [];
  const isRiderActive = tracking?.currentHolderType === 'RIDER';
  const riderName =
    trackingData?.riderName || tracking?.currentHolderName || null;
  const riderPhone = trackingData?.riderPhone || null;

  // Loading State
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading tracking details...</Text>
      </SafeAreaView>
    );
  }

  // Error State
  if (error && !error.includes('Tracking not found')) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <View style={styles.errorCard}>
          <Icon name="alert-circle-outline" size={64} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={reconnect}>
            <Text style={styles.retryButtonText}>
              Retry ({reconnectAttempts}/5)
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ PENDING SELLER ACCEPTANCE STATE
  if (!isTrackingCreated && trackingData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        {/* ✅ Gradient Header with SafeArea padding */}
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <View style={styles.safeAreaTop} />
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <Text style={styles.headerOrderId}>Order #{orderId}</Text>
              <View
                style={[
                  styles.headerStatusBadge,
                  { backgroundColor: 'rgba(255,255,255,0.2)' },
                ]}
              >
                <View style={styles.headerStatusDot} />
                <Text style={styles.headerStatusText}>Pending Acceptance</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Pending Card */}
          <View style={styles.pendingCard}>
            <View style={styles.pendingIconCircle}>
              <Icon name="clock-outline" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.pendingTitle}>Waiting for Seller</Text>
            <Text style={styles.pendingSubtitle}>
              Seller has not accepted your order yet.
            </Text>
            <Text style={styles.pendingSubtitle2}>
              Tracking will begin once seller accepts.
            </Text>
          </View>

          {/* Map */}
          <View style={styles.premiumCard}>
            <View style={styles.cardHeader}>
              <Icon name="map-marker" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Delivery Location</Text>
            </View>
            <TrackingMap
              ref={mapRef}
              sellerLocation={{
                address:
                  order?.sellerAddress?.address ||
                  trackingData?.sellerAddress?.address ||
                  '',
                latitude:
                  order?.sellerAddress?.latitude ||
                  trackingData?.sellerAddress?.latitude ||
                  0,
                longitude:
                  order?.sellerAddress?.longitude ||
                  trackingData?.sellerAddress?.longitude ||
                  0,
              }}
              buyerLocation={{
                address:
                  order?.shippingAddress?.address ||
                  trackingData?.buyerAddress?.address ||
                  '',
                latitude:
                  order?.shippingAddress?.latitude ||
                  trackingData?.buyerAddress?.latitude ||
                  0,
                longitude:
                  order?.shippingAddress?.longitude ||
                  trackingData?.buyerAddress?.longitude ||
                  0,
              }}
              riderLocation={undefined}
              isRiderActive={false}
            />
          </View>

          {/* Order Details */}
          <View style={styles.premiumCard}>
            <View style={styles.cardHeader}>
              <Icon name="shopping-bag" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Order Details</Text>
            </View>
            {[
              { label: 'Order ID', value: order?.orderId || orderId },
              { label: 'Product', value: order?.productTitle || 'N/A' },
              { label: 'Quantity', value: `× ${order?.quantity || 1}` },
              {
                label: 'Total Amount',
                value: `₹${order?.finalAmount || order?.totalAmount || 0}`,
                isPrice: true,
              },
              {
                label: 'Payment',
                value: order?.paymentStatus || 'Pending',
                isStatus: true,
              },
            ].map((item, index) => (
              <View key={index} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text
                  style={[
                    styles.detailValue,
                    item.isPrice && styles.priceText,
                    item.isStatus && {
                      color:
                        item.value === 'PAID' ? COLORS.success : COLORS.warning,
                    },
                  ]}
                >
                  {item.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Timeline */}
          <View style={styles.premiumCard}>
            <View style={styles.cardHeader}>
              <Icon name="timeline-clock" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Order Timeline</Text>
            </View>
            {trackingData?.timeline?.map((event, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineDot}>
                  <View
                    style={[
                      styles.timelineDotInner,
                      {
                        backgroundColor: event.isCompleted
                          ? COLORS.success
                          : event.isCurrent
                            ? COLORS.warning
                            : COLORS.muted,
                      },
                    ]}
                  />
                  {index < (trackingData?.timeline?.length || 0) - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStatus}>
                    {event.displayStatus || event.status}
                  </Text>
                  <Text style={styles.timelineTime}>
                    {new Date(event.timestamp).toLocaleString()}
                  </Text>
                  {event.note && (
                    <Text style={styles.timelineNote}>{event.note}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Addresses */}
          <View style={styles.premiumCard}>
            <View style={styles.cardHeader}>
              <Icon name="map-marker" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Delivery Address</Text>
            </View>
            <View style={styles.addressRow}>
              <Icon
                name="map-marker-outline"
                size={18}
                color={COLORS.secondary}
              />
              <Text style={styles.addressText}>
                {trackingData?.buyerAddress?.address ||
                  order?.shippingAddress?.address ||
                  'Address not available'}
              </Text>
            </View>
          </View>

          <View style={styles.premiumCard}>
            <View style={styles.cardHeader}>
              <Icon name="store" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Seller Address</Text>
            </View>
            <View style={styles.addressRow}>
              <Icon name="store-outline" size={18} color={COLORS.secondary} />
              <Text style={styles.addressText}>
                {trackingData?.sellerAddress?.address ||
                  order?.sellerAddress?.address ||
                  'Address not available'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ✅ TRACKING EXISTS - Full tracking UI
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={!isConnected}
            onRefresh={reconnect}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* ✅ Gradient Header with SafeArea padding */}
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <View style={styles.safeAreaTop} />
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <Text style={styles.headerOrderId}>Order #{orderId}</Text>
              <View
                style={[
                  styles.headerStatusBadge,
                  { backgroundColor: 'rgba(255,255,255,0.2)' },
                ]}
              >
                <View style={styles.headerStatusDot} />
                <Text style={styles.headerStatusText}>
                  {getDisplayStatus(trackingData?.currentStatus || '')}
                </Text>
              </View>
            </View>
            <View style={styles.headerBottom}>
              <View style={styles.headerConnection}>
                <View
                  style={[
                    styles.headerConnectionDot,
                    {
                      backgroundColor: isConnected ? '#86EFAC' : '#FCA5A5',
                    },
                  ]}
                />
                <Text style={styles.headerConnectionText}>
                  {isConnected ? '● Live Tracking' : '○ Reconnecting...'}
                </Text>
              </View>
              {riderName && (
                <View style={styles.headerRider}>
                  <Icon name="motorbike" size={18} color="#FFFFFF" />
                  <Text style={styles.headerRiderText}>{riderName}</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Live Badge on Map */}
        <View style={styles.premiumCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Icon name="map-marker-radius" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Live Location</Text>
            </View>
            {isRiderActive && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
          <TrackingMap
            ref={mapRef}
            sellerLocation={{
              address:
                order?.sellerAddress?.address ||
                trackingData?.sellerAddress?.address ||
                '',
              latitude:
                order?.sellerAddress?.latitude ||
                trackingData?.sellerAddress?.latitude ||
                0,
              longitude:
                order?.sellerAddress?.longitude ||
                trackingData?.sellerAddress?.longitude ||
                0,
            }}
            buyerLocation={{
              address:
                order?.shippingAddress?.address ||
                trackingData?.buyerAddress?.address ||
                '',
              latitude:
                order?.shippingAddress?.latitude ||
                trackingData?.buyerAddress?.latitude ||
                0,
              longitude:
                order?.shippingAddress?.longitude ||
                trackingData?.buyerAddress?.longitude ||
                0,
            }}
            riderLocation={trackingData?.riderLocation || undefined}
            isRiderActive={isRiderActive}
            distance={trackingData?.distance ?? undefined}
            eta={trackingData?.eta ?? undefined}
          />
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Delivery Progress</Text>
            <Text style={styles.progressPercent}>
              {getProgressPercentage(trackingData?.currentStatus || '')}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${getProgressPercentage(trackingData?.currentStatus || '')}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statsCard, { flex: 1 }]}>
            <Icon name="map-marker-distance" size={24} color={COLORS.primary} />
            <Text style={styles.statsLabel}>Distance</Text>
            <Text style={styles.statsValue}>
              {formatDistance(trackingData?.distance ?? undefined)}
            </Text>
          </View>
          <View style={[styles.statsCard, { flex: 1, marginLeft: SPACING.md }]}>
            <Icon name="clock-outline" size={24} color={COLORS.primary} />
            <Text style={styles.statsLabel}>ETA</Text>
            <Text style={styles.statsValue}>
              {formatETA(trackingData?.eta ?? undefined)}
            </Text>
          </View>
          <View style={[styles.statsCard, { flex: 1, marginLeft: SPACING.md }]}>
            <Icon
              name={isCompleted ? 'check-circle' : 'progress-clock'}
              size={24}
              color={COLORS.primary}
            />
            <Text style={styles.statsLabel}>Status</Text>
            <Text
              style={[
                styles.statsValue,
                { color: isCompleted ? COLORS.success : COLORS.primary },
              ]}
            >
              {isCompleted ? 'Delivered' : 'In Progress'}
            </Text>
          </View>
        </View>

        {/* Contact Rider */}
        {riderPhone ? (
          <TouchableOpacity style={styles.contactRiderCard}>
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.contactRiderGradient}
            >
              <Icon name="phone" size={20} color="#FFFFFF" />
              <Text style={styles.contactRiderText}>
                Contact Rider: {riderPhone}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : null}

        {/* Product Details */}
        <View style={styles.premiumCard}>
          <View style={styles.cardHeader}>
            <Icon name="package-variant" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Product Details</Text>
          </View>
          <View style={styles.productRow}>
            <Text style={styles.productTitle}>
              {order?.productTitle || trackingData?.product?.title || 'Product'}
            </Text>
            <Text style={styles.productQty}>
              × {order?.quantity || trackingData?.quantity || 1}
            </Text>
          </View>
          <Text style={styles.productPrice}>
            ₹
            {order?.finalAmount ||
              order?.totalAmount ||
              trackingData?.totalAmount ||
              0}
          </Text>
          <View style={styles.productMetaRow}>
            <View style={styles.productMetaItem}>
              <Icon name="credit-card" size={14} color={COLORS.secondary} />
              <Text style={styles.productMetaText}>
                {order?.paymentStatus ||
                  trackingData?.paymentStatus ||
                  'Pending'}
              </Text>
            </View>
            {trackingData?.variant && (
              <View style={styles.productMetaItem}>
                <Icon name="shape" size={14} color={COLORS.secondary} />
                <Text style={styles.productMetaText}>
                  {typeof trackingData.variant === 'string'
                    ? trackingData.variant
                    : trackingData.variant.name ||
                      JSON.stringify(trackingData.variant)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.premiumCard}>
          <View style={styles.cardHeader}>
            <Icon name="timeline-check" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Order Timeline</Text>
          </View>
          {trackingData?.timeline?.map((event, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineDot}>
                <View
                  style={[
                    styles.timelineDotInner,
                    {
                      backgroundColor: event.isCompleted
                        ? COLORS.success
                        : event.isCurrent
                          ? COLORS.primary
                          : COLORS.muted,
                    },
                  ]}
                />
                {index < (trackingData?.timeline?.length || 0) - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineStatus}>
                  {event.displayStatus || event.status}
                </Text>
                {event.holderName && (
                  <Text style={styles.timelineHolder}>
                    <Icon
                      name={getHolderIcon(event.holderType)}
                      size={12}
                      color={getHolderColor(event.holderType)}
                    />{' '}
                    {event.holderType}: {event.holderName}
                  </Text>
                )}
                <Text style={styles.timelineTime}>
                  {new Date(event.timestamp).toLocaleString()}
                </Text>
                {event.note && (
                  <Text style={styles.timelineNote}>{event.note}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Route History - Expandable */}
        {routeHistory.length > 0 && (
          <View style={styles.premiumCard}>
            <TouchableOpacity
              onPress={toggleRouteHistory}
              style={styles.expandableHeader}
              activeOpacity={0.7}
            >
              <View style={styles.expandableHeaderLeft}>
                <Icon name="history" size={20} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Parcel Journey</Text>
              </View>
              <View style={styles.expandableHeaderRight}>
                <Text style={styles.routeCount}>
                  {routeHistory.length} stops
                </Text>
                <Icon
                  name={routeHistoryExpanded ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color={COLORS.secondary}
                />
              </View>
            </TouchableOpacity>

            {routeHistoryExpanded && (
              <View style={styles.routeHistoryContainer}>
                {routeHistory.map((route: RouteHistoryEntry, index: number) => (
                  <View key={route.scanId || index} style={styles.routeItem}>
                    <View style={styles.routeIndex}>
                      <View
                        style={[
                          styles.routeDot,
                          {
                            backgroundColor: getHolderColor(
                              route.toHolderType || route.fromHolderType,
                            ),
                          },
                        ]}
                      />
                      {index < routeHistory.length - 1 && (
                        <View style={styles.routeLine} />
                      )}
                    </View>
                    <View style={styles.routeContent}>
                      <View style={styles.routeHeader}>
                        <Text style={styles.routeStep}>Step {index + 1}</Text>
                        <View style={styles.routeScanTypeBadge}>
                          <Text style={styles.routeScanType}>
                            {route.scanType || 'TRANSFER'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.routeTransfer}>
                        <View style={styles.routeHolder}>
                          <Icon
                            name={getHolderIcon(route.fromHolderType)}
                            size={14}
                            color={getHolderColor(route.fromHolderType)}
                          />
                          <Text style={styles.routeHolderText}>
                            {route.fromHolderName || route.fromHolderType}
                          </Text>
                        </View>
                        <Icon
                          name="arrow-right"
                          size={16}
                          color={COLORS.muted}
                        />
                        <View style={styles.routeHolder}>
                          <Icon
                            name={getHolderIcon(route.toHolderType)}
                            size={14}
                            color={getHolderColor(route.toHolderType)}
                          />
                          <Text style={styles.routeHolderText}>
                            {route.toHolderName || route.toHolderType}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.routeTime}>
                        {new Date(
                          route.transferredAt || new Date(),
                        ).toLocaleString()}
                      </Text>
                      {route.scannedByName && (
                        <Text style={styles.routeScannedBy}>
                          Scanned by: {route.scannedByName}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Addresses */}
        <View style={styles.premiumCard}>
          <View style={styles.cardHeader}>
            <Icon name="map-marker" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Delivery Address</Text>
          </View>
          <View style={styles.addressRow}>
            <Icon
              name="map-marker-outline"
              size={18}
              color={COLORS.secondary}
            />
            <Text style={styles.addressText}>
              {trackingData?.buyerAddress?.address ||
                order?.shippingAddress?.address ||
                'Address not available'}
            </Text>
          </View>
        </View>

        <View style={styles.premiumCard}>
          <View style={styles.cardHeader}>
            <Icon name="store" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Seller Address</Text>
          </View>
          <View style={styles.addressRow}>
            <Icon name="store-outline" size={18} color={COLORS.secondary} />
            <Text style={styles.addressText}>
              {trackingData?.sellerAddress?.address ||
                order?.sellerAddress?.address ||
                'Address not available'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================
// PREMIUM STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },

  // ✅ SAFE AREA TOP
  safeAreaTop: {
    height: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 32,
  },

  // Loading
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.secondary,
    fontWeight: '500',
  },

  // Error
  errorCard: {
    alignItems: 'center',
    padding: SPACING.xxxl,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  errorText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.danger,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxxl,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Gradient Header
  gradientHeader: {
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: {
    gap: SPACING.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerOrderId: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    gap: SPACING.xs,
  },
  headerStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  headerStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerConnection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerConnectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerConnectionText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  headerRider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerRiderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  premiumCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },

  pendingCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    padding: SPACING.xxxl,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  pendingIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  pendingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  pendingSubtitle: {
    fontSize: 15,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  pendingSubtitle2: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },

  progressCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.secondary,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  statsCard: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statsLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },

  contactRiderCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  contactRiderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  contactRiderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },
  productQty: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  productMetaRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginTop: SPACING.sm,
  },
  productMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  productMetaText: {
    fontSize: 13,
    color: COLORS.secondary,
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.danger,
    letterSpacing: 0.5,
  },

  timelineItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  timelineDot: {
    alignItems: 'center',
    marginRight: SPACING.md,
    width: 20,
  },
  timelineDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  timelineHolder: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
  },
  timelineTime: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  timelineNote: {
    fontSize: 12,
    color: COLORS.secondary,
    fontStyle: 'italic',
    marginTop: 2,
  },

  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandableHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  expandableHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  routeCount: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  routeHistoryContainer: {
    marginTop: SPACING.md,
  },
  routeItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  routeIndex: {
    alignItems: 'center',
    marginRight: SPACING.md,
    width: 20,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  routeLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  routeContent: {
    flex: 1,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeStep: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  routeScanTypeBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  routeScanType: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },
  routeTransfer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 4,
  },
  routeHolder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  routeHolderText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  routeTime: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 2,
  },
  routeScannedBy: {
    fontSize: 10,
    color: COLORS.secondary,
    marginTop: 2,
    fontStyle: 'italic',
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },

  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    flex: 1,
  },
});

export default OrderTrackingScreen;
