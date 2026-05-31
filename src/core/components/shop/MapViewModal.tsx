// src/components/MapViewModal.tsx (Refactored)
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useMapView } from '../../hooks/useMapViews';
import { ThemeButton } from '../../colors/inc/ThemeButton';
import {
  getMapTheme,
  getMapLoadingText,
  getNoCoordinatesTitle,
  getNoCoordinatesSubtext,
  getModalTitle,
  getMarkerTitle,
} from '../../utils/shop/mapUtils';
import { ShippingAddress } from '../../types/ShopTypes';

const { width, height } = Dimensions.get('window');

interface MapViewModalProps {
  visible: boolean;
  onClose: () => void;
  shippingAddress: ShippingAddress;
}

const MapViewModal: React.FC<MapViewModalProps> = ({
  visible,
  onClose,
  shippingAddress,
}) => {
  const { isDark, theme } = useTheme();

  const {
    isMapReady,
    mapRef,
    hasCoordinates,
    mapRegion,
    handleMapReady,
    handleClose,
    openInGoogleMaps,
    formatCoordinate,
  } = useMapView({
    shippingAddress,
    onClose,
  });

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
      fontWeight: '600',
      color: isDark ? '#fff' : '#333',
    },
    mapContainer: {
      flex: 1,
      position: 'relative',
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
      flexDirection: 'row',
      alignItems: 'center',
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
      fontWeight: '600',
    },
    noMapContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
    },
    noMapText: {
      fontSize: 16,
      color: isDark ? '#ccc' : '#666',
      fontWeight: '600',
      marginTop: 20,
      marginBottom: 8,
      textAlign: 'center',
    },
    noMapSubtext: {
      fontSize: 14,
      color: isDark ? '#999' : '#999',
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  const getPrimaryButtonStyle = () => {
    return [styles.actionButton, dynamicStyles.primaryButton];
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
          {/* Header */}
          <View style={dynamicStyles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <MaterialIcons
                name="map"
                size={22}
                color={isDark ? '#4CAF50' : '#333'}
              />
              <Text style={dynamicStyles.modalTitle}>
                {getModalTitle(isDark)}
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

          {hasCoordinates ? (
            <View style={dynamicStyles.mapContainer}>
              {/* Loading Overlay */}
              {!isMapReady && (
                <View style={dynamicStyles.mapLoadingContainer}>
                  <ActivityIndicator
                    size="large"
                    color={isDark ? '#4CAF50' : '#4285F4'}
                  />
                  <Text style={dynamicStyles.mapLoadingText}>
                    {getMapLoadingText(isDark)}
                  </Text>
                </View>
              )}

              {/* Map View */}
              <MapView
                key={`view-map-${theme}`}
                ref={mapRef}
                style={[styles.map, !isMapReady && styles.hiddenMap]}
                provider={PROVIDER_GOOGLE}
                initialRegion={mapRegion}
                onMapReady={handleMapReady}
                customMapStyle={getMapTheme(isDark)}
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
                  title={getMarkerTitle()}
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

              {/* Address Info */}
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

              {/* Action Button */}
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
            /* No Coordinates View */
            <View style={dynamicStyles.noMapContainer}>
              <MaterialIcons
                name="error-outline"
                size={60}
                color={isDark ? '#555' : '#ddd'}
              />
              <Text style={dynamicStyles.noMapText}>
                {getNoCoordinatesTitle(isDark)}
              </Text>
              <Text style={dynamicStyles.noMapSubtext}>
                {getNoCoordinatesSubtext(isDark)}
              </Text>
            </View>
          )}
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
  map: {
    flex: 1,
    width: '100%',
  },
  hiddenMap: {
    opacity: 0,
    position: 'absolute',
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 10,
  },
});

export default MapViewModal;
