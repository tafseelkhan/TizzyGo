// src/hooks/useMapView.ts - Alternative version
import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import MapView from 'react-native-maps';
import mapsService from '../services/buyers/shop/mapsService';
import { getMapRegion, hasValidCoordinates } from '../utils/buyers/shop/mapUtils';
import { ShippingAddress } from '../types/ShopTypes';

interface UseMapViewProps {
  shippingAddress: ShippingAddress;
  onClose?: () => void;
}

interface UseMapViewReturn {
  isMapReady: boolean;
  // ✅ Option 2: Use MutableRefObject for non-null assertion
  mapRef: React.MutableRefObject<MapView | null>;
  hasCoordinates: boolean;
  mapRegion: ReturnType<typeof getMapRegion>;
  handleMapReady: () => void;
  handleClose: () => void;
  openInGoogleMaps: () => Promise<void>;
  formatCoordinate: (value: number | null) => string;
}

export const useMapView = ({
  shippingAddress,
  onClose,
}: UseMapViewProps): UseMapViewReturn => {
  const [isMapReady, setIsMapReady] = useState(false);
  // ✅ This returns MutableRefObject<MapView | null>
  const mapRef = useRef<MapView | null>(null);

  const hasCoordinates = hasValidCoordinates(
    shippingAddress.latitude,
    shippingAddress.longitude,
  );

  const mapRegion = getMapRegion(
    shippingAddress.latitude,
    shippingAddress.longitude,
  );

  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
  }, []);

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
    mapRef,
    hasCoordinates,
    mapRegion,
    handleMapReady,
    handleClose,
    openInGoogleMaps,
    formatCoordinate: formatCoordinateValue,
  };
};
