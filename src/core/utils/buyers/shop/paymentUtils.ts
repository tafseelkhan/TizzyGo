// src/utils/paymentUtils.ts

export const formatPrice = (price: number): string => {
  if (!price && price !== 0) return '0.00';
  return price.toFixed(2);
};

export const getTotalPayable = (calculatedData: any): number => {
  if (!calculatedData) return 0;
  return (
    calculatedData.grandTotal +
    (calculatedData.deliveryCharge || 0) -
    (calculatedData.discountApplied || 0)
  );
};

export const getButtonText = (
  paymentMethod: 'online' | 'cod',
  calculatedData: any,
): string => {
  if (paymentMethod === 'online') {
    return `Pay ₹${formatPrice(calculatedData?.grandTotal || 0)}`;
  }
  return 'Confirm COD Order';
};

export const isPaymentButtonDisabled = (
  loading: boolean,
  paymentProcessing: boolean,
  externalLoading: boolean,
  paymentMethod: 'online' | 'cod',
  isVerified: boolean,
  paymentSheetData: any,
  openZeptPayPaymentSheet: any,
): boolean => {
  if (loading || paymentProcessing || externalLoading) return true;
  if (paymentMethod === 'online') {
    if (!isVerified) return true;
    if (!paymentSheetData) return true;
    if (!openZeptPayPaymentSheet) return true;
  }
  return false;
};

export const parsePaymentResult = (result: any) => {
  const isSuccessful =
    result?.status === 'data_collected' ||
    result?.success === true ||
    result?.status === 'success';

  const isCancelled =
    result?.status === 'cancelled' || result?.cancelled === true;

  const isError = result?.status === 'error' || result?.error === true;

  return { isSuccessful, isCancelled, isError };
};

export const buildSuccessData = (
  transaction: any,
  paymentSheetData: any,
  orderId: string,
) => {
  const successData: any = {
    success: true,
    _id: transaction._id,
    zeptpayTransactionId: transaction.zeptpayTransactionId,
    amount: transaction.amount,
    currency: transaction.currency,
    paymentMethod: transaction.paymentMethod,
    status: 'captured',
    paidAt: transaction.paidAt,
    payer: {
      name: transaction.payer?.name || paymentSheetData.payer.name,
    },
    receiver: {
      name: transaction.receiver?.name || paymentSheetData.appName,
    },
    source: transaction.source,
    orderId: orderId,
  };

  if (paymentSheetData.paymentType === 'qr') {
    successData.message = 'QR payment successful';
    successData.qrCodeId = paymentSheetData.qrCodeId;
  } else if (paymentSheetData.paymentType === 'autopay') {
    successData.mandateId = paymentSheetData.mandateId;
    successData.frequency = paymentSheetData.frequency;
    successData.nextPaymentDate = paymentSheetData.nextPaymentDate;
  }

  return successData;
};

export const handleTransactionStatus = (
  transaction: any,
  confirmPayment: any,
  failPayment: any,
  paymentSheetData: any,
  orderId: string,
): boolean => {
  if (transaction?.status === 'captured' || transaction?.status === 'success') {
    console.log('🎉 Payment successful');
    if (confirmPayment) {
      const successData = buildSuccessData(
        transaction,
        paymentSheetData,
        orderId,
      );
      confirmPayment(successData);
    }
    return true;
  } else if (transaction?.status === 'processing') {
    console.log('⏳ Payment processing');
    if (confirmPayment) {
      confirmPayment({
        success: true,
        _id: transaction._id,
        zeptpayTransactionId: transaction.zeptpayTransactionId,
        amount: transaction.amount,
        currency: transaction.currency,
        paymentMethod: transaction.paymentMethod,
        status: 'processing',
        paidAt: transaction.paidAt,
        payer: {
          name: transaction.payer?.name || paymentSheetData.payer.name,
        },
        receiver: {
          name: transaction.receiver?.name || paymentSheetData.appName,
        },
        source: transaction.source,
        orderId: orderId,
      });
    }
    return false;
  } else if (transaction?.status === 'failed') {
    console.log('❌ Payment failed');
    if (failPayment) {
      failPayment('Payment failed. Please try again.');
    }
    return false;
  }
  return false;
};
