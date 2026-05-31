// src/hooks/usePayment.ts
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useZeptPay } from '@flixora/zeptpay-payment-react-native';
import paymentService from '../services/shop/paymentService';
import * as paymentUtils from '../utils/shop/paymentUtils';

interface UsePaymentProps {
  product: any;
  calculatedData: any;
  checkoutData: any;
  onOrderConfirmed?: (orderData: any) => void;
  onPaymentMethodChange?: (method: 'online' | 'cod') => void;
}

export const usePayment = ({
  product,
  calculatedData,
  checkoutData,
  onOrderConfirmed,
  onPaymentMethodChange,
}: UsePaymentProps) => {
  // ZeptPay hooks
  const zeptPayHook = useZeptPay();
  const openZeptPayPaymentSheet = (zeptPayHook as any).openZeptPayPaymentSheet;
  const isVerified = (zeptPayHook as any).isVerified || false;
  const health = (zeptPayHook as any).health || {
    status: 'unknown',
    mode: 'test',
  };
  const verifyProvider = (zeptPayHook as any).verifyProvider;
  const confirmPayment = (zeptPayHook as any).confirmPayment;
  const failPayment = (zeptPayHook as any).failPayment;
  const setPaymentLoading = (zeptPayHook as any).setPaymentLoading;

  // State
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>(
    'online',
  );
  const [checkoutSessionId, setCheckoutSessionId] = useState<string>('');
  const [checkoutSessionCreated, setCheckoutSessionCreated] = useState(false);
  const [paymentSheetData, setPaymentSheetData] = useState<any>(null);

  // Initialize payment service
  useEffect(() => {
    paymentService.initialize();
  }, []);

  // Create checkout session
  useEffect(() => {
    if (product && calculatedData && checkoutData.shippingAddress) {
      createCheckoutSession();
    }
  }, [product, calculatedData, checkoutData.shippingAddress, paymentMethod]);

  // ZeptPay health check
  useEffect(() => {
    if (paymentMethod === 'online' && verifyProvider) {
      if (!isVerified && health?.status !== 'verifying') {
        verifyProvider();
      }
    }
  }, [paymentMethod, isVerified, health?.status, verifyProvider]);

  const createCheckoutSession = async () => {
    try {
      setCheckoutSessionCreated(false);
      setPaymentSheetData(null);

      const result = await paymentService.createCheckoutSession(
        checkoutData.shippingAddress,
        paymentMethod,
      );

      if (result.success) {
        setCheckoutSessionId(result.checkoutSessionId!);
        setCheckoutSessionCreated(true);
        if (result.paymentSheetData) {
          setPaymentSheetData(result.paymentSheetData);
        }
      } else {
        Alert.alert(
          'Error',
          result.error || 'Failed to create checkout session',
        );
      }
    } catch (error) {
      console.error('Create session error:', error);
      Alert.alert('Error', 'Failed to initialize payment');
    }
  };

  const handlePaymentMethodChange = (method: 'online' | 'cod') => {
    if (paymentMethod === method) return;
    setPaymentMethod(method);
    onPaymentMethodChange?.(method);
  };

  const handleOnlinePayment = async () => {
    if (!checkoutSessionCreated || !paymentSheetData) {
      Alert.alert('Error', 'Payment session not ready. Please wait.');
      return;
    }

    if (!openZeptPayPaymentSheet) {
      Alert.alert('Error', 'Payment system not properly initialized.');
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

      const result = await openZeptPayPaymentSheet({
        vendorCodeUID: paymentSheetData.vendorCodeUID,
        amount: paymentSheetData.amount,
        appName: paymentSheetData.appName,
        currency: paymentSheetData.currency,
        payer: paymentSheetData.payer,
        checkoutSessionId: paymentSheetData.checkoutSessionId,
        customerId: paymentSheetData.payer.userId,
      });

      const { isSuccessful, isCancelled, isError } =
        paymentUtils.parsePaymentResult(result);

      if (isSuccessful) {
        if (setPaymentLoading) setPaymentLoading(true);

        const paymentResult = await paymentService.processOnlinePayment(
          checkoutSessionId,
          paymentSheetData,
          result,
        );

        if (paymentResult.success) {
          const { transaction, orderId } = paymentResult;
          const success = paymentUtils.handleTransactionStatus(
            transaction,
            confirmPayment,
            failPayment,
            paymentSheetData,
            orderId!,
          );

          if (success) {
            setTimeout(() => {
              onOrderConfirmed?.(transaction);
              // Navigation handled by parent
            }, 3000);
          }
        } else {
          if (failPayment)
            failPayment(paymentResult.error || 'Order confirmation failed');
          Alert.alert(
            'Payment Failed',
            paymentResult.error || 'Order confirmation failed',
          );
        }

        if (setPaymentLoading) setPaymentLoading(false);
      } else if (isCancelled) {
        console.log('🚫 Payment cancelled');
      } else if (isError) {
        console.log('❌ Payment error:', result.error);
        Alert.alert(
          'Payment Failed',
          result.error || 'Payment could not be completed',
        );
      }
    } catch (error: any) {
      console.error('Payment Error:', error);
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
      const result = await paymentService.confirmCODOrder(checkoutSessionId);

      if (result.success) {
        Alert.alert(
          'Order Confirmed! 🎉',
          'Your COD order has been confirmed.',
          [
            {
              text: 'View Order',
              onPress: () => {
                onOrderConfirmed?.(result.transaction);
                // Navigation handled by parent
              },
            },
          ],
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to confirm COD order');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to confirm COD order');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!calculatedData) {
      Alert.alert('Error', 'Please wait for calculations');
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

  return {
    loading,
    paymentProcessing,
    paymentMethod,
    checkoutSessionCreated,
    paymentSheetData,
    isVerified,
    health,
    openZeptPayPaymentSheet,
    confirmPayment,
    failPayment,
    handlePaymentMethodChange,
    handlePayment,
    isCodAvailable: product?.cashOnDelivery === true,
  };
};
