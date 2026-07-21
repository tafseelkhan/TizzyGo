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
};