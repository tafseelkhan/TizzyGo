// src/hooks/usePayment.ts - COMPLETE FIXED VERSION
// ✅ Direct navigation to OrderConfirmation - NO ALERTS on success

import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import Config from 'react-native-config';
import paymentService, {
  BuyNowParams,
} from '../services/buyers/shop/paymentService';

// Razorpay constants
const RAZORPAY_KEY_ID = Config.RAZORPAY_KEY_ID || '';

// ============= TYPES =============
interface UsePaymentProps {
  product: any;
  calculatedData: any;
  checkoutData: any;
  onOrderConfirmed?: (orderData: any) => void;
  onPaymentMethodChange?: (method: 'online' | 'cod') => void;
}

interface PaymentSessionData {
  vendorCodeUID: string;
  amount: number;
  appName: string;
  payer: any;
  currency: string;
  checkoutSessionId: string;
  paymentType: string;
  qrCodeId?: string;
  mandateId?: string;
  frequency?: string;
  nextPaymentDate?: string;
  orderId?: string;
}

interface PaymentSheetData {
  gateway: string;
  grandTotal: number;
  orderId?: string;
  checkoutSessionId?: string;
  paymentIntentId?: string;
  vendorCodeUID?: string;
  amount?: number;
  appName?: string;
  payer?: any;
  currency?: string;
  paymentType?: string;
  [key: string]: any;
}

interface CreateSessionResult {
  success: boolean;
  checkoutSessionId?: string;
  paymentSheetData?: any;
  orderId?: string;
  finalAmount?: number;
  paymentIntentId?: string;
  error?: string;
  order?: { orderId: string; status: string };
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayErrorResponse {
  code: string;
  description?: string;
  error?: {
    description?: string;
    reason?: string;
    code?: string;
    metadata?: any;
  };
}

interface PaymentResult {
  success: boolean;
  transaction?: any;
  orderId?: string;
  error?: string;
}

// ============= HOOK =============
export const usePayment = ({
  product,
  calculatedData,
  checkoutData,
  onOrderConfirmed,
  onPaymentMethodChange,
}: UsePaymentProps) => {
  console.log('🎯 [usePayment] HOOK INITIALIZED - Razorpay Only');

  const [loading, setLoading] = useState<boolean>(false);
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>(
    'online',
  );
  const [checkoutSessionId, setCheckoutSessionId] = useState<string>('');
  const [checkoutSessionCreated, setCheckoutSessionCreated] =
    useState<boolean>(false);
  const [paymentSheetData, setPaymentSheetData] =
    useState<PaymentSheetData | null>(null);
  const [isServiceReady, setIsServiceReady] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState<boolean>(false);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);
  const [lastOrderData, setLastOrderData] = useState<any>(null);

  const initializedRef = useRef<boolean>(false);
  const creatingSessionRef = useRef<boolean>(false);
  const autoCreateAttempted = useRef<boolean>(false);

  const gateway = 'razorpay';
  const gatewayDisplayName = 'Razorpay';
  const health = { status: 'ready', mode: 'production' };

  // ============= INITIALIZATION =============
  useEffect(() => {
    const initService = async (): Promise<void> => {
      if (initializedRef.current) return;
      initializedRef.current = true;
      setLoading(true);

      try {
        const success = await paymentService.initialize();
        setIsServiceReady(success);
        setIsVerified(success);
        console.log(
          `✅ Razorpay initialization ${success ? 'SUCCESS' : 'FAILED'}`,
        );
      } catch (error) {
        console.error('❌ Init error:', error);
        setIsServiceReady(false);
        setIsVerified(false);
      } finally {
        setLoading(false);
      }
    };
    initService();
  }, []);

  // ============= CONVERT TO RAZORPAY ORDER ID =============
  const convertToRazorpayOrderId = (id: string | undefined): string => {
    if (!id) return '';
    if (id.startsWith('order_')) return id;
    if (id.startsWith('ORD-')) {
      return 'order_' + id.substring(4);
    }
    return 'order_' + id;
  };

