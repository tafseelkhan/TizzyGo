import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  memo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  StatusBar,
  Image,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { debounce } from 'lodash';

import { COLORS } from '../../../../api/constants/FWSLocalRideColor';
import { VEHICLE_CLASSES } from '../../../../api/constants/vehicleClasses';
import { GOOGLE_API_KEY } from '../../../../api/constants/mapConfig';
import {
  rideBooking,
  Location,
} from '../../../../api/features/private/rideBookingPrivateSlice';
import {
  RouteCoordinate,
  RideTypeGroup,
} from '../../../types/FWSLocalRideTypes';
import {
  decodePolyline,
  formatPrice,
  getFirstDriver,
  getRideTypeName,
  getRideTypeFare,
} from '../../../utils/cabs/FWSLocalRideHelperUtils';
import { SelectedRideTicket } from './SelectedRideTicket';
import { RideModal } from './RideModal';
import { AnimatedPressable } from './AnimatedPressable';
import AnimatedRoute from './AnimatedRoute';
import SocketLiveTracking from '../../../utils/socket/socketLiveTracking';
import {
  requestLocationPermission,
  fetchCurrentLocation,
} from '../../../utils/cabs/locationHelper';
import { RootStackParamList } from './RootStackParamList';

const { height, width } = Dimensions.get('window');

// ✅ VEHICLE TYPE IMAGES
const BIKE_MARKER_IMAGE = require('../../../../assets/map/driver-bike-marker.png');
const CAR_MARKER_IMAGE = require('../../../../assets/map/driver-car-marker.png');
const AUTO_MARKER_IMAGE = require('../../../../assets/map/driver-auto-marker.png');

type BookingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'FWSLocalRide'
>;
type BookingScreenRouteProp = RouteProp<RootStackParamList, 'FWSLocalRide'>;

const LIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#F6F6F8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#F6F6F8' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#3A3B44' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3A3B44' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8E8F99' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#E7EDE6' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#FFFFFF' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#E2E2E8' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{ color: '#FFFFFF' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#E1EAF2' }],
  },
];

// ✅ Get vehicle type image based on vehicleType string
const getVehicleMarkerImage = (vehicleType: string) => {
  const type = vehicleType?.toLowerCase() || '';
  if (type === 'bike' || type === 'motorcycle' || type === 'twowheeler') {
    return BIKE_MARKER_IMAGE;
  } else if (
    type === 'car' ||
    type === 'fourwheeler' ||
    type === 'suv' ||
    type === 'sedan'
  ) {
    return CAR_MARKER_IMAGE;
  } else if (
    type === 'auto' ||
    type === 'rickshaw' ||
    type === 'threewheeler'
  ) {
    return AUTO_MARKER_IMAGE;
  }
  // Default to car if unknown
  return CAR_MARKER_IMAGE;
};

// ✅ Get vehicle type label for display
const getVehicleTypeLabel = (vehicleType: string) => {
  const type = vehicleType?.toLowerCase() || '';
  if (type === 'bike' || type === 'motorcycle' || type === 'twowheeler') {
    return 'Bike';
  } else if (
    type === 'car' ||
    type === 'fourwheeler' ||
    type === 'suv' ||
    type === 'sedan'
  ) {
    return 'Car';
  } else if (
    type === 'auto' ||
    type === 'rickshaw' ||
    type === 'threewheeler'
  ) {
    return 'Auto';
  }
  return vehicleType || 'Car';
};

