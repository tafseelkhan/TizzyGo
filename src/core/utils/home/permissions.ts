// src/utils/home/permissions.ts - COMPLETE FIXED VERSION

import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import GetLocation from 'react-native-get-location';

// ============================================================
// MUTEX - Prevent concurrent location requests
// ============================================================
let isLocationRequestInProgress = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // Minimum 2 seconds between requests

// ============================================================
// ONLY FOREGROUND location permission (NO BACKGROUND)
// ============================================================
export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'App needs access to your location to set delivery address',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  }
  return true;
};

// Check if location permission is granted
export const checkLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return granted;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }
  return true;
};

// Show permission denied alert
export const showPermissionDeniedAlert = () => {
  Alert.alert(
    'Permission Required',
    'Please enable location permission to use this feature',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ],
  );
};

// ============================================================
// ✅ FIXED: Get current GPS location with Mutex
// ============================================================
export const getCurrentGpsLocation = async (): Promise<{
  lat: number;
  lng: number;
} | null> => {
  // ✅ Check if another request is already in progress
  if (isLocationRequestInProgress) {
    console.log('⚠️ [GPS] Location request already in progress, skipping...');
    return null;
  }

  // ✅ Rate limiting - prevent too frequent requests
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(
      `⏳ [GPS] Rate limiting: Waiting ${waitTime}ms before next request...`,
    );
    await new Promise<void>(resolve => setTimeout(() => resolve(), waitTime));
  }

  // ✅ Acquire lock
  isLocationRequestInProgress = true;
  lastRequestTime = Date.now();

  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      showPermissionDeniedAlert();
      return null;
    }

    console.log('📍 [GPS] Getting current location...');

    const location = await GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    });

    if (location && location.latitude !== 0 && location.longitude !== 0) {
      console.log(
        `✅ [GPS] Location found: ${location.latitude.toFixed(
          6,
        )}, ${location.longitude.toFixed(6)}`,
      );
      return { lat: location.latitude, lng: location.longitude };
    }

    console.log('❌ [GPS] Invalid location received (0,0)');
    return null;
  } catch (error: any) {
    console.error('❌ [GPS] Get location error:', error);

    if (error.message?.includes('timeout')) {
      Alert.alert('Timeout', 'Unable to get location. Please try again.');
    } else if (error.message?.includes('CANCELLED')) {
      // This is expected when multiple requests happen - don't show alert
      console.log(
        '⚠️ [GPS] Location request was cancelled (another request was in progress)',
      );
    } else if (error.message?.includes('denied')) {
      Alert.alert(
        'Permission Denied',
        'Please enable location permission in settings.',
      );
    }

    return null;
  } finally {
    // ✅ Release lock
    isLocationRequestInProgress = false;
    console.log('🔓 [GPS] Location lock released');
  }
};

// ============================================================
// Optional: Force get location (bypasses mutex - use carefully)
// ============================================================
export const forceGetCurrentGpsLocation = async (): Promise<{
  lat: number;
  lng: number;
} | null> => {
  // Force reset lock
  isLocationRequestInProgress = false;

  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      showPermissionDeniedAlert();
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
    console.error('Force get location error:', error);
    return null;
  }
};

// ============================================================
// Check if location request is currently in progress
// ============================================================
export const isLocationRequestActive = (): boolean => {
  return isLocationRequestInProgress;
};
