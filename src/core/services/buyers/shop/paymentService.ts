// src/services/paymentService.ts - FINAL FIXED VERSION
import * as paymentApi from '../../../../api/features/private/paymentPrivateSlice';
import { getToken } from '../../../../api/connections/token/tokenSlice';
import { generateIdempotencyKey } from '../../../../core/utils/buyers/shop/throttle';

export interface PaymentSessionData {
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

export interface PaymentResult {
  success: boolean;
  transaction?: any;
  orderId?: string;
  error?: string;
}

class PaymentService {
  private authToken: string | null = null;
  private isInitialized: boolean = false;
  private initPromise: Promise<boolean> | null = null;
  private initializationAttempts: number = 0;

  constructor() {
    console.log('🏗️ [PaymentService] Constructor called');
    console.log('📅 Timestamp:', new Date().toISOString());
  }

  async initialize(): Promise<boolean> {
    console.log('========================================');
    console.log('🔄 [PaymentService] initialize() STARTED');
    console.log('========================================');
    console.log('  - isInitialized before:', this.isInitialized);
    console.log('  - hasToken before:', !!this.authToken);
    console.log('  - initializationAttempts:', this.initializationAttempts);

    if (this.isInitialized && this.authToken) {
      console.log('✅ [PaymentService] Already initialized, returning true');
      return true;
    }

    if (this.initPromise) {
      console.log('⏳ [PaymentService] Already initializing, waiting...');
      return await this.initPromise;
    }

    this.initPromise = this._doInitialize();
    const result = await this.initPromise;
    this.initPromise = null;
    return result;
  }

  private async _doInitialize(): Promise<boolean> {
    this.initializationAttempts++;
    console.log(
      `🔄 [PaymentService] _doInitialize() attempt ${this.initializationAttempts}`,
    );

    try {
      console.log('📱 [PaymentService] Getting auth token from getToken()...');
      const token = await getToken();

      console.log(
        '  - Token received:',
        token ? `Yes (${token.substring(0, 30)}...)` : 'NO',
      );

      if (!token) {
        console.error(
          '❌ [PaymentService] No token found! User may not be logged in.',
        );
        this.isInitialized = false;
        this.authToken = null;
        return false;
      }

      this.authToken = token;
      this.isInitialized = true;

      console.log('✅ [PaymentService] Initialized successfully');
      console.log('  - isInitialized after:', this.isInitialized);
      console.log('  - hasToken after:', !!this.authToken);
      console.log('========================================');
      return true;
    } catch (error: any) {
      console.error(
        '❌ [PaymentService] Initialization failed:',
        error.message,
      );
      this.isInitialized = false;
      this.authToken = null;
      return false;
    }
  }

  isReady(): boolean {
    return this.isInitialized && !!this.authToken;
  }

  getStatus(): { initialized: boolean; hasToken: boolean } {
    return {
      initialized: this.isInitialized,
      hasToken: !!this.authToken,
    };
  }

  // ✅ CREATE CHECKOUT SESSION - WITH paymentIntentId
  async createCheckoutSession(
    address: any,
    paymentMethod: 'online' | 'cod',
  ): Promise<{
    success: boolean;
    checkoutSessionId?: string;
    paymentSheetData?: PaymentSessionData;
    orderId?: string;
    finalAmount?: number;
    paymentIntentId?: string; // ✅ ADDED
    error?: string;
  }> {
    console.log('========================================');
    console.log('🚀 [PaymentService] createCheckoutSession CALLED');
    console.log('========================================');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('💳 Payment Method:', paymentMethod);

    const idempotencyKey = generateIdempotencyKey();
    console.log('🔑 [Idempotency Key]:', idempotencyKey);

    console.log('  - isInitialized:', this.isInitialized);
    console.log('  - hasToken:', !!this.authToken);

    if (!this.isReady()) {
      console.log('⚠️ [PaymentService] Service not ready, initializing now...');
      const initialized = await this.initialize();

      if (!initialized) {
        console.error('❌ [PaymentService] Failed to initialize');
        return {
          success: false,
          error: 'Payment service not initialized. Please login again.',
        };
      }

      console.log('✅ [PaymentService] Initialization successful');
    }

    try {
      console.log(
        '📤 [PaymentService] Calling paymentApi.createPaymentIntentAPI...',
      );

      const response = await paymentApi.createPaymentIntentAPI(
        address,
        paymentMethod,
        idempotencyKey,
      );

      console.log('📥 [PaymentService] API Response received');
      console.log('  - success:', response.success);
      console.log('  - hasCheckoutSessionId:', !!response.checkoutSessionId);
      console.log('  - orderId:', response.orderId);
      console.log('  - finalAmount:', response.finalAmount);
      console.log('  - paymentIntentId:', response.paymentIntentId); // ✅ LOG THIS

      if (response.success) {
        console.log('✅ [PaymentService] API call successful');

        let paymentSheetData: PaymentSessionData | undefined;

        if (paymentMethod !== 'cod' && response.vendorCodeUID) {
          console.log('📦 Creating payment sheet data...');
          paymentSheetData = {
            vendorCodeUID: response.vendorCodeUID,
            amount: response.finalAmount || 0,
            appName: response.appName || 'TizzyGo',
            payer: response.payer,
            currency: 'INR',
            checkoutSessionId: response.checkoutSessionId || '',
            paymentType: response.paymentType || 'normal',
            qrCodeId: response.qrCodeId,
            mandateId: response.mandateId,
            frequency: response.frequency,
            nextPaymentDate: response.nextPaymentDate,
            orderId: response.orderId,
          };
        }

        // ✅ RETURN paymentIntentId
        return {
          success: true,
          checkoutSessionId: response.checkoutSessionId,
          paymentSheetData,
          orderId: response.orderId,
          finalAmount: response.finalAmount,
          paymentIntentId: response.paymentIntentId, // ✅ YAHI - Razorpay order ID
        };
      }

      console.error('❌ [PaymentService] API failed:', response.error);
      return {
        success: false,
        error: response.error || 'Failed to create checkout session',
      };
    } catch (error: any) {
      console.error('❌ [PaymentService] Exception:', error.message);
      return {
        success: false,
        error:
          error?.response?.data?.error ||
          error?.message ||
          'Failed to create checkout session',
      };
    }
  }

