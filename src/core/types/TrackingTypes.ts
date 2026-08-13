// src/types/tracking.types.ts

export interface ILocation {
  latitude: number;
  longitude: number;
  address?: string;
  googlePlaceId?: string;
}

export interface IAddressInfo {
  address: string;
  latitude: number;
  longitude: number;
}

export interface ITimelineEvent {
  status: string;
  holderType: string;
  holderName?: string;
  timestamp: Date;
  note?: string;
  isCurrent?: boolean;
  isCompleted?: boolean;
}

export interface ITrackingUpdate {
  orderId: string;
  trackingId: string;
  currentStatus: string;
  currentHolderType: 'SELLER' | 'RIDER' | 'FWS' | 'TRUCK' | 'BUYER';
  currentHolderId: string;
  currentLocation?: ILocation;
  destinationLocation?: IAddressInfo;
  riderLocation?: ILocation;
  timeline: ITimelineEvent[];
  estimatedDelivery?: string;
  distance?: number;
  eta?: number;
}

export interface IInitialTrackingData {
  order: any;
  tracking: any;
  buyerAddress: IAddressInfo;
  sellerAddress: IAddressInfo;
  riderLocation?: ILocation;
  timeline: ITimelineEvent[];
  distance?: number;
  eta?: number;
}

export interface ITrackingResponse {
  success: boolean;
  data?: IInitialTrackingData;
  error?: string;
}
