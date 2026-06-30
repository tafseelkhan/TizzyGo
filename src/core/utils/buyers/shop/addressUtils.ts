// src/utils/addressUtils.ts
import { ShippingAddress } from '../../../types/ShopTypes';

export const createEmptyAddress = (): ShippingAddress => ({
  address: '',
  latitude: null,
  longitude: null,
  googlePlaceId: '',
});

export const isAddressEmpty = (address: ShippingAddress): boolean => {
  return !address.address || address.address.trim() === '';
};

export const hasCoordinates = (address: ShippingAddress): boolean => {
  return (
    address.latitude !== null &&
    address.longitude !== null &&
    !isNaN(address.latitude) &&
    !isNaN(address.longitude) &&
    address.latitude !== 0 &&
    address.longitude !== 0
  );
};

export const getAddressDisplayText = (address: ShippingAddress): string => {
  if (!address.address) return 'No address selected';
  return address.address;
};

export const getCoordinateDisplay = (
  address: ShippingAddress,
): { lat: string; lng: string } => {
  return {
    lat:
      address.latitude !== null ? address.latitude.toFixed(6) : 'Not selected',
    lng:
      address.longitude !== null
        ? address.longitude.toFixed(6)
        : 'Not selected',
  };
};
