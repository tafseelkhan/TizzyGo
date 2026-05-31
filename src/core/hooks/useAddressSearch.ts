// src/hooks/useAddressSearch.ts
import { useState, useCallback, useRef } from 'react';
import { Alert, Keyboard } from 'react-native';
import addressService from '../services/shop/addressService';
import { PlacePrediction } from '../services/shop/addressService';
import { ShippingAddress, CheckoutData } from '../types/ShopTypes';

interface UseAddressSearchProps {
  onAddressSelected?: (address: ShippingAddress) => void;
  // ✅ Fix: Use keyof CheckoutData instead of string
  updateCheckoutData?: (key: keyof CheckoutData, value: any) => void;
  updateShippingAddress?: (field: keyof ShippingAddress, value: any) => void;
}

export const useAddressSearch = ({
  onAddressSelected,
  updateCheckoutData,
  updateShippingAddress,
}: UseAddressSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);

  // ✅ Fix timeout ref type
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowResultsModal(false);
      return;
    }

    try {
      setIsSearching(true);
      const results = await addressService.searchAddresses(query);
      setSearchResults(results);
      setShowResultsModal(results.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search addresses');
      setSearchResults([]);
      setShowResultsModal(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }

      searchTimeoutRef.current = setTimeout(() => {
        searchAddress(text);
      }, 500);
    },
    [searchAddress],
  );

  const selectAddress = useCallback(
    async (placeId: string, address: string) => {
      try {
        setIsSearching(true);
        setShowResultsModal(false);
        Keyboard.dismiss();

        const placeDetails = await addressService.getPlaceDetails(placeId);

        if (placeDetails) {
          const fullAddress = placeDetails.formatted_address;
          setSearchQuery(fullAddress);

          const updatedAddress: ShippingAddress = {
            address: fullAddress,
            latitude: placeDetails.latitude,
            longitude: placeDetails.longitude,
            googlePlaceId: placeId,
          };

          if (updateCheckoutData) {
            updateCheckoutData('shippingAddress', updatedAddress);
          } else if (updateShippingAddress) {
            updateShippingAddress('address', fullAddress);
            updateShippingAddress('latitude', placeDetails.latitude);
            updateShippingAddress('longitude', placeDetails.longitude);
            updateShippingAddress('googlePlaceId', placeId);
          }

          onAddressSelected?.(updatedAddress);
        }
      } catch (error) {
        console.error('Select address error:', error);
        Alert.alert('Error', 'Failed to fetch address details');
      } finally {
        setIsSearching(false);
      }
    },
    [updateCheckoutData, updateShippingAddress, onAddressSelected],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResultsModal(false);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  }, []);

  return {
    searchQuery,
    searchResults,
    isSearching,
    showResultsModal,
    setShowResultsModal,
    handleSearchChange,
    selectAddress,
    clearSearch,
  };
};
