export interface Truck {
  name: string;
  basePrice: number;
  role: 'repair' | 'transport' | 'inspection';
  stats: {
    speed: number;         // affects travel/return time
    repairBoost: number;  // per upgrade level (e.g., 0.1 = +10%)
    baseReward: number;   // base coins earned per repair
    baseXp: number;       // base XP earned per repair
  };
}

export const TruckData: Truck[] = [
  {
    name: 'Operator Pick-up Truck',
    basePrice: 0,
    role: 'repair',
    stats: {
      speed: 80,
      repairBoost: 0.05,
      baseReward: 25,
      baseXp: 5,
    },
  },
  {
    name: 'Batch Truck',
    basePrice: 50000,
    role: 'repair',
    stats: {
      speed: 95,
      repairBoost: 0.08,
      baseReward: 45,
      baseXp: 15,
    },
  },
  {
    name: 'Mobile Repair Unit',
    basePrice: 125000,
    role: 'repair',
    stats: {
      speed: 110,
      repairBoost: 0.12,
      baseReward: 65,
      baseXp: 22,
    },
  },
  {
    name: 'Pressure Pump Truck',
    basePrice: 95000,
    role: 'repair',
    stats: {
      speed: 90,
      repairBoost: 0.09,
      baseReward: 40,
      baseXp: 25,
    },
  },
  {
    name: 'Steamer',
    basePrice: 500000,
    role: 'repair',
    stats: { 
      speed: 100,
      repairBoost: 0.1,
      baseReward: 75,
      baseXp: 35,
    },
  },
  {
    name: 'Chemical Delivery Truck',
    basePrice: 88000,
    role: 'repair',
    stats: {
      speed: 85,
      repairBoost: 0.07,
      baseReward: 35,
      baseXp: 7,
    },
  },
  {
    name: 'Vacuum Truck',
    basePrice: 72000,
    role: 'repair',
    stats: {
      speed: 75,
      repairBoost: 0.06,
      baseReward: 30,
      baseXp: 6,
    },
  },
  {
    name: 'Water Truck',
    basePrice: 67000,
    role: 'repair',
    stats: {
      speed: 70,
      repairBoost: 0.05,
      baseReward: 28,
      baseXp: 5,
    },
  },
  {
    name: 'Trailer-Vac',
    basePrice: 1000000,
    role: 'repair',
    stats: { 
      speed: 50,
      repairBoost: 0.2,
      baseReward: 220,
      baseXp: 75,
     },
  },
  {
    name: 'Hot Shot Truck',
    basePrice: 100000,
    role: 'transport',
    stats: {
      speed: 140,
      repairBoost: 0.03,
      baseReward: 18,
      baseXp: 3,
    },
  },
  {
    name: 'Combo Unit',
    basePrice: 1200000,
    role: 'repair',
    stats: { 
      speed: 150,
      repairBoost: 0.25,
      baseReward: 250,
      baseXp: 125,
     },
  },
  {
    name: 'Flush-by',
    basePrice: 1500000,
    role: 'repair',
    stats: { 
      speed: 80,
      repairBoost: 0.3,
      baseReward: 285,
      baseXp: 170,
     },
  },
  {
    name: 'Gripper Unit',
    basePrice: 1750000,
    role: 'repair',
    stats: {
      speed: 120,
      repairBoost: 0.45,
      baseReward: 250,
      baseXp: 240,
    }
  },
  {
    name: 'Rod Truck',
    basePrice: 2000000,
    role: 'repair',
    stats: { 
      speed: 120,
      repairBoost: 0.35,
      baseReward: 340,
      baseXp: 225,
     },
  },
  {
    name: 'Service Rig',
    basePrice: 5000000,
    role: 'repair',
    stats: { 
      speed: 50,
      repairBoost: 0.4,
      baseReward: 1000,
      baseXp: 550, },
  },
];
