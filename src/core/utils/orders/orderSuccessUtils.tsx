// utils/orderSuccessUtils.ts
import { JSX } from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DeliveryStatus } from '../../../api/features/private/orderSuccessPrivateSlice';
import { StatusConfig } from '../../services/orders/orderSuccessService';

export type PaymentMethodType = 'stripe_payment' | 'cod' | 'online' | 'unknown';

export interface PaymentMethodDisplay {
  type: string;
  icon: () => JSX.Element;
  text: string;
  color: string;
}

export interface StatusDisplayInfo {
  icon: string;
  color: string;
  label: string;
}

export const getPaymentMethodDisplay = (
  source: PaymentMethodType | undefined,
  orderPaymentMethod: string | undefined,
  colors: any,
): PaymentMethodDisplay => {
  const paymentSource: PaymentMethodType =
    source || (orderPaymentMethod as PaymentMethodType) || 'unknown';

  if (paymentSource === 'stripe_payment' || paymentSource === 'online') {
    return {
      type: 'stripe',
      icon: () => (
        <View style={{ flexDirection: 'row' }}>
          <View
            style={[styles.stripeDot, { backgroundColor: colors.primary }]}
          />
          <View style={[styles.stripeDot, { backgroundColor: '#00D4AA' }]} />
          <View style={[styles.stripeDot, { backgroundColor: '#FF6B6B' }]} />
        </View>
      ),
      text: 'Stripe',
      color: colors.primary,
    };
  } else if (paymentSource === 'cod') {
    return {
      type: 'cod',
      icon: () => <Icon name="money" size={12} color={colors.warning} />,
      text: 'Cash on Delivery',
      color: colors.warning,
    };
  } else {
    return {
      type: 'unknown',
      icon: () => (
        <Icon name="payment" size={12} color={colors.textSecondary} />
      ),
      text: 'Paid',
      color: colors.textSecondary,
    };
  }
};

export const getStatusDisplayInfo = (
  deliveryStatus: DeliveryStatus,
  colors: any,
): StatusDisplayInfo => {
  const statusInfo: Record<DeliveryStatus, StatusDisplayInfo> = {
    waiting_for_seller: {
      icon: 'store',
      color: colors.statusWaiting,
      label: 'Preparing Order',
    },
    pending_rider_accept: {
      icon: 'hourglass-empty',
      color: colors.statusPending,
      label: 'Finding Rider',
    },
    assigned: {
      icon: 'motorcycle',
      color: colors.statusAssigned,
      label: 'Rider Assigned',
    },
    waiting_for_rider: {
      icon: 'person-pin',
      color: colors.statusReady,
      label: 'Rider Arrived',
    },
    picked_up: {
      icon: 'local-shipping',
      color: colors.statusPicked,
      label: 'On the Way',
    },
    delivered: {
      icon: 'check-circle',
      color: colors.statusDelivered,
      label: 'Delivered',
    },
  };

  return statusInfo[deliveryStatus];
};

export const calculateTotalAmount = (
  paramsTotal?: number,
  orderFinalAmount?: number,
): string => {
  const amount = paramsTotal || orderFinalAmount || 0;
  return amount.toFixed(2);
};

export const getStepsWithStatus = () => {
  return [
    { icon: 'store', label: 'Seller', status: 'waiting_for_seller' },
    {
      icon: 'hourglass-empty',
      label: 'Finding Rider',
      status: 'pending_rider_accept',
    },
    { icon: 'motorcycle', label: 'Rider Assigned', status: 'assigned' },
    { icon: 'local-shipping', label: 'On the way', status: 'picked_up' },
    { icon: 'location-on', label: 'Delivered', status: 'delivered' },
  ];
};

const styles = StyleSheet.create({
  stripeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
});

// Helper function to create default delivery estimate
export const getDefaultDeliveryEstimate = () => ({
  estimatedTime: 45,
  estimatedDelivery: '45-60 minutes',
  deliveryType: 'express' as const,
  distance: '5 km',
});

// Helper to check if status is valid
export const isValidDeliveryStatus = (
  status: string,
): status is DeliveryStatus => {
  const validStatuses: DeliveryStatus[] = [
    'waiting_for_seller',
    'pending_rider_accept',
    'assigned',
    'waiting_for_rider',
    'picked_up',
    'delivered',
  ];
  return validStatuses.includes(status as DeliveryStatus);
};

// Add these imports at the top of this file (needed for JSX)
// Note: This file should have .tsx extension because it returns JSX
// Or move icon rendering to component level

// utils/orderSuccessUtils.ts (Pure functions without JSX)
export const getPaymentMethodType = (
  source: PaymentMethodType | undefined,
  orderPaymentMethod: string | undefined,
): { type: string; text: string; colorKey: string } => {
  const paymentSource: PaymentMethodType =
    source || (orderPaymentMethod as PaymentMethodType) || 'unknown';

  if (paymentSource === 'stripe_payment' || paymentSource === 'online') {
    return {
      type: 'stripe',
      text: 'Stripe',
      colorKey: 'primary',
    };
  } else if (paymentSource === 'cod') {
    return {
      type: 'cod',
      text: 'Cash on Delivery',
      colorKey: 'warning',
    };
  } else {
    return {
      type: 'unknown',
      text: 'Paid',
      colorKey: 'textSecondary',
    };
  }
};
