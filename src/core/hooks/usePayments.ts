// src/hooks/usePayment.ts - FULLY FIXED
import { useState, useEffect, useCallback, useRef } from 'react';
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
  console.log('========================================');
  console.log('🎯 [usePayment] HOOK INITIALIZED');
  console.log('========================================');

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
  const [isServiceReady, setIsServiceReady] = useState(false);

  // Refs to prevent duplicate calls
  const initializedRef = useRef(false);
  const creatingSessionRef = useRef(false);

  // ✅ FIX 1: Initialize payment service properly with await
  useEffect(() => {
    const initService = async () => {
      if (initializedRef.current) {
        console.log('⏭️ Already initialized, skipping');
        return;
      }

      initializedRef.current = true;
      setLoading(true);

      console.log('🔄 Initializing payment service...');
      const success = await paymentService.initialize();

      setIsServiceReady(success);
      setLoading(false);

      console.log(`✅ Initialization ${success ? 'SUCCESS' : 'FAILED'}`);
      console.log('Service status:', paymentService.getStatus());
    };

    initService();
  }, []);

  // ✅ FIX 2: Create checkout session only when service is ready
  useEffect(() => {
    const createSession = async () => {
      // Don't create if already created or currently creating
      if (checkoutSessionCreated || creatingSessionRef.current) {
        return;
      }

      // Wait for service to be ready
      if (!isServiceReady) {
        console.log('⏳ Service not ready yet, waiting...');
        return;
      }

      // Check if we have all required data
      if (!product || !calculatedData || !checkoutData?.shippingAddress) {
        console.log('⏳ Missing required data:', {
          product: !!product,
          calculatedData: !!calculatedData,
          address: !!checkoutData?.shippingAddress,
        });
        return;
      }

      // Create session
      creatingSessionRef.current = true;
      await createCheckoutSession();
      creatingSessionRef.current = false;
    };

    createSession();
  }, [
    product,
    calculatedData,
    checkoutData?.shippingAddress,
    paymentMethod,
    isServiceReady,
    checkoutSessionCreated,
  ]);

  // ZeptPay health check
  useEffect(() => {
    if (paymentMethod === 'online' && verifyProvider && isServiceReady) {
      if (!isVerified && health?.status !== 'verifying') {
        console.log('🔄 Verifying ZeptPay provider...');
        verifyProvider();
      }
    }
  }, [
    paymentMethod,
    isVerified,
    health?.status,
    verifyProvider,
    isServiceReady,
  ]);

  const createCheckoutSession = async () => {
    console.log('========================================');
    console.log('🚀 createCheckoutSession CALLED');
    console.log('========================================');

    try {
      setCheckoutSessionCreated(false);
      setPaymentSheetData(null);

      console.log('📤 Calling paymentService.createCheckoutSession...');

      const result = await paymentService.createCheckoutSession(
        checkoutData.shippingAddress,
        paymentMethod,
      );

      console.log('📥 Result:', {
        success: result.success,
        hasSessionId: !!result.checkoutSessionId,
        error: result.error,
      });

      if (result.success) {
        console.log('✅ Checkout session created successfully');
        setCheckoutSessionId(result.checkoutSessionId!);
        setCheckoutSessionCreated(true);

        if (result.paymentSheetData) {
          console.log('📦 Setting payment sheet data');
          setPaymentSheetData(result.paymentSheetData);
        }
      } else {
        console.error('❌ Failed:', result.error);
        Alert.alert(
          'Error',
          result.error || 'Failed to create checkout session',
        );
      }
    } catch (error: any) {
      console.error('❌ Exception:', error.message);
      Alert.alert('Error', 'Failed to initialize payment');
    }
  };

  const handlePaymentMethodChange = (method: 'online' | 'cod') => {
    if (paymentMethod === method) return;

    console.log(
      `🔄 Changing payment method from ${paymentMethod} to ${method}`,
    );
    setPaymentMethod(method);
    onPaymentMethodChange?.(method);

    // Reset session so new one can be created
    setCheckoutSessionCreated(false);
    setCheckoutSessionId('');
    setPaymentSheetData(null);
    creatingSessionRef.current = false;
  };

  const handleOnlinePayment = async () => {
    console.log('💳 handleOnlinePayment CALLED');

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
        console.log('✅ Payment successful');
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
            setTimeout(() => onOrderConfirmed?.(transaction), 3000);
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
        console.log('Payment cancelled');
      } else if (isError) {
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
    console.log('📦 handleCODConfirmation CALLED');

    if (!checkoutSessionCreated) {
      Alert.alert('Error', 'Order session not ready. Please wait.');
      return;
    }

    try {
      setLoading(true);
      const result = await paymentService.confirmCODOrder(checkoutSessionId);

      if (result.success) {
        console.log('✅ COD order confirmed');
        Alert.alert(
          'Order Confirmed! 🎉',
          'Your COD order has been confirmed.',
          [
            {
              text: 'View Order',
              onPress: () => onOrderConfirmed?.(result.transaction),
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
    console.log('🟢 handlePayment CALLED');

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
    loading: loading || paymentProcessing,
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
