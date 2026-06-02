// src/components/CouponCard.tsx
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useCoupon } from '../../hooks/useCoupon';

interface CouponCardProps {
  initialCode?: string;
  onApplyCoupon: (code: string) => Promise<void>;
  onRemoveCoupon: () => Promise<void>;
  isApplyingCoupon: boolean;
  couponError?: string | null;
  couponSuccess?: string | null;
  clearCouponMessages?: () => void;
  calculatedData?: any;
}

export const CouponCard: React.FC<CouponCardProps> = ({
  initialCode = '',
  onApplyCoupon,
  onRemoveCoupon,
  isApplyingCoupon,
  couponError,
  couponSuccess,
  clearCouponMessages,
  calculatedData,
}) => {
  const { isDark } = useTheme();

  const {
    couponInput,
    setCouponInput,
    localError,
    localSuccess,
    handleApplyCoupon,
    handleRemoveCoupon,
    getParsedError,
  } = useCoupon({
    initialCode,
    onApplyCoupon,
    onRemoveCoupon,
    isApplyingCoupon,
    couponError,
    couponSuccess,
    clearCouponMessages,
  });

  const parsedError = getParsedError();
  const isCouponApplied = !!calculatedData?.couponUsed;

  const renderErrorMessage = () => {
    if (!localError) return null;

    return (
      <View
        style={[
          styles.errorCard,
          {
            backgroundColor: isDark ? '#2D3748' : '#fff5f5',
            borderColor: isDark ? '#4A5568' : '#fecaca',
          },
        ]}
      >
        <View style={styles.errorHeader}>
          <MaterialIcons
            name={parsedError?.icon || 'error-outline'}
            size={18}
            color={parsedError?.color || '#e74c3c'}
          />
          <Text
            style={[
              styles.errorTitle,
              { color: parsedError?.color || '#e74c3c' },
            ]}
          >
            {parsedError?.title || 'Coupon Error'}
          </Text>
        </View>
        <Text
          style={[styles.errorText, { color: isDark ? '#FC8181' : '#e74c3c' }]}
        >
          {localError}
        </Text>
        <View
          style={[
            styles.suggestionBox,
            {
              backgroundColor: isDark ? '#2D3748' : '#fff3cd',
              borderColor: isDark ? '#4A5568' : '#ffeaa7',
            },
          ]}
        >
          <MaterialIcons name="lightbulb" size={14} color="#f39c12" />
          <Text
            style={[
              styles.suggestionText,
              { color: isDark ? '#F6AD55' : '#856404' },
            ]}
          >
            {parsedError?.suggestion}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={() => clearCouponMessages?.()}
        >
          <Text
            style={[
              styles.dismissButtonText,
              { color: isDark ? '#FC8181' : '#e74c3c' },
            ]}
          >
            Dismiss
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSuccessMessage = () => {
    if (!localSuccess) return null;

    return (
      <View
        style={[
          styles.successCard,
          {
            backgroundColor: isDark ? '#22543D' : '#f0f9f0',
            borderColor: isDark ? '#276749' : '#d4edda',
          },
        ]}
      >
        <View style={styles.successHeader}>
          <MaterialIcons name="check-circle" size={18} color="#2ecc71" />
          <Text
            style={[
              styles.successTitle,
              { color: isDark ? '#9AE6B4' : '#2e7d32' },
            ]}
          >
            Success!
          </Text>
        </View>
        <Text
          style={[
            styles.successText,
            { color: isDark ? '#9AE6B4' : '#2e7d32' },
          ]}
        >
          {localSuccess}
        </Text>
        {calculatedData?.discountApplied && (
          <Text
            style={[
              styles.successSubtext,
              { color: isDark ? '#68D391' : '#28a745' },
            ]}
          >
            Discount of ₹{calculatedData.discountApplied.toFixed(2)} has been
            applied to your order.
          </Text>
        )}
        <TouchableOpacity
          style={styles.successDismissButton}
          onPress={() => clearCouponMessages?.()}
        >
          <Text
            style={[
              styles.successDismissButtonText,
              { color: isDark ? '#9AE6B4' : '#2e7d32' },
            ]}
          >
            OK
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View
      style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}
    >
      <View style={styles.cardTitleContainer}>
        <MaterialIcons name="local-offer" size={20} color="#e74c3c" />
        <Text
          style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#333' }]}
        >
          Apply Coupon
        </Text>
      </View>

      {renderErrorMessage()}
      {renderSuccessMessage()}

      <View style={styles.couponContainer}>
        <View
          style={[
            styles.couponInputWrapper,
            {
              borderColor: isDark ? '#4A5568' : '#ddd',
              backgroundColor: isDark ? '#2D3748' : '#fff',
            },
          ]}
        >
          <MaterialIcons
            name="confirmation-number"
            size={18}
            color={isCouponApplied ? '#2ecc71' : '#95a5a6'}
            style={styles.couponIcon}
          />
          <TextInput
            style={[styles.couponInput, { color: isDark ? '#F1F5F9' : '#333' }]}
            value={couponInput}
            onChangeText={setCouponInput}
            placeholder="Enter coupon code"
            placeholderTextColor={isDark ? '#A0AEC0' : '#999'}
            editable={!isCouponApplied}
            autoCapitalize="characters"
            onSubmitEditing={handleApplyCoupon}
          />
        </View>

        {isCouponApplied ? (
          <TouchableOpacity
            style={[styles.couponButton, styles.removeButton]}
            onPress={handleRemoveCoupon}
            disabled={isApplyingCoupon}
          >
            {isApplyingCoupon ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.couponButtonText}>Remove</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.couponButton,
              !couponInput.trim() && styles.disabledButton,
            ]}
            onPress={handleApplyCoupon}
            disabled={isApplyingCoupon || !couponInput.trim()}
          >
            {isApplyingCoupon ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.couponButtonText}>Apply</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {!isCouponApplied && (
        <View
          style={[
            styles.couponInfoBox,
            {
              backgroundColor: isDark ? '#2D3748' : '#f8f9fa',
              borderColor: isDark ? '#4A5568' : '#e9ecef',
            },
          ]}
        >
          <View style={styles.couponInfoHeader}>
            <MaterialIcons name="info" size={14} color="#3498db" />
            <Text
              style={[
                styles.couponInfoTitle,
                { color: isDark ? '#90CDF4' : '#495057' },
              ]}
            >
              Coupon Information
            </Text>
          </View>
          <View style={styles.couponInfoRow}>
            <MaterialIcons name="payment" size={12} color="#666" />
            <Text
              style={[
                styles.couponInfoText,
                { color: isDark ? '#A0AEC0' : '#6c757d' },
              ]}
            >
              Coupons may have minimum and maximum order value limits
            </Text>
          </View>
          <View style={styles.couponInfoRow}>
            <MaterialIcons name="access-time" size={12} color="#666" />
            <Text
              style={[
                styles.couponInfoText,
                { color: isDark ? '#A0AEC0' : '#6c757d' },
              ]}
            >
              Check expiry date before applying
            </Text>
          </View>
        </View>
      )}

      {calculatedData && (
        <View
          style={[
            styles.couponStatusCard,
            {
              backgroundColor: isDark ? '#2D3748' : '#f8f9fa',
              borderColor: isDark ? '#4A5568' : '#e0e0e0',
            },
          ]}
        >
          <View style={styles.couponStatusTitleContainer}>
            <Ionicons name="information-circle" size={16} color="#3498db" />
            <Text
              style={[
                styles.couponStatusTitle,
                { color: isDark ? '#90CDF4' : '#333' },
              ]}
            >
              Coupon Status
            </Text>
          </View>
          <View
            style={[
              styles.statusRow,
              { borderBottomColor: isDark ? '#4A5568' : '#e0e0e0' },
            ]}
          >
            <View style={styles.statusLabelContainer}>
              <MaterialIcons
                name="confirmation-number"
                size={14}
                color="#666"
              />
              <Text
                style={[
                  styles.statusLabel,
                  { color: isDark ? '#A0AEC0' : '#666' },
                ]}
              >
                Coupon:
              </Text>
            </View>
            <View
              style={[
                styles.statusValueContainer,
                { backgroundColor: isDark ? '#2D3748' : undefined },
              ]}
            >
              <Text
                style={[
                  styles.statusValue,
                  { color: isDark ? '#F7FAFC' : '#333' },
                ]}
              >
                {calculatedData.couponUsed || 'None'}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusRow,
              { borderBottomColor: isDark ? '#4A5568' : '#e0e0e0' },
            ]}
          >
            <View style={styles.statusLabelContainer}>
              <FontAwesome name="rupee" size={14} color="#666" />
              <Text
                style={[
                  styles.statusLabel,
                  { color: isDark ? '#A0AEC0' : '#666' },
                ]}
              >
                Discount:
              </Text>
            </View>
            <View style={styles.statusValueContainer}>
              <Text
                style={[
                  styles.statusValue,
                  calculatedData.discountApplied
                    ? styles.discountValue
                    : styles.noDiscountValue,
                  { color: isDark ? '#F7FAFC' : undefined },
                ]}
              >
                ₹{calculatedData.discountApplied?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusRow,
              { borderBottomColor: isDark ? '#4A5568' : '#e0e0e0' },
            ]}
          >
            <View style={styles.statusLabelContainer}>
              <MaterialIcons
                name={
                  calculatedData.coFundApplied
                    ? 'account-balance-wallet'
                    : 'money-off'
                }
                size={14}
                color="#666"
              />
              <Text
                style={[
                  styles.statusLabel,
                  { color: isDark ? '#A0AEC0' : '#666' },
                ]}
              >
                Co-Fund:
              </Text>
            </View>
            <View style={styles.statusValueContainer}>
              <Text
                style={[
                  styles.statusValue,
                  { color: isDark ? '#F7FAFC' : undefined },
                ]}
              >
                {calculatedData.coFundApplied ? 'INCLUDED' : 'EXCLUDED'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  errorCard: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  errorTitle: { fontSize: 14, fontWeight: '600' },
  errorText: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  suggestionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
  },
  suggestionText: { flex: 1, fontSize: 12, lineHeight: 16 },
  dismissButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dismissButtonText: { fontSize: 12, fontWeight: '500' },
  successCard: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  successTitle: { fontSize: 14, fontWeight: '600' },
  successText: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  successSubtext: { fontSize: 12, fontStyle: 'italic', marginBottom: 10 },
  successDismissButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  successDismissButtonText: { fontSize: 12, fontWeight: '500' },
  couponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  couponInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
  },
  couponIcon: { marginLeft: 12, marginRight: 8 },
  couponInput: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 46,
  },
  couponButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 90,
    backgroundColor: '#2ecc71',
    gap: 6,
  },
  removeButton: { backgroundColor: '#e74c3c' },
  disabledButton: { opacity: 0.7 },
  couponButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  couponInfoBox: {
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
  },
  couponInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  couponInfoTitle: { fontSize: 13, fontWeight: '600' },
  couponInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  couponInfoText: { fontSize: 12 },
  couponStatusCard: {
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
  },
  couponStatusTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  couponStatusTitle: { fontSize: 14, fontWeight: '600' },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  statusLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusLabel: { fontSize: 13, fontWeight: '500' },
  statusValueContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusValue: { fontSize: 13, fontWeight: '600', fontFamily: 'monospace' },
  discountValue: { color: '#2ecc71' },
  noDiscountValue: { color: '#95a5a6' },
});
