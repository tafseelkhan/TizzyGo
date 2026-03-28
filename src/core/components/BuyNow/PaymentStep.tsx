import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, CheckoutData, CalculatedData } from '../../types/BuyNowTypes';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useAirXPay } from '@flixora/airxpay-payment-react-native';

interface PaymentStepProps {
  checkoutData: CheckoutData;
  updateCheckoutData: (key: keyof CheckoutData, value: any) => void;
  product: Product | null;
  calculatedData: CalculatedData | null;
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

  // ✅ AirXPay SDK hooks - Use as any to avoid type errors initially
  const airXPayHook = useAirXPay();

  // Log available properties for debugging (remove in production)
  useEffect(() => {
    console.log(
      '🔍 Available AirXPay hook properties:',
      Object.keys(airXPayHook),
    );
  }, []);

  // Dynamic property extraction with fallbacks
  const openAirXPayPaymentSheet =
    (airXPayHook as any).openAirXPayPaymentSheet ||
    (airXPayHook as any).pay ||
    (airXPayHook as any).initiatePayment ||
    (airXPayHook as any).startPayment;

  const isVerified = (airXPayHook as any).isVerified || false;
  const health = (airXPayHook as any).health || {
    status: 'unknown',
    mode: 'test',
  };
  const verifyProvider =
    (airXPayHook as any).verifyProvider ||
    (() => console.log('verifyProvider not available'));

  const confirmPayment =
    (airXPayHook as any).confirmPayment ||
    (airXPayHook as any).onSuccess ||
    (airXPayHook as any).showSuccess;

  const failPayment =
    (airXPayHook as any).failPayment ||
    (airXPayHook as any).onError ||
    (airXPayHook as any).showError;

  const setPaymentLoading =
    (airXPayHook as any).setPaymentLoading ||
    (airXPayHook as any).setLoading ||
    (airXPayHook as any).showProcessing;

  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [authToken, setAuthToken] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>(
    'online',
  );
  const [checkoutSessionId, setCheckoutSessionId] = useState<string>('');
  const [checkoutSessionCreated, setCheckoutSessionCreated] = useState(false);
  const [paymentSheetData, setPaymentSheetData] = useState<any>(null);

  const buttonScale = useRef(new Animated.Value(1)).current;
  const cardElevation = useRef(new Animated.Value(0)).current;

  const API_BASE_URL = 'http://172.20.10.12:5000';

