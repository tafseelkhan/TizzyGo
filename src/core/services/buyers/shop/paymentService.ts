// src/services/paymentService.ts - FULLY FIXED
import * as paymentApi from '../../../../api/features/private/paymentPrivateSlice';
import { getToken } from '../../../../api/connections/token/tokenSlice';
import { generateIdempotencyKey } from "../../../../core/utils/buyers/shop/throttle";

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

  // ✅ MAIN FIX: Initialize with token properly
  async initialize(): Promise<boolean> {
    console.log('========================================');
    console.log('🔄 [PaymentService] initialize() STARTED');
    console.log('========================================');
    console.log('  - isInitialized before:', this.isInitialized);
    console.log('  - hasToken before:', !!this.authToken);
    console.log('  - initializationAttempts:', this.initializationAttempts);

    // If already initialized, return true
    if (this.isInitialized && this.authToken) {
      console.log('✅ [PaymentService] Already initialized, returning true');
      return true;
    }

    // If already initializing, wait for it
    if (this.initPromise) {
      console.log('⏳ [PaymentService] Already initializing, waiting...');
      return await this.initPromise;
    }

    // Start initialization
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
      // Get token from storage
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

      // Set token and mark initialized
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

  // ✅ Check if service is ready
  isReady(): boolean {
    return this.isInitialized && !!this.authToken;
  }

  // ✅ Get current status
  getStatus(): { initialized: boolean; hasToken: boolean } {
    return {
      initialized: this.isInitialized,
      hasToken: !!this.authToken,
    };
  }

  async createCheckoutSession(
    address: any,
    paymentMethod: 'online' | 'cod',
  ): Promise<{
    success: boolean;
    checkoutSessionId?: string;
    paymentSheetData?: PaymentSessionData;
    error?: string;
  }> {
    console.log('========================================');
    console.log('🚀 [PaymentService] createCheckoutSession CALLED');
    console.log('========================================');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('💳 Payment Method:', paymentMethod);

    // 🔥 GENERATE IDEMPOTENCY KEY HERE
    const idempotencyKey = generateIdempotencyKey();
    console.log('🔑 [Idempotency Key]:', idempotencyKey);

    console.log('  - isInitialized:', this.isInitialized);
    console.log('  - hasToken:', !!this.authToken);

    // ✅ IMPORTANT: Ensure initialized before proceeding
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
        idempotencyKey, // <--- 🔥 YAHAN SE KEY BHEJ RAHE HAIN
      );

      console.log('📥 [PaymentService] API Response received');
      console.log('  - success:', response.success);
      console.log('  - hasCheckoutSessionId:', !!response.checkoutSessionId);
      console.log('  - vendorCodeUID:', response.vendorCodeUID);

      if (response.success) {
        console.log('✅ [PaymentService] API call successful');

        let paymentSheetData: PaymentSessionData | undefined;

        if (paymentMethod !== 'cod' && response.vendorCodeUID) {
          console.log('📦 Creating payment sheet data...');
          paymentSheetData = {
            vendorCodeUID: response.vendorCodeUID,
            amount: response.finalAmount,
            appName: response.appName || 'TizzyGo',
            payer: response.payer,
            currency: 'INR',
            checkoutSessionId: response.checkoutSessionId,
            paymentType: response.paymentType || 'normal',
            qrCodeId: response.qrCodeId,
            mandateId: response.mandateId,
            frequency: response.frequency,
            nextPaymentDate: response.nextPaymentDate,
          };
        }

        return {
          success: true,
          checkoutSessionId: response.checkoutSessionId,
          paymentSheetData,
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
        paymentResult?.id;

      const paymentMethodResult =
        paymentResult.data?.method || paymentResult?.paymentMethod || 'online';

      console.log('📤 Calling processPaymentAPI...');
      const response = await paymentApi.processPaymentAPI(
        checkoutSessionId,
        transactionId,
        paymentMethodResult,
        paymentSheetData.paymentType,
      );

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