  // ✅ GET ORDER DETAILS
  async getOrderDetails(
    checkoutSessionId: string,
  ): Promise<{ orderId: string } | null> {
    console.log('🔍 [PaymentService] getOrderDetails CALLED');
    console.log('📋 Checkout Session ID:', checkoutSessionId);

    if (!this.isReady()) {
      console.error('❌ Service not ready');
      return null;
    }

    try {
      const response = await paymentApi.getSessionStatusAPI(checkoutSessionId);
      console.log('📥 Response:', JSON.stringify(response, null, 2));

      if (response.success && response.order) {
        const orderId = response.order.orderId;
        console.log('✅ Order ID fetched:', orderId);
        return { orderId };
      }

      console.log('⚠️ No order found for session:', checkoutSessionId);
      return null;
    } catch (error: any) {
      console.error('❌ Failed to fetch order details:', error.message);
      return null;
    }
  }

  // ✅ PROCESS ONLINE PAYMENT
  async processOnlinePayment(
    checkoutSessionId: string,
    paymentSheetData: PaymentSessionData,
    paymentResult: any,
  ): Promise<PaymentResult> {
    console.log('========================================');
    console.log('💳 [PaymentService] processOnlinePayment CALLED');
    console.log('========================================');

    if (!this.isReady()) {
      console.error('❌ Service not ready');
      return { success: false, error: 'Payment service not initialized' };
    }

    try {
      const transactionId =
        paymentResult.data?.transactionId ||
        paymentResult?.transactionId ||
        paymentResult.data?.id ||
        paymentResult?.id ||
        paymentResult?.razorpay_payment_id;

      const paymentMethodResult =
        paymentResult.data?.method || paymentResult?.paymentMethod || 'online';

      console.log('📤 Calling processPaymentAPI...');
      console.log('  - checkoutSessionId:', checkoutSessionId);
      console.log('  - transactionId:', transactionId);
      console.log('  - paymentMethodResult:', paymentMethodResult);
      console.log('  - paymentType:', paymentSheetData.paymentType);

      const response = await paymentApi.processPaymentAPI(
        checkoutSessionId,
        transactionId,
        paymentMethodResult,
        paymentSheetData.paymentType,
      );

      console.log('📥 Response:', JSON.stringify(response, null, 2));

      if (response.success) {
        console.log('✅ Payment processed successfully');
        return {
          success: true,
          transaction: response.transaction,
          orderId: response.orderId || response.transaction?._id,
        };
      }

      return {
        success: false,
        error: response.error || 'Payment processing failed',
      };
    } catch (error: any) {
      console.error('❌ Exception:', error.message);
      return {
        success: false,
        error: error?.message || 'Payment processing failed',
      };
    }
  }

  // ✅ CONFIRM COD ORDER
  async confirmCODOrder(checkoutSessionId: string): Promise<PaymentResult> {
    console.log('========================================');
    console.log('📦 [PaymentService] confirmCODOrder CALLED');
    console.log('========================================');

    if (!this.isReady()) {
      return { success: false, error: 'Payment service not initialized' };
    }

    try {
      console.log('📤 Calling confirmCODAPI...');
      const response = await paymentApi.confirmCODAPI(checkoutSessionId);

      console.log('📥 Response:', JSON.stringify(response, null, 2));

      if (response.success) {
        console.log('✅ COD order confirmed');
        return {
          success: true,
          orderId: response.order?.orderId || response.orderId,
          transaction: response.order,
        };
      }

      return {
        success: false,
        error: response.error || 'COD confirmation failed',
      };
    } catch (error: any) {
      console.error('❌ Exception:', error.message);
      return {
        success: false,
        error: error?.message || 'COD confirmation failed',
      };
    }
  }
}

export default new PaymentService();
