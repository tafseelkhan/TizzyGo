// utils/orderUtils.ts
import { Order, OrderItem } from '../../../services/orders/yourOrders/orderService';

export const getFirstProductData = (item: Order) => {
  const firstItem = item.items && item.items.length > 0 ? item.items[0] : null;
  const productData = firstItem?.productData || {};
  const selectedVariant = firstItem?.selectedVariant || {};
  const productFinalPrice = productData.finalPrice || selectedVariant.productFinalPrice || 0;

  return {
    firstItem,
    productData,
    selectedVariant,
    productFinalPrice,
  };
};

export const getStatusColor = (status: any): string => {
  const statusLower = status?.toLowerCase();
  switch (statusLower) {
    case 'delivered':
    case 'succeeded':
      return '#4CAF50';
    case 'picked_up':
    case 'shipped':
      return '#2196F3';
    case 'processing':
    case 'confirmed':
      return '#FF9800';
    case 'cancelled':
    case 'failed':
      return '#F44336';
    case 'pending':
      return '#FFC107';
    default:
      return '#757575';
  }
};

export const getNavigationSource = (orderStatus: string): string => {
  if (orderStatus === 'succeeded') {
    return 'stripe_payment';
  } else if (orderStatus === 'cod_confirmed') {
    return 'cod';
  }
  return 'order_history';
};

export const formatOrderDate = (dateString?: string): string => {
  if (!dateString) return 'Date not available';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};