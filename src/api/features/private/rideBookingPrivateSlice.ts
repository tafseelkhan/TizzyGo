// services/api/rideApi.ts

import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { TIZZYOS_API_BASE_URL } from '../../connections/snippet/apiBaseUrl';
import {
  apiRequest,
  ApiError,
} from '../../../core/utils/handler/apiClient';

// ============================================================
// SAFE URL JOINER — combined base
// ============================================================

const apiUrl = (path: string): string => {
  if (!TIZZYOS_API_BASE_URL) {
    throw new Error('TIZZYOS_TIZZYGO_API_BASE_URL is not configured.');
  }
  return `${TIZZYOS_API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
};

// ============================================================
// HELPERS
// ============================================================

const isAuthError = (error: unknown): boolean =>
  error instanceof ApiError && (error.status === 401 || error.status === 403);

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
};

// ================================
// TYPES
// ================================

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  googlePlaceId: string;
}

export interface DriverOption {
  driverId: string;
  driverCode: string;
  isOnline: boolean;
  isAvailable: boolean;
  isTrackingOn: boolean;
  speed?: number;
  heading?: number;
  vehicleNumber: string;
  vehicleColor: string;
  vehicleType: string;
  vehicleClass: string;
  maxPassengers: number;
  passengerCapacity: number;
  seatCapacity: number;
  luggageCapacity: number;
  handBagCapacity: number;
  hasAC: boolean;
  manufacturingYear?: number;
  distance: number;
  location: {
    latitude: number;
    longitude: number;
  };
  driverToPickupPolyline?: string;
  driverEtaMinutes: number;
  rideTypes: Array<{
    code: string;
    name: string;
    description: string;
    estimatedFare: number;
    isFastest: boolean;
    vehicleClasses: string[];
  }>;
}

export interface VehicleOption {
  rideTypeCode: string;
  rideTypeName: string;
  rideTypeDescription: string;
  isFastest: boolean;
  driverEtaMinutes: number;
  driverCount: number;
  vehicleType: string;
  vehicleClass: string;
  maxPassengers: number;
  hasAC: boolean;
  luggageCapacity: number;
  handBagCapacity: number;
  seatCapacity: number;
  passengerCapacity: number;
  categoryCode: string;
  companyCode: string;
  modelCode: string;
  class: string;
  baseFare: number;
  classFare: number;
  estimatedFare: number;
  distance: number;
  duration: number;
  polyline: string;
  eta: number;
  estimatedDriverArrival: number;
  quoteId: string;
  driverOption?: DriverOption;
  fastestRideType?: {
    code: string;
    name: string;
    estimatedFare: number;
    description: string;
  };
  totalRideTypes?: number;
}

export interface RideOptionsResponse {
  success: boolean;
  data?: {
    options: VehicleOption[];
    expiresAt: string;
    route?: {
      encodedPolyline: string;
      distanceMeters: number;
      duration: string;
    };
  };
  message?: string;
}

export interface BookingRequest {
  quoteId: string;
  serviceType: 'LOCAL_RIDE' | 'AIRPORT';
  paymentMethod: 'COC' | 'ONLINE';
}

export interface BookingResponse {
  success: boolean;
  data?: {
    bookingId: string;
    status: string;
    fare: number;
    pickup: Location;
    destination: Location;
    vehicle: VehicleOption;
    estimatedDuration: number;
    polyline: string;
  };
  message?: string;
}

export interface SearchStatusResponse {
  success: boolean;
  data?: {
    bookingId: string;
    status: string;
    currentBatch: number;
    searchRadius: number;
    searchCompleted: boolean;
    driversFound: number;
    elapsedSeconds: number;
    fare: number;
    originalFare: number;
  };
}

export interface CancelBookingResponse {
  success: boolean;
  data?: any;
  message?: string;
}

export interface BookingDetailResponse {
  success: boolean;
  data?: any;
  message?: string;
}

export interface RetryResponse {
  success: boolean;
  message?: string;
}

// ================================
// RIDE API CLASS
// ================================

class RideBooking {
  // ================================
  // 1. GET RIDE OPTIONS (QUOTE)
  // ================================

  getRideOptions = async (
    pickup: Location,
    drop: Location,
  ): Promise<RideOptionsResponse> => {
    if (!pickup || !drop) {
      return {
        success: false,
        message: 'Pickup and drop locations are required',
      };
    }

    try {
      const data = await apiRequest<RideOptionsResponse>(
        apiUrl(API_ENDPOINTS.RIDE_OPTIONS),
        {
          method: 'POST',
          body: JSON.stringify({ pickup, drop }),
        },
      );

      return data || { success: false, message: 'Failed to get ride options' };
    } catch (error) {
      if (isAuthError(error)) {
        return { success: false, message: 'Please login to continue.' };
      }
      console.error('Get ride options API error:', error);
      return {
        success: false,
        message: getErrorMessage(error, 'Failed to get ride options'),
      };
    }
  };

  getAirportRideOptions = async (
    pickup: Location,
    drop: Location,
    tripType: 'AIRPORT_TO_LOCATION' | 'LOCATION_TO_AIRPORT',
  ): Promise<RideOptionsResponse> => {
    if (!pickup || !drop) {
      return {
        success: false,
        message: 'Pickup and drop locations are required',
      };
    }

    if (
      !tripType ||
      !['AIRPORT_TO_LOCATION', 'LOCATION_TO_AIRPORT'].includes(tripType)
    ) {
      return {
        success: false,
        message:
          'Valid tripType is required: AIRPORT_TO_LOCATION or LOCATION_TO_AIRPORT',
      };
    }

    try {
      const data = await apiRequest<RideOptionsResponse>(
        apiUrl(API_ENDPOINTS.AIRPORT_OPTIONS),
        {
          method: 'POST',
          body: JSON.stringify({ pickup, drop, tripType }),
        },
      );

      return (
        data || { success: false, message: 'Failed to get airport ride options' }
      );
    } catch (error) {
      if (isAuthError(error)) {
        return { success: false, message: 'Please login to continue.' };
      }
      console.error('Get airport ride options API error:', error);
      return {
        success: false,
        message: getErrorMessage(error, 'Failed to get airport ride options'),
      };
    }
  };

  // ================================
  // 2. CREATE BOOKING
  // ================================

  createBooking = async (
    quoteId: string,
    serviceType: 'LOCAL_RIDE' | 'AIRPORT' = 'LOCAL_RIDE',
    paymentMethod: 'COC' | 'ONLINE' = 'COC',
  ): Promise<BookingResponse> => {
    if (!quoteId) {
      return {
        success: false,
        message: 'Quote ID is required',
      };
    }

    try {
      const data = await apiRequest<BookingResponse>(
        apiUrl(API_ENDPOINTS.RIDE_BOOK),
        {
          method: 'POST',
          body: JSON.stringify({
            quoteId,
            serviceType,
            paymentMethod,
          }),
        },
      );

      return data || { success: false, message: 'Failed to create booking' };
    } catch (error) {
      if (isAuthError(error)) {
        return { success: false, message: 'Please login to continue.' };
      }
      console.error('Create booking API error:', error);
      return {
        success: false,
        message: getErrorMessage(error, 'Failed to create booking'),
      };
    }
  };

  // ================================
  // 3. GET SEARCH STATUS
  // ================================

  getSearchStatus = async (
    bookingId: string,
  ): Promise<SearchStatusResponse> => {
    if (!bookingId) {
      return { success: false };
    }

    try {
      const data = await apiRequest<SearchStatusResponse>(
        apiUrl(`${API_ENDPOINTS.RIDE_SEARCH_STATUS}/${bookingId}`),
      );

      return data || { success: false };
    } catch (error) {
      if (isAuthError(error)) {
        return { success: false };
      }
      console.error('Get search status API error:', error);
      return { success: false };
    }
  };

  // ================================
  // 4. RETRY SEARCH
  // ================================

  retrySearch = async (bookingId: string): Promise<RetryResponse> => {
    if (!bookingId) {
      return {
        success: false,
        message: 'Booking ID is required',
      };
    }

    try {
      const data = await apiRequest<RetryResponse>(
        apiUrl(`${API_ENDPOINTS.RIDE_RETRY}/${bookingId}`),
        { method: 'POST' },
      );

      return data || { success: false, message: 'Failed to retry search' };
    } catch (error) {
      if (isAuthError(error)) {
        return { success: false, message: 'Please login to continue.' };
      }
      console.error('Retry search API error:', error);
      return {
        success: false,
        message: getErrorMessage(error, 'Failed to retry search'),
      };
    }
  };

  // ================================
  // 5. CANCEL BOOKING
  // ================================

  cancelBooking = async (
    bookingId: string,
    cancelReason?: string,
  ): Promise<CancelBookingResponse> => {
    if (!bookingId) {
      return {
        success: false,
        message: 'Booking ID is required',
      };
    }

    try {
      const data = await apiRequest<CancelBookingResponse>(
        apiUrl(`${API_ENDPOINTS.RIDE_CANCEL}/${bookingId}`),
        {
          method: 'POST',
          body: JSON.stringify({
            cancelReason: cancelReason || 'No reason provided',
          }),
        },
      );

      return data || { success: false, message: 'Failed to cancel booking' };
    } catch (error) {
      if (isAuthError(error)) {
        return { success: false, message: 'Please login to continue.' };
      }
      console.error('Cancel booking API error:', error);
      return {
        success: false,
        message: getErrorMessage(error, 'Failed to cancel booking'),
      };
    }
  };

  // ================================
  // 6. GET BOOKING DETAILS
  // ================================

  getBooking = async (bookingId: string): Promise<BookingDetailResponse> => {
    if (!bookingId) {
      return {
        success: false,
        message: 'Booking ID is required',
      };
    }

    try {
      const data = await apiRequest<BookingDetailResponse>(
        apiUrl(`${API_ENDPOINTS.RIDE_BOOKING}/${bookingId}`),
      );

      return data || { success: false, message: 'Failed to get booking' };
    } catch (error) {
      if (isAuthError(error)) {
        return { success: false, message: 'Please login to continue.' };
      }
      console.error('Get booking API error:', error);
      return {
        success: false,
        message: getErrorMessage(error, 'Failed to get booking'),
      };
    }
  };

  // ================================
  // 7. GET CUSTOMER BOOKINGS
  // ================================

  getCustomerBookings = async (): Promise<any> => {
    try {
      const data = await apiRequest<any>(
        apiUrl(API_ENDPOINTS.RIDE_CUSTOMER_BOOKINGS),
      );

      return data || { success: false, data: [] };
    } catch (error) {
      if (isAuthError(error)) {
        return { success: false, data: [] };
      }
      console.error('Get customer bookings API error:', error);
      return { success: false, data: [] };
    }
  };

  // ================================
  // 8. GET DRIVER BOOKINGS
  // ================================

  getDriverBookings = async (): Promise<any> => {
    try {
      const data = await apiRequest<any>(
        apiUrl(API_ENDPOINTS.RIDE_DRIVER_BOOKINGS),
      );

      return data || { success: false, data: [] };
    } catch (error) {
      if (isAuthError(error)) {
        return { success: false, data: [] };
      }
      console.error('Get driver bookings API error:', error);
      return { success: false, data: [] };
    }
  };
}

// Export singleton instance
export const rideBooking = new RideBooking();