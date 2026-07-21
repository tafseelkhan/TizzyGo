// utils/location/locationHelper.ts

import { Platform, Alert } from 'react-native';
import GetLocation from 'react-native-get-location';
import { PermissionsAndroid } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
}

export const requestLocationPermission = async (): Promise<boolean> => {
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
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};

export const fetchCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    })
      .then((location: { latitude: number; longitude: number }) => {
        resolve({
          latitude: location.latitude,
          longitude: location.longitude,
        });
      })
      .catch((error: Error) => {
        reject(error);
      });
  });
};
