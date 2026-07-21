export const VEHICLE_CLASSES = [
  {
    id: 'economy',
    label: 'Economy',
    shortLabel: 'ECO',
    description: 'Budget-friendly rides for everyday travel',
    icon: 'car-hatchback',
    order: 0,
  },
  {
    id: 'standard',
    label: 'Standard',
    shortLabel: 'STD',
    description: 'Reliable rides for daily commute',
    icon: 'car',
    order: 1,
  },
  {
    id: 'comfort',
    label: 'Comfort',
    shortLabel: 'CMF',
    description: 'Extra space and premium comfort',
    icon: 'car-estate',
    order: 2,
  },
  {
    id: 'premium',
    label: 'Premium',
    shortLabel: 'PRM',
    description: 'Luxury vehicles with premium service',
    icon: 'car-sports',
    order: 3,
  },
  {
    id: 'luxury',
    label: 'Luxury',
    shortLabel: 'LUX',
    description: 'Ultimate luxury experience',
    icon: 'crown',
    order: 4,
  },
];

export const getRideIcon = (rideType: string): string => {
  const icons: Record<string, string> = {
    Basic: 'car',
    Go: 'car',
    Lite: 'moped',
    Mini: 'car-hatchback',
    Easy: 'car-side',
    Move: 'car-side',
    Smart: 'car',
    Core: 'car',
    Plus: 'car-estate',
    Gox: 'car-estate',
    Pro: 'car-sports',
    Prime: 'car-convertible',
    Ultra: 'car-sports',
    Comfort: 'car-estate',
    Premium: 'car-convertible',
    Luxury: 'crown',
    Elite: 'crown',
    One: 'car',
  };
  return icons[rideType] || 'car';
};
