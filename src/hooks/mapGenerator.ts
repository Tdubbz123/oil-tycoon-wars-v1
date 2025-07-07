import { v4 as uuid } from 'uuid';
import { oilTypes, type OilType, type Well } from '../Data/types';
import { saveGameState } from '../pages/lib/gameSave';

const LLOYDMINSTER_COORDS: [number, number] = [53.2762, -110.0054];
const RADIUS_KM = 25;

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function offsetCoords([baseLat, baseLng]: [number, number]): [number, number] {
  const dx = randomInRange(-RADIUS_KM, RADIUS_KM) / 111; // ~111 km per latitude
  const dy = randomInRange(-RADIUS_KM, RADIUS_KM) / (111 * Math.cos(baseLat * Math.PI / 180));
  return [baseLat + dx, baseLng + dy];
}

function generateLSD(): string {
  const b = Math.floor(Math.random() * 16) + 1;
  const s = Math.floor(Math.random() * 36) + 1;
  const t = Math.floor(Math.random() * 60) + 1;
  const r = Math.floor(Math.random() * 30) + 1;
  return `${b}-${s}-${t}-${r}W3`;
}

export function generateMapWells(count = 20): Well[] {
  const wells: Well[] = [];

  for (let i = 0; i < count; i++) {
    const [lat, lng] = offsetCoords(LLOYDMINSTER_COORDS);
    const randomType: OilType = oilTypes[Math.floor(Math.random() * oilTypes.length)];
    wells.push({
      id: uuid(),
      lat,
      lng,
      lsd: generateLSD(),
      isBroken: false,
      barrelsPerDay: Math.floor(Math.random() * 300) + 50,
      type: randomType,
    });
  }

  // Save to localStorage
  const state = JSON.parse(localStorage.getItem('otw-save') || '{}');
  const updated = { ...state, wells };
  saveGameState(updated);

  console.log('✅ Wells generated:', wells);
  return wells;
}
