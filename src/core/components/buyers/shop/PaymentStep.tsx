// src/screens/PaymentStep.tsx (Refactored - Clean version)
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../../../contexts/theme/ThemeContext';
import { usePayment } from '../../../hooks/usePayments';
import * as paymentUtils from '../../../utils/shop/paymentUtils';

interface PaymentStepProps {
  checkoutData: any;
  updateCheckoutData: (key: string, value: any) => void;
  product: any;
  calculatedData: any;
  loading?: boolean;
  onOrderConfirmed?: (orderData: any) => void;
  onPaymentMethodChange?: (method: 'online' | 'cod') => void;
}

const AIRCLOUD_LOGO = require('../../../assets/images/aircloud.png');

const PaymentStepComponent: React.FC<PaymentStepProps> = ({
  checkoutData,
  product,
  calculatedData,
  loading: externalLoading = false,
  onOrderConfirmed,
  onPaymentMethodChange,
}) => {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  const {
    loading,
    paymentProcessing,
    paymentMethod,
    checkoutSessionCreated,
    paymentSheetData,
    isVerified,
    health,
    openZeptPayPaymentSheet,
    handlePaymentMethodChange,
    handlePayment,
    isCodAvailable,
  } = usePayment({
    product,
    calculatedData,
    checkoutData,
    onOrderConfirmed,
    onPaymentMethodChange,
  });

  const buttonScale = React.useRef(new Animated.Value(1)).current;
  const cardElevation = React.useRef(new Animated.Value(0)).current;

  const totalPayable = paymentUtils.getTotalPayable(calculatedData);
  const buttonText = paymentUtils.getButtonText(paymentMethod, calculatedData);
  const isButtonDisabled = paymentUtils.isPaymentButtonDisabled(
    loading,
    paymentProcessing,
    externalLoading,
    paymentMethod,
    isVerified,
    paymentSheetData,
    openZeptPayPaymentSheet,
  );

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#0f172a' : '#ffffff' },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header - Same as before */}
      <View
        style={[
          styles.brandHeader,
          { backgroundColor: isDark ? '#1e293b' : '#fff' },
        ]}
      >
        <View style={styles.tizzygoHeader}>
          <Image
            source={AIRCLOUD_LOGO}
            style={styles.aircloudLogo}
            resizeMode="contain"
          />
          <View>
            <Text
              style={[
                styles.tizzygoBrandText,
                { color: isDark ? '#e2e8f0' : '#1a1a1a' },
              ]}
            >
              AirCloud
            </Text>
            <Text
              style={[
                styles.tizzygoTagline,
                { color: isDark ? '#94a3b8' : '#64748b' },
              ]}
            >
              Superfast Delivery
            </Text>
          </View>
        </View>
      </View>

      {/* ZeptPay Status Badge */}
      <View
        style={[
          styles.secureTransactionBadge,
          { backgroundColor: isDark ? '#1e293b' : '#f0f7ff' },
        ]}
      >
        <Icon name="verified" size={14} color="#10b981" />
        <Text
          style={[
            styles.secureTransactionText,
            { color: isDark ? '#e2e8f0' : '#1a1a1a' },
          ]}
        >
          {paymentMethod === 'online'
            ? `ZeptPay • ${health?.mode?.toUpperCase() || 'TEST'} Mode`
            : 'COD Payment'}
        </Text>
        {paymentMethod === 'online' && (
          <View
            style={[
              styles.trustedBadge,
              { backgroundColor: isVerified ? '#10b981' : '#94a3b8' },
            ]}
          >
            <FontAwesome name="shield" size={10} color="#fff" />
            <Text style={styles.trustedBadgeText}>
              {isVerified
                ? 'Verified'
                : health?.status === 'verifying'
                ? 'Verifying...'
                : 'Unverified'}
            </Text>
          </View>
        )}
      </View>

      {/* Order Summary */}
      <Animated.View
        style={[
          styles.section,
          {
            backgroundColor: isDark ? '#1e293b' : '#fff',
            elevation: cardElevation,
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Icon
            name="receipt"
            size={18}
            color={isDark ? '#8b5cf6' : '#635BFF'}
          />
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? '#e2e8f0' : '#1a1a1a' },
            ]}
          >
            Order Summary
          </Text>
        </View>
        {product && (
          <View style={styles.productSummary}>
            <Text
              style={[
                styles.productName,
                { color: isDark ? '#e2e8f0' : '#1a1a1a' },
              ]}
            >
              {product.title}
            </Text>
            <Text
              style={[
                styles.productQuantity,
                { color: isDark ? '#94a3b8' : '#666' },
              ]}
            >
              Quantity: {checkoutData.quantity}
            </Text>
          </View>
        )}
        {calculatedData && (
          <View style={styles.finalTotalContainer}>
            <Text
              style={[
                styles.finalTotalLabel,
                { color: isDark ? '#e2e8f0' : '#1a1a1a' },
              ]}
            >
              Total Payable:
            </Text>
            <Text
              style={[
                styles.finalTotalValue,
                { color: isDark ? '#8b5cf6' : '#635BFF' },
              ]}
            >
              ₹{paymentUtils.formatPrice(totalPayable)}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Payment Method Selection - Same UI */}
      {isCodAvailable && (
        <Animated.View
          style={[
            styles.section,
            { backgroundColor: isDark ? '#1e293b' : '#fff' },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Icon
              name="payment"
              size={18}
              color={isDark ? '#8b5cf6' : '#635BFF'}
            />
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? '#e2e8f0' : '#1a1a1a' },
              ]}
            >
              Select Payment Method
            </Text>
          </View>
          <View style={styles.paymentMethodContainer}>
            {/* Online Payment Option */}
            <TouchableOpacity
              style={[
                styles.paymentMethodCard,
                {
                  backgroundColor: isDark ? '#334155' : '#f8fafc',
                  borderColor:
                    paymentMethod === 'online'
                      ? isDark
                        ? '#3B82F6'
                        : '#2563EB'
                      : isDark
                      ? '#475569'
                      : '#e2e8f0',
                },
              ]}
              onPress={() => handlePaymentMethodChange('online')}
            >
              <View style={styles.paymentMethodHeader}>
                <View style={styles.paymentMethodLogo}>
                  <View style={styles.zeptpayLogoContainer}>
                    <View
                      style={[
                        styles.zeptpayDot,
                        { backgroundColor: isDark ? '#3B82F6' : '#2563EB' },
                      ]}
                    />
                    <View
                      style={[
                        styles.zeptpayDot,
                        { backgroundColor: '#60A5FA' },
                      ]}
                    />
                    <View
                      style={[
                        styles.zeptpayDot,
                        { backgroundColor: '#93C5FD' },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.paymentMethodText,
                      { color: isDark ? '#e2e8f0' : '#1a1a1a' },
                    ]}
                  >
                    Pay Online
                  </Text>
                </View>
                {paymentMethod === 'online' && (
                  <View
                    style={[
                      styles.selectedIndicator,
                      { backgroundColor: isDark ? '#3B82F6' : '#2563EB' },
                    ]}
                  >
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
              </View>
              <View style={styles.paymentMethodIcons}>
                <FontAwesome5
                  name="cc-visa"
                  size={14}
                  color={isDark ? '#cbd5e1' : '#1a1a1a'}
                />
                <FontAwesome5
                  name="cc-mastercard"
                  size={14}
                  color={isDark ? '#cbd5e1' : '#1a1a1a'}
                />
                <Icon
                  name="account-balance"
                  size={14}
                  color={isDark ? '#cbd5e1' : '#1a1a1a'}
                />
                <FontAwesome
                  name="google-wallet"
                  size={14}
                  color={isDark ? '#cbd5e1' : '#1a1a1a'}
                />
              </View>
            </TouchableOpacity>

            {/* COD Option */}
            <TouchableOpacity
              style={[
                styles.paymentMethodCard,
                {
                  backgroundColor: isDark ? '#334155' : '#f8fafc',
                  borderColor:
                    paymentMethod === 'cod'
                      ? isDark
                        ? '#8b5cf6'
                        : '#635BFF'
                      : isDark
                      ? '#475569'
                      : '#e2e8f0',
                },
              ]}
              onPress={() => handlePaymentMethodChange('cod')}
            >
              <View style={styles.paymentMethodHeader}>
                <View style={styles.paymentMethodLogo}>
                  <View
                    style={[styles.codIcon, { backgroundColor: '#10b981' }]}
                  >
                    <Icon name="money" size={14} color="#fff" />
                  </View>
                  <Text
                    style={[
                      styles.paymentMethodText,
                      { color: isDark ? '#e2e8f0' : '#1a1a1a' },
                    ]}
                  >
                    Cash on Delivery
                  </Text>
                </View>
                {paymentMethod === 'cod' && (
                  <View
                    style={[
                      styles.selectedIndicator,
                      { backgroundColor: isDark ? '#8b5cf6' : '#635BFF' },
                    ]}
                  >
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
              </View>
              <View style={styles.codBadgeContainer}>
                <View style={styles.codBadge}>
                  <MaterialCommunityIcons
                    name="cash-check"
                    size={12}
                    color="#fff"
                  />
                  <Text style={styles.codBadgeText}>PAY ON DELIVERY</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Payment Details - Same UI */}
      <Animated.View
        style={[
          styles.section,
          { backgroundColor: isDark ? '#1e293b' : '#fff' },
        ]}
      >
        <View style={styles.sectionHeader}>
          {paymentMethod === 'online' ? (
            <Icon
              name="credit-card"
              size={18}
              color={isDark ? '#3B82F6' : '#2563EB'}
            />
          ) : (
            <MaterialCommunityIcons
              name="cash-multiple"
              size={18}
              color={isDark ? '#8b5cf6' : '#635BFF'}
            />
          )}
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? '#e2e8f0' : '#1a1a1a' },
            ]}
          >
            {paymentMethod === 'online'
              ? 'Payment Details'
              : 'COD Confirmation'}
          </Text>
        </View>

        <View
          style={[
            styles.paymentInfoCard,
            { backgroundColor: isDark ? '#334155' : '#f8fafc' },
          ]}
        >
          {paymentMethod === 'online' ? (
            <>
              <View style={styles.paymentMethodHeader}>
                <View style={styles.paymentMethodLogo}>
                  <View style={styles.zeptpayLogoContainer}>
                    <View
                      style={[
                        styles.zeptpayDot,
                        { backgroundColor: isDark ? '#3B82F6' : '#2563EB' },
                      ]}
                    />
                    <View
                      style={[
                        styles.zeptpayDot,
                        { backgroundColor: '#60A5FA' },
                      ]}
                    />
                    <View
                      style={[
                        styles.zeptpayDot,
                        { backgroundColor: '#93C5FD' },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.paymentMethodText,
                      { color: isDark ? '#e2e8f0' : '#1a1a1a' },
                    ]}
                  >
                    ZeptPay Secure Payment
                  </Text>
                </View>
                <View
                  style={[
                    styles.secureBadge,
                    { backgroundColor: isVerified ? '#10b981' : '#94a3b8' },
                  ]}
                >
                  <Icon name="lock" size={10} color="#fff" />
                  <Text style={styles.secureBadgeText}>
                    {isVerified
                      ? 'Secure'
                      : health?.status === 'verifying'
                      ? 'Verifying'
                      : 'Unverified'}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.paymentDescription,
                  { color: isDark ? '#cbd5e1' : '#64748b' },
                ]}
              >
                Secure payment via ZeptPay. Accepts cards, UPI, net banking &
                wallets.
              </Text>

              {paymentSheetData && isVerified && (
                <View
                  style={[
                    styles.successContainer,
                    { backgroundColor: isDark ? '#1e293b' : '#f0fdf4' },
                  ]}
                >
                  <Icon name="check-circle" size={14} color="#10b981" />
                  <Text
                    style={[
                      styles.successText,
                      { color: isDark ? '#e2e8f0' : '#10b981' },
                    ]}
                  >
                    Ready to pay ₹{paymentSheetData.grandTotal} via ZeptPay
                    {paymentSheetData.paymentType === 'qr' && ' (QR Code)'}
                    {paymentSheetData.paymentType === 'autopay' && ' (AutoPay)'}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.paymentMethodHeader}>
                <View style={styles.paymentMethodLogo}>
                  <View
                    style={[
                      styles.codIconLarge,
                      { backgroundColor: '#10b981' },
                    ]}
                  >
                    <Icon name="money" size={16} color="#fff" />
                  </View>
                  <Text
                    style={[
                      styles.paymentMethodText,
                      { color: isDark ? '#e2e8f0' : '#1a1a1a' },
                    ]}
                  >
                    Cash on Delivery
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.paymentDescription,
                  { color: isDark ? '#cbd5e1' : '#64748b' },
                ]}
              >
                Pay ₹{paymentUtils.formatPrice(calculatedData?.grandTotal || 0)}{' '}
                when your item is delivered.
              </Text>
            </>
          )}
        </View>
      </Animated.View>

      {/* Pay Button */}
      <View
        style={[
          styles.section,
          { backgroundColor: isDark ? '#1e293b' : '#fff' },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[
              styles.payButton,
              {
                backgroundColor:
                  paymentMethod === 'online'
                    ? isDark
                      ? '#3B82F6'
                      : '#2563EB'
                    : isDark
                    ? '#8b5cf6'
                    : '#635BFF',
              },
              isButtonDisabled && styles.disabledButton,
            ]}
            onPress={handlePayment}
            onPressIn={() =>
              Animated.spring(buttonScale, {
                toValue: 0.95,
                useNativeDriver: true,
              }).start()
            }
            onPressOut={() =>
              Animated.spring(buttonScale, {
                toValue: 1,
                useNativeDriver: true,
              }).start()
            }
            disabled={isButtonDisabled}
          >
            <View style={styles.payButtonContent}>
              {loading || paymentProcessing || externalLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <View style={styles.lockIcon}>
                    {paymentMethod === 'online' ? (
                      <Icon name="lock" size={20} color="#fff" />
                    ) : (
                      <Icon name="money" size={20} color="#fff" />
                    )}
                  </View>
                  <View style={styles.buttonTextContainer}>
                    <Text style={styles.payButtonMainText}>{buttonText}</Text>
                    <Text style={styles.payButtonSubText}>
                      {paymentMethod === 'online'
                        ? 'Securely via ZeptPay'
                        : 'Pay on delivery'}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Address Section */}
      <Animated.View
        style={[
          styles.section,
          { backgroundColor: isDark ? '#1e293b' : '#fff' },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Icon
            name="location-on"
            size={18}
            color={isDark ? '#8b5cf6' : '#635BFF'}
          />
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? '#e2e8f0' : '#1a1a1a' },
            ]}
          >
            Delivery Address
          </Text>
        </View>
        <View
          style={[
            styles.addressContainer,
            { backgroundColor: isDark ? '#334155' : '#f8fafc' },
          ]}
        >
          <Text
            style={[
              styles.addressText,
              { color: isDark ? '#e2e8f0' : '#1a1a1a' },
            ]}
          >
            {checkoutData.shippingAddress?.address}
          </Text>
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={[styles.section, styles.verticalBrandFooter]}>
        <View style={styles.verticalBrandSection}>
          <View style={styles.tizzygoVerticalBrand}>
            <Image
              source={AIRCLOUD_LOGO}
              style={styles.tizzygoFooterLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.tizzygoFooterBrandText}>AirCloud</Text>
              <Text style={styles.tizzygoFooterTagline}>
                Superfast Delivery
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.verticalSeparator} />
        <View style={styles.verticalBrandSection}>
          <View style={styles.zeptpayVerticalBrand}>
            <View style={styles.zeptpayVerticalLogo}>
              <View
                style={[
                  styles.zeptpayVerticalDot,
                  { backgroundColor: '#3B82F6' },
                ]}
              />
              <View
                style={[
                  styles.zeptpayVerticalDot,
                  { backgroundColor: '#60A5FA' },
                ]}
              />
              <View
                style={[
                  styles.zeptpayVerticalDot,
                  { backgroundColor: '#93C5FD' },
                ]}
              />
            </View>
            <Text style={styles.zeptpayVerticalText}>ZeptPay</Text>
            <Text style={styles.zeptpayPartnerText}>Payment Partner</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