  // Auth token fetch
  useEffect(() => {
    const getAuthToken = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          setAuthToken(token);
          console.log('✅ Auth token loaded');
        } else {
          console.log('❌ No auth token found');
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
    };
    getAuthToken();
  }, []);

  // Create checkout session
  useEffect(() => {
    if (
      product &&
      calculatedData &&
      authToken &&
      checkoutData.shippingAddress
    ) {
      console.log('📝 Creating checkout session...');
      createCheckoutSession();
    } else {
      console.log('⏳ Waiting for data:', {
        product: !!product,
        calculatedData: !!calculatedData,
        authToken: !!authToken,
        address: !!checkoutData.shippingAddress,
      });
    }
  }, [
    product,
    calculatedData,
    authToken,
    checkoutData.shippingAddress,
    paymentMethod,
  ]);

  // AirXPay health check
  useEffect(() => {
    if (paymentMethod === 'online' && verifyProvider) {
      console.log('🏥 Health:', { isVerified, status: health?.status });
      if (!isVerified && health?.status !== 'verifying') {
        console.log('🔄 Verifying provider...');
        verifyProvider();
      }
    }
  }, [paymentMethod, isVerified, health?.status, verifyProvider]);

  const createCheckoutSession = async () => {
    try {
      setCheckoutSessionCreated(false);
      setPaymentSheetData(null);

      console.log('📡 Calling create-payment-intent API...');
      const response = await axios.post(
        `${API_BASE_URL}/api/payment/create-payment-intent`,
        {
          address: checkoutData.shippingAddress,
          paymentMethod: paymentMethod,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      console.log('📦 API Response:', response.data);

      if (response.data.success) {
        setCheckoutSessionId(response.data.checkoutSessionId);
        setCheckoutSessionCreated(true);

        if (paymentMethod !== 'cod' && response.data.vendorCodeUID) {
          setPaymentSheetData({
            vendorCodeUID: response.data.vendorCodeUID,
            amount: response.data.finalAmount,
            appName: response.data.appName || 'TizzyGo',
            payer: response.data.payer,
            currency: 'INR',
            checkoutSessionId: response.data.checkoutSessionId,
            paymentType: response.data.paymentType || 'normal',
            qrCodeId: response.data.qrCodeId,
            mandateId: response.data.mandateId,
            frequency: response.data.frequency,
            nextPaymentDate: response.data.nextPaymentDate,
          });
          console.log(
            '✅ Payment sheet data ready:',
            response.data.paymentType,
          );
        }
      } else {
        console.log('❌ API failed:', response.data);
      }
    } catch (error: any) {
      console.error('❌ Session error:', error.response?.data || error.message);
    }
  };

  const handlePaymentMethodChange = (method: 'online' | 'cod') => {
    if (paymentMethod === method) return;
    setPaymentMethod(method);
    onPaymentMethodChange?.(method);
  };

  const handleOnlinePayment = async () => {
    console.log('🚀 handleOnlinePayment started');
    console.log('📊 State:', {
      checkoutSessionCreated,
      hasPaymentSheetData: !!paymentSheetData,
      isVerified,
      paymentType: paymentSheetData?.paymentType,
      hasOpenPaymentSheet: !!openAirXPayPaymentSheet,
    });

    if (!checkoutSessionCreated || !paymentSheetData) {
      Alert.alert('Error', 'Payment session not ready. Please wait.');
      return;
    }

    if (!openAirXPayPaymentSheet) {
      Alert.alert('Error', 'Payment system not properly initialized.');
      console.error('openAirXPayPaymentSheet function is not available');
      return;
    }

    if (!isVerified) {
      Alert.alert(
        'Payment Unavailable',
        'Payment system is initializing. Please try again.',
        [{ text: 'Retry', onPress: () => verifyProvider?.() }],
      );
      return;
    }

    try {
      setPaymentProcessing(true);

      console.log('💳 Opening payment sheet...');
      const result = await openAirXPayPaymentSheet({
        vendorCodeUID: paymentSheetData.vendorCodeUID,
        amount: paymentSheetData.amount,
        appName: paymentSheetData.appName,
        currency: paymentSheetData.currency,
        payer: paymentSheetData.payer,
        checkoutSessionId: paymentSheetData.checkoutSessionId,
        customerId: paymentSheetData.payer.userId,
      });

      console.log('📦 Payment Result:', JSON.stringify(result, null, 2));

      // Handle different result structures
      const isSuccessful =
        result?.status === 'data_collected' ||
        result?.success === true ||
        result?.status === 'success';

      const isCancelled =
        result?.status === 'cancelled' || result?.cancelled === true;
      const isError = result?.status === 'error' || result?.error === true;

      if (isSuccessful) {
        console.log('📝 Data collected, calling process-payment API...');

        // Show processing screen if available
        if (setPaymentLoading) {
          setPaymentLoading(true);
        }

        try {
          const transactionId =
            result.data?.transactionId ||
            result?.transactionId ||
            result.data?.id ||
            result?.id;

          const paymentMethodResult =
            result.data?.method || result?.paymentMethod || 'online';

          console.log('📡 API Request:', {
            url: `${API_BASE_URL}/api/payment/process-payment`,
            data: {
              checkoutSessionId: paymentSheetData.checkoutSessionId,
              transactionId: transactionId,
              paymentMethod: paymentMethodResult,
              paymentType: paymentSheetData.paymentType,
            },
          });

          const processResponse = await axios.post(
            `${API_BASE_URL}/api/payment/process-payment`,
            {
              checkoutSessionId: paymentSheetData.checkoutSessionId,
              transactionId: transactionId || null,
              paymentMethod: paymentMethodResult,
              paymentType: paymentSheetData.paymentType,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
            },
          );

          console.log('📦 Process Response:', processResponse.data);

          if (processResponse.data.success) {
            const transaction = processResponse.data.transaction;
            const orderId = processResponse.data.orderId || transaction?._id;

            console.log('✅ Order confirmed:', orderId);
            console.log('📊 Transaction Status:', transaction?.status);

            // Show success screen based on transaction status
            if (
              transaction?.status === 'captured' ||
              transaction?.status === 'success'
            ) {
              console.log('🎉 Payment successful');

              if (confirmPayment) {
                const successData = {
                  success: true,
                  _id: transaction._id,
                  airxpayTransactionId: transaction.airxpayTransactionId,
                  amount: transaction.amount,
                  currency: transaction.currency,
                  paymentMethod: transaction.paymentMethod,
                  status: 'captured',
                  paidAt: transaction.paidAt,
                  payer: {
                    name:
                      transaction.payer?.name || paymentSheetData.payer.name,
                  },
                  receiver: {
                    name:
                      transaction.receiver?.name || paymentSheetData.appName,
                  },
                  source: transaction.source,
                  orderId: orderId,
                };

                // Add payment type specific fields
                if (paymentSheetData.paymentType === 'qr') {
                  Object.assign(successData, {
                    message: 'QR payment successful',
                    qrCodeId: paymentSheetData.qrCodeId,
                  });
                } else if (paymentSheetData.paymentType === 'autopay') {
                  Object.assign(successData, {
                    mandateId: paymentSheetData.mandateId,
                    frequency: paymentSheetData.frequency,
                    nextPaymentDate: paymentSheetData.nextPaymentDate,
                  });
                }

                confirmPayment(successData);
              }

              // Navigate after success
              setTimeout(() => {
                onOrderConfirmed?.(processResponse.data.order);
                navigation.getParent()?.navigate('Order', {
                  screen: 'OrderSuccessScreen',
                  params: { orderId, source: 'online' },
                });
              }, 3000);
            } else if (transaction?.status === 'processing') {
              console.log('⏳ Payment processing');

              if (confirmPayment) {
                confirmPayment({
                  success: true,
                  _id: transaction._id,
                  airxpayTransactionId: transaction.airxpayTransactionId,
                  amount: transaction.amount,
                  currency: transaction.currency,
                  paymentMethod: transaction.paymentMethod,
                  status: 'processing',
                  paidAt: transaction.paidAt,
                  payer: {
                    name:
                      transaction.payer?.name || paymentSheetData.payer.name,
                  },
                  receiver: {
                    name:
                      transaction.receiver?.name || paymentSheetData.appName,
                  },
                  source: transaction.source,
                  orderId: orderId,
                });
              }

              Alert.alert(
                'Payment Processing',
                "Your payment is being processed. You'll receive a notification once confirmed.",
              );
            } else if (transaction?.status === 'failed') {
              console.log('❌ Payment failed');

              if (failPayment) {
                failPayment('Payment failed. Please try again.');
              }
            }
          } else {
            console.log('❌ Process failed:', processResponse.data.error);

            if (failPayment) {
              failPayment(
                processResponse.data.error || 'Order confirmation failed',
              );
            }

            setTimeout(() => {
              Alert.alert(
                'Payment Failed',
                processResponse.data.error || 'Order confirmation failed',
              );
            }, 2000);
          }
        } catch (apiError: any) {
          console.error(
            '💥 API Error:',
            apiError.response?.data || apiError.message,
          );

          if (failPayment) {
            failPayment(
              apiError?.response?.data?.error || 'Order confirmation failed',
            );
          }

          setTimeout(() => {
            Alert.alert(
              'Payment Failed',
              apiError?.response?.data?.error || 'Order confirmation failed',
            );
          }, 2000);
        } finally {
          if (setPaymentLoading) {
            setPaymentLoading(false);
          }
        }
      } else if (isCancelled) {
        console.log('🚫 Payment cancelled');
        if (setPaymentLoading) {
          setPaymentLoading(false);
        }
      } else if (isError) {
        console.log('❌ Payment error:', result.error);
        if (setPaymentLoading) {
          setPaymentLoading(false);
        }
        Alert.alert(
          'Payment Failed',
          result.error || 'Payment could not be completed',
        );
      }
    } catch (error: any) {
      console.error('💥 Payment Error:', error);
      if (setPaymentLoading) {
        setPaymentLoading(false);
      }
      Alert.alert(
        'Payment Error',
        error.message || 'Failed to process payment',
      );
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleCODConfirmation = async () => {
    if (!checkoutSessionCreated) {
      Alert.alert('Error', 'Order session not ready. Please wait.');
      return;
    }

    try {
      setLoading(true);
      console.log('📡 Calling confirm-cod API...');

      const response = await axios.post(
        `${API_BASE_URL}/api/payment/confirm-cod`,
        { checkoutSessionId },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      console.log('📦 COD Response:', response.data);

      if (response.data.success) {
        const orderId = response.data.order?.orderId || response.data.orderId;
        Alert.alert(
          'Order Confirmed! 🎉',
          'Your COD order has been confirmed.',
          [
            {
              text: 'View Order',
              onPress: () => {
                navigation.getParent()?.navigate('Order', {
                  screen: 'OrderSuccessScreen',
                  params: { orderId, source: 'cod' },
                });
                onOrderConfirmed?.(response.data.order);
              },
            },
          ],
        );
      }
    } catch (error: any) {
      console.error('COD Error:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to confirm COD order');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!calculatedData) {
      Alert.alert('Error', 'Please wait for calculations');
      return;
    }
    if (!authToken) {
      Alert.alert('Error', 'Please login to continue');
      return;
    }
    if (!checkoutSessionCreated) {
      Alert.alert('Info', 'Setting up payment session...');
      return;
    }
    if (paymentMethod === 'online') {
      await handleOnlinePayment();
    } else {
      await handleCODConfirmation();
    }
  };

  const formatPrice = (price: number) => price?.toFixed(2) || '0.00';
  const getButtonText = () => {
    if (paymentMethod === 'online') {
      return `Pay ₹${calculatedData?.totalFinalPrice.toFixed(2)}`;
    }
    return 'Confirm COD Order';
  };

  const isButtonDisabled = () => {
    if (loading || paymentProcessing || externalLoading) return true;
    if (paymentMethod === 'online' && !isVerified) return true;
    if (paymentMethod === 'online' && !paymentSheetData) return true;
    if (paymentMethod === 'online' && !openAirXPayPaymentSheet) return true;
    return false;
  };

  const isCodAvailable = product?.cashOnDelivery === true;

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#0f172a' : '#ffffff' },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={[
          styles.brandHeader,
          {
            backgroundColor: isDark ? '#1e293b' : '#fff',
            borderBottomColor: isDark ? '#334155' : '#f0f0f0',
          },
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

      {/* AirXPay Status Badge */}
      <View
        style={[
          styles.secureTransactionBadge,
          {
            backgroundColor: isDark ? '#1e293b' : '#f0f7ff',
            borderColor: isDark ? '#3B82F6' : '#2563EB',
          },
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
            ? `AirXPay • ${health?.mode?.toUpperCase() || 'TEST'} Mode`
            : 'COD Payment'}
        </Text>
        {paymentMethod === 'online' && (
          <View
            style={[
              styles.trustedBadge,
              {
                backgroundColor: isVerified
                  ? '#10b981'
                  : isDark
                  ? '#475569'
                  : '#94a3b8',
              },
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
              ₹
              {formatPrice(
                calculatedData.totalFinalPrice +
                  (calculatedData.deliveryCharge || 0),
              )}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Payment Method Selection */}
      {isCodAvailable && (
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
            {/* Online */}
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
                  <View style={styles.airxpayLogoContainer}>
                    <View
                      style={[
                        styles.airxpayDot,
                        { backgroundColor: isDark ? '#3B82F6' : '#2563EB' },
                      ]}
                    />
                    <View
                      style={[
                        styles.airxpayDot,
                        { backgroundColor: '#60A5FA' },
                      ]}
                    />
                    <View
                      style={[
                        styles.airxpayDot,
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

            {/* COD */}
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

      {/* Payment Details */}
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
                  <View style={styles.airxpayLogoContainer}>
                    <View
                      style={[
                        styles.airxpayDot,
                        { backgroundColor: isDark ? '#3B82F6' : '#2563EB' },
                      ]}
                    />
                    <View
                      style={[
                        styles.airxpayDot,
                        { backgroundColor: '#60A5FA' },
                      ]}
                    />
                    <View
                      style={[
                        styles.airxpayDot,
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
                    AirXPay Secure Payment
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
                Secure payment via AirXPay. Accepts cards, UPI, net banking &
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
                    Ready to pay ₹{paymentSheetData.amount} via AirXPay
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
                Pay ₹{calculatedData?.totalFinalPrice.toFixed(2)} when your item
                is delivered.
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
              isButtonDisabled() && styles.disabledButton,
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
            disabled={isButtonDisabled()}
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
                    <Text style={styles.payButtonMainText}>
                      {getButtonText()}
                    </Text>
                    <Text style={styles.payButtonSubText}>
                      {paymentMethod === 'online'
                        ? 'Securely via AirXPay'
                        : 'Pay on delivery'}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Address */}
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
          <View style={styles.airxpayVerticalBrand}>
            <View style={styles.airxpayVerticalLogo}>
              <View
                style={[
                  styles.airxpayVerticalDot,
                  { backgroundColor: '#3B82F6' },
                ]}
              />
              <View
                style={[
                  styles.airxpayVerticalDot,
                  { backgroundColor: '#60A5FA' },
                ]}
              />
              <View
                style={[
                  styles.airxpayVerticalDot,
                  { backgroundColor: '#93C5FD' },
                ]}
              />
            </View>
            <Text style={styles.airxpayVerticalText}>AirXPay</Text>
            <Text style={styles.airxpayPartnerText}>Payment Partner</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const PaymentStep: React.FC<PaymentStepProps> = props => {
  return <PaymentStepComponent {...props} />;
};

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
  airxpayLogoContainer: { flexDirection: 'row', marginRight: 8 },
  airxpayDot: { width: 6, height: 6, borderRadius: 3, marginRight: 2 },
  paymentMethodText: { fontSize: 13, fontWeight: '700' },
  paymentMethodIcons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  brandInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  brandInfoText: { fontSize: 10, fontWeight: '500' },
  airxpayMiniBrand: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  airxpayMiniLogoContainer: { flexDirection: 'row', alignItems: 'center' },
  airxpayMiniDot: { width: 4, height: 4, borderRadius: 2, marginHorizontal: 1 },
  airxpayMiniText: { fontSize: 10, fontWeight: '700' },
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
  enabledMethods: { marginBottom: 16 },
  enabledMethodsTitle: { fontSize: 11, fontWeight: '600', marginBottom: 8 },
  methodTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  methodTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  methodTagText: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase' },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: { fontSize: 11, fontWeight: '500' },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  warningText: { fontSize: 11, fontWeight: '500' },
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
  airxpayVerticalBrand: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  airxpayVerticalLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  airxpayVerticalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 2,
  },
  airxpayVerticalText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  airxpayPartnerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  finalNote: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: 8,
    marginTop: 10,
    width: '100%',
  },
  finalNoteText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
});

export default PaymentStep;
