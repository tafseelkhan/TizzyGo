// screens/cabs/FWSLocalRide/RideModal.tsx

import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../../../api/constants/FWSLocalRideColor';
import { VEHICLE_CLASSES } from '../../../../api/constants/vehicleClasses';
import { RideTypeGroup } from '../../../types/FWSLocalRideTypes';
import { RideTicket } from './RideTicket';
import { AnimatedPressable } from './AnimatedPressable';

interface RideModalProps {
  visible: boolean;
  onClose: () => void;
  rideTypeGroups: RideTypeGroup[];
  groupedRideTypes: Record<string, RideTypeGroup[]>;
  activeClassTab: string;
  classesWithItems: typeof VEHICLE_CLASSES;
  selectedRideTypeGroup: RideTypeGroup | null;
  loading: boolean;
  onTabChange: (tabId: string) => void;
  onSelectGroup: (group: RideTypeGroup) => void;
  onRouteUpdate: (coords: any[]) => void;
  onBook: () => void;
}

export const RideModal: React.FC<RideModalProps> = ({
  visible,
  onClose,
  rideTypeGroups,
  groupedRideTypes,
  activeClassTab,
  classesWithItems,
  selectedRideTypeGroup,
  loading,
  onTabChange,
  onSelectGroup,
  onRouteUpdate,
  onBook,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.headerEyebrow}>
                {rideTypeGroups.length} OPTIONS FOUND
              </Text>
              <Text style={styles.modalTitle}>Choose your ride</Text>
            </View>
            <AnimatedPressable
              onPress={onClose}
              style={styles.modalCloseButton}
              scaleTo={0.85}
            >
              <Icon name="close" size={18} color={COLORS.ink} />
            </AnimatedPressable>
          </View>

          {classesWithItems.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.classTabBar}
              contentContainerStyle={styles.classTabBarContent}
            >
              {classesWithItems.map(cls => {
                const isActive = activeClassTab === cls.id;
                const count = (groupedRideTypes[cls.id] || []).length;
                return (
                  <AnimatedPressable
                    key={cls.id}
                    style={[styles.classTab, isActive && styles.classTabActive]}
                    onPress={() => onTabChange(cls.id)}
                    scaleTo={0.94}
                  >
                    <MCIcon
                      name={cls.icon}
                      size={15}
                      color={isActive ? COLORS.white : COLORS.inkSoft}
                    />
                    <Text
                      style={[
                        styles.classTabText,
                        isActive && styles.classTabTextActive,
                      ]}
                    >
                      {cls.label}
                    </Text>
                    <View
                      style={[
                        styles.classTabCount,
                        isActive && styles.classTabCountActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.classTabCountText,
                          isActive && styles.classTabCountTextActive,
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  </AnimatedPressable>
                );
              })}
            </ScrollView>
          )}

          {classesWithItems.find(c => c.id === activeClassTab) && (
            <Text style={styles.classActiveDescription}>
              {VEHICLE_CLASSES.find(c => c.id === activeClassTab)?.description}
            </Text>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            {(groupedRideTypes[activeClassTab] || []).map(group =>
              group.drivers.length > 0 ? (
                <RideTicket
                  key={group.rideType}
                  group={group}
                  classInfo={
                    VEHICLE_CLASSES.find(c => c.id === activeClassTab)!
                  }
                  isSelected={
                    selectedRideTypeGroup?.rideType === group.rideType
                  }
                  onSelect={onSelectGroup}
                  onRouteUpdate={onRouteUpdate}
                />
              ) : null,
            )}

            {rideTypeGroups.length === 0 && (
              <View style={styles.modalEmpty}>
                <MCIcon name="car-off" size={28} color={COLORS.textMuted} />
                <Text style={styles.modalEmptyText}>
                  No ride types available
                </Text>
              </View>
            )}
          </ScrollView>

          <AnimatedPressable
            style={[
              styles.modalBookButton,
              !selectedRideTypeGroup && styles.modalBookButtonDisabled,
            ]}
            onPress={onBook}
            disabled={!selectedRideTypeGroup || loading}
            scaleTo={0.96}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.modalBookButtonText}>
                {selectedRideTypeGroup
                  ? `Book ${selectedRideTypeGroup.rideType} · ₹${Math.round(selectedRideTypeGroup.estimatedFare)}`
                  : 'Select a ride type to continue'}
              </Text>
            )}
          </AnimatedPressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 15, 20, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '86%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: 0.1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classTabBar: {
    marginBottom: 4,
  },
  classTabBarContent: {
    gap: 8,
    paddingRight: 8,
    paddingBottom: 12,
  },
  classTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSunken,
    gap: 6,
  },
  classTabActive: {
    backgroundColor: COLORS.ink,
  },
  classTabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.inkSoft,
  },
  classTabTextActive: {
    color: COLORS.white,
  },
  classTabCount: {
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  classTabCountActive: {
    backgroundColor: COLORS.green,
  },
  classTabCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.inkSoft,
  },
  classTabCountTextActive: {
    color: COLORS.white,
  },
  classActiveDescription: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginBottom: 14,
  },
  modalScrollContent: {
    paddingBottom: 16,
  },
  modalBookButton: {
    backgroundColor: COLORS.ink,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginTop: 6,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  modalBookButtonDisabled: {
    backgroundColor: COLORS.surfaceSunken,
    shadowOpacity: 0,
    elevation: 0,
  },
  modalBookButtonText: {
    color: COLORS.white,
    fontSize: 15.5,
    fontWeight: '700',
  },
  modalEmpty: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 8,
  },
});
