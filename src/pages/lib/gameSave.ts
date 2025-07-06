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
  ownedTrucks: string[]; // still used for UI counting, optional
  truckFleet: TruckUnit[]; // new
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
      name: 'Batch Truck',
      wellsRepaired: 0,
      kmDriven: 0,
    },
  ],
  wellsVisited: [],
  lastPlayed: new Date().toISOString(),
  xp: 0,
  truckUpgrades: {
    'Operator Pick-up Truck': 0,
  },
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
