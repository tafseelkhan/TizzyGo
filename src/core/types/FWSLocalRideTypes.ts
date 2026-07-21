export interface Suggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  latitude: number;
  longitude: number;
}

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface DriverResponse {
  driverId: string;
  driverCode: string;
  vehicle: string;
  vehicleClass: string;
  vehicleNumber: string;
  vehicleColor: string;
  latestLatitude: number;
  latestLongitude: number;
  heading: number;
  speed: number;
  distance: number;
  isOnline: boolean;
  isAvailable: boolean;
  isTrackingOn: boolean;
  maxPassengers: number;
  hasAC: boolean;
  luggageCapacity: number;
  handBagCapacity: number;
  seatCapacity: number;
  passengerCapacity: number;
  baseFare: number;
  classFare: number;
  vehicleType: string;
  manufacturingYear?: number;
}

export interface RideTypeGroup {
  rideType: string;
  estimatedFare: number;
  description: string;
  pickupToDropPolyline: string;
  roadDistanceKm: number;
  trafficDurationMinutes: number;
  drivers: DriverResponse[];
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  googlePlaceId: string;
}
