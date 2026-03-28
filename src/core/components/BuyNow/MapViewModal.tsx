// components/MapViewModal.tsx
import React, { useState, useRef, useCallback, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  Linking,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { ShippingAddress } from '../../types/BuyNowTypes';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface MapViewModalProps {
  visible: boolean;
  onClose: () => void;
  shippingAddress: ShippingAddress;
}

// ✅ Custom Button Props Interface
interface ThemeButtonProps {
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  children: ReactNode;
  disabled?: boolean;
}

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

const MapViewModal: React.FC<MapViewModalProps> = ({
  visible,
  onClose,
  shippingAddress,
}) => {
  const { isDark, resolvedTheme, theme } = useTheme();
  const [isMapReady, setIsMapReady] = useState(false);
  const viewMapRef = useRef<MapView>(null);

  // ✅ FIXED: Check for valid number coordinates
  const hasCoordinates =
    shippingAddress.latitude !== null &&
    shippingAddress.longitude !== null &&
    !isNaN(shippingAddress.latitude) &&
    !isNaN(shippingAddress.longitude);

  const mapRegion: Region = hasCoordinates
    ? {
        latitude: shippingAddress.latitude!,
        longitude: shippingAddress.longitude!,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 28.6139,
        longitude: 77.209,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  // ✅ FIXED: Open in Google Maps with proper coordinate handling
  const openInGoogleMaps = () => {
    if (!hasCoordinates) {
      Alert.alert('Error', 'No coordinates available for this address');
      return;
    }

    const lat = shippingAddress.latitude!;
    const lng = shippingAddress.longitude!;
    const label = encodeURIComponent(shippingAddress.address);

    const url = Platform.select({
      ios: `maps://?q=${label}&ll=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });

    Linking.openURL(url!).catch(err => {
      console.error('Error opening maps:', err);
      Alert.alert('Error', 'Could not open maps app');
    });
  };

  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
  }, []);

  // ✅ Handle close
  const handleClose = () => {
    onClose();
  };

  // ✅ FIXED: Helper function to format coordinates
  const formatCoordinate = (value: number | null): string => {
    if (value === null || isNaN(value)) return 'N/A';
    return value.toFixed(6);
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
      height: height * 0.85,
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
    mapContainer: {
      flex: 1,
      position: 'relative' as const,
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
    infoContainer: {
      padding: 16,
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333' : '#f0f0f0',
    },
    addressText: {
      flex: 1,
      fontSize: 14,
      color: isDark ? '#ddd' : '#333',
      lineHeight: 20,
    },
    coordinateItem: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      backgroundColor: isDark ? '#2d2d2d' : '#f8f9fa',
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#404040' : '#e0e0e0',
    },
    coordinateText: {
      fontSize: 12,
      color: isDark ? '#aaa' : '#666',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    actionButtons: {
      padding: 16,
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333' : '#f0f0f0',
    },
    primaryButton: {
      backgroundColor: isDark ? '#4285F4' : '#4285F4',
    },
    actionButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '600' as const,
    },
    noMapContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: 40,
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
    },
    noMapText: {
      fontSize: 16,
      color: isDark ? '#ccc' : '#666',
      fontWeight: '600' as const,
      marginTop: 20,
      marginBottom: 8,
      textAlign: 'center' as const,
    },
    noMapSubtext: {
      fontSize: 14,
      color: isDark ? '#999' : '#999',
      textAlign: 'center' as const,
      lineHeight: 20,
    },
  });

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

  // ✅ Get dynamic button style
  const getPrimaryButtonStyle = () => {
    const baseStyle = [
      styles.actionButton,
      dynamicStyles.primaryButton,
    ] as ViewStyle[];

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
                name="map"
                size={22}
                color={isDark ? '#4CAF50' : '#333'}
              />
              <Text style={dynamicStyles.modalTitle}>Location on Map</Text>
            </View>
            <ThemeButton onPress={handleClose} style={styles.modalCloseButton}>
              <MaterialIcons
                name="close"
                size={24}
                color={isDark ? '#aaa' : '#666'}
              />
            </ThemeButton>
          </View>

          {hasCoordinates ? (
            <View style={dynamicStyles.mapContainer}>
              {!isMapReady && (
                <View style={dynamicStyles.mapLoadingContainer}>
                  <ActivityIndicator
                    size="large"
                    color={isDark ? '#4CAF50' : '#4285F4'}
                  />
                  <Text style={dynamicStyles.mapLoadingText}>
                    Loading map...
                  </Text>
                </View>
              )}

              <MapView
                key={`view-map-${theme}`} // Re-render map on theme change
                ref={viewMapRef}
                style={[styles.map, !isMapReady && styles.hiddenMap]}
                provider={PROVIDER_GOOGLE}
                initialRegion={mapRegion}
                onMapReady={handleMapReady}
                customMapStyle={isDark ? getMapTheme() : []}
                // ✅ PERFORMANCE OPTIMIZATIONS FOR VIEW-ONLY MAP
                cacheEnabled={false}
                liteMode={false}
                zoomEnabled={true}
                scrollEnabled={true}
                rotateEnabled={true}
                pitchEnabled={true}
                showsCompass={true}
                showsScale={true}
                showsUserLocation={false}
                showsMyLocationButton={false}
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
                <Marker
                  coordinate={{
                    latitude: shippingAddress.latitude!,
                    longitude: shippingAddress.longitude!,
                  }}
                  title="Delivery Location"
                  description={shippingAddress.address}
                  tracksViewChanges={false}
                >
                  <View style={styles.customMarker}>
                    <MaterialIcons
                      name="location-pin"
                      size={30}
                      color={isDark ? '#4CAF50' : '#e74c3c'}
                    />
                  </View>
                </Marker>
              </MapView>

              <View style={dynamicStyles.infoContainer}>
                <View style={styles.addressContainer}>
                  <MaterialIcons
                    name="place"
                    size={16}
                    color={isDark ? '#4CAF50' : '#4285F4'}
                  />
                  <Text style={dynamicStyles.addressText} numberOfLines={2}>
                    {shippingAddress.address}
                  </Text>
                </View>

                <View style={styles.coordinatesContainer}>
                  <View style={dynamicStyles.coordinateItem}>
                    <MaterialIcons
                      name="my-location"
                      size={14}
                      color={isDark ? '#aaa' : '#666'}
                    />
                    <Text style={dynamicStyles.coordinateText}>
                      Lat: {formatCoordinate(shippingAddress.latitude)}
                    </Text>
                  </View>
                  <View style={dynamicStyles.coordinateItem}>
                    <MaterialIcons
                      name="my-location"
                      size={14}
                      color={isDark ? '#aaa' : '#666'}
                    />
                    <Text style={dynamicStyles.coordinateText}>
                      Lng: {formatCoordinate(shippingAddress.longitude)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={dynamicStyles.actionButtons}>
                <ThemeButton
                  onPress={openInGoogleMaps}
                  style={getPrimaryButtonStyle()}
                >
                  <MaterialIcons name="directions" size={18} color="#fff" />
                  <Text style={dynamicStyles.actionButtonText}>
                    Open in Google Maps
                  </Text>
                </ThemeButton>
              </View>
            </View>
          ) : (
            <View style={dynamicStyles.noMapContainer}>
              <MaterialIcons
                name="error-outline"
                size={60}
                color={isDark ? '#555' : '#ddd'}
              />
              <Text style={dynamicStyles.noMapText}>
                No location coordinates available
              </Text>
              <Text style={dynamicStyles.noMapSubtext}>
                Please select an address with valid coordinates
              </Text>
            </View>
          )}
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
  map: {
    flex: 1,
    width: '100%',
  },
  hiddenMap: {
    opacity: 0,
    position: 'absolute' as const,
  },
  customMarker: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  addressContainer: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    marginBottom: 12,
  },
  coordinatesContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 10,
  },
});

export default MapViewModal;
