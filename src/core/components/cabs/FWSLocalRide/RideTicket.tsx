import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../../../api/constants/FWSLocalRideColor';
import { VEHICLE_CLASSES, getRideIcon } from '../../../../api/constants/vehicleClasses';
import { RideTypeGroup } from '../../../types/FWSLocalRideTypes';
import {
  getRideTypeName,
  getRideTypeFare,
  getRideTypeDescription,
  getFirstDriver,
  getDriverCount,
  getClosestDriverDistance,
  getDriverMaxPassengers,
  getDriverHasAC,
  getDriverLuggageCapacity,
  getDriverHandBagCapacity,
  getDriverSeatCapacity,
  getDriverBaseFare,
  getDriverClassFare,
  getDriverVehicleType,
  getDriverManufacturingYear,
  formatDistance,
  formatPrice,
  decodePolyline,
} from '../../../utils/cabs/FWSLocalRideHelperUtils';
import { AnimatedPressable } from './AnimatedPressable';

interface RideTicketProps {
  group: RideTypeGroup;
  classInfo: (typeof VEHICLE_CLASSES)[0];
  isSelected: boolean;
  onSelect: (group: RideTypeGroup) => void;
  onRouteUpdate: (coords: any[]) => void;
}

export const RideTicket: React.FC<RideTicketProps> = ({
  group,
  classInfo,
  isSelected,
  onSelect,
  onRouteUpdate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const rideTypeName = getRideTypeName(group);
  const rideTypeFare = getRideTypeFare(group);
  const rideTypeDesc = getRideTypeDescription(group);
  const driverCount = getDriverCount(group);
  const closestDistance = getClosestDriverDistance(group);
  const firstDriver = getFirstDriver(group);

  const handlePress = () => {
    onSelect(group);
    if (group.pickupToDropPolyline) {
      const decoded = decodePolyline(group.pickupToDropPolyline);
      if (decoded.length >= 2) {
        onRouteUpdate(decoded);
      }
    }
  };

  return (
    <AnimatedPressable
      style={[styles.ticketRow, isSelected && styles.ticketRowSelected]}
      scaleTo={0.98}
      onPress={handlePress}
    >
      <View style={styles.ticketRowMain}>
        <View
          style={[
            styles.ticketIconWrap,
            { backgroundColor: isSelected ? COLORS.ink : COLORS.surfaceSunken },
          ]}
        >
          <MCIcon
            name={getRideIcon(rideTypeName)}
            size={20}
            color={isSelected ? COLORS.white : COLORS.inkSoft}
          />
        </View>

        <View style={styles.ticketRowInfo}>
          <View style={styles.ticketRowNameLine}>
            <Text style={styles.ticketRowName}>{rideTypeName}</Text>
            {isSelected && (
              <View style={styles.fastestChip}>
                <View style={styles.fastestDot} />
                <Text style={styles.fastestChipText}>Selected</Text>
              </View>
            )}
          </View>

          <View>
            <Text
              style={styles.ticketRowDesc}
              numberOfLines={isExpanded ? undefined : 2}
            >
              {rideTypeDesc}
            </Text>
            {rideTypeDesc.length > 60 && (
              <TouchableOpacity
                onPress={() => setIsExpanded(!isExpanded)}
                style={styles.moreButton}
              >
                <Text style={styles.moreText}>
                  {isExpanded ? 'Less' : 'More...'}
                </Text>
                <Icon
                  name={isExpanded ? 'expand-less' : 'expand-more'}
                  size={16}
                  color={COLORS.green}
                />
              </TouchableOpacity>
            )}
          </View>

          {isExpanded && firstDriver && (
            <View style={styles.expandedDetails}>
              <View style={styles.expandedRow}>
                <Icon name="directions-car" size={14} color={COLORS.green} />
                <Text style={styles.expandedText}>
                  {getDriverVehicleType(firstDriver)} ·{' '}
                  {firstDriver.vehicleClass}
                </Text>
              </View>
              <View style={styles.expandedRow}>
                <Icon name="person" size={14} color={COLORS.green} />
                <Text style={styles.expandedText}>
                  Driver: {firstDriver.driverCode}
                </Text>
              </View>
              <View style={styles.expandedRow}>
                <Icon name="directions" size={14} color={COLORS.green} />
                <Text style={styles.expandedText}>
                  Distance: {formatDistance(firstDriver.distance)}
                </Text>
              </View>
              <View style={styles.expandedRow}>
                <Icon name="speed" size={14} color={COLORS.green} />
                <Text style={styles.expandedText}>
                  Speed: {firstDriver.speed || 0} km/h
                </Text>
              </View>
              <View style={styles.expandedRow}>
                <Icon name="people" size={14} color={COLORS.green} />
                <Text style={styles.expandedText}>
                  Max Passengers: {getDriverMaxPassengers(firstDriver)}
                </Text>
              </View>
              <View style={styles.expandedRow}>
                <Icon name="chair" size={14} color={COLORS.green} />
                <Text style={styles.expandedText}>
                  Seats: {getDriverSeatCapacity(firstDriver)}
                </Text>
              </View>
              <View style={styles.expandedRow}>
                <Icon name="luggage" size={14} color={COLORS.green} />
                <Text style={styles.expandedText}>
                  Luggage: {getDriverLuggageCapacity(firstDriver)} bags
                </Text>
              </View>
              <View style={styles.expandedRow}>
                <Icon name="backpack" size={14} color={COLORS.green} />
                <Text style={styles.expandedText}>
                  Hand Bags: {getDriverHandBagCapacity(firstDriver)}
                </Text>
              </View>
              <View style={styles.expandedRow}>
                <Icon
                  name={getDriverHasAC(firstDriver) ? 'ac-unit' : 'ac-unit-off'}
                  size={14}
                  color={
                    getDriverHasAC(firstDriver)
                      ? COLORS.green
                      : COLORS.textMuted
                  }
                />
                <Text
                  style={[
                    styles.expandedText,
                    {
                      color: getDriverHasAC(firstDriver)
                        ? COLORS.green
                        : COLORS.textMuted,
                    },
                  ]}
                >
                  AC: {getDriverHasAC(firstDriver) ? 'Yes' : 'No'}
                </Text>
              </View>
              <View style={styles.expandedRow}>
                <Icon name="attach-money" size={14} color={COLORS.green} />
                <Text style={styles.expandedText}>
                  Fare: ₹{getDriverBaseFare(firstDriver)} + ₹
                  {getDriverClassFare(firstDriver)}
                </Text>
              </View>
              <View style={styles.expandedRow}>
                <Icon name="calendar-today" size={14} color={COLORS.green} />
                <Text style={styles.expandedText}>
                  Year: {getDriverManufacturingYear(firstDriver)}
                </Text>
              </View>
              <View style={styles.expandedRow}>
                <Icon
                  name={firstDriver.isOnline ? 'wifi' : 'wifi-off'}
                  size={14}
                  color={firstDriver.isOnline ? COLORS.green : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.expandedText,
                    {
                      color: firstDriver.isOnline
                        ? COLORS.green
                        : COLORS.textMuted,
                    },
                  ]}
                >
                  Status: {firstDriver.isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
              <View style={styles.expandedRow}>
                <Icon
                  name={firstDriver.isTrackingOn ? 'gps-fixed' : 'gps-off'}
                  size={14}
                  color={
                    firstDriver.isTrackingOn ? COLORS.green : COLORS.textMuted
                  }
                />
                <Text
                  style={[
                    styles.expandedText,
                    {
                      color: firstDriver.isTrackingOn
                        ? COLORS.green
                        : COLORS.textMuted,
                    },
                  ]}
                >
                  Tracking: {firstDriver.isTrackingOn ? 'On' : 'Off'}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.ticketRowMeta}>
            <Text style={styles.ticketRowMetaText}>
              {closestDistance !== null
                ? formatDistance(closestDistance)
                : 'N/A'}
            </Text>
            <View style={styles.metaSeparator} />
            <Text style={styles.ticketRowMetaText}>
              {driverCount} driver{driverCount > 1 ? 's' : ''}
            </Text>
            <View style={styles.metaSeparator} />
            <Text style={styles.ticketRowMetaText}>
              {group.roadDistanceKm
                ? formatDistance(group.roadDistanceKm)
                : '0 km'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.stubDivider}>
        <View style={styles.stubNotchLeftSmall} />
        <View style={styles.stubDashedLine} />
        <View style={styles.stubNotchRightSmall} />
      </View>

      <View style={styles.ticketRowStub}>
        <Text style={styles.stubEyebrow}>{classInfo.shortLabel}</Text>
        <Text style={styles.ticketRowPrice}>{formatPrice(rideTypeFare)}</Text>
        <View
          style={[
            styles.stubRadio,
            isSelected && {
              borderColor: COLORS.green,
              backgroundColor: COLORS.green,
            },
          ]}
        >
          {isSelected && <Icon name="check" size={11} color={COLORS.white} />}
        </View>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  ticketRow: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  ticketRowSelected: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.bg,
  },
  ticketRowMain: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
    backgroundColor: COLORS.bg,
  },
  ticketIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketRowInfo: {
    flex: 1,
  },
  ticketRowNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  ticketRowName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  ticketRowDesc: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  moreText: {
    fontSize: 11,
    color: COLORS.green,
    fontWeight: '600',
  },
  expandedDetails: {
    marginTop: 6,
    padding: 8,
    backgroundColor: COLORS.surfaceSunken,
    borderRadius: 8,
  },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  expandedText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  ticketRowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  ticketRowMetaText: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  metaSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.borderStrong,
  },
  stubDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    backgroundColor: COLORS.bg,
  },
  stubNotchLeftSmall: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.bg,
    marginLeft: -7,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stubNotchRightSmall: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.bg,
    marginRight: -7,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stubDashedLine: {
    flex: 1,
    height: 0,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    marginHorizontal: 8,
  },
  ticketRowStub: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.surfaceSunken,
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
  },
  stubEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  ticketRowPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink,
  },
  stubRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
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
});
