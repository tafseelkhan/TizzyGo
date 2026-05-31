// src/components/DeliveryInfoCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { formatPrice, formatDistance } from '../../utils/shop/formatterUtils';

interface DeliveryInfoCardProps {
  isFreeDelivery: boolean;
  deliveryCharge: number;
  distance: number;
  distanceKm?: number;
}

export const DeliveryInfoCard: React.FC<DeliveryInfoCardProps> = ({
  isFreeDelivery,
  deliveryCharge,
  distance,
  distanceKm,
}) => {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.deliveryCard,
        isFreeDelivery ? styles.freeDeliveryCard : styles.paidDeliveryCard,
        {
          backgroundColor: isFreeDelivery
            ? isDark
              ? '#22543D'
              : '#f0f9f0'
            : isDark
            ? '#2D3748'
            : '#f8f9fa',
          borderColor: isDark
            ? isFreeDelivery
              ? '#276749'
              : '#4A5568'
            : isFreeDelivery
            ? '#d4edda'
            : '#e0e0e0',
        },
      ]}
    >
      <View style={styles.deliveryTitleContainer}>
        <MaterialIcons
          name={isFreeDelivery ? 'local-offer' : 'local-shipping'}
          size={18}
          color={isFreeDelivery ? '#2ecc71' : '#2e7d32'}
        />
        <Text
          style={[
            styles.deliveryTitle,
            { color: isDark ? '#CBD5E0' : undefined },
          ]}
        >
          Delivery Information
        </Text>
      </View>

      <View
        style={[
          styles.deliveryRow,
          { borderBottomColor: isDark ? '#4A5568' : 'rgba(0,0,0,0.1)' },
        ]}
      >
        <View style={styles.deliveryLabelContainer}>
          <MaterialIcons name="category" size={14} color="#666" />
          <Text
            style={[
              styles.deliveryLabel,
              { color: isDark ? '#A0AEC0' : '#555' },
            ]}
          >
            Delivery Type:
          </Text>
        </View>
        <View
          style={[
            styles.deliveryTypeBadge,
            { backgroundColor: isDark ? '#2D3748' : undefined },
          ]}
        >
          <Text
            style={[
              styles.deliveryValue,
              { color: isDark ? '#F7FAFC' : undefined },
              isFreeDelivery
                ? styles.freeDeliveryText
                : styles.paidDeliveryText,
            ]}
          >
            {isFreeDelivery ? 'FREE Delivery' : 'Paid Delivery'}
          </Text>
        </View>
      </View>

      {!isFreeDelivery && deliveryCharge > 0 && (
        <View
          style={[
            styles.deliveryRow,
            { borderBottomColor: isDark ? '#4A5568' : 'rgba(0,0,0,0.1)' },
          ]}
        >
          <View style={styles.deliveryLabelContainer}>
            <FontAwesome name="rupee" size={14} color="#666" />
            <Text
              style={[
                styles.deliveryLabel,
                { color: isDark ? '#A0AEC0' : '#555' },
              ]}
            >
              Delivery Charge:
            </Text>
          </View>
          <Text
            style={[
              styles.deliveryValue,
              { color: isDark ? '#F7FAFC' : undefined },
            ]}
          >
            ₹{formatPrice(deliveryCharge)}
          </Text>
        </View>
      )}

      {!isFreeDelivery && distance > 0 && (
        <View
          style={[
            styles.deliveryRow,
            { borderBottomColor: isDark ? '#4A5568' : 'rgba(0,0,0,0.1)' },
          ]}
        >
          <View style={styles.deliveryLabelContainer}>
            <MaterialIcons name="directions" size={14} color="#666" />
            <Text
              style={[
                styles.deliveryLabel,
                { color: isDark ? '#A0AEC0' : '#555' },
              ]}
            >
              Distance:
            </Text>
          </View>
          <Text
            style={[
              styles.deliveryValue,
              { color: isDark ? '#F7FAFC' : undefined },
            ]}
          >
            {formatDistance(distance)}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.infoBox,
          {
            backgroundColor: isDark ? '#2D3748' : undefined,
            borderColor: isDark ? '#4A5568' : undefined,
          },
        ]}
      >
        <MaterialIcons
          name={isFreeDelivery ? 'local-offer' : 'check-circle'}
          size={14}
          color={isFreeDelivery ? '#f39c12' : '#2ecc71'}
        />
        <Text
          style={[styles.infoText, { color: isDark ? '#CBD5E0' : '#2e7d32' }]}
        >
          {isFreeDelivery
            ? 'Free delivery - No delivery charges'
            : `Delivery charge calculated based on distance: ${
                distanceKm?.toFixed(1) || '0'
              } km`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  deliveryCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  freeDeliveryCard: {},
  paidDeliveryCard: {},
  deliveryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  deliveryTitle: { fontSize: 15, fontWeight: '600' },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  deliveryLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryLabel: { fontSize: 14, fontWeight: '500' },
  deliveryTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deliveryValue: { fontSize: 14, fontWeight: '600' },
  freeDeliveryText: { color: '#2ecc71' },
  paidDeliveryText: { color: '#e74c3c' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    gap: 8,
  },
  infoText: { flex: 1, fontSize: 13 },
});
