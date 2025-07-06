export interface Truck {
  name: string;
  basePrice: number;
  role: 'transport' | 'repair' | 'drilling';
  stats?: {
    speed?: number; // km/h
    repairBoost?: number; // % faster
    range?: number; // km
  };
}

export const TruckData: Truck[] = [
  {
    name: 'Hot Shot Truck',
    basePrice: 100000,
    role: 'transport',
    stats: { speed: 120, range: 200 },
  },
  {
    name: 'Batch Truck',
    basePrice: 300000,
    role: 'transport',
    stats: { speed: 100, range: 250 },
  },
  {
    name: 'Steamer',
    basePrice: 500000,
    role: 'repair',
    stats: { repairBoost: 0.1 },
  },
  {
    name: 'Vac Truck',
    basePrice: 800000,
    role: 'repair',
    stats: { repairBoost: 0.15 },
  },
  {
    name: 'Trailer-Vac',
    basePrice: 1000000,
    role: 'repair',
    stats: { repairBoost: 0.2 },
  },
  {
    name: 'Combo Unit',
    basePrice: 1200000,
    role: 'repair',
    stats: { repairBoost: 0.25 },
  },
  {
    name: 'Flush-by',
    basePrice: 1500000,
    role: 'repair',
    stats: { repairBoost: 0.3 },
  },
  {
    name: 'Rod Truck',
    basePrice: 2000000,
    role: 'repair',
    stats: { repairBoost: 0.35 },
  },
  {
    name: 'Service Rig',
    basePrice: 5000000,
    role: 'drilling',
    stats: { repairBoost: 0.4 },
  },
  {
    name: 'Drilling Rig',
    basePrice: 10000000,
    role: 'drilling',
    stats: { repairBoost: 0.5 },
  },
];
