// services/api/rideApi.ts

import Config from 'react-native-config';
import { getToken } from '../../connections/token/tokenSlice';
import { fetchHandler } from '../../../core/utils/handler/fetchHandler';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';
import { API_BASE_URL } from '../../connections/snippet/apiBaseUrl';

// ================================
// TYPES
// ================================

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  googlePlaceId: string;
}

// ✅ Driver Option Type
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

// ✅ VehicleOption with full backend data
export interface VehicleOption {
  // Ride type fields (backward compatibility)
  rideTypeCode: string;
  rideTypeName: string;
  rideTypeDescription: string;
  isFastest: boolean;
  driverEtaMinutes: number;
  driverCount: number;

  // Vehicle fields
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

  // ✅ NEW: Backend se aane wale fields
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
  // TOKEN HEADERS
  // ================================

  private getHeaders = async (): Promise<Record<string, string>> => {
    try {
      const token = await getToken();

      return {
        'Content-Type': 'application/json',
        ...(token && {
          Authorization: `Bearer ${token}`,
        }),
      };
    } catch (error) {
      console.error('Error getting headers:', error);
      return {
        'Content-Type': 'application/json',
      };
    }
  };

  // ================================
  // 1. GET RIDE OPTIONS (QUOTE)
  // ================================

  /**
   * Get all available vehicle options for selected pickup and drop location.
   *
   * @param pickup - Pickup location { latitude, longitude, address, googlePlaceId }
   * @param drop - Drop location { latitude, longitude, address, googlePlaceId }
   * @returns RideOptionsResponse with vehicle options
   *
   * @example
   * const options = await rideApi.getRideOptions(pickup, drop);
   * // options.data.options = [Mini, Sedan, SUV] with fare, ETA, polyline
   */
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
      const data = await fetchHandler(
        `${API_BASE_URL}${API_ENDPOINTS.RIDE_OPTIONS}`,
        {
          method: 'POST',
          headers: await this.getHeaders(),
          body: JSON.stringify({ pickup, drop }),
        },
      );

