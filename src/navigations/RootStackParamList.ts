export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  Profile: undefined;
  EditProfile: undefined;

  // Buyers Screens
  CustomerShop: undefined;
  Settings: undefined;
  ProductDetail: { productId: string };
  OrderSuccessScreen: undefined;
  YourOrders: undefined;
  CheckOutScreen: { productId: string; variantId?: string | null };
  CartScreen: undefined;
  OrderConfirmation: { checkoutSessionId: string };
  OrderTracking: { orderId: string };

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
  AirportLocationInput: {
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
  LocalRideLocationInput: {
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