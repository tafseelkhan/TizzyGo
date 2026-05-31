// components/MapSelectionModal.tsx
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  ViewStyle,
  TextStyle,
  PermissionsAndroid,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { CheckoutData, ShippingAddress } from '../../types/BuyNowTypes';
import { useTheme } from '../../contexts/theme/ThemeContext'; // Your theme context
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const GOOGLE_API_KEY = 'AIzaSyAOYUGLlj-cKzkwE0kDmCUolAQvf7cMjpY';

interface MapSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  shippingAddress: ShippingAddress;
  updateCheckoutData: (key: keyof CheckoutData, value: any) => void;
  updateShippingAddress: (
    field: keyof ShippingAddress,
    value: string | number | null,
  ) => void;
}

// ✅ Custom Button Props Interface
interface ThemeButtonProps {
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  children: ReactNode;
  disabled?: boolean;
}

// ✅ Simple throttle function
const throttle = (func: any, limit: number) => {
  let inThrottle: boolean;
  return (...args: any[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// ✅ Custom Button Component with Hover Effects
const ThemeButton: React.FC<ThemeButtonProps> = ({
  onPress,
  style,
  textStyle,
  children,
  disabled = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const { isDark, resolvedTheme } = useTheme();

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        style,
        isPressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
      ]}
    >
      {children}
    </TouchableOpacity>
  );
};

const MapSelectionModal: React.FC<MapSelectionModalProps> = ({
  visible,
  onClose,
  shippingAddress,
  updateCheckoutData,
  updateShippingAddress,
}) => {
  const { isDark, resolvedTheme, theme } = useTheme();
  const [isMapReady, setIsMapReady] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapKey, setMapKey] = useState(Date.now());

  const [selectedMapLocation, setSelectedMapLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);

  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 28.6139,
    longitude: 77.209,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const mapRef = useRef<MapView>(null);

  // ✅ Request location permission for Android
  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message:
            'This app needs access to your location to show delivery options.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  // ✅ Theme-based styles
  const dynamicStyles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      height: height * 0.9,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#f0f0f0',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: isDark ? '#fff' : '#333',
    },
    instructions: {
      padding: 12,
      backgroundColor: isDark ? '#2d2d2d' : '#f8f9fa',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#404040' : '#e0e0e0',
    },
    instructionText: {
      fontSize: 13,
      color: isDark ? '#aaa' : '#666',
      textAlign: 'center' as const,
    },
    mapLoadingContainer: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
      zIndex: 10,
    },
    mapLoadingText: {
      marginTop: 10,
      color: isDark ? '#ccc' : '#666',
      fontSize: 14,
    },
    locationButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      shadowColor: isDark ? '#000' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.5 : 0.2,
      shadowRadius: 4,
      elevation: 5,
    },
    selectedLocationInfo: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333' : '#f0f0f0',
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
    },
    selectedLocationTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: isDark ? '#fff' : '#333',
    },
    selectedAddressText: {
      fontSize: 14,
      color: isDark ? '#ddd' : '#333',
      lineHeight: 20,
      marginBottom: 12,
      padding: 12,
      backgroundColor: isDark ? '#2d2d2d' : '#f8f9fa',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#404040' : '#e0e0e0',
    },
    selectedCoordinateText: {
      fontSize: 12,
      color: isDark ? '#aaa' : '#666',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      textAlign: 'center' as const,
      padding: 8,
      backgroundColor: isDark ? '#2d2d2d' : '#f8f9fa',
      borderRadius: 6,
    },
    noLocationSelected: {
      alignItems: 'center' as const,
      padding: 20,
    },
    noLocationSelectedText: {
      fontSize: 14,
      color: isDark ? '#777' : '#999',
      textAlign: 'center' as const,
      marginTop: 10,
    },
    actionButtons: {
      flexDirection: 'row' as const,
      padding: 16,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333' : '#f0f0f0',
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
    },
    confirmButton: {
      backgroundColor: '#2ecc71',
    },
    disabledConfirmButton: {
      backgroundColor: isDark ? '#404040' : '#bdc3c7',
      opacity: 0.7,
    },
    confirmButtonText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: '#fff',
    },
  });

  // ✅ Initialize with current address
  useEffect(() => {
    if (visible) {
      setIsMapReady(false);
      setMapKey(Date.now());

      if (
        shippingAddress.latitude !== null &&
        shippingAddress.longitude !== null
      ) {
        const lat = shippingAddress.latitude;
        const lng = shippingAddress.longitude;

        setMapRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        setSelectedMapLocation({
          latitude: lat,
          longitude: lng,
          address: shippingAddress.address,
        });
      } else {
        setSelectedMapLocation(null);
      }
    }
  }, [visible, shippingAddress]);

  // ✅ Throttled map region change handler
  const throttledHandleMapRegionChange = useCallback(
    throttle((region: Region) => {
      setMapRegion(region);
    }, 500),
    [],
  );

  // ✅ Reverse geocode coordinates to address
  const reverseGeocode = async (
    latitude: number,
    longitude: number,
  ): Promise<string> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}&language=en`,
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return `Location at ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return `Location at ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  };

  // ✅ Get current location using react-native-geolocation-service
  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);

      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Denied',
          'Please enable location services to use this feature',
        );
        setIsGettingLocation(false);
        return;
      }

      Geolocation.getCurrentPosition(
        async position => {
          const { latitude, longitude } = position.coords;

          // Update map region
          setMapRegion({
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });

          // Get address from coordinates
          const address = await reverseGeocode(latitude, longitude);

          setSelectedMapLocation({
            latitude,
            longitude,
            address,
          });

          // Animate map to location
          if (mapRef.current) {
            mapRef.current.animateToRegion(
              {
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              500,
            );
          }

          setIsGettingLocation(false);
        },
        error => {
          console.error('Error getting location:', error);
          Alert.alert('Error', 'Failed to get current location');
          setIsGettingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
      setIsGettingLocation(false);
    }
  };

  // ✅ Handle map press to select location
  const handleMapPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    const { latitude, longitude } = coordinate;

    // Get address for selected location
    const address = await reverseGeocode(latitude, longitude);

    setSelectedMapLocation({
      latitude,
      longitude,
      address,
    });
  };

  // ✅ Confirm selected location from map
  const confirmMapLocation = async () => {
    if (!selectedMapLocation) {
      Alert.alert('Error', 'Please select a location on the map');
      return;
    }

    try {
      setIsGettingLocation(true);

      const { latitude, longitude, address } = selectedMapLocation;

      // Get place details if available
      let googlePlaceId = '';
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}&language=en`,
        );
        const data = await response.json();
        if (data.status === 'OK' && data.results.length > 0) {
          googlePlaceId = data.results[0].place_id || '';
        }
      } catch (error) {
        console.error('Error getting place ID:', error);
      }

      // ✅ FIXED: Update shipping address with proper types
      const updatedShippingAddress: ShippingAddress = {
        address: address,
        latitude: latitude,
        longitude: longitude,
        googlePlaceId: googlePlaceId,
      };

      if (updateCheckoutData) {
        updateCheckoutData('shippingAddress', updatedShippingAddress);
      } else {
        updateShippingAddress('address', address);
        updateShippingAddress('latitude', latitude);
        updateShippingAddress('longitude', longitude);
        updateShippingAddress('googlePlaceId', googlePlaceId);
      }

      onClose();
    } catch (error) {
      console.error('Error confirming location:', error);
      Alert.alert('Error', 'Failed to select location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // ✅ Handle close
  const handleClose = () => {
    onClose();
  };

  // ✅ Optimized Marker Component
  const DraggableMarker = React.memo(() => {
    if (!selectedMapLocation) return null;

    return (
      <Marker
        key={`marker-${selectedMapLocation.latitude}-${selectedMapLocation.longitude}`}
        coordinate={{
          latitude: selectedMapLocation.latitude,
          longitude: selectedMapLocation.longitude,
        }}
        draggable
        onDragEnd={async e => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          const address = await reverseGeocode(latitude, longitude);
          setSelectedMapLocation({
            latitude,
            longitude,
            address,
          });
        }}
        tracksViewChanges={false}
      >
        <View style={styles.draggableMarker}>
          <MaterialIcons
            name="location-pin"
            size={40}
            color={isDark ? '#4CAF50' : '#e74c3c'}
          />
        </View>
      </Marker>
    );
  });

  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
  }, []);

  // ✅ Map theme based on dark mode
  const getMapTheme = () => {
    if (isDark) {
      return [
        {
          elementType: 'geometry',
          stylers: [{ color: '#242f3e' }],
        },
        {
          elementType: 'labels.text.fill',
          stylers: [{ color: '#746855' }],
        },
        {
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#242f3e' }],
        },
        {
          featureType: 'administrative.locality',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }],
        },
        {
          featureType: 'poi',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }],
        },
        {
          featureType: 'poi.park',
          elementType: 'geometry',
          stylers: [{ color: '#263c3f' }],
        },
        {
          featureType: 'poi.park',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#6b9a76' }],
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#38414e' }],
        },
        {
          featureType: 'road',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#212a37' }],
        },
        {
          featureType: 'road',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#9ca5b3' }],
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry',
          stylers: [{ color: '#746855' }],
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#1f2835' }],
        },
        {
          featureType: 'road.highway',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#f3d19c' }],
        },
        {
          featureType: 'transit',
          elementType: 'geometry',
          stylers: [{ color: '#2f3948' }],
        },
        {
          featureType: 'transit.station',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }],
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#17263c' }],
        },
        {
          featureType: 'water',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#515c6d' }],
        },
        {
          featureType: 'water',
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#17263c' }],
        },
      ];
    }
    return [];
  };

  // ✅ Get dynamic button style for dark mode
  const getLocationButtonStyle = () => {
    const baseStyle = [
      dynamicStyles.locationButton,
      styles.currentLocationButton,
    ] as ViewStyle[];

    if (isDark) {
      return [...baseStyle, { backgroundColor: '#4CAF50' }];
    }

    return baseStyle;
  };

  // ✅ Get confirm button style based on state
  const getConfirmButtonStyle = () => {
    const baseStyle = [
      styles.actionButton,
      dynamicStyles.confirmButton,
    ] as ViewStyle[];

    if (!selectedMapLocation || isGettingLocation) {
      return [...baseStyle, dynamicStyles.disabledConfirmButton];
    }

    return baseStyle;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      hardwareAccelerated={true}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <SafeAreaView style={dynamicStyles.modalOverlay} edges={['bottom']}>
        <View style={dynamicStyles.modalContainer}>
          <View style={dynamicStyles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <MaterialIcons
                name="my-location"
                size={22}
                color={isDark ? '#4CAF50' : '#333'}
              />
              <Text style={dynamicStyles.modalTitle}>
                Select Delivery Location
              </Text>
            </View>
            <ThemeButton onPress={handleClose} style={styles.modalCloseButton}>
              <MaterialIcons
                name="close"
                size={24}
                color={isDark ? '#aaa' : '#666'}
              />
            </ThemeButton>
          </View>

          <View style={dynamicStyles.instructions}>
            <Text style={dynamicStyles.instructionText}>
              📍 Tap on map to select location • Drag to navigate
            </Text>
          </View>

          <View style={styles.mapContainer}>
            {!isMapReady && (
              <View style={dynamicStyles.mapLoadingContainer}>
                <ActivityIndicator
                  size="large"
                  color={isDark ? '#4CAF50' : '#4285F4'}
                />
                <Text style={dynamicStyles.mapLoadingText}>Loading map...</Text>
              </View>
            )}

            <MapView
              key={`map-${mapKey}-${theme}`} // Re-render map on theme change
              ref={mapRef}
              style={[styles.map, !isMapReady && styles.hiddenMap]}
              provider={PROVIDER_GOOGLE}
              initialRegion={mapRegion}
              onRegionChangeComplete={throttledHandleMapRegionChange}
              onPress={handleMapPress}
              onMapReady={handleMapReady}
              showsUserLocation={true}
              showsMyLocationButton={false}
              customMapStyle={isDark ? getMapTheme() : []}
              // ✅ CRITICAL PERFORMANCE OPTIMIZATIONS
              cacheEnabled={false}
              liteMode={false}
              zoomEnabled={true}
              scrollEnabled={true}
              rotateEnabled={false}
              pitchEnabled={false}
              showsCompass={false}
              showsScale={false}
              showsBuildings={false}
              showsTraffic={false}
              showsIndoors={false}
              // showsPointsOfInterest={false}
              loadingEnabled={true}
              loadingIndicatorColor={isDark ? '#666666' : '#4285F4'}
              loadingBackgroundColor={isDark ? '#1a1a1a' : '#ffffff'}
              minZoomLevel={5}
              maxZoomLevel={18}
              moveOnMarkerPress={false}
              toolbarEnabled={false}
            >
              <DraggableMarker />
            </MapView>

            <View style={styles.locationButtonsContainer}>
              <ThemeButton
                onPress={getCurrentLocation}
                disabled={isGettingLocation}
                style={getLocationButtonStyle()}
              >
                {isGettingLocation ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons name="my-location" size={22} color="#fff" />
                )}
              </ThemeButton>
            </View>
          </View>

          <View style={dynamicStyles.selectedLocationInfo}>
            {selectedMapLocation ? (
              <>
                <View style={styles.selectedLocationHeader}>
                  <MaterialIcons
                    name="place"
                    size={18}
                    color={isDark ? '#4CAF50' : '#4285F4'}
                  />
                  <Text style={dynamicStyles.selectedLocationTitle}>
                    Selected Location
                  </Text>
                </View>

                <Text
                  style={dynamicStyles.selectedAddressText}
                  numberOfLines={2}
                >
                  {selectedMapLocation.address}
                </Text>

                <View style={styles.selectedCoordinatesContainer}>
                  <Text style={dynamicStyles.selectedCoordinateText}>
                    📍 Lat: {selectedMapLocation.latitude.toFixed(6)}
                    {'  '}Lng: {selectedMapLocation.longitude.toFixed(6)}
                  </Text>
                </View>
              </>
            ) : (
              <View style={dynamicStyles.noLocationSelected}>
                <MaterialIcons
                  name="touch-app"
                  size={24}
                  color={isDark ? '#555' : '#ddd'}
                />
                <Text style={dynamicStyles.noLocationSelectedText}>
                  Tap on the map to select location
                </Text>
              </View>
            )}
          </View>

          <View style={dynamicStyles.actionButtons}>
            <ThemeButton
              onPress={confirmMapLocation}
              disabled={!selectedMapLocation || isGettingLocation}
              style={getConfirmButtonStyle()}
            >
              {isGettingLocation ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={dynamicStyles.confirmButtonText}>
                  Select Location
                </Text>
              )}
            </ThemeButton>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// ✅ Static styles (theme-independent)
const styles = StyleSheet.create({
  modalTitleContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  modalCloseButton: {
    padding: 4,
  },
  mapContainer: {
    flex: 1,
    position: 'relative' as const,
  },
  map: {
    flex: 1,
    width: '100%',
  },
  hiddenMap: {
    opacity: 0,
    position: 'absolute' as const,
  },
  draggableMarker: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  currentLocationButton: {
    backgroundColor: '#4285F4',
  },
  locationButtonsContainer: {
    position: 'absolute' as const,
    bottom: 20,
    right: 20,
    flexDirection: 'column' as const,
    gap: 10,
  },
  selectedLocationHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  selectedCoordinatesContainer: {
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});

export default MapSelectionModal;
