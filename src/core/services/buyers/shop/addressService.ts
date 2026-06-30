// src/services/addressService.ts
import { GOOGLE_API_KEY } from '../../../../api/constants/mapConfig';

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetails {
  formatted_address: string;
  place_id: string;
  latitude: number;
  longitude: number;
}

class AddressService {
  private static instance: AddressService;
  
  static getInstance(): AddressService {
    if (!AddressService.instance) {
      AddressService.instance = new AddressService();
    }
    return AddressService.instance;
  }

  async searchAddresses(query: string): Promise<PlacePrediction[]> {
    if (query.length < 3) return [];
    
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&language=en&components=country:in`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.predictions) {
        return data.predictions.slice(0, 10);
      }
      return [];
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Failed to search addresses');
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}&language=en`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.result) {
        const result = data.result;
        return {
          formatted_address: result.formatted_address,
          place_id: result.place_id,
          latitude: result.geometry?.location?.lat || 0,
          longitude: result.geometry?.location?.lng || 0,
        };
      }
      return null;
    } catch (error) {
      console.error('Place details error:', error);
      throw new Error('Failed to fetch address details');
    }
  }
}

export default AddressService.getInstance();