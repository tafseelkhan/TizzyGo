// screens/cabs/common/RideSearchScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  StatusBar,
  Modal,
  FlatList,
  ScrollView,
  PanResponder,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { RootStackParamList } from '../RootStackParamList';
import { COLORS } from '../../../../../api/constants/FWSAirport';
import { rideBooking } from '../../../../../api/features/private/rideBookingPrivateSlice';
import { AnimatedPressable } from '../AnimatedPressable';
import { decodePolyline } from '../../../../utils/cabs/common/polylineUtils';
import {
  connectSocket,
  onEvent,
  offEvent,
  emitEvent,
  onRideSearchStarted,
  onBatchCompleted,
  onDriverAccepted,
  onNoDriverFound,
  onDriverTimeout,
  onRideStatusChange,
  onFareUpdated,
  onRetryStarted,
  onAuthSuccess,
  onAuthError,
  onSocketError,
} from '../../../../utils/socket/socketRideSearching';

const { height, width } = Dimensions.get('window');

const CARD_COLLAPSED_EXTRA = 0;
const CARD_EXPANDED_EXTRA = 210;
const DRAG_ACTIVATION_DISTANCE = 6;

type RideSearchScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'RideSearch'
>;
type RideSearchScreenRouteProp = RouteProp<
  { RideSearch: RootStackParamList['RideSearch'] & { polyline?: string } },
  'RideSearch'
>;

interface EventLog {
  id: string;
  timestamp: string;
  event: string;
  message: string;
  icon: string;
  color: string;
  rawData?: any;
}

interface LogDetailData {
  event: string;
  message: string;
  timestamp: string;
  details: { label: string; value: string }[];
}

