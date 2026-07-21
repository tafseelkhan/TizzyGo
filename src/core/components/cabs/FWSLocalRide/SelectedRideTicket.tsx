import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../../../api/constants/FWSLocalRideColor';
import { getRideIcon } from '../../../../api/constants/vehicleClasses';
import { RideTypeGroup } from '../../../types/FWSLocalRideTypes';
import {
  getRideTypeName,
  getRideTypeFare,
  getFirstDriver,
  getDriverCount,
  getClosestDriverDistance,
  getDriverMaxPassengers,
  getDriverHasAC,
  formatDistance,
  formatPrice,
} from '../../../utils/cabs/FWSLocalRideHelperUtils';
import { AnimatedPressable } from './AnimatedPressable';

interface SelectedRideTicketProps {
  group: RideTypeGroup;
  pickup: { address: string } | null;
  drop: { address: string } | null;
  onPress: () => void;
}

export const SelectedRideTicket: React.FC<SelectedRideTicketProps> = ({
  group,
  pickup,
  drop,
  onPress,
}) => {
  const rideTypeName = getRideTypeName(group);
  const rideTypeFare = getRideTypeFare(group);
  const driverCount = getDriverCount(group);
  const closestDistance = getClosestDriverDistance(group);
  const firstDriver = getFirstDriver(group);

  return (
    <AnimatedPressable
      style={styles.selectedTicket}
      onPress={onPress}
      scaleTo={0.97}
    >
      <View style={styles.selectedTicketMain}>
        <View style={styles.selectedRideIconWrap}>
          <MCIcon
            name={getRideIcon(rideTypeName)}
            size={24}
            color={COLORS.white}
          />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.ticketRowNameLine}>
            <Text style={styles.selectedRideName}>{rideTypeName}</Text>
            <View style={styles.fastestChip}>
              <View style={styles.fastestDot} />
              <Text style={styles.fastestChipText}>Best</Text>
            </View>
          </View>
          <View style={styles.selectedRideEtaRow}>
            <Icon name="schedule" size={12} color={COLORS.textSecondary} />
            <Text style={styles.selectedRideEta}>
              {driverCount} drivers available ·{' '}
              {closestDistance !== null
                ? formatDistance(closestDistance)
                : 'N/A'}
            </Text>
          </View>
          {firstDriver && (
            <View style={styles.selectedRideEtaRow}>
              <Icon name="people" size={12} color={COLORS.textSecondary} />
              <Text style={styles.selectedRideEta}>
                {getDriverMaxPassengers(firstDriver)} seats ·
                {getDriverHasAC(firstDriver) ? ' AC' : ' Non-AC'}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.stubDividerHorizontal}>
        <View style={styles.stubNotchLeft} />
        <View style={styles.stubDashedLineHorizontal} />
        <View style={styles.stubNotchRight} />
      </View>

      <View style={styles.notchLabelContainer}>
        <View style={styles.notchLabelLeft}>
          <Icon name="my-location" size={12} color={COLORS.green} />
          <Text style={styles.notchLabelTextGreen} numberOfLines={1}>
            {pickup?.address?.split(',')[0] || 'Pickup'}
          </Text>
        </View>
        <View style={styles.notchLabelRight}>
          <Icon name="flag" size={12} color={COLORS.green} />
          <Text style={styles.notchLabelTextGreen} numberOfLines={1}>
            {drop?.address?.split(',')[0] || 'Drop'}
          </Text>
        </View>
      </View>

      <View style={styles.selectedTicketFooter}>
        <Text style={styles.selectedTicketFooterLabel}>
          TAP TO CHANGE RIDE TYPE
        </Text>
        <Text style={styles.selectedRidePrice}>
          {formatPrice(rideTypeFare)}
        </Text>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  selectedTicket: {
    backgroundColor: COLORS.bg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  selectedTicketMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: COLORS.bg,
  },
  selectedRideIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRideName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
    marginRight: 6,
  },
  selectedRideEtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  selectedRideEta: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  ticketRowNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  fastestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greenMuted,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    gap: 4,
  },
  fastestDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.green,
  },
  fastestChipText: {
    fontSize: 9.5,
    color: COLORS.greenDark,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  stubDividerHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 4,
    position: 'relative',
  },
  stubDashedLineHorizontal: {
    flex: 1,
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.borderStrong,
  },
  stubNotchLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
    marginLeft: -8,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  stubNotchRight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
    marginRight: -8,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  notchLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: -6,
    marginBottom: 4,
    backgroundColor: COLORS.bg,
  },
  notchLabelLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
  },
  notchLabelRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingRight: 8,
  },
  notchLabelTextGreen: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.green,
    letterSpacing: 0.3,
    flex: 1,
  },
  selectedTicketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surfaceSunken,
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
  },
  selectedTicketFooterLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  selectedRidePrice: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.green,
  },
});
