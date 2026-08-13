// ============================================================
// api/features/private/orderTrackingPrivateSlice.ts
// ============================================================
// COMPLETE TYPES FOR ORDER TRACKING - MATCHES BACKEND

import { getToken } from '../../connections/token/tokenSlice';
import { fetchHandler } from '../../../core/utils/handler/fetchHandler';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { API_BASE_URL } from '../../connections/snippet/apiBaseUrl';

// ============================================================
// ✅ ORDER TYPE (matches backend order object)
// ============================================================

export interface OrderObject {
  _id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  sellerName?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  productId?: string;
  productTitle?: string;
  productImage?: string;
  productBrand?: string;
  productCategory?: string;
  variant?: {
    id: string;
    name: string;
    fields?: Record<string, any>;
  };
  quantity: number;
  price: number;
  finalAmount: number;
  totalAmount: number;
  paymentStatus: string;
  status: string;
  fulfillmentType: 'SELLER' | 'FWS';
  cashOnDelivery: boolean;
  shippingAddress?: {
    address: string;
    latitude: number;
    longitude: number;
    googlePlaceId?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  sellerAddress?: {
    address: string;
    latitude: number;
    longitude: number;
    googlePlaceId?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  trackingId?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ============================================================
// ✅ TRACKING LOCATION TYPES
// ============================================================

export interface TrackingLocation {
  latitude: number;
  longitude: number;
  address?: string;
  googlePlaceId?: string;
  updatedAt?: string | Date;
}

export interface AddressInfo {
  address: string;
  latitude: number;
  longitude: number;
  googlePlaceId?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

// ============================================================
// ✅ SHIPPING PARTNER TYPE
// ============================================================

export interface ShippingPartner {
  id: string;
  name: string | null;
  phone: string | null;
  type: 'RIDER' | 'TRUCK' | null;
  location: {
    latitude: number;
    longitude: number;
    updatedAt?: string | Date;
  };
}

// ============================================================
// ✅ FWS INFO TYPE
// ============================================================

export interface FWSInfo {
  fwsCode: string;
  name: string;
  city: string;
  address: string;
  processingStage: string;
  updatedAt: string | Date;
}

// ============================================================
// ✅ ROUTE HISTORY ENTRY TYPE
// ============================================================

export interface RouteHistoryEntry {
  scanId: string;
  scanFingerprint: string;
  fromHolderId: string;
  fromHolderType: 'SELLER' | 'RIDER' | 'FWS' | 'TRUCK' | 'BUYER';
  fromHolderName?: string;
  toHolderId: string;
  toHolderType: 'SELLER' | 'RIDER' | 'FWS' | 'TRUCK' | 'BUYER';
  toHolderName?: string;
  scannedByUserId: string;
  scannedByName?: string;
  scannedByType?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  transferredAt: string | Date;
  scanType: 'HANDOVER' | 'VERIFICATION' | 'DISPATCH' | 'DELIVERY';
}

// ============================================================
// ✅ ASSIGNMENT HISTORY ENTRY TYPE
// ============================================================

export interface AssignmentHistoryEntry {
  assignmentId: string;
  assigneeId: string;
  assigneeType: 'RIDER' | 'TRUCK';
  assignedBy: string;
  assignedByType: 'SELLER' | 'FWS';
  assignedAt: string | Date;
  assignmentType: 'AUTO' | 'MANUAL';
  distance: number;
  status:
    | 'PENDING_ACCEPTANCE'
    | 'ACCEPTED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'COMPLETED';
  acceptedAt?: string | Date;
  rejectedAt?: string | Date;
  cancelledAt?: string | Date;
  completedAt?: string | Date;
}

// ============================================================
// ✅ TIMELINE EVENT TYPE
// ============================================================

export interface TimelineEvent {
  status: string;
  displayStatus: string;
  holderType: 'SELLER' | 'RIDER' | 'FWS' | 'TRUCK' | 'BUYER';
  holderName?: string;
  holderId?: string;
  timestamp: string | Date;
  note?: string;
  isCurrent?: boolean;
  isCompleted?: boolean;
  icon?: string;
  color?: string;
}

// ============================================================
// ✅ TRACKING OBJECT TYPE (Full tracking data)
// ============================================================

export interface TrackingObject {
  trackingId: string;
  currentStatus: string;
  currentHolderType: 'SELLER' | 'RIDER' | 'FWS' | 'TRUCK' | 'BUYER';
  currentHolderId: string;
  currentHolderName?: string;
  currentLocation?: TrackingLocation;
  currentFWS?: FWSInfo | null;
  currentShipping?: ShippingPartner | null;
  routeHistory: RouteHistoryEntry[];
  assignmentHistory: AssignmentHistoryEntry[];
  qrOwnershipHistory: any[];
  trackingHistory: any[];
  totalFWSVisited: number;
  totalRidersInvolved: number;
  totalTrucksInvolved: number;
  deliveredAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ============================================================
// ✅ ORDER TRACKING DATA (Main response type)
// ============================================================

export interface OrderTrackingData {
  // Tracking status
  trackingCreated: boolean;
  currentStatus: string;
  trackingAvailable: boolean;

  // Order
  order: OrderObject;

  // Tracking (null if not created)
  tracking: TrackingObject | null;

  // Addresses
  buyerAddress: AddressInfo;
  sellerAddress: AddressInfo;

  // Rider Info (if rider active)
  riderLocation?: TrackingLocation | null;
  riderName?: string | null;
  riderPhone?: string | null;
  riderRating?: number | null;

  // Shipping Partner
  shippingPartner?: ShippingPartner | null;

  // FWS Info
  fwsInfo?: FWSInfo | null;

  // Timeline
  timeline: TimelineEvent[];

  // ETA & Distance
  distance?: number | null;
  eta?: number | null;
  estimatedDelivery?: string | null;

  // Status Flags
  isDelivered: boolean;
  isCancelled: boolean;

  // Message
  message?: string;

  // Product Info (extracted from order for convenience)
  product: {
    id: string;
    title: string;
    image: string;
    brand?: string;
    category?: string;
  };
  variant?: {
    id: string;
    name: string;
    fields?: Record<string, any>;
  };
  quantity: number;
  price: number;
  totalAmount: number;

  // Order Info (extracted for convenience)
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
  trackingId?: string;

  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;
  deliveredAt?: string | Date;
}

// ============================================================
// ✅ API RESPONSE TYPE
// ============================================================

export interface OrderTrackingResponse {
  success: boolean;
  data?: OrderTrackingData;
  error?: string;
  message?: string;
}

// ============================================================
// ✅ SOCKET UPDATE TYPE
// ============================================================

export interface TrackingSocketUpdate {
  orderId: string;
  trackingId: string;
  currentStatus: string;
  currentHolderType: 'SELLER' | 'RIDER' | 'FWS' | 'TRUCK' | 'BUYER';
  currentHolderId: string;
  currentLocation?: TrackingLocation;
  destinationLocation?: AddressInfo;
  riderLocation?: TrackingLocation;
  timeline: TimelineEvent[];
  estimatedDelivery?: string;
  distance?: number;
  eta?: number;
}

// ============================================================
// ✅ HELPER: Get Headers
// ============================================================

const getHeaders = async (): Promise<Record<string, string>> => {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ============================================================
// ✅ API METHODS
// ============================================================

/**
 * ✅ GET ORDER TRACKING INITIAL DATA
 * Called ONLY ONCE when screen loads.
 * After that, ALL updates come through Socket.IO.
 * NO POLLING! ✅
 */
export const getOrderTrackingData = async (
  orderId: string,
): Promise<OrderTrackingResponse> => {
  console.log('📍 ORDER TRACKING API CALLED:', orderId);

  if (!orderId) {
    throw new Error('orderId is required');
  }

  try {
    const headers = await getHeaders();
    const url = `${API_BASE_URL}${API_ENDPOINTS.ORDER_TRACKING}/${orderId}`;

    const data = await fetchHandler(url, {
      method: 'GET',
      headers,
    });

    if (!data || !data.success) {
      throw new Error(data?.error || 'Failed to fetch tracking data');
    }

    return data;
  } catch (error: any) {
    console.error('❌ Order Tracking API Error:', error.message);
    throw error;
  }
};

/**
 * ✅ GET ORDER TRACKING WITH RETRY
 */
export const getOrderTrackingDataWithRetry = async (
  orderId: string,
  maxRetries: number = 3,
  retryDelay: number = 1000,
): Promise<OrderTrackingResponse> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await getOrderTrackingData(orderId);
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise<void>(resolve =>
          setTimeout(() => resolve(), retryDelay),
        );
        retryDelay *= 2;
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
};

/**
 * ✅ GET ORDER STATUS ONLY (Lightweight)
 */
export const getOrderStatus = async (
  orderId: string,
): Promise<{
  orderId: string;
  trackingCreated: boolean;
  currentStatus: string;
  isDelivered: boolean;
  isCancelled: boolean;
  eta?: number | null;
  distance?: number | null;
  trackingAvailable: boolean;
}> => {
  try {
    const response = await getOrderTrackingData(orderId);
    if (response.success && response.data) {
      return {
        orderId: response.data.orderId,
        trackingCreated: response.data.trackingCreated,
        currentStatus: response.data.currentStatus,
        isDelivered: response.data.isDelivered,
        isCancelled: response.data.isCancelled,
        eta: response.data.eta,
        distance: response.data.distance,
        trackingAvailable: response.data.trackingAvailable,
      };
    }
    throw new Error(response.error || 'Failed to fetch order status');
  } catch (error: any) {
    console.error('❌ Error fetching order status:', error.message);
    throw error;
  }
};

// ============================================================
// ✅ HELPER FUNCTIONS
// ============================================================

export const getDisplayStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending_seller_acceptance: 'Pending Seller Acceptance',
    created: 'Order Placed',
    waiting_for_assignment: 'Waiting for Assignment',
    in_transit_to_fws: 'In Transit to Warehouse',
    received_at_fws: 'Received at Warehouse',
    scanned_at_fws: 'Scanned at Warehouse',
    ready_for_dispatch: 'Ready for Dispatch',
    assignment_sent: 'Rider Assigned',
    assignment_accepted: 'Rider Accepted',
    picked_up: 'Picked Up',
    in_transit: 'In Transit',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending_seller_acceptance: '#F59E0B',
    created: '#6B7280',
    waiting_for_assignment: '#6B7280',
    in_transit_to_fws: '#F59E0B',
    received_at_fws: '#F59E0B',
    scanned_at_fws: '#F59E0B',
    ready_for_dispatch: '#3B82F6',
    assignment_sent: '#3B82F6',
    assignment_accepted: '#3B82F6',
    picked_up: '#8B5CF6',
    in_transit: '#8B5CF6',
    out_for_delivery: '#22C55E',
    delivered: '#22C55E',
    cancelled: '#EF4444',
  };
  return colorMap[status] || '#6B7280';
};

export const getProgressPercentage = (status: string): number => {
  const progressMap: Record<string, number> = {
    pending_seller_acceptance: 0,
    created: 0,
    waiting_for_assignment: 10,
    in_transit_to_fws: 15,
    received_at_fws: 25,
    scanned_at_fws: 35,
    ready_for_dispatch: 50,
    assignment_sent: 60,
    assignment_accepted: 65,
    picked_up: 75,
    in_transit: 80,
    out_for_delivery: 90,
    delivered: 100,
    cancelled: 100,
  };
  return progressMap[status] || 0;
};

export const formatDistance = (distanceKm?: number): string => {
  if (!distanceKm) return '--';
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(1)} km`;
};

export const formatETA = (minutes?: number): string => {
  if (!minutes) return '--';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export const getHolderIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    SELLER: 'store',
    RIDER: 'motorbike',
    TRUCK: 'truck',
    FWS: 'warehouse',
    BUYER: 'home',
  };
  return iconMap[type] || 'circle';
};

export const getHolderColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    SELLER: '#F59E0B',
    RIDER: '#8B5CF6',
    TRUCK: '#8B5CF6',
    FWS: '#3B82F6',
    BUYER: '#22C55E',
  };
  return colorMap[type] || '#6B7280';
};

// ============================================================
// ✅ CACHE HELPERS
// ============================================================

let cachedTrackingData: OrderTrackingData | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 30000;

export const getCachedTrackingData = (): OrderTrackingData | null => {
  if (!cachedTrackingData || !cacheTimestamp) return null;
  if (Date.now() - cacheTimestamp > CACHE_DURATION) {
    cachedTrackingData = null;
    cacheTimestamp = null;
    return null;
  }
  return cachedTrackingData;
};

export const updateTrackingCache = (data: OrderTrackingData): void => {
  cachedTrackingData = data;
  cacheTimestamp = Date.now();
};

export const clearTrackingCache = (): void => {
  cachedTrackingData = null;
  cacheTimestamp = null;
};

// ============================================================
// ✅ EXPORTS
// ============================================================

export default {
  getOrderTrackingData,
  getOrderTrackingDataWithRetry,
  getOrderStatus,
  getDisplayStatus,
  getStatusColor,
  getProgressPercentage,
  formatDistance,
  formatETA,
  getHolderIcon,
  getHolderColor,
  getCachedTrackingData,
  updateTrackingCache,
  clearTrackingCache,
};
