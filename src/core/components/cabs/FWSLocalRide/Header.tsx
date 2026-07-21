import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../../../api/constants/FWSLocalRideColor';
import { AnimatedPressable } from './AnimatedPressable';

interface HeaderProps {
  onBackPress: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onBackPress }) => {
  return (
    <View style={styles.header}>
      <AnimatedPressable
        style={styles.backButton}
        onPress={onBackPress}
        scaleTo={0.88}
      >
        <Icon name="arrow-back" size={20} color={COLORS.ink} />
      </AnimatedPressable>
      <View style={styles.headerTitleWrap}>
        <Text style={styles.headerEyebrow}>NEW TRIP</Text>
        <Text style={styles.headerTitle}>Book a ride</Text>
      </View>
      <View style={styles.headerRight} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: COLORS.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: 0.1,
  },
  headerRight: {
    width: 36,
  },
});
