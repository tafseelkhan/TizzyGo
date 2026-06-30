// src/utils/validationUtils.ts
export const isValidCoordinates = (
  latitude: number | null,
  longitude: number | null,
): boolean => {
  return (
    latitude !== null &&
    longitude !== null &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude !== 0 &&
    longitude !== 0 &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

export const isValidCouponCode = (code: string): boolean => {
  if (!code || !code.trim()) return false;
  const trimmedCode = code.trim().toUpperCase();
  return trimmedCode.length >= 3 && /^[A-Z0-9]+$/.test(trimmedCode);
};

export const isAddressValid = (address: string): boolean => {
  return !!(address && address.trim().length > 5);
};
