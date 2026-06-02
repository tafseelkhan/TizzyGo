// src/components/MapSelectionModal.tsx (Refactored)
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
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useLocation } from '../../hooks/useLocations';
import { getMapThemeAPI } from '../../../api/constants/googleMapsApi';
import * as locationUtils from '../../utils/shop/locationUtils';
import { CheckoutData, ShippingAddress } from '../../types/ShopTypes';

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

  // Reset on modal open
  useEffect(() => {
    if (visible) {
      setIsMapReady(false);
      setMapKey(Date.now());

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
    }
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
    onClose();
  };

  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
  }, []);

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
      fontSize: 18,
      fontWeight: '600',
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
              {locationUtils.getInstructionText(isDark)}
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
                <Text style={dynamicStyles.mapLoadingText}>
                  {locationUtils.getMapLoadingText(isDark)}
                </Text>
              </View>
            )}

            <MapView
              key={`map-${mapKey}-${theme}`}
              ref={mapRef}
              style={[styles.map, !isMapReady && styles.hiddenMap]}
              provider={PROVIDER_GOOGLE}
              initialRegion={mapRegion}
              region={mapRegion}
              onRegionChangeComplete={handleRegionChange}
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
                onPress={getCurrentLocation}
                disabled={isGettingLocation}
                style={dynamicStyles.locationButton}
              >
                {isGettingLocation ? (
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
                  {locationUtils.getNoLocationText(isDark)}
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
