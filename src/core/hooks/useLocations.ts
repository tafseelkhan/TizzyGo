// src/hooks/useLocation.ts
import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { Region } from 'react-native-maps';
import locationService from '../services/buyers/shop/locationService';
import { createMapRegion, isValidCoordinates, getDefaultRegion } from '../utils/buyers/shop/locationUtils';
import { THROTTLE_DELAY } from '../../api/constants/mapConfig';
import { throttle } from '../utils/buyers/shop/throttle';

interface UseLocationProps {
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  initialAddress?: string;
}

interface SelectedLocation {
  latitude: number;
  longitude: number;
  address: string;
  placeId?: string;
}

export const useLocation = ({
  initialLatitude,
  initialLongitude,
  initialAddress,
}: UseLocationProps = {}) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(getDefaultRegion());

  // Initialize with existing address if available
  useEffect(() => {
    if (
      initialLatitude &&
      initialLongitude &&
      isValidCoordinates(initialLatitude, initialLongitude)
    ) {
      const region = createMapRegion(initialLatitude, initialLongitude, 0.01, 0.01);
      setMapRegion(region);
      setSelectedLocation({
        latitude: initialLatitude,
        longitude: initialLongitude,
        address: initialAddress || '',
      });
    }
  }, [initialLatitude, initialLongitude, initialAddress]);

  /**
   * Get current device location
   */
  const getCurrentLocation = useCallback(async () => {
    try {
      setIsGettingLocation(true);
      const location = await locationService.getCurrentLocation();
      
      setSelectedLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        placeId: location.placeId,
      });
      
      setMapRegion(createMapRegion(location.latitude, location.longitude, 0.01, 0.01));
      
      return location;
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to get current location');
      return null;
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  /**
   * Update location from map coordinates
   */
  const updateLocationFromCoordinates = useCallback(async (
    latitude: number,
    longitude: number
  ) => {
    try {
      setIsGettingLocation(true);
      const result = await locationService.reverseGeocode(latitude, longitude);
      
      setSelectedLocation({
        latitude,
        longitude,
        address: result.formatted_address,
        placeId: result.place_id,
      });
      
      return {
        latitude,
        longitude,
        address: result.formatted_address,
        placeId: result.place_id,
      };
    } catch (error) {
      console.error('Update location error:', error);
      setSelectedLocation({
        latitude,
        longitude,
        address: `Location at ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      });
      return null;
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  /**
   * Throttled map region change handler
   */
  const handleRegionChange = useCallback(
    throttle((region: Region) => {
      setMapRegion(region);
    }, THROTTLE_DELAY),
    []
  );

  /**
   * Reset location
   */
  const resetLocation = useCallback(() => {
    setSelectedLocation(null);
    setMapRegion(getDefaultRegion());
  }, []);

  /**
   * Validate if location is selected
   */
  const isLocationSelected = useCallback((): boolean => {
    return selectedLocation !== null && isValidCoordinates(
      selectedLocation.latitude,
      selectedLocation.longitude
    );
  }, [selectedLocation]);

  return {
    isGettingLocation,
    selectedLocation,
    mapRegion,
    getCurrentLocation,
    updateLocationFromCoordinates,
    handleRegionChange,
    resetLocation,
    isLocationSelected,
    setMapRegion,
  };
};