// ✅ OPTIMIZED: Memoized Driver Marker Component with vehicle type
const DriverMarker = memo(
  ({
    driver,
    liveLocation,
    isTrackingLive,
    vehicleType,
  }: {
    driver: any;
    liveLocation: any;
    isTrackingLive: boolean;
    vehicleType: string;
  }) => {
    const location = liveLocation || {
      latitude: driver?.latestLatitude ?? 0,
      longitude: driver?.latestLongitude ?? 0,
      heading: driver?.heading ?? 0,
    };

    const markerImage = getVehicleMarkerImage(vehicleType);
    const vehicleLabel = getVehicleTypeLabel(vehicleType);

    return (
      <Marker
        coordinate={{
          latitude: location.latitude,
          longitude: location.longitude,
        }}
        title={`${vehicleLabel} Driver`}
        description={`${driver?.driverCode ?? 'Driver'} • ${isTrackingLive ? '🟢 Live' : '📍 Initial'}`}
        anchor={{ x: 0.5, y: 0.5 }}
        rotation={location.heading ?? 0}
      >
        {isTrackingLive && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
        <Image
          source={markerImage}
          style={{ width: 40, height: 40, resizeMode: 'contain' }}
        />
      </Marker>
    );
  },
);

// ✅ OPTIMIZED: Memoized Drop Marker Component
const DropMarker = memo(({ drop }: { drop: Location | null }) => {
  if (!drop) return null;
  return (
    <Marker
      coordinate={{
        latitude: drop.latitude,
        longitude: drop.longitude,
      }}
      title="Drop"
      description={drop.address}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={styles.markerDrop}>
        <Icon name="flag" size={12} color={COLORS.white} />
      </View>
    </Marker>
  );
});

const BookingScreen: React.FC = () => {
  const navigation = useNavigation<BookingScreenNavigationProp>();
  const route = useRoute<BookingScreenRouteProp>();
  const insets = useSafeAreaInsets();

  const mapRef = useRef<MapView>(null);
  const bottomSheetAnim = useRef(new Animated.Value(height)).current;
  const isMounted = useRef(true);

  // ============================================================
  //  ✅ ROUTE COORDINATES STATE
  //  ============================================================
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>(
    [],
  );

  // ============================================================
  //  ✅ PROPS RECEIVE - MEMOIZED
  //  ============================================================
  const routeParams = useMemo(() => route?.params ?? {}, [route?.params]);

  const [pickup, setPickup] = useState<Location | null>(
    routeParams.pickup ?? null,
  );
  const [drop, setDrop] = useState<Location | null>(routeParams.drop ?? null);
  const [pickupText, setPickupText] = useState<string>(
    routeParams.pickupText ?? 'Pickup location',
  );
  const [dropText, setDropText] = useState<string>(
    routeParams.dropText ?? 'Where to?',
  );

  const initialRegion = useMemo(
    () => ({
      latitude: routeParams.pickup?.latitude ?? 28.6139,
      longitude: routeParams.pickup?.longitude ?? 77.209,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }),
    [routeParams.pickup],
  );

  // Ride States
  const [rideTypeGroups, setRideTypeGroups] = useState<RideTypeGroup[]>([]);
  const [selectedRideTypeGroup, setSelectedRideTypeGroup] =
    useState<RideTypeGroup | null>(null);
  const [isGettingOptions, setIsGettingOptions] = useState<boolean>(false);
  const [showRideModal, setShowRideModal] = useState<boolean>(false);
  const [activeClassTab, setActiveClassTab] = useState<string>('economy');
  const [searchStatus, setSearchStatus] = useState<any>(null);

  // UI States
  const [loading, setLoading] = useState<boolean>(false);
  const [showBottomSheet, setShowBottomSheet] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [bookingId, setBookingId] = useState<string | null>(null);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // Socket Tracking
  const [liveDriverLocation, setLiveDriverLocation] = useState<{
    latitude: number;
    longitude: number;
    heading: number;
    speed: number;
  } | null>(null);
  const [isTrackingLive, setIsTrackingLive] = useState<boolean>(false);
  const liveTracking = SocketLiveTracking;
  const lastLocationUpdate = useRef<number>(0);
  const MIN_LOCATION_UPDATE_INTERVAL = 2000;

  // ✅ Selected driver's vehicle type
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('Car');

  // ============================================================
  //  ✅ REVERSE GEOCODE
  //  ============================================================
  const reverseGeocodeFn = useCallback(
    async (latitude: number, longitude: number): Promise<string> => {
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`,
        );
        if (response.data.results && response.data.results.length > 0) {
          return response.data.results[0].formatted_address;
        }
        return '';
      } catch (error) {
        console.log('Reverse geocode error:', error);
        return '';
      }
    },
    [],
  );

  const reverseGeocode = useCallback(
    debounce(reverseGeocodeFn, 300, { leading: false, trailing: true }) as (
      latitude: number,
      longitude: number,
    ) => Promise<string>,
    [reverseGeocodeFn],
  );

  // ============================================================
  //  ✅ UPDATE ROUTE FUNCTION
  //  ============================================================
  const updateRoute = useCallback((coords: RouteCoordinate[]) => {
    if (coords.length < 2) {
      setRouteCoordinates([]);
      return;
    }
    setRouteCoordinates(coords);
  }, []);

  // ============================================================
  //  ✅ AUTO-FETCH RIDE OPTIONS ON MOUNT
  //  ============================================================
  useEffect(() => {
    console.log('🔵 [BookingScreen] Checking pickup & drop:', { pickup, drop });
    if (pickup && drop) {
      console.log(
        '✅ [BookingScreen] Both available, fetching ride options...',
      );
      const timer = setTimeout(() => {
        getRideOptions();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      console.log('⚠️ [BookingScreen] Pickup or Drop missing');
    }
  }, [pickup, drop]);

  // ✅ When selected ride type changes, update vehicle type
  useEffect(() => {
    if (selectedRideTypeGroup) {
      const firstDriver = getFirstDriver(selectedRideTypeGroup);
      if (firstDriver) {
        const vehicleType =
          firstDriver.vehicleType || firstDriver.vehicle || 'Car';
        setSelectedVehicleType(vehicleType);
        console.log('🚗 Selected vehicle type:', vehicleType);
      }
    }
  }, [selectedRideTypeGroup]);

  // ============================================================
  //  ✅ NAVIGATION FUNCTIONS
  //  ============================================================
  const openLocationInput = useCallback(() => {
    try {
      navigation.navigate('LocationInput', {
        pickupText,
        dropText,
        pickup: pickup ?? undefined,
        drop: drop ?? undefined,
      });
    } catch (error) {
      console.error('❌ Navigation error:', error);
      Alert.alert('Error', 'Unable to navigate to location input');
    }
  }, [navigation, pickupText, dropText, pickup, drop]);

  // ============================================================
  //  ✅ MAP FUNCTIONS
  //  ============================================================
  const onMapPress = useCallback(
    (event: any) => {
      const coordinate = event?.nativeEvent?.coordinate;

      if (
        !coordinate ||
        coordinate.latitude == null ||
        coordinate.longitude == null
      ) {
        return;
      }

      const { latitude, longitude } = coordinate;

      reverseGeocode(latitude, longitude)
        .then((address: string) => {
          if (!isMounted.current) return;

          const finalAddress = address || 'Selected Location';

          setSelectedLocation({
            latitude,
            longitude,
            address: finalAddress,
            googlePlaceId: '',
          });

          Animated.spring(bottomSheetAnim, {
            toValue: height * 0.35,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();

          setShowBottomSheet(true);
        })
        .catch(() => {
          if (!isMounted.current) return;
          setSelectedLocation({
            latitude,
            longitude,
            address: 'Selected Location',
            googlePlaceId: '',
          });

          Animated.spring(bottomSheetAnim, {
            toValue: height * 0.35,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();

          setShowBottomSheet(true);
        });
    },
    [reverseGeocode, bottomSheetAnim],
  );

  const confirmMapLocation = useCallback(
    async (type: 'pickup' | 'drop') => {
      if (!selectedLocation) return;

      const address = await reverseGeocode(
        selectedLocation.latitude,
        selectedLocation.longitude,
      );

      const locationData: Location = {
        ...selectedLocation,
        address: address || selectedLocation.address || 'Selected Location',
      };

      if (type === 'pickup') {
        setPickup(locationData);
        setPickupText(
          address || selectedLocation.address || 'Selected Location',
        );
        mapRef.current?.animateToRegion(
          {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          },
          500,
        );
      } else {
        setDrop(locationData);
        setDropText(address || selectedLocation.address || 'Selected Location');
        mapRef.current?.animateToRegion(
          {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          },
          500,
        );
      }

      Animated.spring(bottomSheetAnim, {
        toValue: height,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
      setShowBottomSheet(false);
      setSelectedLocation(null);
    },
    [selectedLocation, reverseGeocode, bottomSheetAnim],
  );

  // ============================================================
  //  ✅ RIDE OPTIONS
  //  ============================================================
  const getRideOptions = useCallback(async () => {
    if (!pickup || !drop) {
      console.log('⚠️ getRideOptions: pickup or drop missing');
      return;
    }
    console.log('🔵 getRideOptions called with:', { pickup, drop });
    setIsGettingOptions(true);
    try {
      const response = await rideBooking.getRideOptions(pickup, drop);
      console.log('🔵 getRideOptions response:', response);
      if (response.success && response.data) {
        const groups = response.data.options as unknown as RideTypeGroup[];
        setRideTypeGroups(groups);

        if (groups.length > 0 && groups[0].pickupToDropPolyline) {
          const decoded = decodePolyline(groups[0].pickupToDropPolyline);
          if (decoded.length >= 2) {
            updateRoute(decoded);
          }
        }

        if (groups.length > 0) {
          setSelectedRideTypeGroup(groups[0]);
          // Vehicle type will be set by the useEffect above
        }

        const allCoords = [
          ...routeCoordinates,
          pickup
            ? { latitude: pickup.latitude, longitude: pickup.longitude }
            : null,
          drop ? { latitude: drop.latitude, longitude: drop.longitude } : null,
        ].filter(Boolean) as RouteCoordinate[];

        if (allCoords.length > 0 && mapRef.current) {
          mapRef.current.fitToCoordinates(allCoords, {
            edgePadding: { top: 120, right: 60, bottom: 340, left: 60 },
            animated: true,
          });
        }
        if (groups.length > 0) setShowRideModal(true);
      } else {
        Alert.alert('Error', response.message || 'Failed to get ride options');
        setRideTypeGroups([]);
      }
    } catch (error) {
      console.error('Get ride options error:', error);
      Alert.alert('Error', 'Failed to get ride options.');
    } finally {
      setIsGettingOptions(false);
    }
  }, [pickup, drop, updateRoute, routeCoordinates]);

  // ============================================================
  //  ✅ BOOKING FUNCTIONS
  //  ============================================================
  const createBooking = useCallback(async () => {
    if (!pickup || !drop || !selectedRideTypeGroup) {
      Alert.alert('Error', 'Please select all required fields');
      return;
    }
    setLoading(true);
    setShowRideModal(false);
    try {
      const response = await rideBooking.createBooking(
        selectedRideTypeGroup.rideType,
        'ONLINE',
      );
      if (response.success && response.data) {
        setBookingId(response.data.bookingId);
        Alert.alert(
          '✅ Booking Created!',
          `Booking ID: ${response.data.bookingId}\nRide Type: ${selectedRideTypeGroup.rideType}\nFare: ₹${selectedRideTypeGroup.estimatedFare}`,
        );
        startPolling(response.data.bookingId);
        navigation.navigate('Tracking', { bookingId: response.data.bookingId });
      } else {
        Alert.alert('Error', response.message || 'Failed to create booking');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create booking.',
      );
    } finally {
      setLoading(false);
    }
  }, [pickup, drop, selectedRideTypeGroup, navigation]);

  const startPolling = useCallback((id: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await rideBooking.getSearchStatus(id);
        if (response.success && response.data) {
          setSearchStatus(response.data);
          const finalStates = ['accepted', 'no_driver_found', 'cancelled'];
          if (finalStates.includes(response.data.status)) {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000);
  }, []);

  const cancelBooking = useCallback(async () => {
    if (!bookingId) return;
    Alert.alert('Cancel Booking', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const response = await rideBooking.cancelBooking(
              bookingId,
              'User cancelled',
            );
            if (response.success) {
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              setBookingId(null);
              setSearchStatus(null);
              Alert.alert('Cancelled', 'Booking has been cancelled.');
            } else {
              Alert.alert('Error', response.message || 'Failed to cancel');
            }
          } catch (error) {
            console.error('Cancel error:', error);
            Alert.alert('Error', 'Failed to cancel.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }, [bookingId]);

  // ============================================================
  //  ✅ SOCKET LIVE TRACKING
  //  ============================================================
  const startLiveTracking = useCallback(
    async (driverId: string, rideId: string) => {
      try {
        const connected = await liveTracking.connect();
        if (!connected) {
          console.log('⚠️ [BookingScreen] Failed to connect socket');
          return;
        }

        const customerId = liveTracking.getUserId();
        if (!customerId) {
          console.log('⚠️ [BookingScreen] No customer ID found');
          return;
        }

        liveTracking.onLocation((data: any) => {
          const now = Date.now();
          if (now - lastLocationUpdate.current < MIN_LOCATION_UPDATE_INTERVAL) {
            return;
          }
          lastLocationUpdate.current = now;

          setLiveDriverLocation({
            latitude: data.latitude,
            longitude: data.longitude,
            heading: data.heading || 0,
            speed: data.speed || 0,
          });
        });

        liveTracking.onStatus((data: any) => {
          if (data.type === 'stopped') {
            setIsTrackingLive(false);
          } else if (data.type === 'success') {
            console.log('✅ [BookingScreen] Tracking started successfully');
          }
        });

        liveTracking.startTracking(customerId, driverId, rideId);
        setIsTrackingLive(true);
      } catch (error) {
        console.error(
          '❌ [BookingScreen] Failed to start live tracking:',
          error,
        );
      }
    },
    [liveTracking],
  );

  const stopLiveTracking = useCallback(() => {
    if (liveTracking.isTrackingActive()) {
      liveTracking.stopTracking();
      liveTracking.removeCallbacks();
      setIsTrackingLive(false);
      setLiveDriverLocation(null);
    }
  }, [liveTracking]);

  useEffect(() => {
    if (bookingId && selectedRideTypeGroup) {
      const firstDriver = selectedRideTypeGroup
        ? getFirstDriver(selectedRideTypeGroup)
        : null;
      if (firstDriver) {
        startLiveTracking(firstDriver.driverId, bookingId);
      }
    }

    return () => {
      stopLiveTracking();
      liveTracking.disconnect();
    };
  }, [
    bookingId,
    selectedRideTypeGroup,
    startLiveTracking,
    stopLiveTracking,
    liveTracking,
  ]);

  // ============================================================
  //  ✅ GROUP RIDE TYPES
  //  ============================================================
  const groupedRideTypes = useMemo(() => {
    const grouped: Record<string, RideTypeGroup[]> = {};
    VEHICLE_CLASSES.forEach(cls => {
      grouped[cls.id] = [];
    });
    rideTypeGroups.forEach(group => {
      const firstDriver = getFirstDriver(group);
      const vehicleClass =
        firstDriver?.vehicleClass?.toLowerCase() || 'economy';
      const classMap: Record<string, string> = {
        economy: 'economy',
        standard: 'standard',
        comfort: 'comfort',
        premium: 'premium',
        luxury: 'luxury',
      };
      const classKey = classMap[vehicleClass] || 'economy';
      if (grouped[classKey]) grouped[classKey].push(group);
      else grouped['economy'].push(group);
    });
    return grouped;
  }, [rideTypeGroups]);

  const classesWithItems = useMemo(
    () =>
      VEHICLE_CLASSES.filter(c => (groupedRideTypes[c.id] || []).length > 0),
    [groupedRideTypes],
  );

  // ============================================================
  //  ✅ GET DRIVER LOCATION
  //  ============================================================
  const getDriverLocation = useCallback(() => {
    if (liveDriverLocation) {
      return liveDriverLocation;
    }
    const firstDriver = selectedRideTypeGroup
      ? getFirstDriver(selectedRideTypeGroup)
      : null;
    if (firstDriver) {
      return {
        latitude: firstDriver.latestLatitude,
        longitude: firstDriver.latestLongitude,
        heading: firstDriver.heading || 0,
        speed: firstDriver.speed || 0,
      };
    }
    return null;
  }, [liveDriverLocation, selectedRideTypeGroup]);

  // ============================================================
  //  ✅ MY LOCATION BUTTON
  //  ============================================================
  const goToMyLocation = useCallback(async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Please enable location permission.');
        return;
      }

      const location = await fetchCurrentLocation();
      if (location && mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          },
          500,
        );
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get your location');
    }
  }, []);

  // ============================================================
  //  ✅ RENDER
  //  ============================================================
  const driver = selectedRideTypeGroup
    ? getFirstDriver(selectedRideTypeGroup)
    : null;

  // ✅ Get driver's vehicle type from selected ride
  const getDriverVehicleType = () => {
    if (driver) {
      return driver.vehicleType || driver.vehicle || 'Car';
    }
    return selectedVehicleType || 'Car';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={initialRegion}
          customMapStyle={LIGHT_MAP_STYLE}
          showsUserLocation={true}
          showsMyLocationButton={false}
          zoomEnabled={true}
          zoomControlEnabled={false}
          onPress={onMapPress}
          moveOnMarkerPress={false}
          scrollEnabled={true}
          zoomTapEnabled={true}
          pitchEnabled={false}
          rotateEnabled={false}
          loadingEnabled={false}
          minZoomLevel={10}
          maxZoomLevel={20}
          mapPadding={{ top: 80, right: 0, bottom: 200, left: 0 }}
          onMapReady={() => {
            console.log('Map ready');
          }}
        >
          {/* ✅ SIMPLE POLYLINE - NO FADE ANIMATION */}
          {routeCoordinates.length > 0 && (
            <AnimatedRoute
              coordinates={routeCoordinates}
              strokeWidth={5}
              color={COLORS.green}
              visible={true}
            />
          )}

          {/* ✅ DRIVER MARKER WITH VEHICLE TYPE IMAGE */}
          {driver && (
            <DriverMarker
              driver={driver}
              liveLocation={liveDriverLocation}
              isTrackingLive={isTrackingLive}
              vehicleType={getDriverVehicleType()}
            />
          )}

          <DropMarker drop={drop} />
        </MapView>

        <TouchableOpacity
          style={styles.changeLocationButton}
          onPress={openLocationInput}
          activeOpacity={0.8}
        >
          <Icon name="edit-location" size={18} color={COLORS.ink} />
          <Text style={styles.changeLocationText}>Change</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            try {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('CustomerCab');
              }
            } catch (error) {
              navigation.navigate('CustomerCab');
            }
          }}
          activeOpacity={0.8}
        >
          <Icon name="arrow-back" size={24} color={COLORS.ink} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={goToMyLocation}
          activeOpacity={0.8}
        >
          <Icon name="my-location" size={22} color={COLORS.ink} />
        </TouchableOpacity>
      </View>

      <View style={[styles.bottomSection, { paddingBottom: insets.bottom }]}>
        <View style={styles.rideContainer}>
          <View style={styles.rideHeader}>
            <Text style={styles.sectionTitle}>Your ride</Text>
            {isGettingOptions ? (
              <ActivityIndicator size="small" color={COLORS.ink} />
            ) : (
              <AnimatedPressable
                style={styles.viewAllButton}
                onPress={() => {
                  if (rideTypeGroups.length > 0) setShowRideModal(true);
                  else {
                    console.log(
                      '🔵 Refresh button pressed, calling getRideOptions',
                    );
                    getRideOptions();
                  }
                }}
                disabled={isGettingOptions}
                scaleTo={0.94}
              >
                <Text style={styles.viewAllText}>
                  {rideTypeGroups.length > 0
                    ? `All options (${rideTypeGroups.length})`
                    : 'Refresh'}
                </Text>
                <Icon
                  name={rideTypeGroups.length > 0 ? 'chevron-right' : 'refresh'}
                  size={15}
                  color={COLORS.ink}
                />
              </AnimatedPressable>
            )}
          </View>

          {rideTypeGroups.length === 0 &&
            !isGettingOptions &&
            pickup &&
            drop && (
              <View style={styles.noRidesContainer}>
                <MCIcon
                  name="car-off"
                  size={24}
                  color={COLORS.textMuted}
                  style={{ marginBottom: 6 }}
                />
                <Text style={styles.noRidesText}>
                  No ride types available for this route.
                </Text>
              </View>
            )}

          {selectedRideTypeGroup && !isGettingOptions && (
            <SelectedRideTicket
              group={selectedRideTypeGroup}
              pickup={pickup}
              drop={drop}
              onPress={() => setShowRideModal(true)}
            />
          )}
        </View>

        <AnimatedPressable
          style={[
            styles.bookButton,
            (!pickup ||
              !drop ||
              !selectedRideTypeGroup ||
              loading ||
              isGettingOptions) &&
              styles.bookButtonDisabled,
          ]}
          onPress={createBooking}
          disabled={
            !pickup ||
            !drop ||
            !selectedRideTypeGroup ||
            loading ||
            isGettingOptions
          }
          scaleTo={0.96}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <Text style={styles.bookButtonText}>
                {!pickup || !drop
                  ? 'Select locations to continue'
                  : isGettingOptions
                    ? 'Loading ride types…'
                    : selectedRideTypeGroup
                      ? `Book ${getRideTypeName(selectedRideTypeGroup)} · ${formatPrice(getRideTypeFare(selectedRideTypeGroup))}`
                      : 'Select a ride type'}
              </Text>
              {pickup && drop && selectedRideTypeGroup && !isGettingOptions && (
                <Icon name="arrow-forward" size={18} color={COLORS.white} />
              )}
            </>
          )}
        </AnimatedPressable>

        {bookingId && (
          <AnimatedPressable
            style={styles.cancelButton}
            onPress={cancelBooking}
            disabled={loading}
            scaleTo={0.96}
          >
            <Icon name="close" size={15} color={COLORS.danger} />
            <Text style={styles.cancelButtonText}>Cancel booking</Text>
          </AnimatedPressable>
        )}
      </View>

      <RideModal
        visible={showRideModal}
        onClose={() => setShowRideModal(false)}
        rideTypeGroups={rideTypeGroups}
        groupedRideTypes={groupedRideTypes}
        activeClassTab={activeClassTab}
        classesWithItems={classesWithItems}
        selectedRideTypeGroup={selectedRideTypeGroup}
        loading={loading}
        onTabChange={setActiveClassTab}
        onSelectGroup={group => {
          setSelectedRideTypeGroup(group);
          // ✅ Update vehicle type when user selects a ride
          const firstDriver = getFirstDriver(group);
          if (firstDriver) {
            const vehicleType =
              firstDriver.vehicleType || firstDriver.vehicle || 'Car';
            setSelectedVehicleType(vehicleType);
            console.log('🚗 Ride selected, vehicle type:', vehicleType);
          }
          if (group.pickupToDropPolyline) {
            const decoded = decodePolyline(group.pickupToDropPolyline);
            if (decoded.length >= 2) {
              updateRoute(decoded);
            }
          }
        }}
        onRouteUpdate={updateRoute}
        onBook={createBooking}
      />

      {showBottomSheet && selectedLocation && (
        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: bottomSheetAnim }] },
          ]}
        >
          <View style={styles.bottomSheetHandle}>
            <View style={styles.bottomSheetHandleBar} />
          </View>
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetHeaderIcon}>
                <Icon name="location-on" size={18} color={COLORS.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerEyebrow}>PIN DROPPED</Text>
                <Text style={styles.bottomSheetTitle}>Use this location</Text>
              </View>
            </View>
            <Text style={styles.bottomSheetAddress} numberOfLines={2}>
              {selectedLocation.address}
            </Text>
            <View style={styles.bottomSheetButtons}>
              <AnimatedPressable
                style={[
                  styles.bottomSheetButton,
                  styles.bottomSheetButtonPickup,
                ]}
                onPress={() => confirmMapLocation('pickup')}
                scaleTo={0.95}
              >
                <Icon name="my-location" size={15} color={COLORS.ink} />
                <Text style={styles.bottomSheetButtonText}>Set as pickup</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={[styles.bottomSheetButton, styles.bottomSheetButtonDrop]}
                onPress={() => confirmMapLocation('drop')}
                scaleTo={0.95}
              >
                <Icon name="flag" size={15} color={COLORS.white} />
                <Text
                  style={[
                    styles.bottomSheetButtonText,
                    { color: COLORS.white },
                  ]}
                >
                  Set as drop
                </Text>
              </AnimatedPressable>
            </View>
            <AnimatedPressable
              style={styles.bottomSheetCancel}
              onPress={() => {
                Animated.spring(bottomSheetAnim, {
                  toValue: height,
                  useNativeDriver: true,
                  tension: 65,
                  friction: 11,
                }).start();
                setShowBottomSheet(false);
                setSelectedLocation(null);
              }}
              scaleTo={0.95}
            >
              <Text style={styles.bottomSheetCancelText}>Cancel</Text>
            </AnimatedPressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: COLORS.bg,
  },
  map: {
    flex: 1,
  },
  changeLocationButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  changeLocationText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    zIndex: 5,
  },
  myLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
  },
  rideContainer: { padding: 16, flex: 1 },
  rideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
  viewAllButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontSize: 12.5, color: COLORS.ink, fontWeight: '600' },
  noRidesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  noRidesText: { fontSize: 12.5, color: COLORS.textMuted, textAlign: 'center' },
  bookButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.ink,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 17,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    gap: 8,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  bookButtonDisabled: {
    backgroundColor: COLORS.surfaceSunken,
    shadowOpacity: 0,
    elevation: 0,
  },
  bookButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.dangerMuted,
    gap: 6,
  },
  cancelButtonText: { color: COLORS.danger, fontSize: 13.5, fontWeight: '600' },
  markerDrop: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.ink,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.42,
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  bottomSheetHandle: { alignItems: 'center', paddingVertical: 10 },
  bottomSheetHandleBar: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
  },
  bottomSheetContent: { padding: 20, flex: 1 },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  bottomSheetHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheetTitle: { fontSize: 17, fontWeight: '700', color: COLORS.ink },
  bottomSheetAddress: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
    backgroundColor: COLORS.surfaceSunken,
    padding: 12,
    borderRadius: 12,
  },
  bottomSheetButtons: { flexDirection: 'row', gap: 10 },
  bottomSheetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 7,
  },
  bottomSheetButtonPickup: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSunken,
  },
  bottomSheetButtonDrop: {
    borderColor: COLORS.ink,
    backgroundColor: COLORS.ink,
  },
  bottomSheetButtonText: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
  bottomSheetCancel: { marginTop: 14, alignItems: 'center', padding: 10 },
  bottomSheetCancelText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  liveIndicator: {
    position: 'absolute',
    top: -20,
    backgroundColor: '#FF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
});

export default BookingScreen;
