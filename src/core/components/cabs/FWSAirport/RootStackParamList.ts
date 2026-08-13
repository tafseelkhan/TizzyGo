export type RootStackParamList = {
  // Cabs Screens
  CustomerCab: undefined;
  FWSRideOptions: undefined;
  FWSLocalRide: {
    pickup?: {
      latitude: number;
      longitude: number;
      address: string;
      googlePlaceId: string;
    };
    drop?: {
      latitude: number;
      longitude: number;
      address: string;
      googlePlaceId: string;
    };
    pickupText?: string;
    dropText?: string;
  };
  FWSAirport: {
    pickup?: {
      latitude: number;
      longitude: number;
      address: string;
      googlePlaceId: string;
    };
    drop?: {
      latitude: number;
      longitude: number;
      address: string;
      googlePlaceId: string;
    };
    pickupText?: string;
    dropText?: string;
    selectedOption?: string;
  };
  LocationInput: {
    pickupText?: string;
    dropText?: string;
    pickup?: {
      latitude: number;
      longitude: number;
      address: string;
      googlePlaceId: string;
    };
    drop?: {
      latitude: number;
      longitude: number;
      address: string;
      googlePlaceId: string;
    };
  };
  Tracking: { bookingId: string };
  RideSearch: {
    bookingId: string;
    pickup: {
      latitude: number;
      longitude: number;
      address: string;
    };
    drop: {
      latitude: number;
      longitude: number;
      address: string;
    };
    fare: number;
    rideType: string;
    customerId: string; // ✅ Add this
    polyline: string;
  };
};