  // ============= CREATE CHECKOUT SESSION - WITH BUY NOW PARAMS =============
  const createCheckoutSession = useCallback(async (): Promise<boolean> => {
    console.log('🚀 createCheckoutSession CALLED - Razorpay');

    if (creatingSessionRef.current || isCreatingSession) {
      console.log('⏳ Session creation already in progress');
      return false;
    }

    if (!product || !calculatedData || !checkoutData?.shippingAddress) {
      console.error('❌ Missing required data');
      setSessionError('Missing required data');
      return false;
    }

    if (!isServiceReady) {
      console.error('❌ Payment service not ready');
      setSessionError('Payment service is initializing...');
      return false;
    }

    try {
      creatingSessionRef.current = true;
      setIsCreatingSession(true);
      setSessionError(null);
      setCheckoutSessionCreated(false);
      setPaymentSheetData(null);
      setRazorpayOrderId(null);

      // ✅ BUILD BUY NOW PARAMS
      const buyNowParams: BuyNowParams | undefined = checkoutData.isBuyNow
        ? {
            isBuyNow: true,
            productId:
              checkoutData.productId || product.productId || product.id,
            sellerId: checkoutData.sellerId || product.sellerId,
            productDataId:
              checkoutData.productDataId ||
              product.productDataId ||
              product._id,
            quantity: checkoutData.quantity || 1,
            variantId:
              checkoutData.selectedVariant?.variantId || checkoutData.variantId,
          }
        : undefined;

      console.log('📤 Calling paymentService.createCheckoutSession...');
      console.log('🛒 Buy Now Params:', buyNowParams);

      const result = (await paymentService.createCheckoutSession(
        checkoutData.shippingAddress,
        paymentMethod,
        buyNowParams, // ✅ PASS BUY NOW PARAMS
      )) as CreateSessionResult;

      console.log('📥 Full Result:', JSON.stringify(result, null, 2));

      if (result.success) {
        const sessionId = result.checkoutSessionId || '';
        const finalAmount = calculatedData?.grandTotal || 0;
        const orderId = result.orderId || result.paymentSheetData?.orderId;

        const paymentIntentId =
          result.paymentIntentId ||
          result.paymentSheetData?.paymentIntentId ||
          result.paymentSheetData?.razorpayOrderId;

        const razorpayOrderIdValue = convertToRazorpayOrderId(
          paymentIntentId || orderId || sessionId,
        );

        console.log('✅ Checkout session created successfully');
        console.log('📋 Session ID:', sessionId);
        console.log('💰 Final Amount:', finalAmount);
        console.log('📋 Internal Order ID:', orderId);
        console.log('📋 Payment Intent ID:', paymentIntentId);
        console.log('📋 Final Razorpay Order ID:', razorpayOrderIdValue);

        setCheckoutSessionId(sessionId);
        setCheckoutSessionCreated(true);
        setRazorpayOrderId(razorpayOrderIdValue);

        const sheetData: PaymentSheetData = {
          ...result.paymentSheetData,
          gateway: 'razorpay',
          grandTotal: finalAmount,
          orderId: orderId,
          paymentIntentId: razorpayOrderIdValue,
          checkoutSessionId: sessionId,
          vendorCodeUID: result.paymentSheetData?.vendorCodeUID || '',
          amount: finalAmount,
          appName: result.paymentSheetData?.appName || 'TizzyGo',
          payer:
            result.paymentSheetData?.payer ||
            checkoutData?.shippingAddress ||
            {},
          currency: result.paymentSheetData?.currency || 'INR',
          paymentType: result.paymentSheetData?.paymentType || 'normal',
        };

        setPaymentSheetData(sheetData);
        setSessionError(null);
        return true;
      } else {
        console.error('❌ Failed:', result.error);
        setSessionError(result.error || 'Failed to create checkout session');
        Alert.alert(
          'Payment Setup Failed',
          result.error || 'Could not initialize payment.',
        );
        return false;
      }
    } catch (error: any) {
      console.error('❌ Exception:', error.message);
      setSessionError(error.message || 'Unknown error occurred');
      Alert.alert('Error', error.message || 'Failed to initialize payment.');
      return false;
    } finally {
      creatingSessionRef.current = false;
      setIsCreatingSession(false);
    }
  }, [product, calculatedData, checkoutData, paymentMethod, isServiceReady]);

  // ============= AUTO-CREATE SESSION =============
  useEffect(() => {
    const shouldAutoCreate =
      isServiceReady &&
      product &&
      calculatedData &&
      checkoutData?.shippingAddress &&
      !checkoutSessionCreated &&
      !autoCreateAttempted.current &&
      !creatingSessionRef.current;

    if (shouldAutoCreate) {
      autoCreateAttempted.current = true;
      console.log('🔄 Auto-creating checkout session...');
      createCheckoutSession();
    }
  }, [
    isServiceReady,
    product,
    calculatedData,
    checkoutData?.shippingAddress,
    checkoutSessionCreated,
  ]);

  // ============= HANDLE PAYMENT METHOD CHANGE =============
  const handlePaymentMethodChange = useCallback(
    (method: 'online' | 'cod'): void => {
      if (paymentMethod === method) return;
      console.log(
        `🔄 Changing payment method from ${paymentMethod} to ${method}`,
      );
      setPaymentMethod(method);
      onPaymentMethodChange?.(method);

      setCheckoutSessionCreated(false);
      setCheckoutSessionId('');
      setPaymentSheetData(null);
      setRazorpayOrderId(null);
      setSessionError(null);
      creatingSessionRef.current = false;
      autoCreateAttempted.current = false;
    },
    [paymentMethod, onPaymentMethodChange],
  );

