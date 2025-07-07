// 🌍 Oil classification


export const oilTypes = [
  'Brent Crude',
  'WTI',
  'Western Canadian Select',
  'Light Sweet',
  'Synthetic'
] as const;

export type OilType = typeof oilTypes[number];


// 🛢️ Oil well data structure
export interface Well {
  id: string;
  lat: number;
  lng: number;
  lsd: string;
  isBroken: boolean;
  barrelsPerDay: number;
  type: OilType;
}

