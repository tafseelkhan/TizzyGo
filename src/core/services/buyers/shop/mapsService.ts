// src/services/mapsService.ts
import { Alert, Linking } from 'react-native';
import { getGoogleMapsUrl, hasValidCoordinates } from '../../../utils/buyers/shop/mapUtils';

export interface OpenMapsOptions {
  latitude: number;
  longitude: number;
  address: string;
  onError?: (error: string) => void;
  onSuccess?: () => void;
}

class MapsService {
  /**
   * Open location in Google Maps app
   */
  async openInGoogleMaps(options: OpenMapsOptions): Promise<boolean> {
    const { latitude, longitude, address, onError, onSuccess } = options;

    if (!hasValidCoordinates(latitude, longitude)) {
      const errorMsg = 'No coordinates available for this address';
      if (onError) {
        onError(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
      return false;
    }

    try {
      const url = getGoogleMapsUrl(latitude, longitude, address);
      await Linking.openURL(url);

      if (onSuccess) {
        onSuccess();
      }
      return true;
    } catch (error) {
      console.error('Error opening maps:', error);
      const errorMsg = 'Could not open maps app';
      if (onError) {
        onError(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
      return false;
    }
  }

  /**
   * Get deep link for Google Maps
   */
  getMapsDeepLink(
    latitude: number,
    longitude: number,
    address: string,
  ): string {
    return getGoogleMapsUrl(latitude, longitude, address);
  }

  /**
   * Check if coordinates are valid for display
   */
  canDisplayMap(latitude: number | null, longitude: number | null): boolean {
    return hasValidCoordinates(latitude, longitude);
  }

  /**
   * Validate and get coordinates safely
   */
  getSafeCoordinates(
    latitude: number | null,
    longitude: number | null,
  ): {
    latitude: number;
    longitude: number;
    isValid: boolean;
  } {
    const isValid = hasValidCoordinates(latitude, longitude);
    return {
      latitude: isValid ? latitude! : 0,
      longitude: isValid ? longitude! : 0,
      isValid,
    };
  }
}

export default new MapsService();
