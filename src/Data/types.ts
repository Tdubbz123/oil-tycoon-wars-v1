// 🌍 Oil classification


export const oilTypes = [
  'Brent Crude',
  'WTI',
  'Western Canadian Select',
  'Light Sweet',
  'Synthetic'
] as const;

export type OilType = typeof oilTypes[number];

export const breakdownEvents = [
  'Burnt belts',
  'High torque',
  'High temp',
  'Low amps',
  'Broken rods',
  'Power bump',
  'Plant ESD',
  'Presco',
] as const;
export type BreakdownEvent = typeof breakdownEvents[number];


// 🛢️ Oil well data structure
export interface Well {
  id: string;
  lat: number;
  lng: number;
  lsd: string;
  isBroken: boolean;
  barrelsPerDay: number;
  type: OilType;
  breakdownEvent?: BreakdownEvent;
}

