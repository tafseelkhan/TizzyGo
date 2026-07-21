import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../../../api/constants/FWSLocalRideColor';
import { Suggestion } from '../../../types/FWSLocalRideTypes';

interface SuggestionItemProps {
  item: Suggestion;
  index: number;
  total: number;
  onSelect: (item: Suggestion) => void;
}

export const SuggestionItem: React.FC<SuggestionItemProps> = ({
  item,
  index,
  total,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.suggestionItem,
        index === total - 1 && styles.suggestionItemLast,
      ]}
      onPress={() => onSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionIconWrap}>
        <Icon name="north-east" size={14} color={COLORS.textMuted} />
      </View>
      <View style={styles.suggestionTextContainer}>
        <Text style={styles.suggestionMainText} numberOfLines={1}>
          {item.mainText}
        </Text>
        <Text style={styles.suggestionSecondaryText} numberOfLines={1}>
          {item.secondaryText}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
    backgroundColor: COLORS.bg,
    minHeight: 48,
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  suggestionMainText: {
    fontSize: 13.5,
    color: COLORS.ink,
    fontWeight: '600',
  },
  suggestionSecondaryText: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 1,
  },
});