  // ============= PARSE RAZORPAY ERROR =============
  const parseRazorpayError = useCallback((error: any): string => {
    if (error.code === 'PAYMENT_CANCELLED')
      return 'You have cancelled the payment.';
    if (error.code === 'NETWORK_ERROR')
      return 'Please check your internet connection.';
    if (error.description) {
      try {
        const parsed = JSON.parse(error.description) as RazorpayErrorResponse;
        if (parsed.error) {
          return (
            parsed.error.description || parsed.error.reason || 'Payment failed'
          );
        }
        return error.description;
      } catch {
        return error.description;
      }
    }
    return error.message || 'Failed to process payment. Please try again.';
  }, []);

  // ============= HANDLE ORDER CONFIRMATION =============
  const handleOrderConfirmation = useCallback(
    (data: any) => {
      console.log('🎉 [usePayment] Order confirmed, data:', data);

      // ✅ Extract checkoutSessionId from various sources
      const sessionId =
        data?.checkoutSessionId ||
        data?.transaction?.checkoutSessionId ||
        checkoutSessionId ||
        paymentSheetData?.checkoutSessionId ||
        null;

      const orderData = {
        checkoutSessionId: sessionId,
        orderId: data?.orderId || data?.transaction?.orderId || null,
        transaction: data?.transaction || data,
        success: true,
      };

      console.log(`📱 [usePayment] Final orderData:`, orderData);
      setLastOrderData(orderData);

      // ✅ Directly call onOrderConfirmed - NO ALERT
      if (onOrderConfirmed) {
        onOrderConfirmed(orderData);
      }
    },
    [checkoutSessionId, paymentSheetData, onOrderConfirmed],
  );

  // ============= RAZORPAY PAYMENT HANDLER =============
  const handleRazorpayPayment = useCallback(async (): Promise<void> => {
    console.log('💳 handleRazorpayPayment CALLED');
    console.log('📋 razorpayOrderId:', razorpayOrderId);
    console.log('📋 paymentSheetData:', paymentSheetData);

    if (!checkoutSessionCreated || !paymentSheetData) {
      console.log('⚠️ Session not ready, attempting to create...');
      setLoading(true);
      const created = await createCheckoutSession();
      setLoading(false);
      if (!created || !checkoutSessionCreated || !paymentSheetData) {
        Alert.alert(
          'Payment Setup Failed',
          'Could not initialize payment session.',
        );
        return;
      }
    }

    if (!RAZORPAY_KEY_ID) {
      Alert.alert('Error', 'Razorpay key is missing. Please contact support.');
      return;
    }

    const orderIdForRazorpay: string =
      razorpayOrderId || paymentSheetData?.paymentIntentId || checkoutSessionId;
    const finalOrderId = convertToRazorpayOrderId(orderIdForRazorpay);

    console.log('📋 Final Order ID for Razorpay:', finalOrderId);

    if (!finalOrderId) {
      Alert.alert('Error', 'Order ID is missing. Please try again.');
      console.error('❌ Order ID is missing!');
      return;
    }

    const grandTotal =
      calculatedData?.grandTotal || paymentSheetData?.grandTotal || 0;
    console.log('💰 Final Grand Total:', grandTotal);

    try {
      setPaymentProcessing(true);
      const amount = Math.round(grandTotal * 100);

      const razorpayOptions = {
        key: RAZORPAY_KEY_ID,
        amount,
        currency: 'INR',
        name: 'Quton',
        description: `Payment for ${product?.title || 'Order'}`,
        order_id: finalOrderId,
        prefill: {
          name: checkoutData?.shippingAddress?.name || 'Customer',
          email: checkoutData?.shippingAddress?.email || '',
          contact: checkoutData?.shippingAddress?.phone || '',
        },
        theme: { color: '#635BFF' },
        notes: {
          checkoutSessionId: checkoutSessionId,
          productId: product?.productId || product?.id,
          productTitle: product?.title || '',
        },
      };

      console.log('📤 Opening Razorpay Checkout...');
      console.log('🔑 Key:', RAZORPAY_KEY_ID);
      console.log('💰 Amount (in paise):', amount);
      console.log('💰 Amount (in rupees):', grandTotal);
      console.log('📋 Order ID:', finalOrderId);

      const razorpayResponse = (await new Promise((resolve, reject) => {
        RazorpayCheckout.open(
          razorpayOptions,
          (data: any) => {
            console.log('✅ Razorpay success:', data);
            resolve(data as RazorpaySuccessResponse);
          },
          (error: any) => {
            console.error('❌ Razorpay error:', error);
            reject(error);
          },
        );
      })) as RazorpaySuccessResponse;

      console.log('📤 Processing payment with backend...');

      const paymentResult = (await paymentService.processOnlinePayment(
        checkoutSessionId,
        razorpayResponse.razorpay_order_id,
        razorpayResponse.razorpay_payment_id,
        razorpayResponse.razorpay_signature,
      )) as PaymentResult;

      if (paymentResult.success) {
        console.log('✅ Razorpay payment successful');

        // ✅ Create order data with checkoutSessionId
        const orderData = {
          checkoutSessionId: checkoutSessionId,
          orderId:
            paymentResult.orderId || paymentResult.transaction?.orderId || null,
          transaction: paymentResult.transaction || paymentResult,
          success: true,
        };

        // ✅ Call handleOrderConfirmation - NO ALERT
        handleOrderConfirmation(orderData);
      } else {
        Alert.alert(
          'Payment Failed',
          paymentResult.error || 'Order confirmation failed',
        );
      }
    } catch (error: any) {
      console.error('❌ Razorpay Payment Error:', error);
      Alert.alert('Payment Error', parseRazorpayError(error));
    } finally {
      setPaymentProcessing(false);
    }
  }, [
    checkoutSessionCreated,
    paymentSheetData,
    checkoutSessionId,
    product,
    checkoutData,
    calculatedData,
    createCheckoutSession,
    parseRazorpayError,
    razorpayOrderId,
    handleOrderConfirmation,
  ]);

