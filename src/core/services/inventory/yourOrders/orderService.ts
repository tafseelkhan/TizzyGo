// services/orderService.ts

import { ordersApi } from '../../../../api/features/private/yourOrderPrivateSlice';

export interface Order {
  _id?: string;
  orderId?: string;
  status?: string;
  deliveryStatus?: string;
  createdAt?: string;
  items?: OrderItem[];
  finalAmount?: number;
  buyerAddress?: {
    address?: string;
  };
}

export interface OrderItem {
  quantity?: number;
  productData?: {
    title?: string;
    description?: string;
    brand?: string;
    category?: string;
    finalPrice?: number;
    savedAmount?: number;
  };
  selectedVariant?: {
    weight?: string;
    productFinalPrice?: number;
    productSavedAmount?: number;
    deliveryCharge?: number;
  };
}

// Helper function
const getOrderStatus = (order: Order): string => {
  return (
    order.deliveryStatus?.toLowerCase() ?? order.status?.toLowerCase() ?? ''
  );
};

export const orderService = {
  getUserOrders: async (): Promise<Order[]> => {
    const data = await ordersApi.fetchUserOrders();

    if (Array.isArray(data)) {
      return data;
    }

    if (data?.orders && Array.isArray(data.orders)) {
      return data.orders;
    }

    if (data?.data && Array.isArray(data.data)) {
      return data.data;
    }

    return [];
  },

  getOrderStats: (orders: Order[]) => {
    const total = orders.length;

    const delivered = orders.filter(order =>
      ['delivered', 'succeeded'].includes(getOrderStatus(order)),
    ).length;

    const active = orders.filter(order =>
      ['processing', 'confirmed', 'picked_up'].includes(getOrderStatus(order)),
    ).length;

    const pending = orders.filter(order =>
      ['pending'].includes(getOrderStatus(order)),
    ).length;

    return {
      total,
      delivered,
      active,
      pending,
    };
  },
};
