// src/services/googlePlacesService.ts - FINAL COMPLETE VERSION
import {
  GOOGLE_API_KEY,
  MAPS_BASE_URL,
  PLACES_API_ENDPOINTS,
} from '../../../../api/constants/mapConfig';

export interface PlaceSuggestion {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

// ✅ Updated PlaceDetails with all address components
export interface PlaceDetails {
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  fullAddressComponents?: any[];
}

// ✅ New interface for reverse geocode result
export interface ReverseGeocodeResult {
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  lat: number;
  lng: number;
}

// Helper to extract address components from Google Places response
const extractAddressComponents = (components: any[]) => {
  let city = '';
  let state = '';
  let country = '';
  let pinCode = '';
  let area = '';

  components?.forEach((component: any) => {
    const types = component.types;
    if (
      types.includes('locality') ||
      types.includes('sublocality') ||
      types.includes('sublocality_level_1')
    ) {
      city = component.long_name;
    }
    if (types.includes('administrative_area_level_1')) {
      state = component.long_name;
    }
    if (types.includes('country')) {
      country = component.long_name;
    }
    if (types.includes('postal_code')) {
      pinCode = component.long_name;
    }
    if (
      types.includes('sublocality_level_2') ||
      types.includes('neighborhood')
    ) {
      area = component.long_name;
    }
  });

  return { city, state, country, pinCode, area };
};

export const googlePlacesService = {
  // Search places autocomplete
  searchPlaces: async (query: string): Promise<PlaceSuggestion[]> => {
    if (!query.trim()) return [];

    try {
      const response = await fetch(
        `${MAPS_BASE_URL}${
          PLACES_API_ENDPOINTS.AUTOCOMPLETE
        }?input=${encodeURIComponent(
          query,
        )}&key=${GOOGLE_API_KEY}&language=en&components=country:in`,
      );
      const data = await response.json();
      return data.predictions || [];
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  },

  // ✅ Get place details with full address components
  getPlaceDetails: async (placeId: string): Promise<PlaceDetails | null> => {
    try {
      const response = await fetch(
        `${MAPS_BASE_URL}${PLACES_API_ENDPOINTS.DETAILS}?place_id=${placeId}&key=${GOOGLE_API_KEY}&language=en`,
      );
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const components = data.result.address_components || [];
        const { city, state, country, pinCode } =
          extractAddressComponents(components);

        return {
          address: data.result.formatted_address,
          lat: data.result.geometry?.location?.lat || 0,
          lng: data.result.geometry?.location?.lng || 0,
          placeId: placeId,
          city: city,
          state: state,
          country: country || 'India',
          pinCode: pinCode,
          fullAddressComponents: components,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  },

  // ✅ Reverse geocode with full address components
  reverseGeocode: async (
    lat: number,
    lng: number,
  ): Promise<ReverseGeocodeResult | null> => {
    try {
      const response = await fetch(
        `${MAPS_BASE_URL}${PLACES_API_ENDPOINTS.GEOCODE}?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}&language=en`,
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const components = result.address_components || [];
        const { city, state, country, pinCode } =
          extractAddressComponents(components);

        return {
          address: result.formatted_address,
          city: city,
          state: state,
          country: country || 'India',
          pinCode: pinCode,
          lat: lat,
          lng: lng,
        };
      }
      return null;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return null;
    }
  },
};
