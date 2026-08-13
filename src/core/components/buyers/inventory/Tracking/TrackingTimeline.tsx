// src/components/tracking/TrackingTimeline.tsx
// ============================================================
// TRACKING TIMELINE COMPONENT
// NO EXTERNAL THEME - Styles defined inline
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// ============================================================
// COLORS - Inline Theme
// ============================================================

const COLORS = {
  card: '#FFFFFF',
  text: '#111827',
  secondary: '#6B7280',
  muted: '#9CA3AF',
  primary: '#22C55E',
  success: '#22C55E',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

// ============================================================
// TYPES
// ============================================================

interface TimelineEvent {
  status: string;
  displayStatus?: string;
  holderType: 'SELLER' | 'RIDER' | 'FWS' | 'TRUCK' | 'BUYER';
  holderName?: string;
  holderId?: string;
  timestamp: string | Date;
  note?: string;
  isCurrent?: boolean;
  isCompleted?: boolean;
}

interface TrackingTimelineProps {
  timeline: TimelineEvent[];
  currentStatus: string;
}

// ============================================================
// COMPONENT
// ============================================================

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({
  timeline,
  currentStatus,
}) => {
  if (!timeline || timeline.length === 0) {
    return null;
  }

  const getStatusIcon = (event: TimelineEvent) => {
    if (event.isCompleted) return 'check-circle';
    if (event.isCurrent) return 'circle-slice-8';
    return 'circle-outline';
  };

  const getIconColor = (event: TimelineEvent) => {
    if (event.isCompleted) return COLORS.success;
    if (event.isCurrent) return COLORS.primary;
    return '#D1D5DB';
  };

  const getStatusColor = (event: TimelineEvent) => {
    if (event.isCompleted) return COLORS.success;
    if (event.isCurrent) return COLORS.primary;
    return '#D1D5DB';
  };

  const displayStatus = (event: TimelineEvent) => {
    const statusMap: Record<string, string> = {
      created: 'Order Placed',
      in_transit_to_fws: 'In Transit to Warehouse',
      received_at_fws: 'Received at Warehouse',
      scanned_at_fws: 'Scanned at Warehouse',
      ready_for_dispatch: 'Ready for Dispatch',
      assignment_sent: 'Rider Assigned',
      assignment_accepted: 'Rider Accepted',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return event.displayStatus || statusMap[event.status] || event.status;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Timeline</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.timelineWrapper}>
          {timeline.map((event, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineIconContainer}>
                <Icon
                  name={getStatusIcon(event)}
                  size={24}
                  color={getIconColor(event)}
                />
                {index < timeline.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      {
                        backgroundColor: event.isCompleted
                          ? COLORS.success
                          : '#D1D5DB',
                      },
                    ]}
                  />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text
                  style={[
                    styles.timelineStatus,
                    { color: getStatusColor(event) },
                  ]}
                >
                  {displayStatus(event)}
                </Text>
                {event.holderName && (
                  <Text style={styles.timelineDetail}>
                    {event.holderType}: {event.holderName}
                  </Text>
                )}
                <Text style={styles.timelineTime}>
                  {new Date(event.timestamp).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                {event.note && (
                  <Text style={styles.timelineNote}>{event.note}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
    marginBottom: SPACING.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  timelineWrapper: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    minWidth: 150,
    marginRight: SPACING.lg,
  },
  timelineIconContainer: {
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  timelineLine: {
    width: 2,
    height: 40,
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  timelineDetail: {
    fontSize: 12,
    color: COLORS.secondary,
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 11,
    color: COLORS.muted,
  },
  timelineNote: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
});

export default TrackingTimeline;
