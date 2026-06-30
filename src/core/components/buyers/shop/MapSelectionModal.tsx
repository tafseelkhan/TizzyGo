// src/components/MapSelectionModal.tsx - WITH LIVE GPS TRACKING
import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  PermissionsAndroid,
  Linking,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../contexts/theme/ThemeContext';
import { useLocation } from '../../../hooks/useLocations';
import { getMapThemeAPI } from '../../../../api/constants/googleMapsApi';
import * as locationUtils from '../../../utils/buyers/shop/locationUtils';
import { CheckoutData, ShippingAddress } from '../../../types/ShopTypes';
import GetLocation from 'react-native-get-location';

const { width, height } = Dimensions.get('window');

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

interface ThemeButtonProps {
  onPress: () => void;
  style?: any;
  textStyle?: any;
  children: React.ReactNode;
  disabled?: boolean;
}

// ThemeButton Component
const ThemeButton: React.FC<ThemeButtonProps> = ({
  onPress,
  style,
  children,
  disabled = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const { isDark } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
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

// Draggable Marker Component
const DraggableMarker: React.FC<{
  latitude: number;
  longitude: number;
  onDragEnd: (lat: number, lng: number) => void;
  isDark: boolean;
}> = React.memo(({ latitude, longitude, onDragEnd, isDark }) => {
  return (
    <Marker
      coordinate={{ latitude, longitude }}
      draggable
      onDragEnd={async e => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        onDragEnd(latitude, longitude);
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

const MapSelectionModal: React.FC<MapSelectionModalProps> = ({
  visible,
  onClose,
  shippingAddress,
  updateCheckoutData,
  updateShippingAddress,
}) => {
  const { isDark, theme } = useTheme();
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapKey, setMapKey] = useState(Date.now());
  const [isGettingLiveLocation, setIsGettingLiveLocation] = useState(false);
  const [liveLocationInterval, setLiveLocationInterval] = useState<ReturnType<
    typeof setInterval
  > | null>(null);
  const [userMarkerPosition, setUserMarkerPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const mapRef = useRef<MapView>(null);

  const {
    isGettingLocation,
    selectedLocation,
    mapRegion,
    getCurrentLocation,
    updateLocationFromCoordinates,
    handleRegionChange,
    isLocationSelected,
    setMapRegion,
  } = useLocation({
    initialLatitude: shippingAddress.latitude,
    initialLongitude: shippingAddress.longitude,
    initialAddress: shippingAddress.address,
  });

  // Request location permissions for Android
  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const fineGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'App needs access to your location to show on map',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          },
        );
        return fineGranted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        console.error('Permission error:', error);
        return false;
      }
    }
    return true;
  };

  // Get current GPS location using react-native-get-location
  const getCurrentGpsLocation = async (): Promise<{
    lat: number;
    lng: number;
  } | null> => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable location permission to use this feature',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return null;
      }

      const location = await GetLocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      });

      if (location && location.latitude !== 0 && location.longitude !== 0) {
        return { lat: location.latitude, lng: location.longitude };
      }
      return null;
    } catch (error: any) {
      console.error('Get location error:', error);
      if (error.message?.includes('timeout')) {
        Alert.alert('Timeout', 'Unable to get location. Please try again.');
      }
      return null;
    }
  };

  // Start live location tracking when modal opens
  const startLiveLocationTracking = useCallback(async () => {
    if (liveLocationInterval) {
      clearInterval(liveLocationInterval);
    }

    // Get initial location immediately
    const initialLocation = await getCurrentGpsLocation();
    if (initialLocation) {
      setUserMarkerPosition({
        latitude: initialLocation.lat,
        longitude: initialLocation.lng,
      });

      // Animate map to user's location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: initialLocation.lat,
          longitude: initialLocation.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    }

    // Set interval to get location every 5 seconds
    const interval = setInterval(async () => {
      const location = await getCurrentGpsLocation();
      if (location) {
        setUserMarkerPosition({
          latitude: location.lat,
          longitude: location.lng,
        });

        // Optionally update map region to follow user
        if (mapRef.current && !isDraggingMap) {
          mapRef.current.animateToRegion({
            latitude: location.lat,
            longitude: location.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      }
    }, 5000); // Update every 5 seconds

    setLiveLocationInterval(interval);
  }, []);

  // Stop live location tracking
  const stopLiveLocationTracking = useCallback(() => {
    if (liveLocationInterval) {
      clearInterval(liveLocationInterval);
      setLiveLocationInterval(null);
    }
  }, [liveLocationInterval]);

  // Track if user is dragging map
  const [isDraggingMap, setIsDraggingMap] = useState(false);

  // Reset on modal open
  useEffect(() => {
    if (visible) {
      setIsMapReady(false);
      setMapKey(Date.now());
      setIsDraggingMap(false);

      if (shippingAddress.latitude && shippingAddress.longitude) {
        setMapRegion(
          locationUtils.createMapRegion(
            shippingAddress.latitude,
            shippingAddress.longitude,
            0.01,
            0.01,
          ),
        );
      }

      // Start live location tracking when modal opens
      startLiveLocationTracking();
    } else {
      // Stop tracking when modal closes
      stopLiveLocationTracking();
    }

    return () => {
      stopLiveLocationTracking();
    };
  }, [visible, shippingAddress]);

  const handleMapPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    await updateLocationFromCoordinates(
      coordinate.latitude,
      coordinate.longitude,
    );
  };

  const handleMarkerDragEnd = async (latitude: number, longitude: number) => {
    await updateLocationFromCoordinates(latitude, longitude);
  };

  const handleRegionChangeStart = () => {
    setIsDraggingMap(true);
  };

  const handleRegionChangeComplete = (region: any) => {
    setIsDraggingMap(false);
    handleRegionChange(region);
  };

  const confirmMapLocation = async () => {
    if (!isLocationSelected()) {
      Alert.alert('Error', 'Please select a location on the map');
      return;
    }

    try {
      const updatedAddress: ShippingAddress = {
        address: selectedLocation!.address,
        latitude: selectedLocation!.latitude,
        longitude: selectedLocation!.longitude,
        googlePlaceId: selectedLocation!.placeId || '',
      };

      if (updateCheckoutData) {
        updateCheckoutData('shippingAddress', updatedAddress);
      } else {
        updateShippingAddress('address', updatedAddress.address);
        updateShippingAddress('latitude', updatedAddress.latitude);
        updateShippingAddress('longitude', updatedAddress.longitude);
        updateShippingAddress('googlePlaceId', updatedAddress.googlePlaceId);
      }

      onClose();
    } catch (error) {
      console.error('Error confirming location:', error);
      Alert.alert('Error', 'Failed to select location');
    }
  };

  const handleClose = () => {
    stopLiveLocationTracking();
    onClose();
  };

  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
  }, []);

  // Handle manual location button click
  const handleGetCurrentLocation = async () => {
    setIsGettingLiveLocation(true);
    const location = await getCurrentGpsLocation();
    if (location) {
      setUserMarkerPosition({
        latitude: location.lat,
        longitude: location.lng,
      });

      // Update selected location
      await updateLocationFromCoordinates(location.lat, location.lng);

      // Animate map to user's location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    }
    setIsGettingLiveLocation(false);
  };

  // Dynamic styles
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
      fontSize: 13,
      fontWeight: '400',
      color: isDark ? '#fff' : '#333',
    },
    instructions: {
      padding: 12,
      backgroundColor: isDark ? '#2d2d2d' : '#f8f9fa',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#404040' : '#e0e0e0',
    },
    instructionText: {
      fontSize: 12,
      fontWeight: 300,
      color: isDark ? '#aaa' : '#666',
      textAlign: 'center',
    },
    mapLoadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
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
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#4CAF50' : '#4285F4',
      shadowColor: '#000',
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
      fontWeight: '600',
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
      textAlign: 'center',
      padding: 8,
      backgroundColor: isDark ? '#2d2d2d' : '#f8f9fa',
      borderRadius: 6,
    },
    noLocationSelected: {
      alignItems: 'center',
      padding: 20,
    },
    noLocationSelectedText: {
      fontSize: 14,
      color: isDark ? '#777' : '#999',
      textAlign: 'center',
      marginTop: 10,
    },
    actionButtons: {
      flexDirection: 'row',
      padding: 16,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333' : '#f0f0f0',
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
    },
    confirmButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 100,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        isLocationSelected() && !isGettingLocation
          ? '#2ecc71'
          : isDark
          ? '#404040'
          : '#bdc3c7',
      opacity: isLocationSelected() && !isGettingLocation ? 1 : 0.7,
    },
    confirmButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#fff',
    },
  });

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
          {/* Header */}
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

          {/* Instructions */}
          <View style={dynamicStyles.instructions}>
            <Text style={dynamicStyles.instructionText}>
              📍 Your live location updates every 5 seconds • Tap anywhere on
              the map to set your delivery location
            </Text>
          </View>

          {/* Map Container */}
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
              key={`map-${mapKey}-${theme}`}
              ref={mapRef}
              style={[styles.map, !isMapReady && styles.hiddenMap]}
              provider={PROVIDER_GOOGLE}
              initialRegion={mapRegion}
              region={mapRegion}
              onRegionChangeStart={handleRegionChangeStart}
              onRegionChangeComplete={handleRegionChangeComplete}
              onPress={handleMapPress}
              onMapReady={handleMapReady}
              showsUserLocation={true}
              showsMyLocationButton={false}
              customMapStyle={getMapThemeAPI(isDark)}
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
              loadingEnabled={true}
              loadingIndicatorColor={isDark ? '#666666' : '#4285F4'}
              loadingBackgroundColor={isDark ? '#1a1a1a' : '#ffffff'}
              minZoomLevel={5}
              maxZoomLevel={18}
              moveOnMarkerPress={false}
              toolbarEnabled={false}
            >
              {/* User's live location marker */}
              {userMarkerPosition && (
                <Marker
                  coordinate={userMarkerPosition}
                  title="Your Location"
                  description="Current GPS location"
                ></Marker>
              )}

              {/* Selected location marker (draggable) */}
              {selectedLocation && (
                <DraggableMarker
                  latitude={selectedLocation.latitude}
                  longitude={selectedLocation.longitude}
                  onDragEnd={handleMarkerDragEnd}
                  isDark={isDark}
                />
              )}
            </MapView>

            {/* Location Button */}
            <View style={styles.locationButtonsContainer}>
              <ThemeButton
                onPress={handleGetCurrentLocation}
                disabled={isGettingLiveLocation}
                style={dynamicStyles.locationButton}
              >
                {isGettingLiveLocation ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons name="my-location" size={22} color="#fff" />
                )}
              </ThemeButton>
            </View>
          </View>

          {/* Selected Location Info */}
          <View style={dynamicStyles.selectedLocationInfo}>
            {selectedLocation ? (
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
                  {locationUtils.getAddressDisplayText(
                    selectedLocation.address,
                  )}
                </Text>
                <View style={styles.selectedCoordinatesContainer}>
                  <Text style={dynamicStyles.selectedCoordinateText}>
                    {locationUtils.formatCoordinate(
                      selectedLocation.latitude,
                      selectedLocation.longitude,
                    )}
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
                  Tap on map or drag the marker to select location
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={dynamicStyles.actionButtons}>
            <ThemeButton
              onPress={confirmMapLocation}
              disabled={!isLocationSelected() || isGettingLocation}
              style={dynamicStyles.confirmButton}
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

// Static styles
const styles = StyleSheet.create({
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalCloseButton: {
    padding: 4,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  hiddenMap: {
    opacity: 0,
    position: 'absolute',
  },
  draggableMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationButtonsContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'column',
    gap: 10,
  },
  selectedLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  selectedCoordinatesContainer: {
    marginBottom: 16,
  },
});

export default MapSelectionModal;