// Keep all styles exactly as they were in the original file
const styles = StyleSheet.create({
  container: { flex: 1 },
  brandHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  tizzygoHeader: { flexDirection: 'row', alignItems: 'center' },
  aircloudLogo: { width: 48, height: 48, borderRadius: 10, marginRight: 12 },
  tizzygoBrandText: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  tizzygoTagline: { fontSize: 10, fontWeight: '500' },
  secureTransactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  secureTransactionText: { fontSize: 12, fontWeight: '600', flex: 1 },
  trustedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustedBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  section: {
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
    flex: 1,
    letterSpacing: -0.3,
  },
  productSummary: { marginBottom: 12 },
  productName: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  productQuantity: { fontSize: 11 },
  finalTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  finalTotalLabel: { fontSize: 14, fontWeight: '600' },
  finalTotalValue: { fontSize: 18, fontWeight: '900' },
  paymentMethodContainer: { gap: 12 },
  paymentMethodCard: { borderRadius: 12, padding: 16, borderWidth: 1 },
  paymentMethodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentMethodLogo: { flexDirection: 'row', alignItems: 'center' },
  zeptpayLogoContainer: { flexDirection: 'row', marginRight: 8 },
  zeptpayDot: { width: 6, height: 6, borderRadius: 3, marginRight: 2 },
  paymentMethodText: { fontSize: 13, fontWeight: '700' },
  paymentMethodIcons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  codIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  codIconLarge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  codBadgeContainer: { marginTop: 8, marginBottom: 12 },
  codBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  },
  codBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInfoCard: { borderRadius: 12, padding: 16 },
  secureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secureBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  paymentDescription: { fontSize: 11, lineHeight: 16, marginBottom: 16 },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  successText: { fontSize: 11, fontWeight: '600' },
  payButton: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#94a3b8',
    shadowColor: '#94a3b8',
    opacity: 0.7,
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  lockIcon: { marginRight: 12 },
  buttonTextContainer: { flex: 1 },
  payButtonMainText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  payButtonSubText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  addressContainer: { borderRadius: 10, padding: 14 },
  addressText: { fontSize: 11, fontWeight: '500', lineHeight: 16 },
  verticalBrandFooter: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  verticalBrandSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  tizzygoVerticalBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  tizzygoFooterLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  tizzygoFooterBrandText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  tizzygoFooterTagline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginTop: 4,
  },
  verticalSeparator: {
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 16,
  },
  zeptpayVerticalBrand: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  zeptpayVerticalLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  zeptpayVerticalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 2,
  },
  zeptpayVerticalText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  zeptpayPartnerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
});

const PaymentStep: React.FC<PaymentStepProps> = props => {
  return <PaymentStepComponent {...props} />;
};

export default PaymentStep;