      return data || { success: false, message: 'Failed to get ride options' };
    } catch (error) {
      console.error('Get ride options API error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to get ride options',
      };
    }
  };

  // ================================
  // 2. CREATE BOOKING
  // ================================

  /**
   * Create a booking ONLY after customer presses Book button.
   * Uses quoteId from the options response.
   *
   * @param quoteId - Quote ID from getRideOptions response
   * @param paymentMethod - 'COC' (Cash on Completion) or 'ONLINE'
   * @returns BookingResponse with booking details
   *
   * @example
   * const booking = await rideApi.createBooking(selectedOption.quoteId, 'COC');
   * // booking.data.bookingId = "BOK123456"
   */
  // rideApi.ts - REPLACE createBooking method with this:

  createBooking = async (
    quoteId: string,
    paymentMethod: 'COC' | 'ONLINE' = 'COC',
  ): Promise<BookingResponse> => {
    if (!quoteId) {
      return {
        success: false,
        message: 'Quote ID is required',
      };
    }

    try {
      const data = await fetchHandler(
        `${API_BASE_URL}${API_ENDPOINTS.RIDE_BOOK}`,
        {
          method: 'POST',
          headers: await this.getHeaders(),
          body: JSON.stringify({ quoteId, paymentMethod }),
        },
      );

      return data || { success: false, message: 'Failed to create booking' };
    } catch (error) {
      console.error('Create booking API error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to create booking',
      };
    }
  };

  // ================================
  // 3. GET SEARCH STATUS
  // ================================

  /**
   * Get current search status for a booking.
   * Used primarily for reconnect scenarios, not for polling.
   *
   * @param bookingId - Booking ID
   * @returns SearchStatusResponse with search progress
   *
   * @example
   * const status = await rideApi.getSearchStatus('BOK123456');
   * // status.data.currentBatch = 2, status.data.driversFound = 3
   */
  getSearchStatus = async (
    bookingId: string,
  ): Promise<SearchStatusResponse> => {
    if (!bookingId) {
      return {
        success: false,
      };
    }

    try {
      const data = await fetchHandler(
        `${API_BASE_URL}${API_ENDPOINTS.RIDE_SEARCH_STATUS}/${bookingId}`,
        {
          method: 'GET',
          headers: await this.getHeaders(),
        },
      );

      return data || { success: false };
    } catch (error) {
      console.error('Get search status API error:', error);
      return {
        success: false,
      };
    }
  };

  // ================================
  // 4. RETRY SEARCH
  // ================================

  /**
   * Retry driver search with increased fare.
   * Continues from current batch (does NOT restart).
   *
   * @param bookingId - Booking ID
   * @returns RetryResponse with success status
   *
   * @example
   * const retry = await rideApi.retrySearch('BOK123456');
   * // retry.message = "Retry started with increased fare"
   */
  retrySearch = async (bookingId: string): Promise<RetryResponse> => {
    if (!bookingId) {
      return {
        success: false,
        message: 'Booking ID is required',
      };
    }

    try {
      const data = await fetchHandler(
        `${API_BASE_URL}${API_ENDPOINTS.RIDE_RETRY}/${bookingId}`,
        {
          method: 'POST',
          headers: await this.getHeaders(),
        },
      );

      return data || { success: false, message: 'Failed to retry search' };
    } catch (error) {
      console.error('Retry search API error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to retry search',
      };
    }
  };

  // ================================
  // 5. CANCEL BOOKING
  // ================================

  /**
   * Cancel an ongoing search or active ride.
   *
   * @param bookingId - Booking ID
   * @param cancelReason - Reason for cancellation (optional)
   * @returns CancelBookingResponse
   *
   * @example
   * const cancel = await rideApi.cancelBooking('BOK123456', 'Changed my mind');
   */
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
      const data = await fetchHandler(
        `${API_BASE_URL}${API_ENDPOINTS.RIDE_CANCEL}/${bookingId}`,
        {
          method: 'POST',
          headers: await this.getHeaders(),
          body: JSON.stringify({
            cancelReason: cancelReason || 'No reason provided',
          }),
        },
      );

      return data || { success: false, message: 'Failed to cancel booking' };
    } catch (error) {
      console.error('Cancel booking API error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to cancel booking',
      };
    }
  };

  // ================================
  // 6. GET BOOKING DETAILS
  // ================================

  /**
   * Get complete booking details.
   *
   * @param bookingId - Booking ID
   * @returns BookingDetailResponse with full booking data
   *
   * @example
   * const booking = await rideApi.getBooking('BOK123456');
   */
  getBooking = async (bookingId: string): Promise<BookingDetailResponse> => {
    if (!bookingId) {
      return {
        success: false,
        message: 'Booking ID is required',
      };
    }

    try {
      const data = await fetchHandler(
        `${API_BASE_URL}${API_ENDPOINTS.RIDE_BOOKING}/${bookingId}`,
        {
          method: 'GET',
          headers: await this.getHeaders(),
        },
      );

      return data || { success: false, message: 'Failed to get booking' };
    } catch (error) {
      console.error('Get booking API error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to get booking',
      };
    }
  };

  // ================================
  // 7. GET CUSTOMER BOOKINGS
  // ================================

  /**
   * Get all bookings for the authenticated customer.
   *
   * @returns Array of bookings
   *
   * @example
   * const bookings = await rideApi.getCustomerBookings();
   */
  getCustomerBookings = async (): Promise<any> => {
    try {
      const data = await fetchHandler(
        `${API_BASE_URL}${API_ENDPOINTS.RIDE_CUSTOMER_BOOKINGS}`,
        {
          method: 'GET',
          headers: await this.getHeaders(),
        },
      );

      return data || { success: false, data: [] };
    } catch (error) {
      console.error('Get customer bookings API error:', error);
      return { success: false, data: [] };
    }
  };

  // ================================
  // 8. GET DRIVER BOOKINGS
  // ================================

  /**
   * Get all bookings for the authenticated driver.
   *
   * @returns Array of bookings
   *
   * @example
   * const bookings = await rideApi.getDriverBookings();
   */
  getDriverBookings = async (): Promise<any> => {
    try {
      const data = await fetchHandler(
        `${API_BASE_URL}${API_ENDPOINTS.RIDE_DRIVER_BOOKINGS}`,
        {
          method: 'GET',
          headers: await this.getHeaders(),
        },
      );

      return data || { success: false, data: [] };
    } catch (error) {
      console.error('Get driver bookings API error:', error);
      return { success: false, data: [] };
    }
  };
}

// Export singleton instance
export const rideBooking = new RideBooking();
