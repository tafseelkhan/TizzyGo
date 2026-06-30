// src/utils/formatterUtils.ts
export const formatPrice = (price: number | undefined): string => {
  if (!price && price !== 0) return '0.00';
  return price.toFixed(2);
};

export const formatCoordinate = (
  value: number | null,
  precision: number = 6,
): string => {
  if (value === null || isNaN(value)) return 'Not selected';
  return value.toFixed(precision);
};

export const formatDistance = (distance: number | undefined): string => {
  if (!distance) return '0 km';
  if (distance < 1) return `${(distance * 1000).toFixed(0)} meters`;
  return `${distance.toFixed(1)} km`;
};

export const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
