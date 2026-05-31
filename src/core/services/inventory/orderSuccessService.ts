// services/orderSuccessService.ts
import {
  ordersApi,
  LiveDeliveryData,
  DeliveryStatus,
} from '../../../api/features/private/orderSuccessPrivateSlice';

export interface DeliveryEstimate {
  estimatedTime: number;
  estimatedDelivery: string;
  deliveryType: 'express' | 'standard';
  distance: string;
}

export interface OrderDetails {
  _id?: string;
  orderId?: string;
  deliveryStatus?: DeliveryStatus;
  finalAmount?: number;
  paymentMethod?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  title?: string;
  quantity?: number;
  price?: number;
}

export interface StatusConfig {
  title: string;
  subtitle: string;
  animation: any;
  progressPercentage: number;
  currentStepIndex: number;
  showRiderInfo: boolean;
  showSellerInfo: boolean;
  showDeliveryProgress: boolean;
  mainButtonText: string;
}

export const orderSuccessService = {
  fetchOrderDetails: async (orderId: string): Promise<OrderDetails> => {
    const data = await ordersApi.fetchOrderDetails(orderId);

    if (data.success && data.order) {
      return data.order;
    }
    throw new Error(data.message || 'Failed to fetch order details');
  },

  fetchLiveDeliveryData: async (orderId: string): Promise<LiveDeliveryData> => {
    const data = await ordersApi.fetchLiveDeliveryData(orderId);

    if (data.success) {
      return data;
    }

    // Return default data
    return {
      success: false,
      deliveryStatus: 'waiting_for_seller',
      estimate: {
        minutes: 45,
        text: '45-55 minutes',
        distance: '5 km',
      },
    };
  },

  getStatusConfig: (status: DeliveryStatus): StatusConfig => {
    const configs: Record<DeliveryStatus, StatusConfig> = {
      waiting_for_seller: {
        title: 'Order Confirmed!',
        subtitle: 'Seller is preparing your order',
        animation: require('../../components/animations/lotties/delivery.json'),
        progressPercentage: 0,
        currentStepIndex: 0,
        showRiderInfo: false,
        showSellerInfo: true,
        showDeliveryProgress: true,
        mainButtonText: 'View Order Details',
      },
      pending_rider_accept: {
        title: 'Order Ready!',
        subtitle: 'Waiting for rider to accept delivery',
        animation: require('../../components/animations/lotties/delivery.json'),
        progressPercentage: 25,
        currentStepIndex: 1,
        showRiderInfo: false,
        showSellerInfo: true,
        showDeliveryProgress: true,
        mainButtonText: 'Track Order Status',
      },
      assigned: {
        title: 'Rider Assigned!',
        subtitle: 'Your delivery rider is on the way to seller',
        animation: require('../../components/animations/lotties/delivery.json'),
        progressPercentage: 50,
        currentStepIndex: 2,
        showRiderInfo: true,
        showSellerInfo: true,
        showDeliveryProgress: true,
        mainButtonText: 'Track Live Location',
      },
      waiting_for_rider: {
        title: 'Waiting for Rider',
        subtitle: 'Rider has arrived at seller location',
        animation: require('../../components/animations/lotties/delivery.json'),
        progressPercentage: 75,
        currentStepIndex: 3,
        showRiderInfo: true,
        showSellerInfo: true,
        showDeliveryProgress: true,
        mainButtonText: 'Track Live Location',
      },
      picked_up: {
        title: 'Order Picked Up!',
        subtitle: 'Rider has picked up your order and is on the way',
        animation: require('../../components/animations/lotties/delivery.json'),
        progressPercentage: 90,
        currentStepIndex: 4,
        showRiderInfo: true,
        showSellerInfo: false,
        showDeliveryProgress: true,
        mainButtonText: 'Track Live Delivery',
      },
      delivered: {
        title: 'Order Delivered!',
        subtitle: 'Your order has been successfully delivered',
        animation: require('../../components/animations/lotties/delivery.json'),
        progressPercentage: 100,
        currentStepIndex: 5,
        showRiderInfo: false,
        showSellerInfo: false,
        showDeliveryProgress: false,
        mainButtonText: 'Rate Your Order',
      },
    };

    return configs[status];
  },

  mapApiStatusToDeliveryStatus: (apiStatus: string): DeliveryStatus => {
    const statusMap: Record<string, DeliveryStatus> = {
      waiting_for_seller: 'waiting_for_seller',
      pending_rider_accept: 'pending_rider_accept',
      assigned: 'assigned',
      waiting_for_rider: 'waiting_for_rider',
      picked_up: 'picked_up',
      delivered: 'delivered',
      order_confirmed: 'waiting_for_seller',
      order_ready: 'pending_rider_accept',
      rider_assigned: 'assigned',
      rider_arrived: 'waiting_for_rider',
      order_picked: 'picked_up',
      delivery_completed: 'delivered',
    };

    return statusMap[apiStatus] || 'waiting_for_seller';
  },
};