  // ============= COD HANDLER =============
  const handleCODConfirmation = useCallback(async (): Promise<void> => {
    console.log('📦 handleCODConfirmation CALLED');
    console.log('📋 checkoutSessionId:', checkoutSessionId);

    if (!checkoutSessionCreated || !checkoutSessionId) {
      Alert.alert('Error', 'Order session not ready. Please wait.');
      return;
    }

    try {
      setLoading(true);
      const result = (await paymentService.confirmCODOrder(
        checkoutSessionId,
      )) as PaymentResult;

      console.log('📦 COD Result:', JSON.stringify(result, null, 2));

      if (result.success) {
        console.log('✅ COD order confirmed');

        // ✅ Extract checkoutSessionId from result
        const sessionId =
          result.transaction?.checkoutSessionId ||
          result.transaction?.checkoutSession?.checkoutSessionId ||
          checkoutSessionId;

        const orderData = {
          checkoutSessionId: sessionId,
          orderId: result.orderId || result.transaction?.orderId || null,
          transaction: result.transaction || result,
          success: true,
        };

        console.log(`📱 [COD] Final orderData:`, orderData);
        setLastOrderData(orderData);

        // ✅ DIRECT NAVIGATION - NO ALERT
        // Just call onOrderConfirmed - CheckoutStepper will handle navigation
        if (onOrderConfirmed) {
          onOrderConfirmed(orderData);
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to confirm COD order');
      }
    } catch (error: any) {
      console.error('❌ COD confirmation error:', error);
      Alert.alert('Error', error.message || 'Failed to confirm COD order');
    } finally {
      setLoading(false);
    }
  }, [checkoutSessionCreated, checkoutSessionId, onOrderConfirmed]);

  // ============= MAIN PAYMENT HANDLER =============
  const handlePayment = useCallback(async (): Promise<void> => {
    console.log('🟢 handlePayment CALLED');

    if (!calculatedData) {
      Alert.alert('Error', 'Please wait for calculations');
      return;
    }

    if (!checkoutSessionCreated) {
      console.log('⚠️ Session not ready, attempting to create...');
      setLoading(true);
      const created = await createCheckoutSession();
      setLoading(false);
      if (!created) {
        Alert.alert('Payment Setup Failed', 'Could not initialize payment.');
        return;
      }
    }

    if (!checkoutSessionCreated) {
      Alert.alert('Error', 'Payment session could not be created.');
      return;
    }

    if (paymentMethod === 'online') {
      await handleRazorpayPayment();
    } else {
      await handleCODConfirmation();
    }
  }, [
    calculatedData,
    checkoutSessionCreated,
    paymentMethod,
    createCheckoutSession,
    handleRazorpayPayment,
    handleCODConfirmation,
  ]);

  // ============= RETURN =============
  return {
    loading,
    paymentProcessing,
    paymentMethod,
    checkoutSessionCreated,
    paymentSheetData,
    isVerified,
    health,
    gateway,
    gatewayDisplayName,
    handlePaymentMethodChange,
    handlePayment,
    isCodAvailable: product?.cashOnDelivery === true,
    createCheckoutSession,
    sessionError,
    isCreatingSession,
    lastOrderData,
  };
};

export default usePayment;
