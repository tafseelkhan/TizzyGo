import { DriverResponse, RideTypeGroup } from '../../types/FWSLocalRideTypes';

export const formatDuration = (minutes: number): string => {
  if (!minutes) return '0 min';
  const rounded = Math.round(minutes);
  return `${rounded} min`;
};

export const formatDistance = (km: number): string => {
  if (!km) return '0 km';
  return `${km.toFixed(1)} km`;
};

export const formatPrice = (price: number): string => {
  if (!price) return '₹0';
  return `₹${Math.round(price)}`;
};

export const decodePolyline = (
  encoded: string,
): { latitude: number; longitude: number }[] => {
  if (!encoded) return [];
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let b: number;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
};

// Helper functions for vehicle fields
export const getRideTypeName = (group: RideTypeGroup): string =>
  group.rideType || 'Unknown';
export const getRideTypeFare = (group: RideTypeGroup): number =>
  group.estimatedFare || 0;
export const getRideTypeDescription = (group: RideTypeGroup): string =>
  group.description || '';
export const getFirstDriver = (group: RideTypeGroup): DriverResponse | null =>
  group.drivers?.[0] || null;
export const getDriverCount = (group: RideTypeGroup): number =>
  group.drivers?.length || 0;
export const getClosestDriverDistance = (
  group: RideTypeGroup,
): number | null => {
  if (!group.drivers || group.drivers.length === 0) return null;
  return group.drivers[0].distance || null;
};

export const getDriverMaxPassengers = (driver: DriverResponse): number =>
  driver.maxPassengers || 1;
export const getDriverHasAC = (driver: DriverResponse): boolean =>
  driver.hasAC || false;
export const getDriverLuggageCapacity = (driver: DriverResponse): number =>
  driver.luggageCapacity || 0;
export const getDriverHandBagCapacity = (driver: DriverResponse): number =>
  driver.handBagCapacity || 1;
export const getDriverSeatCapacity = (driver: DriverResponse): number =>
  driver.seatCapacity || 2;
export const getDriverPassengerCapacity = (driver: DriverResponse): number =>
  driver.passengerCapacity || 1;
export const getDriverBaseFare = (driver: DriverResponse): number =>
  driver.baseFare || 0;
export const getDriverClassFare = (driver: DriverResponse): number =>
  driver.classFare || 0;
export const getDriverVehicleType = (driver: DriverResponse): string =>
  driver.vehicleType || 'Bike';
export const getDriverManufacturingYear = (driver: DriverResponse): string => {
  return driver.manufacturingYear ? driver.manufacturingYear.toString() : 'N/A';
};
