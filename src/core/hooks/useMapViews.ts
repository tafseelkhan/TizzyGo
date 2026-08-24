// src/hooks/useMapView.ts
import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { MapViewController } from '@googlemaps/react-native-navigation-sdk';
import mapsService from '../services/buyers/shop/mapsService';
import { getMapRegion, hasValidCoordinates } from '../utils/buyers/shop/mapUtils';
import { ShippingAddress } from '../types/ShopTypes';

interface UseMapViewProps {
  shippingAddress: ShippingAddress;
  onClose?: () => void;
}

interface UseMapViewReturn {
  isMapReady: boolean;
  mapControllerRef: React.MutableRefObject<MapViewController | null>;
  hasCoordinates: boolean;
  cameraPosition: {
    target: {
      lat: number;
      lng: number;
    };
    zoom: number;
  };
  handleMapReady: (controller: MapViewController) => void;
  handleClose: () => void;
  openInGoogleMaps: () => Promise<void>;
  formatCoordinate: (value: number | null) => string;
}

export const useMapView = ({
  shippingAddress,
  onClose,
}: UseMapViewProps): UseMapViewReturn => {
  const [isMapReady, setIsMapReady] = useState(false);
  const mapControllerRef = useRef<MapViewController | null>(null);

  const hasCoordinates = hasValidCoordinates(
    shippingAddress.latitude,
    shippingAddress.longitude,
  );

  const cameraPosition = {
    target: {
      lat: shippingAddress.latitude ?? 28.6139,
      lng: shippingAddress.longitude ?? 77.209,
    },
    zoom: 15,
  };

  const handleMapReady = useCallback((controller: MapViewController) => {
    mapControllerRef.current = controller;
    setIsMapReady(true);
    
    // Add marker at the location if coordinates exist
    if (hasCoordinates && shippingAddress.latitude && shippingAddress.longitude) {
      controller.addMarker({
        id: 'location-marker',
        position: {
          lat: shippingAddress.latitude,
          lng: shippingAddress.longitude,
        },
        title: 'Location',
        snippet: shippingAddress.address || 'Selected Location',
        draggable: false,
      });
    }
  }, [hasCoordinates, shippingAddress]);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const openInGoogleMaps = useCallback(async () => {
    if (!hasCoordinates) {
      Alert.alert('Error', 'No coordinates available for this address');
      return;
    }

    await mapsService.openInGoogleMaps({
      latitude: shippingAddress.latitude!,
      longitude: shippingAddress.longitude!,
      address: shippingAddress.address,
    });
  }, [hasCoordinates, shippingAddress]);

  const formatCoordinateValue = useCallback((value: number | null): string => {
    if (value === null || isNaN(value)) return 'N/A';
    return value.toFixed(6);
  }, []);

  return {
    isMapReady,
    mapControllerRef,
    hasCoordinates,
    cameraPosition,
    handleMapReady,
    handleClose,
    openInGoogleMaps,
    formatCoordinate: formatCoordinateValue,
  };
};