const RideSearchScreen: React.FC = () => {
  const navigation = useNavigation<RideSearchScreenNavigationProp>();
  const route = useRoute<RideSearchScreenRouteProp>();
  const insets = useSafeAreaInsets();

  const {
    bookingId,
    pickup,
    drop,
    fare,
    rideType,
    customerId,
    polyline: initialPolyline,
  } = route.params || {};

  const mapRef = useRef<MapView>(null);
  const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPolling = useRef<boolean>(true);

  // States
  const [searchStatus, setSearchStatus] = useState<string>('searching');
  const [currentBatch, setCurrentBatch] = useState<number>(0);
  const [searchRadius, setSearchRadius] = useState<number>(5);
  const [driversFound, setDriversFound] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Looking for nearby drivers...',
  );
  const [currentFare, setCurrentFare] = useState<number>(fare || 0);
  const [originalFare, setOriginalFare] = useState<number>(fare || 0);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Polyline state
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);

  // History/Event Log states
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogDetailData | null>(null);
  const [showLogDetail, setShowLogDetail] = useState<boolean>(false);

  // Bottom-sheet drag state
  const [sheetExpanded, setSheetExpanded] = useState<boolean>(false);
  const sheetProgress = useRef(new Animated.Value(0)).current;
  const dragStartProgress = useRef(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // =====================================================
  // ✅ PULSE ANIMATION
  // =====================================================

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    if (searchStatus === 'searching') {
      loop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => loop.stop();
  }, [searchStatus]);

  // =====================================================
  // ✅ BOTTOM SHEET DRAG
  // =====================================================

  const snapTo = (expand: boolean) => {
    setSheetExpanded(expand);
    Animated.spring(sheetProgress, {
      toValue: expand ? 1 : 0,
      useNativeDriver: false,
      bounciness: 4,
      speed: 14,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dy) > DRAG_ACTIVATION_DISTANCE,
      onPanResponderGrant: () => {
        dragStartProgress.current = sheetExpanded ? 1 : 0;
        sheetProgress.stopAnimation();
      },
      onPanResponderMove: (_evt, gesture) => {
        const delta = -gesture.dy / CARD_EXPANDED_EXTRA;
        let next = dragStartProgress.current + delta;
        if (next < 0) next = 0;
        if (next > 1) next = 1;
        sheetProgress.setValue(next);
      },
      onPanResponderRelease: (_evt, gesture) => {
        const delta = -gesture.dy / CARD_EXPANDED_EXTRA;
        const projected = dragStartProgress.current + delta;
        snapTo(projected > 0.5);
      },
    }),
  ).current;

  const extraContentHeight = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [CARD_COLLAPSED_EXTRA, CARD_EXPANDED_EXTRA],
  });
  const extraContentOpacity = sheetProgress.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
  });
  const grabberRotation = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // =====================================================
  // ✅ DECODE POLYLINE
  // =====================================================

  useEffect(() => {
    if (initialPolyline) {
      console.log('🗺️ [FRONTEND] Decoding polyline...');
      const decoded = decodePolyline(initialPolyline);
      setRouteCoordinates(decoded);
      console.log(`🗺️ [FRONTEND] Polyline decoded: ${decoded.length} points`);

      if (decoded.length > 0 && mapRef.current) {
        const coordinates = decoded.map((p: any) => ({
          latitude: p.latitude,
          longitude: p.longitude,
        }));
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: {
            top: insets.top + 80,
            right: 60,
            bottom: 320,
            left: 60,
          },
          animated: true,
        });
      }
    }
  }, [initialPolyline]);

  // =====================================================
  // ✅ EVENT LOG HELPER
  // =====================================================

  const addEventLog = (
    event: string,
    message: string,
    icon: string,
    color: string,
    rawData?: any,
  ) => {
    const newLog: EventLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      event,
      message,
      icon,
      color,
      rawData,
    };
    setEventLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  // =====================================================
  // ✅ SOCKET EVENT HANDLERS
  // =====================================================

  const handleAuthSuccess = (data: any) => {
    console.log('🔐 [FRONTEND] Auth success:', data);
    addEventLog(
      'auth_success',
      'Authentication successful',
      'verified',
      COLORS.green,
      data,
    );
  };

  const handleAuthError = (data: any) => {
    console.log('❌ [FRONTEND] Auth error:', data);
    addEventLog(
      'auth_error',
      'Authentication failed',
      'error',
      COLORS.danger,
      data,
    );
  };

  const handleSocketError = (data: any) => {
    console.log('❌ [FRONTEND] Socket error:', data);
    addEventLog(
      'socket_error',
      data.message || 'Socket error',
      'error',
      COLORS.danger,
      data,
    );
  };

  const handleSearchStarted = (data: any) => {
    console.log('🚀 [FRONTEND] Search started:', data);
    setStatusMessage(data.message || 'Searching for drivers...');
    setSearchStatus('searching');
    setIsLoading(false);
    addEventLog(
      'search_started',
      data.message || 'Search started',
      'search',
      COLORS.green,
      data,
    );
  };

  const handleBatchCompleted = (data: any) => {
    console.log('📦 [FRONTEND] Batch completed:', data);
    setCurrentBatch(data.batchNumber || 0);
    setSearchRadius(data.searchRadius || 5);
    setDriversFound(data.driversFound || 0);
    setStatusMessage(
      data.message || `Searching within ${data.searchRadius || 5} km`,
    );
    setIsLoading(false);
    addEventLog(
      'batch_completed',
      `Batch ${data.batchNumber}: ${data.driversFound} drivers found`,
      'group-work',
      COLORS.green,
      data,
    );
  };

  const handleDriverAccepted = (data: any) => {
    console.log('✅ [FRONTEND] Driver accepted:', data);
    setSearchStatus('accepted');
    setStatusMessage('Driver found! Redirecting...');
    stopPolling();
    addEventLog(
      'driver_accepted',
      'Driver accepted your ride!',
      'check-circle',
      COLORS.green,
      data,
    );
    setTimeout(() => {
      navigation.navigate('Tracking', {
        bookingId: data.bookingId || bookingId,
      });
    }, 1000);
  };

  const handleNoDriverFound = (data: any) => {
    console.log('❌ [FRONTEND] No driver found:', data);
    setSearchStatus('no_driver_found');
    setStatusMessage('No drivers available');
    setIsLoading(false);
    setIsRetrying(false);
    stopPolling();

    if (data.fare) setCurrentFare(data.fare);
    if (data.originalFare) setOriginalFare(data.originalFare);

    addEventLog(
      'no_driver',
      'No drivers found. Tap Retry to try again.',
      'error',
      COLORS.danger,
      data,
    );
  };

  const handleDriverTimeout = (data: any) => {
    console.log('⏰ [FRONTEND] Driver timeout:', data);
    setStatusMessage('Driver did not respond, searching more...');
    addEventLog(
      'driver_timeout',
      `Driver ${data.driverId} did not respond`,
      'timer-off',
      COLORS.warning,
      data,
    );
  };

  const handleRideStatusChange = (data: any) => {
    console.log('📊 [FRONTEND] Status change:', data);
    if (data.status === 'accepted') {
      setSearchStatus('accepted');
      setStatusMessage('Driver is on the way!');
      stopPolling();
      addEventLog(
        'status_change',
        `Ride ${data.status}`,
        'info',
        COLORS.green,
        data,
      );
    }
  };

  const handleFareUpdated = (data: any) => {
    console.log('💰 [FRONTEND] Fare updated:', data);
    setCurrentFare(data.fare || currentFare);
    setStatusMessage(`Fare updated: ₹${data.fare}`);
    addEventLog(
      'fare_updated',
      `Fare updated: ₹${data.fare} (was ₹${data.oldFare})`,
      'payments',
      COLORS.warning,
      data,
    );
  };

  // ✅ ONLY retryCount increment from socket
  const handleRetryStarted = (data: any) => {
    console.log('🔄 [FRONTEND] Retry started:', data);
    setSearchStatus('searching');
    setStatusMessage(data.message || 'Retrying with increased fare');
    setIsLoading(false);
    setIsRetrying(false);

    // ✅ ✅ ✅ ONLY PLACE where retryCount increments
    setRetryCount(prev => prev + 1);

    if (data.newFare) setCurrentFare(data.newFare);
    if (data.originalFare) setOriginalFare(data.originalFare);

    addEventLog(
      'retry_started',
      `Retry #${retryCount + 1}: Fare increased to ₹${data.newFare}`,
      'refresh',
      COLORS.green,
      data,
    );
    startPolling();
  };

  // =====================================================
  // ✅ SOCKET + POLLING SETUP
  // =====================================================

  useEffect(() => {
    let isMounted = true;

    const initSocket = async () => {
      try {
        const socket = await connectSocket();
        if (!isMounted) return;

        console.log('✅ [FRONTEND] Socket connected, ID:', socket.id);

        if (customerId) {
          console.log('📤 [FRONTEND] Authenticating...');
          emitEvent('authenticate', {
            userId: customerId,
            userType: 'customer',
          });
        }

        console.log('📡 [FRONTEND] Registering events...');
        onAuthSuccess(handleAuthSuccess);
        onAuthError(handleAuthError);
        onSocketError(handleSocketError);
        onRideSearchStarted(handleSearchStarted);
        onBatchCompleted(handleBatchCompleted);
        onDriverAccepted(handleDriverAccepted);
        onNoDriverFound(handleNoDriverFound);
        onDriverTimeout(handleDriverTimeout);
        onRideStatusChange(handleRideStatusChange);
        onFareUpdated(handleFareUpdated);
        onRetryStarted(handleRetryStarted);

        if (bookingId) {
          console.log(`📤 [FRONTEND] Joining room: ${bookingId}`);
          emitEvent('join-booking-room', { bookingId });
          setTimeout(() => {
            emitEvent('join-booking-room', { bookingId });
          }, 1000);
        }

        console.log('✅ [FRONTEND] Socket setup complete');
      } catch (error) {
        console.error('❌ [FRONTEND] Socket init error:', error);
      }
    };

    initSocket();
    startPolling();

    return () => {
      isMounted = false;
      stopPolling();
      console.log('🧹 [FRONTEND] Cleaning up...');

      offEvent('auth-success');
      offEvent('auth-error');
      offEvent('error');
      offEvent('ride-search-started');
      offEvent('batch-completed');
      offEvent('driver-accepted');
      offEvent('no-driver-found');
      offEvent('driver-timeout');
      offEvent('ride-status-change');
      offEvent('fare-updated');
      offEvent('retry-started');

      if (bookingId) {
        emitEvent('leave-booking-room', { bookingId });
      }
    };
  }, []);

  // =====================================================
  // ✅ POLLING CONTROL
  // =====================================================

  const startPolling = () => {
    if (pollingInterval.current) clearInterval(pollingInterval.current);
    isPolling.current = true;
    pollingInterval.current = setInterval(fetchSearchStatus, 3000);
    console.log('🔄 [FRONTEND] Polling started');
  };

  const stopPolling = () => {
    isPolling.current = false;
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
      console.log('🛑 [FRONTEND] Polling stopped');
    }
  };

  // =====================================================
  // ✅ FALLBACK: Polling API - NO retryCount update
  // =====================================================

  const fetchSearchStatus = async () => {
    if (!isPolling.current) return;
    try {
      const response = await rideBooking.getSearchStatus(bookingId);
      if (response.success && response.data) {
        const data = response.data;
        setSearchStatus(data.status);
        setCurrentBatch(data.currentBatch || 0);
        setSearchRadius(data.searchRadius || 5);
        setDriversFound(data.driversFound || 0);
        setElapsedSeconds(data.elapsedSeconds || 0);
        if (data.fare) setCurrentFare(data.fare);
        if (data.originalFare) setOriginalFare(data.originalFare);

        // ✅ ✅ ✅ REMOVED - retryCount only from socket
        // setRetryCount(data.retryAttempts || 0);  // ❌ REMOVED

        if (data.status === 'accepted') {
          stopPolling();
          navigation.navigate('Tracking', { bookingId });
        }
        if (data.status === 'no_driver_found') {
          stopPolling();
          setIsLoading(false);
        }
        if (data.status === 'cancelled') {
          stopPolling();
          navigation.goBack();
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching search status:', error);
    }
  };

  // =====================================================
  // ✅ ACTIONS
  // =====================================================

  const retrySearch = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    setIsLoading(true);
    setSearchStatus('searching');
    setStatusMessage('Retrying with increased fare...');

    try {
      const response = await rideBooking.retrySearch(bookingId);
      if (response.success) {
        console.log('✅ [FRONTEND] Retry successful');
      } else {
        Alert.alert('Error', response.message || 'Failed to retry');
        setIsLoading(false);
        setIsRetrying(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to retry search');
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  const cancelSearch = async () => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setIsLoading(true);
          stopPolling();
          try {
            const response = await rideBooking.cancelBooking(bookingId);
            if (response.success) {
              addEventLog(
                'cancelled',
                'Booking cancelled by user',
                'cancel',
                COLORS.danger,
                { bookingId },
              );
              navigation.goBack();
            } else {
              Alert.alert('Error', response.message || 'Failed to cancel');
              setIsLoading(false);
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to cancel');
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const getStatusColor = () => {
    switch (searchStatus) {
      case 'searching':
        return COLORS.green;
      case 'accepted':
        return COLORS.green;
      case 'no_driver_found':
        return COLORS.danger;
      case 'cancelled':
        return COLORS.danger;
      default:
        return COLORS.ink;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // =====================================================
  // ✅ LOG DETAIL
  // =====================================================

  const handleLogPress = (log: EventLog) => {
    console.log('📋 [FRONTEND] Selected log:', log);

    const details: { label: string; value: string }[] = [];

    if (log.rawData) {
      const raw = log.rawData;

      if (log.event === 'retry_started') {
        if (raw.oldFare)
          details.push({ label: 'Old Fare', value: `₹${raw.oldFare}` });
        if (raw.newFare)
          details.push({ label: 'New Fare', value: `₹${raw.newFare}` });
        if (raw.incrementPercentage)
          details.push({
            label: 'Increase',
            value: `${raw.incrementPercentage}%`,
          });
        if (raw.retryAttempts)
          details.push({
            label: 'Retry Attempt',
            value: `#${raw.retryAttempts}`,
          });
        if (raw.batchStartedFrom)
          details.push({
            label: 'Batch From',
            value: `Batch ${raw.batchStartedFrom}`,
          });
      } else if (log.event === 'batch_completed') {
        if (raw.batchNumber)
          details.push({ label: 'Batch', value: `#${raw.batchNumber}` });
        if (raw.driversFound !== undefined)
          details.push({
            label: 'Drivers Found',
            value: `${raw.driversFound}`,
          });
        if (raw.searchRadius)
          details.push({ label: 'Radius', value: `${raw.searchRadius} km` });
      } else if (log.event === 'no_driver') {
        if (raw.fare) details.push({ label: 'Fare', value: `₹${raw.fare}` });
        if (raw.driversFound !== undefined)
          details.push({
            label: 'Drivers Found',
            value: `${raw.driversFound}`,
          });
        if (raw.batchesCompleted)
          details.push({
            label: 'Batches Completed',
            value: `${raw.batchesCompleted}`,
          });
      } else if (log.event === 'fare_updated') {
        if (raw.fare)
          details.push({ label: 'New Fare', value: `₹${raw.fare}` });
        if (raw.oldFare)
          details.push({ label: 'Old Fare', value: `₹${raw.oldFare}` });
        if (raw.incrementPercentage)
          details.push({
            label: 'Increase',
            value: `${raw.incrementPercentage}%`,
          });
      } else if (log.event === 'driver_accepted') {
        if (raw.driverId)
          details.push({
            label: 'Driver ID',
            value: raw.driverId.substring(0, 12) + '...',
          });
        if (raw.bookingId)
          details.push({ label: 'Booking', value: raw.bookingId });
      } else if (log.event === 'search_started') {
        if (raw.fare) details.push({ label: 'Fare', value: `₹${raw.fare}` });
        if (raw.maxBatches)
          details.push({ label: 'Max Batches', value: `${raw.maxBatches}` });
      }
    }

    if (details.length === 0) {
      details.push({ label: 'Event', value: log.event });
      details.push({ label: 'Message', value: log.message });
    }

    setSelectedLog({
      event: log.event,
      message: log.message,
      timestamp: log.timestamp,
      details,
    });
    setShowLogDetail(true);
  };

  const renderLogDetail = () => {
    if (!selectedLog) return null;

    return (
      <Modal
        visible={showLogDetail}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLogDetail(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.detailModalContent]}>
            <View style={styles.detailHeader}>
              <TouchableOpacity
                style={styles.backButtonDetail}
                onPress={() => setShowLogDetail(false)}
                activeOpacity={0.7}
              >
                <Icon name="arrow-back" size={24} color={COLORS.ink} />
              </TouchableOpacity>
              <Text style={styles.detailTitle}>Log Details</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              style={styles.detailScrollView}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.detailLogHeader}>
                <View
                  style={[
                    styles.detailIcon,
                    { backgroundColor: 'transparent' },
                  ]}
                >
                  <Icon name="info" size={24} color={COLORS.ink} />
                </View>
                <View style={styles.detailLogInfo}>
                  <Text style={styles.detailLogEvent}>{selectedLog.event}</Text>
                  <Text style={styles.detailLogTime}>
                    {selectedLog.timestamp}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Message</Text>
                <View style={styles.detailMessageBox}>
                  <Text style={styles.detailMessageText}>
                    {selectedLog.message}
                  </Text>
                </View>
              </View>

              {selectedLog.details.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Details</Text>
                  <View style={styles.detailDataBox}>
                    {selectedLog.details.map((item, index) => (
                      <View key={index} style={styles.detailDataRow}>
                        <Text style={styles.detailDataKey}>{item.label}</Text>
                        <Text style={styles.detailDataValue}>{item.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // =====================================================
  // ✅ RENDER
  // =====================================================

  const recentLogs = eventLogs.slice(0, 3);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: pickup?.latitude || 28.6139,
            longitude: pickup?.longitude || 77.209,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          showsUserLocation
          zoomEnabled
          zoomControlEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
          userLocationPriority="high"
          userLocationUpdateInterval={5000}
          userLocationFastestInterval={3000}
          showsMyLocationButton={false}
        >
          {drop && (
            <Marker
              coordinate={{
                latitude: drop.latitude,
                longitude: drop.longitude,
              }}
              title="Drop"
            >
              <View style={styles.dropMarkerRing}>
                <View style={styles.dropMarker}>
                  <Icon name="flag" size={16} color={COLORS.white} />
                </View>
              </View>
            </Marker>
          )}

          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={COLORS.green}
              strokeWidth={5}
              geodesic
              lineJoin="round"
              lineCap="round"
            />
          )}
        </MapView>

        <View
          style={[styles.topScrim, { height: insets.top + 56 }]}
          pointerEvents="none"
        />
      </View>

      {/* Top controls */}
      <View style={[styles.topBar, { top: insets.top + 10 }]}>
        <AnimatedPressable
          style={styles.circleButton}
          onPress={cancelSearch}
          scaleTo={0.9}
        >
          <Icon name="arrow-back" size={22} color={COLORS.ink} />
        </AnimatedPressable>

        <AnimatedPressable
          style={styles.circleButton}
          onPress={() => setShowHistory(true)}
          scaleTo={0.9}
        >
          <Icon name="history" size={20} color={COLORS.ink} />
          {eventLogs.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {eventLogs.length > 9 ? '9+' : eventLogs.length}
              </Text>
            </View>
          )}
        </AnimatedPressable>
      </View>

      {/* Bottom Sheet */}
      <View
        style={[styles.card, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <View style={styles.grabberZone} {...panResponder.panHandlers}>
          <Animated.View
            style={[
              styles.grabber,
              { transform: [{ rotate: grabberRotation }] },
            ]}
          />
        </View>

        <View style={styles.cardTopRow}>
          <Animated.View
            style={[
              styles.pulseContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View
              style={[styles.pulseDot, { backgroundColor: getStatusColor() }]}
            />
          </Animated.View>

          <View style={styles.statusContainer}>
            <Text style={styles.statusTitle}>{statusMessage}</Text>
            {searchStatus === 'searching' && (
              <Text style={styles.statusSubtitle}>
                Searching within{' '}
                <Text style={styles.highlight}>{searchRadius} km</Text>
                {retryCount > 0 && (
                  <Text style={styles.retryBadge}> · Retry #{retryCount}</Text>
                )}
              </Text>
            )}
            {searchStatus === 'no_driver_found' && (
              <Text style={[styles.statusSubtitle, { color: COLORS.danger }]}>
                No drivers found nearby
              </Text>
            )}
          </View>

          {isLoading && <ActivityIndicator size="small" color={COLORS.green} />}
        </View>

        {(searchStatus === 'searching' ||
          searchStatus === 'no_driver_found') && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{driversFound}</Text>
              <Text style={styles.statLabel}>Drivers Found</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(elapsedSeconds)}</Text>
              <Text style={styles.statLabel}>Searching</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statValue,
                  currentFare !== originalFare && styles.fareUpdated,
                ]}
              >
                ₹{currentFare}
              </Text>
              {currentFare !== originalFare && (
                <Text style={styles.fareOld}>₹{originalFare}</Text>
              )}
              <Text style={styles.statLabel}>Fare</Text>
            </View>
          </View>
        )}

        {searchStatus === 'searching' && (
          <AnimatedPressable
            style={styles.cancelButton}
            onPress={cancelSearch}
            scaleTo={0.96}
          >
            <Icon name="close" size={16} color={COLORS.danger} />
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </AnimatedPressable>
        )}

        {/* ============================================================ */}
        {/* ✅ FIXED: No-driver actions — stacked hero Retry + ghost Cancel */}
        {/* No more side-by-side flex/gap fight → no overlap, no squeeze */}
        {/* ============================================================ */}
        {searchStatus === 'no_driver_found' && (
          <View style={styles.noDriverActions}>
            <AnimatedPressable
              style={[
                styles.retryHeroButton,
                isRetrying && styles.retryButtonDisabled,
              ]}
              onPress={retrySearch}
              disabled={isRetrying}
              scaleTo={0.97}
            >
              {isRetrying ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <View style={styles.retryHeroContent}>
                  <View style={styles.retryHeroIconWrap}>
                    <Icon name="refresh" size={20} color={COLORS.white} />
                  </View>
                  <View style={styles.retryHeroTextWrap}>
                    <Text style={styles.retryHeroTitle}>
                      Search Again For Emergency
                    </Text>
                    <Text style={styles.retryHeroSubtitle}>
                      More radius · ₹{Math.round(currentFare * 1.15)}
                    </Text>
                  </View>
                  <Icon name="arrow-forward" size={20} color={COLORS.white} />
                </View>
              )}
            </AnimatedPressable>

            <AnimatedPressable
              style={styles.cancelGhostButton}
              onPress={cancelSearch}
              scaleTo={0.97}
            >
              <Icon name="close" size={16} color={COLORS.danger} />
              <Text style={styles.cancelGhostText}>Cancel Booking</Text>
            </AnimatedPressable>
          </View>
        )}

        {/* Extra content */}
        <Animated.View
          style={[
            styles.extraContent,
            { height: extraContentHeight, opacity: extraContentOpacity },
          ]}
        >
          <View style={styles.extraDivider} />
          <Text style={styles.extraTitle}>Recent Activity</Text>
          {recentLogs.length === 0 ? (
            <Text style={styles.extraEmpty}>Nothing logged yet</Text>
          ) : (
            recentLogs.map(log => (
              <TouchableOpacity
                key={log.id}
                style={styles.extraLogRow}
                onPress={() => handleLogPress(log)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.extraLogIcon,
                    { backgroundColor: log.color + '20' },
                  ]}
                >
                  <Icon name={log.icon} size={14} color={log.color} />
                </View>
                <Text style={styles.extraLogText} numberOfLines={1}>
                  {log.message}
                </Text>
                <Text style={styles.extraLogTime}>{log.timestamp}</Text>
                <Icon name="chevron-right" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))
          )}
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => setShowHistory(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View full activity log</Text>
            <Icon name="chevron-right" size={16} color={COLORS.green} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        transparent
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Activity Log</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowHistory(false)}
              >
                <Icon name="close" size={24} color={COLORS.ink} />
              </TouchableOpacity>
            </View>

            {eventLogs.length === 0 ? (
              <View style={styles.emptyLogs}>
                <Icon name="receipt-long" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyLogsText}>No events yet</Text>
                <Text style={styles.emptyLogsSubText}>
                  Waiting for search to start...
                </Text>
              </View>
            ) : (
              <FlatList
                data={eventLogs}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.logItem}
                    onPress={() => handleLogPress(item)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.logIcon,
                        { backgroundColor: item.color + '20' },
                      ]}
                    >
                      <Icon name={item.icon} size={20} color={item.color} />
                    </View>
                    <View style={styles.logContent}>
                      <Text style={styles.logMessage}>{item.message}</Text>
                      <Text style={styles.logTime}>{item.timestamp}</Text>
                    </View>
                    <Icon
                      name="chevron-right"
                      size={20}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.logsList}
              />
            )}
          </View>
        </View>
      </Modal>

      {renderLogDetail()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  mapContainer: { ...StyleSheet.absoluteFill },
  map: { flex: 1 },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0)',
  },

  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },

  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  grabberZone: { width: '100%', alignItems: 'center', paddingVertical: 10 },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.hairline,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  pulseContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(22, 196, 127, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  pulseDot: { width: 16, height: 16, borderRadius: 8 },
  statusContainer: { flex: 1 },
  statusTitle: { fontSize: 17, fontWeight: '700', color: COLORS.ink },
  statusSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 3 },
  highlight: { fontWeight: '700', color: COLORS.green },
  retryBadge: { fontWeight: '700', color: COLORS.warning },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
    marginBottom: 16,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: COLORS.ink },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.hairline },

  cancelButton: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: COLORS.dangerMuted,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  cancelButtonText: { fontSize: 15, fontWeight: '700', color: COLORS.danger },

  // ============================================================
  // ✅ NEW: no-driver-found actions — stacked, full-width, no overlap
  // ============================================================
  noDriverActions: {
    width: '100%',
  },
  retryHeroButton: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: COLORS.green,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  retryButtonDisabled: { opacity: 0.6 },
  retryHeroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  retryHeroIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  retryHeroTextWrap: { flex: 1 },
  retryHeroTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  retryHeroSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  cancelGhostButton: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    marginTop: 10,
  },
  cancelGhostText: { fontSize: 14, fontWeight: '700', color: COLORS.danger },

  extraContent: { overflow: 'hidden', width: '100%' },
  extraDivider: {
    height: 1,
    backgroundColor: COLORS.hairline,
    marginBottom: 12,
    marginTop: 4,
  },
  extraTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  extraEmpty: { fontSize: 13, color: COLORS.textMuted },
  extraLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  extraLogIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraLogText: { flex: 1, fontSize: 13, color: COLORS.ink },
  extraLogTime: { fontSize: 11, color: COLORS.textMuted },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
    paddingVertical: 6,
  },
  viewAllText: { fontSize: 13, fontWeight: '700', color: COLORS.green },

  dropMarkerRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropMarker: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.ink,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  fareUpdated: { color: COLORS.green },
  fareOld: {
    fontSize: 10,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.75,
    minHeight: height * 0.4,
    paddingBottom: 20,
  },
  detailModalContent: { maxHeight: height * 0.85, minHeight: height * 0.5 },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
  },
  backButtonDetail: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: { fontSize: 17, fontWeight: '600', color: COLORS.ink },
  detailScrollView: { paddingHorizontal: 16, paddingBottom: 20 },
  detailLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
    marginBottom: 16,
  },
  detailIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLogInfo: { marginLeft: 14, flex: 1 },
  detailLogEvent: { fontSize: 16, fontWeight: '700', color: COLORS.ink },
  detailLogTime: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  detailSection: { marginBottom: 16 },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink,
    marginBottom: 8,
  },
  detailMessageBox: {
    backgroundColor: COLORS.surfaceSunken,
    borderRadius: 12,
    padding: 14,
  },
  detailMessageText: { fontSize: 14, color: COLORS.ink, lineHeight: 20 },
  detailDataBox: {
    backgroundColor: COLORS.surfaceSunken,
    borderRadius: 12,
    padding: 14,
  },
  detailDataRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.hairline,
  },
  detailDataKey: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    minWidth: 100,
  },
  detailDataValue: {
    fontSize: 13,
    color: COLORS.ink,
    flex: 1,
    flexWrap: 'wrap',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.ink },
  modalCloseButton: { padding: 4 },
  logsList: { paddingHorizontal: 16, paddingBottom: 20 },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
  },
  logIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logContent: { flex: 1 },
  logMessage: { fontSize: 14, color: COLORS.ink, fontWeight: '500' },
  logTime: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  emptyLogs: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyLogsText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 12,
  },
  emptyLogsSubText: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
});

export default RideSearchScreen;
