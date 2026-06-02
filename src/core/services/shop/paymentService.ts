// src/services/paymentService.ts
import * as paymentApi from '../../../api/features/private/paymentPrivateSlice';
import { getToken } from '../../../api/connections/token/tokenSlice';

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

  async initialize() {
    this.authToken = await getToken();
    return !!this.authToken;
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
    try {
      if (!this.authToken) {
        await this.initialize();
      }

      // ✅ FIX: Only 2 arguments - authToken is handled by interceptor or stored internally
      const response = await paymentApi.createPaymentIntentAPI(
        address,
        paymentMethod,
        // this.authToken!,  // ❌ REMOVE THIS - API expects only 2 args
      );

      if (response.success) {
        let paymentSheetData: PaymentSessionData | undefined;

        if (paymentMethod !== 'cod' && response.vendorCodeUID) {
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

      return { success: false, error: 'Failed to create checkout session' };
    } catch (error: any) {
      console.error('Session error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  async processOnlinePayment(
    checkoutSessionId: string,
    paymentSheetData: PaymentSessionData,
    paymentResult: any,
  ): Promise<PaymentResult> {
    try {
      const transactionId =
        paymentResult.data?.transactionId ||
        paymentResult?.transactionId ||
        paymentResult.data?.id ||
        paymentResult?.id;

      const paymentMethodResult =
        paymentResult.data?.method || paymentResult?.paymentMethod || 'online';

      // ✅ processPaymentAPI expects 4 arguments
      const response = await paymentApi.processPaymentAPI(
        checkoutSessionId,
        transactionId,
        paymentMethodResult,
        paymentSheetData.paymentType,
      );

      if (response.success) {
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
      console.error('Process payment error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  async confirmCODOrder(checkoutSessionId: string): Promise<PaymentResult> {
    try {
      // ✅ confirmCODAPI expects 1 argument
      const response = await paymentApi.confirmCODAPI(checkoutSessionId);

      if (response.success) {
        return {
          success: true,
          orderId: response.order?.orderId || response.orderId,
          transaction: response.order,
        };
      }

      return { success: false, error: 'COD confirmation failed' };
    } catch (error: any) {
      console.error('COD error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }
}

export default new PaymentService();
