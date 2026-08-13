// src/components/tracking/TrackingHeader.tsx
// ============================================================
// TRACKING HEADER COMPONENT
// NO EXTERNAL THEME - Styles defined inline
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// ============================================================
// COLORS - Inline Theme
// ============================================================

const COLORS = {
  card: '#FFFFFF',
  text: '#111827',
  secondary: '#6B7280',
  primary: '#22C55E',
  success: '#22C55E',
  danger: '#EF4444',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

// ============================================================
// PROPS
// ============================================================

interface TrackingHeaderProps {
  orderId: string;
  status: string;
  isConnected: boolean;
  isCompleted: boolean;
  estimatedDelivery?: string;
}

// ============================================================
// COMPONENT
// ============================================================

export const TrackingHeader: React.FC<TrackingHeaderProps> = ({
  orderId,
  status,
  isConnected,
  isCompleted,
  estimatedDelivery,
}) => {
  const getStatusColor = () => {
    if (isCompleted) return COLORS.success;
    if (status === 'cancelled') return COLORS.danger;
    return COLORS.primary;
  };

  const getStatusLabel = () => {
    if (isCompleted) return 'Delivered';
    const labels: { [key: string]: string } = {
      created: 'Order Placed',
      in_transit_to_fws: 'In Transit',
      received_at_fws: 'Received at Warehouse',
      scanned_at_fws: 'Scanned',
      ready_for_dispatch: 'Ready for Dispatch',
      assignment_sent: 'Driver Assigned',
      assignment_accepted: 'Driver Accepted',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      out_for_delivery: 'Out for Delivery',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const statusColor = getStatusColor();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.orderId}>Order #{orderId}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusLabel()}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.connectionStatus}>
          <View
            style={[
              styles.connectionDot,
              { backgroundColor: isConnected ? COLORS.success : COLORS.danger },
            ]}
          />
          <Text style={styles.connectionText}>
            {isConnected ? '🟢 Live' : '🔴 Reconnecting...'}
          </Text>
        </View>

        {estimatedDelivery && (
          <View style={styles.etaContainer}>
            <Icon name="clock-outline" size={16} color={COLORS.secondary} />
            <Text style={styles.etaText}>Est. {estimatedDelivery}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: SPACING.xs,
  },
  connectionText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaText: {
    fontSize: 12,
    color: COLORS.secondary,
    marginLeft: SPACING.xs,
  },
});

export default TrackingHeader;