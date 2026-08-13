import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  Dimensions,
  Animated,
  Easing,
  FlatList,
  StatusBar,
  Keyboard,
  Modal,
  ScrollView,
} from 'react-native';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
} from 'react-native-maps';
import GetLocation from 'react-native-get-location';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GOOGLE_API_KEY } from '../../../../api/constants/mapConfig';
import {
  rideBooking,
  VehicleOption,
  Location,
} from '../../../../api/features/private/rideBookingPrivateSlice';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const { height, width } = Dimensions.get('window');

// ============================================================
//  DESIGN TOKENS
// ============================================================
const COLORS = {
  bg: '#FFFFFF',
  canvas: '#F6F6F8',
  surface: '#FBFBFC',
  surfaceSunken: '#F0F0F3',
  border: '#E7E7EC',
  borderStrong: '#D8D8E0',
  hairline: '#EDEDF2',

  ink: '#0E0F14',
  inkSoft: '#2B2D36',

  green: '#12B76A',
  greenDark: '#0E9C5A',
  greenMuted: 'rgba(18, 183, 106, 0.10)',
  greenSoft: 'rgba(18, 183, 106, 0.18)',

  textPrimary: '#0E0F14',
  textSecondary: '#6C6E7B',
  textMuted: '#A0A2AD',
  white: '#FFFFFF',

  danger: '#E5432E',
  dangerMuted: 'rgba(229, 67, 46, 0.08)',
};

// ============================================================
//  LIGHT MAP STYLE
// ============================================================
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

// ============================================================
//  TYPES
// ============================================================
interface Suggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  latitude: number;
  longitude: number;
}

interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

// ============================================================
//  VEHICLE CLASS CONFIG
// ============================================================
const VEHICLE_CLASSES = [
  {
    id: 'economy',
    label: 'Economy',
    shortLabel: 'ECO',
    description: 'Budget-friendly rides for everyday travel',
    icon: 'car-hatchback',
    order: 0,
  },
  {
    id: 'standard',
    label: 'Standard',
    shortLabel: 'STD',
    description: 'Reliable rides for daily commute',
    icon: 'car',
    order: 1,
  },
  {
    id: 'comfort',
    label: 'Comfort',
    shortLabel: 'CMF',
    description: 'Extra space and premium comfort',
    icon: 'car-estate',
    order: 2,
  },
  {
    id: 'premium',
    label: 'Premium',
    shortLabel: 'PRM',
    description: 'Luxury vehicles with premium service',
    icon: 'car-sports',
    order: 3,
  },
  {
    id: 'luxury',
    label: 'Luxury',
    shortLabel: 'LUX',
    description: 'Ultimate luxury experience',
    icon: 'crown',
    order: 4,
  },
];

const getRideIcon = (code: string): string => {
  const icons: Record<string, string> = {
    go: 'car',
    basic: 'car',
    lite: 'moped',
    mini: 'car-hatchback',
    easy: 'car-side',
    move: 'car-side',
    smart: 'car',
    core: 'car',
    plus: 'car-estate',
    gox: 'car-estate',
    pro: 'car-sports',
    prime: 'car-convertible',
    ultra: 'car-sports',
    comfort: 'car-estate',
    premium: 'car-convertible',
    luxury: 'crown',
    elite: 'crown',
    one: 'car',
  };
  return icons[code] || 'car';
};

// ============================================================
//  DECODE POLYLINE
// ============================================================
const decodePolyline = (encoded: string): RouteCoordinate[] => {
  if (!encoded) return [];
  const points: RouteCoordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let b: number;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
};

// ============================================================
//  FORMATTERS
// ============================================================
const formatDuration = (minutes: number): string => {
  if (!minutes) return '0 min';
  const rounded = Math.round(minutes);
  return `${rounded} min`;
};

const formatDistance = (km: number): string => {
  if (!km) return '0 km';
  return `${km.toFixed(1)} km`;
};

const formatPrice = (price: number): string => {
  if (!price) return '₹0';
  return `₹${Math.round(price)}`;
};

// ============================================================
//  ANIMATED PRESSABLE
// ============================================================
const AnimatedPressable: React.FC<{
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
  scaleTo?: number;
  children: React.ReactNode;
}> = ({ onPress, disabled, style, scaleTo = 0.95, children }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 60,
      bounciness: 4,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      disabled={disabled}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ============================================================
//  PULSE RING
// ============================================================
const PulseRing: React.FC<{ color: string; size: number }> = ({
  color,
  size,
}) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.4],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
};

