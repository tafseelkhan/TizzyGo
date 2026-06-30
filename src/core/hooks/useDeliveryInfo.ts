// src/hooks/useDeliveryInfo.ts
import { useMemo } from 'react';
import { Product, CalculatedData } from '../types/ShopTypes';
import { ShippingAddress } from '../types/ShopTypes';
import { isValidCoordinates } from '../utils/buyers/shop/validationUtils';
import { formatDistance } from '../utils/buyers/shop/formatterUtils';

interface UseDeliveryInfoProps {
  product: Product | null;
  calculatedData: CalculatedData | null;
  shippingAddress: ShippingAddress;
}

interface UseDeliveryInfoReturn {
  isFreeDelivery: boolean;
  hasCoordinates: boolean;
  shouldShowDeliveryInfo: boolean;
  deliveryCharge: number;
  distance: number;
  distanceKm: number; // ✅ Add this property
  formattedDistance: string;
  showPaidDeliveryWarning: boolean;
}

export const useDeliveryInfo = ({
  product,
  calculatedData,
  shippingAddress,
}: UseDeliveryInfoProps): UseDeliveryInfoReturn => {
  const isFreeDelivery = product?.freeDelivery === true;
  const hasCoordinates = isValidCoordinates(
    shippingAddress.latitude,
    shippingAddress.longitude,
  );

  const shouldShowDeliveryInfo = useMemo(() => {
    return !!(calculatedData && product && hasCoordinates);
  }, [calculatedData, product, hasCoordinates]);

  const deliveryCharge = calculatedData?.deliveryCharge || 0;
  const distance = calculatedData?.distance || 0;
  const distanceKm =
    calculatedData?.distanceKm || calculatedData?.distance || 0; // ✅ Get from calculatedData
  const formattedDistance = formatDistance(distance);

  const showPaidDeliveryWarning = useMemo(() => {
    return !!(product && !isFreeDelivery && !hasCoordinates);
  }, [product, isFreeDelivery, hasCoordinates]);

  return {
    isFreeDelivery,
    hasCoordinates,
    shouldShowDeliveryInfo,
    deliveryCharge,
    distance,
    distanceKm, // ✅ Return this property
    formattedDistance,
    showPaidDeliveryWarning,
  };
};
