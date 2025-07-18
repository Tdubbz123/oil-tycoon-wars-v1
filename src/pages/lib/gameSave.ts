import type { Well } from '../../Data/types';


export interface TruckUnit {
  id: string;
  name: string;
  wellsRepaired: number;
  kmDriven: number;
}

export interface GameState {
  coins: number;
  oil: number;
  playerLevel: number;
  ownedTrucks: string[];
  truckFleet: TruckUnit[];
  activeTruckName: string;
  wells: Well[];
  wellsVisited: string[];
  lastPlayed: string;
  xp: number;
  truckUpgrades: { [truckName: string]: number };
  mapSeed: string;
}

// Default state for new players
export const defaultGameState: GameState = {
  coins: 0,
  oil: 0,
  playerLevel: 1,
  ownedTrucks: [],
  truckFleet: [
    {
      id: 'TRUCK-1',
      name: 'Operator Pick-up Truck',
      wellsRepaired: 0,
      kmDriven: 0,
    },
  ],
  activeTruckName: 'Operator Pick-up Truck',
  truckUpgrades: {
    'Operator Pick-up Truck': 1,
    'Batch Truck': 0,
    'Mobile Repair Unit': 0,
    'Pressure Pump Truck': 0,
    'Steamer': 0,
    'Chemical Delivery Truck': 0,
    'Vacuum Truck': 0,
    'Water Truck': 0,
    'Trailer-Vac': 0,
    'Hot Shot Truck': 0,
    'Combo Unit': 0,
    'Flush-by': 0,
    'Rod Truck': 0,
    'Service Rig': 0,
  },
  wells: [],
  wellsVisited: [],
  lastPlayed: new Date().toISOString(),
  xp: 0,
  mapSeed: '',
};

// Save game state to localStorage
export const saveGameState = (state: GameState) => {
  localStorage.setItem('otw-save', JSON.stringify(state));
};

// Load game state from localStorage (or return default)
export const loadGameState = (): GameState => {
  const saved = localStorage.getItem('otw-save');
  if (saved) {
    try {
      return JSON.parse(saved) as GameState;
    } catch (err) {
      console.warn('Failed to parse game save. Resetting.');
    }
  }
  return defaultGameState;
};

// Optional reset function
export const resetGameState = () => {
  localStorage.removeItem('otw-save');
};