// ============================================================
//  MAIN COMPONENT
// ============================================================
const BookingScreen: React.FC = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  // ========== REFS ==========
  const mapRef = useRef<MapView>(null);
  const pickupInputRef = useRef<TextInput>(null);
  const dropInputRef = useRef<TextInput>(null);
  const bottomSheetAnim = useRef(new Animated.Value(height)).current;
  const routeDrawAnim = useRef(new Animated.Value(0)).current;

  // ========== STATES ==========
  const [pickup, setPickup] = useState<Location | null>(null);
  const [drop, setDrop] = useState<Location | null>(null);
  const [pickupText, setPickupText] = useState<string>('');
  const [dropText, setDropText] = useState<string>('');
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingLocation, setFetchingLocation] = useState<boolean>(true);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchType, setSearchType] = useState<'pickup' | 'drop'>('pickup');
  const [focusedField, setFocusedField] = useState<'pickup' | 'drop' | null>(
    null,
  );
  const [showBottomSheet, setShowBottomSheet] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [isGettingOptions, setIsGettingOptions] = useState<boolean>(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [searchStatus, setSearchStatus] = useState<any>(null);
  const [pollingInterval, setPollingInterval] = useState<ReturnType<
    typeof setInterval
  > | null>(null);
  const [showRideModal, setShowRideModal] = useState<boolean>(false);
  const [activeClassTab, setActiveClassTab] = useState<string>('economy');
  const [expandedDescription, setExpandedDescription] = useState<string | null>(
    null,
  );

  // ========== ROUTE STATES ==========
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>(
    [],
  );
  const [driverRouteCoordinates, setDriverRouteCoordinates] = useState<
    RouteCoordinate[]
  >([]);
  const [displayedRoute, setDisplayedRoute] = useState<RouteCoordinate[]>([]);
  const [isDrawingRoute, setIsDrawingRoute] = useState<boolean>(false);

  const [region, setRegion] = useState<Region>({
    latitude: 28.6139,
    longitude: 77.209,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  // ========== LIFECYCLE ==========
  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (pickup && drop) {
      getRideOptions();
    }
  }, [pickup, drop]);

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // ========== ANIMATE THE ROUTE DRAWING IN ==========
  useEffect(() => {
    if (routeCoordinates.length < 2) {
      setDisplayedRoute(routeCoordinates);
      return;
    }

    setIsDrawingRoute(true);
    routeDrawAnim.setValue(0);

    const listenerId = routeDrawAnim.addListener(({ value }) => {
      const count = Math.max(
        2,
        Math.round(value * (routeCoordinates.length - 1)) + 1,
      );
      setDisplayedRoute(routeCoordinates.slice(0, count));
    });

    Animated.timing(routeDrawAnim, {
      toValue: 1,
      duration: 950,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => setIsDrawingRoute(false));

    return () => {
      routeDrawAnim.removeListener(listenerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCoordinates]);

  // ========== PERMISSIONS ==========
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'App needs access to your location to find nearby rides.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentUserLocation();
        } else {
          setFetchingLocation(false);
          Alert.alert(
            'Permission Denied',
            'Please enable location permission to use this feature.',
          );
        }
      } catch (err) {
        console.warn(err);
        setFetchingLocation(false);
      }
    } else {
      getCurrentUserLocation();
    }
  };

  // ========== GET CURRENT LOCATION ==========
  const getCurrentUserLocation = () => {
    setFetchingLocation(true);

    GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    })
      .then((location: { latitude: number; longitude: number }) => {
        const { latitude, longitude } = location;
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });

        reverseGeocode(latitude, longitude)
          .then((address: string) => {
            const pickupLocation: Location = {
              latitude,
              longitude,
              address: address || 'Current Location',
              googlePlaceId: '',
            };
            setPickup(pickupLocation);
            setPickupText(address || 'Current Location');
            setFetchingLocation(false);
          })
          .catch(() => {
            const pickupLocation: Location = {
              latitude,
              longitude,
              address: 'Current Location',
              googlePlaceId: '',
            };
            setPickup(pickupLocation);
            setPickupText('Current Location');
            setFetchingLocation(false);
          });
      })
      .catch((error: Error) => {
        console.log('Error getting location:', error);
        setFetchingLocation(false);
        Alert.alert(
          'Location Error',
          'Unable to get your location. Please enter manually.',
        );
      });
  };

  // ========== REVERSE GEOCODE ==========
  const reverseGeocode = async (
    latitude: number,
    longitude: number,
  ): Promise<string> => {
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
  };

  // ========== SEARCH LOCATIONS ==========
  const searchLocations = async (text: string) => {
    if (!text || text.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          text,
        )}&key=${GOOGLE_API_KEY}&components=country:in`,
      );

      if (response.data.predictions) {
        const formattedSuggestions: Suggestion[] =
          response.data.predictions.map((pred: any) => ({
            placeId: pred.place_id,
            description: pred.description,
            mainText: pred.structured_formatting?.main_text || '',
            secondaryText: pred.structured_formatting?.secondary_text || '',
            latitude: 0,
            longitude: 0,
          }));
        setSuggestions(formattedSuggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.log('Search error:', error);
    }
  };

  // ========== SELECT SUGGESTION ==========
  const selectSuggestion = async (suggestion: Suggestion) => {
    setShowSuggestions(false);
    setSuggestions([]);

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.placeId}&key=${GOOGLE_API_KEY}`,
      );

      const place = response.data.result;
      const location = place.geometry?.location;

      if (location) {
        const lat = location.lat;
        const lng = location.lng;
        const address = place.formatted_address || suggestion.description;

        const locationData: Location = {
          latitude: lat,
          longitude: lng,
          address: address,
          googlePlaceId: suggestion.placeId,
        };

        if (searchType === 'pickup') {
          setPickup(locationData);
          setPickupText(address);
          Keyboard.dismiss();
          pickupInputRef.current?.blur();
          mapRef.current?.animateToRegion(
            {
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            },
            500,
          );
          setRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          });
        } else {
          setDrop(locationData);
          setDropText(address);
          Keyboard.dismiss();
          dropInputRef.current?.blur();
          mapRef.current?.animateToRegion(
            {
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            },
            500,
          );
          setRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          });
        }
      }
    } catch (error) {
      console.log('Place details error:', error);
      Alert.alert('Error', 'Failed to get location details. Please try again.');
    }
  };

  // ========== CLOSE SUGGESTIONS ==========
  const closeSuggestions = () => {
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // ========== MAP PRESS - SELECT LOCATION ON MAP ==========
  const onMapPress = (event: any) => {
    if (showSuggestions) {
      closeSuggestions();
      return;
    }

    if (
      pickupInputRef.current?.isFocused() ||
      dropInputRef.current?.isFocused()
    ) {
      return;
    }

    const { coordinate } = event.nativeEvent;
    const { latitude, longitude } = coordinate;

    reverseGeocode(latitude, longitude)
      .then(address => {
        setSelectedLocation({
          latitude,
          longitude,
          address: address || 'Selected Location',
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
  };

  // ========== CONFIRM MAP LOCATION ==========
  const confirmMapLocation = async (type: 'pickup' | 'drop') => {
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
      setPickupText(address || selectedLocation.address || 'Selected Location');
      mapRef.current?.animateToRegion(
        {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        500,
      );
      setRegion({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      });
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
      setRegion({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      });
    }

    Animated.spring(bottomSheetAnim, {
      toValue: height,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
    setShowBottomSheet(false);
    setSelectedLocation(null);
  };

  // ========== GET RIDE OPTIONS ==========
  const getRideOptions = async () => {
    if (!pickup || !drop) return;

    setIsGettingOptions(true);
    try {
      const response = await rideBooking.getRideOptions(pickup, drop);

      if (response.success && response.data) {
        const options = response.data.options;
        setVehicles(options);

        const route = (response.data as any).route;
        if (route?.encodedPolyline) {
          const decoded = decodePolyline(route.encodedPolyline);
          if (decoded.length >= 2) {
            setRouteCoordinates(decoded);
          } else {
            setRouteCoordinates([]);
          }
        } else {
          setRouteCoordinates([]);
        }

        const firstDriver = options[0];
        if (firstDriver?.driverOption?.driverToPickupPolyline) {
          const decoded = decodePolyline(
            firstDriver.driverOption.driverToPickupPolyline,
          );
          if (decoded.length >= 2) {
            setDriverRouteCoordinates(decoded);
          } else {
            setDriverRouteCoordinates([]);
          }
        } else {
          setDriverRouteCoordinates([]);
        }

        if (options.length > 0) {
          const fastest = options.find(
            (opt: any) => opt.fastestRideType !== undefined,
          );
          setSelectedVehicle(fastest || options[0]);
        }

        const firstClass = options[0]?.vehicleClass?.toLowerCase();
        if (firstClass) {
          setActiveClassTab(firstClass);
        }

        const allCoords = [
          ...routeCoordinates,
          ...driverRouteCoordinates,
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

        if (options.length > 0) {
          setShowRideModal(true);
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to get ride options');
        setVehicles([]);
      }
    } catch (error) {
      console.error('Get ride options error:', error);
      Alert.alert('Error', 'Failed to get ride options. Please try again.');
    } finally {
      setIsGettingOptions(false);
    }
  };

  // ========== CREATE BOOKING ==========
  const createBooking = async () => {
    if (!pickup) {
      Alert.alert('Error', 'Please select a pickup location');
      return;
    }

    if (!drop) {
      Alert.alert('Error', 'Please select a drop location');
      return;
    }

    if (!selectedVehicle) {
      Alert.alert('Error', 'Please select a ride type');
      return;
    }

    setLoading(true);
    setShowRideModal(false);

    try {
      const response = await rideBooking.createBooking(
        selectedVehicle.quoteId,
        'ONLINE',
      );

      if (response.success && response.data) {
        setBookingId(response.data.bookingId);

        Alert.alert(
          '✅ Booking Created!',
          `Booking ID: ${response.data.bookingId}\nRide Type: ${getRideTypeName(selectedVehicle)}\nFare: ₹${response.data.fare}`,
        );

        startPolling(response.data.bookingId);
        navigation.navigate('Tracking', {
          bookingId: response.data.bookingId,
        });
      } else {
        Alert.alert('Error', response.message || 'Failed to create booking');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'Failed to create booking. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // ========== START POLLING ==========
  const startPolling = (id: string) => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const interval = setInterval(async () => {
      try {
        const response = await rideBooking.getSearchStatus(id);

        if (response.success && response.data) {
          setSearchStatus(response.data);

          const finalStates = ['accepted', 'no_driver_found', 'cancelled'];
          if (finalStates.includes(response.data.status)) {
            clearInterval(interval);
            setPollingInterval(null);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000);

    setPollingInterval(interval);
  };

  // ========== CANCEL BOOKING ==========
  const cancelBooking = async () => {
    if (!bookingId) return;

    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
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
                if (pollingInterval) {
                  clearInterval(pollingInterval);
                  setPollingInterval(null);
                }
                setBookingId(null);
                setSearchStatus(null);
                Alert.alert('Cancelled', 'Booking has been cancelled.');
              } else {
                Alert.alert('Error', response.message || 'Failed to cancel');
              }
            } catch (error) {
              console.error('Cancel error:', error);
              Alert.alert('Error', 'Failed to cancel. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  // ========== SWAP LOCATIONS ==========
  const swapLocations = () => {
    if (pickup && drop) {
      const temp = pickup;
      setPickup(drop);
      setDrop(temp);
      setPickupText(drop.address);
      setDropText(temp.address);
    }
  };

  // ========== CLEAR PICKUP ==========
  const clearPickup = () => {
    setPickupText('');
    setPickup(null);
    setRouteCoordinates([]);
    setDisplayedRoute([]);
    setDriverRouteCoordinates([]);
    setVehicles([]);
    setSelectedVehicle(null);
  };

  // ========== CLEAR DROP ==========
  const clearDrop = () => {
    setDropText('');
    setDrop(null);
    setRouteCoordinates([]);
    setDisplayedRoute([]);
    setDriverRouteCoordinates([]);
    setVehicles([]);
    setSelectedVehicle(null);
  };

  // ========== HELPERS FOR BACKEND DATA ==========
  const getRideTypeName = (item: VehicleOption): string => {
    return (
      item.driverOption?.rideTypes?.[0]?.name || item.rideTypeName || 'Unknown'
    );
  };

  const getRideTypeCode = (item: VehicleOption): string => {
    return (
      item.driverOption?.rideTypes?.[0]?.code || item.rideTypeCode || 'car'
    );
  };

  const getRideTypeDescription = (item: VehicleOption): string => {
    return (
      item.driverOption?.rideTypes?.[0]?.description ||
      item.rideTypeDescription ||
      ''
    );
  };

  const getRideTypeFare = (item: VehicleOption): number => {
    return (
      item.driverOption?.rideTypes?.[0]?.estimatedFare ||
      item.estimatedFare ||
      0
    );
  };

  const getIsFastest = (item: VehicleOption): boolean => {
    const rideTypeCode = item.driverOption?.rideTypes?.[0]?.code;
    return (
      item.fastestRideType?.code === rideTypeCode || item.isFastest || false
    );
  };

  const getDriverDistance = (item: VehicleOption): number | null => {
    return item.driverOption?.distance ?? null;
  };

  const getDriverEta = (item: VehicleOption): number => {
    return item.driverOption?.driverEtaMinutes || item.eta || 0;
  };

  const getMaxPassengers = (item: VehicleOption): number => {
    return item.driverOption?.maxPassengers || item.maxPassengers || 1;
  };

  const getPassengerCapacity = (item: VehicleOption): number => {
    return item.driverOption?.passengerCapacity || item.passengerCapacity || 1;
  };

  const getSeatCapacity = (item: VehicleOption): number => {
    return item.driverOption?.seatCapacity || item.seatCapacity || 2;
  };

  const getLuggageCapacity = (item: VehicleOption): number => {
    return item.driverOption?.luggageCapacity || item.luggageCapacity || 0;
  };

  const getHandBagCapacity = (item: VehicleOption): number => {
    return item.driverOption?.handBagCapacity || item.handBagCapacity || 1;
  };

  const getHasAC = (item: VehicleOption): boolean => {
    return item.driverOption?.hasAC !== undefined
      ? item.driverOption.hasAC
      : item.hasAC || false;
  };

  const getVehicleClass = (item: VehicleOption): string => {
    return item.driverOption?.vehicleClass || item.vehicleClass || 'Economy';
  };

  // ========== GROUP RIDE TYPES ==========
  const getGroupedRideTypes = () => {
    const grouped: Record<string, VehicleOption[]> = {};

    VEHICLE_CLASSES.forEach(cls => {
      grouped[cls.id] = [];
    });

    vehicles.forEach(vehicle => {
      const classKey = vehicle.vehicleClass?.toLowerCase() || 'economy';
      if (grouped[classKey]) {
        grouped[classKey].push(vehicle);
      } else {
        grouped['economy'].push(vehicle);
      }
    });

    return grouped;
  };

  // ========== RENDER SUGGESTIONS ==========
  const renderSuggestion = ({
    item,
    index,
  }: {
    item: Suggestion;
    index: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.suggestionItem,
        index === suggestions.length - 1 && styles.suggestionItemLast,
      ]}
      onPress={() => selectSuggestion(item)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionIconWrap}>
        <Icon name="north-east" size={14} color={COLORS.textMuted} />
      </View>
      <View style={styles.suggestionTextContainer}>
        <Text style={styles.suggestionMainText} numberOfLines={1}>
          {item.mainText}
        </Text>
        <Text style={styles.suggestionSecondaryText} numberOfLines={1}>
          {item.secondaryText}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const groupedRideTypes = getGroupedRideTypes();
  const classesWithItems = VEHICLE_CLASSES.filter(
    c => (groupedRideTypes[c.id] || []).length > 0,
  );

  // ========== RENDER RIDE ROW ==========
  const renderRideRow = (
    item: VehicleOption,
    classInfo: (typeof VEHICLE_CLASSES)[number],
  ) => {
    const isSelected = selectedVehicle?.quoteId === item.quoteId;
    const driverOption = item.driverOption;
    const rideTypeName = getRideTypeName(item);
    const rideTypeCode = getRideTypeCode(item);
    const rideTypeDesc = getRideTypeDescription(item);
    const rideTypeFare = getRideTypeFare(item);
    const isFastest = getIsFastest(item);
    const distance = getDriverDistance(item);
    const eta = getDriverEta(item);
    const maxPassengers = getMaxPassengers(item);
    const passengerCapacity = getPassengerCapacity(item);
    const seatCapacity = getSeatCapacity(item);
    const luggageCapacity = getLuggageCapacity(item);
    const handBagCapacity = getHandBagCapacity(item);
    const hasAC = getHasAC(item);
    const vehicleClass = getVehicleClass(item);

    const isExpanded = expandedDescription === item.quoteId;

    return (
      <AnimatedPressable
        key={item.quoteId}
        style={[styles.ticketRow, isSelected && styles.ticketRowSelected]}
        scaleTo={0.98}
        onPress={() => {
          setSelectedVehicle(item);
          if (driverOption?.driverToPickupPolyline) {
            const decoded = decodePolyline(driverOption.driverToPickupPolyline);
            setDriverRouteCoordinates(decoded);
          }
        }}
      >
        <View style={styles.ticketRowMain}>
          <View
            style={[
              styles.ticketIconWrap,
              {
                backgroundColor: isSelected ? COLORS.ink : COLORS.surfaceSunken,
              },
            ]}
          >
            <MCIcon
              name={getRideIcon(rideTypeCode)}
              size={20}
              color={isSelected ? COLORS.white : COLORS.inkSoft}
            />
          </View>

          <View style={styles.ticketRowInfo}>
            <View style={styles.ticketRowNameLine}>
              <Text style={styles.ticketRowName}>{rideTypeName}</Text>
              {isFastest && (
                <View style={styles.fastestChip}>
                  <View style={styles.fastestDot} />
                  <Text style={styles.fastestChipText}>Fastest</Text>
                </View>
              )}
            </View>

            {/* Description with More/Less */}
            <View>
              <Text
                style={styles.ticketRowDesc}
                numberOfLines={isExpanded ? undefined : 2}
              >
                {rideTypeDesc}
              </Text>
              {rideTypeDesc.length > 60 && (
                <TouchableOpacity
                  onPress={() => {
                    if (isExpanded) {
                      setExpandedDescription(null);
                    } else {
                      setExpandedDescription(item.quoteId);
                    }
                  }}
                  style={styles.moreButton}
                >
                  <Text style={styles.moreText}>
                    {isExpanded ? 'Less' : 'More...'}
                  </Text>
                  <Icon
                    name={isExpanded ? 'expand-less' : 'expand-more'}
                    size={16}
                    color={COLORS.green}
                  />
                </TouchableOpacity>
              )}
            </View>

            {isExpanded && (
              <View style={styles.expandedDetails}>
                <View style={styles.expandedRow}>
                  <Icon name="directions-car" size={14} color={COLORS.green} />
                  <Text style={styles.expandedText}>
                    Vehicle: {vehicleClass}
                  </Text>
                </View>
                <View style={styles.expandedRow}>
                  <Icon name="person" size={14} color={COLORS.green} />
                  <Text style={styles.expandedText}>
                    Max Passengers: {maxPassengers}
                  </Text>
                </View>
                <View style={styles.expandedRow}>
                  <Icon name="people" size={14} color={COLORS.green} />
                  <Text style={styles.expandedText}>
                    Passenger Capacity: {passengerCapacity}
                  </Text>
                </View>
                <View style={styles.expandedRow}>
                  <Icon name="chair" size={14} color={COLORS.green} />
                  <Text style={styles.expandedText}>Seats: {seatCapacity}</Text>
                </View>
                <View style={styles.expandedRow}>
                  <Icon name="luggage" size={14} color={COLORS.green} />
                  <Text style={styles.expandedText}>
                    Luggage: {luggageCapacity}
                  </Text>
                </View>
                <View style={styles.expandedRow}>
                  <Icon name="backpack" size={14} color={COLORS.green} />
                  <Text style={styles.expandedText}>
                    Hand Bags: {handBagCapacity}
                  </Text>
                </View>
                <View style={styles.expandedRow}>
                  <Icon
                    name={hasAC ? 'ac-unit' : 'ac-unit'}
                    size={14}
                    color={hasAC ? COLORS.green : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.expandedText,
                      { color: hasAC ? COLORS.green : COLORS.textMuted },
                    ]}
                  >
                    AC: {hasAC ? 'Yes' : 'No'}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.ticketRowMeta}>
              <Text style={styles.ticketRowMetaText}>
                {formatDuration(eta)}
              </Text>
              <View style={styles.metaSeparator} />
              <Text style={styles.ticketRowMetaText}>
                {maxPassengers} seats
              </Text>
              <View style={styles.metaSeparator} />
              <Text style={styles.ticketRowMetaText}>
                {distance !== null
                  ? formatDistance(distance)
                  : `${item.driverCount || 1} nearby`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.stubDivider}>
          <View style={styles.stubNotchLeftSmall} />
          <View style={styles.stubDashedLine} />
          <View style={styles.stubNotchRightSmall} />
        </View>

        <View style={styles.ticketRowStub}>
          <Text style={styles.stubEyebrow}>{classInfo.shortLabel}</Text>
          <Text style={styles.ticketRowPrice}>{formatPrice(rideTypeFare)}</Text>
          <View
            style={[
              styles.stubRadio,
              isSelected && {
                borderColor: COLORS.green,
                backgroundColor: COLORS.green,
              },
            ]}
          >
            {isSelected && <Icon name="check" size={11} color={COLORS.white} />}
          </View>
        </View>
      </AnimatedPressable>
    );
  };

  // ============================================================
  //  MAIN RENDER
  // ============================================================
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* ===== HEADER ===== */}
      <View style={styles.header}>
        <AnimatedPressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          scaleTo={0.88}
        >
          <Icon name="arrow-back" size={20} color={COLORS.ink} />
        </AnimatedPressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerEyebrow}>NEW TRIP</Text>
          <Text style={styles.headerTitle}>Book a ride</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* ===== MAP SECTION ===== */}
      <View style={styles.mapContainer}>
        {fetchingLocation ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.ink} />
            <Text style={styles.loadingText}>Finding your location…</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={region}
            customMapStyle={LIGHT_MAP_STYLE}
            showsUserLocation={true}
            showsMyLocationButton={false}
            zoomEnabled={true}
            zoomControlEnabled={false}
            onPress={onMapPress}
            pointerEvents={showSuggestions ? 'none' : 'auto'}
          >
            {driverRouteCoordinates.length > 0 && (
              <Polyline
                coordinates={driverRouteCoordinates}
                strokeColor={COLORS.green}
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
                lineDashPattern={[1, 8]}
              />
            )}

            {displayedRoute.length > 0 && (
              <>
                <Polyline
                  coordinates={displayedRoute}
                  strokeColor={COLORS.ink}
                  strokeWidth={7}
                  lineCap="round"
                  lineJoin="round"
                />
                <Polyline
                  coordinates={displayedRoute}
                  strokeColor={COLORS.green}
                  strokeWidth={3}
                  lineCap="round"
                  lineJoin="round"
                />
              </>
            )}

            {isDrawingRoute && displayedRoute.length > 0 && (
              <Marker
                coordinate={displayedRoute[displayedRoute.length - 1]}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={true}
              >
                <View style={styles.routeTip} />
              </Marker>
            )}

            {selectedVehicle?.driverOption?.location && (
              <Marker
                coordinate={{
                  latitude: selectedVehicle.driverOption.location.latitude,
                  longitude: selectedVehicle.driverOption.location.longitude,
                }}
                title="Driver"
                description={`${selectedVehicle.driverOption.driverCode} • ${formatDistance(selectedVehicle.driverOption.distance)} away`}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.markerDriver}>
                  <MCIcon name="car" size={13} color={COLORS.white} />
                </View>
              </Marker>
            )}

            {pickup && (
              <Marker
                coordinate={{
                  latitude: pickup.latitude,
                  longitude: pickup.longitude,
                }}
                title="Pickup"
                description={pickup.address}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={true}
              >
                <View style={styles.markerPickupWrap}>
                  <PulseRing color={COLORS.green} size={22} />
                  <View style={styles.markerPickup}>
                    <View style={styles.markerPickupCore} />
                  </View>
                </View>
              </Marker>
            )}

            {drop && (
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
            )}
          </MapView>
        )}

        {!fetchingLocation && (
          <AnimatedPressable
            style={styles.myLocationButton}
            onPress={getCurrentUserLocation}
            scaleTo={0.88}
          >
            <Icon name="my-location" size={18} color={COLORS.ink} />
          </AnimatedPressable>
        )}

        {/* Location Overlay */}
        <View style={styles.locationOverlay}>
          <View
            style={[
              styles.locationInputContainer,
              focusedField && styles.locationInputContainerFocused,
            ]}
          >
            <TouchableOpacity
              style={styles.locationRow}
              onPress={() => {
                setSearchType('pickup');
                pickupInputRef.current?.focus();
              }}
              activeOpacity={0.7}
            >
              <View style={styles.railWrap}>
                <View style={styles.dotPickup} />
                <View style={styles.railLine} />
              </View>
              <TextInput
                ref={pickupInputRef}
                style={styles.locationInput}
                placeholder="Pickup location"
                placeholderTextColor={COLORS.textMuted}
                value={pickupText}
                onChangeText={text => {
                  setPickupText(text);
                  searchLocations(text);
                  if (text.length === 0) {
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => {
                  setSearchType('pickup');
                  setFocusedField('pickup');
                  if (pickupText.length > 0) {
                    searchLocations(pickupText);
                  }
                }}
                onBlur={() => {
                  setFocusedField(null);
                }}
              />
              {pickupText.length > 0 && (
                <TouchableOpacity
                  onPress={clearPickup}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="close" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            <AnimatedPressable
              style={styles.swapButton}
              onPress={swapLocations}
              scaleTo={0.85}
            >
              <Icon name="swap-vert" size={18} color={COLORS.ink} />
            </AnimatedPressable>

            <TouchableOpacity
              style={[styles.locationRow, styles.locationRowLast]}
              onPress={() => {
                setSearchType('drop');
                dropInputRef.current?.focus();
              }}
              activeOpacity={0.7}
            >
              <View style={styles.railWrap}>
                <View style={styles.dotDrop} />
              </View>
              <TextInput
                ref={dropInputRef}
                style={styles.locationInput}
                placeholder="Where to?"
                placeholderTextColor={COLORS.textMuted}
                value={dropText}
                onChangeText={text => {
                  setDropText(text);
                  searchLocations(text);
                  if (text.length === 0) {
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => {
                  setSearchType('drop');
                  setFocusedField('drop');
                  if (dropText.length > 0) {
                    searchLocations(dropText);
                  }
                }}
                onBlur={() => {
                  setFocusedField(null);
                }}
              />
              {dropText.length > 0 && (
                <TouchableOpacity
                  onPress={clearDrop}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="close" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <View style={styles.suggestionsHeader}>
                  <Text style={styles.suggestionsHeaderText}>SUGGESTIONS</Text>
                </View>
                <FlatList
                  data={suggestions}
                  renderItem={renderSuggestion}
                  keyExtractor={item => item.placeId}
                  keyboardShouldPersistTaps="always"
                  style={styles.suggestionsList}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ===== BOTTOM SECTION ===== */}
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
                  if (vehicles.length > 0) {
                    setShowRideModal(true);
                  } else {
                    getRideOptions();
                  }
                }}
                disabled={isGettingOptions}
                scaleTo={0.94}
              >
                <Text style={styles.viewAllText}>
                  {vehicles.length > 0
                    ? `All options (${vehicles.length})`
                    : 'Refresh'}
                </Text>
                <Icon
                  name={vehicles.length > 0 ? 'chevron-right' : 'refresh'}
                  size={15}
                  color={COLORS.ink}
                />
              </AnimatedPressable>
            )}
          </View>

          {vehicles.length === 0 && !isGettingOptions && pickup && drop && (
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

          {selectedVehicle && !isGettingOptions && (
            <AnimatedPressable
              style={styles.selectedTicket}
              onPress={() => setShowRideModal(true)}
              scaleTo={0.97}
            >
              <View style={styles.selectedTicketMain}>
                <View style={styles.selectedRideIconWrap}>
                  <MCIcon
                    name={getRideIcon(getRideTypeCode(selectedVehicle))}
                    size={24}
                    color={COLORS.white}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.ticketRowNameLine}>
                    <Text style={styles.selectedRideName}>
                      {getRideTypeName(selectedVehicle)}
                    </Text>
                    {getIsFastest(selectedVehicle) && (
                      <View style={styles.fastestChip}>
                        <View style={styles.fastestDot} />
                        <Text style={styles.fastestChipText}>Fastest</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.selectedRideEtaRow}>
                    <Icon
                      name="schedule"
                      size={12}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.selectedRideEta}>
                      {formatDuration(getDriverEta(selectedVehicle))} away ·{' '}
                      {getDriverDistance(selectedVehicle) !== null
                        ? formatDistance(getDriverDistance(selectedVehicle)!)
                        : `${selectedVehicle.driverCount || 1} driver${selectedVehicle.driverCount > 1 ? 's' : ''} nearby`}
                    </Text>
                  </View>
                </View>
              </View>

              {/* NOTCH - LEFT (Pickup) and RIGHT (Drop) - FIXED */}
              <View style={styles.stubDividerHorizontal}>
                <View style={styles.stubNotchLeft} />
                <View style={styles.stubDashedLineHorizontal} />
                <View style={styles.stubNotchRight} />
              </View>

              {/* Pickup and Drop Labels - Exactly below notches */}
              <View style={styles.notchLabelContainer}>
                <View style={styles.notchLabelLeft}>
                  <Icon name="my-location" size={12} color={COLORS.green} />
                  <Text style={styles.notchLabelTextGreen} numberOfLines={1}>
                    {pickup?.address?.split(',')[0] || 'Pickup'}
                  </Text>
                </View>
                <View style={styles.notchLabelRight}>
                  <Icon name="flag" size={12} color={COLORS.green} />
                  <Text style={styles.notchLabelTextGreen} numberOfLines={1}>
                    {drop?.address?.split(',')[0] || 'Drop'}
                  </Text>
                </View>
              </View>

              <View style={styles.selectedTicketFooter}>
                <Text style={styles.selectedTicketFooterLabel}>
                  TAP TO CHANGE RIDE TYPE
                </Text>
                <Text style={styles.selectedRidePrice}>
                  {formatPrice(getRideTypeFare(selectedVehicle))}
                </Text>
              </View>
            </AnimatedPressable>
          )}
        </View>

        <AnimatedPressable
          style={[
            styles.bookButton,
            (!pickup ||
              !drop ||
              !selectedVehicle ||
              loading ||
              isGettingOptions) &&
              styles.bookButtonDisabled,
          ]}
          onPress={createBooking}
          disabled={
            !pickup || !drop || !selectedVehicle || loading || isGettingOptions
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
                    : selectedVehicle
                      ? `Book ${getRideTypeName(selectedVehicle)} · ${formatPrice(getRideTypeFare(selectedVehicle))}`
                      : 'Select a ride type'}
              </Text>
              {pickup && drop && selectedVehicle && !isGettingOptions && (
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

      {/* ===== RIDE TYPES MODAL ===== */}
      <Modal
        visible={showRideModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRideModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { paddingBottom: insets.bottom || 18 },
            ]}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.headerEyebrow}>
                  {vehicles.length} OPTIONS FOUND
                </Text>
                <Text style={styles.modalTitle}>Choose your ride</Text>
              </View>
              <AnimatedPressable
                onPress={() => setShowRideModal(false)}
                style={styles.modalCloseButton}
                scaleTo={0.85}
              >
                <Icon name="close" size={18} color={COLORS.ink} />
              </AnimatedPressable>
            </View>

            {classesWithItems.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.classTabBar}
                contentContainerStyle={styles.classTabBarContent}
              >
                {classesWithItems.map(cls => {
                  const isActive = activeClassTab === cls.id;
                  const count = (groupedRideTypes[cls.id] || []).length;
                  return (
                    <AnimatedPressable
                      key={cls.id}
                      style={[
                        styles.classTab,
                        isActive && styles.classTabActive,
                      ]}
                      onPress={() => setActiveClassTab(cls.id)}
                      scaleTo={0.94}
                    >
                      <MCIcon
                        name={cls.icon}
                        size={15}
                        color={isActive ? COLORS.white : COLORS.inkSoft}
                      />
                      <Text
                        style={[
                          styles.classTabText,
                          isActive && styles.classTabTextActive,
                        ]}
                      >
                        {cls.label}
                      </Text>
                      <View
                        style={[
                          styles.classTabCount,
                          isActive && styles.classTabCountActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.classTabCountText,
                            isActive && styles.classTabCountTextActive,
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    </AnimatedPressable>
                  );
                })}
              </ScrollView>
            )}

            {classesWithItems.find(c => c.id === activeClassTab) && (
              <Text style={styles.classActiveDescription}>
                {
                  VEHICLE_CLASSES.find(c => c.id === activeClassTab)
                    ?.description
                }
              </Text>
            )}

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {(groupedRideTypes[activeClassTab] || []).map(item =>
                renderRideRow(
                  item,
                  VEHICLE_CLASSES.find(c => c.id === activeClassTab)!,
                ),
              )}

              {vehicles.length === 0 && (
                <View style={styles.modalEmpty}>
                  <MCIcon name="car-off" size={28} color={COLORS.textMuted} />
                  <Text style={styles.modalEmptyText}>
                    No ride types available
                  </Text>
                </View>
              )}
            </ScrollView>

            <AnimatedPressable
              style={[
                styles.modalBookButton,
                !selectedVehicle && styles.modalBookButtonDisabled,
              ]}
              onPress={createBooking}
              disabled={!selectedVehicle || loading}
              scaleTo={0.96}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.modalBookButtonText}>
                  {selectedVehicle
                    ? `Book ${getRideTypeName(selectedVehicle)} · ${formatPrice(getRideTypeFare(selectedVehicle))}`
                    : 'Select a ride type to continue'}
                </Text>
              )}
            </AnimatedPressable>
          </View>
        </View>
      </Modal>

      {/* ===== BOTTOM SHEET ===== */}
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
    </SafeAreaView>
  );
};

// ============================================================
//  STYLES - TICKET THEME
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: COLORS.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: 0.1,
  },
  headerRight: {
    width: 36,
  },
  mapContainer: {
    height: '45%',
    position: 'relative',
    backgroundColor: COLORS.bg,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.canvas,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  myLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  locationOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    zIndex: 100,
  },
  locationInputContainer: {
    backgroundColor: COLORS.bg,
    borderRadius: 18,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 12,
    position: 'relative',
    zIndex: 101,
  },
  locationInputContainerFocused: {
    borderColor: COLORS.green,
    shadowColor: COLORS.green,
    shadowOpacity: 0.22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
  },
  locationRowLast: {
    borderBottomWidth: 0,
  },
  railWrap: {
    width: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  railLine: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.borderStrong,
    marginTop: 4,
    borderRadius: 1,
  },
  dotPickup: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: COLORS.green,
  },
  dotDrop: {
    width: 9,
    height: 9,
    borderRadius: 2,
    backgroundColor: COLORS.ink,
  },
  locationInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '500',
    color: COLORS.ink,
    padding: 0,
  },
  swapButton: {
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -15,
    backgroundColor: COLORS.surfaceSunken,
    borderRadius: 11,
    padding: 7,
    zIndex: 5,
  },
  suggestionsContainer: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    marginTop: 6,
    maxHeight: 230,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 999,
    zIndex: 999,
    overflow: 'hidden',
  },
  suggestionsHeader: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  suggestionsHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  suggestionsList: {
    paddingBottom: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
    backgroundColor: COLORS.bg,
    minHeight: 48,
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  suggestionMainText: {
    fontSize: 13.5,
    color: COLORS.ink,
    fontWeight: '600',
  },
  suggestionSecondaryText: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
  },
  rideContainer: {
    padding: 16,
    flex: 1,
  },
  rideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 12.5,
    color: COLORS.ink,
    fontWeight: '600',
  },
  noRidesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  noRidesText: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  // ===== REAL TICKET STYLES =====
  selectedTicket: {
    backgroundColor: COLORS.bg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  selectedTicketMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: COLORS.bg,
  },
  selectedRideIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRideName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
    marginRight: 6,
  },
  selectedRideEtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  selectedRideEta: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  stubDividerHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 4,
    position: 'relative',
  },
  stubDashedLineHorizontal: {
    flex: 1,
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.borderStrong,
  },
  stubNotchLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
    marginLeft: -8,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  stubNotchRight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
    marginRight: -8,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  notchLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: -6,
    marginBottom: 4,
    backgroundColor: COLORS.bg,
  },
  notchLabelLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
  },
  notchLabelRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingRight: 8,
  },
  notchLabelTextGreen: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.green,
    letterSpacing: 0.3,
    flex: 1,
  },
  selectedTicketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surfaceSunken,
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
  },
  selectedTicketFooterLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  selectedRidePrice: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.green,
  },
  fastestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greenMuted,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    gap: 4,
  },
  fastestDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.green,
  },
  fastestChipText: {
    fontSize: 9.5,
    color: COLORS.greenDark,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
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
  cancelButtonText: {
    color: COLORS.danger,
    fontSize: 13.5,
    fontWeight: '600',
  },
  markerDriver: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.green,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPickupWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPickup: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.white,
    borderWidth: 2.5,
    borderColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPickupCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
  },
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
  routeTip: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.green,
    borderWidth: 2,
    borderColor: COLORS.white,
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
  bottomSheetHandle: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  bottomSheetHandleBar: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
  },
  bottomSheetContent: {
    padding: 20,
    flex: 1,
  },
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
  bottomSheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
  },
  bottomSheetAddress: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
    backgroundColor: COLORS.surfaceSunken,
    padding: 12,
    borderRadius: 12,
  },
  bottomSheetButtons: {
    flexDirection: 'row',
    gap: 10,
  },
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
  bottomSheetButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  bottomSheetCancel: {
    marginTop: 14,
    alignItems: 'center',
    padding: 10,
  },
  bottomSheetCancelText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 15, 20, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: height * 0.86,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: 0.1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classTabBar: {
    marginBottom: 4,
  },
  classTabBarContent: {
    gap: 8,
    paddingRight: 8,
    paddingBottom: 12,
  },
  classTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSunken,
    gap: 6,
  },
  classTabActive: {
    backgroundColor: COLORS.ink,
  },
  classTabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.inkSoft,
  },
  classTabTextActive: {
    color: COLORS.white,
  },
  classTabCount: {
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  classTabCountActive: {
    backgroundColor: COLORS.green,
  },
  classTabCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.inkSoft,
  },
  classTabCountTextActive: {
    color: COLORS.white,
  },
  classActiveDescription: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginBottom: 14,
  },
  modalScrollContent: {
    paddingBottom: 16,
  },

  // ===== MODAL TICKET ROW =====
  ticketRow: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  ticketRowSelected: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.bg,
  },
  ticketRowMain: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
    backgroundColor: COLORS.bg,
  },
  ticketIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketRowInfo: {
    flex: 1,
  },
  ticketRowNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  ticketRowName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  ticketRowDesc: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  moreText: {
    fontSize: 11,
    color: COLORS.green,
    fontWeight: '600',
  },
  expandedDetails: {
    marginTop: 6,
    padding: 8,
    backgroundColor: COLORS.surfaceSunken,
    borderRadius: 8,
  },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  expandedText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  ticketRowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  ticketRowMetaText: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  metaSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.borderStrong,
  },
  stubDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    backgroundColor: COLORS.bg,
  },
  stubNotchLeftSmall: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.bg,
    marginLeft: -7,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stubNotchRightSmall: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.bg,
    marginRight: -7,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stubDashedLine: {
    flex: 1,
    height: 0,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    marginHorizontal: 8,
  },
  ticketRowStub: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.surfaceSunken,
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
  },
  stubEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  ticketRowPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink,
  },
  stubRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBookButton: {
    backgroundColor: COLORS.ink,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginTop: 6,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  modalBookButtonDisabled: {
    backgroundColor: COLORS.surfaceSunken,
    shadowOpacity: 0,
    elevation: 0,
  },
  modalBookButtonText: {
    color: COLORS.white,
    fontSize: 15.5,
    fontWeight: '700',
  },
  modalEmpty: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 8,
  },
});

export default BookingScreen;