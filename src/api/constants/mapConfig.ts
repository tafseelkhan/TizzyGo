// src/constants/mapConfig.ts
import { Config } from 'react-native-config';

export const GOOGLE_API_KEY = Config.GOOGLE_SERVICES_ACCOUNT_KEY;
export const MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';
export const DEFAULT_LOCATION = {
  latitude: 28.6139,
  longitude: 77.209,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};
export const VIEW_MAP_DEFAULTS = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
  loadingDelay: 500,
};
export const LOCATION_TIMEOUT = 15000;
export const LOCATION_MAX_AGE = 10000;
export const THROTTLE_DELAY = 500;
